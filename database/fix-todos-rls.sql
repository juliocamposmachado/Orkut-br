-- 🔧 CORREÇÃO TEMPORÁRIA: Políticas RLS para Tabela 'todos'
-- Execute este script no SQL Editor do Supabase para permitir acesso público à tabela todos
-- URL: https://supabase.com/dashboard/project/wjglxlnbizbqwpkvihsy/sql

-- =====================================================================================
-- CONFIGURAR POLÍTICAS TEMPORÁRIAS PARA TESTE
-- =====================================================================================

-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "Enable read access for all users" ON public.todos;
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.todos;
DROP POLICY IF EXISTS "Enable update access for all users" ON public.todos;
DROP POLICY IF EXISTS "Enable delete access for all users" ON public.todos;

-- Criar políticas permissivas para teste (TEMPORÁRIO)
CREATE POLICY "Enable read access for all users" ON public.todos
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON public.todos
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON public.todos
    FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Enable delete access for all users" ON public.todos
    FOR DELETE USING (true);

-- Garantir que RLS esteja ativado
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

-- =====================================================================================
-- INSERIR ALGUNS DADOS DE TESTE
-- =====================================================================================

-- Inserir dados de exemplo para teste
INSERT INTO public.todos (title, content, completed) VALUES 
    ('Teste 1', 'Primeiro item de teste', false),
    ('Teste 2', 'Segundo item de teste', true),
    ('Configuração Supabase', 'Verificar se a migração funcionou', false)
ON CONFLICT DO NOTHING;

-- =====================================================================================
-- VERIFICAÇÃO
-- =====================================================================================

-- Verificar se os dados foram inseridos
SELECT 'Dados na tabela todos:' as message;
SELECT id, title, content, completed, created_at FROM public.todos ORDER BY created_at DESC;

-- Verificar políticas ativas
SELECT 'Políticas RLS ativas:' as message;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'todos' AND schemaname = 'public';

-- =====================================================================================
-- IMPORTANTE: POLÍTICAS TEMPORÁRIAS
-- =====================================================================================
-- ⚠️  ATENÇÃO: Estas políticas permitem acesso total à tabela 'todos'
-- ⚠️  Para produção, implemente políticas mais restritivas baseadas em auth.uid()
-- ⚠️  Exemplo de política mais segura:
-- CREATE POLICY "Users can view own todos" ON public.todos
--     FOR SELECT USING (auth.uid() = user_id);
-- =====================================================================================
