-- Script final para corrigir RLS da tabela friendships
-- Baseado no schema real do banco de dados
-- Execute no Supabase SQL Editor

-- 1. Verificar políticas existentes na tabela friendships
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  permissive,
  roles
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'friendships';

-- 2. Remover todas as políticas existentes da tabela friendships
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'friendships'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(policy_record.policyname) || ' ON public.friendships';
        RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
    END LOOP;
END $$;

-- 3. Verificar se RLS está habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'friendships';

-- 4. Criar políticas básicas e funcionais

-- Política SELECT: usuários podem ver amizades onde são requester ou addressee
CREATE POLICY "friendships_select_policy" ON public.friendships
    FOR SELECT
    USING (
        requester_id = auth.uid() 
        OR addressee_id = auth.uid()
    );

-- Política INSERT: usuários podem criar solicitações onde são o requester
CREATE POLICY "friendships_insert_policy" ON public.friendships
    FOR INSERT
    WITH CHECK (
        requester_id = auth.uid()
    );

-- Política UPDATE: usuários podem atualizar amizades onde participam
CREATE POLICY "friendships_update_policy" ON public.friendships
    FOR UPDATE
    USING (
        requester_id = auth.uid() 
        OR addressee_id = auth.uid()
    );

-- Política DELETE: usuários podem deletar amizades onde participam  
CREATE POLICY "friendships_delete_policy" ON public.friendships
    FOR DELETE
    USING (
        requester_id = auth.uid() 
        OR addressee_id = auth.uid()
    );

-- 5. Garantir que RLS está habilitado
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- 6. Verificar as políticas criadas
SELECT 
  policyname as "Policy Name",
  cmd as "Command",
  permissive as "Permissive"
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'friendships'
ORDER BY cmd, policyname;

-- 7. Verificar constraint da tabela (status deve aceitar 'rejected')
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.friendships'::regclass 
AND contype = 'c';

-- NOTA: Se ainda houver problemas, execute este comando para desabilitar RLS temporariamente:
-- ALTER TABLE public.friendships DISABLE ROW LEVEL SECURITY;
