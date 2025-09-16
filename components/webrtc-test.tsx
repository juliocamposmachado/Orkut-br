'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/local-auth-context'
import { useWebRTC } from '@/contexts/webrtc-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Phone, Video, Users, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export function WebRTCTest() {
  const { user } = useAuth()
  const { callState, onlineUsers, startVideoCall, startAudioCall } = useWebRTC()
  const [testResults, setTestResults] = useState<any[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  const runTests = async () => {
    if (!user) {
      alert('Você precisa estar logado para testar as chamadas!')
      return
    }

    setIsRunning(true)
    const results: any[] = []

    // Test 1: Check if user is authenticated
    results.push({
      test: 'Autenticação',
      status: user ? 'success' : 'error',
      message: user ? `Logado como: ${user.email}` : 'Não autenticado',
      detail: user?.id || 'N/A'
    })

    // Test 2: Check WebRTC context
    results.push({
      test: 'Contexto WebRTC',
      status: 'success',
      message: 'Contexto carregado',
      detail: `Call state: ${callState.isInCall ? 'Em chamada' : 'Livre'}`
    })

    // Test 3: Check tables existence
    try {
      const { data: signalsData, error: signalsError } = await supabase
        .from('call_signals')
        .select('count', { count: 'exact' })
        .limit(1)

      results.push({
        test: 'Tabela call_signals',
        status: signalsError ? 'error' : 'success',
        message: signalsError ? 'Erro ao acessar' : 'Tabela acessível',
        detail: signalsError?.message || `Count: ${signalsData?.[0]?.count || 0}`
      })
    } catch (error) {
      results.push({
        test: 'Tabela call_signals',
        status: 'error',
        message: 'Erro na verificação',
        detail: error instanceof Error ? error.message : String(error)
      })
    }

    try {
      const { data: presenceData, error: presenceError } = await supabase
        .from('user_presence')
        .select('count', { count: 'exact' })
        .limit(1)

      results.push({
        test: 'Tabela user_presence',
        status: presenceError ? 'error' : 'success',
        message: presenceError ? 'Erro ao acessar' : 'Tabela acessível',
        detail: presenceError?.message || `Count: ${presenceData?.[0]?.count || 0}`
      })
    } catch (error) {
      results.push({
        test: 'Tabela user_presence',
        status: 'error',
        message: 'Erro na verificação',
        detail: error instanceof Error ? error.message : String(error)
      })
    }

    // Test 4: Check online users
    results.push({
      test: 'Usuários Online',
      status: onlineUsers.length > 0 ? 'success' : 'warning',
      message: `${onlineUsers.length} usuário(s) online`,
      detail: onlineUsers.map(u => u.display_name).join(', ') || 'Nenhum usuário'
    })

    // Test 5: Check media devices
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoInputs = devices.filter(d => d.kind === 'videoinput')
      const audioInputs = devices.filter(d => d.kind === 'audioinput')

      results.push({
        test: 'Dispositivos de Mídia',
        status: (videoInputs.length > 0 && audioInputs.length > 0) ? 'success' : 'warning',
        message: `${videoInputs.length} câmera(s), ${audioInputs.length} microfone(s)`,
        detail: 'Dispositivos detectados'
      })
    } catch (error) {
      results.push({
        test: 'Dispositivos de Mídia',
        status: 'error',
        message: 'Erro ao listar dispositivos',
        detail: error instanceof Error ? error.message : String(error)
      })
    }

    // Test 6: Test user presence update
    try {
      const { error } = await supabase
        .from('user_presence')
        .upsert({
          user_id: user.id,
          is_online: true,
          last_seen: new Date().toISOString()
        })

      results.push({
        test: 'Atualizar Presença',
        status: error ? 'error' : 'success',
        message: error ? 'Erro ao atualizar' : 'Presença atualizada',
        detail: error?.message || 'Status online definido'
      })
    } catch (error) {
      results.push({
        test: 'Atualizar Presença',
        status: 'error',
        message: 'Erro na operação',
        detail: error instanceof Error ? error.message : String(error)
      })
    }

    // Test 7: Test media permissions
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      })
      stream.getTracks().forEach(track => track.stop()) // Clean up immediately

      results.push({
        test: 'Permissões de Mídia',
        status: 'success',
        message: 'Câmera e microfone permitidos',
        detail: 'getUserMedia funcionando'
      })
    } catch (error) {
      results.push({
        test: 'Permissões de Mídia',
        status: 'error',
        message: 'Permissões negadas ou erro',
        detail: error instanceof Error ? error.message : String(error)
      })
    }

    setTestResults(results)
    setIsRunning(false)
  }

  const createTestUser = async () => {
    if (!user) return

    try {
      // Tentar usar a função RPC primeiro
      let { error } = await supabase.rpc('upsert_user_presence', {
        p_user_id: user.id,
        p_is_online: true,
        p_status: 'online'
      })

      // Se RPC falhar, tentar UPSERT manual
      if (error) {
        console.warn('RPC falhou, tentando UPSERT manual:', error)
        const { error: upsertError } = await supabase
          .from('user_presence')
          .upsert({
            user_id: user.id,
            is_online: true,
            last_seen: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          })
        error = upsertError
      }

      if (error) {
        console.error('Erro ao criar presença:', error)
        alert(`Erro ao criar presença do usuário: ${error.message}`)
      } else {
        alert('✅ Presença do usuário criada/atualizada com sucesso!')
        // Re-run tests and refresh context
        runTests()
        // Force refresh the WebRTC context
        if (typeof window !== 'undefined') {
          window.location.reload()
        }
      }
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro na operação')
    }
  }

  const forceRefreshPresence = async () => {
    if (!user) return

    try {
      // Primeiro, marcar como online
      await createTestUser()
      
      // Aguardar um pouco
      setTimeout(() => {
        // Recarregar a página para forçar reconexão
        window.location.reload()
      }, 1000)
    } catch (error) {
      console.error('Erro ao atualizar presença:', error)
    }
  }

  const testVideoCall = async () => {
    if (!user) return
    
    try {
      // Teste básico do getUserMedia
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      })
      
      console.log('✅ Stream obtido:', stream)
      console.log('📹 Video tracks:', stream.getVideoTracks().length)
      console.log('🎤 Audio tracks:', stream.getAudioTracks().length)
      
      // Parar tracks
      stream.getTracks().forEach(track => track.stop())
      
      alert('✅ Teste básico de vídeo passou! Stream obtido com sucesso.')
    } catch (error) {
      console.error('❌ Erro no teste:', error)
      alert(`❌ Erro no teste de vídeo: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  if (!isVisible) {
    return (
      <div className="fixed bottom-20 right-4 z-50">
        <Button 
          onClick={() => setIsVisible(true)}
          variant="outline"
          size="sm"
          className="bg-yellow-100 border-yellow-300 text-yellow-700 hover:bg-yellow-200"
        >
          <Video className="h-4 w-4 mr-2" />
          Teste WebRTC
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              Teste WebRTC - Debug Avançado
            </CardTitle>
            <div className="flex gap-2">
              <Button
                onClick={runTests}
                disabled={isRunning}
                size="sm"
                variant="outline"
              >
                {isRunning ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Executar Testes
              </Button>
              <Button
                onClick={() => setIsVisible(false)}
                size="sm"
                variant="outline"
              >
                Fechar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Button
              onClick={testVideoCall}
              size="sm"
              className="bg-blue-500 hover:bg-blue-600"
            >
              <Video className="h-4 w-4 mr-2" />
              Teste Básico Vídeo
            </Button>
            <Button
              onClick={createTestUser}
              size="sm"
              className="bg-green-500 hover:bg-green-600"
            >
              <Users className="h-4 w-4 mr-2" />
              Criar Presença
            </Button>
            <Button
              onClick={() => window.open('/api/posts', '_blank')}
              size="sm"
              variant="outline"
            >
              API Posts
            </Button>
            <Button
              onClick={() => window.open('/api/user_presence', '_blank')}
              size="sm"
              variant="outline"
            >
              API Presence
            </Button>
          </div>

          {/* Current State */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="font-medium text-sm">Estado da Chamada</div>
              <Badge variant={callState.isInCall ? "default" : "secondary"}>
                {callState.isInCall ? `Em ${callState.callType}` : 'Livre'}
              </Badge>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="font-medium text-sm">Usuários Online</div>
              <Badge variant={onlineUsers.length > 0 ? "default" : "secondary"}>
                {onlineUsers.length} online
              </Badge>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="font-medium text-sm">Usuário</div>
              <Badge variant={user ? "default" : "destructive"}>
                {user ? 'Logado' : 'Não logado'}
              </Badge>
            </div>
          </div>

          {/* Test Results */}
          {testResults.length > 0 ? (
            <div className="space-y-3">
              <h3 className="font-medium text-lg">Resultados dos Testes:</h3>
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    result.status === 'success' 
                      ? 'bg-green-50 border-green-200' 
                      : result.status === 'warning'
                      ? 'bg-yellow-50 border-yellow-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {result.status === 'success' ? (
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className="font-medium text-sm">{result.test}</div>
                      <div className="text-sm opacity-90">{result.message}</div>
                      {result.detail && (
                        <div className="text-xs opacity-75 mt-1 font-mono bg-gray-100 p-1 rounded">
                          {result.detail}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              {isRunning ? (
                <div className="flex items-center justify-center gap-2">
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  Executando testes...
                </div>
              ) : (
                <div>
                  <Video className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  Clique em "Executar Testes" para verificar o sistema
                </div>
              )}
            </div>
          )}

          {/* Debug Info */}
          {user && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">Debug Info:</h4>
              <div className="text-xs space-y-1 font-mono">
                <div>User ID: {user.id}</div>
                <div>Email: {user.email}</div>
                <div>Online Users: {onlineUsers.length}</div>
                <div>Call State: {JSON.stringify(callState, null, 2)}</div>
                <div>Timestamp: {new Date().toISOString()}</div>
              </div>
            </div>
          )}

          {/* Manual Test Buttons */}
          {onlineUsers.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium mb-2">Teste Manual:</h4>
              <div className="space-y-2">
                {onlineUsers.slice(0, 3).map((onlineUser) => (
                  <div key={onlineUser.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">{onlineUser.display_name}</span>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => startAudioCall(onlineUser.id)}
                        size="sm"
                        disabled={callState.isInCall}
                      >
                        <Phone className="h-3 w-3" />
                      </Button>
                      <Button
                        onClick={() => startVideoCall(onlineUser.id)}
                        size="sm"
                        disabled={callState.isInCall}
                      >
                        <Video className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
