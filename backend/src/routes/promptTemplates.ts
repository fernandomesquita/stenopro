import { router, publicProcedure } from '../trpc.js';
import { z } from 'zod';
import { db } from '../db/client.js';
import { promptTemplates } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

export const promptTemplatesRouter = router({
  /**
   * Criar novo template de prompt
   */
  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        promptText: z.string().min(1),
        isDefault: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        console.log('[PromptTemplates] ➕ Criando template:', input.name);

        // Se isDefault = true, remover default de outros
        if (input.isDefault) {
          await db
            .update(promptTemplates)
            .set({ isDefault: false } as any)
            .where(eq(promptTemplates.isDefault, true));

          console.log('[PromptTemplates] 📝 Outros templates marcados como não-padrão');
        }

        // Criar novo template
        await db.insert(promptTemplates).values({
          userId: 1, // MVP: usuário hardcoded
          name: input.name,
          promptText: input.promptText,
          isDefault: input.isDefault || false,
        } as any);

        console.log('[PromptTemplates] ✅ Template criado');

        return { success: true };
      } catch (error: any) {
        console.error('[PromptTemplates] ❌ Erro ao criar:', error.message);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao criar template',
          cause: error,
        });
      }
    }),

  /**
   * Listar todos os templates
   */
  list: publicProcedure.query(async () => {
    try {
      console.log('[PromptTemplates] 📋 Listando templates');

      const templates = await db.select().from(promptTemplates);

      console.log('[PromptTemplates] ✅ Encontrados', templates.length, 'templates');

      return templates;
    } catch (error: any) {
      console.error('[PromptTemplates] ❌ Erro ao listar:', error.message);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erro ao listar templates',
        cause: error,
      });
    }
  }),

  /**
   * Buscar template padrão
   */
  getDefault: publicProcedure.query(async () => {
    try {
      console.log('[PromptTemplates] 🔍 Buscando template padrão');

      const [template] = await db
        .select()
        .from(promptTemplates)
        .where(eq(promptTemplates.isDefault, true))
        .limit(1);

      if (!template) {
        console.log('[PromptTemplates] ⚠️ Nenhum template padrão encontrado');
        return null;
      }

      console.log('[PromptTemplates] ✅ Template padrão:', template.name);

      return template;
    } catch (error: any) {
      console.error('[PromptTemplates] ❌ Erro ao buscar padrão:', error.message);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erro ao buscar template padrão',
        cause: error,
      });
    }
  }),

  /**
   * Atualizar template
   */
  update: publicProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        name: z.string().min(1).max(255).optional(),
        promptText: z.string().min(1).optional(),
        isDefault: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        console.log('[PromptTemplates] 📝 Atualizando template', input.id);

        // Verificar se existe
        const [existing] = await db
          .select()
          .from(promptTemplates)
          .where(eq(promptTemplates.id, input.id))
          .limit(1);

        if (!existing) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Template não encontrado',
          });
        }

        // Se isDefault = true, remover default de outros
        if (input.isDefault) {
          await db
            .update(promptTemplates)
            .set({ isDefault: false } as any)
            .where(eq(promptTemplates.isDefault, true));
        }

        // Construir update
        const updateData: any = {};
        if (input.name !== undefined) updateData.name = input.name;
        if (input.promptText !== undefined) updateData.promptText = input.promptText;
        if (input.isDefault !== undefined) updateData.isDefault = input.isDefault;

        // Atualizar
        await db
          .update(promptTemplates)
          .set(updateData)
          .where(eq(promptTemplates.id, input.id));

        console.log('[PromptTemplates] ✅ Template atualizado');

        return { success: true };
      } catch (error: any) {
        if (error instanceof TRPCError) throw error;

        console.error('[PromptTemplates] ❌ Erro ao atualizar:', error.message);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao atualizar template',
          cause: error,
        });
      }
    }),

  /**
   * Deletar template
   */
  delete: publicProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      try {
        console.log('[PromptTemplates] 🗑️ Deletando template', input.id);

        // Verificar se existe
        const [existing] = await db
          .select()
          .from(promptTemplates)
          .where(eq(promptTemplates.id, input.id))
          .limit(1);

        if (!existing) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Template não encontrado',
          });
        }

        // Não permitir deletar template padrão
        if (existing.isDefault) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Não é possível deletar o template padrão',
          });
        }

        // Deletar
        await db.delete(promptTemplates).where(eq(promptTemplates.id, input.id));

        console.log('[PromptTemplates] ✅ Template deletado');

        return { success: true };
      } catch (error: any) {
        if (error instanceof TRPCError) throw error;

        console.error('[PromptTemplates] ❌ Erro ao deletar:', error.message);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao deletar template',
          cause: error,
        });
      }
    }),
});
