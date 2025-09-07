-- Criar tabela para armazenar links de fotos do Google Photos
CREATE TABLE IF NOT EXISTS google_photos_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  is_public BOOLEAN DEFAULT true,
  likes_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Criar índices para otimizar consultas
CREATE INDEX IF NOT EXISTS idx_google_photos_links_user_id ON google_photos_links(user_id);
CREATE INDEX IF NOT EXISTS idx_google_photos_links_created_at ON google_photos_links(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_google_photos_links_public ON google_photos_links(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_google_photos_links_category ON google_photos_links(category) WHERE category IS NOT NULL;

-- Garantir que um usuário não pode adicionar o mesmo link duas vezes
CREATE UNIQUE INDEX IF NOT EXISTS idx_google_photos_links_user_url ON google_photos_links(user_id, url);

-- Habilitar RLS (Row Level Security)
ALTER TABLE google_photos_links ENABLE ROW LEVEL SECURITY;

-- Política para que usuários vejam apenas suas próprias fotos privadas + todas as públicas
CREATE POLICY "Users can view their own links and public links" ON google_photos_links
  FOR SELECT USING (
    user_id = auth.uid() OR is_public = true
  );

-- Política para que usuários possam inserir apenas suas próprias fotos
CREATE POLICY "Users can insert their own links" ON google_photos_links
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Política para que usuários possam atualizar apenas suas próprias fotos
CREATE POLICY "Users can update their own links" ON google_photos_links
  FOR UPDATE USING (user_id = auth.uid());

-- Política para que usuários possam deletar apenas suas próprias fotos
CREATE POLICY "Users can delete their own links" ON google_photos_links
  FOR DELETE USING (user_id = auth.uid());

-- Função para atualizar automaticamente updated_at
CREATE OR REPLACE FUNCTION update_google_photos_links_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para executar a função de atualização
CREATE TRIGGER update_google_photos_links_updated_at
  BEFORE UPDATE ON google_photos_links
  FOR EACH ROW
  EXECUTE FUNCTION update_google_photos_links_updated_at();

-- Comentários da tabela
COMMENT ON TABLE google_photos_links IS 'Tabela para armazenar links de fotos do Google Photos compartilhadas pelos usuários';
COMMENT ON COLUMN google_photos_links.user_id IS 'ID do usuário que adicionou o link';
COMMENT ON COLUMN google_photos_links.url IS 'URL da foto no Google Photos';
COMMENT ON COLUMN google_photos_links.title IS 'Título da foto';
COMMENT ON COLUMN google_photos_links.description IS 'Descrição opcional da foto';
COMMENT ON COLUMN google_photos_links.category IS 'Categoria da foto';
COMMENT ON COLUMN google_photos_links.is_public IS 'Se a foto está visível publicamente';
COMMENT ON COLUMN google_photos_links.likes_count IS 'Número de curtidas';
COMMENT ON COLUMN google_photos_links.views_count IS 'Número de visualizações';
COMMENT ON COLUMN google_photos_links.comments_count IS 'Número de comentários';
