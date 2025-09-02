'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/enhanced-auth-context'
import { useWebRTC } from '@/contexts/webrtc-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Phone, Video, Users, TestTube } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

export function CallTestButton() {
  const { user } = useAuth()
  const { onlineUsers, startAudioCall, startVideoCall } = useWebRTC()
  const [isTestingCall, setIsTestingCall] = useState(false)

  if (!user) return null // Temporariamente habilitado em produção para teste

  const handleTestAudioCall = async (targetUserId: string) => {
    setIsTestingCall(true)
    try {
      await startAudioCall(targetUserId)
      toast.success('Chamada de áudio iniciada!')
    } catch (error) {
      toast.error('Erro ao iniciar chamada de áudio')
    } finally {
      setIsTestingCall(false)
    }
  }

  const handleTestVideoCall = async (targetUserId: string) => {
    setIsTestingCall(true)
    try {
      await startVideoCall(targetUserId)
      toast.success('Chamada de vídeo iniciada!')
    } catch (error) {
      toast.error('Erro ao iniciar chamada de vídeo')
    } finally {
      setIsTestingCall(false)
    }
  }

  const handleTestSelfNotification = async () => {
    setIsTestingCall(true)
    try {
      // Obter token de autenticação do Supabase
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('Token de autenticação não encontrado')
      }

      // Criar uma notificação de teste diretamente no banco
      const response = await fetch('/api/call-notification', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          targetUserId: user.id, // Enviar para si mesmo
          callType: 'video',
          offer: { test: true }
        })
      })

      if (response.ok) {
        toast.success('Notificação de teste enviada!')
      } else {
        throw new Error('Falha na API')
      }
    } catch (error) {
      console.error('Erro no teste:', error)
      toast.error('Erro ao enviar notificação de teste')
    } finally {
      setIsTestingCall(false)
    }
  }

  return (
    <Card className="fixed bottom-4 right-4 w-80 shadow-lg border-yellow-200 bg-yellow-50 z-40">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center text-yellow-800">
          <TestTube className="w-4 h-4 mr-2" />
          Teste de Chamadas (DEV)
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="space-y-3">
          {/* Teste de auto-notificação */}
          <div className="text-center">
            <Button
              onClick={handleTestSelfNotification}
              disabled={isTestingCall}
              size="sm"
              className="w-full bg-yellow-600 hover:bg-yellow-700"
            >
              {isTestingCall ? '⏳ Testando...' : '🔔 Testar Notificação (Self)'}
            </Button>
          </div>

          {/* Lista de usuários online */}
          <div>
            <div className="flex items-center mb-2">
              <Users className="w-4 h-4 mr-2 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">
                Usuários Online ({onlineUsers.length})
              </span>
            </div>
            
            {onlineUsers.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-2">
                Nenhum usuário online
              </p>
            ) : (
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {onlineUsers.map((onlineUser) => (
                  <div
                    key={onlineUser.id}
                    className="flex items-center justify-between p-2 bg-white rounded border"
                  >
                    <div className="flex items-center">
                      <Avatar className="w-6 h-6 mr-2">
                        <AvatarImage src={onlineUser.photo_url} />
                        <AvatarFallback className="text-xs">
                          {onlineUser.display_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-xs font-medium truncate max-w-20">
                          {onlineUser.display_name}
                        </p>
                        <Badge variant="outline" className="text-xs px-1">
                          Online
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex space-x-1">
                      <Button
                        onClick={() => handleTestAudioCall(onlineUser.id)}
                        disabled={isTestingCall}
                        size="sm"
                        className="w-6 h-6 p-0 rounded-full bg-purple-500 hover:bg-purple-600"
                      >
                        <Phone className="w-3 h-3" />
                      </Button>
                      <Button
                        onClick={() => handleTestVideoCall(onlineUser.id)}
                        disabled={isTestingCall}
                        size="sm"
                        className="w-6 h-6 p-0 rounded-full bg-pink-500 hover:bg-pink-600"
                      >
                        <Video className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500 mt-2">
              Ambiente de desenvolvimento
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
