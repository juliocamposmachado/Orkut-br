import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Configuração da API do Gemini para o DJ Orky
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent"
const GEMINI_API_KEY = "AIzaSyBW6TG-iCiZagI6T-RSvWgOKnd0GMBC1v0"

// Dados do DJ Orky
const DJ_ORKY_PROFILE = {
  id: 'dj-orky-bot-official',
  username: 'djorky',
  display_name: 'DJ Orky 🎵',
  photo_url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=150&h=150&fit=crop&crop=face'
}

// Lista de músicas simuladas para a rádio
const RADIO_PLAYLIST = [
  { title: "I Want It That Way", artist: "Backstreet Boys", genre: "Pop", year: 1999 },
  { title: "My Heart Will Go On", artist: "Celine Dion", genre: "Ballad", year: 1997 },
  { title: "Livin' la Vida Loca", artist: "Ricky Martin", genre: "Latin Pop", year: 1999 },
  { title: "Wonderwall", artist: "Oasis", genre: "Rock", year: 1995 },
  { title: "No Scrubs", artist: "TLC", genre: "R&B", year: 1999 },
  { title: "Everybody (Backstreet's Back)", artist: "Backstreet Boys", genre: "Pop", year: 1997 },
  { title: "Torn", artist: "Natalie Imbruglia", genre: "Pop Rock", year: 1997 },
  { title: "MMMBop", artist: "Hanson", genre: "Pop Rock", year: 1997 },
  { title: "Teardrop", artist: "Massive Attack", genre: "Trip Hop", year: 1998 },
  { title: "Virtual Insanity", artist: "Jamiroquai", genre: "Funk", year: 1996 },
  { title: "Tubthumping", artist: "Chumbawamba", genre: "Alternative Rock", year: 1997 },
  { title: "What's Up?", artist: "4 Non Blondes", genre: "Alternative Rock", year: 1992 },
  { title: "Zombie", artist: "The Cranberries", genre: "Alternative Rock", year: 1994 },
  { title: "Black", artist: "Pearl Jam", genre: "Grunge", year: 1991 },
  { title: "Smells Like Teen Spirit", artist: "Nirvana", genre: "Grunge", year: 1991 }
]

// Pega a música que está tocando agora na rádio ao vivo
async function getCurrentSong() {
  try {
    console.log('🎵 DJ Orky: buscando música ao vivo...')
    const response = await fetch('/api/radio-status', { 
      method: 'GET',
      cache: 'no-store' 
    })
    
    if (!response.ok) {
      throw new Error(`API da rádio retornou status ${response.status}`)
    }
    
    const data = await response.json()

    // Preferir a música marcada como atual; caso não exista, pegar a primeira das últimas tocadas
    const recent: any[] = Array.isArray(data?.recentSongs) ? data.recentSongs : []
    const currentFromList = recent.find((s: any) => s.isCurrent) || recent[0]
    const selected = currentFromList?.title || data.currentSong

    if (selected && selected !== 'Rádio Tatuapé FM') {
      console.log('✅ DJ Orky: Música selecionada para o post:', selected)
      // Tenta separar o artista e a música se o formato for "Artista - Música"
      const parts = String(selected).split(' - ')
      if (parts.length >= 2) {
        return { title: parts.slice(1).join(' - ').trim(), artist: parts[0].trim(), genre: 'Variado', year: new Date().getFullYear() }
      } else {
        return { title: selected, artist: 'Artista Desconhecido', genre: 'Variado', year: new Date().getFullYear() }
      }
    }

    // Chegou aqui? Não conseguimos identificar a música atual
    console.log('⚠️ DJ Orky: Não foi possível identificar música atual. Usando fallback.')
    return getRandomSongFromPlaylist()
  } catch (error) {
    console.error('❌ DJ Orky: Erro ao buscar música ao vivo:', error)
    return getRandomSongFromPlaylist()
  }
}

// Pega uma música aleatória da playlist como fallback
function getRandomSongFromPlaylist() {
  return RADIO_PLAYLIST[Math.floor(Math.random() * RADIO_PLAYLIST.length)]
}

