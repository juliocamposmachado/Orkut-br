-- 🔍 SCRIPT MINIMALISTA - Baseado na estrutura real da tabela
-- Execute linha por linha para ver o que acontece

-- PASSO 1: Ver estrutura atual da tabela
SELECT 'ESTRUTURA ATUAL:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'posts' AND table_schema = 'public'
ORDER BY ordinal_position;

-- PASSO 2: Ver dados existentes
SELECT 'DADOS ATUAIS:' as info;
SELECT * FROM posts LIMIT 3;

-- PASSO 3: Adicionar APENAS a coluna author_name (que está causando erro nos logs)
ALTER TABLE posts ADD COLUMN IF NOT EXISTS author_name TEXT NOT NULL DEFAULT 'Usuário';

-- PASSO 4: Adicionar outras colunas APENAS se necessário
ALTER TABLE posts ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS shares_count INTEGER DEFAULT 0;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS author_photo TEXT DEFAULT NULL;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'public';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_dj_post BOOLEAN DEFAULT FALSE;

-- PASSO 5: Ver estrutura APÓS correção
SELECT 'ESTRUTURA CORRIGIDA:' as info;
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'posts' AND table_schema = 'public'
ORDER BY ordinal_position;

-- PASSO 6: Inserir um post de teste simples (SEM especificar todas as colunas)
INSERT INTO posts (content, author, author_name) 
SELECT 
    '✅ CORRIGIDO! API funcionando, termômetro ativo! 🌡️',
    COALESCE((SELECT author FROM posts LIMIT 1), 'system'),
    'Sistema Orkut'
WHERE NOT EXISTS (SELECT 1 FROM posts WHERE content LIKE '%CORRIGIDO%');

-- PASSO 7: Verificar resultado
SELECT 'RESULTADO:' as info;
SELECT COUNT(*) as total FROM posts;
SELECT * FROM posts ORDER BY created_at DESC LIMIT 2;
