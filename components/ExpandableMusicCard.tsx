'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Loader2, 
  Music, 
  Radio, 
  Clock, 
  RefreshCw, 
  ExternalLink, 
  ChevronDown, 
  ChevronUp, 
  History, 
  Play,
  Volume2
} from 'lucide-react'

interface Song {
  artist: string
  song: string
  timestamp: string
  playing?: boolean
}

interface MusicHistoryItem {
  id: number
  artist: string
  song: string
  timestamp: string
  duration?: string
}

const ExpandableMusicCard: React.FC = () => {
  const [currentSong, setCurrentSong] = useState<Song | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [isExpanded, setIsExpanded] = useState(false) // Estado do card (expandido/colapsado)
  const [musicHistory, setMusicHistory] = useState<MusicHistoryItem[]>([]) // Histórico das últimas 8 músicas

  // Mock de histórico de músicas para demonstração
  const generateMockHistory = (): MusicHistoryItem[] => {
    const mockSongs = [
      { artist: 'The Beatles', song: 'Hey Jude', duration: '7:11' },
      { artist: 'Queen', song: 'Bohemian Rhapsody', duration: '5:55' },
      { artist: 'Pink Floyd', song: 'Wish You Were Here', duration: '5:34' },
      { artist: 'Led Zeppelin', song: 'Stairway to Heaven', duration: '8:02' },
      { artist: 'Eagles', song: 'Hotel California', duration: '6:30' },
      { artist: 'Fleetwood Mac', song: 'Go Your Own Way', duration: '3:39' },
      { artist: 'AC/DC', song: 'Back in Black', duration: '4:15' },
      { artist: 'Guns N\' Roses', song: 'Sweet Child O\' Mine', duration: '5:03' }
    ]

    return mockSongs.map((song, index) => ({
      id: index + 1,
      artist: song.artist,
      song: song.song,
      duration: song.duration,
      timestamp: new Date(Date.now() - (index + 1) * 4 * 60 * 1000).toISOString() // 4 min atrás para cada música
    })).reverse()
  }

  // Função para buscar a música atual
  const fetchCurrentSong = async (): Promise<Song | null> => {
    try {
      const response = await fetch('/api/radio-status')
      if (!response.ok) throw new Error('Erro ao buscar status da rádio')
      
      const data = await response.json()
      
      // Extrair informações da música atual
      if (data.currentSong) {
        const cleanSong = data.currentSong.trim()
        const separatorIndex = cleanSong.indexOf(' - ')
        
        if (separatorIndex > 0) {
          const artist = cleanSong.substring(0, separatorIndex).trim()
          const song = cleanSong.substring(separatorIndex + 3).trim()
          
          return {
            artist: artist || 'Artista Desconhecido',
            song: song || 'Música Desconhecida',
            timestamp: new Date().toISOString(),
            playing: true
          }
        } else {
          return {
            artist: 'Artista Desconhecido',
            song: cleanSong || 'Música Desconhecida',
            timestamp: new Date().toISOString(),
            playing: true
          }
        }
      }
      
      return null
    } catch (err) {
      console.error('❌ Erro ao buscar música atual:', err)
      return null
    }
  }

  // Função principal para atualizar dados
  const updateMusicCard = async () => {
    setLoading(true)
    setError(null)

    try {
      const song = await fetchCurrentSong()
      
      if (!song) {
        setCurrentSong({
          artist: "Rádio Tatuapé FM",
          song: "🎵 Aguardando próxima música...",
          timestamp: new Date().toISOString(),
          playing: false
        })
      } else {
        setCurrentSong(song)
      }

      // Gerar histórico mock (em produção isso viria de uma API)
      setMusicHistory(generateMockHistory())
      setLastUpdate(new Date())
    } catch (err) {
      console.error('❌ Erro ao atualizar card musical:', err)
      setError('Erro ao carregar informações')
    } finally {
      setLoading(false)
    }
  }

  // Carregar dados iniciais
  useEffect(() => {
    updateMusicCard()
    const interval = setInterval(updateMusicCard, 30000) // Atualizar a cada 30s
    return () => clearInterval(interval)
  }, [])

  // Função para refresh manual
  const handleRefresh = () => {
    updateMusicCard()
  }

  // Função para abrir o site da rádio
  const openRadioWebsite = () => {
    const radioWebsite = "https://radiotatuapefm.radiostream321.com/"
    window.open(radioWebsite, '_blank', 'noopener,noreferrer')
  }

  // Função para formatar tempo
  const formatTimeAgo = (timestamp: string): string => {
    const now = new Date()
    const then = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - then.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'agora'
    if (diffInMinutes === 1) return '1 min atrás'
    if (diffInMinutes < 60) return `${diffInMinutes} min atrás`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours === 1) return '1h atrás'
    return `${diffInHours}h atrás`
  }

  if (loading) {
    return (
      <Card className="w-full bg-gradient-to-br from-purple-100 to-pink-100 border-purple-200 min-h-[200px] flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
          <span className="text-purple-600 font-medium">Carregando...</span>
        </div>
      </Card>
    )
  }

  if (error || !currentSong) {
    return (
      <Card className="w-full bg-gradient-to-br from-gray-100 to-gray-200 border-gray-300 min-h-[200px] flex items-center justify-center">
        <div className="text-center">
          <Music className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 mb-4">
            {error || 'Erro ao carregar'}
          </p>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar novamente
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card className={`w-full bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 shadow-lg transition-all duration-300 ${
      isExpanded ? 'min-h-auto' : 'min-h-[200px]'
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Logo da Rádio */}
            <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-purple-300">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Radio className="h-5 w-5 text-white" />
              </div>
            </div>
            
            <div>
              <h3 className="text-base font-bold text-purple-700">
                🎵 Rádio Tatuapé FM
              </h3>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                  AO VIVO
                </Badge>
                {currentSong.playing && (
                  <div className="flex items-center">
                    <Volume2 className="h-3 w-3 text-purple-600 animate-pulse" />
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <Button
            onClick={handleRefresh}
            variant="ghost"
            size="sm"
            className="text-purple-600 hover:text-purple-700 h-8 w-8 p-0"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Música Atual */}
        <div className="bg-white/60 rounded-lg p-3 mb-4">
          <div className="flex items-center space-x-2">
            <div className="flex items-center justify-center w-8 h-8 bg-purple-500 rounded-full">
              <Play className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900 text-sm truncate">
                {currentSong.song}
              </h4>
              <p className="text-purple-600 font-medium text-xs truncate">
                {currentSong.artist}
              </p>
            </div>
          </div>
        </div>

        {/* Botão Expandir/Colapsar */}
        <div className="flex justify-center mb-4">
          <Button
            onClick={() => setIsExpanded(!isExpanded)}
            variant="outline"
            size="sm"
            className="border-purple-300 text-purple-700 hover:bg-purple-50"
          >
            <History className="h-4 w-4 mr-2" />
            {isExpanded ? 'Ocultar Histórico' : 'Ver Últimas 8 Músicas'}
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 ml-2" />
            ) : (
              <ChevronDown className="h-4 w-4 ml-2" />
            )}
          </Button>
        </div>

        {/* Histórico Expandido */}
        {isExpanded && (
          <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
            <h4 className="text-sm font-semibold text-gray-700 flex items-center">
              <History className="h-4 w-4 mr-2" />
              Histórico Musical
            </h4>
            
            <div className="space-y-2">
              {musicHistory.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center space-x-3 p-2 bg-white/40 rounded-lg hover:bg-white/60 transition-colors"
                >
                  <div className="flex items-center justify-center w-6 h-6 bg-gray-300 rounded-full text-xs font-medium">
                    {musicHistory.length - index}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 truncate">
                      {item.song}
                    </p>
                    <p className="text-xs text-gray-600 truncate">
                      {item.artist}
                    </p>
                  </div>
                  <div className="text-right">
                    {item.duration && (
                      <p className="text-xs text-gray-500">{item.duration}</p>
                    )}
                    <p className="text-xs text-gray-400">
                      {formatTimeAgo(item.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Info */}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <div className="flex items-center space-x-1">
            <Clock className="h-3 w-3" />
            <span>Atualizado há {Math.floor((Date.now() - lastUpdate.getTime()) / 1000 / 60)} min</span>
          </div>
          <span className="text-xs">📻 Tatuapé FM</span>
        </div>

        {/* Botão Ouvir Rádio */}
        <button
          onClick={openRadioWebsite}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl flex items-center justify-center space-x-2 text-sm"
          title="Clique para ouvir no site da rádio"
        >
          <Play className="w-4 h-4" />
          <span>Ouvir Agora</span>
          <ExternalLink className="w-3 h-3" />
        </button>
      </CardContent>
    </Card>
  )
}

export default ExpandableMusicCard
