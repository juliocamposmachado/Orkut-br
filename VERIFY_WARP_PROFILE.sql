-- Script para verificar se o perfil do Warp foi criado corretamente
-- Execute após CREATE_WARP_PROFILE_COMPLETE.sql

-- 1. Verificar se o perfil do Warp existe
SELECT 
  'PERFIL DO WARP' as tipo,
  id,
  username,
  display_name,
  location,
  bio,
  fans_count,
  profile_views,
  created_at
FROM public.profiles 
WHERE username = 'warp_ai_terminal';

-- 2. Verificar posts do Warp
SELECT 
  'POSTS DO WARP' as tipo,
  id,
  left(content, 100) as content_preview,
  author_name,
  visibility,
  likes_count,
  comments_count,
  is_dj_post,
  created_at
FROM public.posts 
WHERE author = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid
ORDER BY created_at DESC;

-- 3. Verificar fotos do Warp
SELECT 
  'FOTOS DO WARP' as tipo,
  id,
  photo_url,
  caption,
  created_at
FROM public.photos 
WHERE profile_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid
ORDER BY created_at DESC;

-- 4. Verificar estrutura da tabela posts
SELECT 
  'ESTRUTURA POSTS' as tipo,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'posts' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. Verificar se RLS está ativo
SELECT 
  'SEGURANÇA RLS' as tipo,
  schemaname,
  tablename,
  rowsecurity,
  (SELECT count(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'posts') as policies_count
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('posts', 'profiles');

-- 6. Teste do feed global - últimos 10 posts
SELECT 
  'FEED GLOBAL' as tipo,
  id,
  author_name,
  left(content, 80) as preview,
  visibility,
  likes_count,
  created_at
FROM public.posts 
WHERE visibility = 'public'
ORDER BY created_at DESC 
LIMIT 10;

-- 7. Estatísticas gerais
SELECT 
  'ESTATÍSTICAS' as tipo,
  'Total de posts' as item,
  count(*) as quantidade
FROM public.posts

UNION ALL

SELECT 
  'ESTATÍSTICAS' as tipo,
  'Posts públicos' as item,
  count(*) as quantidade
FROM public.posts 
WHERE visibility = 'public'

UNION ALL

SELECT 
  'ESTATÍSTICAS' as tipo,
  'Posts do Warp' as item,
  count(*) as quantidade
FROM public.posts 
WHERE author = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid

UNION ALL

SELECT 
  'ESTATÍSTICAS' as tipo,
  'Total de perfis' as item,
  count(*) as quantidade
FROM public.profiles

UNION ALL

SELECT 
  'ESTATÍSTICAS' as tipo,
  'Total de fotos' as item,
  count(*) as quantidade
FROM public.photos;

-- 8. Verificar se a API consegue acessar os dados
-- (Esta query simula o que a API /posts-db faz)
SELECT 
  'TESTE API' as tipo,
  posts.id,
  posts.content,
  posts.author,
  posts.author_name,
  posts.author_photo,
  posts.visibility,
  posts.likes_count,
  posts.comments_count,
  posts.created_at,
  posts.is_dj_post
FROM public.posts
WHERE posts.visibility = 'public'
ORDER BY posts.created_at DESC
LIMIT 5;
