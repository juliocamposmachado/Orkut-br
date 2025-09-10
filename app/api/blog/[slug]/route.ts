import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

interface RouteParams {
  params: {
    slug: string
  }
}

// Conteúdos dos posts demo
const demoContent1 = '# Bem-vindos ao Blog do Orkut BR! 🎉\n\nEstamos muito felizes em apresentar o novo blog do Orkut BR! Este é um espaço dedicado à nossa comunidade, onde você pode:\n\n## O que você pode fazer aqui:\n\n- ✍️ **Escrever posts** sobre seus interesses\n- 📸 **Compartilhar histórias** e experiências\n- 💬 **Interagir** com outros membros\n- 🏷️ **Usar tags** para organizar conteúdo\n\n## Como começar:\n\n1. Clique em "Criar Post"\n2. Escreva seu título e conteúdo\n3. Adicione tags relevantes\n4. Publique e compartilhe com a comunidade!\n\nEstamos ansiosos para ver o que vocês vão compartilhar! 💜\n\n---\n\n*Equipe Orkut BR*'

const demoContent2 = '# Como usar o Blog do Orkut - Guia Completo\n\n## Criando seu primeiro post\n\nPara criar um post no Blog do Orkut, siga estes passos simples:\n\n### 1. Acesse a página de criação\n- Clique no botão "Criar Post" na página principal do blog\n- Você será redirecionado para o editor\n\n### 2. Preencha as informações básicas\n- **Título**: Seja criativo e descritivo\n- **Conteúdo**: Use quebras de linha para facilitar a leitura\n- **Resumo**: (Opcional) Será gerado automaticamente se não preenchido\n\n### 3. Configure as opções avançadas\n- **Imagem destacada**: Adicione uma URL de imagem\n- **Tags**: Ajudam outros usuários a encontrar seu post\n- **Status**: Escolha entre "Rascunho" e "Publicado"\n\n### 4. Publique ou salve como rascunho\n- Use "Salvar Rascunho" para editar depois\n- Use "Publicar Post" para tornar público imediatamente\n\n## Dicas para posts de sucesso\n\n- ✅ Use títulos atrativos\n- ✅ Organize o conteúdo com subtítulos\n- ✅ Adicione tags relevantes\n- ✅ Interaja com comentários dos leitores\n\n## Markdown Suportado\n\nO blog suporta formatação Markdown:\n\n- **Texto em negrito**\n- *Texto em itálico*\n- ~~Texto riscado~~\n- `Código inline`\n- [Links](https://orkut-br-oficial.vercel.app)\n\n### Listas\n\n1. Item numerado 1\n2. Item numerado 2\n3. Item numerado 3\n\n- Item com bullet\n- Outro item\n- Mais um item\n\n### Código\n\n```javascript\nfunction exemplo() {\n  console.log("Olá, Orkut!");\n}\n```\n\n### Citações\n\n> "A melhor forma de aprender é ensinando."\n> — Provérbio popular\n\nBoa sorte com seus posts! 🚀'

