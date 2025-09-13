-- Tabela para armazenar posts do blog
CREATE TABLE IF NOT EXISTS blog_posts (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  content TEXT NOT NULL,
  excerpt TEXT,
  featured_image_url TEXT,
  category VARCHAR(100) DEFAULT 'geral',
  tags TEXT[], -- Array de tags
  status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'published', 'archived'
  is_featured BOOLEAN DEFAULT FALSE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_author ON blog_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at);
CREATE INDEX IF NOT EXISTS idx_blog_posts_is_featured ON blog_posts(is_featured);

-- Tabela para likes dos posts do blog
CREATE TABLE IF NOT EXISTS blog_post_likes (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, profile_id)
);

-- Tabela para comentários dos posts do blog
CREATE TABLE IF NOT EXISTS blog_post_comments (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  parent_id INTEGER REFERENCES blog_post_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'approved', -- 'approved', 'pending', 'rejected'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para comentários
CREATE INDEX IF NOT EXISTS idx_blog_comments_post ON blog_post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_comments_author ON blog_post_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_blog_comments_parent ON blog_post_comments(parent_id);

-- Tabela para visualizações dos posts (para analytics)
CREATE TABLE IF NOT EXISTS blog_post_views (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para views
CREATE INDEX IF NOT EXISTS idx_blog_views_post ON blog_post_views(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_views_profile ON blog_post_views(profile_id);
CREATE INDEX IF NOT EXISTS idx_blog_views_created_at ON blog_post_views(created_at);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para blog_posts
DROP TRIGGER IF EXISTS update_blog_posts_updated_at ON blog_posts;
CREATE TRIGGER update_blog_posts_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para blog_post_comments  
DROP TRIGGER IF EXISTS update_blog_comments_updated_at ON blog_post_comments;
CREATE TRIGGER update_blog_comments_updated_at
  BEFORE UPDATE ON blog_post_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) para blog_posts
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Policy: Todos podem ler posts publicados
CREATE POLICY "Everyone can read published blog posts"
ON blog_posts FOR SELECT
USING (status = 'published');

-- Policy: Autores podem ver seus próprios posts (incluindo rascunhos)
CREATE POLICY "Authors can view their own blog posts"
ON blog_posts FOR SELECT
USING (author_id = auth.uid());

-- Policy: Autores podem criar posts
CREATE POLICY "Authors can create blog posts"
ON blog_posts FOR INSERT
WITH CHECK (author_id = auth.uid());

-- Policy: Autores podem atualizar seus próprios posts
CREATE POLICY "Authors can update their own blog posts"
ON blog_posts FOR UPDATE
USING (author_id = auth.uid());

-- Policy: Autores podem deletar seus próprios posts
CREATE POLICY "Authors can delete their own blog posts"
ON blog_posts FOR DELETE
USING (author_id = auth.uid());

-- RLS para blog_post_likes
ALTER TABLE blog_post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can read blog post likes"
ON blog_post_likes FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can like blog posts"
ON blog_post_likes FOR INSERT
WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can remove their own likes"
ON blog_post_likes FOR DELETE
USING (profile_id = auth.uid());

-- RLS para blog_post_comments
ALTER TABLE blog_post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can read approved blog comments"
ON blog_post_comments FOR SELECT
USING (status = 'approved');

CREATE POLICY "Authors can view their own blog comments"
ON blog_post_comments FOR SELECT
USING (author_id = auth.uid());

CREATE POLICY "Authenticated users can create blog comments"
ON blog_post_comments FOR INSERT
WITH CHECK (author_id = auth.uid());

CREATE POLICY "Users can update their own blog comments"
ON blog_post_comments FOR UPDATE
USING (author_id = auth.uid());

CREATE POLICY "Users can delete their own blog comments"
ON blog_post_comments FOR DELETE
USING (author_id = auth.uid());

-- RLS para blog_post_views
ALTER TABLE blog_post_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create blog post views"
ON blog_post_views FOR INSERT
WITH CHECK (true);

-- Inserir alguns posts de exemplo
INSERT INTO blog_posts (
  title, 
  slug, 
  content, 
  excerpt,
  category,
  tags,
  status,
  is_featured,
  author_id,
  published_at
) VALUES 
(
  'Como o Orkut Revolucionou as Redes Sociais',
  'como-orkut-revolucionou-redes-sociais',
  '# Como o Orkut Revolucionou as Redes Sociais

O Orkut foi muito mais do que apenas uma rede social - foi um fenômeno cultural que transformou a forma como nos conectamos online. Lançado em 2004, a plataforma criada por Orkut Büyükkökten rapidamente se tornou a rede social mais popular do Brasil.

## O Pioneirismo das Comunidades

Uma das principais inovações do Orkut foram as **comunidades temáticas**. Antes do Facebook e outras redes sociais modernas, o Orkut já permitia que usuários se reunissem em grupos baseados em interesses comuns, desde "Eu odeio acordar cedo" até comunidades técnicas sobre programação.

## O Sistema de Relacionamentos

O conceito de "melhores amigos" e a possibilidade de classificar relacionamentos foi revolucionário. O famoso "Top 8" criou uma nova dinâmica social digital, onde a posição na lista de amigos tinha significado real.

## Impacto Cultural no Brasil

No Brasil, o Orkut se tornou mais do que uma ferramenta - virou parte da cultura digital brasileira. Frases como "só aceito amigos que conheço pessoalmente" e os famosos scraps marcaram uma geração.

## Legado e Influência

Muitos recursos que consideramos normais hoje em redes sociais foram pioneirizados pelo Orkut:

- Sistema de comunidades
- Perfis personalizáveis
- Interações públicas (scraps)
- Rankings e estatísticas sociais

O Orkut pode ter saído do ar em 2014, mas seu legado continua influenciando as redes sociais modernas. Este novo Orkut BR busca resgatar essa essência, combinando a nostalgia com tecnologias modernas.',
  'Relembre a história da rede social que marcou uma geração e inspire-se com os novos recursos do Orkut BR moderno.',
  'historia',
  ARRAY['orkut', 'redes sociais', 'história', 'brasil', 'nostalgia'],
  'published',
  true,
  (SELECT id FROM profiles WHERE email LIKE '%admin%' OR role = 'admin' LIMIT 1),
  NOW() - INTERVAL '2 days'
),
(
  'Recursos de Chamada de Voz: O Futuro da Comunicação Social',
  'recursos-chamada-voz-futuro-comunicacao',
  '# Recursos de Chamada de Voz: O Futuro da Comunicação Social

A comunicação digital evoluiu drasticamente desde os primórdios das redes sociais. Hoje, no Orkut BR, estamos introduzindo recursos de chamada de voz que revolucionam a forma como nos conectamos online.

## Por que Chamadas de Voz?

Enquanto outras redes sociais focam em posts e mensagens de texto, acreditamos que a **comunicação por voz** traz uma dimensão mais humana e autêntica para as interações digitais.

### Benefícios das Chamadas de Voz:

1. **Comunicação mais Natural**: A voz transmite emoções e nuances que o texto não consegue
2. **Conexões Mais Profundas**: Conversas por voz criam vínculos mais fortes
3. **Acessibilidade**: Facilita a comunicação para usuários com diferentes necessidades
4. **Multitasking**: Permite conversar enquanto realiza outras atividades

## Como Funciona no Orkut BR

Nosso sistema de chamadas integra-se perfeitamente com a experiência social:

- **Chamadas Diretas**: Clique no perfil de um amigo e inicie uma chamada instantaneamente
- **Chamadas em Grupo**: Converse com vários amigos ao mesmo tempo
- **Status de Presença**: Veja quando seus amigos estão disponíveis para conversar
- **Histórico de Chamadas**: Mantenha registro de suas conversas importantes

## Privacidade e Controle

Entendemos que privacidade é fundamental:

- Controle total sobre quem pode te ligar
- Modo "Não Perturbe" para momentos de foco
- Bloqueio de chamadas indesejadas
- Gravação opcional (apenas com consentimento)

## O Futuro da Comunicação Social

As chamadas de voz no Orkut BR são apenas o início. Estamos desenvolvendo recursos ainda mais inovadores para tornar a comunicação online mais rica e significativa.

Experimente hoje mesmo e redescubra o prazer de uma conversa genuína!',
  'Descubra como usar as novas funcionalidades de comunicação em tempo real do Orkut BR.',
  'tecnologia',
  ARRAY['chamadas', 'voz', 'comunicação', 'tecnologia', 'inovação'],
  'published',
  true,
  (SELECT id FROM profiles WHERE email LIKE '%admin%' OR role = 'admin' LIMIT 1),
  NOW() - INTERVAL '1 day'
),
(
  'Guia Completo: Como Criar uma Comunidade de Sucesso',
  'guia-criar-comunidade-sucesso',
  '# Guia Completo: Como Criar uma Comunidade de Sucesso no Orkut BR

As comunidades são o coração do Orkut BR. Seja você um entusiasta de culinária, fã de tecnologia ou apaixonado por música, criar uma comunidade ativa e engajada requer estratégia e dedicação.

## Passo 1: Definindo o Propósito

Antes de criar sua comunidade, pergunte-se:
- Qual problema ou interesse a comunidade vai abordar?
- Quem é o público-alvo?
- Que valor único você pode oferecer?

## Passo 2: Nome e Descrição Atraentes

Um bom nome é meio caminho andado:
- **Seja descritivo mas criativo**
- **Evite nomes muito longos**
- **Use keywords que pessoas buscariam**

## Passo 3: Estabelecendo Regras Claras

Comunidades bem-sucedidas têm diretrizes claras:
1. Respeito mútuo entre membros
2. Conteúdo relevante ao tema
3. Proibição de spam
4. Consequências para violações

## Passo 4: Conteúdo de Qualidade

Content is king! Algumas dicas:
- **Poste regularmente** mas sem spam
- **Faça perguntas** que geram discussão
- **Compartilhe recursos úteis**
- **Celebre conquistas dos membros**

## Passo 5: Engajamento e Moderação

Seja um moderador ativo:
- Responda comentários rapidamente
- Reconheça contribuições valiosas
- Medere conflitos com diplomacia
- Promova discussões saudáveis

## Ferramentas Disponíveis no Orkut BR

Nossa plataforma oferece recursos especiais para comunidades:

### Para Criadores:
- Analytics detalhados de engagement
- Ferramentas de moderação avançadas
- Sistema de badges e recompensas
- Integração com recursos de voz

### Para Membros:
- Notificações personalizáveis
- Sistema de reputação
- Eventos e encontros
- Subgrupos temáticos

## Casos de Sucesso

Algumas comunidades que estão fazendo a diferença:

- **"Desenvolvedores Brasil"**: 5.000+ membros ativos
- **"Receitas da Vovó"**: Compartilhamento diário de receitas
- **"Fotografia Urbana"**: Desafios semanais criativos

## Monetização Ética

Para comunidades grandes, considere:
- Parcerias com marcas relevantes
- Produtos digitais (cursos, e-books)
- Assinatura premium para conteúdo exclusivo
- Sempre mantenha transparência!

## Conclusão

Criar uma comunidade de sucesso leva tempo, mas os resultados são recompensadores. Você não está apenas criando um grupo online - está construindo uma rede de pessoas que compartilham paixões similares.

Comece pequeno, seja consistente e veja sua comunidade florescer!',
  'Aprenda a criar e gerenciar comunidades que engajam e crescem organicamente.',
  'guias',
  ARRAY['comunidades', 'engajamento', 'moderação', 'criação de conteúdo'],
  'published',
  false,
  (SELECT id FROM profiles WHERE email LIKE '%admin%' OR role = 'admin' LIMIT 1),
  NOW() - INTERVAL '3 hours'
);
