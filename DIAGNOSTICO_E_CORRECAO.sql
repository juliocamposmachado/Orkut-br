-- 🔍 DIAGNÓSTICO E CORREÇÃO - Execute passo a passo no Supabase

-- PASSO 1: Verificar se a tabela posts existe
SELECT 'VERIFICANDO TABELA POSTS' as etapa;
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' AND table_name = 'posts'
) as tabela_existe;

-- PASSO 2: Mostrar estrutura ATUAL da tabela posts
SELECT 'ESTRUTURA ATUAL DA TABELA POSTS' as etapa;
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'posts' AND table_schema = 'public'
ORDER BY ordinal_position;

-- PASSO 3: Contar registros existentes
SELECT 'DADOS EXISTENTES' as etapa;
SELECT COUNT(*) as total_posts FROM posts;

-- PASSO 4: Adicionar APENAS as colunas que faltam (baseado no erro dos logs)
SELECT 'ADICIONANDO COLUNAS NECESSÁRIAS' as etapa;

-- Adicionar author_name (esta é a que está faltando nos erros)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'posts' 
        AND column_name = 'author_name'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE posts ADD COLUMN author_name TEXT NOT NULL DEFAULT 'Usuário Orkut';
        RAISE NOTICE 'Coluna author_name adicionada!';
    ELSE
        RAISE NOTICE 'Coluna author_name já existe.';
    END IF;
END $$;

-- Adicionar author_photo
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'posts' 
        AND column_name = 'author_photo'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE posts ADD COLUMN author_photo TEXT DEFAULT NULL;
        RAISE NOTICE 'Coluna author_photo adicionada!';
    ELSE
        RAISE NOTICE 'Coluna author_photo já existe.';
    END IF;
END $$;

-- Adicionar is_dj_post
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'posts' 
        AND column_name = 'is_dj_post'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE posts ADD COLUMN is_dj_post BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Coluna is_dj_post adicionada!';
    ELSE
        RAISE NOTICE 'Coluna is_dj_post já existe.';
    END IF;
END $$;

-- Adicionar shares_count
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'posts' 
        AND column_name = 'shares_count'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE posts ADD COLUMN shares_count INTEGER DEFAULT 0;
        RAISE NOTICE 'Coluna shares_count adicionada!';
    ELSE
        RAISE NOTICE 'Coluna shares_count já existe.';
    END IF;
END $$;

-- Adicionar visibility apenas se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'posts' 
        AND column_name = 'visibility'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE posts ADD COLUMN visibility TEXT DEFAULT 'public';
        RAISE NOTICE 'Coluna visibility adicionada!';
    ELSE
        RAISE NOTICE 'Coluna visibility já existe.';
    END IF;
END $$;

-- PASSO 5: Verificar estrutura FINAL
SELECT 'ESTRUTURA FINAL DA TABELA' as etapa;
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'posts' AND table_schema = 'public'
ORDER BY ordinal_position;

-- PASSO 6: Criar índices essenciais
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_author_name ON posts(author_name);

-- PASSO 7: Inserir post de teste se tabela vazia
INSERT INTO posts (content, author, author_name, author_photo, visibility, likes_count, comments_count, shares_count, is_dj_post)
SELECT 
    '✅ SISTEMA CORRIGIDO! Termômetro de engajamento funcionando! 🌡️🔥',
    COALESCE((SELECT author FROM posts LIMIT 1), gen_random_uuid()::text),
    'Sistema Orkut',
    'https://images.unsplash.com/photo-1551434678-e076c223a692?w=150&h=150&fit=crop&crop=face',
    'public',
    35,
    18,
    12,
    false
WHERE NOT EXISTS (SELECT 1 FROM posts WHERE content LIKE '%SISTEMA CORRIGIDO%');

-- PASSO 8: Verificar resultado final
SELECT 'RESULTADO FINAL' as etapa;
SELECT 
    COUNT(*) as total_posts,
    COUNT(CASE WHEN author_name IS NOT NULL AND author_name != '' THEN 1 END) as posts_com_author_name,
    COUNT(CASE WHEN visibility IS NOT NULL THEN 1 END) as posts_com_visibility
FROM posts;

-- PASSO 9: Mostrar alguns posts para teste
SELECT 'POSTS DE EXEMPLO' as etapa;
SELECT 
    id, 
    SUBSTRING(content, 1, 50) || '...' as content_preview,
    author_name, 
    visibility,
    likes_count, 
    comments_count, 
    shares_count,
    created_at 
FROM posts 
ORDER BY created_at DESC 
LIMIT 3;
