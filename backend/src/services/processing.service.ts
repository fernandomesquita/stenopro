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
      console.log(`[Processing] 🚀 Iniciando processamento da transcrição ${transcriptionId}`);

      // Buscar transcrição
      const [transcription] = await db
        .select()
        .from(transcriptions)
        .where(eq(transcriptions.id, transcriptionId))
        .limit(1);

      if (!transcription) {
        throw new Error(`Transcrição ${transcriptionId} não encontrada`);
      }

      // ========================================
      // ETAPA 1: TRANSCREVER COM WHISPER (33%)
      // ========================================
      console.log(`[Processing] 📝 Atualizando progresso para 33% (Transcrevendo)`);
      await this.updateStatus(transcriptionId, 'transcribing');
      console.log(`[Processing] ✅ Progresso atualizado no banco, iniciando Whisper...`);

      const audioPath = storageService.getFilePath(transcription.audioFilename);
      const { text: rawText, duration } = await whisperService.transcribe(audioPath);

      console.log(`[Processing] ✅ Whisper concluído, salvando texto bruto...`);
      await db
        .update(transcriptions)
        .set({
          rawText,
          durationSeconds: duration,
        } as any)
        .where(eq(transcriptions.id, transcriptionId));

      // ========================================
      // ETAPA 2: CORRIGIR COM CLAUDE (66%)
      // ========================================
      console.log(`[Processing] 🤖 Atualizando progresso para 66% (Corrigindo)`);
      await this.updateStatus(transcriptionId, 'correcting');
      console.log(`[Processing] ✅ Progresso atualizado no banco, iniciando Claude...`);

      const { text: correctedText } = await claudeService.correctText(rawText, transcriptionId);

      // ========================================
      // ETAPA 3: FINALIZAR (100%)
      // ========================================
      console.log(`[Processing] 🎉 Atualizando progresso para 100% (Concluído)`);
      await db
        .update(transcriptions)
        .set({
          correctedText,
          finalText: correctedText, // Inicialmente, final = corrigido
          status: 'ready',
          progressMessage: 'Concluído!',
          progressPercent: 100,
          processingCompletedAt: new Date(),
        } as any)
        .where(eq(transcriptions.id, transcriptionId));

      console.log(`[Processing] ✅ Transcrição ${transcriptionId} processada com sucesso (100%)`);
    } catch (error: any) {
      console.error(`[Processing] ❌ Erro no processamento:`, error?.message || error);

      // Atualizar status de erro
      await db
        .update(transcriptions)
        .set({
          status: 'error',
          errorMessage: error?.message || 'Erro desconhecido',
          progressMessage: 'Erro no processamento',
          progressPercent: 0,
        } as any)
        .where(eq(transcriptions.id, transcriptionId));

      throw error;
    }
  }
  
  /**
   * Atualiza apenas o status de uma transcrição com mensagem de progresso
   */
  private async updateStatus(
    transcriptionId: number,
    status: 'uploading' | 'transcribing' | 'correcting' | 'ready' | 'archived' | 'error'
  ): Promise<void> {
    // Definir mensagem e percentual de progresso baseado no status
    const progressData: { [key: string]: { message: string; percent: number } } = {
      uploading: { message: 'Enviando áudio...', percent: 0 },
      transcribing: { message: 'Transcrevendo áudio com Whisper...', percent: 33 },
      correcting: { message: 'Corrigindo texto com Claude...', percent: 66 },
      ready: { message: 'Concluído!', percent: 100 },
      archived: { message: 'Arquivado', percent: 100 },
      error: { message: 'Erro no processamento', percent: 0 },
    };

    const progress = progressData[status];

    console.log(`[Processing] 📊 Atualizando progresso: ${progress.percent}% - "${progress.message}"`);

    const result = await db
      .update(transcriptions)
      .set({
        status,
        progressMessage: progress.message,
        progressPercent: progress.percent,
      } as any)
      .where(eq(transcriptions.id, transcriptionId));

    console.log(`[Processing] ✅ UPDATE executado com sucesso no banco (status: ${status}, ${progress.percent}%)`);
  }
  
  /**
   * Reprocessa uma transcrição (útil se deu erro)
   */
  async reprocessTranscription(transcriptionId: number): Promise<void> {
    console.log(`[Processing] Reprocessando transcrição ${transcriptionId}`);

    // Limpar erros anteriores e resetar progresso
    await db
      .update(transcriptions)
      .set({
        status: 'uploading',
        errorMessage: null,
        rawText: null,
        correctedText: null,
        progressMessage: 'Enviando áudio...',
        progressPercent: 0,
        processingStartedAt: new Date(),
        processingCompletedAt: null,
      } as any)
      .where(eq(transcriptions.id, transcriptionId));

    // Processar novamente
    await this.processTranscription(transcriptionId);
  }
}

// Singleton export
export const processingService = new ProcessingService();
