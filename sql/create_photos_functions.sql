-- Função otimizada para buscar fotos com filtros e joins
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
  title varchar,
  description text,
  category varchar,
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
    p.title,
    p.description,
    p.category,
    COALESCE(likes.count, 0)::integer as likes_count,
    COALESCE(comments.count, 0)::integer as comments_count,
    p.views_count,
    p.created_at,
    prof.display_name as user_name,
    prof.photo_url as user_avatar
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
    AND (p_category IS NULL OR p.category = p_category)
  ORDER BY p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Função para incrementar views de forma otimizada
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

-- Política RLS para user_photos (permitir leitura de fotos públicas)
ALTER TABLE user_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Fotos públicas são visíveis para todos"
ON user_photos FOR SELECT
USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir suas próprias fotos"
ON user_photos FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias fotos"
ON user_photos FOR UPDATE
USING (auth.uid() = user_id);

-- Política RLS para photo_likes
ALTER TABLE photo_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Likes são visíveis para todos"
ON photo_likes FOR SELECT
USING (true);

CREATE POLICY "Usuários podem curtir fotos"
ON photo_likes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem remover seus likes"
ON photo_likes FOR DELETE
USING (auth.uid() = user_id);

-- Política RLS para photo_comments
ALTER TABLE photo_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comentários públicos são visíveis"
ON photo_comments FOR SELECT
USING (is_deleted = false);

CREATE POLICY "Usuários podem comentar"
ON photo_comments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem editar seus comentários"
ON photo_comments FOR UPDATE
USING (auth.uid() = user_id);

-- Índices para performance
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