// Gera um post usando a API do Gemini
async function generateDJPost(): Promise<string> {
  const currentSong = await getCurrentSong()
  const currentHour = new Date().getHours()
  
  let timeContext = ""
  if (currentHour >= 6 && currentHour < 12) {
    timeContext = "manhã"
  } else if (currentHour >= 12 && currentHour < 18) {
    timeContext = "tarde"
  } else if (currentHour >= 18 && currentHour < 22) {
    timeContext = "noite"
  } else {
    timeContext = "madrugada"
  }

  const prompt = `
Você é o DJ Orky, o DJ oficial da Rádio Orkut! Você é animado, nostálgico e ama música dos anos 90 e 2000.

MÚSICA TOCANDO AGORA:
- Título: ${currentSong.title}
- Artista: ${currentSong.artist}
- Gênero: ${currentSong.genre}
- Ano: ${currentSong.year}

CONTEXTO:
- Horário: ${timeContext}
- Você está ao vivo na Rádio Orkut
- Seu público são nostálgicos do Orkut que amam música retrô

CRIE UM POST para o feed do Orkut sobre esta música. O post deve:
- Ser animado e nostálgico
- Mencionar a música que está tocando
- Usar emojis relacionados à música
- Ter entre 50-150 caracteres
- Ser no estilo dos posts do Orkut da época
- Falar como se estivesse conversando com os amigos

Exemplos de tom:
- "Tocando agora: [MÚSICA] 🎵 Quem mais ama essa música? Nostalgia total! 💜"
- "🎧 [MÚSICA] no ar! Essa me lembra tanto dos tempos de Orkut... 😍"
- "Galera, que saudade dessa música! [MÚSICA] tocando agora na Rádio Orkut! 🎶✨"

RESPONDA APENAS COM O TEXTO DO POST, SEM ASPAS OU FORMATAÇÃO EXTRA.
`

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 200,
        }
      })
    })

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`)
    }

    const data = await response.json()
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!generatedText) {
      throw new Error('No response from Gemini API')
    }

    return generatedText.trim()
  } catch (error) {
    console.error('Error generating DJ post:', error)
    // Fallback para posts manuais se a API falhar
    const fallbackPosts = [
      `🎵 Tocando agora: ${currentSong.title} - ${currentSong.artist}! Que nostalgia! 💜`,
      `🎧 ${currentSong.title} no ar! Essa música é demais! Quem mais ama? 😍`,
      `Galera da Rádio Orkut! ${currentSong.title} tocando agora! Bora dançar! 🎶✨`,
      `${currentSong.artist} - ${currentSong.title} 🎵 Música boa não tem idade! 💖`,
      `🎶 Hit dos anos ${currentSong.year}! ${currentSong.title} tocando na Rádio Orkut! 🔥`
    ]
    return fallbackPosts[Math.floor(Math.random() * fallbackPosts.length)]
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🎵 DJ Orky criando novo post automático...')
    
    // Verificar se Supabase está configurado
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json(
        { success: false, error: 'Supabase não configurado' },
        { status: 500 }
      )
    }

    // Verificar se o perfil do DJ Orky existe
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', DJ_ORKY_PROFILE.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: 'Perfil do DJ Orky não encontrado. Execute /api/dj-orky/init primeiro.' },
        { status: 404 }
      )
    }

    // Gerar conteúdo do post
    const content = await generateDJPost()
    
    // Criar post no banco
    const postData = {
      content,
      author: DJ_ORKY_PROFILE.id,
      author_name: DJ_ORKY_PROFILE.display_name,
      author_photo: DJ_ORKY_PROFILE.photo_url,
      visibility: 'public' as const,
      likes_count: Math.floor(Math.random() * 50) + 10, // Entre 10-60 likes
      comments_count: Math.floor(Math.random() * 20) + 2, // Entre 2-22 comentários
      shares_count: Math.floor(Math.random() * 15) + 1, // Entre 1-16 shares
      is_dj_post: true
    }

    const { data: savedPost, error: postError } = await supabase
      .from('posts')
      .insert(postData)
      .select()
      .single()

    if (postError) {
      console.error('❌ Erro ao salvar post do DJ Orky:', postError)
      return NextResponse.json(
        { success: false, error: `Erro ao salvar post: ${postError.message}` },
        { status: 500 }
      )
    }

    console.log('✅ DJ Orky post criado:', content)

    return NextResponse.json({
      success: true,
      message: 'Post do DJ Orky criado com sucesso!',
      post: savedPost
    })

  } catch (error) {
    console.error('❌ Erro ao criar post do DJ Orky:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// GET para verificar últimos posts do DJ Orky
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '5')

    const { data: posts, error } = await supabase
      .from('posts')
      .select('*')
      .eq('author', DJ_ORKY_PROFILE.id)
      .eq('is_dj_post', true)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      posts: posts || [],
      total: posts?.length || 0
    })

  } catch (error) {
    console.error('❌ Erro ao buscar posts do DJ Orky:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar posts' },
      { status: 500 }
    )
  }
}
