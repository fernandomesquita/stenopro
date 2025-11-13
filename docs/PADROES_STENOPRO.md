# 📐 PADRÕES E CONVENÇÕES - STENOPRO

**Versão:** 1.0  
**Data:** 13/11/2025  
**Autor:** Fernando Silva

---

## 1. ESTRUTURA DE DIRETÓRIOS

```
stenopro/
├── frontend/
│   ├── src/
│   │   ├── components/          # Componentes React
│   │   │   ├── common/          # Componentes reutilizáveis
│   │   │   ├── transcriptions/  # Específicos de transcrição
│   │   │   ├── editor/          # Editor TipTap
│   │   │   └── layout/          # Layout (Header, Sidebar, etc)
│   │   ├── pages/               # Páginas/Rotas
│   │   ├── hooks/               # Custom hooks
│   │   ├── lib/                 # Utilitários e configurações
│   │   ├── stores/              # Zustand stores
│   │   ├── types/               # TypeScript types
│   │   ├── styles/              # CSS global
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── public/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── backend/
│   ├── src/
│   │   ├── routes/              # Rotas tRPC
│   │   │   ├── transcriptions.ts
│   │   │   ├── glossary.ts
│   │   │   └── prompts.ts
│   │   ├── services/            # Lógica de negócio
│   │   │   ├── whisper.service.ts
│   │   │   ├── claude.service.ts
│   │   │   ├── storage.service.ts
│   │   │   └── processing.service.ts
│   │   ├── db/                  # Database
│   │   │   ├── schema.ts        # Drizzle schema
│   │   │   ├── migrations/      # SQL migrations
│   │   │   └── client.ts        # DB connection
│   │   ├── utils/               # Utilitários
│   │   ├── types/               # TypeScript types
│   │   ├── config/              # Configurações
│   │   ├── middleware/          # Middlewares Express
│   │   └── server.ts            # Entry point
│   ├── package.json
│   ├── tsconfig.json
│   └── drizzle.config.ts
│
├── shared/                      # Código compartilhado (types, etc)
│   └── types/
│
├── docs/                        # Documentação
│   ├── ESPECIFICACOES_STENOPRO.md
│   ├── PADROES_STENOPRO.md
│   └── README.md
│
├── .env.example
├── .gitignore
├── package.json                 # Root (se monorepo)
└── README.md
```

---

## 2. NOMENCLATURA

### 2.1 Arquivos e Diretórios

**Padrão Geral:**
- `kebab-case` para nomes de arquivos
- `PascalCase` para componentes React
- `camelCase` para utilitários e serviços

**Exemplos:**

```
✅ CORRETO:
components/TranscriptionList.tsx
services/whisper.service.ts
utils/format-date.ts
hooks/use-transcriptions.ts

❌ INCORRETO:
components/transcription-list.tsx
services/WhisperService.ts
utils/formatDate.ts
hooks/UseTranscriptions.ts
```

**Sufixos Especiais:**
```
.service.ts    → Serviços (lógica de negócio)
.route.ts      → Rotas tRPC
.schema.ts     → Schemas (Zod, Drizzle)
.store.ts      → Zustand stores
.types.ts      → Type definitions
.test.ts       → Testes
```

### 2.2 Variáveis e Funções

**JavaScript/TypeScript:**

```typescript
// ✅ CORRETO
const transcriptionId = 123;
const isProcessing = true;
const audioFile = new File();

function getTranscription(id: number) {}
function handleUpload(file: File) {}
async function processAudio(url: string) {}

// Constantes globais: SCREAMING_SNAKE_CASE
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const ALLOWED_FORMATS = ['mp3', 'wav', 'ogg'];

// ❌ INCORRETO
const TranscriptionId = 123;
const is_processing = true;
function GetTranscription(id: number) {}
```

**React:**

```typescript
// ✅ CORRETO - Componentes: PascalCase
function TranscriptionCard() {}
const EditorToolbar: React.FC = () => {};

// ✅ CORRETO - Hooks: camelCase com prefixo 'use'
function useTranscriptions() {}
const useAudioUpload = () => {};

// ✅ CORRETO - Event handlers: handle + Ação
const handleSubmit = () => {};
const handleFileChange = (e: ChangeEvent) => {};

// ❌ INCORRETO
function transcriptionCard() {}
function Usetranscriptions() {}
const onSubmit = () => {}; // Preferir 'handle'
```

