-- Script para atualizar a tabela posts para suportar o feed global
-- Execute este script no Supabase SQL Editor

-- Primeiro, vamos adicionar as colunas necessárias à tabela posts
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS author_name text,
ADD COLUMN IF NOT EXISTS author_photo text,
ADD COLUMN IF NOT EXISTS is_dj_post boolean DEFAULT false;

-- Atualizar posts existentes com dados do profile do autor
UPDATE public.posts 
SET 
    author_name = profiles.display_name,
    author_photo = profiles.photo_url
FROM public.profiles 
WHERE public.posts.author = profiles.id 
AND public.posts.author_name IS NULL;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_visibility ON public.posts(visibility);
CREATE INDEX IF NOT EXISTS idx_posts_author ON public.posts(author);

-- Atualizar políticas RLS para incluir novos campos
DROP POLICY IF EXISTS "Posts públicos visíveis por todos" ON public.posts;
CREATE POLICY "Posts públicos visíveis por todos"
    ON public.posts FOR SELECT
    USING (visibility = 'public' OR auth.uid() = author);

-- Política para inserção de posts (permitir todos os campos)
DROP POLICY IF EXISTS "Usuários podem criar posts" ON public.posts;
CREATE POLICY "Usuários podem criar posts"
    ON public.posts FOR INSERT
    WITH CHECK (auth.uid() = author);

-- Comentário sobre a estrutura atualizada
COMMENT ON TABLE public.posts IS 'Tabela de posts para feed global da rede social';
COMMENT ON COLUMN public.posts.author_name IS 'Nome do autor para cache/performance';
COMMENT ON COLUMN public.posts.author_photo IS 'URL da foto do autor para cache/performance';
COMMENT ON COLUMN public.posts.is_dj_post IS 'Indica se o post foi criado pelo DJ Orky automaticamente';
