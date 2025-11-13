# 🧪 GUIA DE TESTE DO FLUXO WHISPER + CLAUDE

## 📋 Pré-requisitos

Você precisa de duas API keys:

### 1. OpenAI API Key (Whisper)

**Como obter:**
1. Acesse: https://platform.openai.com/api-keys
2. Faça login ou crie uma conta
3. Clique em "Create new secret key"
4. Copie a key (começa com `sk-proj-...`)

**Custo:** ~$0.006 por minuto de áudio (~$0.03 para este teste de 5min)

### 2. Anthropic API Key (Claude)

**Como obter:**
1. Acesse: https://console.anthropic.com/
2. Faça login ou crie uma conta
3. Vá em "API Keys" no menu
4. Clique em "Create Key"
5. Copie a key (começa com `sk-ant-...`)

**Custo:** ~$0.15 para esta transcrição (Claude Sonnet)

**💰 Custo total do teste: ~R$0,90 (muito barato!)**

---

## 🚀 Como Executar o Teste

### Passo 1: Configurar as API Keys

No terminal, execute:

```bash
export OPENAI_API_KEY="sua-key-aqui"
export ANTHROPIC_API_KEY="sua-key-aqui"
```

**Exemplo:**
```bash
export OPENAI_API_KEY="sk-proj-abc123..."
export ANTHROPIC_API_KEY="sk-ant-xyz789..."
```

### Passo 2: Executar o Teste

```bash
cd /home/claude
npm run test
```

---

## 📊 O que o Teste Faz

1. **Carrega o áudio** (`Quarto10_Reuniao79757.mp3`)
2. **Envia para Whisper** → Gera texto bruto
3. **Envia texto bruto para Claude** com:
   - Suas instruções de formatação
   - Glossário de nomes
   - Texto do TurboScribe como referência
4. **Recebe texto corrigido** formatado como nota taquigráfica
5. **Salva os resultados** em `/home/claude/test-results/`

---

## 📁 Arquivos Gerados

Após o teste, você terá em `/home/claude/test-results/`:

```
2025-11-13T14-30-00_bruto.txt      → Texto que saiu do Whisper
2025-11-13T14-30-00_corrigido.txt  → Texto corrigido pelo Claude
```

---

## ✅ Checklist de Validação

Após executar, verifique se o texto corrigido:

- [ ] Tem oradores em CAIXA ALTA (ex: O SR. PRESIDENTE)
- [ ] Tem partidos entre parênteses (ex: PL-DF)
- [ ] Usa "Sr." e não "Senhor"
- [ ] Parágrafos bem divididos
- [ ] Nomes corretos do glossário (Alberto Fraga, Reinaldo Monteiro, etc)
- [ ] Termina com "(Fim da transcrição)"
- [ ] Mantém a oralidade do orador
- [ ] Não inventa informações

---

## 🐛 Troubleshooting

### Erro: "OPENAI_API_KEY não encontrada"
→ Você esqueceu de exportar a variável. Execute o `export` novamente.

### Erro: "API key inválida"
→ Verifique se copiou a key completa, sem espaços no início/fim.

### Erro: "Insufficient quota"
→ Você precisa adicionar créditos na sua conta OpenAI/Anthropic.

### Erro: "Audio file too large"
→ O áudio tem menos de 2MB, isso não deve acontecer.

---

## 💡 Dicas

- As keys são **sensíveis** - nunca as compartilhe ou commite no Git
- Se quiser testar com outro áudio, mude a variável `AUDIO_FILE` no script
- O Claude vai comparar com o texto do TurboScribe para contexto, mas trabalha a partir do Whisper
- Se o resultado não estiver bom, podemos ajustar o prompt

---

## 📞 Próximos Passos

Se o teste der certo:
1. ✅ Validar qualidade do texto corrigido
2. ✅ Ajustar prompt se necessário
3. ✅ Partir para construir o sistema completo

Se der algum erro:
1. ❌ Me mande o erro completo
2. ❌ Vamos debugar juntos

---

**Pronto para testar? Bora! 🚀**
