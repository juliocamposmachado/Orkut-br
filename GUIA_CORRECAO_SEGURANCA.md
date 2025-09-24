# 🔒 Guia de Correção dos Warnings de Segurança - Supabase

## 📋 Problemas Identificados

O Security Advisor do Supabase detectou os seguintes warnings:

### ⚠️ Function Search Path Mutable (4 warnings)
- `public.send_friend_request_notification`
- `public.handle_new_friend_request` 
- `public.debug_auth_context`
- `public.set_updated_at`

### ⚠️ Leaked Password Protection Disabled (1 warning)
- Proteção contra senhas comprometidas está desabilitada

---

## 🛠️ Correções a Fazer

### 1️⃣ Corrigir Funções SQL (Automático)

**📁 Arquivo**: `sql/fix_security_warnings.sql` (já criado)

**Como executar**:

1. **Via Supabase Dashboard**:
   - Acesse https://supabase.com/dashboard
   - Selecione seu projeto "Orkut-Br"
   - Vá em "SQL Editor"
   - Cole o conteúdo do arquivo `sql/fix_security_warnings.sql`
   - Clique em "Run"

2. **Via psql (linha de comando)**:
   ```bash
   psql "postgresql://postgres.czxiqrsnunksjvicukgh:5AcVNksLxpyaqLQc@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require" -f sql/fix_security_warnings.sql
   ```

### 2️⃣ Habilitar Leaked Password Protection (Manual)

**Via Dashboard** (Recomendado):
1. Acesse https://supabase.com/dashboard
2. Selecione seu projeto "Orkut-Br" 
3. Menu lateral → **"Authentication"**
4. Clique em **"Settings"**
5. Na seção **"Security"**, encontre **"Password protection"**
6. ✅ **Ative** "Enable HaveIBeenPwned integration"
7. Clique em **"Save"**

**Via API REST** (Alternativo):
```bash
curl -X PUT 'https://api.supabase.com/v1/projects/czxiqrsnunksjvicukgh/config/auth' \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6eGlxcnNudW5rc2p2aWN1a2doIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODMyOTQ5NiwiZXhwIjoyMDczOTA1NDk2fQ.bJDtPrsAR9-tHY0yoaMS5D80N3lKfaWVPZGiFdP-JTM" \
  -H "Content-Type: application/json" \
  -d '{"password_protection": {"haveibeenpwned": true}}'
```

---

## ✅ Verificação das Correções

### Verificar Funções Corrigidas

Execute no SQL Editor do Supabase:

```sql
-- Verificar se as funções problemáticas foram corrigidas
SELECT 
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as args,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_proc_config(p.oid) 
            WHERE split_part(unnest, '=', 1) = 'search_path'
        ) THEN '✅ Corrigida'
        ELSE '❌ Ainda precisa de correção'
    END as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN (
    'set_updated_at',
    'send_friend_request_notification', 
    'handle_new_friend_request',
    'debug_auth_context'
)
ORDER BY p.proname;
```

### Verificar Security Advisor

1. Vá ao Dashboard do Supabase
2. Menu lateral → **"Advisors"** 
3. Clique em **"Security Advisor"**
4. Clique em **"Refresh"** ou **"Rerun linter"**
5. ✅ Os warnings devem ter desaparecido

---

## 🔍 O Que Cada Correção Faz

### Function Search Path Mutable
- **Problema**: Funções sem `search_path` seguro podem ser vulneráveis a ataques de injeção
- **Solução**: Adiciona `SET search_path = public, pg_catalog` a todas as funções
- **Benefício**: Impede que atacantes manipulem o caminho de busca do PostgreSQL

### Leaked Password Protection  
- **Problema**: Usuários podem usar senhas comprometidas em vazamentos
- **Solução**: Integração com HaveIBeenPwned para bloquear senhas conhecidamente vazadas
- **Benefício**: Força usuários a usarem senhas mais seguras

---

## 🎯 Resultado Esperado

Após executar as correções:

- ✅ **0 Errors** no Security Advisor
- ✅ **0 Warnings** relacionados às funções
- ✅ **1 Info** ou menos warnings
- 🔒 **Segurança aprimorada** significativamente

---

## 🚨 Troubleshooting

### Se houver erro ao executar o SQL:
1. Verifique se você está usando as credenciais corretas
2. Tente executar seção por seção do script
3. Verifique se as funções realmente existem antes de corrigir

### Se Leaked Password Protection não funcionar:
1. Verifique se você tem permissões de admin no projeto
2. Aguarde alguns minutos para a configuração propagar
3. Tente via API REST se o Dashboard não funcionar

### Para verificar se funcionou:
```sql
-- Ver todas as funções e seu status de segurança
SELECT 
    proname,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_proc_config(oid) 
            WHERE split_part(unnest, '=', 1) = 'search_path'
        ) THEN '🔒 Segura'
        ELSE '⚠️ Vulnerável'
    END as status
FROM pg_proc 
WHERE pronamespace = 'public'::regnamespace
ORDER BY proname;
```

---

## 📝 Notas Importantes

- ⚠️ **Backup**: Sempre faça backup antes de executar scripts SQL em produção
- 🔄 **Refresh**: Após as correções, clique em "Refresh" no Security Advisor
- ⏱️ **Tempo**: As correções são aplicadas imediatamente
- 🔒 **Segurança**: Essas correções melhoram significativamente a segurança

Execute essas correções para resolver todos os warnings de segurança! 🛡️
