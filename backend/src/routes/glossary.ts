import { z } from 'zod';
import { router, publicProcedure } from '../lib/trpc.js';
import { db } from '../db/client.js';
import { glossaries } from '../db/schema.js';
import { eq, and, or, like, desc } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

/**
 * Schemas de validação Zod
 */

// Schema para listagem
const listInputSchema = z.object({
  transcriptionId: z.number().int().positive().optional(),
  globalOnly: z.boolean().default(false),
});

// Schema para criar termo
const createInputSchema = z.object({
  name: z.string()
    .min(1, 'Nome é obrigatório')
    .max(255, 'Nome muito longo'),
  info: z.string()
    .max(255, 'Informação muito longa')
    .optional(),
  transcriptionId: z.number().int().positive().optional(),
  isGlobal: z.boolean().default(false),
});

// Schema para importar múltiplos termos
const importInputSchema = z.object({
  terms: z.array(
    z.object({
      name: z.string().min(1).max(255),
      info: z.string().max(255).optional(),
    })
  ).min(1, 'Lista de termos vazia'),
  transcriptionId: z.number().int().positive().optional(),
  isGlobal: z.boolean().default(false),
});

/**
 * Router de glossário
 */
export const glossaryRouter = router({
  /**
   * 1. LIST - Listar termos do glossário
   * Pode filtrar por transcrição específica ou listar apenas globais
   */
  list: publicProcedure
    .input(listInputSchema)
    .query(async ({ input }) => {
      try {
        const { transcriptionId, globalOnly } = input;

        // Construir condições de filtro
        const conditions = [];

        if (globalOnly) {
          conditions.push(eq(glossaries.isGlobal, true));
        } else if (transcriptionId) {
          // Buscar termos da transcrição + globais
          conditions.push(
            or(
              eq(glossaries.transcriptionId, transcriptionId),
              eq(glossaries.isGlobal, true)
            )
          );
        }

        const whereClause = conditions.length > 0
          ? and(...conditions)
          : undefined;

        // Buscar termos ordenados por nome
        const items = await db
          .select()
          .from(glossaries)
          .where(whereClause)
          .orderBy(glossaries.name);

        return items;
      } catch (error) {
        console.error('[tRPC] Erro ao listar glossário:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao listar glossário',
          cause: error,
        });
      }
    }),

  /**
   * 2. CREATE - Criar termo no glossário
   */
  create: publicProcedure
    .input(createInputSchema)
    .mutation(async ({ input }) => {
      try {
        const { name, info, transcriptionId, isGlobal } = input;

        // Validar: se não é global, precisa ter transcriptionId
        if (!isGlobal && !transcriptionId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Termo não global precisa estar vinculado a uma transcrição',
          });
        }

        // Verificar se termo já existe (mesmo nome + mesma transcrição/global)
        const conditions = [like(glossaries.name, name)];

        if (isGlobal) {
          conditions.push(eq(glossaries.isGlobal, true));
        } else if (transcriptionId) {
          conditions.push(eq(glossaries.transcriptionId, transcriptionId));
        }

        const [existing] = await db
          .select()
          .from(glossaries)
          .where(and(...conditions))
          .limit(1);

        if (existing) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Termo já existe no glossário',
          });
        }

        // Criar termo
        const result = await db
          .insert(glossaries)
          .values({
            name,
            info: info || null,
            transcriptionId: transcriptionId || null,
            isGlobal,
          } as any);

        const glossaryId = Number((result as any).insertId);

        // Buscar termo criado
        const [created] = await db
          .select()
          .from(glossaries)
          .where(eq(glossaries.id, glossaryId))
          .limit(1);

        return created;
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        console.error('[tRPC] Erro ao criar termo no glossário:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao criar termo no glossário',
          cause: error,
        });
      }
    }),

  /**
   * 3. DELETE - Deletar termo do glossário
   */
  delete: publicProcedure
    .input(z.number().int().positive())
    .mutation(async ({ input: id }) => {
      try {
        // Verificar se termo existe
        const [existing] = await db
          .select()
          .from(glossaries)
          .where(eq(glossaries.id, id))
          .limit(1);

        if (!existing) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: `Termo ${id} não encontrado no glossário`,
          });
        }

        // Deletar termo
        await db
          .delete(glossaries)
          .where(eq(glossaries.id, id));

        return {
          success: true,
          id,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        console.error('[tRPC] Erro ao deletar termo do glossário:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao deletar termo do glossário',
          cause: error,
        });
      }
    }),

  /**
   * 4. IMPORT - Importar múltiplos termos de uma vez
   */
  import: publicProcedure
    .input(importInputSchema)
    .mutation(async ({ input }) => {
      try {
        const { terms, transcriptionId, isGlobal } = input;

        // Validar: se não é global, precisa ter transcriptionId
        if (!isGlobal && !transcriptionId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Termos não globais precisam estar vinculados a uma transcrição',
          });
        }

        // Preparar valores para inserção
        const values = terms.map(term => ({
          name: term.name,
          info: term.info || null,
          transcriptionId: transcriptionId || null,
          isGlobal,
        }));

        // Inserir todos os termos
        await db
          .insert(glossaries)
          .values(values as any);

        return {
          success: true,
          count: terms.length,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        console.error('[tRPC] Erro ao importar termos do glossário:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao importar termos do glossário',
          cause: error,
        });
      }
    }),
});
