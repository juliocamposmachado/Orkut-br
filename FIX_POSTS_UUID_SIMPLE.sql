-- Script simples para corrigir erro de author_name (UUID-safe)
-- Execute este script no SQL Editor do Supabase Dashboard

-- 1. Adicionar coluna author_name (se não existir)
ALTER TABLE posts ADD COLUMN IF NOT EXISTS author_name TEXT NOT NULL DEFAULT 'Unknown User';

-- 2. Adicionar outras colunas necessárias
ALTER TABLE posts ADD COLUMN IF NOT EXISTS author_photo TEXT DEFAULT NULL;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_dj_post BOOLEAN DEFAULT FALSE;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS shares_count INTEGER DEFAULT 0;

-- 3. Atualizar registros existentes (versão segura para UUID)
UPDATE posts 
SET author_name = 'Usuário Orkut'
WHERE author_name IS NULL OR author_name = '' OR author_name = 'Unknown User';

-- 4. Criar índices básicos
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_author_name ON posts(author_name);

-- 5. Inserir post de teste se tabela vazia
INSERT INTO posts (content, author, author_name, visibility, likes_count, comments_count, shares_count, is_dj_post)
SELECT 
    '✅ Sistema corrigido! A coluna author_name foi adicionada. Feed com termômetro de engajamento funcionando! 🔥',
    gen_random_uuid(),  -- Gera UUID válido
    'Sistema Orkut',
    'public',
    15,
    8,
    5,
    false
WHERE NOT EXISTS (SELECT 1 FROM posts LIMIT 1);

-- 6. Verificar resultado
SELECT 
    COUNT(*) as total_posts,
    COUNT(CASE WHEN author_name IS NOT NULL THEN 1 END) as posts_with_names
FROM posts;

-- 7. Mostrar estrutura da tabela
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'posts' 
ORDER BY ordinal_position;
