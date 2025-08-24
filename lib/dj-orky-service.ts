'use client'

// Perfil do DJ Orky (agora com ID oficial do banco)
export const DJ_ORKY_PROFILE = {
  id: 'dj-orky-bot-official',
  username: 'djorky',
  display_name: 'DJ Orky 🎵',
  photo_url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=150&h=150&fit=crop&crop=face',
  bio: 'DJ oficial da Rádio Orkut! 🎧 Tocando os melhores hits retrô 24h por dia!',
  location: 'Rádio Orkut Studios',
  relationship: 'Casado com a música ❤️',
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
      console.log('⚠️ DJ Orky: Não foi possível identificar música atual. Usando fallback.');
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

  // Inicializar DJ Orky no banco de dados
  async initializeDJOrky(): Promise<boolean> {
    try {
      console.log('🎵 Inicializando DJ Orky...')
      const response = await fetch('/api/dj-orky/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      const result = await response.json()
      
      if (result.success) {
        console.log('✅ DJ Orky inicializado:', result.message)
        return true
      } else {
        console.error('❌ Erro ao inicializar DJ Orky:', result.error)
        return false
      }
    } catch (error) {
      console.error('❌ Erro crítico na inicialização do DJ Orky:', error)
      return false
    }
  }

  // Cria um post automático via API
  async createDJPost(): Promise<DJPost | null> {
    try {
      console.log('🎵 DJ Orky criando novo post automático...')
      
      const response = await fetch('/api/dj-orky/post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      const result = await response.json()
      
      if (result.success && result.post) {
        console.log('✅ DJ Orky post criado:', result.post.content)
        
        // Dispara evento para atualizar o feed se estivermos no browser
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('new-post-created', { detail: result.post }))
        }
        
        return result.post as DJPost
      } else {
        console.error('❌ Erro ao criar post do DJ Orky:', result.error)
        return null
      }
    } catch (error) {
      console.error('❌ Erro crítico ao criar post do DJ Orky:', error)
      return null
    }
  }

  // Inicia o sistema automático de posts
  async startAutoPosting() {
    if (this.isActive) {
      console.log('🎵 DJ Orky já está ativo!')
      return
    }

    // Inicializar DJ Orky no banco se necessário
    const initialized = await this.initializeDJOrky()
    if (!initialized) {
      console.error('❌ Não foi possível inicializar DJ Orky')
      return
    }

    this.isActive = true
    console.log('🎵 DJ Orky iniciado! Posts automáticos a cada 15 minutos.')

    // Cria o primeiro post após 30 segundos
    setTimeout(() => {
      this.createDJPost()
    }, 30000)

    // Agenda posts automáticos a cada 15 minutos
    this.postTimer = setInterval(() => {
      this.createDJPost()
    }, 15 * 60 * 1000) // 15 minutos em millisegundos
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

  // Verifica status do DJ Orky
  async getStatus() {
    try {
      const response = await fetch('/api/dj-orky/init')
      const result = await response.json()
      return result.success ? result.djOrky : null
    } catch (error) {
      console.error('❌ Erro ao verificar status do DJ Orky:', error)
      return null
    }
  }

  // Busca posts recentes do DJ Orky
  async getRecentPosts(limit = 5): Promise<DJPost[]> {
    try {
      const response = await fetch(`/api/dj-orky/post?limit=${limit}`)
      const result = await response.json()
      return result.success ? result.posts : []
    } catch (error) {
      console.error('❌ Erro ao buscar posts do DJ Orky:', error)
      return []
    }
  }
}

// Instância global
export const djOrkyService = DJOrkyService.getInstance()
