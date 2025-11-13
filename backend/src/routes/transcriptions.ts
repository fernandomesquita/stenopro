import { z } from 'zod';
import { router, publicProcedure } from '../lib/trpc.js';
import { db } from '../db/client.js';
import { transcriptions, type NewTranscription } from '../db/schema.js';
import { eq, and, or, like, desc, asc, count, sql } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { storageService } from '../services/storage.service.js';
import { processingService } from '../services/processing.service.js';

/**
 * Schemas de validação Zod
 */

// Schema para listagem com paginação e filtros
const listInputSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  status: z.enum([
    'uploading',
    'transcribing',
    'correcting',
    'ready',
    'archived',
    'error'
  ]).optional(),
  room: z.string().max(100).optional(),
  search: z.string().max(255).optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'title']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Schema para criar transcrição
const createInputSchema = z.object({
  title: z.string()
    .min(1, 'Título é obrigatório')
    .max(255, 'Título muito longo'),
  room: z.string()
    .max(100, 'Nome da sala muito longo')
    .optional(),
  audioFile: z.object({
    buffer: z.string(), // Base64 encoded
    filename: z.string(),
    mimetype: z.string(),
  }),
});

// Schema para atualizar transcrição
const updateInputSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().max(255).optional(),
  room: z.string().max(100).optional(),
  transcriptionText: z.string().optional(),
  finalText: z.string().optional(),
});

/**
 * Router de transcrições
 */
