'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/enhanced-auth-context'
import { useWebRTC } from '@/contexts/webrtc-context'
import { useCallNotifications } from '@/hooks/use-call-notifications'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { OrkutCard, OrkutCardContent, OrkutCardHeader } from '@/components/ui/orkut-card'
import { Phone, Video, Users, PhoneCall, Settings, Minimize2, Maximize2 } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

export function CallCenterCard() {
  const { user } = useAuth()
  const { onlineUsers } = useWebRTC()
  const { startCall: realStartCall, isInCall } = useCallNotifications()
  const [isProcessingCall, setIsProcessingCall] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)

  if (!user) return null

  const handleAudioCall = async (targetUserId: string) => {
    if (isProcessingCall || isInCall) return
    
    setIsProcessingCall(true)
    setSelectedUserId(targetUserId)
    
    try {
      console.log('🎵 Iniciando chamada de áudio WebRTC real para:', targetUserId)
      await realStartCall(targetUserId, 'audio')
      toast.success('Chamada de áudio iniciada! Aguardando resposta...')
    } catch (error) {
      console.error('❌ Erro ao iniciar chamada de áudio real:', error)
      toast.error('Erro ao iniciar chamada: ' + (error as Error).message)
    } finally {
      setIsProcessingCall(false)
      setSelectedUserId(null)
    }
  }

  const handleVideoCall = async (targetUserId: string) => {
    if (isProcessingCall || isInCall) return
    
    setIsProcessingCall(true)
    setSelectedUserId(targetUserId)
    
    try {
      console.log('📹 Iniciando chamada de vídeo WebRTC real para:', targetUserId)
      await realStartCall(targetUserId, 'video')
      toast.success('Chamada de vídeo iniciada! Aguardando resposta...')
    } catch (error) {
      console.error('❌ Erro ao iniciar chamada de vídeo real:', error)
      toast.error('Erro ao iniciar chamada: ' + (error as Error).message)
    } finally {
      setIsProcessingCall(false)
      setSelectedUserId(null)
    }
  }

  const handleTestSelfCall = async () => {
    if (isProcessingCall) return
    
    setIsProcessingCall(true)
    
    try {
      // Obter token de autenticação do Supabase
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('Token de autenticação não encontrado')
      }

      // Buscar dados reais do usuário atual
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, display_name, photo_url')
        .eq('id', user.id)
        .single()

      if (profileError || !userProfile) {
        throw new Error('Erro ao buscar perfil do usuário')
      }

      console.log('🧪 Enviando auto-notificação com dados reais...', userProfile.display_name)
      
      // Criar uma oferta WebRTC real usando WebRTC API
      let realOffer
      try {
        const peerConnection = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        })
        
        // Adicionar track de áudio para gerar oferta real
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        stream.getTracks().forEach(track => peerConnection.addTrack(track, stream))
        
        const offer = await peerConnection.createOffer()
        await peerConnection.setLocalDescription(offer)
        
        realOffer = {
          type: offer.type,
          sdp: offer.sdp,
          timestamp: new Date().toISOString(),
          caller_info: {
            id: userProfile.id,
            username: userProfile.username,
            display_name: userProfile.display_name,
            photo_url: userProfile.photo_url
          }
        }
        
        // Limpar recursos temporários
        stream.getTracks().forEach(track => track.stop())
        peerConnection.close()
        
      } catch (webrtcError) {
        console.warn('⚠️ Erro ao criar oferta WebRTC real, usando fallback:', webrtcError)
        realOffer = {
          type: 'offer',
          sdp: `v=0\r\no=- ${Date.now()} 1 IN IP4 127.0.0.1\r\ns=Orkut Audio Call\r\nt=0 0\r\n`,
          timestamp: new Date().toISOString(),
          caller_info: {
            id: userProfile.id,
            username: userProfile.username,
            display_name: userProfile.display_name,
            photo_url: userProfile.photo_url
          }
        }
      }
      
      // Criar uma notificação de teste com dados reais
      const response = await fetch('/api/call-notification', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          targetUserId: user.id, // Enviar para si mesmo para teste
          callType: 'audio',
          offer: realOffer
        })
      })

      if (response.ok) {
        const result = await response.json()
        console.log('✅ Auto-notificação enviada com dados reais:', result)
        toast.success('Notificação de teste enviada com dados reais!')
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('❌ Erro na resposta da API:', response.status, errorData)
        throw new Error(`Falha na API: ${response.status} - ${errorData.error || 'Erro desconhecido'}`)
      }
    } catch (error) {
      console.error('❌ Erro no teste de auto-notificação:', error)
      toast.error('Erro ao enviar notificação de teste: ' + (error as Error).message)
    } finally {
      setIsProcessingCall(false)
    }
  }

  return (
    <OrkutCard className="shadow-md">
      <OrkutCardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                <PhoneCall className="w-3 h-3 text-white" />
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full animate-pulse border border-white"></div>
            </div>
            <span className="text-sm font-medium">Central de Chamadas</span>
          </div>
          <Button
            onClick={() => setIsExpanded(!isExpanded)}
            size="sm"
            variant="ghost"
            className="w-6 h-6 p-0 hover:bg-purple-100 rounded-full"
            title={isExpanded ? 'Minimizar' : 'Expandir'}
          >
            {isExpanded ? (
              <Minimize2 className="w-3 h-3 text-purple-600" />
            ) : (
              <Maximize2 className="w-3 h-3 text-purple-600" />
            )}
          </Button>
        </div>
      </OrkutCardHeader>
      <OrkutCardContent>
        <div className="space-y-3">
          {/* Botão de teste */}
          <Button
            onClick={handleTestSelfCall}
            disabled={isProcessingCall}
            size="sm"
            variant="outline"
            className="w-full border-purple-300 hover:bg-purple-50 text-purple-700 text-xs"
          >
            {isProcessingCall ? (
              <div className="flex items-center">
                <div className="w-3 h-3 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                Testando...
              </div>
            ) : (
              <div className="flex items-center">
                <Settings className="w-3 h-3 mr-2" />
                Testar Notificações
              </div>
            )}
          </Button>

          {/* Usuários online */}
          <div>
            <div className="flex items-center mb-2">
              <Users className="w-3 h-3 mr-2 text-purple-600" />
              <span className="text-xs font-medium text-purple-800">
                Online ({onlineUsers.length})
              </span>
            </div>
            
            {onlineUsers.length === 0 ? (
              <div className="text-center py-3">
                <Users className="w-6 h-6 mx-auto text-gray-400 mb-1" />
                <p className="text-xs text-gray-500">Nenhum usuário online</p>
              </div>
            ) : (
              <div className={`space-y-1 ${isExpanded ? 'max-h-48' : 'max-h-24'} overflow-y-auto`}>
                {onlineUsers.slice(0, isExpanded ? 10 : 2).map((onlineUser) => (
                  <div
                    key={onlineUser.id}
                    className={`flex items-center justify-between p-2 rounded-lg transition-all ${
                      selectedUserId === onlineUser.id 
                        ? 'bg-purple-100 border border-purple-300' 
                        : 'bg-white hover:bg-gray-50 border border-gray-100'
                    }`}
                  >
                    <div className="flex items-center space-x-2 flex-1">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={onlineUser.photo_url} />
                        <AvatarFallback className="text-xs bg-gradient-to-br from-purple-400 to-pink-400 text-white">
                          {onlineUser.display_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium truncate">
                          {onlineUser.display_name}
                        </p>
                        <Badge 
                          variant="secondary" 
                          className="text-xs bg-green-100 text-green-700 border-green-200 px-1"
                        >
                          <div className="w-1 h-1 bg-green-500 rounded-full mr-1"></div>
                          Online
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex space-x-1">
                      <Button
                        onClick={() => handleAudioCall(onlineUser.id)}
                        disabled={isProcessingCall}
                        size="sm"
                        className="w-6 h-6 p-0 rounded-full bg-purple-500 hover:bg-purple-600 transition-all hover:scale-110"
                      >
                        <Phone className="w-3 h-3" />
                      </Button>
                      <Button
                        onClick={() => handleVideoCall(onlineUser.id)}
                        disabled={isProcessingCall}
                        size="sm"
                        className="w-6 h-6 p-0 rounded-full bg-pink-500 hover:bg-pink-600 transition-all hover:scale-110"
                      >
                        <Video className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Mostrar mais usuários se houver */}
          {!isExpanded && onlineUsers.length > 2 && (
            <Button
              onClick={() => setIsExpanded(true)}
              size="sm"
              variant="outline"
              className="w-full border-purple-200 text-purple-600 hover:bg-purple-50 text-xs"
            >
              Ver mais {onlineUsers.length - 2} usuários
            </Button>
          )}

          {/* Status da chamada */}
          {isProcessingCall && (
            <div className="text-center pt-2">
              <p className="text-xs text-purple-600 animate-pulse">
                ⏳ Processando chamada...
              </p>
            </div>
          )}
        </div>
      </OrkutCardContent>
    </OrkutCard>
  )
}