### 2.3 Database (SQL)

**Tabelas:**
- `snake_case`
- Plural para tabelas de entidades
- Singular para tabelas de relacionamento

```sql
✅ CORRETO:
transcriptions
glossaries
system_prompts
transcription_versions

❌ INCORRETO:
Transcription
transcription (deveria ser plural)
SystemPrompts
```

**Colunas:**
```sql
✅ CORRETO:
id
user_id
created_at
is_active
audio_url

❌ INCORRETO:
ID
userId
createdAt
IsActive
```

**Constraints e Índices:**
```sql
✅ CORRETO:
pk_transcriptions        (primary key)
fk_transcriptions_user  (foreign key)
idx_transcriptions_status (index)
unique_email             (unique)

❌ INCORRETO:
transcriptions_pk
user_fk
status_index
```

---

## 3. CONVENÇÕES DE CÓDIGO

### 3.1 TypeScript

**Types vs Interfaces:**

```typescript
// ✅ Use TYPE para:
// - Unions, intersections
// - Tipos primitivos compostos
// - Type aliases

type TranscriptionStatus = 
  | 'uploading' 
  | 'transcribing' 
  | 'correcting' 
  | 'ready' 
  | 'error';

type ApiResponse<T> = {
  data: T;
  error?: string;
};

// ✅ Use INTERFACE para:
// - Definir shapes de objetos
// - Quando precisa de extends/implements

interface Transcription {
  id: number;
  title: string;
  status: TranscriptionStatus;
  createdAt: Date;
}

interface TranscriptionWithUser extends Transcription {
  user: User;
}
```

**Tipagem Explícita:**

```typescript
// ✅ CORRETO - Sempre tipar parâmetros e retornos de funções
function getTranscription(id: number): Promise<Transcription | null> {
  // ...
}

async function uploadAudio(file: File): Promise<string> {
  // ...
}

// ✅ Inferência OK em variáveis simples
const count = 5; // Infere number
const name = "Fernando"; // Infere string

// ❌ INCORRETO - Função sem tipos
function getTranscription(id) {
  // ...
}
```

**Evitar `any`:**

```typescript
// ❌ NUNCA
function processData(data: any) {}

// ✅ Use unknown + type guard
function processData(data: unknown) {
  if (typeof data === 'object' && data !== null) {
    // Type narrowing
  }
}

// ✅ Ou crie um type específico
type ProcessableData = {
  id: number;
  value: string;
};

function processData(data: ProcessableData) {}
```

### 3.2 React

**Estrutura de Componente:**

```typescript
// ✅ PADRÃO RECOMENDADO

import { useState, useEffect } from 'react';
import { Button } from '@/components/common/Button';
import type { Transcription } from '@/types';

interface TranscriptionCardProps {
  transcription: Transcription;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

export function TranscriptionCard({ 
  transcription, 
  onEdit, 
  onDelete 
}: TranscriptionCardProps) {
  // 1. Hooks de estado
  const [isExpanded, setIsExpanded] = useState(false);
  
  // 2. Hooks de efeito
  useEffect(() => {
    // ...
  }, [transcription.id]);
  
  // 3. Handlers
  const handleEdit = () => {
    onEdit(transcription.id);
  };
  
  const handleDelete = () => {
    if (confirm('Tem certeza?')) {
      onDelete(transcription.id);
    }
  };
  
  // 4. Render
  return (
    <div className="rounded-lg border p-4">
      <h3>{transcription.title}</h3>
      <Button onClick={handleEdit}>Editar</Button>
      <Button onClick={handleDelete} variant="danger">
        Excluir
      </Button>
    </div>
  );
}
```

**Imports:**

```typescript
// ✅ ORDEM CORRETA DE IMPORTS

// 1. React e libs externas
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Editor } from '@tiptap/react';

// 2. Componentes internos (@ = alias)
import { Button } from '@/components/common/Button';
import { TranscriptionCard } from '@/components/transcriptions/TranscriptionCard';

// 3. Hooks
import { useTranscriptions } from '@/hooks/use-transcriptions';

// 4. Utils e helpers
import { formatDate } from '@/lib/utils';

// 5. Types
import type { Transcription } from '@/types';

// 6. Estilos (se houver)
import './TranscriptionList.css';
```