export const transcriptionsRouter = router({
  /**
   * 1. LIST - Listar transcrições com paginação, filtros e ordenação
   */
  list: publicProcedure
    .input(listInputSchema)
    .query(async ({ input }) => {
      try {
        const { page, limit, status, room, search, sortBy, sortOrder } = input;
        const offset = (page - 1) * limit;

        // Construir condições de filtro
        const conditions = [];

        if (status) {
          conditions.push(eq(transcriptions.status, status));
        }

        if (room) {
          conditions.push(eq(transcriptions.room, room));
        }

        if (search) {
          conditions.push(
            or(
              like(transcriptions.title, `%${search}%`),
              like(transcriptions.finalText, `%${search}%`),
            )
          );
        }

        // Construir query base
        const whereClause = conditions.length > 0
          ? and(...conditions)
          : undefined;

        // Determinar ordenação
        const orderByClause = sortOrder === 'desc'
          ? desc(transcriptions[sortBy])
          : asc(transcriptions[sortBy]);

        // Buscar transcrições
        const items = await db
          .select()
          .from(transcriptions)
          .where(whereClause)
          .orderBy(orderByClause)
          .limit(limit)
          .offset(offset);

        // Contar total
        const [{ total }] = await db
          .select({ total: count() })
          .from(transcriptions)
          .where(whereClause);

        // Calcular metadados de paginação
        const totalPages = Math.ceil(total / limit);
        const hasNext = page < totalPages;
        const hasPrev = page > 1;

        return {
          items,
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext,
            hasPrev,
          },
        };
      } catch (error) {
        console.error('[tRPC] Erro ao listar transcrições:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao listar transcrições',
          cause: error,
        });
      }
    }),

  /**
   * 2. GET BY ID - Buscar transcrição por ID
   */
  getById: publicProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ input }) => {
      try {
        const { id } = input;

        const [transcription] = await db
          .select()
          .from(transcriptions)
          .where(eq(transcriptions.id, id))
          .limit(1);

        if (!transcription) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: `Transcrição ${id} não encontrada`,
          });
        }

        // Retornar com transcriptionText como alias para finalText
        return {
          ...transcription,
          transcriptionText: transcription.finalText,
          audioDuration: transcription.durationSeconds,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        console.error('[tRPC] Erro ao buscar transcrição:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao buscar transcrição',
          cause: error,
        });
      }
    }),

  /**
   * 3. CREATE - Upload de áudio + criar transcrição + iniciar processamento
   */
  create: publicProcedure
    .input(createInputSchema)
    .mutation(async ({ input }) => {
      try {
        const { title, room, audioFile } = input;

        // Validar tipo de arquivo
        const allowedMimeTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg'];
        if (!allowedMimeTypes.includes(audioFile.mimetype)) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Formato de áudio não suportado. Use MP3, WAV ou OGG.',
          });
        }

        // Decodificar buffer base64
        const buffer = Buffer.from(audioFile.buffer, 'base64');

        // Validar tamanho (max 100MB)
        const maxSize = 100 * 1024 * 1024; // 100MB
        if (buffer.length > maxSize) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Arquivo muito grande. Tamanho máximo: 100MB',
          });
        }

        // Salvar arquivo no storage
        const { url, filename } = await storageService.saveAudio(
          buffer,
          audioFile.filename
        );

        // Criar registro no banco
        const result = await db
          .insert(transcriptions)
          .values({
            userId: 1, // MVP: usuário hardcoded
            title,
            room: room || null,
            audioUrl: url,
            audioFilename: filename,
            status: 'uploading',
            processingStartedAt: new Date(),
          } as any);

        const transcriptionId = Number((result as any).insertId);

        // Iniciar processamento em background (não aguardar)
        processingService
          .processTranscription(transcriptionId)
          .catch((error) => {
            console.error(
              `[tRPC] Erro no processamento da transcrição ${transcriptionId}:`,
              error
            );
          });

        // Buscar transcrição criada
        const [created] = await db
          .select()
          .from(transcriptions)
          .where(eq(transcriptions.id, transcriptionId))
          .limit(1);

        return created;
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        console.error('[tRPC] Erro ao criar transcrição:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao criar transcrição',
          cause: error,
        });
      }
    }),

  /**
   * 4. UPDATE - Atualizar transcrição (título, sala, texto)
   */
  update: publicProcedure
    .input(updateInputSchema)
    .mutation(async ({ input }) => {
      try {
        const { id, title, room, transcriptionText, finalText } = input;

        // Verificar se transcrição existe
        const [existing] = await db
          .select()
          .from(transcriptions)
          .where(eq(transcriptions.id, id))
          .limit(1);

        if (!existing) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: `Transcrição ${id} não encontrada`,
          });
        }

        // Construir objeto de atualização apenas com campos fornecidos
        const updateData: any = {};
        if (title !== undefined) updateData.title = title;
        if (room !== undefined) updateData.room = room;
        if (transcriptionText !== undefined) updateData.finalText = transcriptionText;
        if (finalText !== undefined) updateData.finalText = finalText;

        // Atualizar apenas se houver dados
        if (Object.keys(updateData).length > 0) {
          await db
            .update(transcriptions)
            .set(updateData)
            .where(eq(transcriptions.id, id));
        }

        // Buscar transcrição atualizada
        const [updated] = await db
          .select()
          .from(transcriptions)
          .where(eq(transcriptions.id, id))
          .limit(1);

        return updated;
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        console.error('[tRPC] Erro ao atualizar transcrição:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao atualizar transcrição',
          cause: error,
        });
      }
    }),

  /**
   * 5. REPROCESS - Reprocessar transcrição (útil em caso de erro)
   */
  reprocess: publicProcedure
    .input(z.number().int().positive())
    .mutation(async ({ input: id }) => {
      try {
        // Verificar se transcrição existe
        const [existing] = await db
          .select()
          .from(transcriptions)
          .where(eq(transcriptions.id, id))
          .limit(1);

        if (!existing) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: `Transcrição ${id} não encontrada`,
          });
        }

        // Verificar se arquivo de áudio ainda existe
        const fileExists = await storageService.fileExists(existing.audioFilename);
        if (!fileExists) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Arquivo de áudio não encontrado. Não é possível reprocessar.',
          });
        }

        // Reprocessar
        await processingService.reprocessTranscription(id);

        // Buscar transcrição atualizada
        const [updated] = await db
          .select()
          .from(transcriptions)
          .where(eq(transcriptions.id, id))
          .limit(1);

        return updated;
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        console.error('[tRPC] Erro ao reprocessar transcrição:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao reprocessar transcrição',
          cause: error,
        });
      }
    }),
});
