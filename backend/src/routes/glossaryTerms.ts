import { z } from 'zod';
import { router, publicProcedure } from '../lib/trpc.js';
import { db } from '../db/client.js';
import { glossaryTerms } from '../db/schema.js';
import { eq, and, or, sql } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

/**
 * Schemas de validação Zod
 */

// Schema para listagem
const listInputSchema = z.object({
  type: z.enum(['deputy', 'term']).optional(),
});

// Schema para criar termo
const createInputSchema = z.object({
  type: z.enum(['deputy', 'term']),
  term: z.string().min(1, 'Termo é obrigatório').max(255),
  correctSpelling: z.string().min(1, 'Grafia correta é obrigatória').max(255),
  notes: z.string().optional(),
});

// Schema para atualizar termo
const updateInputSchema = z.object({
  id: z.number().int().positive(),
  term: z.string().min(1).max(255).optional(),
  correctSpelling: z.string().min(1).max(255).optional(),
  notes: z.string().nullable().optional(),
});

// Schema para upload em batch
const uploadBatchInputSchema = z.object({
  type: z.enum(['deputy', 'term']),
  items: z.array(
    z.object({
      term: z.string().min(1).max(255),
      correctSpelling: z.string().min(1).max(255),
    })
  ).min(1, 'Lista vazia'),
});

/**
 * Router de termos do glossário
 */
export const glossaryTermsRouter = router({
  /**
   * 1. LIST - Listar termos do glossário
   */
  list: publicProcedure
    .input(listInputSchema)
    .query(async ({ input }) => {
      try {
        console.log('[GlossaryTerms] 📋 Listando termos, type:', input.type || 'all');

        const whereClause = input.type
          ? eq(glossaryTerms.type, input.type)
          : undefined;

        const items = await db
          .select()
          .from(glossaryTerms)
          .where(whereClause)
          .orderBy(glossaryTerms.term);

        console.log('[GlossaryTerms] ✅ Encontrados', items.length, 'termos');
        return items;
      } catch (error: any) {
        console.error('[GlossaryTerms] ❌ Erro ao listar:', error.message);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao listar termos do glossário',
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
      console.group('[GlossaryTerms] === CRIAR TERMO ===');
      console.log('Type:', input.type);
      console.log('Term:', input.term);
      console.log('CorrectSpelling:', input.correctSpelling);
      console.groupEnd();

      try {
        const termLower = input.term.toLowerCase().trim();
        console.log('[GlossaryTerms] Verificando duplicados para:', termLower);

        // Verificar duplicados - query case-insensitive
        const existing = await db
          .select()
          .from(glossaryTerms)
          .where(
            sql`type = ${input.type} AND LOWER(term) = ${termLower}`
          )
          .limit(1);

        if (existing.length > 0) {
          console.warn('[GlossaryTerms] ⚠️ Termo já existe');
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Este termo já existe no glossário',
          });
        }

        console.log('[GlossaryTerms] ✅ Termo não existe, inserindo...');

        // Inserir
        const result = await db
          .insert(glossaryTerms)
          .values({
            type: input.type,
            term: termLower,
            correctSpelling: input.correctSpelling.trim(),
            notes: input.notes?.trim() || null,
          } as any);

        const termId = Number((result as any).insertId);

        const [created] = await db
          .select()
          .from(glossaryTerms)
          .where(eq(glossaryTerms.id, termId))
          .limit(1);

        console.log('[GlossaryTerms] ✅ Termo criado, ID:', termId);
        return created;
      } catch (error: any) {
        console.error('[GlossaryTerms] ❌ ERRO:', error.message);

        if (error instanceof TRPCError) throw error;

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao criar termo: ' + error.message,
        });
      }
    }),

  /**
   * 3. UPDATE - Atualizar termo
   */
  update: publicProcedure
    .input(updateInputSchema)
    .mutation(async ({ input }) => {
      try {
        const { id, ...updates } = input;
        console.log('[GlossaryTerms] 📝 Atualizando termo:', id);

        // Verificar se existe
        const [existing] = await db
          .select()
          .from(glossaryTerms)
          .where(eq(glossaryTerms.id, id))
          .limit(1);

        if (!existing) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: `Termo ${id} não encontrado`,
          });
        }

        // Construir update data
        const updateData: any = { updatedAt: new Date() };
        if (updates.term !== undefined) updateData.term = updates.term;
        if (updates.correctSpelling !== undefined) updateData.correctSpelling = updates.correctSpelling;
        if (updates.notes !== undefined) updateData.notes = updates.notes;

        await db
          .update(glossaryTerms)
          .set(updateData)
          .where(eq(glossaryTerms.id, id));

        const [updated] = await db
          .select()
          .from(glossaryTerms)
          .where(eq(glossaryTerms.id, id))
          .limit(1);

        console.log('[GlossaryTerms] ✅ Termo atualizado');
        return updated;
      } catch (error: any) {
        if (error instanceof TRPCError) throw error;

        console.error('[GlossaryTerms] ❌ Erro ao atualizar:', error.message);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao atualizar termo',
          cause: error,
        });
      }
    }),

  /**
   * 4. DELETE - Deletar termo
   */
  delete: publicProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      try {
        console.log('[GlossaryTerms] 🗑️ Deletando termo:', input.id);

        const [existing] = await db
          .select()
          .from(glossaryTerms)
          .where(eq(glossaryTerms.id, input.id))
          .limit(1);

        if (!existing) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: `Termo ${input.id} não encontrado`,
          });
        }

        await db
          .delete(glossaryTerms)
          .where(eq(glossaryTerms.id, input.id));

        console.log('[GlossaryTerms] ✅ Termo deletado');
        return { success: true };
      } catch (error: any) {
        if (error instanceof TRPCError) throw error;

        console.error('[GlossaryTerms] ❌ Erro ao deletar:', error.message);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao deletar termo',
          cause: error,
        });
      }
    }),

  /**
   * 5. UPLOAD BATCH - Importar múltiplos termos
   */
  uploadBatch: publicProcedure
    .input(uploadBatchInputSchema)
    .mutation(async ({ input }) => {
      try {
        console.log('[GlossaryTerms] 📤 Upload batch:', input.items.length, 'itens');

        const values = input.items.map(item => ({
          type: input.type,
          term: item.term,
          correctSpelling: item.correctSpelling,
          notes: null,
        }));

        await db
          .insert(glossaryTerms)
          .values(values as any);

        console.log('[GlossaryTerms] ✅ Batch importado:', input.items.length, 'termos');
        return {
          success: true,
          count: input.items.length,
        };
      } catch (error: any) {
        console.error('[GlossaryTerms] ❌ Erro no batch:', error.message);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao importar termos em lote',
          cause: error,
        });
      }
    }),
});