**Conditional Rendering:**

```typescript
// ✅ CORRETO - && para render condicional simples
{isLoading && <Spinner />}
{error && <ErrorMessage error={error} />}

// ✅ CORRETO - Ternário para if/else
{isLoading ? <Spinner /> : <Content />}

// ✅ CORRETO - Early return para lógica complexa
if (isLoading) return <Spinner />;
if (error) return <ErrorMessage error={error} />;
return <Content />;

// ❌ INCORRETO - Ternários aninhados
{isLoading 
  ? <Spinner /> 
  : error 
    ? <Error /> 
    : data 
      ? <Content /> 
      : <Empty />
}
```

### 3.3 Backend (Node.js)

**Estrutura de Service:**

```typescript
// ✅ services/whisper.service.ts

import OpenAI from 'openai';
import type { TranscriptionResult } from '@/types';

export class WhisperService {
  private client: OpenAI;
  
  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  
  async transcribe(audioUrl: string): Promise<TranscriptionResult> {
    try {
      const response = await this.client.audio.transcriptions.create({
        file: audioUrl,
        model: 'whisper-1',
        language: 'pt',
        response_format: 'verbose_json',
      });
      
      return {
        text: response.text,
        duration: response.duration,
      };
    } catch (error) {
      throw new Error(`Whisper transcription failed: ${error.message}`);
    }
  }
}

// Singleton export
export const whisperService = new WhisperService();
```

**Estrutura de Route (tRPC):**

```typescript
// ✅ routes/transcriptions.ts

import { z } from 'zod';
import { router, publicProcedure } from '@/lib/trpc';
import { transcriptionService } from '@/services/transcription.service';

export const transcriptionsRouter = router({
  list: publicProcedure
    .input(z.object({
      status: z.string().optional(),
      page: z.number().default(1),
      limit: z.number().default(20),
    }))
    .query(async ({ input }) => {
      return await transcriptionService.list(input);
    }),
  
  getById: publicProcedure
    .input(z.number())
    .query(async ({ input }) => {
      return await transcriptionService.getById(input);
    }),
  
  create: publicProcedure
    .input(z.object({
      title: z.string().min(1),
      audioUrl: z.string().url(),
    }))
    .mutation(async ({ input }) => {
      return await transcriptionService.create(input);
    }),
});
```

---

## 4. PADRÕES DE UI/UX

### 4.1 Tailwind CSS

**Classes Permitidas:**

```typescript
// ✅ CORRETO - Utility classes diretas
<div className="flex items-center justify-between p-4 rounded-lg bg-white">

// ✅ CORRETO - Conditional classes
<button className={`
  px-4 py-2 rounded
  ${isActive ? 'bg-blue-600' : 'bg-gray-300'}
  ${isDisabled && 'opacity-50 cursor-not-allowed'}
`}>

// ❌ INCORRETO - Classes arbitrárias inline
<div className="p-[13px]"> // Usar p-3 ou p-4
<div style={{ padding: '13px' }}> // Evitar style inline
```

