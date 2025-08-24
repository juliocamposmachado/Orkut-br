'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Music, Radio, Sparkles, Clock, RefreshCw, ExternalLink } from 'lucide-react'

interface CurrentSong {
  artist: string
  song: string
  timestamp: string
}

interface MusicAnalysis {
  success: boolean
  content: string
  artist: string
  song: string
  timestamp: string
  fallback?: boolean
}

const SmartMusicCard: React.FC = () => {
  const [currentSong, setCurrentSong] = useState<CurrentSong | null>(null)
  const [analysis, setAnalysis] = useState<MusicAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  // Função para buscar a música atual
  const fetchCurrentSong = async (): Promise<CurrentSong | null> => {
    try {
      const response = await fetch('/api/radio-status')
      if (!response.ok) throw new Error('Erro ao buscar status da rádio')
      
      const data = await response.json()
      
      // Extrair informações da música atual
      if (data.currentSong) {
        const [artist, song] = data.currentSong.split(' - ')
        return {
          artist: artist?.trim() || 'Artista Desconhecido',
          song: song?.trim() || 'Música Desconhecida',
          timestamp: new Date().toISOString()
        }
      }
      
      return null
    } catch (err) {
      console.error('❌ Erro ao buscar música atual:', err)
      return null
    }
  }

  // Função para buscar análise musical do Gemini
  const fetchMusicAnalysis = async (artist: string, song: string): Promise<MusicAnalysis | null> => {
    try {
      const response = await fetch('/api/gemini/music-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ artist, song })
      })

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (err) {
      console.error('❌ Erro ao buscar análise musical:', err)
      return null
    }
  }

  // Função para gerar fallback quando a API falha
  const generateFallback = (artist: string, song: string): MusicAnalysis => {
    const fallbacks = [
      `🎵 "${song}" de ${artist} está tocando agora! Uma música que sempre emociona e traz boas lembranças 🎤✨ Ouça na Rádio Tatuapé FM! 📻`,
      `🎸 Que som incrível! ${artist} sempre sabe como criar uma atmosfera única com "${song}" 🎵🔥 Continue ouvindo na Rádio Tatuapé FM! 📻`,
      `💫 "${song}" - ${artist} é uma daquelas músicas que marcaram uma geração! 🎤🎵 Não perca na Rádio Tatuapé FM! 📻`,
      `🎵 Momento especial com "${song}" de ${artist}! Uma música cheia de história e emoção 🎸✨ Só na Rádio Tatuapé FM! 📻`
    ]
    
    const randomFallback = fallbacks[Math.floor(Math.random() * fallbacks.length)]
    
    return {
      success: true,
      content: randomFallback,
      artist,
      song,
      timestamp: new Date().toISOString(),
      fallback: true
    }
  }

  // Função principal para atualizar dados
  const updateMusicCard = async () => {
    setLoading(true)
    setError(null)

    try {
      // Buscar música atual
      const song = await fetchCurrentSong()
      
      if (!song) {
        setError('Nenhuma música está tocando no momento')
        setLoading(false)
        return
      }

      setCurrentSong(song)

      // Buscar análise da música
      const analysis = await fetchMusicAnalysis(song.artist, song.song)
      
      if (analysis && analysis.success) {
        setAnalysis(analysis)
      } else {
        // Usar fallback em caso de erro na API
        const fallbackAnalysis = generateFallback(song.artist, song.song)
        setAnalysis(fallbackAnalysis)
      }

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
    
    // Atualizar a cada 2 minutos
    const interval = setInterval(updateMusicCard, 2 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [])

  // Função para refresh manual
  const handleRefresh = () => {
    updateMusicCard()
  }

  // Função para abrir o site da rádio (mesmo do RadioWidget)
  const openRadioWebsite = () => {
    const radioWebsite = "https://radiotatuapefm.radiostream321.com/"
    window.open(radioWebsite, '_blank', 'noopener,noreferrer')
  }

  if (loading) {
    return (
      <Card className="w-full mb-6 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
            <span className="text-purple-600 font-medium">Carregando informações musicais...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !currentSong || !analysis) {
    return (
      <Card className="w-full mb-6 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 border-gray-300 dark:border-gray-600">
        <CardContent className="p-6 text-center">
          <Music className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error || 'Nenhuma música disponível no momento'}
          </p>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full mb-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 border-purple-200 dark:border-purple-700 shadow-lg">
      <CardContent className="p-6">
        {/* Header do Card */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            {/* Logo da Rádio */}
            <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-purple-300">
              <Image
                src="/logoradiotatuapefm.png"
                alt="Rádio Tatuapé FM"
                width={48}
                height={48}
                className="object-cover"
                onError={(e) => {
                  // Fallback para quando a imagem não carrega
                  (e.target as HTMLImageElement).style.display = 'none'
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Radio className="h-6 w-6 text-white" />
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-purple-700 dark:text-purple-300 flex items-center">
                <Sparkles className="h-5 w-5 mr-2" />
                DJ Orky Informa
              </h3>
              <div className="flex items-center space-x-2 text-sm text-purple-600 dark:text-purple-400">
                <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                  AO VIVO
                </Badge>
                {analysis.fallback && (
                  <Badge variant="outline" className="text-xs">
                    Modo Offline
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <Button
            onClick={handleRefresh}
            variant="ghost"
            size="sm"
            className="text-purple-600 hover:text-purple-700"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Informações da Música */}
        <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-4 mb-4">
          <div className="flex items-center space-x-3 mb-2">
            <Music className="h-5 w-5 text-purple-600" />
            <div>
              <h4 className="font-bold text-gray-900 dark:text-gray-100">
                {currentSong.song}
              </h4>
              <p className="text-purple-600 dark:text-purple-400 font-medium">
                {currentSong.artist}
              </p>
            </div>
          </div>
        </div>

        {/* Análise Inteligente */}
        <div className="space-y-3">
          <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg p-4 border border-purple-200/50">
            <p className="text-gray-800 dark:text-gray-200 leading-relaxed">
              {analysis.content}
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>Atualizado há {Math.floor((Date.now() - lastUpdate.getTime()) / 1000 / 60)} min</span>
            </div>
            
            <div className="flex items-center space-x-1">
              <span>Powered by</span>
              <Badge variant="outline" className="text-xs">
                Gemini AI
              </Badge>
            </div>
          </div>

          {/* Botão Ouvir Rádio */}
          <div className="mt-4 pt-3 border-t border-purple-200/50">
            <button
              onClick={openRadioWebsite}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
              title="Clique para ouvir no site da rádio"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
              <span>Ouvir Rádio</span>
              <ExternalLink className="w-4 h-4" />
            </button>
            
            <p className="text-xs text-gray-500 text-center mt-2">
              Abre o player externo da rádio
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default SmartMusicCard
