-- =========================================================================
-- 🔍 SCRIPT PARA VERIFICAR ESTRUTURA DAS TABELAS - ORKUT BR
-- =========================================================================
-- Execute este script ANTES do fix-supabase-security.sql para identificar
-- as colunas corretas de cada tabela
-- =========================================================================

-- 1. VERIFICAR QUAIS TABELAS EXISTEM E PRECISAM DE RLS
-- =========================================================================

-- Listar todas as tabelas públicas que não têm RLS habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity = true THEN '✅ RLS Habilitado'
        ELSE '❌ RLS DESABILITADO - PRECISA CORRIGIR'
    END as status
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY rowsecurity ASC, tablename;

-- 2. VERIFICAR ESTRUTURA DE CADA TABELA PROBLEMÁTICA
-- =========================================================================

-- Estrutura da tabela community_posts
SELECT 'community_posts' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'community_posts'
ORDER BY ordinal_position;

-- Estrutura da tabela conversations  
SELECT 'conversations' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'conversations'
ORDER BY ordinal_position;

-- Estrutura da tabela call_signals
SELECT 'call_signals' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'call_signals'
ORDER BY ordinal_position;

-- Estrutura da tabela moderation_actions
SELECT 'moderation_actions' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'moderation_actions'
ORDER BY ordinal_position;

-- Estrutura da tabela post_reports
SELECT 'post_reports' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'post_reports'
ORDER BY ordinal_position;

-- Estrutura da tabela banned_users
SELECT 'banned_users' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'banned_users'
ORDER BY ordinal_position;

-- 3. VERIFICAR VIEWS PROBLEMÁTICAS
-- =========================================================================

-- Verificar se a view friends_view existe e sua definição
SELECT schemaname, viewname, definition 
FROM pg_views 
WHERE schemaname = 'public' AND viewname = 'friends_view';

-- 4. VERIFICAR TABELAS RELACIONADAS
-- =========================================================================

-- Verificar se community_members existe
SELECT 'community_members' as table_name, column_name, data_type
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'community_members'
ORDER BY ordinal_position;

-- Verificar se friendships existe
SELECT 'friendships' as table_name, column_name, data_type
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'friendships'
ORDER BY ordinal_position;

-- 5. RESUMO - TABELAS QUE PRECISAM DE CORREÇÃO
-- =========================================================================

-- Lista final das tabelas que precisam de RLS
WITH tables_needing_rls AS (
    SELECT tablename
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND rowsecurity = false
    AND tablename IN (
        'community_posts', 
        'conversations', 
        'call_signals', 
        'moderation_actions', 
        'post_reports', 
        'banned_users'
    )
)
SELECT 
    '🔒 TABELAS QUE PRECISAM DE RLS:' as summary,
    string_agg(tablename, ', ') as tables_to_fix
FROM tables_needing_rls;

-- =========================================================================
-- 🎯 PRÓXIMOS PASSOS:
-- =========================================================================
-- 1. Execute este script primeiro
-- 2. Anote quais tabelas existem e suas colunas
-- 3. Ajuste o script fix-supabase-security.sql com as colunas corretas
-- 4. Execute o script de correção ajustado
-- =========================================================================