**Cores (Palette):**

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          // ...
          600: '#0284c7', // Cor principal
          700: '#0369a1',
          // ...
        },
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        info: '#3b82f6',
      },
    },
  },
};
```

**Uso:**
```tsx
<button className="bg-primary-600 hover:bg-primary-700">
<span className="text-success">✓ Salvo</span>
<div className="border-danger bg-danger/10">Erro</div>
```

### 4.2 Componentes Base

**Button:**

```typescript
// ✅ components/common/Button.tsx

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export function Button({ 
  variant = 'primary',
  size = 'md',
  isLoading,
  children,
  className = '',
  ...props 
}: ButtonProps) {
  const baseClasses = 'rounded font-medium transition-colors';
  
  const variantClasses = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };
  
  return (
    <button
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? <Spinner /> : children}
    </button>
  );
}
```

**Input:**

```typescript
// ✅ components/common/Input.tsx

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export function Input({ 
  label, 
  error, 
  helperText, 
  className = '',
  ...props 
}: InputProps) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        className={`
          w-full px-3 py-2 border rounded-md
          focus:outline-none focus:ring-2 focus:ring-primary-500
          ${error ? 'border-red-500' : 'border-gray-300'}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
}
```

### 4.3 Ícones

**Biblioteca:** Lucide React

```typescript
// ✅ CORRETO
import { Upload, Edit2, Trash2, Check } from 'lucide-react';

<Button>
  <Upload className="w-4 h-4 mr-2" />
  Fazer Upload
</Button>

// Tamanhos padrão:
className="w-4 h-4"  // Pequeno (botões, inline)
className="w-5 h-5"  // Médio (padrão)
className="w-6 h-6"  // Grande (destaque)
```

### 4.4 Status e Estados

**Status de Transcrição:**

```typescript
const STATUS_CONFIG = {
  uploading: {
    label: 'Enviando',
    icon: Upload,
    color: 'text-blue-600 bg-blue-50',
  },
  transcribing: {
    label: 'Transcrevendo',
    icon: Mic,
    color: 'text-purple-600 bg-purple-50',
  },
  correcting: {
    label: 'Corrigindo',
    icon: Edit,
    color: 'text-yellow-600 bg-yellow-50',
  },
  ready: {
    label: 'Pronto',
    icon: Check,
    color: 'text-green-600 bg-green-50',
  },
  error: {
    label: 'Erro',
    icon: AlertCircle,
    color: 'text-red-600 bg-red-50',
  },
};

// Uso:
const config = STATUS_CONFIG[transcription.status];
<span className={`px-2 py-1 rounded ${config.color}`}>
  <config.icon className="w-4 h-4 inline mr-1" />
  {config.label}
</span>
```

---

## 5. PADRÕES DE DADOS

### 5.1 Formatos de Data

**Backend (Database):**
```sql
-- SEMPRE usar TIMESTAMP
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
```

**Backend (API):**
```typescript
// ✅ Retornar ISO 8601
{
  createdAt: '2025-11-13T10:30:00.000Z'
}
```

**Frontend (Display):**
```typescript
// utils/format-date.ts
export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

// Uso:
<span>{formatDate(transcription.createdAt)}</span>
// Output: "13/11/2025"

<span>{formatDateTime(transcription.createdAt)}</span>
// Output: "13/11/2025 10:30"
```

### 5.2 Enums e Constantes

```typescript
// ✅ types/transcriptions.types.ts

export const TRANSCRIPTION_STATUS = {
  UPLOADING: 'uploading',
  TRANSCRIBING: 'transcribing',
  CORRECTING: 'correcting',
  READY: 'ready',
  ARCHIVED: 'archived',
  ERROR: 'error',
} as const;

export type TranscriptionStatus = 
  typeof TRANSCRIPTION_STATUS[keyof typeof TRANSCRIPTION_STATUS];

// Uso:
if (status === TRANSCRIPTION_STATUS.READY) {
  // ...
}
```

### 5.3 Validação (Zod)

**Schemas Compartilhados:**

```typescript
// ✅ shared/schemas/transcription.schema.ts

import { z } from 'zod';

export const transcriptionCreateSchema = z.object({
  title: z.string()
    .min(1, 'Título é obrigatório')
    .max(255, 'Título muito longo'),
  room: z.string()
    .max(100)
    .optional(),
  audioUrl: z.string()
    .url('URL inválida'),
});

export const transcriptionUpdateSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  finalText: z.string().optional(),
  status: z.enum([
    'uploading',
    'transcribing',
    'correcting',
    'ready',
    'archived',
    'error',
  ]).optional(),
});

export type TranscriptionCreate = z.infer<typeof transcriptionCreateSchema>;
export type TranscriptionUpdate = z.infer<typeof transcriptionUpdateSchema>;
```

---

## 6. TRATAMENTO DE ERROS

### 6.1 Backend

```typescript
// ✅ services/transcription.service.ts

import { TRPCError } from '@trpc/server';

export class TranscriptionService {
  async getById(id: number) {
    try {
      const transcription = await db.query.transcriptions.findFirst({
        where: eq(transcriptions.id, id),
      });
      
      if (!transcription) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Transcrição ${id} não encontrada`,
        });
      }
      
      return transcription;
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erro ao buscar transcrição',
        cause: error,
      });
    }
  }
}
```

**Códigos de Erro tRPC:**
- `BAD_REQUEST`: Validação falhou
- `NOT_FOUND`: Recurso não encontrado
- `UNAUTHORIZED`: Não autenticado
- `FORBIDDEN`: Sem permissão
- `INTERNAL_SERVER_ERROR`: Erro inesperado

### 6.2 Frontend

```typescript
// ✅ components/TranscriptionDetail.tsx

