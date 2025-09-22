'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { 
  Phone, 
  PhoneCall, 
  Users, 
  Wifi,
  WifiOff,
  Activity,
  Clock,
  Settings,
  Video,
  VideoIcon,
  MicOff,
  Mic
} from 'lucide-react'

import { useCallSystem } from '@/hooks/useCallSystem'
import { CallInterface } from '@/components/calls/CallInterface'
import { CallNotification } from '@/components/calls/CallNotification'
import { CallButtons, SingleCallButton } from '@/components/calls/CallButtons'

export default function TestChamadasPage() {
  // Estados para simulação
  const [currentUserId, setCurrentUserId] = useState('user_1')
  const [targetUserId, setTargetUserId] = useState('')
  const [callType, setCallType] = useState<'audio' | 'video'>('audio')
  const [showIncomingCallNotification, setShowIncomingCallNotification] = useState(false)
  const [callerInfo, setCallerInfo] = useState({
    name: '',
    photo_url: '',
    callType: 'audio' as 'audio' | 'video'
  })
  
  // Hooks principais
  const callSystem = useCallSystem(currentUserId)

  // Configurar efeitos para chamadas recebidas
  useEffect(() => {
    // Monitorar estado da chamada para detectar chamadas recebidas
    if (callSystem.callState.isIncomingCall && callSystem.callState.remoteUserId) {
      const remoteUser = callSystem.callState.remoteUserInfo
      console.log('📞 Chamada recebida de:', remoteUser)
      
      setCallerInfo({
        name: remoteUser?.name || callSystem.callState.remoteUserId,
        photo_url: remoteUser?.photo_url || '',
        callType: callSystem.callState.callType || 'audio'
      })
      
      setShowIncomingCallNotification(true)
    } else {
      setShowIncomingCallNotification(false)
    }
  }, [callSystem.callState])

  // Iniciar uma chamada
  const handleStartCall = async () => {
    if (!targetUserId.trim()) {
      alert('Digite o ID do usuário para chamar')
      return
    }

    try {
      await callSystem.initiateCall(targetUserId, callType)
      console.log(`✅ Chamada de ${callType} iniciada com sucesso`)
    } catch (error) {
      console.error('❌ Erro ao iniciar chamada:', error)
      alert('Erro ao iniciar chamada: ' + error)
    }
  }

  // Aceitar chamada recebida
  const handleAcceptCall = async () => {
    try {
      await callSystem.acceptCall()
      setShowIncomingCallNotification(false)
      console.log('✅ Chamada aceita')
    } catch (error) {
      console.error('❌ Erro ao aceitar chamada:', error)
      alert('Erro ao aceitar chamada: ' + error)
    }
  }

  // Rejeitar chamada recebida
  const handleRejectCall = () => {
    try {
      callSystem.rejectCall()
      setShowIncomingCallNotification(false)
      console.log('✅ Chamada rejeitada')
    } catch (error) {
      console.error('❌ Erro ao rejeitar chamada:', error)
    }
  }

  // Encerrar chamada
  const handleEndCall = () => {
    try {
      callSystem.endCall()
      console.log('✅ Chamada encerrada')
    } catch (error) {
      console.error('❌ Erro ao encerrar chamada:', error)
    }
  }

  // Toggle mute
  const handleToggleMute = () => {
    callSystem.toggleMute()
  }
  
  // Toggle video
  const handleToggleVideo = () => {
    callSystem.toggleVideo()
  }

  // Dados fictícios para testes
  const testUsers = {
    user_1: {
      id: 'user_1',
      username: 'teste_user1',
      display_name: 'Ana Silva',
      photo_url: 'https://i.pravatar.cc/150?img=1'
    },
    user_2: {
      id: 'user_2', 
      username: 'teste_user2',
      display_name: 'Carlos Santos',
      photo_url: 'https://i.pravatar.cc/150?img=2'
    },
    user_3: {
      id: 'user_3',
      username: 'teste_user3', 
      display_name: 'Marina Costa',
      photo_url: 'https://i.pravatar.cc/150?img=3'
    }
  }

  // Mudar usuário atual (para testes)
  const switchUser = (userId: string) => {
    setCurrentUserId(userId)
  }

  // Lista simulada de usuários online para teste
  const onlineUsers = Object.values(testUsers).filter(user => user.id !== currentUserId)

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center space-x-2">
          <PhoneCall className="w-8 h-8 text-blue-500" />
          <span>Sistema de Chamadas de Áudio</span>
        </h1>
        <p className="text-gray-600">
          Teste completo do WebRTC + Supabase Realtime
        </p>
      </div>

      {/* Controles de usuário atual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>Configurações de Teste</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Usuário Atual</Label>
              <div className="flex space-x-2">
                {['user_1', 'user_2', 'user_3'].map(userId => {
                  const userData = testUsers[userId as keyof typeof testUsers]
                  return (
                    <Button
                      key={userId}
                      variant={currentUserId === userId ? "default" : "outline"}
                      size="sm"
                      onClick={() => switchUser(userId)}
                      className="flex items-center space-x-1"
                    >
                      <span>{userData.display_name}</span>
                    </Button>
                  )
                })}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="target-user">Usuário de Destino</Label>
              <div className="flex space-x-2">
                <Input
                  id="target-user"
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  placeholder="user_2"
                  className="flex-grow"
                />
                <Button
                  size="sm"
                  variant={callType === 'audio' ? 'default' : 'secondary'}
                  onClick={() => setCallType('audio')}
                  className="w-10"
                >
                  <Phone className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant={callType === 'video' ? 'default' : 'secondary'}
                  onClick={() => setCallType('video')}
                  className="w-10"
                >
                  <Video className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Status da Conexão</Label>
              <div className="flex items-center space-x-2">
                <Wifi className="w-4 h-4 text-green-500" />
                <Badge className="bg-green-500">Online</Badge>
              </div>
            </div>
          </div>

          <Button 
            onClick={handleStartCall}
            disabled={!targetUserId.trim() || callSystem.callState.isCallActive || callSystem.callState.isOutgoingCall || callSystem.callState.isIncomingCall}
            className="w-full"
          >
            {callType === 'audio' ? (
              <Phone className="w-4 h-4 mr-2" />
            ) : (
              <Video className="w-4 h-4 mr-2" />
            )}
            Iniciar Chamada de {callType === 'audio' ? 'Áudio' : 'Vídeo'}
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status da Chamada */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="w-5 h-5" />
              <span>Status da Chamada</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Status:</span>
                <Badge
                  variant={
                    callSystem.callState.isCallActive ? 'default' :
                    !callSystem.callState.isCallActive && !callSystem.callState.isIncomingCall && !callSystem.callState.isOutgoingCall ? 'secondary' :
                    'destructive'
                  }
                >
                  {callSystem.callState.isCallActive ? 'connected' :
                   callSystem.callState.isIncomingCall ? 'incoming' :
                   callSystem.callState.isOutgoingCall ? 'outgoing' :
                   callSystem.callState.isConnecting ? 'connecting' : 'idle'}
                </Badge>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Tipo de Chamada:</span>
                <Badge variant={callSystem.callState.callType === 'video' ? 'default' : 'secondary'}>
                  {callSystem.callState.callType || 'N/A'}
                </Badge>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Usuário Remoto:</span>
                <span className="text-sm">
                  {callSystem.callState.remoteUserInfo?.name || callSystem.callState.remoteUserId || 'N/A'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Conexão WebRTC:</span>
                <Badge variant={callSystem.connectionState === 'connected' ? 'default' : 'secondary'}>
                  {callSystem.connectionState}
                </Badge>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Microfone:</span>
                <Badge variant={callSystem.isMuted ? "destructive" : "default"}>
                  {callSystem.isMuted ? 'Silenciado' : 'Ativo'}
                </Badge>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Vídeo:</span>
                <Badge variant={!callSystem.isVideoEnabled ? "destructive" : "default"}>
                  {callSystem.isVideoEnabled ? 'Ativo' : 'Desativado'}
                </Badge>
              </div>
            </div>

            {callSystem.callState.error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded">
                <p className="text-sm text-red-700">{callSystem.callState.error}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Usuários Online */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Usuários Online</span>
              <Badge variant="secondary">{onlineUsers.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {onlineUsers.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  Nenhum usuário online
                </p>
              ) : (
                onlineUsers.map(user => (
                  <div key={user.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={user.photo_url || undefined} />
                        <AvatarFallback>
                          {user.display_name?.[0] || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">
                          {user.display_name || user.id}
                        </p>
                        <p className="text-xs text-gray-500">
                          @{user.username || user.id}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="default">
                        Online
                      </Badge>
                      <div className="flex space-x-1">
                        <CallButtons
                          targetUserId={user.id}
                          onAudioCall={(userId) => {
                            setTargetUserId(userId)
                            setCallType('audio')
                            handleStartCall()
                          }}
                          onVideoCall={(userId) => {
                            setTargetUserId(userId)
                            setCallType('video')
                            handleStartCall()
                          }}
                          disabled={callSystem.callState.isCallActive || callSystem.callState.isOutgoingCall}
                          size="sm"
                          variant="compact"
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Interface de Chamada (quando há uma chamada ativa) */}
      {(callSystem.callState.isCallActive || callSystem.callState.isOutgoingCall || callSystem.callState.isConnecting) && (
        <div className="flex justify-center">
          <CallInterface
            callState={callSystem.callState}
            localVideoRef={callSystem.localVideoRef}
            remoteVideoRef={callSystem.remoteVideoRef}
            onAccept={handleAcceptCall}
            onReject={handleRejectCall}
            onEndCall={handleEndCall}
            onToggleMute={handleToggleMute}
            onToggleVideo={handleToggleVideo}
            isMuted={callSystem.isMuted}
            isVideoEnabled={callSystem.isVideoEnabled}
            connectionState={callSystem.connectionState}
            remoteUserInfo={callSystem.callState.remoteUserInfo}
          />
        </div>
      )}

      {/* Notificação de Chamada Recebida */}
      <CallNotification
        show={showIncomingCallNotification && callSystem.callState.isIncomingCall}
        callerName={callerInfo.name}
        callerPhoto={callerInfo.photo_url}
        callType={callerInfo.callType}
        onAccept={handleAcceptCall}
        onReject={handleRejectCall}
      />

      {/* Informações de Debug */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Debug Info</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs space-y-1 font-mono bg-gray-50 p-3 rounded">
            <div>Current User: {currentUserId}</div>
            <div>Online Users: {onlineUsers.length}</div>
            <div>Call Type: {callSystem.callState.callType || 'None'}</div>
            <div>Call Active: {callSystem.callState.isCallActive ? 'Yes' : 'No'}</div>
            <div>Call Incoming: {callSystem.callState.isIncomingCall ? 'Yes' : 'No'}</div>
            <div>Call Outgoing: {callSystem.callState.isOutgoingCall ? 'Yes' : 'No'}</div>
            <div>Has Local Stream: {callSystem.callState.localStream ? 'Yes' : 'No'}</div>
            <div>Has Remote Stream: {callSystem.callState.remoteStream ? 'Yes' : 'No'}</div>
            <div>Remote User: {callSystem.callState.remoteUserId || 'None'}</div>
            <div>Connection State: {callSystem.connectionState}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
