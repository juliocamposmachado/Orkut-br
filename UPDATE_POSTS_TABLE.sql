-- Script para atualizar a tabela posts no Supabase
-- Execute este script no SQL Editor do Supabase Dashboard

-- 1. Adicionar colunas necessárias à tabela posts
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS author_name TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS author_photo TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS is_dj_post BOOLEAN DEFAULT FALSE;

-- 2. Atualizar dados existentes (se houver) com valores padrão
UPDATE posts 
SET 
  author_name = COALESCE(author_name, 'Unknown User'),
  is_dj_post = COALESCE(is_dj_post, FALSE)
WHERE author_name = '' OR author_name IS NULL;

-- 3. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author);
CREATE INDEX IF NOT EXISTS idx_posts_visibility ON posts(visibility);
CREATE INDEX IF NOT EXISTS idx_posts_is_dj_post ON posts(is_dj_post);

-- 4. Habilitar RLS (Row Level Security) se não estiver habilitado
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- 5. Criar políticas de RLS para permitir leitura/escrita pública dos posts
-- (Para feed global, todos devem poder ver todos os posts públicos)

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

-- Política para deleção (DELETE)
DROP POLICY IF EXISTS "Usuários podem deletar seus próprios posts" ON posts;
CREATE POLICY "Usuários podem deletar seus próprios posts" 
ON posts 
FOR DELETE 
USING (auth.uid()::text = author);

-- 6. Inserir alguns posts de exemplo para testar
INSERT INTO posts (content, author, author_name, author_photo, visibility, likes_count, comments_count, is_dj_post)
VALUES 
  ('🎉 Bem-vindos ao sistema de feed global! Agora todos podem ver as postagens uns dos outros! 🌍✨', 
   'system', 
   'Sistema Orkut', 
   'https://images.unsplash.com/photo-1551434678-e076c223a692?w=150&h=150&fit=crop&crop=face', 
   'public', 
   25, 
   8, 
   false),
  ('🎵 Tocando agora na Rádio Orkut! Os melhores hits retrô para vocês! 🎧💜', 
   'dj-orky-bot', 
   'DJ Orky 🎵', 
   'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=150&h=150&fit=crop&crop=face', 
   'public', 
   42, 
   15, 
   true)
ON CONFLICT (id) DO NOTHING;

-- 7. Verificar se tudo foi criado corretamente
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default 
FROM information_schema.columns 
WHERE table_name = 'posts' 
ORDER BY ordinal_position;

-- 8. Mostrar os posts existentes
SELECT 
  id, 
  content, 
  author, 
  author_name, 
  author_photo, 
  visibility, 
  likes_count, 
  comments_count, 
  is_dj_post, 
  created_at 
FROM posts 
ORDER BY created_at DESC 
LIMIT 10;
