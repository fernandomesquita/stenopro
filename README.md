# 🏛️ StenoPro

Sistema de transcrição parlamentar automatizada para a Câmara dos Deputados.

## 📋 Sobre o Projeto

O StenoPro automatiza o processo de transcrição e formatação de debates parlamentares, reduzindo o tempo de processamento de 15-20 minutos para 3-5 minutos por transcrição.

### Fluxo Automatizado

```
Upload de Áudio → Whisper API → Claude API → Editor → Exportação
     (MP3)         (transcrição)   (correção)   (revisão)   (.docx)
```

## 🚀 Tecnologias

### Backend
- Node.js + Express
- TypeScript
- tRPC (API type-safe)
- Drizzle ORM + MySQL
- OpenAI Whisper API
- Anthropic Claude API

### Frontend
- React 19 + TypeScript
- Vite
- TailwindCSS
- TipTap (editor rich text)
- React Query

## 📦 Estrutura do Projeto

```
stenopro/
├── backend/          # API e serviços
├── frontend/         # Interface React
├── shared/           # Código compartilhado
└── docs/             # Documentação
```

## ⚙️ Configuração

### 1. Pré-requisitos

- Node.js 20+
- MySQL 8.0+
- Conta OpenAI (Whisper API)
- Conta Anthropic (Claude API)

### 2. Instalação

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/stenopro.git
cd stenopro

# Instalar dependências do backend
cd backend
npm install
cp .env.example .env
# Edite o .env com suas configurações

# Instalar dependências do frontend
cd ../frontend
npm install
```

### 3. Configurar Banco de Dados

```bash
cd backend

# Gerar schema SQL
npm run db:generate

# Aplicar migrations
npm run db:push

# (Opcional) Abrir Drizzle Studio
npm run db:studio
```

### 4. Iniciar Servidores

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Acesse: http://localhost:5173

## 📚 Documentação

- [Especificações Técnicas](./docs/ESPECIFICACOES_STENOPRO.md)
- [Padrões e Convenções](./docs/PADROES_STENOPRO.md)
- [Guia de Teste](./docs/COMO_TESTAR.md)

## 💰 Custos Estimados

| Serviço | Custo/mês (100 transcrições) |
|---------|------------------------------|
| Whisper API | ~R$ 15 |
| Claude API | ~R$ 11 |
| Railway (hosting) | ~R$ 30 |
| **Total** | **~R$ 56/mês** |

## 🎯 Roadmap

### ✅ Versão 1.0 (MVP)
- [x] Estrutura do projeto
- [x] Schema do banco de dados
- [x] Serviços (Whisper, Claude, Storage)
- [ ] Rotas tRPC
- [ ] Interface de upload
- [ ] Editor de texto
- [ ] Histórico de transcrições

### 🔲 Versão 1.1
- [ ] Sistema de prompts editável
- [ ] Glossário global e por trabalho
- [ ] Exportação DOCX
- [ ] Busca e filtros

### 🔲 Versão 2.0
- [ ] Autenticação multiusuário
- [ ] Colaboração em tempo real
- [ ] Dashboard de métricas
- [ ] API pública

## 🤝 Contribuindo

Este é um projeto interno da Câmara dos Deputados. Contribuições são bem-vindas!

## 📄 Licença

MIT

## 👤 Autor

**Fernando Silva**  
Analista de Registro e Redação - Câmara dos Deputados

---

**Desenvolvido com ❤️ para otimizar o trabalho parlamentar**
