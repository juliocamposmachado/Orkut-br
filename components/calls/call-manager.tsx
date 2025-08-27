'use client'

import { useWebRTC } from '@/contexts/webrtc-context'
import { AudioCallModal } from './audio-call-modal'
import { VideoCallModal } from './video-call-modal'
import { CallNotification } from '@/components/call/call-notification'
import { CallPanel } from '@/components/call/call-panel'
import { CallStatusIndicator } from '@/components/call/call-status-indicator'
import { RealCallInterface } from '@/components/call/real-call-interface'
import { useCallNotifications } from '@/hooks/use-call-notifications'

/**
 * Componente principal que gerencia todos os tipos de chamada
 * Renderiza o modal apropriado baseado no tipo de chamada ativa
 * Inclui notificações, painel de controle e indicadores visuais
 * Integra sistema WebRTC real com interface moderna
 */
export function CallManager() {
  const { callState } = useWebRTC()
  const { 
    isInCall, 
    localStream, 
    remoteStream, 
    incomingCall,
    endCall 
  } = useCallNotifications()
  
  // Determinar qual interface mostrar
  const showRealCallInterface = isInCall && (localStream || remoteStream)
  
  // Inferir informações do usuário remoto da chamada ativa
  const getRemoteUserInfo = () => {
    if (incomingCall) {
      return {
        username: incomingCall.fromUser.username,
        display_name: incomingCall.fromUser.display_name,
        photo_url: incomingCall.fromUser.photo_url
      }
    }
    
    // Fallback para chamadas iniciadas (pode implementar lógica para armazenar info)
    return {
      username: 'usuario',
      display_name: 'Usuário',
      photo_url: undefined
    }
  }
  
  return (
    <>
      {/* Sistema de notificações de chamadas recebidas */}
      <CallNotification />
      
      {/* Indicador de status das chamadas */}
      <CallStatusIndicator />
      
      {/* Interface de chamada real WebRTC */}
      {showRealCallInterface && (
        <RealCallInterface
          callType={incomingCall?.callType || 'audio'}
          remoteUserInfo={getRemoteUserInfo()}
          onEndCall={() => {
            console.log('🔚 Chamada encerrada via interface')
          }}
        />
      )}
      
      {/* Modais de chamada legados (fallback) */}
      {callState.isInCall && !showRealCallInterface && (
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
