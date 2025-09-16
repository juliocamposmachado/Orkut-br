'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/local-auth-context'
import { useCallNotifications } from '@/hooks/use-call-notifications'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export function CallDebug() {
  const { user } = useAuth()
  const { incomingCall, isRinging, isInCall, localStream, remoteStream } = useCallNotifications()
  const [notifications, setNotifications] = useState<any[]>([])
  const [realtimeStatus, setRealtimeStatus] = useState<string>('disconnected')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!user) return

    // Monitorar status do realtime
    const channel = supabase.channel('debug-channel')
    
    channel.subscribe((status) => {
      setRealtimeStatus(status)
      console.log('🔌 Realtime status:', status)
    })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  const loadRecentNotifications = async () => {
    if (!user) return
    
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('profile_id', user.id)
        .eq('type', 'incoming_call')
        .order('created_at', { ascending: false })
        .limit(5)

      if (error) {
        console.error('Erro ao buscar notificações:', error)
        toast.error('Erro ao buscar notificações')
      } else {
        setNotifications(data || [])
      }
    } catch (error) {
      console.error('Erro:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const testSelfCall = async () => {
    if (!user) return
    
    setIsLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('Token não encontrado')
      }

      const response = await fetch('/api/call-notification', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          targetUserId: user.id,
          callType: 'video',
          offer: {
            type: 'offer',
            sdp: 'test-sdp',
            timestamp: new Date().toISOString()
          }
        })
      })

      const result = await response.json()
      
      if (response.ok) {
        toast.success('Notificação de teste enviada!')
        setTimeout(loadRecentNotifications, 1000)
      } else {
        toast.error('Erro: ' + result.error)
      }
    } catch (error) {
      console.error('Erro no teste:', error)
      toast.error('Erro no teste: ' + (error as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  const clearNotifications = async () => {
    if (!user) return
    
    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('profile_id', user.id)
        .eq('type', 'incoming_call')
        .eq('read', false)

      if (error) {
        toast.error('Erro ao limpar notificações')
      } else {
        toast.success('Notificações limpas')
        loadRecentNotifications()
      }
    } catch (error) {
      console.error('Erro:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      loadRecentNotifications()
    }
  }, [user])

  if (!user) return null

  return (
    <Card className="fixed bottom-4 left-4 w-96 max-h-96 overflow-y-auto shadow-lg z-50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center">
          🐛 Debug Chamadas
          <Badge 
            className={`ml-2 ${realtimeStatus === 'SUBSCRIBED' ? 'bg-green-500' : 'bg-red-500'}`}
          >
            {realtimeStatus}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="text-xs space-y-3">
        {/* Status do Hook */}
        <div className="p-2 bg-gray-100 rounded">
          <h4 className="font-semibold mb-1">Status do Hook:</h4>
          <div className="space-y-1">
            <div>incomingCall: {incomingCall ? '✅ Sim' : '❌ Não'}</div>
            <div>isRinging: {isRinging ? '✅ Sim' : '❌ Não'}</div>
            <div>isInCall: {isInCall ? '✅ Sim' : '❌ Não'}</div>
            <div>localStream: {localStream ? '✅ Sim' : '❌ Não'}</div>
            <div>remoteStream: {remoteStream ? '✅ Sim' : '❌ Não'}</div>
          </div>
          
          {incomingCall && (
            <div className="mt-2 p-2 bg-yellow-100 rounded">
              <div>Call ID: {incomingCall.callId}</div>
              <div>Tipo: {incomingCall.callType}</div>
              <div>De: {incomingCall.fromUser.display_name}</div>
            </div>
          )}
        </div>

        {/* Controles */}
        <div className="space-y-2">
          <Button 
            onClick={testSelfCall}
            disabled={isLoading}
            size="sm" 
            className="w-full"
          >
            {isLoading ? '⏳' : '🔔'} Testar Notificação
          </Button>
          <Button 
            onClick={loadRecentNotifications}
            disabled={isLoading}
            size="sm" 
            variant="outline"
            className="w-full"
          >
            {isLoading ? '⏳' : '🔄'} Recarregar
          </Button>
          <Button 
            onClick={clearNotifications}
            disabled={isLoading}
            size="sm" 
            variant="secondary"
            className="w-full"
          >
            {isLoading ? '⏳' : '🧹'} Limpar
          </Button>
        </div>

        {/* Notificações Recentes */}
        <div>
          <h4 className="font-semibold mb-1">Notificações Recentes ({notifications.length}):</h4>
          {notifications.length === 0 ? (
            <p className="text-gray-500">Nenhuma notificação</p>
          ) : (
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {notifications.map((notif) => (
                <div 
                  key={notif.id}
                  className={`p-2 rounded text-xs ${
                    notif.read ? 'bg-gray-100' : 'bg-blue-100'
                  }`}
                >
                  <div>ID: {notif.payload?.call_id}</div>
                  <div>De: {notif.payload?.from_user?.display_name}</div>
                  <div>Tipo: {notif.payload?.call_type}</div>
                  <div>Hora: {new Date(notif.created_at).toLocaleTimeString()}</div>
                  <div>Lida: {notif.read ? 'Sim' : 'Não'}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Informações do Usuário */}
        <div className="p-2 bg-blue-100 rounded">
          <div>User ID: {user.id}</div>
          <div>Email: {user.email}</div>
        </div>
      </CardContent>
    </Card>
  )
}
