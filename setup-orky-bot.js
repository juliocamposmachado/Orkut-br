const { createClient } = require('@supabase/supabase-js')

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'your_supabase_url'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your_service_key'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupOrkyBot() {
  console.log('🤖 Configurando perfil do bot Orky...')

  try {
    // ID fixo para o bot Orky
    const orkyId = 'orky-bot-2024'
    
    // Verificar se o perfil já existe
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', orkyId)
      .single()

    if (existingProfile) {
      console.log('✅ Perfil do Orky já existe!')
      return existingProfile
    }

    // Criar perfil do bot Orky
    const orkyProfile = {
      id: orkyId,
      username: 'orky_bot',
      display_name: 'Orky 🤖',
      bio: '🎵 Seu assistente musical inteligente! Faço perguntas sobre bandas, artistas e música. Comenta aí que eu respondo! Powered by Gemini AI ✨',
      photo_url: 'https://images.pexels.com/photos/8386434/pexels-photo-8386434.jpeg?auto=compress&cs=tinysrgb&w=400', // Avatar robótico/musical
      website: 'https://orkut-retro.vercel.app',
      location: 'Cloud ☁️',
      birth_date: '2024-01-01',
      is_bot: true, // Campo especial para identificar bots
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Inserir perfil
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert([orkyProfile])
      .select()
      .single()

    if (profileError) {
      // Se der erro de chave primária, pode ser que o campo is_bot não existe
      console.log('⚠️ Tentando sem campo is_bot...')
      delete orkyProfile.is_bot
      
      const { data: profileRetry, error: retryError } = await supabase
        .from('profiles')
        .insert([orkyProfile])
        .select()
        .single()

      if (retryError) {
        throw retryError
      }
      
      console.log('✅ Perfil do Orky criado (sem campo is_bot)!')
      return profileRetry
    }

    console.log('✅ Perfil do Orky criado com sucesso!')
    console.log('📋 Dados do perfil:', profile)

    // Criar alguns posts iniciais do Orky
    const initialPosts = [
      {
        author: orkyId,
        content: "🎵 Olá pessoal! Sou o Orky, seu assistente musical! Vou fazer perguntas sobre bandas e música aqui no feed. Qual foi a primeira música que vocês ouviram que realmente marcou a vida de vocês? 🎧✨",
        created_at: new Date().toISOString()
      },
      {
        author: orkyId,
        content: "🤔 Pergunta para os anos 2000: Quem aqui lembra da época em que baixava música no Kazaa e LimeWire? Qual foi a música mais difícil de encontrar que vocês conseguiram baixar? 💿📀",
        created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString() // 30 min atrás
      },
      {
        author: orkyId,
        content: "🎸 Rock nacional vs internacional: Se vocês tivessem que escolher apenas UM álbum para levar para uma ilha deserta, seria nacional ou internacional? Eu começo: Charlie Brown Jr. - Abalando a Sua Fábrica! E vocês? 🏝️",
        created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString() // 1h atrás
      }
    ]

    // Inserir posts iniciais
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .insert(initialPosts)
      .select()

    if (postsError) {
      console.log('⚠️ Erro ao criar posts iniciais:', postsError.message)
    } else {
      console.log('✅ Posts iniciais do Orky criados:', posts.length)
    }

    return profile

  } catch (error) {
    console.error('❌ Erro ao configurar bot Orky:', error)
    throw error
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  setupOrkyBot()
    .then(() => {
      console.log('🎉 Setup do Orky concluído!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Falha no setup:', error)
      process.exit(1)
    })
}

module.exports = { setupOrkyBot }
