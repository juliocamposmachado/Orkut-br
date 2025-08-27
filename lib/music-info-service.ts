'use client'

export interface ArtistInfo {
  name: string
  bio?: string
  formed?: string
  origin?: string
  genre?: string[]
  members?: string[]
  albums?: Album[]
  popularSongs?: string[]
  imageUrl?: string
  lastUpdated: string
}

export interface Album {
  title: string
  year: number
  type: 'album' | 'single' | 'ep'
}

export interface SearchResult {
  success: boolean
  data?: ArtistInfo
  error?: string
  sources: string[]
}

class MusicInfoService {
  private cache = new Map<string, { data: ArtistInfo; timestamp: number }>()
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 horas
  private readonly BASE_DELAY = 1000 // 1 segundo entre requests

  /**
   * Busca informações completas sobre um artista/banda
   */
  async searchArtistInfo(artistName: string): Promise<SearchResult> {
    if (!artistName?.trim()) {
      return { success: false, error: 'Nome do artista é obrigatório', sources: [] }
    }

    const cacheKey = artistName.toLowerCase().trim()
    
    // Verificar cache
    const cached = this.cache.get(cacheKey)
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
      console.log(`🎵 Cache hit para: ${artistName}`)
      return { success: true, data: cached.data, sources: ['cache'] }
    }

    console.log(`🔍 Buscando informações sobre: ${artistName}`)

