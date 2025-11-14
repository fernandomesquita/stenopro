import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { appRouter } from './routes/index.js';
import { createContext } from './lib/trpc.js';
import { testConnection } from './db/client.js';

// Fix __dirname para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Servir arquivos de áudio (uploads)
const uploadsDir = process.env.STORAGE_DIR || path.join(__dirname, '../uploads');

// Middleware para logs e headers de áudio
app.use('/uploads', (req, res, next) => {
  console.log('[Server] 🎵 Requisição de áudio:', req.path);

  // Headers CORS e audio
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Cache-Control', 'public, max-age=31536000');

  // Detectar tipo de arquivo
  if (req.path.endsWith('.mp3')) {
    res.setHeader('Content-Type', 'audio/mpeg');
  } else if (req.path.endsWith('.wav')) {
    res.setHeader('Content-Type', 'audio/wav');
  } else if (req.path.endsWith('.ogg')) {
    res.setHeader('Content-Type', 'audio/ogg');
  }

  next();
});

app.use('/uploads', express.static(uploadsDir));

console.log('[Server] 📁 Servindo uploads de:', uploadsDir);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// tRPC routes
app.use(
  '/trpc',
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

// Servir frontend em produção
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(frontendPath));

  // Todas as rotas não-API vão pro frontend
  app.get('*', (req, res, next) => {
    if (!req.path.startsWith('/trpc') && !req.path.startsWith('/api') && !req.path.startsWith('/health') && !req.path.startsWith('/uploads')) {
      res.sendFile(path.join(frontendPath, 'index.html'));
    } else {
      next();
    }
  });
}

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
