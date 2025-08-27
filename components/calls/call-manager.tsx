'use client'

import { useWebRTC } from '@/contexts/webrtc-context'
import { AudioCallModal } from './audio-call-modal'
import { VideoCallModal } from './video-call-modal'
import { CallNotification } from '@/components/call/call-notification'
import { CallTestButton } from '@/components/call/call-test-button'

/**
 * Componente principal que gerencia todos os tipos de chamada
 * Renderiza o modal apropriado baseado no tipo de chamada ativa
 * Inclui notificações de chamadas recebidas
 */
export function CallManager() {
  const { callState } = useWebRTC()
  
  return (
    <>
      {/* Sistema de notificações de chamadas recebidas */}
      <CallNotification />
      
      {/* Modais de chamada ativa */}
      {callState.isInCall && (
        <>
          {callState.callType === 'audio' && <AudioCallModal />}
          {callState.callType === 'video' && <VideoCallModal />}
        </>
      )}
      
      {/* Botão de teste (apenas em desenvolvimento) */}
      <CallTestButton />
    </>
  )
}
