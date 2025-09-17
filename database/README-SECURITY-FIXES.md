# 🔒 Correção de Problemas de Segurança - Supabase

## 📋 **Problemas Detectados pelo Linter**

O Supabase Database Linter detectou os seguintes problemas de segurança:

### ❌ **Erros Encontrados:**
1. **RLS Disabled in Public** - 6 tabelas sem RLS habilitado
2. **Security Definer View** - 1 view com propriedade insegura

### 📊 **Tabelas Afetadas:**
- `public.community_posts`
- `public.conversations` 
- `public.call_signals`
- `public.moderation_actions`
- `public.post_reports`
- `public.banned_users`

### 🔍 **View Afetada:**
- `public.friends_view` (definida com SECURITY DEFINER)

---

## 🛠️ **Como Corrigir**

### **Passo 1: Executar Script SQL**

1. **Acesse o Supabase Dashboard:**
   - Vá para: https://supabase.com/dashboard
   - Selecione seu projeto: `nhguhmiopdzuckaswvmu`

2. **Abra o SQL Editor:**
   - Navegue para "SQL Editor" no menu lateral
   - Clique em "New Query"

3. **Execute o Script:**
   - Copie todo o conteúdo do arquivo `fix-supabase-security.sql`
   - Cole no editor SQL
   - Clique em "Run" para executar

### **Passo 2: Verificar Correções**

Após executar o script, verifique se foi aplicado corretamente:

```sql
-- Verificar tabelas com RLS habilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true;

-- Listar políticas criadas
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';
```

### **Passo 3: Executar Linter Novamente**

1. No Supabase Dashboard, vá para "Database" → "Linter"
2. Clique em "Run Linter" para verificar se os erros foram corrigidos
3. Todos os erros de segurança devem ter sido resolvidos

---

## 🔐 **Políticas RLS Implementadas**

### **community_posts**
- ✅ Usuários podem ver posts de comunidades onde são membros
- ✅ Usuários podem criar posts apenas em comunidades onde são membros
- ✅ Usuários podem editar apenas seus próprios posts
- ✅ Usuários podem deletar seus posts ou moderadores podem deletar qualquer post

### **conversations**
- ✅ Usuários podem ver apenas conversas onde são participantes
- ✅ Usuários podem criar conversas onde são um dos participantes
- ✅ Usuários podem atualizar apenas suas próprias conversas

### **call_signals**
- ✅ Usuários podem ver sinais de chamadas onde estão envolvidos (caller ou receiver)
- ✅ Usuários podem criar sinais apenas como caller
- ✅ Usuários podem atualizar sinais onde estão envolvidos
- ✅ Usuários podem deletar apenas seus próprios sinais

### **moderation_actions**
- ✅ Apenas moderadores podem ver ações de moderação
- ✅ Apenas moderadores podem criar ações de moderação

### **post_reports**
- ✅ Usuários podem ver apenas seus próprios reports
- ✅ Usuários podem criar reports
- ✅ Apenas moderadores podem atualizar status dos reports

### **banned_users**
- ✅ Apenas admins podem ver lista de usuários banidos
- ✅ Apenas admins podem banir usuários
- ✅ Apenas admins podem atualizar informações de ban

---

## 📝 **Notas Importantes**

### **Sobre Moderadores/Admins**
O script atual inclui placeholders para verificação de moderadores e admins. Você precisa ajustar as políticas conforme sua estrutura:

**Opção 1: Coluna na tabela profiles**
```sql
-- Adicionar coluna is_moderator à tabela profiles
ALTER TABLE public.profiles ADD COLUMN is_moderator BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
```

**Opção 2: Usar roles da tabela community_members**
```sql
-- Verificar se usuário tem role de moderador em alguma comunidade
EXISTS (
    SELECT 1 FROM public.community_members 
    WHERE profile_id = auth.uid() 
    AND role IN ('moderator', 'admin')
)
```

### **Sobre a View friends_view**
A view foi recriada sem a propriedade `SECURITY DEFINER` para seguir as práticas de segurança recomendadas. A view agora herda as políticas RLS das tabelas subjacentes.

---

## ✅ **Verificação de Sucesso**

Após executar o script, você deve ver:

1. **Linter sem erros** - Execute o Database Linter novamente
2. **RLS habilitado** - Todas as tabelas listadas devem ter `rowsecurity = true`
3. **Políticas criadas** - Deve haver políticas RLS para cada tabela
4. **View recriada** - A friends_view não deve mais ter SECURITY DEFINER

---

## 🆘 **Solução de Problemas**

### **Se alguma política falhar:**
- Verifique se as tabelas referenciadas existem (ex: `community_members`)
- Ajuste as políticas conforme sua estrutura de dados específica
- Execute as políticas uma por vez para identificar problemas específicos

### **Se a view falhar:**
- Verifique se a tabela `friendships` existe
- Confirme se as colunas referenciadas existem nas tabelas
- Ajuste os nomes das colunas conforme sua estrutura

### **Para reverter alterações (se necessário):**
```sql
-- Desabilitar RLS em uma tabela específica
ALTER TABLE public.nome_da_tabela DISABLE ROW LEVEL SECURITY;

-- Remover uma política específica
DROP POLICY "nome_da_politica" ON public.nome_da_tabela;
```

---

## 🎯 **Resultado Esperado**

Após aplicar todas as correções:
- ✅ **0 erros no Database Linter**
- ✅ **Segurança aprimorada** - Usuários só acessam dados próprios
- ✅ **RLS funcionando** - Row Level Security protegendo dados sensíveis
- ✅ **Aplicação funcionando** - Sem impacto na funcionalidade do app

O sistema ficará muito mais seguro e em conformidade com as melhores práticas do Supabase! 🔒🎉
