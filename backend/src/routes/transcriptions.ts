import { z } from 'zod';
import { router, publicProcedure } from '../lib/trpc.js';
import { db } from '../db/client.js';
import { transcriptions, promptTemplates } from '../db/schema.js';
import { eq, and, or, like, desc, asc, count } from 'drizzle-orm';
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
  customPromptId: z.number().int().positive().optional(),
});

// Schema para atualizar transcrição
const updateInputSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().max(255).optional(),
  room: z.string().max(100).optional(),
  transcriptionText: z.string().optional(),
  finalText: z.string().optional(),
  customPrompt: z.string().nullable().optional(),
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
        console.log('[tRPC CREATE] 🚀 Iniciando criação de transcrição');
        const { title, room, audioFile, customPromptId } = input;

        console.log('[tRPC CREATE] 📋 Dados recebidos:', {
          title,
          room: room || 'N/A',
          filename: audioFile.filename,
          mimetype: audioFile.mimetype,
          bufferSize: audioFile.buffer?.length || 0,
          customPromptId: customPromptId || 'Nenhum',
        });

        console.log('[tRPC CREATE] 🎯 Prompt ID recebido:', customPromptId);

        // Buscar texto do prompt se foi especificado
        let customPromptText: string | undefined;
        if (customPromptId) {
          const [prompt] = await db.select()
            .from(promptTemplates)
            .where(eq(promptTemplates.id, customPromptId))
            .limit(1);

          if (prompt) {
            customPromptText = prompt.promptText;
            console.log('[tRPC CREATE] ✅ Prompt carregado:', prompt.name);
            console.log('[tRPC CREATE] Prompt texto length:', customPromptText.length);
            console.log('[tRPC CREATE] Prompt preview:', customPromptText.substring(0, 200));
          } else {
            console.log('[tRPC CREATE] ⚠️ Prompt ID não encontrado:', customPromptId);
          }
        }

        // Validar que audioFile.buffer existe
        if (!audioFile.buffer || audioFile.buffer.length === 0) {
          console.error('[tRPC CREATE] ❌ Buffer de áudio vazio ou ausente');
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Dados de áudio ausentes ou inválidos',
          });
        }

        // Validar tipo de arquivo
        const allowedMimeTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg'];
        if (!allowedMimeTypes.includes(audioFile.mimetype)) {
          console.error('[tRPC CREATE] ❌ Tipo de arquivo não suportado:', audioFile.mimetype);
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Formato de áudio não suportado. Use MP3, WAV ou OGG.',
          });
        }

        console.log('[tRPC CREATE] ✅ Validações iniciais OK');

        // Decodificar buffer base64
        console.log('[tRPC CREATE] 🔄 Decodificando base64...');
        let buffer: Buffer;
        try {
          buffer = Buffer.from(audioFile.buffer, 'base64');
          console.log('[tRPC CREATE] ✅ Base64 decodificado:', buffer.length, 'bytes');
        } catch (err: any) {
          console.error('[tRPC CREATE] ❌ Erro ao decodificar base64:', err.message);
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Erro ao processar dados do áudio',
          });
        }

        // Validar tamanho (max 100MB)
        const maxSize = 100 * 1024 * 1024; // 100MB
        if (buffer.length > maxSize) {
          console.error('[tRPC CREATE] ❌ Arquivo muito grande:', buffer.length, 'bytes');
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Arquivo muito grande. Tamanho máximo: 100MB',
          });
        }

        // Salvar arquivo no storage
        console.log('[tRPC CREATE] 💾 Salvando arquivo no storage...');
        let storageResult;
        try {
          storageResult = await storageService.saveAudio(buffer, audioFile.filename);
          console.log('[tRPC CREATE] ✅ Arquivo salvo:', storageResult.filename);
        } catch (err: any) {
          console.error('[tRPC CREATE] ❌ Erro no storage:', err.message);
          console.error('[tRPC CREATE] Stack:', err.stack);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Erro ao salvar arquivo: ${err.message}`,
          });
        }

        const { url, filename } = storageResult;

        // Usar caminho relativo ao invés de URL completa
        const relativePath = `/uploads/${filename}`;
        console.log('[tRPC CREATE] 📁 Caminho relativo do áudio:', relativePath);

        // Criar registro no banco
        console.log('[tRPC CREATE] 💾 Inserindo no banco de dados...');
        let transcriptionId: number;
        try {
          const result = await db
            .insert(transcriptions)
            .values({
              userId: 1, // MVP: usuário hardcoded
              title,
              room: room || null,
              audioUrl: relativePath, // Caminho relativo '/uploads/...'
              audioFilename: filename,
              status: 'uploading',
              progressMessage: 'Enviando áudio...',
              progressPercent: 0,
              processingStartedAt: new Date(),
              customPrompt: customPromptText || null,
            } as any);

          console.log('[tRPC CREATE] ✅ Registro inserido no banco');

          // DEBUG: Inspecionar estrutura do result
          console.log('[tRPC CREATE] 🔍 DEBUG - Tipo do result:', typeof result);
          console.log('[tRPC CREATE] 🔍 DEBUG - Keys do result:', Object.keys(result || {}));
          console.log('[tRPC CREATE] 🔍 DEBUG - result completo:', JSON.stringify(result, null, 2));

          // Tentar obter ID de várias formas possíveis no Drizzle + MySQL
          const possibleId = (result as any).insertId
            || (result as any)[0]?.insertId
            || (result as any).lastInsertRowid
            || (result as any)[0]?.id;

          console.log('[tRPC CREATE] 🔍 DEBUG - ID encontrado:', possibleId);

          transcriptionId = Number(possibleId);

          if (!transcriptionId || isNaN(transcriptionId)) {
            console.error('[tRPC CREATE] ❌ Falha ao obter ID após todas as tentativas');
            console.error('[tRPC CREATE] 📋 Valor final de transcriptionId:', transcriptionId);
            throw new Error('Failed to get auto-increment ID from database insert');
          }

          console.log('[tRPC CREATE] 🆔 ID da transcrição criada:', transcriptionId);
        } catch (err: any) {
          console.error('[tRPC CREATE] ❌ Erro ao inserir no banco:', err.message);
          console.error('[tRPC CREATE] Stack:', err.stack);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Erro ao criar registro: ${err.message}`,
          });
        }

        // Iniciar processamento em background (não aguardar)
        console.log('[tRPC CREATE] 🚀 Iniciando processamento em background...');
        processingService
          .processTranscription(transcriptionId)
          .catch((error) => {
            console.error(
              `[tRPC] ❌ Erro no processamento da transcrição ${transcriptionId}:`,
              error
            );
          });

        // Buscar transcrição criada
        console.log('[tRPC CREATE] 🔍 Buscando transcrição criada...');
        const [created] = await db
          .select()
          .from(transcriptions)
          .where(eq(transcriptions.id, transcriptionId))
          .limit(1);

        if (!created) {
          console.error('[tRPC CREATE] ❌ Transcrição não encontrada após criação');
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Erro ao buscar transcrição criada',
          });
        }

        console.log('[tRPC CREATE] ✅ Transcrição criada com sucesso:', transcriptionId);
        return created;
      } catch (error: any) {
        if (error instanceof TRPCError) throw error;

        console.error('[tRPC CREATE] ❌ Erro não tratado:', error?.message || error);
        console.error('[tRPC CREATE] 📋 Stack completo:', error?.stack);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Erro ao criar transcrição: ${error?.message || 'Erro desconhecido'}`,
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
        const { id, title, room, transcriptionText, finalText, customPrompt } = input;

        console.group('=== BACKEND UPDATE ===');
        console.log('🟢 Timestamp:', new Date().toISOString());
        console.log('🟢 Received ID:', id);
        console.log('🟢 Has title?', !!title);
        console.log('🟢 Has room?', !!room);
        console.log('🟢 Has finalText?', !!finalText);
        console.log('🟢 FinalText length:', finalText?.length || 0);
        console.log('🟢 FinalText preview:', finalText?.substring(0, 300));
        console.groupEnd();

        // Verificar se transcrição existe
        const [existing] = await db
          .select()
          .from(transcriptions)
          .where(eq(transcriptions.id, id))
          .limit(1);

        if (!existing) {
          console.error('[Update] ❌ Transcrição não encontrada:', id);
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: `Transcrição ${id} não encontrada`,
          });
        }

        // Construir objeto de atualização apenas com campos fornecidos
        const updateData: any = {
          updatedAt: new Date(),
        };

        if (title !== undefined) {
          updateData.title = title;
          console.log('🟢 Updating title');
        }
        if (room !== undefined) {
          updateData.room = room;
          console.log('🟢 Updating room');
        }
        if (transcriptionText !== undefined) {
          updateData.finalText = transcriptionText;
          console.log('🟢 Updating finalText from transcriptionText');
        }
        if (finalText !== undefined) {
          updateData.finalText = finalText;
          console.log('🟢 Updating finalText, length:', finalText.length);
        }
        if (customPrompt !== undefined) {
          updateData.customPrompt = customPrompt;
          console.log('🟢 Updating customPrompt');
        }

        console.log('🟢 Update data keys:', Object.keys(updateData));

        // Atualizar apenas se houver dados
        if (Object.keys(updateData).length > 1) { // >1 porque sempre tem updatedAt
          const result = await db
            .update(transcriptions)
            .set(updateData)
            .where(eq(transcriptions.id, id));

          console.group('✅ UPDATE EXECUTED');
          console.log('Result:', result);
          console.log('Affected rows:', (result as any)?.[0]?.affectedRows);
          console.log('Changed rows:', (result as any)?.[0]?.changedRows);
          console.groupEnd();
        }

        // VERIFICAÇÃO: Ler do banco
        console.log('🔍 Verificando se salvou no banco...');
        const [verification] = await db
          .select({
            id: transcriptions.id,
            finalText: transcriptions.finalText,
            correctedText: transcriptions.correctedText,
            updatedAt: transcriptions.updatedAt,
          })
          .from(transcriptions)
          .where(eq(transcriptions.id, id))
          .limit(1);

        console.group('🔍 VERIFICATION');
        console.log('Found record?', !!verification);
        console.log('ID:', verification?.id);
        console.log('finalText length:', verification?.finalText?.length || 0);
        console.log('finalText preview:', verification?.finalText?.substring(0, 200));
        console.log('updatedAt:', verification?.updatedAt);
        console.groupEnd();

        // Buscar transcrição atualizada completa
        const [updated] = await db
          .select()
          .from(transcriptions)
          .where(eq(transcriptions.id, id))
          .limit(1);

        return {
          ...updated,
          savedLength: verification?.finalText?.length || 0,
        };
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
        console.log(`[tRPC REPROCESS] 🔄 Iniciando reprocessamento da transcrição ${id}`);

        // Verificar se transcrição existe
        const [existing] = await db
          .select()
          .from(transcriptions)
          .where(eq(transcriptions.id, id))
          .limit(1);

        if (!existing) {
          console.error(`[tRPC REPROCESS] ❌ Transcrição ${id} não encontrada`);
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: `Transcrição ${id} não encontrada`,
          });
        }

        console.log(`[tRPC REPROCESS] ✅ Transcrição encontrada: "${existing.title}"`);

        // Verificar se arquivo de áudio ainda existe
        console.log(`[tRPC REPROCESS] 🔍 Verificando existência do arquivo: ${existing.audioFilename}`);
        const fileExists = await storageService.fileExists(existing.audioFilename);
        if (!fileExists) {
          console.error(`[tRPC REPROCESS] ❌ Arquivo de áudio não encontrado: ${existing.audioFilename}`);
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Arquivo de áudio não encontrado. Não é possível reprocessar.',
          });
        }

        console.log(`[tRPC REPROCESS] ✅ Arquivo de áudio existe, iniciando reprocessamento...`);

        // Reprocessar
        await processingService.reprocessTranscription(id);

        // Buscar transcrição atualizada
        const [updated] = await db
          .select()
          .from(transcriptions)
          .where(eq(transcriptions.id, id))
          .limit(1);

        console.log(`[tRPC REPROCESS] ✅ Reprocessamento iniciado com sucesso`);

        return updated;
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        console.error('[tRPC REPROCESS] ❌ Erro ao reprocessar transcrição:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao reprocessar transcrição',
          cause: error,
        });
      }
    }),

  /**
   * 6. DELETE - Deletar transcrição
   */
  delete: publicProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      try {
        const { id } = input;
        console.log(`[tRPC DELETE] 🗑️ Deletando transcrição ${id}`);

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

        // Deletar arquivo de áudio do storage
        if (existing.audioFilename) {
          console.log(`[tRPC DELETE] 🗑️ Deletando arquivo: ${existing.audioFilename}`);
          await storageService.deleteAudio(existing.audioFilename);
        }

        // Deletar registro do banco
        console.log(`[tRPC DELETE] 💾 Deletando registro do banco`);
        await db
          .delete(transcriptions)
          .where(eq(transcriptions.id, id));

        console.log(`[tRPC DELETE] ✅ Transcrição ${id} deletada com sucesso`);
        return { success: true, id };
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        console.error('[tRPC] Erro ao deletar transcrição:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao deletar transcrição',
          cause: error,
        });
      }
    }),
});
