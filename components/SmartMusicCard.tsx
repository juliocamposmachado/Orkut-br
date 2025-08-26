'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Music, Radio, Sparkles, Clock, RefreshCw, ExternalLink, Heart } from 'lucide-react'

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
  const [userStartTime] = useState<Date>(new Date()) // Momento em que o usuário entrou no site
  const [showInvitation, setShowInvitation] = useState(true) // Controla se mostra convite ou análise
  const [lastAnalysisTime, setLastAnalysisTime] = useState<Date | null>(null) // Último momento de análise musical

  // Função para buscar a música atual
  const fetchCurrentSong = async (): Promise<CurrentSong | null> => {
    try {
      const response = await fetch('/api/radio-status')
      if (!response.ok) throw new Error('Erro ao buscar status da rádio')
      
      const data = await response.json()
      
      // Extrair informações da música atual
      if (data.currentSong) {
        // Tratar caracteres especiais e acentos
        const cleanSong = data.currentSong.trim()
        
        // Procurar pelo primeiro ' - ' (artista - música)
        const separatorIndex = cleanSong.indexOf(' - ')
        
        if (separatorIndex > 0) {
          const artist = cleanSong.substring(0, separatorIndex).trim()
          const song = cleanSong.substring(separatorIndex + 3).trim()
          
          return {
            artist: artist || 'Artista Desconhecido',
            song: song || 'Música Desconhecida',
            timestamp: new Date().toISOString()
          }
        } else {
          // Se não encontrou separador, usar a string toda como música
          return {
            artist: 'Artista Desconhecido',
            song: cleanSong || 'Música Desconhecida',
            timestamp: new Date().toISOString()
          }
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

  // Array de frases convidativas para incentivo à rádio
  const invitationMessages = [
    "🎵 Que tal relaxar ouvindo nossa seleção musical? A Rádio Tatuapé FM tem o melhor da música para você! 📻✨",
    "🎶 Sua trilha sonora perfeita está aqui! Sintonize a Rádio Tatuapé FM e deixe a música embalar seu momento 🎧💫",
    "📻 Música boa não para! Venha curtir os sucessos que tocam na Rádio Tatuapé FM - sua companhia musical favorita! 🎵❤️",
    "🎤 Momentos especiais pedem músicas especiais! A Rádio Tatuapé FM está aqui para alegrar seu dia 🌟📻",
    "🎸 Rock, pop, MPB e muito mais! Na Rádio Tatuapé FM você encontra todos os estilos que ama 🎵🔥",
    "💿 Nossos DJs selecionaram os melhores hits para você! Não perca - Rádio Tatuapé FM no ar! 📻🎶",
    "🎹 Cada música conta uma história... Deixe a Rádio Tatuapé FM contar a sua através dos nossos sons! 🎵📖",
    "🌈 Cores e sons se misturam na Rádio Tatuapé FM! Venha viver essa experiência musical única conosco! 🎶✨",
    "🎺 Do clássico ao contemporâneo, temos tudo que você precisa ouvir! Rádio Tatuapé FM - sempre no seu coração! 💕📻",
    "🥳 Que festa é a nossa programação! Junte-se a nós na Rádio Tatuapé FM e celebre a boa música! 🎉🎵"
  ]

  // Função para gerar mensagem convidativa aleatória
  const generateInvitationMessage = (): string => {
    const randomIndex = Math.floor(Math.random() * invitationMessages.length)
    return invitationMessages[randomIndex]
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

  // Função para verificar se deve fazer análise musical
  const shouldAnalyzeMusic = (): boolean => {
    const now = new Date()
    const timeOnSite = (now.getTime() - userStartTime.getTime()) / 1000 / 60 // minutos no site
    
    // Só faz análise após 10 minutos no site
    if (timeOnSite < 10) {
      return false
    }
    
    // Se nunca fez análise e já passou 10 minutos, fazer agora
    if (!lastAnalysisTime) {
      return true
    }
    
    // Verificar se já passaram 10 minutos desde a última análise
    const timeSinceLastAnalysis = (now.getTime() - lastAnalysisTime.getTime()) / 1000 / 60
    return timeSinceLastAnalysis >= 10
  }

  // Função principal para atualizar dados
  const updateMusicCard = async () => {
    setLoading(true)
    setError(null)

    try {
      // Buscar música atual sempre (para mostrar o que está tocando)
      const song = await fetchCurrentSong()
      
      if (!song) {
        // Se não conseguiu buscar música, mostrar apenas mensagem convidativa
        const invitationContent = generateInvitationMessage()
        setAnalysis({
          success: true,
          content: invitationContent,
          artist: "Rádio Tatuapé FM",
          song: "Programação Musical",
          timestamp: new Date().toISOString(),
          fallback: false
        })
        setCurrentSong({
          artist: "Rádio Tatuapé FM",
          song: "🎵 Sua música favorita está aqui!",
          timestamp: new Date().toISOString()
        })
        setShowInvitation(true)
        setLastUpdate(new Date())
        return
      }

      setCurrentSong(song)

      // Verificar se deve fazer análise musical ou mostrar convite
      if (shouldAnalyzeMusic()) {
        console.log('🎵 Fazendo análise musical - tempo adequado!')
        
        // Fazer análise musical do Gemini
        const analysis = await fetchMusicAnalysis(song.artist, song.song)
        
        if (analysis && analysis.success) {
          setAnalysis(analysis)
          setShowInvitation(false)
          setLastAnalysisTime(new Date()) // Marcar o momento da análise
        } else {
          // Usar fallback em caso de erro na API
          const fallbackAnalysis = generateFallback(song.artist, song.song)
          setAnalysis(fallbackAnalysis)
          setShowInvitation(false)
          setLastAnalysisTime(new Date())
        }
      } else {
        console.log('🎶 Mostrando mensagem convidativa - aguardando tempo para análise')
        
        // Mostrar mensagem convidativa em vez de análise
        const invitationContent = generateInvitationMessage()
        setAnalysis({
          success: true,
          content: invitationContent,
          artist: song.artist,
          song: song.song,
          timestamp: new Date().toISOString(),
          fallback: false
        })
        setShowInvitation(true)
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
    
    // Intervalo inteligente:
    // - Primeiros 10 min: frases convidativas a cada 30s
    // - Após 10 min: alterna entre convites (30s) e análises (10min)
    const interval = setInterval(updateMusicCard, 30000) // 30s para ser mais dinâmico
    
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
