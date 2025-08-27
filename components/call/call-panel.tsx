'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/enhanced-auth-context'
import { useWebRTC } from '@/contexts/webrtc-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Phone, Video, Users, PhoneCall, Settings } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

export function CallPanel() {
  const { user } = useAuth()
  const { onlineUsers, startAudioCall, startVideoCall } = useWebRTC()
  const [isProcessingCall, setIsProcessingCall] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  if (!user) return null

  const handleAudioCall = async (targetUserId: string) => {
    if (isProcessingCall) return
    
    setIsProcessingCall(true)
    setSelectedUserId(targetUserId)
    
    try {
      console.log('🎵 Iniciando chamada de áudio para:', targetUserId)
      await startAudioCall(targetUserId)
      toast.success('Chamada de áudio iniciada!')
    } catch (error) {
      console.error('❌ Erro ao iniciar chamada de áudio:', error)
      toast.error('Erro ao iniciar chamada de áudio')
    } finally {
      setIsProcessingCall(false)
      setSelectedUserId(null)
    }
  }

  const handleVideoCall = async (targetUserId: string) => {
    if (isProcessingCall) return
    
    setIsProcessingCall(true)
    setSelectedUserId(targetUserId)
    
    try {
      console.log('📹 Iniciando chamada de vídeo para:', targetUserId)
      await startVideoCall(targetUserId)
      toast.success('Chamada de vídeo iniciada!')
    } catch (error) {
      console.error('❌ Erro ao iniciar chamada de vídeo:', error)
      toast.error('Erro ao iniciar chamada de vídeo')
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

      console.log('🧪 Enviando auto-notificação de teste...')
      
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
          offer: { test: true, timestamp: Date.now() }
        })
      })

      if (response.ok) {
        const result = await response.json()
        console.log('✅ Auto-notificação enviada:', result)
        toast.success('Notificação de teste enviada com sucesso!')
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('❌ Erro na resposta da API:', response.status, errorData)
        throw new Error(`Falha na API: ${response.status}`)
      }
    } catch (error) {
      console.error('❌ Erro no teste de auto-notificação:', error)
      toast.error('Erro ao enviar notificação de teste')
    } finally {
      setIsProcessingCall(false)
    }
  }

  return (
    <Card className="fixed bottom-4 right-4 w-96 shadow-2xl border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 z-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center text-purple-800">
          <PhoneCall className="w-5 h-5 mr-2" />
          Central de Chamadas
        </CardTitle>
        <p className="text-xs text-gray-600">
          Faça chamadas de áudio e vídeo com usuários online
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* Botão de teste */}
          <div className="text-center">
            <Button
              onClick={handleTestSelfCall}
              disabled={isProcessingCall}
              size="sm"
              variant="outline"
              className="w-full border-purple-300 hover:bg-purple-100 text-purple-700"
            >
              {isProcessingCall ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                  Enviando teste...
                </div>
              ) : (
                <div className="flex items-center">
                  <Settings className="w-4 h-4 mr-2" />
                  Testar Notificações
                </div>
              )}
            </Button>
          </div>

          <Separator />

          {/* Lista de usuários online */}
          <div>
            <div className="flex items-center mb-3">
              <Users className="w-4 h-4 mr-2 text-purple-600" />
              <span className="text-sm font-semibold text-purple-800">
                Usuários Disponíveis ({onlineUsers.length})
              </span>
            </div>
            
            {onlineUsers.length === 0 ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500 mb-1">Nenhum usuário online</p>
                <p className="text-xs text-gray-400">
                  Quando outros usuários estiverem online, você poderá fazer chamadas
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {onlineUsers.map((onlineUser) => (
                  <div
                    key={onlineUser.id}
                    className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                      selectedUserId === onlineUser.id 
                        ? 'bg-purple-100 border border-purple-300' 
                        : 'bg-white hover:bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <div className="flex items-center flex-1">
                      <Avatar className="w-8 h-8 mr-3 ring-2 ring-green-200">
                        <AvatarImage src={onlineUser.photo_url} />
                        <AvatarFallback className="text-sm bg-gradient-to-br from-purple-400 to-pink-400 text-white">
                          {onlineUser.display_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {onlineUser.display_name}
                        </p>
                        <div className="flex items-center">
                          <Badge 
                            variant="secondary" 
                            className="text-xs bg-green-100 text-green-700 border-green-200"
                          >
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                            Online
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => handleAudioCall(onlineUser.id)}
                        disabled={isProcessingCall}
                        size="sm"
                        className="w-8 h-8 p-0 rounded-full bg-purple-500 hover:bg-purple-600 transition-all hover:scale-110"
                      >
                        <Phone className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => handleVideoCall(onlineUser.id)}
                        disabled={isProcessingCall}
                        size="sm"
                        className="w-8 h-8 p-0 rounded-full bg-pink-500 hover:bg-pink-600 transition-all hover:scale-110"
                      >
                        <Video className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Status */}
          {isProcessingCall && (
            <div className="text-center pt-2">
              <p className="text-xs text-purple-600 animate-pulse">
                ⏳ Processando chamada...
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
