-- =========================================
-- VERIFICAR E CORRIGIR TABELA PHOTOS_FEED
-- Execute no Supabase SQL Editor
-- =========================================

-- Verificar se a tabela photos_feed existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'photos_feed'
) AS photos_feed_exists;

-- Primeiro, criar a função trigger se não existir
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger as $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language plpgsql;

-- Criar a tabela e configurações se não existir
DO $$
BEGIN
  -- Verificar se a tabela existe, se não, criar
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'photos_feed'
  ) THEN
    
    -- Extensão necessária para gen_random_uuid()
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";

    -- Criar tabela photos_feed
    CREATE TABLE public.photos_feed (
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

    -- Índices úteis
    CREATE INDEX IF NOT EXISTS idx_photos_feed_created_at ON public.photos_feed (created_at desc);
    CREATE INDEX IF NOT EXISTS idx_photos_feed_is_public ON public.photos_feed (is_public) WHERE is_public = true;
    CREATE INDEX IF NOT EXISTS idx_photos_feed_user_id ON public.photos_feed (user_id);
    CREATE INDEX IF NOT EXISTS idx_photos_feed_tags ON public.photos_feed using gin (tags);

    -- Habilitar RLS
    ALTER TABLE public.photos_feed ENABLE ROW LEVEL SECURITY;

    -- Trigger para atualizar updated_at
    CREATE TRIGGER trg_photos_feed_set_updated_at
    BEFORE UPDATE ON public.photos_feed
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

    RAISE NOTICE 'Tabela photos_feed criada com sucesso!';
    
  ELSE
    RAISE NOTICE 'Tabela photos_feed já existe.';
  END IF;
END
$$;

-- Criar políticas RLS separadamente (fora do bloco DO)
-- Política para ver fotos públicas
DROP POLICY IF EXISTS "Anyone can view public photos" ON public.photos_feed;
CREATE POLICY "Anyone can view public photos" ON public.photos_feed
  FOR SELECT USING (is_public = true);

-- Política para usuários verem suas próprias fotos
DROP POLICY IF EXISTS "Users can view their own photos" ON public.photos_feed;
CREATE POLICY "Users can view their own photos" ON public.photos_feed
  FOR SELECT USING (auth.uid()::text = user_id::text OR user_id IS NULL);

-- Política para inserir fotos (usuários autenticados)
DROP POLICY IF EXISTS "Authenticated users can insert photos" ON public.photos_feed;
CREATE POLICY "Authenticated users can insert photos" ON public.photos_feed
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND 
    (auth.uid()::text = user_id::text OR user_id IS NULL)
  );

-- Política para atualizar próprias fotos
DROP POLICY IF EXISTS "Users can update their own photos" ON public.photos_feed;
CREATE POLICY "Users can update their own photos" ON public.photos_feed
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND 
    (auth.uid()::text = user_id::text OR user_id IS NULL)
  );

-- Política para deletar próprias fotos
DROP POLICY IF EXISTS "Users can delete their own photos" ON public.photos_feed;
CREATE POLICY "Users can delete their own photos" ON public.photos_feed
  FOR DELETE USING (
    auth.uid() IS NOT NULL AND 
    (auth.uid()::text = user_id::text OR user_id IS NULL)
  );

-- Verificar políticas existentes
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'photos_feed'
ORDER BY tablename, policyname;

-- Verificar se RLS está habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'photos_feed';

-- Comentário sobre o resultado
SELECT 'Tabela photos_feed configurada com RLS e políticas!' AS resultado;
