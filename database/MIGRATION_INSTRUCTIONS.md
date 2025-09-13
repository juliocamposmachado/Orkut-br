# 🗄️ Instruções de Migração do Banco de Dados

## ✅ Migração Completada - Configurações Atualizadas

### 🔧 O que foi feito:

1. **Credenciais atualizadas** no `.env.local`:
   - URL: `https://wjglxlnbizbqwpkvihsy.supabase.co`
   - Anon Key: Atualizada para o novo projeto
   - Service Role Key: Atualizada para o novo projeto

2. **Arquivos de configuração corrigidos**:
   - ✅ `utils/supabase/client.ts` - Correto
   - ✅ `utils/supabase/server.ts` - Correto  
   - ✅ `utils/supabase/middleware.ts` - Correto
   - ✅ `utils/supabase.ts` - Criado para Pages Router

3. **Exemplos corrigidos criados**:
   - `examples/page-app-router.tsx` - Page.tsx corrigido para App Router
   - `examples/_app-pages-router.tsx` - _app.tsx corrigido para Pages Router

## 📋 Próximos Passos (Execute na ordem):

### 1. Acessar o Supabase Dashboard
```
https://supabase.com/dashboard/project/wjglxlnbizbqwpkvihsy/sql
```

### 2. Executar o Schema SQL
Execute o conteúdo do arquivo `database/migration-schema.sql` no SQL Editor do Supabase.

**⚠️ Importante**: Execute as seções uma por vez para evitar timeout.

### 3. Criar as tabelas restantes
O arquivo `migration-schema.sql` contém apenas as tabelas principais. Você precisará criar as outras tabelas do seu esquema original:

**Tabelas críticas a criar**:
- `posts` (posts do feed)
- `comments` (comentários)
- `likes` (curtidas)
- `friendships` (amizades)
- `messages` (mensagens)
- `communities` (comunidades)
- `community_members` (membros das comunidades)
- `notifications` (notificações)

### 4. Configurar RLS (Row Level Security)
Certifique-se de ativar o RLS e criar as policies necessárias para cada tabela.

### 5. Testar a aplicação
```bash
npm run dev
```

## 🚨 Erros Comuns e Soluções

### Erro: "Missing env.NEXT_PUBLIC_SUPABASE_URL"
- Verifique se o arquivo `.env.local` está na raiz do projeto
- Reinicie o servidor de desenvolvimento após alterar variáveis de ambiente

### Erro: "relation does not exist"
- Certifique-se de ter executado todo o schema SQL no Supabase
- Verifique se as tabelas foram criadas no schema `public`

### Erro: "Row Level Security policy violation"
- Configure as policies RLS apropriadas para cada tabela
- Teste com um usuário autenticado

## 🔗 URLs Importantes

- **Supabase Dashboard**: https://supabase.com/dashboard/project/wjglxlnbizbqwpkvihsy
- **SQL Editor**: https://supabase.com/dashboard/project/wjglxlnbizbqwpkvihsy/sql
- **Table Editor**: https://supabase.com/dashboard/project/wjglxlnbizbqwpkvihsy/editor

## 📞 Conexões Diretas ao Banco

Se precisar conectar diretamente ao PostgreSQL:

```bash
# Conexão direta
postgresql://postgres:[78451200]@db.wjglxlnbizbqwpkvihsy.supabase.co:5432/postgres

# Conexão pooled (recomendada para produção)
postgresql://postgres.wjglxlnbizbqwpkvihsy:[78451200]@aws-1-us-east-2.pooler.supabase.com:6543/postgres
```

**⚠️ Nunca exponha a senha [78451200] em código público!**