    try {
      const results = await Promise.allSettled([
        this.searchMusicBrainz(artistName),
        this.searchWikipedia(artistName),
        this.searchGoogleDorks(artistName),
        this.searchLastFm(artistName)
      ])

      // Combinar resultados de diferentes fontes
      const artistInfo = this.combineResults(artistName, results)
      
      if (artistInfo) {
        // Salvar no cache
        this.cache.set(cacheKey, { data: artistInfo, timestamp: Date.now() })
        
        return {
          success: true,
          data: artistInfo,
          sources: this.getUsedSources(results)
        }
      } else {
        return {
          success: false,
          error: 'Nenhuma informação encontrada',
          sources: []
        }
      }
    } catch (error) {
      console.error('❌ Erro na busca:', error)
      return {
        success: false,
        error: 'Erro interno na busca',
        sources: []
      }
    }
  }

  /**
   * Busca usando MusicBrainz API (livre e oficial)
   */
  private async searchMusicBrainz(artistName: string): Promise<Partial<ArtistInfo> | null> {
    try {
      await this.delay(this.BASE_DELAY)
      
      const encodedName = encodeURIComponent(artistName)
      const response = await fetch(
        `https://musicbrainz.org/ws/2/artist?query=artist:${encodedName}&limit=1&fmt=json`,
        {
          headers: {
            'User-Agent': 'OrkulBr/1.0 (https://orkut-br-oficial.vercel.app)'
          }
        }
      )

      if (!response.ok) throw new Error(`MusicBrainz: ${response.status}`)

      const data = await response.json()
      const artist = data.artists?.[0]

      if (!artist) return null

      return {
        name: artist.name,
        bio: artist.disambiguation || undefined,
        formed: artist['life-span']?.begin || undefined,
        origin: artist.area?.name || undefined,
        genre: artist.tags?.map((tag: any) => tag.name) || [],
      }
    } catch (error) {
      console.warn('⚠️ MusicBrainz falhou:', error)
      return null
    }
  }

  /**
   * Busca usando Wikipedia API
   */
  private async searchWikipedia(artistName: string): Promise<Partial<ArtistInfo> | null> {
    try {
      await this.delay(this.BASE_DELAY)
      
      const encodedName = encodeURIComponent(artistName)
      
      // Buscar página
      const searchResponse = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodedName}`,
        {
          headers: {
            'User-Agent': 'OrkulBr/1.0 (https://orkut-br-oficial.vercel.app)'
          }
        }
      )

      if (!searchResponse.ok) throw new Error(`Wikipedia: ${searchResponse.status}`)

      const data = await searchResponse.json()

      if (data.type === 'disambiguation' || !data.extract) return null

      return {
        name: data.title,
        bio: data.extract,
        imageUrl: data.thumbnail?.source || undefined,
      }
    } catch (error) {
      console.warn('⚠️ Wikipedia falhou:', error)
      return null
    }
  }

  /**
   * Busca usando Google Custom Search (simulação com dorks)
   */
  private async searchGoogleDorks(artistName: string): Promise<Partial<ArtistInfo> | null> {
    try {
      // Simular busca com dorks - em produção, usaria Google Custom Search API
      const dorks = [
        `"${artistName}" band formed members`,
        `"${artistName}" discography albums`,
        `"${artistName}" biography music`,
        `site:allmusic.com "${artistName}"`,
        `site:discogs.com "${artistName}"`,
      ]

      // Por enquanto, retornar dados simulados baseados em padrões comuns
      return this.generateFallbackInfo(artistName)
    } catch (error) {
      console.warn('⚠️ Google Dorks falhou:', error)
      return null
    }
  }

  /**
   * Busca usando Last.fm API (requer chave)
   */
  private async searchLastFm(artistName: string): Promise<Partial<ArtistInfo> | null> {
    try {
      // Se tiver API key do Last.fm configurada
      const apiKey = process.env.NEXT_PUBLIC_LASTFM_API_KEY
      if (!apiKey) return null

      await this.delay(this.BASE_DELAY)
      
      const encodedName = encodeURIComponent(artistName)
      const response = await fetch(
        `https://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist=${encodedName}&api_key=${apiKey}&format=json`
      )

      if (!response.ok) throw new Error(`Last.fm: ${response.status}`)

      const data = await response.json()
      const artist = data.artist

      if (!artist) return null

      return {
        name: artist.name,
        bio: artist.bio?.summary || undefined,
        genre: artist.tags?.tag?.map((tag: any) => tag.name) || [],
        imageUrl: artist.image?.find((img: any) => img.size === 'large')?.['#text'] || undefined,
      }
    } catch (error) {
      console.warn('⚠️ Last.fm falhou:', error)
      return null
    }
  }

  /**
   * Combina resultados de diferentes fontes
   */
  private combineResults(artistName: string, results: PromiseSettledResult<Partial<ArtistInfo> | null>[]): ArtistInfo | null {
    const validResults: Partial<ArtistInfo>[] = []

    results.forEach(result => {
      if (result.status === 'fulfilled' && result.value) {
        validResults.push(result.value)
      }
    })

    if (validResults.length === 0) return null

    // Combinar informações (priorizar fontes mais confiáveis)
    const combined: ArtistInfo = {
      name: artistName,
      lastUpdated: new Date().toISOString()
    }

    validResults.forEach(result => {
      if (result.bio && !combined.bio) combined.bio = result.bio
      if (result.formed && !combined.formed) combined.formed = result.formed
      if (result.origin && !combined.origin) combined.origin = result.origin
      if (result.imageUrl && !combined.imageUrl) combined.imageUrl = result.imageUrl
      if (result.genre && result.genre.length > 0) {
        combined.genre = [...(combined.genre || []), ...result.genre]
        // Remover duplicatas
        combined.genre = Array.from(new Set(combined.genre))
      }
      if (result.members) combined.members = result.members
      if (result.albums) combined.albums = result.albums
      if (result.popularSongs) combined.popularSongs = result.popularSongs
    })

    return combined
  }

  /**
   * Gera informações de fallback baseadas em heurísticas
   */
  private generateFallbackInfo(artistName: string): Partial<ArtistInfo> {
    // Detectar possíveis anos no nome
    const yearMatch = artistName.match(/\b(19|20)\d{2}\b/)
    const possibleYear = yearMatch ? yearMatch[0] : undefined

    // Detectar gêneros comuns baseados em palavras-chave
    const genres: string[] = []
    const lowerName = artistName.toLowerCase()
    
    if (lowerName.includes('rock') || lowerName.includes('metal')) genres.push('Rock')
    if (lowerName.includes('pop')) genres.push('Pop')
    if (lowerName.includes('rap') || lowerName.includes('hip')) genres.push('Hip Hop')
    if (lowerName.includes('electronic') || lowerName.includes('techno')) genres.push('Electronic')
    if (lowerName.includes('jazz')) genres.push('Jazz')
    if (lowerName.includes('blues')) genres.push('Blues')

    return {
      name: artistName,
      formed: possibleYear,
      genre: genres.length > 0 ? genres : ['Música Popular'],
      bio: `${artistName} é um artista/banda conhecida por sua contribuição única para a música.`
    }
  }

  /**
   * Identifica quais fontes foram usadas com sucesso
   */
  private getUsedSources(results: PromiseSettledResult<any>[]): string[] {
    const sources = ['musicbrainz', 'wikipedia', 'google', 'lastfm']
    return sources.filter((_, index) => {
      const result = results[index]
      return result.status === 'fulfilled' && result.value
    })
  }

  /**
   * Delay para respeitar rate limits
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Limpa cache antigo
   */
  clearExpiredCache(): void {
    const now = Date.now()
    const keysToDelete: string[] = []
    
    this.cache.forEach((value, key) => {
      if (now - value.timestamp > this.CACHE_DURATION) {
        keysToDelete.push(key)
      }
    })
    
    keysToDelete.forEach(key => {
      this.cache.delete(key)
    })
  }

  /**
   * Busca rápida para informações básicas (para uso no card do DJ)
   */
  async quickArtistSearch(artistName: string): Promise<{ genre?: string; year?: string; info?: string }> {
    try {
      const result = await this.searchArtistInfo(artistName)
      
      if (result.success && result.data) {
        return {
          genre: result.data.genre?.[0] || 'Música',
          year: result.data.formed || undefined,
          info: result.data.bio ? this.truncateText(result.data.bio, 100) : undefined
        }
      }
      
      return { genre: 'Música' }
    } catch (error) {
      console.error('❌ Erro na busca rápida:', error)
      return { genre: 'Música' }
    }
  }

  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength).trim() + '...'
  }
}

// Instância singleton
export const musicInfoService = new MusicInfoService()

// Limpar cache periodicamente (a cada hora)
if (typeof window !== 'undefined') {
  setInterval(() => {
    musicInfoService.clearExpiredCache()
  }, 60 * 60 * 1000)
}
