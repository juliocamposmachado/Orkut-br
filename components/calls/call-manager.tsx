'use client'

import { useWebRTC } from '@/contexts/webrtc-context'
import { AudioCallModal } from './audio-call-modal'
import { VideoCallModal } from './video-call-modal'

/**
 * Componente principal que gerencia todos os tipos de chamada
 * Renderiza o modal apropriado baseado no tipo de chamada ativa
 */
export function CallManager() {
  const { callState } = useWebRTC()
  
  // Não renderiza nada se não há chamada ativa
  if (!callState.isInCall) {
    return null
  }
  
  // Renderiza o modal apropriado baseado no tipo de chamada
  return (
    <>
      {callState.callType === 'audio' && <AudioCallModal />}
      {callState.callType === 'video' && <VideoCallModal />}
    </>
  )
}
