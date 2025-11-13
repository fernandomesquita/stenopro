import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testConnection } from './db/client.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar variáveis de ambiente
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Servir arquivos de áudio (uploads)
const uploadsDir = process.env.STORAGE_DIR || path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsDir));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// TODO: Adicionar rotas tRPC aqui
// import { createExpressMiddleware } from '@trpc/server/adapters/express';
// import { appRouter } from './routes/index.js';
// app.use('/trpc', createExpressMiddleware({ router: appRouter }));

// Iniciar servidor
async function startServer() {
  try {
    // Testar conexão com banco
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.error('❌ Falha na conexão com banco de dados');
      process.exit(1);
    }
    
    app.listen(PORT, () => {
      console.log('🚀 StenoPro Backend');
      console.log(`📡 Servidor rodando em http://localhost:${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
      console.log(`💾 Database: ${process.env.DATABASE_URL ? 'Configurado' : 'NÃO configurado'}`);
      console.log(`🎤 Whisper API: ${process.env.OPENAI_API_KEY ? 'Configurado' : 'NÃO configurado'}`);
      console.log(`✍️  Claude API: ${process.env.ANTHROPIC_API_KEY ? 'Configurado' : 'NÃO configurado'}`);
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

startServer();
