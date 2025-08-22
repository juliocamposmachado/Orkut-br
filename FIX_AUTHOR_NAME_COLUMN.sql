-- Script de correção urgente para resolver erro "author_name does not exist"
-- Execute este script no SQL Editor do Supabase Dashboard

-- Verificar se a tabela posts existe
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'posts'
);

-- Verificar estrutura atual da tabela posts
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'posts' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 1. Adicionar a coluna author_name se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'posts' 
        AND column_name = 'author_name'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE posts ADD COLUMN author_name TEXT NOT NULL DEFAULT 'Unknown User';
    END IF;
END $$;

-- 2. Adicionar outras colunas necessárias se não existirem
DO $$ 
BEGIN
    -- author_photo
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'posts' 
        AND column_name = 'author_photo'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE posts ADD COLUMN author_photo TEXT DEFAULT NULL;
    END IF;
    
    -- is_dj_post
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'posts' 
        AND column_name = 'is_dj_post'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE posts ADD COLUMN is_dj_post BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- 3. Atualizar registros existentes que tenham author_name vazio ou NULL
UPDATE posts 
SET author_name = CASE 
    WHEN author IS NOT NULL THEN 
        CASE 
            WHEN author::text = 'system' THEN 'Sistema Orkut'
            WHEN author::text = 'dj-orky-bot' THEN 'DJ Orky 🎵'
            ELSE 'Usuário ' || SUBSTRING(author::text, 1, 8)
        END
    ELSE 'Unknown User'
END
WHERE author_name IS NULL OR author_name = '' OR author_name = 'Unknown User';

-- 4. Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author);
CREATE INDEX IF NOT EXISTS idx_posts_visibility ON posts(visibility);
CREATE INDEX IF NOT EXISTS idx_posts_author_name ON posts(author_name);

-- 5. Habilitar RLS se não estiver habilitado
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- 6. Recriar políticas de RLS de forma segura
-- Política para leitura (SELECT)
DROP POLICY IF EXISTS "Posts públicos são visíveis para todos" ON posts;
CREATE POLICY "Posts públicos são visíveis para todos" 
ON posts 
FOR SELECT 
USING (visibility = 'public' OR auth.uid()::text = author);

-- Política para inserção (INSERT)
DROP POLICY IF EXISTS "Usuários podem criar posts" ON posts;
CREATE POLICY "Usuários podem criar posts" 
ON posts 
FOR INSERT 
WITH CHECK (auth.uid()::text = author);

-- Política para atualização (UPDATE)
DROP POLICY IF EXISTS "Usuários podem editar seus próprios posts" ON posts;
CREATE POLICY "Usuários podem editar seus próprios posts" 
ON posts 
FOR UPDATE 
USING (auth.uid()::text = author);

-- 7. Inserir post de exemplo se a tabela estiver vazia
INSERT INTO posts (content, author, author_name, author_photo, visibility, likes_count, comments_count, is_dj_post)
SELECT 
    '🔧 Sistema corrigido! A coluna author_name foi adicionada com sucesso! Agora o feed global funciona perfeitamente! ✅',
    'system',
    'Sistema Orkut',
    'https://images.unsplash.com/photo-1551434678-e076c223a692?w=150&h=150&fit=crop&crop=face',
    'public',
    0,
    0,
    false
WHERE NOT EXISTS (SELECT 1 FROM posts LIMIT 1);

-- 8. Verificar se a correção foi aplicada corretamente
SELECT 
    'Posts table structure after fix:' AS info,
    COUNT(*) AS total_posts,
    COUNT(CASE WHEN author_name IS NOT NULL AND author_name != '' THEN 1 END) AS posts_with_author_name,
    COUNT(CASE WHEN author_name IS NULL OR author_name = '' THEN 1 END) AS posts_without_author_name
FROM posts;

-- 9. Mostrar alguns posts para verificar
SELECT 
    id, 
    content, 
    author, 
    author_name, 
    author_photo, 
    visibility,
    created_at 
FROM posts 
ORDER BY created_at DESC 
LIMIT 5;

-- 10. Confirmar estrutura final da tabela
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default 
FROM information_schema.columns 
WHERE table_name = 'posts' 
AND table_schema = 'public'
ORDER BY ordinal_position;
