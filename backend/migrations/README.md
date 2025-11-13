# Migrações do Banco de Dados

Este diretório contém as migrações SQL do banco de dados StenoPro.

## Como executar

Execute as migrações em ordem numérica no seu banco de dados MySQL:

```bash
# Conectar ao MySQL
mysql -u root -p stenopro

# Executar migração
source /path/to/backend/migrations/002_add_progress_fields.sql
```

## Migrações Disponíveis

- `001_initial_schema.sql` - Schema inicial (já aplicado via Drizzle)
- `002_add_progress_fields.sql` - Adiciona campos de progresso (progress_message, progress_percent)

## Observações

- As migrações devem ser executadas apenas uma vez
- Sempre faça backup antes de executar migrações em produção
- Verifique se a migração foi aplicada com sucesso antes de prosseguir
