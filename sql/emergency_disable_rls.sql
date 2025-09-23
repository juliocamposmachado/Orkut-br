-- SCRIPT EMERGENCIAL: Desabilitar RLS temporariamente
-- Execute no Supabase SQL Editor para resolver o problema imediatamente
-- ⚠️ ATENÇÃO: Isso remove a segurança RLS da tabela friendships

-- Desabilitar RLS na tabela friendships
ALTER TABLE public.friendships DISABLE ROW LEVEL SECURITY;

-- Verificar status
SELECT 
  schemaname,
  tablename,
  rowsecurity as "RLS Enabled"
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'friendships';

-- MENSAGEM: RLS desabilitado! 
-- Agora as amizades devem funcionar normalmente.
-- Você pode reabilitar RLS depois com políticas corretas se necessário.
