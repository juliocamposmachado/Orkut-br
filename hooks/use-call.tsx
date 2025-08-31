'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'

export interface CallUser {
  id: string
  name: string
  photo?: string
  username?: string
}

export interface CallState {
  isOpen: boolean
  callType: 'video' | 'audio' | null
  targetUser: CallUser | null
}

export function useCall() {
  const [callState, setCallState] = useState<CallState>({
    isOpen: false,
    callType: null,
    targetUser: null
  })

  const startCall = useCallback((user: CallUser, type: 'video' | 'audio') => {
    // Verificar permissões de mídia antes de iniciar
    if (type === 'video' && !navigator.mediaDevices) {
      toast.error('Chamadas de vídeo não são suportadas neste navegador')
      return
    }

    setCallState({
      isOpen: true,
      callType: type,
      targetUser: user
    })

    toast.info(`Iniciando ${type === 'video' ? 'chamada de vídeo' : 'chamada de áudio'} para ${user.name}...`)
  }, [])

  const endCall = useCallback(() => {
    setCallState({
      isOpen: false,
      callType: null,
      targetUser: null
    })
  }, [])

  const startVideoCall = useCallback((user: CallUser) => {
    startCall(user, 'video')
  }, [startCall])

  const startAudioCall = useCallback((user: CallUser) => {
    startCall(user, 'audio')
  }, [startCall])

  return {
    callState,
    startVideoCall,
    startAudioCall,
    endCall
  }
}
