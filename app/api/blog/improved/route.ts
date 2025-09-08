import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Cliente Supabase para servidor
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Verificar se as variáveis estão configuradas
const hasValidSupabase = supabaseUrl && 
  !supabaseUrl.includes('placeholder') && 
  supabaseUrl.startsWith('https://') && 
  supabaseServiceKey

// Criar cliente apenas se configurado corretamente
const supabase = hasValidSupabase 
  ? createClient(supabaseUrl!, supabaseServiceKey!)
  : null

// Posts de demonstração para quando a tabela não existe
const demoPosts = [
  {
    id: 'demo-1',
    title: 'Bem-vindos ao Blog do Orkut BR! 🎉',
    slug: 'bem-vindos-ao-blog-do-orkut-br',
    excerpt: 'Este é o primeiro post do nosso blog! Aqui você poderá compartilhar suas histórias, ideias e conectar-se com a comunidade.',
    content: `# Bem-vindos ao Blog do Orkut BR! 🎉

Estamos muito felizes em apresentar o novo blog do Orkut BR! Este é um espaço dedicado à nossa comunidade, onde você pode:

## O que você pode fazer aqui:

- ✍️ **Escrever posts** sobre seus interesses
- 📸 **Compartilhar histórias** e experiências  
- 💬 **Interagir** com outros membros
- 🏷️ **Usar tags** para organizar conteúdo

## Como começar:

1. Clique em "Criar Post" 
2. Escreva seu título e conteúdo
3. Adicione tags relevantes
4. Publique e compartilhe com a comunidade!

Estamos ansiosos para ver o que vocês vão compartilhar! 💜

---

*Equipe Orkut BR*`,
    featured_image_url: '/logoorkut.png',
    category: 'anuncios',
    tags: ['orkut', 'blog', 'comunidade', 'bem-vindos'],
    status: 'published',
    is_featured: true,
    views_count: 1500,
    likes_count: 89,
    comments_count: 23,
    published_at: new Date('2024-01-01T10:00:00Z').toISOString(),
    created_at: new Date('2024-01-01T10:00:00Z').toISOString(),
    updated_at: new Date('2024-01-01T10:00:00Z').toISOString(),
    profiles: {
      id: 'orkut-team',
      display_name: 'Equipe Orkut BR',
      username: 'orkut-team',
      photo_url: '/logoorkut.png'
    }
  },
  {
    id: 'demo-2', 
    title: 'Como usar o Blog do Orkut - Guia Completo',
    slug: 'como-usar-o-blog-do-orkut-guia-completo',
    excerpt: 'Aprenda tudo sobre como criar, publicar e gerenciar seus posts no Blog do Orkut. Um guia completo para iniciantes.',
    content: `# Como usar o Blog do Orkut - Guia Completo

## Criando seu primeiro post

Para criar um post no Blog do Orkut, siga estes passos simples:

### 1. Acesse a página de criação
- Clique no botão "Criar Post" na página principal do blog
- Você será redirecionado para o editor

### 2. Preencha as informações básicas
- **Título**: Seja criativo e descritivo
- **Conteúdo**: Use quebras de linha para facilitar a leitura
- **Resumo**: (Opcional) Será gerado automaticamente se não preenchido

### 3. Configure as opções avançadas
- **Imagem destacada**: Adicione uma URL de imagem
- **Tags**: Ajudam outros usuários a encontrar seu post
- **Status**: Escolha entre "Rascunho" e "Publicado"

### 4. Publique ou salve como rascunho
- Use "Salvar Rascunho" para editar depois
- Use "Publicar Post" para tornar público imediatamente

## Dicas para posts de sucesso

- ✅ Use títulos atrativos
- ✅ Organize o conteúdo com subtítulos 
- ✅ Adicione tags relevantes
- ✅ Interaja com comentários dos leitores

Boa sorte com seus posts! 🚀`,
    featured_image_url: 'https://images.pexels.com/photos/265667/pexels-photo-265667.jpeg?auto=compress&cs=tinysrgb&w=800',
    category: 'tutorial',
    tags: ['tutorial', 'como-usar', 'blog', 'guia'],
    status: 'published',
    is_featured: false,
    views_count: 892,
    likes_count: 45,
    comments_count: 12,
    published_at: new Date('2024-01-02T14:30:00Z').toISOString(),
    created_at: new Date('2024-01-02T14:30:00Z').toISOString(),
    updated_at: new Date('2024-01-02T14:30:00Z').toISOString(),
    profiles: {
      id: 'orkut-team',
      display_name: 'Equipe Orkut BR',
      username: 'orkut-team', 
      photo_url: '/logoorkut.png'
    }
  },
  {
    id: 'demo-3',
    title: 'Novidades e Atualizações da Plataforma',
    slug: 'novidades-e-atualizacoes-da-plataforma',
    excerpt: 'Fique por dentro das últimas novidades e melhorias que implementamos na plataforma Orkut BR.',
    content: `# Novidades e Atualizações da Plataforma

## 🆕 Últimas atualizações

### Sistema de Fotos Melhorado
- Correção na API de fotos
- Performance otimizada
- Melhor experiência de upload

### Blog Totalmente Funcional  
- Sistema de posts completo
- Editor intuitivo
- Sistema de tags e categorias
- Comentários e interações

### Interface Aprimorada
- Design mais responsivo
- Melhorias na navegação
- Componentes UI mais elegantes

## 🔧 Correções Técnicas

- ✅ API de fotos estabilizada
- ✅ Sistema de autenticação melhorado  
- ✅ Performance geral otimizada
- ✅ Compatibilidade com diferentes dispositivos

## 🚀 Próximas funcionalidades

Estamos trabalhando em:

- 📱 **App mobile nativo**
- 🎵 **Player de música integrado** 
- 💬 **Chat em tempo real**
- 🎮 **Jogos da comunidade**

Obrigado por fazer parte da nossa comunidade! ❤️`,
    featured_image_url: 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=800',
    category: 'atualizacoes',
    tags: ['novidades', 'atualizacoes', 'melhorias', 'plataforma'],
    status: 'published',
    is_featured: true,
    views_count: 2341,
    likes_count: 156,
    comments_count: 34,
    published_at: new Date('2024-01-03T16:45:00Z').toISOString(),
    created_at: new Date('2024-01-03T16:45:00Z').toISOString(), 
    updated_at: new Date('2024-01-03T16:45:00Z').toISOString(),
    profiles: {
      id: 'orkut-team',
      display_name: 'Equipe Orkut BR',
      username: 'orkut-team',
      photo_url: '/logoorkut.png'
    }
  }
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parâmetros de consulta
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50)
    const search = searchParams.get('search')
    const tag = searchParams.get('tag')
    const category = searchParams.get('category')
    const featured = searchParams.get('featured') === 'true'
    const status = searchParams.get('status') || 'published'
    
    const offset = (page - 1) * limit

    // Tentar usar Supabase se disponível
    if (hasValidSupabase && supabase) {
      try {
        console.log('🔄 Tentando carregar posts do Supabase...')
        
        let query = supabase
          .from('blog_posts')
          .select(`
            id,
            title,
            slug,
            excerpt,
            featured_image_url,
            category,
            tags,
            status,
            is_featured,
            views_count,
            likes_count,
            comments_count,
            published_at,
            created_at,
            updated_at,
            profiles:author_id (
              id,
              display_name,
              username,
              photo_url
            )
          `)
          .eq('status', 'published')
          .order('published_at', { ascending: false })

        // Aplicar filtros
        if (search) {
          query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%,excerpt.ilike.%${search}%`)
        }
        if (tag) {
          query = query.contains('tags', [tag])
        }
        if (category) {
          query = query.eq('category', category)
        }
        if (featured) {
          query = query.eq('is_featured', true)
        }

        const { data: posts, error } = await query.range(offset, offset + limit - 1)

        if (!error && posts) {
          // Contar total
          let countQuery = supabase
            .from('blog_posts')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'published')
          
          if (search) countQuery = countQuery.or(`title.ilike.%${search}%,content.ilike.%${search}%,excerpt.ilike.%${search}%`)
          if (tag) countQuery = countQuery.contains('tags', [tag])
          if (category) countQuery = countQuery.eq('category', category)
          if (featured) countQuery = countQuery.eq('is_featured', true)

          const { count } = await countQuery

          console.log(`✅ Posts carregados do Supabase: ${posts.length}`)

          return NextResponse.json({
            success: true,
            posts: posts || [],
            pagination: {
              page,
              limit,
              totalPosts: count || 0,
              totalPages: Math.ceil((count || 0) / limit),
              hasNextPage: page < Math.ceil((count || 0) / limit),
              hasPrevPage: page > 1
            },
            source: 'database'
          })
        } else {
          console.warn('⚠️ Erro no Supabase, usando posts demo:', error?.message)
          throw new Error('Fallback to demo')
        }
      } catch (supabaseError) {
        console.warn('⚠️ Supabase não disponível, usando posts demo')
      }
    }

    // Fallback para posts de demonstração
    console.log('📝 Usando posts de demonstração')
    
    let filteredPosts = demoPosts.filter(post => post.status === 'published')

    // Aplicar filtros
    if (search) {
      const searchLower = search.toLowerCase()
      filteredPosts = filteredPosts.filter(post => 
        post.title.toLowerCase().includes(searchLower) ||
        post.excerpt.toLowerCase().includes(searchLower) ||
        post.content.toLowerCase().includes(searchLower)
      )
    }
    
    if (tag) {
      filteredPosts = filteredPosts.filter(post => 
        post.tags.includes(tag.toLowerCase())
      )
    }
    
    if (category) {
      filteredPosts = filteredPosts.filter(post => post.category === category)
    }
    
    if (featured) {
      filteredPosts = filteredPosts.filter(post => post.is_featured)
    }

    // Aplicar paginação
    const totalPosts = filteredPosts.length
    const totalPages = Math.ceil(totalPosts / limit)
    const paginatedPosts = filteredPosts.slice(offset, offset + limit)

    return NextResponse.json({
      success: true,
      posts: paginatedPosts,
      pagination: {
        page,
        limit,
        totalPosts,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      source: 'demo',
      message: 'Usando posts de demonstração - Para funcionalidade completa, configure a tabela blog_posts no Supabase'
    })

  } catch (error) {
    console.error('Erro na API de blog melhorada:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar se há Supabase configurado
    if (!hasValidSupabase || !supabase) {
      return NextResponse.json(
        { 
          error: 'Funcionalidade não disponível',
          details: 'Para criar posts, configure o Supabase e execute a migração da tabela blog_posts',
          migration_needed: true
        },
        { status: 503 }
      )
    }

    const body = await request.json()
    const {
      title,
      content,
      excerpt,
      category = 'geral',
      tags = [],
      status = 'draft',
      is_featured = false,
      featured_image_url,
    } = body

    // Validações
    if (!title || !content) {
      return NextResponse.json(
        { error: 'Título e conteúdo são obrigatórios' },
        { status: 400 }
      )
    }

    // Gerar slug
    const slug = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')

    // Verificar autenticação (simulada para demo)
    const authHeader = request.headers.get('authorization')
    let authorId = 'demo-user'
    
    if (authHeader) {
      // Em produção, decodificar JWT aqui
      authorId = 'authenticated-user'
    }

    // Tentar salvar no Supabase
    try {
      const { data: newPost, error } = await supabase
        .from('blog_posts')
        .insert({
          title,
          slug,
          content,
          excerpt: excerpt || content.substring(0, 200) + '...',
          category,
          tags,
          status,
          is_featured,
          featured_image_url,
          published_at: status === 'published' ? new Date().toISOString() : null,
          author_id: authorId
        })
        .select(`
          id,
          title,
          slug,
          excerpt,
          category,
          tags,
          status,
          is_featured,
          created_at,
          published_at,
          profiles:author_id (
            id,
            display_name,
            username,
            photo_url
          )
        `)
        .single()

      if (error) throw error

      return NextResponse.json({
        success: true,
        post: newPost,
        message: 'Post criado com sucesso!'
      }, { status: 201 })

    } catch (dbError) {
      console.error('Erro ao salvar post no banco:', dbError)
      return NextResponse.json(
        { 
          error: 'Erro ao salvar post',
          details: 'Configure a tabela blog_posts no Supabase',
          migration_needed: true
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Erro na criação de post:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
