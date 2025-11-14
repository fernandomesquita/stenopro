import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class StorageService {
  private storageDir: string;
  
  constructor() {
    // Para MVP: storage local (Railway Volumes)
    // Depois pode ser migrado para S3
    this.storageDir = process.env.STORAGE_DIR || path.join(__dirname, '../../uploads');
    this.ensureStorageDir();
  }
  
  /**
   * Garante que o diretório de storage existe
   */
  private ensureStorageDir() {
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
      console.log(`[Storage] Diretório criado: ${this.storageDir}`);
    }
  }
  
  /**
   * Salva um arquivo de áudio
   * 
   * @param buffer - Buffer do arquivo
   * @param filename - Nome original do arquivo
   * @returns Caminho do arquivo salvo e URL pública
   */
  async saveAudio(buffer: Buffer, filename: string): Promise<{
    path: string;
    url: string;
    filename: string;
  }> {
    try {
      console.log(`[Storage] 📥 Iniciando salvamento de áudio: ${filename}`);
      console.log(`[Storage] 📊 Tamanho do buffer: ${buffer.length} bytes`);

      // Validar buffer
      if (!buffer || buffer.length === 0) {
        throw new Error('Buffer de áudio vazio ou inválido');
      }

      // Validar filename
      if (!filename || filename.trim() === '') {
        throw new Error('Nome de arquivo inválido');
      }

      // Garantir que o diretório existe
      this.ensureStorageDir();
      console.log(`[Storage] 📁 Diretório de storage: ${this.storageDir}`);

      // Gerar nome único
      const timestamp = Date.now();
      const safeName = this.sanitizeFilename(filename);
      const uniqueFilename = `${timestamp}_${safeName}`;
      const filePath = path.join(this.storageDir, uniqueFilename);

      console.log(`[Storage] 💾 Salvando arquivo em: ${filePath}`);

      // Salvar arquivo
      await fs.promises.writeFile(filePath, buffer);

      // Verificar que o arquivo foi salvo
      const exists = fs.existsSync(filePath);
      if (!exists) {
        throw new Error('Arquivo não foi salvo corretamente');
      }

      const fileSize = (await fs.promises.stat(filePath)).size;
      console.log(`[Storage] ✅ Arquivo salvo com sucesso: ${uniqueFilename} (${fileSize} bytes)`);

      // URL pública (Railway ou local)
      const url = this.getPublicUrl(uniqueFilename);
      console.log(`[Storage] 🔗 URL pública: ${url}`);

      return {
        path: filePath,
        url,
        filename: uniqueFilename,
      };
    } catch (error: any) {
      console.error('[Storage] ❌ Erro ao salvar arquivo:', error?.message || error);
      console.error('[Storage] 📋 Stack trace:', error?.stack);
      throw new Error(`Falha ao salvar arquivo: ${error?.message || 'Erro desconhecido'}`);
    }
  }
  
  /**
   * Deleta um arquivo de áudio
   */
  async deleteAudio(filename: string): Promise<void> {
    try {
      const filePath = path.join(this.storageDir, filename);
      
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
        console.log(`[Storage] Arquivo deletado: ${filename}`);
      }
    } catch (error: any) {
      console.error('[Storage] ❌ Erro ao deletar arquivo:', error?.message || error);
      // Não lançar erro - apenas log
    }
  }
  
  /**
   * Verifica se um arquivo existe
   */
  async fileExists(filename: string): Promise<boolean> {
    const filePath = path.join(this.storageDir, filename);
    return fs.existsSync(filePath);
  }
  
  /**
   * Retorna o caminho completo de um arquivo
   */
  getFilePath(filename: string): string {
    return path.join(this.storageDir, filename);
  }
  
  /**
   * Gera URL pública do arquivo
   */
  private getPublicUrl(filename: string): string {
    // Em produção (Railway), usar URL do domínio
    if (process.env.NODE_ENV === 'production') {
      const baseUrl = process.env.API_URL || 'https://api.stenopro.com';
      return `${baseUrl}/uploads/${filename}`;
    }
    
    // Em desenvolvimento, URL local
    return `http://localhost:${process.env.PORT || 3000}/uploads/${filename}`;
  }
  
  /**
   * Sanitiza nome de arquivo (remove caracteres perigosos)
   */
  private sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_{2,}/g, '_')
      .toLowerCase();
  }
  
  /**
   * Retorna tamanho do arquivo em bytes
   */
  async getFileSize(filename: string): Promise<number> {
    try {
      const filePath = path.join(this.storageDir, filename);
      const stats = await fs.promises.stat(filePath);
      return stats.size;
    } catch (error) {
      return 0;
    }
  }
}

// Singleton export
export const storageService = new StorageService();