import { trpc } from '@/lib/trpc';
import { Alert } from '@/components/common/Alert';

export function TranscriptionDetail({ id }: { id: number }) {
  const { data, isLoading, error } = trpc.transcriptions.getById.useQuery(id);
  
  if (isLoading) {
    return <Spinner />;
  }
  
  if (error) {
    return (
      <Alert variant="danger">
        <h3>Erro ao carregar transcrição</h3>
        <p>{error.message}</p>
        <Button onClick={() => window.location.reload()}>
          Tentar Novamente
        </Button>
      </Alert>
    );
  }
  
  return <div>{/* ... */}</div>;
}
```

---

## 7. TESTES

### 7.1 Nomenclatura de Arquivos de Teste

```
✅ CORRETO:
transcription.service.test.ts
format-date.test.ts
Button.test.tsx

❌ INCORRETO:
transcription.service.spec.ts
formatDate.test.ts
button.test.tsx
```

### 7.2 Estrutura de Testes

```typescript
// ✅ services/whisper.service.test.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { whisperService } from './whisper.service';

describe('WhisperService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  describe('transcribe', () => {
    it('deve transcrever áudio com sucesso', async () => {
      const audioUrl = 'https://example.com/audio.mp3';
      
      const result = await whisperService.transcribe(audioUrl);
      
      expect(result).toHaveProperty('text');
      expect(result).toHaveProperty('duration');
      expect(result.text).toBeTruthy();
    });
    
    it('deve lançar erro quando URL é inválida', async () => {
      const invalidUrl = 'invalid-url';
      
      await expect(
        whisperService.transcribe(invalidUrl)
      ).rejects.toThrow();
    });
  });
});
```

---

## 8. GIT E VERSIONAMENTO

### 8.1 Branches

```
main              → Produção (sempre estável)
develop           → Desenvolvimento (integração)
feature/nome      → Nova funcionalidade
fix/nome          → Correção de bug
hotfix/nome       → Correção urgente em produção
```

### 8.2 Commits

**Formato:**
```
tipo(escopo): mensagem curta

Descrição detalhada (opcional)

Relacionado: #123
```

**Tipos:**
- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Documentação
- `style`: Formatação (não muda lógica)
- `refactor`: Refatoração de código
- `test`: Testes
- `chore`: Manutenção

**Exemplos:**

```bash
✅ CORRETO:
git commit -m "feat(upload): adiciona validação de tipo de arquivo"
git commit -m "fix(editor): corrige bug de formatação ao copiar"
git commit -m "docs: atualiza README com instruções de setup"

❌ INCORRETO:
git commit -m "mudanças"
git commit -m "corrigido bug"
git commit -m "WIP"
```

---

## 9. VARIÁVEIS DE AMBIENTE

### 9.1 Nomenclatura

```bash
# ✅ CORRETO - Prefixos claros
DATABASE_URL=
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
AWS_S3_BUCKET=
JWT_SECRET=

# Frontend (Vite requer VITE_ prefix)
VITE_API_URL=
VITE_APP_NAME=

# ❌ INCORRETO
db_url=
apiKey=
bucket=
```

### 9.2 Arquivo .env.example

```bash
# Database
DATABASE_URL=mysql://user:password@host:3306/database

# APIs Externas
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Storage
AWS_S3_BUCKET=stenopro-audio
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1

# App
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173

# Segurança (opcional, futuro)
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h
```

---

## 10. DOCUMENTAÇÃO DE CÓDIGO

### 10.1 JSDoc

```typescript
/**
 * Transcreve um arquivo de áudio usando Whisper API
 * 
 * @param audioUrl - URL do arquivo de áudio no storage
 * @param options - Opções de transcrição (opcional)
 * @returns Objeto com texto transcrito e metadados
 * @throws {Error} Se a URL for inválida ou a API falhar
 * 
 * @example
 * ```ts
 * const result = await transcribe('https://...audio.mp3');
 * console.log(result.text);
 * ```
 */
