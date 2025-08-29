-- ===================================================================
-- ADICIONAR SISTEMA DE FOTOS AO BANCO EXISTENTE (VERSÃO CORRIGIDA)
-- ===================================================================
-- Execute este SQL no seu Supabase para adicionar apenas as tabelas
-- de fotos ao banco que já existe

-- ===================================================================
-- VERIFICAR SE TABELA USER_PROFILES EXISTE (necessária para o sistema)
-- ===================================================================
-- Se você não tiver a tabela user_profiles, descomente as linhas abaixo:

/*
CREATE TABLE IF NOT EXISTS user_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    bio TEXT,
    avatar_url TEXT,
    website TEXT,
    location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
*/

-- ===================================================================
-- TABELA PRINCIPAL DE FOTOS
-- ===================================================================
CREATE TABLE IF NOT EXISTS user_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- URLs das diferentes versões da imagem
    url TEXT NOT NULL,                    -- Imagem original
    preview_url TEXT,                     -- Versão para preview (800x600)
    thumbnail_url TEXT,                   -- Miniatura (300x300)
    
    -- Metadados da foto
    title VARCHAR(200) NOT NULL DEFAULT 'Nova foto',
    description TEXT,
    category VARCHAR(50),
    
    -- Informações técnicas
    file_size BIGINT NOT NULL DEFAULT 0,
    width INTEGER,
    height INTEGER,
    mime_type VARCHAR(100),
    file_path TEXT NOT NULL DEFAULT '',  -- Valor padrão para evitar NULL
    
    -- Flags de controle
    is_public BOOLEAN NOT NULL DEFAULT true,
    is_processed BOOLEAN NOT NULL DEFAULT false,
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    
    -- Contadores para performance (desnormalizado)
    likes_count INTEGER NOT NULL DEFAULT 0,
    comments_count INTEGER NOT NULL DEFAULT 0,
    views_count INTEGER NOT NULL DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================================================
-- TABELA DE LIKES EM FOTOS
-- ===================================================================
CREATE TABLE IF NOT EXISTS photo_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    photo_id UUID NOT NULL REFERENCES user_photos(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint para evitar likes duplicados
    CONSTRAINT unique_photo_like UNIQUE (photo_id, user_id)
);

