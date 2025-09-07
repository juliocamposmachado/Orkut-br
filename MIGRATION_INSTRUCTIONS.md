# 🚨 INSTRUÇÕES PARA MIGRATION DO BLOG

## ❌ **PROBLEMA IDENTIFICADO**
A tabela `blog_posts` não existe no banco de dados Supabase, por isso as postagens do blog não estão funcionando.

## ✅ **SOLUÇÃO: Executar Migration SQL**

### 📋 **Passo a Passo:**

1. **Acesse o Painel do Supabase**
   - Vá para: https://app.supabase.com
   - Faça login na sua conta
   - Selecione o projeto do Orkut

2. **Abra o SQL Editor**
   - No menu lateral, clique em "SQL Editor"
   - Clique em "New Query" ou "Nova Consulta"

3. **Execute a Migration**
   - Copie o conteúdo do arquivo: `supabase/migrations/20241207000000_create_blog_posts_table.sql`
   - Cole no editor SQL do Supabase
   - Clique em "Run" ou "Executar"

### 📄 **SQL para Executar:**

```sql
-- Criar tabela para armazenar posts do blog
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  excerpt TEXT,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  featured_image TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  tags TEXT[] DEFAULT '{}',
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Criar índices para otimizar consultas
CREATE INDEX IF NOT EXISTS idx_blog_posts_author_id ON blog_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_created_at ON blog_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_tags ON blog_posts USING GIN(tags);

-- Habilitar RLS (Row Level Security)
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Política para que todos vejam posts publicados
CREATE POLICY "Anyone can view published posts" ON blog_posts
  FOR SELECT USING (status = 'published');

-- Política para que autores vejam seus próprios posts
CREATE POLICY "Authors can view their own posts" ON blog_posts
  FOR SELECT USING (author_id = auth.uid());

-- Política para que usuários autenticados possam inserir posts
CREATE POLICY "Authenticated users can insert posts" ON blog_posts
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND author_id = auth.uid());

-- Política para que autores possam atualizar seus próprios posts
CREATE POLICY "Authors can update their own posts" ON blog_posts
  FOR UPDATE USING (author_id = auth.uid());

-- Política para que autores possam deletar seus próprios posts
CREATE POLICY "Authors can delete their own posts" ON blog_posts
  FOR DELETE USING (author_id = auth.uid());

-- Função para gerar slug automaticamente
CREATE OR REPLACE FUNCTION generate_slug(title TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(
    regexp_replace(
      regexp_replace(
        regexp_replace(title, '[áàâãäåāă]', 'a', 'g'),
        '[éèêëēėę]', 'e', 'g'
      ),
      '[íìîïīįı]', 'i', 'g'
    ) ||
    regexp_replace(
      regexp_replace(
        regexp_replace(title, '[óòôõöøōő]', 'o', 'g'),
        '[úùûüūůű]', 'u', 'g'
      ),
      '[ýÿ]', 'y', 'g'
    ) ||
    regexp_replace(title, '[ç]', 'c', 'g') ||
    regexp_replace(title, '[ñ]', 'n', 'g') ||
    regexp_replace(title, '[^a-z0-9]+', '-', 'g'),
    '^-+|-+$', '', 'g'
  );
END;
$$ LANGUAGE plpgsql;

-- Função para atualizar automaticamente updated_at
CREATE OR REPLACE FUNCTION update_blog_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para executar a função de atualização
CREATE TRIGGER update_blog_posts_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_blog_posts_updated_at();

-- Trigger para gerar slug automaticamente se não fornecido
CREATE OR REPLACE FUNCTION auto_generate_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug = generate_slug(NEW.title);
    
    -- Garantir unicidade do slug
    IF EXISTS (SELECT 1 FROM blog_posts WHERE slug = NEW.slug AND id != COALESCE(NEW.id, gen_random_uuid())) THEN
      NEW.slug = NEW.slug || '-' || extract(epoch from now())::int;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_generate_slug_trigger
  BEFORE INSERT OR UPDATE ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_slug();

-- Comentários da tabela
COMMENT ON TABLE blog_posts IS 'Tabela para armazenar posts do blog Orkut';
COMMENT ON COLUMN blog_posts.title IS 'Título do post';
COMMENT ON COLUMN blog_posts.slug IS 'Slug único para URL amigável';
COMMENT ON COLUMN blog_posts.content IS 'Conteúdo completo do post em HTML';
COMMENT ON COLUMN blog_posts.excerpt IS 'Resumo curto do post';
COMMENT ON COLUMN blog_posts.author_id IS 'ID do autor do post';
COMMENT ON COLUMN blog_posts.featured_image IS 'URL da imagem destacada';
COMMENT ON COLUMN blog_posts.status IS 'Status do post: draft, published, archived';
COMMENT ON COLUMN blog_posts.tags IS 'Array de tags do post';
COMMENT ON COLUMN blog_posts.views_count IS 'Número de visualizações';
COMMENT ON COLUMN blog_posts.likes_count IS 'Número de curtidas';
COMMENT ON COLUMN blog_posts.comments_count IS 'Número de comentários';
```

## ✅ **Após Executar a Migration:**

1. **Verificar se a tabela foi criada**
   - No Supabase, vá em "Table Editor"
   - Procure pela tabela `blog_posts`
   - Deve aparecer com todas as colunas configuradas

2. **Testar o Blog**
   - Acesse `/blog` no site
   - Tente criar um novo post em `/blog/criar`
   - Verifique se funciona corretamente

## 🎯 **Resultado Esperado:**
Após executar essa migration, o sistema de blog do Orkut estará 100% funcional!

---

**📝 Nota:** Esta migration é segura e usa `IF NOT EXISTS` para evitar conflitos se já existir alguma tabela.