export async function transcribe(
  audioUrl: string,
  options?: TranscribeOptions
): Promise<TranscriptionResult> {
  // ...
}
```

### 10.2 Comentários

```typescript
// ✅ BOM - Explica o "porquê"
// Usa setTimeout para evitar race condition com React Query cache
setTimeout(() => refetch(), 100);

// ✅ BOM - Documenta workaround
// HACK: TipTap não suporta colar com Ctrl+V em alguns browsers
// Usando clipboard API nativa como fallback
navigator.clipboard.readText();

// ✅ BOM - Alerta sobre comportamento não óbvio
// IMPORTANTE: Esta função modifica o array original
function sortInPlace(arr: number[]) {}

// ❌ RUIM - Repete o código
// Cria uma nova transcrição
const transcription = await create();

// ❌ RUIM - Comentário desatualizado
// TODO: Adicionar validação (já foi adicionado)
```

---

## 11. PERFORMANCE

### 11.1 React Query Cache

```typescript
// ✅ queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      cacheTime: 10 * 60 * 1000, // 10 minutos
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
```

### 11.2 Code Splitting

```typescript
// ✅ App.tsx
import { lazy, Suspense } from 'react';

const Editor = lazy(() => import('@/pages/Editor'));
const TranscriptionList = lazy(() => import('@/pages/TranscriptionList'));

function App() {
  return (
    <Suspense fallback={<PageSpinner />}>
      <Routes>
        <Route path="/" element={<TranscriptionList />} />
        <Route path="/editor/:id" element={<Editor />} />
      </Routes>
    </Suspense>
  );
}
```

---

## 12. ACESSIBILIDADE

### 12.1 Princípios Básicos

```tsx
// ✅ CORRETO
<button 
  type="button"
  aria-label="Fazer upload de áudio"
  disabled={isUploading}
>
  <Upload className="w-4 h-4" />
</button>

<input
  type="file"
  accept=".mp3,.wav,.ogg"
  aria-describedby="file-help"
/>
<p id="file-help">Formatos aceitos: MP3, WAV, OGG</p>

// ❌ INCORRETO
<div onClick={handleClick}>Clique aqui</div> // Use <button>
<img src="icon.png" /> // Falta alt
```

### 12.2 Foco Visível

```css
/* ✅ globals.css */
*:focus-visible {
  @apply outline-2 outline-offset-2 outline-primary-600;
}

button:focus-visible {
  @apply ring-2 ring-primary-500 ring-offset-2;
}
```

---

## 13. CHECKLIST DE QUALIDADE

Antes de considerar uma feature completa:

### Frontend
- [ ] Componente tipado (TypeScript)
- [ ] Props documentadas (interface)
- [ ] Loading states implementados
- [ ] Error states implementados
- [ ] Responsivo (testado em 1280px+)
- [ ] Acessível (keyboard navigation, ARIA)
- [ ] Performance OK (sem re-renders desnecessários)

### Backend
- [ ] Input validado (Zod schema)
- [ ] Erros tratados (try/catch)
- [ ] Logs estruturados
- [ ] Tipos exportados
- [ ] Documentação (JSDoc se complexo)

### Database
- [ ] Migration criada
- [ ] Índices necessários adicionados
- [ ] Foreign keys configuradas
- [ ] Schema documentado (comentários SQL)

---

## 14. REFERÊNCIAS RÁPIDAS

### Comandos Úteis

```bash
# Frontend
npm run dev              # Dev server
npm run build            # Build produção
npm run lint             # ESLint
npm run type-check       # TypeScript check

# Backend
npm run dev              # Nodemon
npm run build            # Build TS → JS
npm run db:push          # Drizzle push schema
npm run db:studio        # Drizzle Studio

# Ambos
npm run format           # Prettier
```

### Aliases de Import (tsconfig.json)

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/types/*": ["./src/types/*"]
    }
  }
}
```

---

**FIM DOS PADRÕES**

Este documento deve ser consultado sempre que houver dúvida sobre nomenclatura, estrutura ou convenções. Manter consistência é essencial para a manutenibilidade do projeto.
