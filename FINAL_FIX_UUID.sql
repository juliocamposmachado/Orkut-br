-- 🎯 SCRIPT FINAL - Resolve problema UUID definitivamente
-- Execute comando por comando

-- PASSO 1: Apenas adicionar as colunas que faltam (SEM inserir dados ainda)
ALTER TABLE posts ADD COLUMN IF NOT EXISTS author_name TEXT NOT NULL DEFAULT 'Usuário Orkut';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS shares_count INTEGER DEFAULT 0;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS author_photo TEXT DEFAULT NULL;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'public';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_dj_post BOOLEAN DEFAULT FALSE;

-- PASSO 2: Verificar se funcionou
SELECT 'COLUNAS ADICIONADAS!' as status;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'posts' AND table_schema = 'public'
ORDER BY ordinal_position;

-- PASSO 3: Inserir post de teste com UUID válido
INSERT INTO posts (content, author, author_name, author_photo, visibility, likes_count, comments_count, shares_count, is_dj_post)
VALUES (
    '✅ SISTEMA CORRIGIDO! Termômetro de engajamento funcionando! 🌡️🔥',
    gen_random_uuid(),  -- Gera UUID válido
    'Sistema Orkut',
    'https://images.unsplash.com/photo-1551434678-e076c223a692?w=150&h=150&fit=crop&crop=face',
    'public',
    42,  -- Likes para testar termômetro
    25,  -- Comentários
    18,  -- Compartilhamentos
    false
);

-- PASSO 4: Verificar resultado final
SELECT 'TESTE FINAL:' as status;
SELECT 
    id, 
    SUBSTRING(content, 1, 50) || '...' as content,
    author_name,
    likes_count,
    comments_count,
    shares_count,
    visibility,
    created_at
FROM posts 
ORDER BY created_at DESC 
LIMIT 3;

-- PASSO 5: Verificar se a API vai funcionar agora
SELECT 'API TEST:' as status;
SELECT 
    COUNT(*) as total_posts,
    COUNT(CASE WHEN author_name IS NOT NULL THEN 1 END) as posts_with_names,
    AVG(likes_count + comments_count + COALESCE(shares_count, 0)) as avg_engagement
FROM posts;