-- ===================================================================
-- TABELA DE COMENTÁRIOS EM FOTOS
-- ===================================================================
CREATE TABLE IF NOT EXISTS photo_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    photo_id UUID NOT NULL REFERENCES user_photos(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================================================
-- TABELA DE VISUALIZAÇÕES (OPCIONAL)
-- ===================================================================
CREATE TABLE IF NOT EXISTS photo_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    photo_id UUID NOT NULL REFERENCES user_photos(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================================================
-- ÍNDICES OTIMIZADOS PARA PERFORMANCE
-- ===================================================================

-- Índices principais para fotos
CREATE INDEX IF NOT EXISTS idx_photos_user_id ON user_photos(user_id);
CREATE INDEX IF NOT EXISTS idx_photos_created_at ON user_photos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_photos_public ON user_photos(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_photos_category ON user_photos(category) WHERE category IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_photos_processed ON user_photos(is_processed) WHERE is_processed = true;

-- Índice composto para queries de listagem otimizada
CREATE INDEX IF NOT EXISTS idx_photos_list_optimized ON user_photos(
    is_processed, is_deleted, is_public, created_at DESC
) WHERE is_processed = true AND is_deleted = false;

-- Índice para busca por categoria + público
CREATE INDEX IF NOT EXISTS idx_photos_category_public ON user_photos(
    category, is_public, created_at DESC
) WHERE is_processed = true AND is_deleted = false AND category IS NOT NULL;

-- Índices para likes
CREATE INDEX IF NOT EXISTS idx_photo_likes_photo_id ON photo_likes(photo_id);
CREATE INDEX IF NOT EXISTS idx_photo_likes_user_id ON photo_likes(user_id);

-- Índices para comentários
CREATE INDEX IF NOT EXISTS idx_photo_comments_photo_id ON photo_comments(photo_id);
CREATE INDEX IF NOT EXISTS idx_photo_comments_user_id ON photo_comments(user_id);

-- ===================================================================
-- STORED PROCEDURES OTIMIZADAS
-- ===================================================================

-- Função para buscar fotos com join otimizado
CREATE OR REPLACE FUNCTION get_photos_optimized(
    p_user_id UUID DEFAULT NULL,
    p_category VARCHAR DEFAULT NULL,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0,
    p_public_only BOOLEAN DEFAULT true
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    url TEXT,
    preview_url TEXT,
    thumbnail_url TEXT,
    title VARCHAR,
    description TEXT,
    category VARCHAR,
    likes_count INTEGER,
    comments_count INTEGER,
    views_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE,
    user_name TEXT,
    user_avatar TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.user_id,
        p.url,
        p.preview_url,
        p.thumbnail_url,
        p.title,
        p.description,
        p.category,
        p.likes_count,
        p.comments_count,
        p.views_count,
        p.created_at,
        -- Usar email como fallback se não tiver user_profiles
        COALESCE(prof.display_name, u.email) as user_name,
        prof.avatar_url as user_avatar
    FROM user_photos p
    JOIN auth.users u ON p.user_id = u.id
    LEFT JOIN user_profiles prof ON p.user_id = prof.user_id
    WHERE 
        p.is_processed = true
        AND p.is_deleted = false
        AND (NOT p_public_only OR p.is_public = true)
        AND (p_user_id IS NULL OR p.user_id = p_user_id)
        AND (p_category IS NULL OR p.category = p_category)
    ORDER BY p.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Função para incrementar visualizações
CREATE OR REPLACE FUNCTION increment_photo_views(p_photo_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE user_photos 
    SET views_count = views_count + 1,
        updated_at = NOW()
    WHERE id = p_photo_id 
      AND is_processed = true 
      AND is_deleted = false;
END;
$$ LANGUAGE plpgsql;

-- ===================================================================
-- TRIGGERS PARA MANTER CONTADORES ATUALIZADOS
-- ===================================================================

-- Trigger para atualizar likes_count
CREATE OR REPLACE FUNCTION update_photo_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE user_photos 
        SET likes_count = likes_count + 1,
            updated_at = NOW()
        WHERE id = NEW.photo_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE user_photos 
        SET likes_count = GREATEST(0, likes_count - 1),
            updated_at = NOW()
        WHERE id = OLD.photo_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_photo_likes_count
    AFTER INSERT OR DELETE ON photo_likes
    FOR EACH ROW
    EXECUTE FUNCTION update_photo_likes_count();

-- ===================================================================
-- RLS (ROW LEVEL SECURITY) PARA SEGURANÇA
-- ===================================================================

-- Habilitar RLS na tabela de fotos
ALTER TABLE user_photos ENABLE ROW LEVEL SECURITY;

-- Policy: Todos podem ver fotos públicas
CREATE POLICY "Fotos públicas são visíveis para todos"
    ON user_photos FOR SELECT
    USING (is_public = true AND is_processed = true AND is_deleted = false);

-- Policy: Usuários podem ver suas próprias fotos
CREATE POLICY "Usuários podem ver suas próprias fotos"
    ON user_photos FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Usuários podem inserir suas próprias fotos
CREATE POLICY "Usuários podem inserir suas próprias fotos"
    ON user_photos FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Usuários podem atualizar suas próprias fotos
CREATE POLICY "Usuários podem atualizar suas próprias fotos"
    ON user_photos FOR UPDATE
    USING (auth.uid() = user_id);

-- RLS para likes
ALTER TABLE photo_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem ver likes de fotos públicas"
    ON photo_likes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_photos 
            WHERE id = photo_likes.photo_id 
              AND is_public = true 
              AND is_processed = true 
              AND is_deleted = false
        )
    );

CREATE POLICY "Usuários podem gerenciar seus próprios likes"
    ON photo_likes FOR ALL
    USING (auth.uid() = user_id);

-- ===================================================================
-- CONFIGURAÇÃO DE STORAGE BUCKET
-- ===================================================================

-- Criar bucket para fotos de usuários se não existir
INSERT INTO storage.buckets (id, name, public) 
VALUES ('user-photos', 'user-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Policies para storage
CREATE POLICY "Usuários autenticados podem fazer upload"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'user-photos' 
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Fotos são publicamente visíveis"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'user-photos');

CREATE POLICY "Usuários podem gerenciar suas próprias fotos no storage"
    ON storage.objects FOR ALL
    USING (
        bucket_id = 'user-photos' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- ===================================================================
-- DADOS DE EXEMPLO (OPCIONAL - CORRIGIDO)
-- ===================================================================

-- REMOVI os dados de exemplo que causavam erro
-- O sistema funcionará perfeitamente sem dados iniciais
-- As fotos aparecerão quando os usuários fizerem upload

-- ===================================================================
-- MENSAGEM DE SUCESSO
-- ===================================================================

DO $$
BEGIN
    RAISE NOTICE 'Sistema de fotos instalado com sucesso!';
    RAISE NOTICE 'Tabelas criadas: user_photos, photo_likes, photo_comments, photo_views';
    RAISE NOTICE 'Stored procedures criadas: get_photos_optimized, increment_photo_views';
    RAISE NOTICE 'RLS policies configuradas para segurança';
    RAISE NOTICE 'Storage bucket configurado: user-photos';
    RAISE NOTICE '';
    RAISE NOTICE 'Próximo passo: Acesse /fotos no seu app e faça upload de fotos!';
END $$;
