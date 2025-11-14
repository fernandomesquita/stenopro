import Groq from 'groq-sdk';
import fs from 'fs';

export class WhisperService {
  private groq: Groq;

  constructor() {
    if (!process.env.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY não configurada no ambiente');
    }

    this.groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    console.log('[Groq] ✅ Serviço Whisper inicializado com Groq');
  }

  /**
   * Transcreve um arquivo de áudio usando Groq Whisper Large v3
   *
   * @param audioPath - Caminho local do arquivo de áudio
   * @returns Objeto com texto transcrito e metadados
   * @throws {Error} Se a transcrição falhar
   */
  async transcribe(audioPath: string): Promise<{
    text: string;
    duration: number;
  }> {
    try {
      console.log('[Groq] 🎤 Iniciando transcrição com Whisper Large v3');
      console.log('[Groq] 📁 Arquivo:', audioPath);

      // Verificar se arquivo existe
      if (!fs.existsSync(audioPath)) {
        throw new Error(`Arquivo de áudio não encontrado: ${audioPath}`);
      }

      const stats = fs.statSync(audioPath);
      console.log('[Groq] 📊 Tamanho do arquivo:', stats.size, 'bytes');
      console.log('[Groq] 📊 Tamanho em MB:', (stats.size / 1024 / 1024).toFixed(2), 'MB');

      const startTime = Date.now();

      const transcription = await this.groq.audio.transcriptions.create({
        file: fs.createReadStream(audioPath),
        model: 'whisper-large-v3',
        language: 'pt',
        response_format: 'verbose_json',
        temperature: 0.0,
      });

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

      console.log('[Groq] ✅ Transcrição concluída em', elapsed, 'segundos');
      console.log('[Groq] 📝 Duração do áudio:', transcription.duration, 'segundos');
      console.log('[Groq] 📝 Caracteres transcritos:', transcription.text.length);

      return {
        text: transcription.text,
        duration: transcription.duration || 0,
      };
    } catch (error: any) {
      console.error('[Groq] ❌ Erro completo:', {
        message: error.message,
        stack: error.stack,
        response: error.response?.data,
        status: error.response?.status,
        code: error.code,
        type: error.type,
      });
      throw new Error(`Falha na transcrição: ${error?.message || 'Erro desconhecido'}`);
    }
  }
}

// Singleton export
export const whisperService = new WhisperService();
