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
  Settings
} from 'lucide-react'

import { useAudioCall } from '@/hooks/useAudioCall'
import { useUserPresence } from '@/hooks/useUserPresence'
import { AudioCallInterface } from '@/components/audio-call/AudioCallInterface'
import { AudioCallNotification } from '@/components/audio-call/AudioCallNotification'

export default function TestChamadasPage() {
  // Estados para simulação
  const [currentUserId, setCurrentUserId] = useState('user_1')
  const [targetUserId, setTargetUserId] = useState('')
  const [userInfo, setUserInfo] = useState({
    id: 'user_1',
    username: 'teste_user',
    display_name: 'Usuário de Teste',
    photo_url: undefined
  })

  // Hooks principais
  const audioCall = useAudioCall(currentUserId)
  const presence = useUserPresence(currentUserId)

  // Configurar callback para chamadas recebidas
  useEffect(() => {
    audioCall.onIncomingCall((call) => {
      console.log('📞 Chamada recebida no componente:', call)
      // A notificação será mostrada automaticamente
    })
  }, [audioCall])

  // Iniciar uma chamada
  const handleStartCall = async () => {
    if (!targetUserId.trim()) {
      alert('Digite o ID do usuário para chamar')
      return
    }

    try {
      await audioCall.startCall(targetUserId, userInfo)
      console.log('✅ Chamada iniciada com sucesso')
    } catch (error) {
      console.error('❌ Erro ao iniciar chamada:', error)
      alert('Erro ao iniciar chamada: ' + error)
    }
  }

  // Aceitar chamada recebida
  const handleAcceptCall = async () => {
    try {
      await audioCall.acceptCall()
      console.log('✅ Chamada aceita')
    } catch (error) {
      console.error('❌ Erro ao aceitar chamada:', error)
      alert('Erro ao aceitar chamada: ' + error)
    }
  }

  // Rejeitar chamada recebida
  const handleRejectCall = async () => {
    try {
      await audioCall.rejectCall()
      console.log('✅ Chamada rejeitada')
    } catch (error) {
      console.error('❌ Erro ao rejeitar chamada:', error)
    }
  }

  // Encerrar chamada
  const handleEndCall = async () => {
    try {
      await audioCall.endCall()
      console.log('✅ Chamada encerrada')
    } catch (error) {
      console.error('❌ Erro ao encerrar chamada:', error)
    }
  }

  // Toggle mute
  const handleToggleMute = () => {
    audioCall.toggleMute()
  }

  // Mudar usuário atual (para testes)
  const switchUser = (userId: string) => {
    setCurrentUserId(userId)
    setUserInfo({
      id: userId,
      username: `user_${userId.split('_')[1]}`,
      display_name: `Usuário ${userId.split('_')[1]}`,
      photo_url: undefined
    })
  }

  const onlineUsers = presence.getOnlineUsers()
  const availableUsers = presence.getAvailableUsers()

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
                {['user_1', 'user_2', 'user_3'].map(userId => (
                  <Button
                    key={userId}
                    variant={currentUserId === userId ? "default" : "outline"}
                    size="sm"
                    onClick={() => switchUser(userId)}
                  >
                    {userId.replace('_', ' ')}
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="target-user">Usuário de Destino</Label>
              <Input
                id="target-user"
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                placeholder="user_2"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Status da Conexão</Label>
              <div className="flex items-center space-x-2">
                {presence.isOnline ? (
                  <>
                    <Wifi className="w-4 h-4 text-green-500" />
                    <Badge className="bg-green-500">Online</Badge>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4 text-red-500" />
                    <Badge variant="destructive">Offline</Badge>
                  </>
                )}
              </div>
            </div>
          </div>

          <Button 
            onClick={handleStartCall}
            disabled={!targetUserId.trim() || audioCall.callState.status !== 'idle'}
            className="w-full"
          >
            <Phone className="w-4 h-4 mr-2" />
            Iniciar Chamada
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
                    audioCall.callState.status === 'connected' ? 'default' :
                    audioCall.callState.status === 'idle' ? 'secondary' :
                    'destructive'
                  }
                >
                  {audioCall.callState.status}
                </Badge>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Call ID:</span>
                <span className="text-sm font-mono">
                  {audioCall.callState.callId?.slice(-8) || 'N/A'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Usuário Remoto:</span>
                <span className="text-sm">
                  {audioCall.callState.remoteUserId || 'N/A'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Conexão WebRTC:</span>
                <span className="text-sm">
                  {audioCall.callState.connectionState || 'N/A'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Microfone:</span>
                <Badge variant={audioCall.callState.isMuted ? "destructive" : "default"}>
                  {audioCall.callState.isMuted ? 'Silenciado' : 'Ativo'}
                </Badge>
              </div>
            </div>

            {audioCall.callState.error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded">
                <p className="text-sm text-red-700">{audioCall.callState.error}</p>
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
                  <div key={user.userId} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={user.photo_url} />
                        <AvatarFallback>
                          {user.display_name?.[0] || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">
                          {user.display_name || user.userId}
                        </p>
                        <p className="text-xs text-gray-500">
                          @{user.username || user.userId}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge
                        size="sm"
                        variant={
                          user.currentActivity === 'active' ? 'default' :
                          user.currentActivity === 'away' ? 'secondary' :
                          user.currentActivity === 'in-call' ? 'destructive' :
                          'secondary'
                        }
                      >
                        {user.currentActivity}
                      </Badge>
                      {user.isAvailableForCalls && user.userId !== currentUserId && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setTargetUserId(user.userId)}
                        >
                          <Phone className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Interface de Chamada (quando há uma chamada ativa) */}
      {audioCall.callState.status !== 'idle' && (
        <div className="flex justify-center">
          <AudioCallInterface
            callState={audioCall.callState}
            onEndCall={handleEndCall}
            onToggleMute={handleToggleMute}
            remoteUserInfo={
              audioCall.callState.remoteUserId ? {
                username: audioCall.callState.remoteUserId,
                display_name: `Usuário ${audioCall.callState.remoteUserId}`,
                photo_url: undefined
              } : undefined
            }
          />
        </div>
      )}

      {/* Notificação de Chamada Recebida */}
      <AudioCallNotification
        incomingCall={audioCall.incomingCall}
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
            <div>Presence Online: {presence.isOnline ? 'Yes' : 'No'}</div>
            <div>Online Users: {onlineUsers.length}</div>
            <div>Available Users: {availableUsers.length}</div>
            <div>Call Status: {audioCall.callState.status}</div>
            <div>Has Local Stream: {audioCall.callState.localStream ? 'Yes' : 'No'}</div>
            <div>Has Remote Stream: {audioCall.callState.remoteStream ? 'Yes' : 'No'}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
