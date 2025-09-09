import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Cliente Supabase para servidor
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Verificar se as variáveis estão configuradas
if (!supabaseUrl || !supabaseServiceKey || 
    supabaseUrl.includes('placeholder') || 
    supabaseUrl.includes('your_') ||
    !supabaseUrl.startsWith('https://')) {
  console.warn('Supabase não configurado para init-gallery API')
}

// Criar cliente apenas se configurado corretamente
const supabase = (supabaseUrl && supabaseServiceKey &&
                 !supabaseUrl.includes('placeholder') &&
                 !supabaseUrl.includes('your_') &&
                 supabaseUrl.startsWith('https://'))
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    })
  : null

/**
 * OPTIONS /api/photos/init-gallery - CORS preflight
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  })
}

/**
 * POST /api/photos/init-gallery - Inicializa galeria do usuário com logo do Orkut
 */
export async function POST(request: NextRequest) {
  try {
    // Se Supabase não estiver configurado, retornar sucesso mock
    if (!supabase) {
      console.log('📸 Supabase não configurado - simulando inicialização da galeria')
      return NextResponse.json({
        success: true,
        message: 'Galeria inicializada (modo demo)',
        logoAdded: true,
        demo: true
      })
    }

    // Verificar autenticação via header Authorization
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        error: 'Token de autorização necessário'
      }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Se for um token mock (para desenvolvimento), criar usuário temporário
    let user: any
    if (token === 'mock-token') {
      user = {
        id: 'mock-user-id',
        email: 'user@example.com'
      }
      console.log('🧪 Usando mock user para desenvolvimento')
    } else {
      // Criar cliente supabase temporário para verificar o token
      const tempSupabase = createClient(supabaseUrl!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      })
      
      // Verificar se o token é válido
      const { data: userData, error: authError } = await tempSupabase.auth.getUser()
      
      if (authError || !userData.user) {
        return NextResponse.json({ 
          error: 'Token inválido ou expirado'
        }, { status: 401 })
      }
      
      user = userData.user
    }

    console.log(`🚀 Inicializando galeria para usuário: ${user.email}`)

    // Verificar se o usuário já tem o logo do Orkut na galeria
    const { data: existingLogo, error: checkError } = await supabase
      .from('user_photos')
      .select('id')
      .eq('user_id', user.id)
      .eq('title', 'Logo Oficial do Orkut BR')
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Erro ao verificar logo existente:', checkError)
      throw checkError
    }

    // Se já existe o logo, não fazer nada
    if (existingLogo) {
      console.log('✅ Logo do Orkut já existe na galeria do usuário')
      return NextResponse.json({
        success: true,
        message: 'Galeria já inicializada',
        logoAdded: false,
        existing: true
      })
    }

    // Gerar ID único para a foto do logo
    const logoId = `orkut-logo-${user.id}-${Date.now()}`

    console.log('📸 Adicionando logo do Orkut à galeria do usuário')

    // Inserir logo do Orkut como primeira foto na galeria do usuário
    const { data: logoPhoto, error: insertError } = await supabase
      .from('user_photos')
      .insert({
        id: logoId,
        user_id: user.id,
        url: '/logoorkut.png',
        preview_url: '/logoorkut.png',
        thumbnail_url: '/logoorkut.png',
        title: 'Logo Oficial do Orkut BR',
        description: 'Bem-vindo ao Orkut BR! Este é o logo oficial da nossa rede social. 🌈✨',
        category: 'sistema',
        file_size: 50000, // aproximado
        width: 300,
        height: 300,
        mime_type: 'image/png',
        file_path: '/logoorkut.png',
        is_public: true,
        is_processed: true,
        is_deleted: false,
        likes_count: 1337,
        comments_count: 0,
        views_count: 1,
        created_at: new Date('2024-01-01T00:00:00Z').toISOString() // Data fixa para sempre aparecer primeiro
      })
      .select()
      .single()

    if (insertError) {
      console.error('Erro ao inserir logo do Orkut:', insertError)
      throw new Error(`Erro ao adicionar logo: ${insertError.message}`)
    }

    console.log('✅ Logo do Orkut adicionado com sucesso à galeria do usuário')

    // Opcional: Adicionar uma curtida automática do próprio usuário no logo
    try {
      await supabase
        .from('photo_likes')
        .insert({
          photo_id: logoId,
          user_id: user.id,
          created_at: new Date().toISOString()
        })
        
      console.log('❤️ Curtida automática adicionada ao logo')
    } catch (likeError) {
      console.warn('Aviso: Não foi possível adicionar curtida automática:', likeError)
    }

    return NextResponse.json({
      success: true,
      message: 'Galeria inicializada com logo do Orkut',
      logoAdded: true,
      photoId: logoId,
      data: {
        id: logoPhoto.id,
        url: logoPhoto.url,
        title: logoPhoto.title,
        description: logoPhoto.description,
        category: logoPhoto.category,
        likes_count: logoPhoto.likes_count
      }
    })

  } catch (error) {
    console.error('Erro na inicialização da galeria:', error)
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
 * GET /api/photos/init-gallery - Verificar se galeria está inicializada
 */
export async function GET(request: NextRequest) {
  try {
    // Se Supabase não estiver configurado, retornar false
    if (!supabase) {
      return NextResponse.json({
        initialized: false,
        hasLogo: false,
        demo: true,
        message: 'Supabase não configurado'
      })
    }

    // Verificar autenticação via header Authorization
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        error: 'Token de autorização necessário'
      }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Se for um token mock (para desenvolvimento), criar usuário temporário
    let user: any
    if (token === 'mock-token') {
      user = {
        id: 'mock-user-id',
        email: 'user@example.com'
      }
    } else {
      // Criar cliente supabase temporário para verificar o token
      const tempSupabase = createClient(supabaseUrl!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      })
      
      // Verificar se o token é válido
      const { data: userData, error: authError } = await tempSupabase.auth.getUser()
      
      if (authError || !userData.user) {
        return NextResponse.json({ 
          error: 'Token inválido ou expirado'
        }, { status: 401 })
      }
      
      user = userData.user
    }

    // Verificar se tem logo do Orkut
    const { data: logoExists, error: checkError } = await supabase
      .from('user_photos')
      .select('id, created_at, likes_count, views_count')
      .eq('user_id', user.id)
      .eq('title', 'Logo Oficial do Orkut BR')
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError
    }

    // Contar total de fotos do usuário
    const { count: totalPhotos } = await supabase
      .from('user_photos')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('is_deleted', false)

    return NextResponse.json({
      initialized: !!logoExists,
      hasLogo: !!logoExists,
      totalPhotos: totalPhotos || 0,
      logoInfo: logoExists ? {
        id: logoExists.id,
        created_at: logoExists.created_at,
        likes_count: logoExists.likes_count,
        views_count: logoExists.views_count
      } : null
    })

  } catch (error) {
    console.error('Erro ao verificar inicialização da galeria:', error)
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}
