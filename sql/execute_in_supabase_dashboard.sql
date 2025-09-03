-- Execute este SQL no Supabase Dashboard > SQL Editor
-- Para configurar completamente o sistema de fotos

-- 1. Criar função para buscar fotos otimizada
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

-- 2. Criar função para incrementar views
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

-- 3. Habilitar RLS nas tabelas (se ainda não estiver)
ALTER TABLE user_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_comments ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas RLS (usar CREATE OR REPLACE para evitar conflitos)
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

-- Políticas para likes
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

-- Políticas para comentários
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

-- 5. Criar índices para performance
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

-- 6. Criar algumas fotos de exemplo (opcional - remover se não quiser)
DO $$
DECLARE
    user_count integer;
    admin_user_id uuid;
BEGIN
    -- Verificar se há usuários
    SELECT COUNT(*) INTO user_count FROM profiles;
    
    IF user_count > 0 THEN
        -- Pegar o primeiro usuário (admin)
        SELECT id INTO admin_user_id FROM profiles ORDER BY created_at LIMIT 1;
        
        -- Inserir fotos de exemplo apenas se não existirem fotos
        IF NOT EXISTS (SELECT 1 FROM user_photos LIMIT 1) THEN
            INSERT INTO user_photos (
                id, user_id, url, thumbnail_url, preview_url, title, description, 
                category, is_public, is_processed, views_count
            ) VALUES
            (
                gen_random_uuid(),
                admin_user_id,
                'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?auto=compress&cs=tinysrgb&w=800',
                'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
                'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?auto=compress&cs=tinysrgb&w=600',
                'Pôr do Sol na Praia',
                'Uma linda vista do pôr do sol na praia durante o verão',
                'natureza',
                true,
                true,
                25
            ),
            (
                gen_random_uuid(),
                admin_user_id,
                'https://images.pexels.com/photos/1640772/pexels-photo-1640772.jpeg?auto=compress&cs=tinysrgb&w=800',
                'https://images.pexels.com/photos/1640772/pexels-photo-1640772.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
                'https://images.pexels.com/photos/1640772/pexels-photo-1640772.jpeg?auto=compress&cs=tinysrgb&w=600',
                'Café da Manhã Saudável',
                'Delicioso café da manhã com frutas e aveia',
                'culinaria',
                true,
                true,
                18
            ),
            (
                gen_random_uuid(),
                admin_user_id,
                'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=800',
                'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
                'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=600',
                'Paisagem Urbana',
                'Vista incrível da cidade ao anoitecer',
                'lifestyle',
                true,
                true,
                42
            );
            
            RAISE NOTICE 'Fotos de exemplo inseridas com sucesso!';
        ELSE
            RAISE NOTICE 'Fotos já existem, pular inserção de exemplos.';
        END IF;
    ELSE
        RAISE NOTICE 'Nenhum usuário encontrado, pular inserção de fotos de exemplo.';
    END IF;
END $$;

-- Mensagem final
DO $$
BEGIN
    RAISE NOTICE '✅ Configuração do sistema de fotos concluída!';
    RAISE NOTICE '🎯 Sistema pronto para uso completo';
    RAISE NOTICE '📁 Certifique-se que o bucket "user-photos" existe no Storage';
END $$;
