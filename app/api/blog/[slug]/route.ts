import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

interface RouteParams {
  params: {
    slug: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { slug } = params

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
