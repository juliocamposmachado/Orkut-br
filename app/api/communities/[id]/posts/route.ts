import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Tipos para os dados
interface Profile {
  id: string
  username: string
  display_name: string
  photo_url: string | null
}

interface CommunityPost {
  id: number
  community_id: number
  author_id: string
  content: string
  likes_count: number
  comments_count: number
  created_at: string
  updated_at: string
}

interface PostWithAuthor extends CommunityPost {
  author: Profile
}

// Cliente Supabase para servidor
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Verificar se as variáveis estão configuradas
if (!supabaseUrl || !supabaseServiceKey || 
    supabaseUrl.includes('placeholder') || 
    supabaseUrl.includes('your_') ||
    !supabaseUrl.startsWith('https://')) {
  console.warn('Supabase não configurado para community posts API')
}

// Criar cliente apenas se configurado corretamente
const supabase = (supabaseUrl && supabaseServiceKey &&
                 !supabaseUrl.includes('placeholder') &&
                 !supabaseUrl.includes('your_') &&
                 supabaseUrl.startsWith('https://'))
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null

/**
 * GET /api/communities/[id]/posts - Buscar posts de uma comunidade
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const communityId = parseInt(params.id)
    
    if (isNaN(communityId)) {
      return NextResponse.json(
        { error: 'ID da comunidade inválido' },
        { status: 400 }
      )
    }

    // Se Supabase não estiver configurado, retornar dados demo
    if (!supabase) {
      console.warn('Supabase não configurado - retornando dados demo para posts da comunidade')
      
      const demoPosts = [
        {
          id: 1,
          community_id: communityId,
          author_id: 'demo-user-1',
          content: 'Este é um post de exemplo na comunidade! Como vocês estão?',
          likes_count: 5,
          comments_count: 2,
          created_at: new Date(Date.now() - 60000).toISOString(),
          author: {
            id: 'demo-user-1',
            username: 'usuario_demo',
            display_name: 'Usuário Demo',
            photo_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
          }
        }
      ]
      
      return NextResponse.json({
        success: true,
        posts: demoPosts,
        total: demoPosts.length,
        demo: true,
        timestamp: new Date().toISOString()
      })
    }

    // Verificar se a comunidade existe
    const { data: community, error: communityError } = await supabase
      .from('communities')
      .select('id, name')
      .eq('id', communityId)
      .single()

    if (communityError || !community) {
      return NextResponse.json(
        { error: 'Comunidade não encontrada' },
        { status: 404 }
      )
    }

    // Buscar posts da comunidade
    const { data: posts, error: postsError } = await supabase
      .from('community_posts')
      .select(`
        id,
        community_id,
        author_id,
        content,
        likes_count,
        comments_count,
        created_at,
        updated_at
      `)
      .eq('community_id', communityId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (postsError) {
      console.error('Erro ao buscar posts da comunidade:', postsError)
      return NextResponse.json(
        { error: 'Erro ao buscar posts da comunidade', details: postsError.message },
        { status: 500 }
      )
    }

    // Buscar informações dos autores
    let transformedPosts: PostWithAuthor[] = []
    if (posts && posts.length > 0) {
      const authorIds = Array.from(new Set(posts.map(post => post.author_id)))
      
      const { data: authors } = await supabase
        .from('profiles')
        .select('id, username, display_name, photo_url')
        .in('id', authorIds)
      
      const authorsMap = new Map<string, Profile>()
      authors?.forEach((author: Profile) => {
        authorsMap.set(author.id, author)
      })
      
      transformedPosts = posts.map(post => ({
        ...post,
        author: authorsMap.get(post.author_id) || {
          id: post.author_id,
          username: 'usuario',
          display_name: 'Usuário',
          photo_url: null
        }
      }))
    }

    return NextResponse.json({
      success: true,
      posts: transformedPosts,
      total: transformedPosts.length,
      community: {
        id: community.id,
        name: community.name
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Erro na API de posts da comunidade:', error)
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/communities/[id]/posts - Criar novo post na comunidade
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const communityId = parseInt(params.id)
    
    if (isNaN(communityId)) {
      return NextResponse.json(
        { error: 'ID da comunidade inválido' },
        { status: 400 }
      )
    }

    // Se Supabase não estiver configurado, retornar erro informativo
    if (!supabase) {
      return NextResponse.json({ 
        success: false,
        error: 'Funcionalidade de posts não disponível no momento',
        message: 'O servidor não está configurado para criar posts. Entre em contato com o administrador.',
        demo: true 
      }, { status: 503 })
    }

    // Verificar autenticação
    const authHeader = request.headers.get('authorization')
    console.log('🔐 Auth header presente:', !!authHeader)
    
    if (!authHeader) {
      console.log('❌ Header de autorização ausente')
      return NextResponse.json({ 
        error: 'Autenticação necessária para criar posts' 
      }, { status: 401 })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    
    console.log('👤 User obtido:', !!user, 'Error:', !!authError)
    if (user) {
      console.log('📋 User ID:', user.id)
    }
    if (authError) {
      console.log('❌ Erro de autenticação:', authError)
    }

    if (authError || !user) {
      return NextResponse.json({ 
        error: 'Token de autenticação inválido',
        debug: { authError: authError?.message }
      }, { status: 401 })
    }

    // Verificar se a comunidade existe
    const { data: community, error: communityError } = await supabase
      .from('communities')
      .select('id, name, owner')
      .eq('id', communityId)
      .single()

    if (communityError || !community) {
      return NextResponse.json(
        { error: 'Comunidade não encontrada' },
        { status: 404 }
      )
    }

    // Obter o perfil do usuário
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single()

    if (profileError || !profileData) {
      return NextResponse.json(
        { error: 'Perfil de usuário não encontrado' },
        { status: 404 }
      )
    }

    const profileId = profileData.id
    console.log('🔍 Verificando membership para profile:', profileId, 'na comunidade:', communityId)

    // Verificar se o usuário é membro da comunidade
    const { data: membership, error: membershipError } = await supabase
      .from('community_members')
      .select('id, role')
      .eq('community_id', communityId)
      .eq('profile_id', profileId) // Usar profile.id
      .single()
    
    console.log('🎯 Resultado da verificação de membership:')
    console.log('   - Community ID:', communityId)
    console.log('   - Profile ID:', profileId)
    console.log('   - Membership found:', !!membership)
    console.log('   - Membership data:', membership)
    console.log('   - Error:', membershipError)

    if (membershipError || !membership) {
      console.log('❌ Usuário não é membro da comunidade')
      return NextResponse.json(
        { 
          error: 'Você precisa ser membro desta comunidade para criar posts',
          debug: {
            communityId,
            profileId,
            membershipError: membershipError?.message,
            membership
          }
        },
        { status: 403 }
      )
    }
    
    console.log('✅ Usuário é membro da comunidade com role:', membership.role)

    const body = await request.json()
    const { content } = body

    // Validações
    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Conteúdo do post é obrigatório' },
        { status: 400 }
      )
    }

    if (content.length > 1000) {
      return NextResponse.json(
        { error: 'Conteúdo muito longo (máximo 1000 caracteres)' },
        { status: 400 }
      )
    }

    // Criar o post
    const { data: newPost, error: createError } = await supabase
      .from('community_posts')
      .insert({
        community_id: communityId,
        author_id: user.id,
        content: content.trim(),
        likes_count: 0,
        comments_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select(`
        id,
        community_id,
        author_id,
        content,
        likes_count,
        comments_count,
        created_at,
        updated_at
      `)
      .single()

    if (createError) {
      console.error('Erro ao criar post:', createError)
      return NextResponse.json(
        { error: 'Erro ao criar post', details: createError.message },
        { status: 500 }
      )
    }

    // Buscar informações do autor
    const { data: authorData } = await supabase
      .from('profiles')
      .select('id, username, display_name, photo_url')
      .eq('id', user.id)
      .single()

    // Transformar dados para incluir informações do autor
    const transformedPost = {
      ...newPost,
      author: authorData || {
        id: user.id,
        username: 'usuario',
        display_name: 'Usuário',
        photo_url: null
      }
    }

    return NextResponse.json({
      success: true,
      post: transformedPost,
      message: 'Post criado com sucesso!',
      community: {
        id: community.id,
        name: community.name
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Erro na criação de post da comunidade:', error)
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}
