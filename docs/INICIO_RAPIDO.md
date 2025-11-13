# 🚀 Guia de Início Rápido - StenoPro

Este guia vai te ajudar a colocar o StenoPro rodando em minutos!

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter:

- ✅ Node.js 20+ instalado
- ✅ Banco de dados MySQL (local ou Railway)
- ✅ API Key da OpenAI (Whisper)
- ✅ API Key da Anthropic (Claude)

## 🎯 Passo a Passo

### 1. Configurar o Backend

```bash
cd stenopro/backend

# Instalar dependências
npm install

# Copiar arquivo de exemplo
cp .env.example .env
```

### 2. Editar o .env

Abra o arquivo `.env` e configure:

```env
# Database - Exemplo com Railway
DATABASE_URL=mysql://root:senha@containers-us-west-123.railway.app:7410/railway

# APIs
OPENAI_API_KEY=sk-proj-...
ANTHROPIC_API_KEY=sk-ant-...

# App
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173
```

### 3. Criar o Banco de Dados

```bash
# Gerar migrations
npm run db:generate

# Aplicar no banco
npm run db:push
```

Você verá algo como:
```
✅ Tables created successfully!
```

### 4. Inserir Prompt Padrão (Opcional)

Execute este SQL no seu banco de dados (via Railway Dashboard ou MySQL Workbench):

```sql
INSERT INTO system_prompts (version, content, is_active, created_by) VALUES
(1, '✅ INSTRUÇÕES DE REVISÃO E EDIÇÃO TEXTUAL

1. Correção Gramatical com Fidelidade
* Corrigir somente o necessário para garantir correção gramatical e fluidez textual. 
...
(cole o prompt completo do arquivo PADROES_STENOPRO.md)
...', true, 1);
```

### 5. Iniciar o Backend

```bash
npm run dev
```

Você verá:
```
🚀 StenoPro Backend
📡 Servidor rodando em http://localhost:3000
🌍 Environment: development
✅ Database connected successfully
💾 Database: Configurado
🎤 Whisper API: Configurado
✍️  Claude API: Configurado
```

### 6. Configurar e Iniciar o Frontend

Abra **outro terminal**:

```bash
cd stenopro/frontend

# Instalar dependências
npm install

# Iniciar dev server
npm run dev
```

Acesse: http://localhost:5173

## ✅ Verificação

Se tudo estiver correto, você verá:

- ✅ Frontend rodando em http://localhost:5173
- ✅ Backend rodando em http://localhost:3000
- ✅ Página inicial com status do sistema
- ✅ Todos os itens marcados como "online" ou "configurado"

## 🐛 Troubleshooting

### Erro: "Cannot connect to database"

**Problema:** URL do banco está incorreta.

**Solução:** 
1. Verifique se o MySQL está rodando
2. Teste a conexão: `mysql -h host -u user -p`
3. Confirme que a DATABASE_URL no .env está correta

### Erro: "OPENAI_API_KEY not found"

**Problema:** Variável de ambiente não está configurada.

**Solução:**
1. Verifique se o arquivo `.env` existe
2. Confirme que a key está sem espaços
3. Reinicie o servidor backend

### Erro: "Port 3000 already in use"

**Problema:** Outra aplicação está usando a porta 3000.

**Solução:**
1. Pare a outra aplicação, OU
2. Mude a porta no `.env`: `PORT=3001`

### Erro: "Module not found"

**Problema:** Dependências não foram instaladas.

**Solução:**
```bash
# No backend
cd backend
rm -rf node_modules package-lock.json
npm install

# No frontend
cd frontend
rm -rf node_modules package-lock.json
npm install
```

## 📱 Próximos Passos

Agora que está tudo rodando:

1. ✅ Teste fazer upload de um áudio (ainda não implementado - próximo passo!)
2. ✅ Configure o glossário global
3. ✅ Customize o prompt do sistema
4. ✅ Comece a transcrever!

## 💡 Dicas

- Use o **Drizzle Studio** para visualizar o banco: `npm run db:studio`
- Monitore os logs do backend para debug
- Sempre teste com áudios pequenos primeiro (1-2 min)
- O custo é proporcional ao tamanho do áudio

## 🆘 Precisa de Ajuda?

- 📚 Leia a [Documentação Completa](./ESPECIFICACOES_STENOPRO.md)
- 🎨 Veja os [Padrões do Projeto](./PADROES_STENOPRO.md)
- 🧪 Entenda os [Testes](./COMO_TESTAR.md)

---

**Pronto! Agora é só usar! 🚀**
