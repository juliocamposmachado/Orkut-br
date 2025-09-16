'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { voiceService } from '@/lib/voice'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/auth-context'

interface VoiceContextType {
  isVoiceEnabled: boolean
  isListening: boolean
  isSpeaking: boolean
  toggleVoice: () => Promise<void>
  startListening: () => Promise<string>
  speak: (text: string, options?: { speed?: number; volume?: number }) => Promise<void>
  stopSpeaking: () => void
}

const VoiceContext = createContext<VoiceContextType | undefined>(undefined)

export function useVoice() {
  const context = useContext(VoiceContext)
  if (context === undefined) {
    throw new Error('useVoice must be used within a VoiceProvider')
  }
  return context
}

interface VoiceProviderProps {
  children: ReactNode
}

export function VoiceProvider({ children }: VoiceProviderProps) {
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const { user, profile } = useAuth()

  // Load voice settings
  useEffect(() => {
    if (user) {
      loadVoiceSettings()
    }
  }, [user])

  // Setup notification listener
  useEffect(() => {
    if (user && isVoiceEnabled && supabase) {
      const channel = supabase
        .channel(`notifications-${user.id}`)
        .on('postgres_changes',
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'notifications',
            filter: `profile_id=eq.${user.id}`
          },
          (payload) => {
            handleNewNotification(payload.new as any)
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [user, isVoiceEnabled]) // Keep dependencies as needed

  const loadVoiceSettings = async () => {
    if (!user) return

    // Por enquanto, usar apenas localStorage até criarmos a tabela settings
    try {
      const voiceEnabled = localStorage.getItem('voice_enabled') === 'true'
      setIsVoiceEnabled(voiceEnabled)
      console.log('✅ Configurações de voz carregadas do localStorage')
    } catch (error) {
      console.warn('Erro ao carregar configurações de voz:', error)
      setIsVoiceEnabled(false)
    }
  }

  const handleNewNotification = async (notification: any) => {
    if (!isVoiceEnabled) return

    let message = ''
    
    switch (notification.type) {
      case 'birthday':
        const { name, age } = notification.payload
        message = `Hoje é aniversário do ${name}. Ele faz ${age} anos.`
        break
      case 'new_scrap':
        const { from } = notification.payload
        message = `Você recebeu um novo scrap de ${from}.`
        break
      case 'friendship_request':
        message = `Você recebeu um novo pedido de amizade.`
        break
      case 'call_incoming':
        const { caller, type } = notification.payload
        message = `${caller} está te ligando por ${type === 'video' ? 'vídeo' : 'áudio'}.`
        break
      default:
        message = 'Você tem uma nova notificação.'
    }

    if (message) {
      await speak(message)
    }
  }

  const toggleVoice = async () => {
    if (!user) return

    try {
      const newValue = !isVoiceEnabled

      // Por enquanto, salvar apenas no localStorage
      localStorage.setItem('voice_enabled', newValue.toString())
      console.log('✅ Configurações de voz salvas no localStorage')

      setIsVoiceEnabled(newValue)

      if (newValue && profile) {
        // Greet user when enabling voice
        const greeting = voiceService.getGreeting(profile.display_name)
        await speak(greeting)
      } else {
        // Stop any ongoing speech
        voiceService.stopSpeaking()
        voiceService.stopListening()
        setIsListening(false)
        setIsSpeaking(false)
      }
    } catch (error) {
      console.error('Error toggling voice:', error)
      // Fallback em caso de erro
      const newValue = !isVoiceEnabled
      localStorage.setItem('voice_enabled', newValue.toString())
      setIsVoiceEnabled(newValue)
    }
  }

  const startListening = async (): Promise<string> => {
    if (!isVoiceEnabled) {
      throw new Error('Voice not enabled')
    }

    try {
      setIsListening(true)
      const result = await voiceService.listen()
      return result
    } finally {
      setIsListening(false)
    }
  }

  const speak = async (text: string, options?: { speed?: number; volume?: number }) => {
    if (!isVoiceEnabled) return

    try {
      setIsSpeaking(true)
      await voiceService.speak(text, options)
    } catch (error) {
      console.warn('Speech synthesis failed:', error)
      // Don't throw error to prevent crashes
    } finally {
      setIsSpeaking(false)
    }
  }

  const stopSpeaking = () => {
    voiceService.stopSpeaking()
    setIsSpeaking(false)
  }

  const value: VoiceContextType = {
    isVoiceEnabled,
    isListening,
    isSpeaking,
    toggleVoice,
    startListening,
    speak,
    stopSpeaking
  }

  return (
    <VoiceContext.Provider value={value}>
      {children}
    </VoiceContext.Provider>
  )
}