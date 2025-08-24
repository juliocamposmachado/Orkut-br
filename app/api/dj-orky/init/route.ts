import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Dados do perfil oficial do DJ Orky - campos mínimos para teste
const DJ_ORKY_PROFILE = {
  id: 'dj-orky-bot-official',
  username: 'djorky',
  display_name: 'DJ Orky 🎵',
  email: 'djorky@orkutretro.com',
  bio: 'DJ oficial da Rádio Orkut! 🎧 Tocando os melhores hits retrô 24h por dia!',
  phone: null
}

// Posts iniciais do DJ Orky
const INITIAL_POSTS = [
  "🎵 Bem-vindos à Rádio Orkut! Eu sou o DJ Orky e vou tocar os melhores hits retrô! 🎧💜",
  "🎶 Primeira música da nossa playlist: os clássicos que marcaram época! Preparados? ✨",
  "📻 Rádio Orkut no ar 24h! Muita nostalgia e música boa te esperando! 🔥",
  "🎧 Que tal relembrar aqueles hits que tocavam no Orkut original? Vem comigo! 🌟",
  "🎵 DJ Orky aqui! Prontos para uma viagem no túnel do tempo musical? 🚀"
]

export async function POST(request: NextRequest) {
  try {
    console.log('🎵 Inicializando perfil oficial do DJ Orky...')
    console.log('🔧 Dados do perfil:', {
      id: DJ_ORKY_PROFILE.id,
      username: DJ_ORKY_PROFILE.username,
      display_name: DJ_ORKY_PROFILE.display_name,
      fields: Object.keys(DJ_ORKY_PROFILE)
    })
    
    // Verificar se Supabase está configurado
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('❌ Variáveis de ambiente Supabase não configuradas')
      return NextResponse.json(
        { success: false, error: 'Supabase não configurado' },
        { status: 500 }
      )
    }
    
    console.log('✅ Supabase configurado')

    // Verificar se o perfil já existe
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', DJ_ORKY_PROFILE.id)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Erro ao verificar perfil existente:', checkError)
      return NextResponse.json(
        { success: false, error: 'Erro ao verificar perfil' },
        { status: 500 }
      )
    }

    let profileCreated = false

    // Criar perfil se não existir
    if (!existingProfile) {
      console.log('📝 Criando perfil do DJ Orky...')
      
      const { error: profileError } = await supabase
        .from('profiles')
        .insert(DJ_ORKY_PROFILE)

      if (profileError) {
        console.error('❌ Erro ao criar perfil:', profileError)
        return NextResponse.json(
          { success: false, error: `Erro ao criar perfil: ${profileError.message}` },
          { status: 500 }
        )
      }

      profileCreated = true
      console.log('✅ Perfil do DJ Orky criado com sucesso!')
    } else {
      console.log('ℹ️ Perfil do DJ Orky já existe')
    }

    // Verificar se já existem posts do DJ Orky
    const { data: existingPosts, error: postsError } = await supabase
      .from('posts')
      .select('id')
      .eq('author', DJ_ORKY_PROFILE.id)
      .limit(1)

    if (postsError) {
      console.warn('⚠️ Erro ao verificar posts existentes:', postsError)
    }

    let postsCreated = 0

    // Criar posts iniciais se não existirem
    if (!existingPosts || existingPosts.length === 0) {
      console.log('📝 Criando posts iniciais do DJ Orky...')
      
      for (let i = 0; i < INITIAL_POSTS.length; i++) {
        const postData = {
          content: INITIAL_POSTS[i],
          author: DJ_ORKY_PROFILE.id,
          author_name: DJ_ORKY_PROFILE.display_name,
          author_photo: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=150&h=150&fit=crop&crop=face',
          visibility: 'public' as const,
          created_at: new Date(Date.now() - (i * 30 * 60 * 1000)).toISOString()
        }

        const { error: postError } = await supabase
          .from('posts')
          .insert(postData)

        if (postError) {
          console.warn(`⚠️ Erro ao criar post ${i + 1}:`, postError)
        } else {
          postsCreated++
        }

        // Delay para não sobrecarregar
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      console.log(`✅ ${postsCreated} posts iniciais criados!`)
    } else {
      console.log('ℹ️ Posts iniciais do DJ Orky já existem')
    }

    return NextResponse.json({
      success: true,
      message: 'DJ Orky inicializado com sucesso!',
      profile: {
        created: profileCreated,
        id: DJ_ORKY_PROFILE.id,
        username: DJ_ORKY_PROFILE.username,
        display_name: DJ_ORKY_PROFILE.display_name
      },
      posts: {
        created: postsCreated,
        total: INITIAL_POSTS.length
      }
    })

  } catch (error) {
    console.error('❌ Erro ao inicializar DJ Orky:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verificar status do DJ Orky
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, username, display_name, created_at')
      .eq('id', DJ_ORKY_PROFILE.id)
      .single()

    if (profileError && profileError.code !== 'PGRST116') {
      throw profileError
    }

    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('id, created_at')
      .eq('author', DJ_ORKY_PROFILE.id)

    if (postsError) {
      throw postsError
    }

    return NextResponse.json({
      success: true,
      djOrky: {
        profile: profile ? 'exists' : 'not_found',
        posts: posts?.length || 0,
        lastPost: posts?.[0]?.created_at || null
      }
    })

  } catch (error) {
    console.error('❌ Erro ao verificar status DJ Orky:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao verificar status' },
      { status: 500 }
    )
  }
}
