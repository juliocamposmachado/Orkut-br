-- Tabela para armazenar links das fotos do Imgur no álbum de fotos do usuário
CREATE TABLE public.album_fotos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  imgur_link text NOT NULL,
  titulo text DEFAULT 'Nova foto'::text,
  descricao text DEFAULT ''::text,
  likes_count integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  views_count integer DEFAULT 0,
  is_public boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT album_fotos_pkey PRIMARY KEY (id),
  CONSTRAINT album_fotos_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Índices para melhorar performance
CREATE INDEX idx_album_fotos_user_id ON public.album_fotos(user_id);
CREATE INDEX idx_album_fotos_created_at ON public.album_fotos(created_at DESC);
CREATE INDEX idx_album_fotos_public ON public.album_fotos(is_public) WHERE is_public = true;

-- RLS (Row Level Security) policies
ALTER TABLE public.album_fotos ENABLE ROW LEVEL SECURITY;

-- Policy para permitir que usuários vejam suas próprias fotos
CREATE POLICY "Users can view own photos" ON public.album_fotos
  FOR SELECT USING (auth.uid() = user_id);

-- Policy para permitir que usuários vejam fotos públicas
CREATE POLICY "Anyone can view public photos" ON public.album_fotos
  FOR SELECT USING (is_public = true);

-- Policy para permitir que usuários insiram suas próprias fotos
CREATE POLICY "Users can insert own photos" ON public.album_fotos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy para permitir que usuários atualizem suas próprias fotos
CREATE POLICY "Users can update own photos" ON public.album_fotos
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy para permitir que usuários deletem suas próprias fotos
CREATE POLICY "Users can delete own photos" ON public.album_fotos
  FOR DELETE USING (auth.uid() = user_id);

-- Comentários na tabela
COMMENT ON TABLE public.album_fotos IS 'Tabela para armazenar links das fotos do Imgur no álbum de fotos dos usuários';
COMMENT ON COLUMN public.album_fotos.imgur_link IS 'Link direto da imagem hospedada no Imgur';
COMMENT ON COLUMN public.album_fotos.titulo IS 'Título da foto definido pelo usuário';
COMMENT ON COLUMN public.album_fotos.descricao IS 'Descrição opcional da foto';
COMMENT ON COLUMN public.album_fotos.is_public IS 'Define se a foto é pública (visível no feed global)';
