'use client'

import { useWebRTC } from '@/contexts/webrtc-context'
import { AudioCallModal } from './audio-call-modal'
import { VideoCallModal } from './video-call-modal'
import { CallNotification } from '@/components/call/call-notification'
import { CallPanel } from '@/components/call/call-panel'
import { CallStatusIndicator } from '@/components/call/call-status-indicator'

/**
 * Componente principal que gerencia todos os tipos de chamada
 * Renderiza o modal apropriado baseado no tipo de chamada ativa
 * Inclui notificações, painel de controle e indicadores visuais
 */
export function CallManager() {
  const { callState } = useWebRTC()
  
  return (
    <>
      {/* Sistema de notificações de chamadas recebidas */}
      <CallNotification />
      
      {/* Indicador de status das chamadas */}
      <CallStatusIndicator />
      
      {/* Modais de chamada ativa */}
      {callState.isInCall && (
        <>
          {callState.callType === 'audio' && <AudioCallModal />}
          {callState.callType === 'video' && <VideoCallModal />}
        </>
      )}
      
      {/* Central de Chamadas - painel oficial para gerenciar chamadas */}
      <CallPanel />
    </>
  )
}