const demoContent3 = '# Novidades e Atualizações da Plataforma\n\n## 🆕 Últimas atualizações\n\n### Sistema de Fotos Melhorado\n- ✅ Correção na API de fotos\n- ✅ Performance otimizada\n- ✅ Melhor experiência de upload\n- ✅ Suporte a múltiplos formatos\n\n### Blog Totalmente Funcional\n- ✅ Sistema de posts completo\n- ✅ Editor intuitivo com Markdown\n- ✅ Sistema de tags e categorias\n- ✅ Comentários e interações\n- ✅ Busca avançada\n\n### Interface Aprimorada\n- ✅ Design mais responsivo\n- ✅ Melhorias na navegação\n- ✅ Componentes UI mais elegantes\n- ✅ Modo escuro/claro\n\n## 🔧 Correções Técnicas\n\n### Performance\n- ⚡ Carregamento 40% mais rápido\n- ⚡ Otimização de imagens\n- ⚡ Cache inteligente\n- ⚡ Compressão de dados\n\n### Segurança\n- 🔒 Autenticação aprimorada\n- 🔒 Criptografia de dados\n- 🔒 Proteção contra spam\n- 🔒 Validação de entrada\n\n### Compatibilidade\n- 📱 Suporte mobile melhorado\n- 🌐 Compatibilidade cross-browser\n- ♿ Acessibilidade (WCAG 2.1)\n- 🌍 Internacionalização\n\n## 📊 Estatísticas da Plataforma\n\n| Métrica | Valor |\n|---------|-------|\n| Usuários Ativos | 15.2K |\n| Posts Criados | 8.7K |\n| Fotos Compartilhadas | 25K |\n| Comentários | 42K |\n\n## 🚀 Próximas funcionalidades\n\nEstamos trabalhando em:\n\n### 📱 App Mobile Nativo\n- Download na App Store e Google Play\n- Notificações push\n- Modo offline\n- Sincronização automática\n\n### 🎵 Player de Música Integrado\n- Playlist personalizada\n- Compartilhar músicas\n- Rádio da comunidade\n- Integração com Spotify\n\n### 💬 Chat em Tempo Real\n- Mensagens instantâneas\n- Grupos de conversa\n- Chamadas de voz/vídeo\n- Compartilhamento de mídia\n\n### 🎮 Jogos da Comunidade\n- Jogos clássicos do Orkut\n- Ranking global\n- Torneios semanais\n- Prêmios e conquistas\n\n### 📈 Analytics Pessoais\n- Dashboard do usuário\n- Estatísticas de engajamento\n- Relatórios de crescimento\n- Insights da audiência\n\n## 💝 Agradecimentos\n\nQueremos agradecer a todos os usuários que:\n\n- 🐛 Reportaram bugs\n- 💡 Sugeriram melhorias\n- 🤝 Ajudaram outros usuários\n- ❤️ Continuam ativos na comunidade\n\n## 🔮 Roadmap 2024\n\n- **Q1**: App mobile nativo\n- **Q2**: Sistema de música\n- **Q3**: Chat em tempo real\n- **Q4**: Jogos e gamificação\n\nObrigado por fazer parte da nossa jornada! ❤️\n\n---\n\n*Tem sugestões? Entre em contato conosco através do [formulário de feedback](/feedback)*'

