'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/local-auth-context'
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
  const [showInterface, setShowInterface] = useState(false)

  // Ocultar em produção ou mostrar apenas quando necessário
  const isProduction = process.env.NODE_ENV === 'production'
  const showCallTesting = !isProduction || showInterface

  if (!user || (!showCallTesting && isProduction)) return null

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

      // Buscar dados reais do usuário atual
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, display_name, photo_url')
        .eq('id', user.id)
        .single()

      if (profileError || !userProfile) {
        throw new Error('Erro ao buscar perfil do usuário')
      }

      // Criar uma oferta WebRTC real (simplificada para teste)
      const offer = {
        type: 'offer',
        sdp: 'v=0\r\no=- 123456789 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\n', // SDP mínimo para teste
        timestamp: new Date().toISOString(),
        caller_info: {
          id: userProfile.id,
          username: userProfile.username,
          display_name: userProfile.display_name,
          photo_url: userProfile.photo_url
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
          callType: 'video',
          offer: offer
        })
      })

      if (response.ok) {
        toast.success('Notificação de teste enviada com dados reais!')
      } else {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`Falha na API: ${response.status} - ${errorData.error || 'Erro desconhecido'}`)
      }
    } catch (error) {
      console.error('Erro no teste:', error)
      toast.error('Erro ao enviar notificação de teste: ' + (error as Error).message)
    } finally {
      setIsTestingCall(false)
    }
  }

  // Botão compacto para produção
  if (isProduction && !showInterface) {
    return (
      <div className="fixed bottom-20 right-4 z-40">
        <Button 
          onClick={() => setShowInterface(true)}
          variant="outline"
          size="sm"
          className="bg-blue-100 border-blue-300 text-blue-700 hover:bg-blue-200"
        >
          <Phone className="h-4 w-4 mr-2" />
          Chamadas
        </Button>
      </div>
    )
  }

  return (
    <Card className={`fixed bottom-4 right-4 w-80 shadow-lg z-40 ${
      isProduction 
        ? 'border-blue-200 bg-blue-50' 
        : 'border-yellow-200 bg-yellow-50'
    }`}>
      <CardHeader className="pb-2">
        <CardTitle className={`text-sm flex items-center ${
          isProduction ? 'text-blue-800' : 'text-yellow-800'
        }`}>
          {isProduction ? (
            <>
              <Phone className="w-4 h-4 mr-2" />
              Sistema de Chamadas
            </>
          ) : (
            <>
              <TestTube className="w-4 h-4 mr-2" />
              Teste de Chamadas (DEV)
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="space-y-3">
          {/* Teste de auto-notificação - apenas em desenvolvimento */}
          {!isProduction && (
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
          )}

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
            <div className="flex justify-between items-center">
              <p className="text-xs text-gray-500 mt-2">
                {isProduction ? 'Sistema de chamadas ativo' : 'Ambiente de desenvolvimento'}
              </p>
              {isProduction && (
                <Button
                  onClick={() => setShowInterface(false)}
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                >
                  ×
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
