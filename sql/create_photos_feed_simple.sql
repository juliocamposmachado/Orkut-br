-- =========================================
-- CRIAR TABELA PHOTOS_FEED - VERSÃO SIMPLES
-- Execute cada seção separadamente no Supabase SQL Editor
-- =========================================

-- PASSO 1: Verificar se a tabela existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'photos_feed'
) AS photos_feed_exists;

-- PASSO 2: Criar extensão (se necessário)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- PASSO 3: Criar a tabela photos_feed
CREATE TABLE IF NOT EXISTS public.photos_feed (
  id uuid primary key default gen_random_uuid(),
  
  -- Dados do usuário
  user_id uuid null,
  user_name text not null,
  user_avatar text null,
  
  -- Dados da imagem
  imgur_id text not null,
  imgur_url text not null,
  imgur_page_url text null,
  imgur_delete_url text null,
  
  -- Metadados da imagem
  width integer not null,
  height integer not null,
  file_size integer not null,
  mime_type text not null,
  original_filename text not null,
  
  -- Dados do post
  title text not null,
  description text null,
  tags text[] not null default '{}',
  is_public boolean not null default true,
  
  -- Contadores
  likes_count integer not null default 0,
  comments_count integer not null default 0,
  shares_count integer not null default 0,
  views_count integer not null default 0,
  
  -- Timestamps
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- PASSO 4: Criar índices
CREATE INDEX IF NOT EXISTS idx_photos_feed_created_at ON public.photos_feed (created_at desc);
CREATE INDEX IF NOT EXISTS idx_photos_feed_is_public ON public.photos_feed (is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_photos_feed_user_id ON public.photos_feed (user_id);
CREATE INDEX IF NOT EXISTS idx_photos_feed_tags ON public.photos_feed using gin (tags);

-- PASSO 5: Habilitar RLS
ALTER TABLE public.photos_feed ENABLE ROW LEVEL SECURITY;

-- PASSO 6: Criar função para trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger as $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language plpgsql;

-- PASSO 7: Criar trigger
DROP TRIGGER IF EXISTS trg_photos_feed_set_updated_at ON public.photos_feed;
CREATE TRIGGER trg_photos_feed_set_updated_at
  BEFORE UPDATE ON public.photos_feed
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- PASSO 8: Criar políticas RLS
DROP POLICY IF EXISTS "Anyone can view public photos" ON public.photos_feed;
CREATE POLICY "Anyone can view public photos" ON public.photos_feed
  FOR SELECT USING (is_public = true);

DROP POLICY IF EXISTS "Users can view their own photos" ON public.photos_feed;
CREATE POLICY "Users can view their own photos" ON public.photos_feed
  FOR SELECT USING (auth.uid()::text = user_id::text OR user_id IS NULL);

DROP POLICY IF EXISTS "Authenticated users can insert photos" ON public.photos_feed;
CREATE POLICY "Authenticated users can insert photos" ON public.photos_feed
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND 
    (auth.uid()::text = user_id::text OR user_id IS NULL)
  );

DROP POLICY IF EXISTS "Users can update their own photos" ON public.photos_feed;
CREATE POLICY "Users can update their own photos" ON public.photos_feed
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND 
    (auth.uid()::text = user_id::text OR user_id IS NULL)
  );

DROP POLICY IF EXISTS "Users can delete their own photos" ON public.photos_feed;
CREATE POLICY "Users can delete their own photos" ON public.photos_feed
  FOR DELETE USING (
    auth.uid() IS NOT NULL AND 
    (auth.uid()::text = user_id::text OR user_id IS NULL)
  );

-- PASSO 9: Verificar se tudo funcionou
SELECT 'Tabela photos_feed criada com sucesso!' as status;

-- Verificar políticas
SELECT count(*) as total_policies 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'photos_feed';

-- Verificar RLS
SELECT rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'photos_feed';
