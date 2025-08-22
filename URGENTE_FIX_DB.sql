-- 🚨 SCRIPT DE EMERGÊNCIA - Execute AGORA no Supabase SQL Editor
-- Este script corrige o erro "column posts.author_name does not exist"

-- Verificar se a tabela existe
SELECT 'Tabela posts existe:' as status, EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' AND table_name = 'posts'
) as exists;

-- Mostrar estrutura atual
SELECT 'Estrutura atual da tabela:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'posts' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 1. ADICIONAR COLUNAS FALTANTES
ALTER TABLE posts ADD COLUMN IF NOT EXISTS author_name TEXT NOT NULL DEFAULT 'Usuário Orkut';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS author_photo TEXT DEFAULT NULL;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_dj_post BOOLEAN DEFAULT FALSE;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS shares_count INTEGER DEFAULT 0;

-- 2. ATUALIZAR DADOS EXISTENTES
UPDATE posts 
SET 
  author_name = COALESCE(NULLIF(author_name, ''), 'Usuário Orkut'),
  shares_count = COALESCE(shares_count, 0),
  is_dj_post = COALESCE(is_dj_post, false)
WHERE author_name IS NULL OR author_name = '' OR shares_count IS NULL;

-- 3. CRIAR ÍNDICES
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_author_name ON posts(author_name);
CREATE INDEX IF NOT EXISTS idx_posts_visibility ON posts(visibility);

-- 4. INSERIR POST DE TESTE (se tabela vazia)
INSERT INTO posts (content, author, author_name, author_photo, visibility, likes_count, comments_count, shares_count, is_dj_post)
SELECT 
    '✅ CORRIGIDO! Sistema funcionando - Termômetro de engajamento ativo! 🌡️🔥',
    gen_random_uuid(),
    'Sistema Orkut',
    'https://images.unsplash.com/photo-1551434678-e076c223a692?w=150&h=150&fit=crop&crop=face',
    'public',
    28,
    15,
    7,
    false
WHERE NOT EXISTS (SELECT 1 FROM posts LIMIT 1);

-- 5. VERIFICAR CORREÇÃO
SELECT 'RESULTADO FINAL:' as status;
SELECT 
    COUNT(*) as total_posts,
    COUNT(CASE WHEN author_name IS NOT NULL AND author_name != '' THEN 1 END) as posts_with_names,
    COUNT(CASE WHEN shares_count IS NOT NULL THEN 1 END) as posts_with_shares
FROM posts;

SELECT 'Estrutura corrigida:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'posts' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Mostrar alguns posts para testar
SELECT 'Posts de teste:' as info;
SELECT id, content, author_name, likes_count, comments_count, shares_count, created_at 
FROM posts 
ORDER BY created_at DESC 
LIMIT 3;
