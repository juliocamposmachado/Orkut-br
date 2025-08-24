'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Music, Radio, Sparkles, Users, Clock, Heart } from 'lucide-react'
import { useRadio } from '@/hooks/use-radio'

interface MusicInfo {
  artist: string
  title: string
  curiosities: string
  bandInfo: string
  members: string
  recommendation: string
  era: string
  genre: string
  funFact: string
}

export function SmartMusicCard() {
  const { currentSong, isPlaying } = useRadio()
  const [musicInfo, setMusicInfo] = useState<MusicInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [lastSong, setLastSong] = useState<string>('')

  // Função para chamar a API do Gemini
  const generateMusicInfo = async (artist: string, title: string) => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/dj-orky/music-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          artist,
          title,
          language: 'pt-BR'
        }),
      })

      if (!response.ok) {
        throw new Error('Erro ao buscar informações da música')
      }

      const data = await response.json()
      setMusicInfo(data.musicInfo)
    } catch (error) {
      console.error('Erro ao gerar informações da música:', error)
    } finally {
      setLoading(false)
    }
  }

  // Monitora mudanças na música atual
  useEffect(() => {
    if (currentSong?.currentSong && currentSong.currentSong !== lastSong) {
      setLastSong(currentSong.currentSong)
      
      // Extrair artista e título da string (formato: "Artist - Title")
      const parts = currentSong.currentSong.split(' - ')
      if (parts.length >= 2) {
        const artist = parts[0].trim()
        const title = parts.slice(1).join(' - ').trim()
        generateMusicInfo(artist, title)
      }
    }
  }, [currentSong, lastSong])

  if (!currentSong?.currentSong || !isPlaying) {
    return null
  }

  return (
    <Card className="w-full max-w-2xl mx-auto bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 shadow-lg">
      {/* Header do DJ Orky */}
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
            <Music className="w-6 h-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              🎵 DJ Orky
              <Sparkles className="w-4 h-4 text-yellow-500" />
            </CardTitle>
            <CardDescription className="text-sm">
              Especialista em música retrô da Rádio Tatuapé FM
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Música atual */}
        <div className="bg-white rounded-lg p-4 border border-purple-100">
          <div className="flex items-center gap-2 mb-2">
            <Radio className="w-4 h-4 text-purple-600" />
            <span className="font-medium text-purple-800">Tocando agora:</span>
          </div>
          <h3 className="font-bold text-lg text-gray-800">
            {currentSong.currentSong}
          </h3>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="bg-white rounded-lg p-4 border border-purple-100">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600 animate-spin" />
              <span className="text-purple-700">
                O DJ Orky está pesquisando informações sobre esta música...
              </span>
            </div>
          </div>
        )}

        {/* Informações geradas pela IA */}
        {musicInfo && !loading && (
          <div className="space-y-3">
            {/* Curiosidades */}
            {musicInfo.curiosities && (
              <div className="bg-white rounded-lg p-4 border border-purple-100">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-yellow-500" />
                  <span className="font-medium text-gray-700">Curiosidades</span>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {musicInfo.curiosities}
                </p>
              </div>
            )}

            {/* Informações da banda */}
            {musicInfo.bandInfo && (
              <div className="bg-white rounded-lg p-4 border border-purple-100">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-blue-500" />
                  <span className="font-medium text-gray-700">Sobre a Banda</span>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {musicInfo.bandInfo}
                </p>
              </div>
            )}

            {/* Membros */}
            {musicInfo.members && (
              <div className="bg-white rounded-lg p-4 border border-purple-100">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="w-4 h-4 text-red-500" />
                  <span className="font-medium text-gray-700">Integrantes</span>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {musicInfo.members}
                </p>
              </div>
            )}

            {/* Badges com informações extras */}
            <div className="flex flex-wrap gap-2">
              {musicInfo.era && (
                <Badge variant="outline" className="text-purple-700 border-purple-300">
                  <Clock className="w-3 h-3 mr-1" />
                  {musicInfo.era}
                </Badge>
              )}
              {musicInfo.genre && (
                <Badge variant="outline" className="text-blue-700 border-blue-300">
                  {musicInfo.genre}
                </Badge>
              )}
            </div>

            {/* Fato curioso */}
            {musicInfo.funFact && (
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-3 border border-yellow-200">
                <p className="text-sm text-yellow-800">
                  💡 <strong>Você sabia?</strong> {musicInfo.funFact}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Call to action */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">🎧 Curtindo essa música?</p>
              <p className="text-sm text-purple-100">
                Continue ouvindo na Rádio Tatuapé FM!
              </p>
            </div>
            <Button 
              variant="secondary" 
              size="sm"
              className="bg-white text-purple-600 hover:bg-gray-100"
              onClick={() => {
                // Scroll para o player de rádio
                const radioPlayer = document.querySelector('[data-radio-player]')
                if (radioPlayer) {
                  radioPlayer.scrollIntoView({ behavior: 'smooth' })
                }
              }}
            >
              <Radio className="w-4 h-4 mr-1" />
              Ouvir Rádio
            </Button>
          </div>
        </div>

        {/* Assinatura do DJ Orky */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            ✨ Powered by DJ Orky AI • Rádio Tatuapé FM
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
