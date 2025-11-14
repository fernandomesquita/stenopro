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

      // ========================================
      // TESTE DE API KEY E CONEXÃO
      // ========================================
      console.log('[Whisper] 🔑 Testando API key...');
      console.log('[Whisper] API key presente:', !!process.env.OPENAI_API_KEY);
      console.log('[Whisper] Primeiros 10 chars:', process.env.OPENAI_API_KEY?.substring(0, 10));

      // Teste simples da API
      try {
        const testResponse = await fetch('https://api.openai.com/v1/models', {
          headers: { 'Authorization': 'Bearer ' + process.env.OPENAI_API_KEY }
        });
        console.log('[Whisper] ✅ Teste de conexão OK, status:', testResponse.status);
        if (!testResponse.ok) {
          const errorText = await testResponse.text();
          console.error('[Whisper] ❌ API retornou erro:', errorText);
        }
      } catch (testError: any) {
        console.error('[Whisper] ❌ Falha no teste de conexão:', testError.message);
      }

      // Verificar arquivo existe
      if (!fs.existsSync(audioPath)) {
        throw new Error(`Arquivo de áudio não encontrado: ${audioPath}`);
      }

      const fileStats = fs.statSync(audioPath);
      console.log('[Whisper] 📤 Enviando arquivo para transcrição...');
      console.log('[Whisper] Caminho do arquivo:', audioPath);
      console.log('[Whisper] Tamanho do arquivo:', (fileStats.size / 1024 / 1024).toFixed(2), 'MB');

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
    } catch (error: any) {
      console.error('[Whisper] ❌ Erro completo:', {
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