// Posts de demonstração com conteúdo completo
const demoPosts = [
  {
    id: 'demo-1',
    title: 'Bem-vindos ao Blog do Orkut BR! 🎉',
    slug: 'bem-vindos-ao-blog-do-orkut-br',
    excerpt: 'Este é o primeiro post do nosso blog! Aqui você poderá compartilhar suas histórias, ideias e conectar-se com a comunidade.',
    content: demoContent1,
    featured_image: '/logoorkut.png',
    tags: ['orkut', 'blog', 'comunidade', 'bem-vindos'],
    status: 'published',
    views_count: 1500,
    likes_count: 89,
    comments_count: 23,
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
    content: demoContent2,
    featured_image: 'https://images.pexels.com/photos/265667/pexels-photo-265667.jpeg?auto=compress&cs=tinysrgb&w=800',
    tags: ['tutorial', 'como-usar', 'blog', 'guia'],
    status: 'published',
    views_count: 892,
    likes_count: 45,
    comments_count: 12,
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
    content: demoContent3,
    featured_image: 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=800',
    tags: ['novidades', 'atualizacoes', 'melhorias', 'plataforma'],
    status: 'published',
    views_count: 2341,
    likes_count: 156,
    comments_count: 34,
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

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = params

    // Primeiro tentar buscar nos posts demo
    const demoPost = demoPosts.find(post => post.slug === slug)
    if (demoPost) {
      console.log('✅ Post demo encontrado:', slug)
      return NextResponse.json({ post: demoPost })
    }

    // Tentar Supabase como fallback
    try {
      const supabase = createRouteHandlerClient({ cookies })

      const { data: post, error } = await supabase
        .from('blog_posts')
        .select(`
          id,
          title,
          slug,
          content,
          excerpt,
          featured_image,
          status,
          tags,
          views_count,
          likes_count,
          comments_count,
          created_at,
          updated_at,
          profiles!blog_posts_author_id_fkey (
            id,
            display_name,
            photo_url,
            username
          )
        `)
        .eq('slug', slug)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return NextResponse.json(
            { error: 'Post não encontrado' },
            { status: 404 }
          )
        }
        throw error
      }

      // Verificar se o post está publicado ou se é o autor
      const { data: { user } } = await supabase.auth.getUser()
      const isAuthor = user?.id === (post.profiles as any)?.id

      if (post.status !== 'published' && !isAuthor) {
        return NextResponse.json(
          { error: 'Post não encontrado' },
          { status: 404 }
        )
      }

      // Incrementar contador de views apenas se não for o autor
      if (!isAuthor && post.status === 'published') {
        await supabase
          .from('blog_posts')
          .update({ views_count: post.views_count + 1 })
          .eq('slug', slug)
        
        post.views_count += 1
      }

      return NextResponse.json({ post })
    } catch (supabaseError) {
      console.warn('Supabase não disponível para slug:', slug)
      // Se chegou aqui, o post demo não existe e Supabase falhou
      return NextResponse.json(
        { error: 'Post não encontrado' },
        { status: 404 }
      )
    }

  } catch (error) {
    console.error('Erro ao buscar post do blog:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { slug } = params

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Verificar se o post existe e se o usuário é o autor
    const { data: existingPost, error: fetchError } = await supabase
      .from('blog_posts')
      .select('id, author_id, title')
      .eq('slug', slug)
      .single()

    if (fetchError || !existingPost) {
      return NextResponse.json(
        { error: 'Post não encontrado' },
        { status: 404 }
      )
    }

    if (existingPost.author_id !== user.id) {
      return NextResponse.json(
        { error: 'Não autorizado a editar este post' },
        { status: 403 }
      )
    }

    const { title, content, excerpt, featured_image, status, tags } = await request.json()

    // Validações
    if (!title || !content) {
      return NextResponse.json(
        { error: 'Título e conteúdo são obrigatórios' },
        { status: 400 }
      )
    }

    const updateData: any = {
      title,
      content,
      excerpt: excerpt || content.substring(0, 200) + '...',
      featured_image,
      status: status || 'draft',
      tags: tags || []
    }

    // Se o título mudou, gerar novo slug
    if (title !== existingPost.title) {
      const { data: slugData, error: slugError } = await supabase
        .rpc('generate_slug', { title })

      if (!slugError && slugData) {
        // Verificar se o slug já existe
        const { data: slugCheck } = await supabase
          .from('blog_posts')
          .select('id')
          .eq('slug', slugData)
          .neq('id', existingPost.id)

        if (!slugCheck || slugCheck.length === 0) {
          updateData.slug = slugData
        } else {
          updateData.slug = `${slugData}-${Date.now()}`
        }
      }
    }

    const { data: post, error } = await supabase
      .from('blog_posts')
      .update(updateData)
      .eq('id', existingPost.id)
      .select(`
        id,
        title,
        slug,
        content,
        excerpt,
        featured_image,
        status,
        tags,
        views_count,
        likes_count,
        comments_count,
        created_at,
        updated_at,
        profiles!blog_posts_author_id_fkey (
          id,
          display_name,
          photo_url,
          username
        )
      `)
      .single()

    if (error) throw error

    return NextResponse.json({ post })

  } catch (error) {
    console.error('Erro ao atualizar post do blog:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { slug } = params

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Verificar se o post existe e se o usuário é o autor
    const { data: existingPost, error: fetchError } = await supabase
      .from('blog_posts')
      .select('id, author_id, title')
      .eq('slug', slug)
      .single()

    if (fetchError || !existingPost) {
      return NextResponse.json(
        { error: 'Post não encontrado' },
        { status: 404 }
      )
    }

    if (existingPost.author_id !== user.id) {
      return NextResponse.json(
        { error: 'Não autorizado a deletar este post' },
        { status: 403 }
      )
    }

    const { error } = await supabase
      .from('blog_posts')
      .delete()
      .eq('id', existingPost.id)

    if (error) throw error

    return NextResponse.json({ 
      message: 'Post deletado com sucesso',
      title: existingPost.title 
    })

  } catch (error) {
    console.error('Erro ao deletar post do blog:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
