-- Fix para políticas RLS da tabela friendships
-- Execute este script no Supabase SQL Editor

BEGIN;

-- 1. Desabilitar RLS temporariamente para debug (se necessário)
-- ALTER TABLE public.friendships DISABLE ROW LEVEL SECURITY;

-- 2. Remover políticas existentes
DROP POLICY IF EXISTS friendships_read_involving_me ON public.friendships;
DROP POLICY IF EXISTS friendships_insert_self_as_requester ON public.friendships;
DROP POLICY IF EXISTS friendships_update_involving_me ON public.friendships;

-- 3. Criar políticas mais robustas

-- Política para SELECT: usuários podem ver amizades onde estão envolvidos
CREATE POLICY friendships_read_involving_user
  ON public.friendships FOR SELECT
  USING (
    requester_id = auth.uid() OR 
    addressee_id = auth.uid()
  );

-- Política para INSERT: usuários podem criar solicitações onde são o requester
CREATE POLICY friendships_insert_as_requester
  ON public.friendships FOR INSERT
  WITH CHECK (
    requester_id = auth.uid()
  );

-- Política para UPDATE: usuários podem atualizar amizades onde estão envolvidos
CREATE POLICY friendships_update_involving_user
  ON public.friendships FOR UPDATE
  USING (
    requester_id = auth.uid() OR 
    addressee_id = auth.uid()
  );

-- Política para DELETE: usuários podem deletar amizades onde estão envolvidos
CREATE POLICY friendships_delete_involving_user
  ON public.friendships FOR DELETE
  USING (
    requester_id = auth.uid() OR 
    addressee_id = auth.uid()
  );

-- 4. Garantir que RLS está habilitado
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- 5. Função de debug removida (causava erro de sintaxe)

-- 6. Verificar se as políticas foram criadas
SELECT 
  policyname as "Policy Name",
  cmd as "Command",
  permissive as "Permissive"
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'friendships'
ORDER BY cmd, policyname;

COMMIT;

-- Teste básico (descomente para testar)
/*
-- Teste com usuário fake (deve falhar)
-- INSERT INTO public.friendships (requester_id, addressee_id, status) 
-- VALUES ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111', 'pending');

-- Ver contexto atual
-- SELECT * FROM debug_auth_context();
*/
