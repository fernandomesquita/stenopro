import OpenAI from 'openai';
import fs from 'fs';

export class WhisperService {
  private client: OpenAI;
  
  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  
  /**
   * Transcreve um arquivo de áudio usando Whisper API
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
      console.log(`[Whisper] Transcrevendo: ${audioPath}`);
      
      const startTime = Date.now();
      
      const transcription = await this.client.audio.transcriptions.create({
        file: fs.createReadStream(audioPath),
        model: 'whisper-1',
        language: 'pt',
        response_format: 'verbose_json',
        temperature: 0.0, // Mais determinístico
      });
      
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
      
      console.log(`[Whisper] ✅ Concluído em ${elapsed}s`);
      console.log(`[Whisper] Duração do áudio: ${transcription.duration}s`);
      console.log(`[Whisper] Caracteres: ${transcription.text.length}`);
      
      return {
        text: transcription.text,
        duration: transcription.duration || 0,
      };
    } catch (error) {
      console.error('[Whisper] ❌ Erro na transcrição:', error.message);
      throw new Error(`Falha na transcrição: ${error.message}`);
    }
  }
}

// Singleton export
export const whisperService = new WhisperService();
