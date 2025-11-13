import { db } from '../db/client.js';
import { transcriptions } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { whisperService } from './whisper.service.js';
import { claudeService } from './claude.service.js';
import { storageService } from './storage.service.js';

export class ProcessingService {
  /**
   * Processa uma transcrição completa: transcrição + correção
   * 
   * @param transcriptionId - ID da transcrição no banco
   */
  async processTranscription(transcriptionId: number): Promise<void> {
    try {
      console.log(`[Processing] Iniciando processamento da transcrição ${transcriptionId}`);
      
      // Buscar transcrição
      const [transcription] = await db
        .select()
        .from(transcriptions)
        .where(eq(transcriptions.id, transcriptionId))
        .limit(1);
      
      if (!transcription) {
        throw new Error(`Transcrição ${transcriptionId} não encontrada`);
      }
      
      // Atualizar status: transcrevendo
      await this.updateStatus(transcriptionId, 'transcribing');
      
      // Etapa 1: Transcrição com Whisper
      const audioPath = storageService.getFilePath(transcription.audioFilename);
      const { text: rawText, duration } = await whisperService.transcribe(audioPath);
      
      // Salvar texto bruto
      await db
        .update(transcriptions)
        .set({
          rawText,
          durationSeconds: duration,
        })
        .where(eq(transcriptions.id, transcriptionId));
      
      // Atualizar status: corrigindo
      await this.updateStatus(transcriptionId, 'correcting');
      
      // Etapa 2: Correção com Claude
      const { text: correctedText } = await claudeService.correctText(rawText, transcriptionId);
      
      // Salvar texto corrigido e marcar como pronto
      await db
        .update(transcriptions)
        .set({
          correctedText,
          finalText: correctedText, // Inicialmente, final = corrigido
          status: 'ready',
          processingCompletedAt: new Date(),
        })
        .where(eq(transcriptions.id, transcriptionId));
      
      console.log(`[Processing] ✅ Transcrição ${transcriptionId} processada com sucesso`);
    } catch (error: any) {
      console.error(`[Processing] ❌ Erro no processamento:`, error?.message || error);

      // Atualizar status de erro
      await db
        .update(transcriptions)
        .set({
          status: 'error',
          errorMessage: error?.message || 'Erro desconhecido',
        })
        .where(eq(transcriptions.id, transcriptionId));

      throw error;
    }
  }
  
  /**
   * Atualiza apenas o status de uma transcrição
   */
  private async updateStatus(
    transcriptionId: number,
    status: 'uploading' | 'transcribing' | 'correcting' | 'ready' | 'archived' | 'error'
  ): Promise<void> {
    await db
      .update(transcriptions)
      .set({ status })
      .where(eq(transcriptions.id, transcriptionId));
    
    console.log(`[Processing] Status atualizado: ${status}`);
  }
  
  /**
   * Reprocessa uma transcrição (útil se deu erro)
   */
  async reprocessTranscription(transcriptionId: number): Promise<void> {
    console.log(`[Processing] Reprocessando transcrição ${transcriptionId}`);
    
    // Limpar erros anteriores
    await db
      .update(transcriptions)
      .set({
        status: 'uploading',
        errorMessage: null,
        rawText: null,
        correctedText: null,
        processingStartedAt: new Date(),
        processingCompletedAt: null,
      })
      .where(eq(transcriptions.id, transcriptionId));
    
    // Processar novamente
    await this.processTranscription(transcriptionId);
  }
}

// Singleton export
export const processingService = new ProcessingService();
