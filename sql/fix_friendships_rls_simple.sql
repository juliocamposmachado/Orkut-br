-- Script simples para corrigir RLS da tabela friendships
-- Execute no Supabase SQL Editor

-- Remover políticas existentes
DROP POLICY IF EXISTS friendships_read_involving_me ON public.friendships;
DROP POLICY IF EXISTS friendships_insert_self_as_requester ON public.friendships;
DROP POLICY IF EXISTS friendships_update_involving_me ON public.friendships;
DROP POLICY IF EXISTS friendships_read_involving_user ON public.friendships;
DROP POLICY IF EXISTS friendships_insert_as_requester ON public.friendships;
DROP POLICY IF EXISTS friendships_update_involving_user ON public.friendships;
DROP POLICY IF EXISTS friendships_delete_involving_user ON public.friendships;

-- Criar políticas limpas e simples

-- Política para SELECT: usuários podem ver amizades onde participam
CREATE POLICY "Users can view their friendships" ON public.friendships
  FOR SELECT USING (
    requester_id = auth.uid() OR addressee_id = auth.uid()
  );

-- Política para INSERT: usuários podem criar solicitações como requester
CREATE POLICY "Users can create friendship requests" ON public.friendships
  FOR INSERT WITH CHECK (
    requester_id = auth.uid()
  );

-- Política para UPDATE: usuários podem atualizar amizades onde participam
CREATE POLICY "Users can update their friendships" ON public.friendships
  FOR UPDATE USING (
    requester_id = auth.uid() OR addressee_id = auth.uid()
  );

-- Política para DELETE: usuários podem deletar amizades onde participam
CREATE POLICY "Users can delete their friendships" ON public.friendships
  FOR DELETE USING (
    requester_id = auth.uid() OR addressee_id = auth.uid()
  );

-- Garantir que RLS está habilitado
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- Verificar políticas criadas
SELECT 
  policyname as "Policy Name",
  cmd as "Command"
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'friendships'
ORDER BY cmd, policyname;
