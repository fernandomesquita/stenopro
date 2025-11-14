import { router, publicProcedure } from '../lib/trpc.js';
import { z } from 'zod';
import { db } from '../db/client.js';
import { auxiliaryDocuments } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import fs from 'fs';
import path from 'path';

const UPLOADS_DIR = path.join(process.cwd(), 'storage', 'docs');

// Garantir que o diretório existe
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export const auxiliaryDocsRouter = router({
  /**
   * Upload de documento auxiliar
   */
  upload: publicProcedure
    .input(
      z.object({
        transcriptionId: z.number().int().positive(),
        filename: z.string().min(1).max(255),
        fileData: z.string(), // base64
        fileType: z.string().max(50),
      })
    )
    .mutation(async ({ input }) => {
      try {
        console.log('[AuxDocs] 📤 Upload de documento:', input.filename);

        // Decodificar base64
        const buffer = Buffer.from(input.fileData, 'base64');
        console.log('[AuxDocs] 📊 Tamanho:', (buffer.length / 1024).toFixed(2), 'KB');

        // Gerar nome único
        const timestamp = Date.now();
        const sanitizedFilename = input.filename.replace(/[^a-zA-Z0-9._-]/g, '_');
        const uniqueFilename = `${timestamp}_${sanitizedFilename}`;
        const filePath = path.join(UPLOADS_DIR, uniqueFilename);

        // Salvar arquivo
        fs.writeFileSync(filePath, buffer);
        console.log('[AuxDocs] 💾 Arquivo salvo:', uniqueFilename);

        // Inserir no banco
        await db.insert(auxiliaryDocuments).values({
          transcriptionId: input.transcriptionId,
          filename: input.filename,
          filePath,
          fileType: input.fileType,
        } as any);

        console.log('[AuxDocs] ✅ Documento cadastrado no banco');

        return {
          success: true,
          filename: uniqueFilename,
        };
      } catch (error: any) {
        console.error('[AuxDocs] ❌ Erro no upload:', error.message);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao fazer upload do documento',
          cause: error,
        });
      }
    }),

  /**
   * Listar documentos de uma transcrição
   */
  list: publicProcedure
    .input(z.object({ transcriptionId: z.number().int().positive() }))
    .query(async ({ input }) => {
      try {
        console.log('[AuxDocs] 📋 Listando documentos da transcrição', input.transcriptionId);

        const docs = await db
          .select()
          .from(auxiliaryDocuments)
          .where(eq(auxiliaryDocuments.transcriptionId, input.transcriptionId));

        console.log('[AuxDocs] ✅ Encontrados', docs.length, 'documentos');

        return docs;
      } catch (error: any) {
        console.error('[AuxDocs] ❌ Erro ao listar:', error.message);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao listar documentos',
          cause: error,
        });
      }
    }),

  /**
   * Deletar documento
   */
  delete: publicProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      try {
        console.log('[AuxDocs] 🗑️ Deletando documento', input.id);

        // Buscar documento
        const [doc] = await db
          .select()
          .from(auxiliaryDocuments)
          .where(eq(auxiliaryDocuments.id, input.id))
          .limit(1);

        if (!doc) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Documento não encontrado',
          });
        }

        // Deletar arquivo físico
        if (fs.existsSync(doc.filePath)) {
          fs.unlinkSync(doc.filePath);
          console.log('[AuxDocs] 🗑️ Arquivo deletado:', doc.filePath);
        }

        // Deletar do banco
        await db.delete(auxiliaryDocuments).where(eq(auxiliaryDocuments.id, input.id));

        console.log('[AuxDocs] ✅ Documento deletado');

        return { success: true };
      } catch (error: any) {
        if (error instanceof TRPCError) throw error;

        console.error('[AuxDocs] ❌ Erro ao deletar:', error.message);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao deletar documento',
          cause: error,
        });
      }
    }),
});
