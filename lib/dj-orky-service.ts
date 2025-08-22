'use client'

// Configuração da API do Gemini para o DJ Orky
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent"
const GEMINI_API_KEY = "AIzaSyBW6TG-iCiZagI6T-RSvWgOKnd0GMBC1v0"

// Perfil do DJ Orky
export const DJ_ORKY_PROFILE = {
  id: 'dj-orky-bot',
  username: 'djorky',
  display_name: 'DJ Orky 🎵',
  photo_url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=150&h=150&fit=crop&crop=face',
  bio: 'DJ oficial da Rádio Orkut! 🎧 Tocando os melhores hits 24h por dia!',
  location: 'Rádio Orkut Studios',
  relationship: 'Casado com a música',
  fans_count: 9999,
  created_at: '2004-01-24T00:00:00Z'
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

interface DJPost {
  id: number
  content: string
  author: string
  author_name: string
  author_photo: string
  visibility: 'public' | 'friends'
  likes_count: number
  comments_count: number
  created_at: string
  is_dj_post: boolean
}

export class DJOrkyService {
  private static instance: DJOrkyService
  private postTimer: NodeJS.Timeout | null = null
  private isActive = false

  static getInstance(): DJOrkyService {
    if (!DJOrkyService.instance) {
      DJOrkyService.instance = new DJOrkyService()
    }
    return DJOrkyService.instance
  }

  // Pega a música que está tocando agora na rádio ao vivo
  private async getCurrentSong() {
    try {
      console.log('🎵 DJ Orky: buscando música ao vivo...');
      const response = await fetch('/api/radio-status', { 
        method: 'GET',
        cache: 'no-store' 
      });
      
      if (!response.ok) {
        throw new Error(`API da rádio retornou status ${response.status}`);
      }
      
      const data = await response.json();

      // Preferir a música marcada como atual; caso não exista, pegar a primeira das últimas tocadas
      const recent: any[] = Array.isArray(data?.recentSongs) ? data.recentSongs : [];
      const currentFromList = recent.find((s: any) => s.isCurrent) || recent[0];
      const selected = currentFromList?.title || data.currentSong;

      if (selected && selected !== 'Rádio Tatuapé FM') {
        console.log('✅ DJ Orky: Música selecionada para o post:', selected);
        // Tenta separar o artista e a música se o formato for "Artista - Música"
        const parts = String(selected).split(' - ');
        if (parts.length >= 2) {
          return { title: parts.slice(1).join(' - ').trim(), artist: parts[0].trim(), genre: 'Variado', year: new Date().getFullYear() };
        } else {
          return { title: selected, artist: 'Artista Desconhecido', genre: 'Variado', year: new Date().getFullYear() };
        }
      }

      // Chegou aqui? Não conseguimos identificar a música atual
      console.log('⚠️ DJ Orky: Não foi possível identificar música atual. Usando fallback apenas por segurança.');
      return this.getRandomSongFromPlaylist();
    } catch (error) {
      console.error('❌ DJ Orky: Erro ao buscar música ao vivo:', error);
      return this.getRandomSongFromPlaylist();
    }
  }

  // Pega uma música aleatória da playlist como fallback
  private getRandomSongFromPlaylist() {
    return RADIO_PLAYLIST[Math.floor(Math.random() * RADIO_PLAYLIST.length)];
  }

  // Gera um post usando a API do Gemini
  async generateDJPost(): Promise<string> {
    const currentSong = await this.getCurrentSong()
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

  // Cria e salva um post do DJ Orky
  async createDJPost(): Promise<DJPost> {
    console.log('🎵 DJ Orky gerando novo post...')
    
    const content = await this.generateDJPost()
    
    const newPost: DJPost = {
      id: Date.now() + Math.random(), // ID único
      content,
      author: DJ_ORKY_PROFILE.id,
      author_name: DJ_ORKY_PROFILE.display_name,
      author_photo: DJ_ORKY_PROFILE.photo_url,
      visibility: 'public',
      likes_count: Math.floor(Math.random() * 50) + 10, // Entre 10-60 likes
      comments_count: Math.floor(Math.random() * 20) + 2, // Entre 2-22 comentários
      created_at: new Date().toISOString(),
      is_dj_post: true
    }

    try {
      // Tentar salvar na API global primeiro
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newPost.content,
          author: newPost.author,
          author_name: newPost.author_name,
          author_photo: newPost.author_photo,
          visibility: newPost.visibility,
          is_dj_post: true
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log('✅ DJ Orky post salvo na API global:', result.post.content)
        
        // Usar o post retornado pela API
        const savedPost = { ...result.post, likes_count: newPost.likes_count, comments_count: newPost.comments_count }
        
        // Também manter no localStorage para compatibilidade
        const existingPosts = JSON.parse(localStorage.getItem('orkut_posts') || '[]')
        existingPosts.unshift(savedPost)
        
        if (existingPosts.length > 100) {
          existingPosts.splice(100)
        }
        
        localStorage.setItem('orkut_posts', JSON.stringify(existingPosts))
        
        // Dispara evento para atualizar o feed
        window.dispatchEvent(new CustomEvent('new-post-created', { detail: savedPost }))
        
        return savedPost
      } else {
        throw new Error('Falha ao salvar na API global')
      }
    } catch (error) {
      console.error('❌ Erro ao salvar DJ post na API global:', error)
      console.log('🔄 Usando localStorage como fallback...')
      
      // Fallback para localStorage
      const existingPosts = JSON.parse(localStorage.getItem('orkut_posts') || '[]')
      existingPosts.unshift(newPost) // Adiciona no topo
      
      // Manter apenas os últimos 100 posts
      if (existingPosts.length > 100) {
        existingPosts.splice(100)
      }
      
      localStorage.setItem('orkut_posts', JSON.stringify(existingPosts))
      
      console.log('✅ DJ Orky post criado (localStorage):', newPost.content)
      
      // Dispara evento para atualizar o feed
      window.dispatchEvent(new CustomEvent('new-post-created', { detail: newPost }))
      
      return newPost
    }
  }

  // Inicia o sistema automático de posts
  startAutoPosting() {
    if (this.isActive) {
      console.log('🎵 DJ Orky já está ativo!')
      return
    }

    this.isActive = true
    console.log('🎵 DJ Orky iniciado! Posts automáticos a cada 10 minutos.')

    // Cria o primeiro post imediatamente
    this.createDJPost()

    // Agenda posts automáticos a cada 10 minutos
    this.postTimer = setInterval(() => {
      this.createDJPost()
    }, 10 * 60 * 1000) // 10 minutos em millisegundos
  }

  // Para o sistema automático
  stopAutoPosting() {
    if (this.postTimer) {
      clearInterval(this.postTimer)
      this.postTimer = null
    }
    this.isActive = false
    console.log('🎵 DJ Orky parado.')
  }

  // Verifica se está ativo
  isActivePosting(): boolean {
    return this.isActive
  }

  // Cria alguns posts iniciais para demonstração
  async createInitialPosts() {
    const initialPosts = [
      "🎵 Bem-vindos à Rádio Orkut! Eu sou o DJ Orky e vou tocar os melhores hits retrô! 🎧💜",
      "🎶 Primeira música da nossa playlist: os clássicos que marcaram época! Preparados? ✨",
      "📻 Rádio Orkut no ar 24h! Muita nostalgia e música boa te esperando! 🔥"
    ]

    for (let i = 0; i < initialPosts.length; i++) {
      const post: DJPost = {
        id: Date.now() + i,
        content: initialPosts[i],
        author: DJ_ORKY_PROFILE.id,
        author_name: DJ_ORKY_PROFILE.display_name,
        author_photo: DJ_ORKY_PROFILE.photo_url,
        visibility: 'public',
        likes_count: Math.floor(Math.random() * 30) + 20,
        comments_count: Math.floor(Math.random() * 15) + 5,
        created_at: new Date(Date.now() - (i * 30 * 60 * 1000)).toISOString(), // 30 min de diferença
        is_dj_post: true
      }

      const existingPosts = JSON.parse(localStorage.getItem('orkut_posts') || '[]')
      existingPosts.unshift(post)
      localStorage.setItem('orkut_posts', JSON.stringify(existingPosts))
      
      // Delay para não criar todos ao mesmo tempo
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    console.log('✅ Posts iniciais do DJ Orky criados!')
  }
}

// Instância global
export const djOrkyService = DJOrkyService.getInstance()
