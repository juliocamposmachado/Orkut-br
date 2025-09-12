'use client'

import React, { useEffect, useState, useRef } from 'react'
import { Phone, PhoneOff, Video, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

interface CallNotificationProps {
  show: boolean
  callerName: string
  callerPhoto?: string
  callType: 'audio' | 'video'
  onAccept: () => void
  onReject: () => void
  autoRejectAfter?: number // segundos, padrão 30
}

export const CallNotification: React.FC<CallNotificationProps> = ({
  show,
  callerName,
  callerPhoto,
  callType,
  onAccept,
  onReject,
  autoRejectAfter = 30
}) => {
  const [timeLeft, setTimeLeft] = useState(autoRejectAfter)
  const [isRinging, setIsRinging] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Inicializar áudio de toque
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Criar áudio de toque (usando Web Audio API para gerar um som de toque)
      const createRingtone = () => {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)

        oscillator.frequency.setValueAtTime(440, audioContext.currentTime) // Nota A4
        oscillator.type = 'sine'

        gainNode.gain.setValueAtTime(0, audioContext.currentTime)
        gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.1)
        gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.5)

        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.5)

        return new Promise(resolve => {
          oscillator.onended = resolve
        })
      }

      const playRingtone = async () => {
        try {
          await createRingtone()
        } catch (error) {
          console.log('Erro ao reproduzir toque:', error)
        }
      }

      if (show && !audioRef.current) {
        audioRef.current = { play: playRingtone } as any
      }
    }
  }, [show])

  // Gerenciar toque e timeout
  useEffect(() => {
    if (show) {
      setTimeLeft(autoRejectAfter)
      setIsRinging(true)

      // Tocar som de toque a cada 2 segundos
      const playRing = async () => {
        if (audioRef.current) {
          try {
            await audioRef.current.play()
          } catch (error) {
            console.log('Não foi possível reproduzir o toque')
          }
        }
      }

      // Começar toque imediatamente
      playRing()

      // Repetir toque a cada 2 segundos
      const ringInterval = setInterval(() => {
        if (isRinging) {
          playRing()
        }
      }, 2000)

      // Countdown timer
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            onReject() // Auto-rejeitar quando tempo acabar
            return 0
          }
          return prev - 1
        })
      }, 1000)

      // Cleanup ao desmontar
      return () => {
        setIsRinging(false)
        clearInterval(ringInterval)
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
        }
      }
    } else {
      setIsRinging(false)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [show, autoRejectAfter, onReject, isRinging])

  const handleAccept = () => {
    setIsRinging(false)
    onAccept()
  }

  const handleReject = () => {
    setIsRinging(false)
    onReject()
  }

  if (!show) {
    return null
  }

  return (
    <>
      {/* Overlay de fundo */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        
        {/* Notificação principal */}
        <Card className="w-full max-w-md bg-white dark:bg-gray-900 shadow-2xl animate-in slide-in-from-top-2 duration-300">
          <div className="p-6">
            
            {/* Cabeçalho */}
            <div className="text-center mb-6">
              <Badge 
                variant={callType === 'video' ? 'default' : 'secondary'}
                className={`mb-2 ${callType === 'video' ? 'bg-blue-500' : 'bg-green-500'}`}
              >
                {callType === 'video' && <Video className="w-3 h-3 mr-1" />}
                {callType === 'audio' && <Phone className="w-3 h-3 mr-1" />}
                Chamada {callType === 'video' ? 'de vídeo' : 'de áudio'}
              </Badge>
            </div>

            {/* Avatar e informações do chamador */}
            <div className="text-center mb-6">
              <div className="relative inline-block">
                <Avatar className="w-24 h-24 mx-auto mb-4 ring-4 ring-blue-500 ring-opacity-50 animate-pulse">
                  <AvatarImage src={callerPhoto} />
                  <AvatarFallback className="text-2xl">
                    {callerName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                {/* Indicador de chamada ativa */}
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-bounce">
                  {callType === 'video' ? (
                    <Video className="w-3 h-3 text-white" />
                  ) : (
                    <Phone className="w-3 h-3 text-white" />
                  )}
                </div>
              </div>

              <h3 className="text-xl font-semibold mb-2">
                {callerName}
              </h3>
              
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                está chamando você...
              </p>

              {/* Timer */}
              <div className="text-sm text-gray-500 dark:text-gray-400">
                <div className={`
                  inline-flex items-center px-2 py-1 rounded-full 
                  ${timeLeft <= 10 ? 'bg-red-100 text-red-600 dark:bg-red-900/20' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}
                `}>
                  ⏱️ {timeLeft}s
                </div>
              </div>
            </div>

            {/* Botões de ação */}
            <div className="flex justify-center space-x-8">
              
              {/* Botão Rejeitar */}
              <Button
                onClick={handleReject}
                variant="destructive"
                size="lg"
                className="rounded-full w-16 h-16 p-0 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
              >
                <PhoneOff className="w-6 h-6" />
              </Button>

              {/* Botão Aceitar */}
              <Button
                onClick={handleAccept}
                size="lg"
                className={`
                  rounded-full w-16 h-16 p-0 shadow-lg hover:shadow-xl 
                  transition-all duration-200 hover:scale-105
                  ${callType === 'video' 
                    ? 'bg-blue-500 hover:bg-blue-600' 
                    : 'bg-green-500 hover:bg-green-600'
                  }
                  text-white
                `}
              >
                {callType === 'video' ? (
                  <Video className="w-6 h-6" />
                ) : (
                  <Phone className="w-6 h-6" />
                )}
              </Button>
            </div>

            {/* Informações adicionais */}
            <div className="text-center mt-4 text-xs text-gray-500 dark:text-gray-400">
              {timeLeft <= 10 && (
                <p className="text-red-500 animate-pulse">
                  ⚠️ Chamada será rejeitada automaticamente em {timeLeft}s
                </p>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Vibração para dispositivos móveis */}
      <VibrateNotification show={show && isRinging} />
    </>
  )
}

// Componente para vibração em dispositivos móveis
const VibrateNotification: React.FC<{ show: boolean }> = ({ show }) => {
  useEffect(() => {
    if (show && 'vibrate' in navigator) {
      // Padrão de vibração: vibrar por 300ms, pausar 200ms, repetir
      const vibratePattern = [300, 200, 300, 200, 300]
      
      const vibrateInterval = setInterval(() => {
        navigator.vibrate(vibratePattern)
      }, 2000)

      return () => {
        clearInterval(vibrateInterval)
        navigator.vibrate(0) // Parar vibração
      }
    }
  }, [show])

  return null
}

// Componente minimalista para notificações pequenas
interface MiniCallNotificationProps {
  show: boolean
  callerName: string
  callType: 'audio' | 'video'
  onAccept: () => void
  onReject: () => void
}

export const MiniCallNotification: React.FC<MiniCallNotificationProps> = ({
  show,
  callerName,
  callType,
  onAccept,
  onReject
}) => {
  if (!show) return null

  return (
    <div className="fixed top-4 right-4 z-50">
      <Card className="p-3 bg-white dark:bg-gray-900 shadow-lg animate-in slide-in-from-right-2">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            {callType === 'video' ? (
              <Video className="w-5 h-5 text-blue-500" />
            ) : (
              <Phone className="w-5 h-5 text-green-500" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {callerName}
            </p>
            <p className="text-xs text-gray-500">
              Chamada de {callType === 'video' ? 'vídeo' : 'áudio'}
            </p>
          </div>

          <div className="flex space-x-1">
            <Button
              onClick={onReject}
              variant="ghost"
              size="sm"
              className="w-8 h-8 p-0 text-red-500 hover:bg-red-50"
            >
              <PhoneOff className="w-4 h-4" />
            </Button>
            
            <Button
              onClick={onAccept}
              variant="ghost"
              size="sm"
              className={`w-8 h-8 p-0 hover:bg-opacity-10 ${
                callType === 'video' 
                  ? 'text-blue-500 hover:bg-blue-50' 
                  : 'text-green-500 hover:bg-green-50'
              }`}
            >
              {callType === 'video' ? (
                <Video className="w-4 h-4" />
              ) : (
                <Phone className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
