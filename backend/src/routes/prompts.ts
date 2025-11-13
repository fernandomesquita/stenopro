import { z } from 'zod';
import { router, publicProcedure } from '../lib/trpc.js';
import { db } from '../db/client.js';
import { systemPrompts } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

/**
 * Schemas de validação Zod
 */

// Schema para criar prompt
const createInputSchema = z.object({
  version: z.number().int().positive(),
  content: z.string()
    .min(1, 'Conteúdo é obrigatório'),
  isActive: z.boolean().default(false),
});

/**
 * Router de prompts do sistema
 */
export const promptsRouter = router({
  /**
   * 1. GET ACTIVE - Buscar prompt ativo atual
   */
  getActive: publicProcedure
    .query(async () => {
      try {
        const [activePrompt] = await db
          .select()
          .from(systemPrompts)
          .where(eq(systemPrompts.isActive, true))
          .orderBy(desc(systemPrompts.version))
          .limit(1);

        if (!activePrompt) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Nenhum prompt ativo encontrado',
          });
        }

        return activePrompt;
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        console.error('[tRPC] Erro ao buscar prompt ativo:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao buscar prompt ativo',
          cause: error,
        });
      }
    }),

  /**
   * 2. LIST - Listar todos os prompts (ordenados por versão desc)
   */
  list: publicProcedure
    .query(async () => {
      try {
        const prompts = await db
          .select()
          .from(systemPrompts)
          .orderBy(desc(systemPrompts.version));

        return prompts;
      } catch (error) {
        console.error('[tRPC] Erro ao listar prompts:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao listar prompts',
          cause: error,
        });
      }
    }),

  /**
   * 3. CREATE - Criar novo prompt
   */
  create: publicProcedure
    .input(createInputSchema)
    .mutation(async ({ input }) => {
      try {
        const { version, content, isActive } = input;

        // Verificar se versão já existe
        const [existing] = await db
          .select()
          .from(systemPrompts)
          .where(eq(systemPrompts.version, version))
          .limit(1);

        if (existing) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Versão ${version} já existe`,
          });
        }

        // Se estiver marcando como ativo, desativar todos os outros
        if (isActive) {
          await db
            .update(systemPrompts)
            .set({ isActive: false } as any);
        }

        // Criar novo prompt
        const result = await db
          .insert(systemPrompts)
          .values({
            version,
            content,
            isActive,
            createdBy: 1, // MVP: usuário hardcoded
          } as any);

        const promptId = Number((result as any).insertId);

        // Buscar prompt criado
        const [created] = await db
          .select()
          .from(systemPrompts)
          .where(eq(systemPrompts.id, promptId))
          .limit(1);

        return created;
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        console.error('[tRPC] Erro ao criar prompt:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao criar prompt',
          cause: error,
        });
      }
    }),

  /**
   * 4. ACTIVATE - Ativar um prompt específico (desativa todos os outros)
   */
  activate: publicProcedure
    .input(z.number().int().positive())
    .mutation(async ({ input: id }) => {
      try {
        // Verificar se prompt existe
        const [existing] = await db
          .select()
          .from(systemPrompts)
          .where(eq(systemPrompts.id, id))
          .limit(1);

        if (!existing) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: `Prompt ${id} não encontrado`,
          });
        }

        // Desativar todos os prompts
        await db
          .update(systemPrompts)
          .set({ isActive: false } as any);

        // Ativar o prompt específico
        await db
          .update(systemPrompts)
          .set({ isActive: true } as any)
          .where(eq(systemPrompts.id, id));

        // Buscar prompt atualizado
        const [updated] = await db
          .select()
          .from(systemPrompts)
          .where(eq(systemPrompts.id, id))
          .limit(1);

        return updated;
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        console.error('[tRPC] Erro ao ativar prompt:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao ativar prompt',
          cause: error,
        });
      }
    }),
});
