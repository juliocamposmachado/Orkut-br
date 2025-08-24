'use client'

import { useCallback } from 'react'
import { useWebRTC } from '@/contexts/webrtc-context'
import { AudioCallModal } from './audio-call-modal'
import { VideoCallModal } from './video-call-modal'
import { IncomingCallNotification } from '@/components/call/incoming-call-notification'
import type { IncomingCallData } from '@/components/call/incoming-call-notification'
import { CallTestButton } from '@/components/call/call-test-button'

/**
 * Componente principal que gerencia todos os tipos de chamada
 * Renderiza o modal apropriado baseado no tipo de chamada ativa
 * Inclui notificações de chamadas recebidas
 */
export function CallManager() {
  const { callState } = useWebRTC()
  
  // Handler para aceitar chamada
  const handleAcceptCall = useCallback(async (callData: IncomingCallData) => {
    console.log('📞 Aceitando chamada:', callData)
    
    try {
      // Aqui você implementaria a lógica para aceitar a chamada
      // Por exemplo: estabelecer conexão WebRTC, obter mídia do usuário, etc.
      
      // TODO: Implementar lógica completa de aceitar chamada
      console.log('✅ Chamada aceita com sucesso')
    } catch (error) {
      console.error('❌ Erro ao aceitar chamada:', error)
      throw error
    }
  }, [])
  
  // Handler para rejeitar chamada
  const handleRejectCall = useCallback(async (callId: string) => {
    console.log('❌ Rejeitando chamada:', callId)
    
    try {
      // A lógica de rejeição já está implementada no componente de notificação
      console.log('✅ Chamada rejeitada com sucesso')
    } catch (error) {
      console.error('❌ Erro ao rejeitar chamada:', error)
      throw error
    }
  }, [])
  
  return (
    <>
      {/* Notificação de chamadas recebidas */}
      <IncomingCallNotification 
        onAcceptCall={handleAcceptCall}
        onRejectCall={handleRejectCall}
      />
      
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
