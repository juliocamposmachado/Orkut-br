'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/enhanced-auth-context'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Phone, PhoneOff, Video, Mic } from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

export interface IncomingCallData {
  callId: string
  callType: 'audio' | 'video'
  fromUser: {
    id: string
    username: string
    display_name: string
    photo_url?: string
  }
  offer: any
  timestamp: string
}

interface IncomingCallNotificationProps {
  onAcceptCall: (callData: IncomingCallData) => Promise<void>
  onRejectCall: (callId: string) => Promise<void>
}

export function IncomingCallNotification({ 
  onAcceptCall, 
  onRejectCall 
}: IncomingCallNotificationProps) {
  const { user } = useAuth()
  const [incomingCall, setIncomingCall] = useState<IncomingCallData | null>(null)
  const [isRinging, setIsRinging] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [isResponding, setIsResponding] = useState(false)

  // Audio para toque da chamada
  const [callSound, setCallSound] = useState<HTMLAudioElement | null>(null)

  useEffect(() => {
    // Criar áudio do toque
    if (typeof window !== 'undefined') {
      const audio = new Audio()
      // Usar um tom simples via Web Audio API ou arquivo de áudio
      try {
        // Criar um toque simples usando Web Audio API
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()
        
        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)
        
        // Configurar um toque agradável
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
        oscillator.type = 'sine'
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
        
        setCallSound(audio)
      } catch (error) {
        console.warn('Não foi possível criar áudio do toque:', error)
      }
    }
  }, [])

  // Tocar som da chamada
  const playRingtone = useCallback(() => {
    if (!callSound) return
    
    try {
      // Usar Web Audio API para criar um toque
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      // Tom de toque (duas notas alternadas)
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.5)
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 1)
      
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1.5)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 1.5)
    } catch (error) {
      console.warn('Erro ao tocar toque:', error)
    }
  }, [callSound])

  // Parar som da chamada
  const stopRingtone = useCallback(() => {
    if (callSound) {
      callSound.pause()
      callSound.currentTime = 0
    }
  }, [callSound])

  // Escutar notificações de chamada em tempo real
  useEffect(() => {
    if (!user) return

    console.log('📞 Configurando listener para chamadas recebidas...')

    // Subscribe para notificações de chamada
    const callChannel = supabase
      .channel(`incoming_calls:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `profile_id=eq.${user.id}`
        },
        (payload) => {
          console.log('🔔 Nova notificação recebida:', payload)
          
          if (payload.new.type === 'incoming_call') {
            const notificationData = payload.new.payload as any
            
            setIncomingCall({
              callId: notificationData.call_id,
              callType: notificationData.call_type,
              fromUser: notificationData.from_user,
              offer: notificationData.offer,
              timestamp: notificationData.timestamp
            })
            
            setIsRinging(true)
            setCallDuration(0)
            
            toast.info(`📞 Chamada ${notificationData.call_type === 'video' ? 'de vídeo' : 'de áudio'} de ${notificationData.from_user.display_name}`)
          }
        }
      )
      .subscribe()

    return () => {
      console.log('📞 Removendo listener de chamadas...')
      supabase.removeChannel(callChannel)
    }
  }, [user])

  // Timer para contagem de chamada
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null
    
    if (isRinging) {
      timer = setInterval(() => {
        setCallDuration(prev => prev + 1)
        
        // Tocar toque a cada 3 segundos
        if (callDuration % 3 === 0) {
          playRingtone()
        }
        
        // Encerrar automaticamente após 30 segundos
        if (callDuration >= 30) {
          handleReject()
        }
      }, 1000)
    }

    return () => {
      if (timer) clearInterval(timer)
    }
  }, [isRinging, callDuration, playRingtone])

  // Aceitar chamada
  const handleAccept = async () => {
    if (!incomingCall || isResponding) return
    
    setIsResponding(true)
    stopRingtone()
    
    try {
      await onAcceptCall(incomingCall)
      
      // Responder via API
      const response = await fetch('/api/call-notification', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callId: incomingCall.callId,
          action: 'accept'
        })
      })

      if (!response.ok) {
        throw new Error('Falha ao aceitar chamada')
      }

      setIncomingCall(null)
      setIsRinging(false)
      toast.success('Chamada aceita!')
      
    } catch (error) {
      console.error('Erro ao aceitar chamada:', error)
      toast.error('Erro ao aceitar chamada')
    } finally {
      setIsResponding(false)
    }
  }

  // Rejeitar chamada
  const handleReject = async () => {
    if (!incomingCall || isResponding) return
    
    setIsResponding(true)
    stopRingtone()
    
    try {
      await onRejectCall(incomingCall.callId)
      
      // Responder via API
      const response = await fetch('/api/call-notification', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callId: incomingCall.callId,
          action: 'reject'
        })
      })

      if (!response.ok) {
        console.warn('Falha ao rejeitar chamada via API')
      }

      setIncomingCall(null)
      setIsRinging(false)
      toast.info('Chamada rejeitada')
      
    } catch (error) {
      console.error('Erro ao rejeitar chamada:', error)
      toast.error('Erro ao rejeitar chamada')
    } finally {
      setIsResponding(false)
    }
  }

  if (!incomingCall || !isRinging) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 50 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      >
        <Card className="w-96 max-w-sm mx-4 shadow-2xl border-2 border-purple-200 bg-white">
          <CardContent className="p-6 text-center">
            {/* Avatar e informações do usuário */}
            <div className="mb-6">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="mb-4"
              >
                <Avatar className="w-24 h-24 mx-auto border-4 border-purple-200">
                  <AvatarImage src={incomingCall.fromUser.photo_url} />
                  <AvatarFallback className="text-2xl bg-gradient-to-br from-purple-400 to-pink-400 text-white">
                    {incomingCall.fromUser.display_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </motion.div>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {incomingCall.fromUser.display_name}
              </h3>
              
              <p className="text-gray-600 text-sm mb-2">
                @{incomingCall.fromUser.username}
              </p>
              
              <Badge variant="secondary" className="mb-4">
                {incomingCall.callType === 'video' ? (
                  <>
                    <Video className="w-4 h-4 mr-1" />
                    Chamada de Vídeo
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4 mr-1" />
                    Chamada de Áudio
                  </>
                )}
              </Badge>
            </div>

            {/* Status da chamada */}
            <div className="mb-6">
              <motion.p
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-purple-600 font-medium"
              >
                Chamada recebida...
              </motion.p>
              
              <p className="text-gray-500 text-sm mt-1">
                {Math.floor(callDuration / 60)}:{String(callDuration % 60).padStart(2, '0')}
              </p>
            </div>

            {/* Botões de ação */}
            <div className="flex justify-center space-x-4">
              {/* Botão Rejeitar */}
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={handleReject}
                  disabled={isResponding}
                  size="lg"
                  className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg"
                >
                  <PhoneOff className="w-6 h-6" />
                </Button>
              </motion.div>
              
              {/* Botão Aceitar */}
              <motion.div 
                whileHover={{ scale: 1.05 }} 
                whileTap={{ scale: 0.95 }}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Button
                  onClick={handleAccept}
                  disabled={isResponding}
                  size="lg"
                  className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-lg"
                >
                  <Phone className="w-6 h-6" />
                </Button>
              </motion.div>
            </div>
            
            {/* Indicador de carregamento */}
            {isResponding && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4 text-sm text-gray-500"
              >
                Processando...
              </motion.p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}
