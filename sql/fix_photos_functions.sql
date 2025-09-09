-- Remover todas as versões da função get_photos_optimized
DROP FUNCTION IF EXISTS public.get_photos_optimized(uuid, character varying, integer, integer, boolean);
DROP FUNCTION IF EXISTS public.get_photos_optimized(uuid, text, integer, integer, boolean);
DROP FUNCTION IF EXISTS public.get_photos_optimized;

-- Remover função increment_photo_views se existir
DROP FUNCTION IF EXISTS public.increment_photo_views(uuid);
DROP FUNCTION IF EXISTS public.increment_photo_views;

-- Criar função get_photos_optimized corrigida (usando TEXT para strings)
CREATE OR REPLACE FUNCTION get_photos_optimized(
  p_user_id uuid DEFAULT NULL,
  p_category text DEFAULT NULL,
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0,
  p_public_only boolean DEFAULT true
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  url text,
  thumbnail_url text,
  preview_url text,
  title text,
  description text,
  category text,
  likes_count integer,
  comments_count integer,
  views_count integer,
  created_at timestamptz,
  user_name text,
  user_avatar text
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.user_id,
    p.url,
    p.thumbnail_url,
    p.preview_url,
    p.title::text,
    p.description,
    p.category::text,
    COALESCE(likes.count, 0)::integer as likes_count,
    COALESCE(comments.count, 0)::integer as comments_count,
    p.views_count,
    p.created_at,
    COALESCE(prof.display_name, 'Usuário')::text as user_name,
    COALESCE(prof.photo_url, '')::text as user_avatar
  FROM user_photos p
  LEFT JOIN profiles prof ON p.user_id = prof.id
  LEFT JOIN (
    SELECT photo_id, COUNT(*) as count
    FROM photo_likes
    GROUP BY photo_id
  ) likes ON p.id = likes.photo_id
  LEFT JOIN (
    SELECT photo_id, COUNT(*) as count  
    FROM photo_comments
    WHERE is_deleted = false
    GROUP BY photo_id
  ) comments ON p.id = comments.photo_id
  WHERE 
    p.is_deleted = false
    AND p.is_processed = true
    AND (p_public_only = false OR p.is_public = true)
    AND (p_user_id IS NULL OR p.user_id = p_user_id)
    AND (p_category IS NULL OR p.category::text = p_category)
  ORDER BY p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Criar função increment_photo_views
CREATE OR REPLACE FUNCTION increment_photo_views(
  p_photo_id uuid
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE user_photos 
  SET views_count = views_count + 1
  WHERE id = p_photo_id
    AND is_deleted = false;
END;
$$;

-- Configurar RLS (Row Level Security) se não estiver configurado
ALTER TABLE user_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_comments ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para user_photos
DROP POLICY IF EXISTS "Fotos públicas são visíveis para todos" ON user_photos;
CREATE POLICY "Fotos públicas são visíveis para todos"
ON user_photos FOR SELECT
USING (is_public = true OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem inserir suas próprias fotos" ON user_photos;
CREATE POLICY "Usuários podem inserir suas próprias fotos"
ON user_photos FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem atualizar suas próprias fotos" ON user_photos;
CREATE POLICY "Usuários podem atualizar suas próprias fotos"
ON user_photos FOR UPDATE
USING (auth.uid() = user_id);

-- Políticas RLS para photo_likes
DROP POLICY IF EXISTS "Likes são visíveis para todos" ON photo_likes;
CREATE POLICY "Likes são visíveis para todos"
ON photo_likes FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Usuários podem curtir fotos" ON photo_likes;
CREATE POLICY "Usuários podem curtir fotos"
ON photo_likes FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem remover seus likes" ON photo_likes;
CREATE POLICY "Usuários podem remover seus likes"
ON photo_likes FOR DELETE
USING (auth.uid() = user_id);

-- Políticas RLS para photo_comments
DROP POLICY IF EXISTS "Comentários públicos são visíveis" ON photo_comments;
CREATE POLICY "Comentários públicos são visíveis"
ON photo_comments FOR SELECT
USING (is_deleted = false);

DROP POLICY IF EXISTS "Usuários podem comentar" ON photo_comments;
CREATE POLICY "Usuários podem comentar"
ON photo_comments FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem editar seus comentários" ON photo_comments;
CREATE POLICY "Usuários podem editar seus comentários"
ON photo_comments FOR UPDATE
USING (auth.uid() = user_id);

-- Índices para performance (se não existirem)
CREATE INDEX IF NOT EXISTS idx_user_photos_user_public 
ON user_photos (user_id, is_public, created_at DESC)
WHERE is_deleted = false AND is_processed = true;

CREATE INDEX IF NOT EXISTS idx_user_photos_category 
ON user_photos (category, created_at DESC)
WHERE is_deleted = false AND is_processed = true AND is_public = true;

CREATE INDEX IF NOT EXISTS idx_photo_likes_photo 
ON photo_likes (photo_id);

CREATE INDEX IF NOT EXISTS idx_photo_comments_photo 
ON photo_comments (photo_id)
WHERE is_deleted = false;
