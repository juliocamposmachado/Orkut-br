'use client'

import React, { useState, useEffect } from 'react'
import { useWebRTC } from '@/contexts/webrtc-context'
import { useAuth } from '@/contexts/local-auth-context'
import { useMediaPermissions } from '@/hooks/use-media-permissions-check'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle, XCircle, RefreshCw, Camera, Mic, Monitor, Users } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface DiagnosticResult {
  name: string
  status: 'success' | 'error' | 'warning' | 'loading'
  message: string
  details?: string
}

export function WebRTCDiagnostics() {
  const { user } = useAuth()
  const { callState, onlineUsers } = useWebRTC()
  const { camera, microphone, hasPermissions, requestPermissions, checkPermissions } = useMediaPermissions()
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  const runDiagnostics = async () => {
    setIsRunning(true)
    const results: DiagnosticResult[] = []

    // 1. Check user authentication
    results.push({
      name: 'Autenticação de Usuário',
      status: user ? 'success' : 'error',
      message: user ? `Usuário logado: ${user.email}` : 'Usuário não autenticado',
      details: user ? `ID: ${user.id}` : 'Faça login para usar chamadas'
    })

    // 2. Check camera permissions
    results.push({
      name: 'Permissão de Câmera',
      status: camera === 'granted' ? 'success' : camera === 'denied' ? 'error' : 'warning',
      message: camera === 'granted' ? 'Câmera permitida' : 
               camera === 'denied' ? 'Câmera bloqueada' : 
               camera === 'prompt' ? 'Permissão pendente' : 'Status desconhecido',
      details: 'Necessária para chamadas de vídeo'
    })

    // 3. Check microphone permissions
    results.push({
      name: 'Permissão de Microfone',
      status: microphone === 'granted' ? 'success' : microphone === 'denied' ? 'error' : 'warning',
      message: microphone === 'granted' ? 'Microfone permitido' : 
               microphone === 'denied' ? 'Microfone bloqueado' : 
               microphone === 'prompt' ? 'Permissão pendente' : 'Status desconhecido',
      details: 'Necessário para chamadas de áudio e vídeo'
    })

    // 4. Check WebRTC support
    const hasWebRTC = typeof window !== 'undefined' && 
                      window.RTCPeerConnection && 
                      navigator.mediaDevices && 
                      navigator.mediaDevices.getUserMedia
    
    results.push({
      name: 'Suporte WebRTC',
      status: hasWebRTC ? 'success' : 'error',
      message: hasWebRTC ? 'WebRTC suportado' : 'WebRTC não suportado',
      details: hasWebRTC ? 'Navegador compatível com chamadas' : 'Atualize seu navegador'
    })

    // 5. Check database tables
    if (user) {
      try {
        const { data: callSignalsTest, error: signalsError } = await supabase
          .from('call_signals')
          .select('id')
          .limit(1)

        results.push({
          name: 'Tabela call_signals',
          status: signalsError ? 'error' : 'success',
          message: signalsError ? 'Tabela não encontrada' : 'Tabela OK',
          details: signalsError ? 'Execute o script CRIAR_TABELAS_WEBRTC.sql' : 'Sinalização WebRTC funcionando'
        })

        const { data: presenceTest, error: presenceError } = await supabase
          .from('user_presence')
          .select('id')
          .limit(1)

        results.push({
          name: 'Tabela user_presence',
          status: presenceError ? 'error' : 'success',
          message: presenceError ? 'Tabela não encontrada' : 'Tabela OK',
          details: presenceError ? 'Execute o script CRIAR_TABELAS_WEBRTC.sql' : 'Status online funcionando'
        })

        const { data: callsTest, error: callsError } = await supabase
          .from('calls')
          .select('id')
          .limit(1)

        results.push({
          name: 'Tabela calls',
          status: callsError ? 'error' : 'success',
          message: callsError ? 'Tabela não encontrada' : 'Tabela OK',
          details: callsError ? 'Execute o script CRIAR_TABELAS_WEBRTC.sql' : 'Histórico de chamadas funcionando'
        })
      } catch (error) {
        results.push({
          name: 'Conexão com Banco',
          status: 'error',
          message: 'Erro ao conectar com o banco',
          details: error instanceof Error ? error.message : 'Erro desconhecido'
        })
      }
    }

    // 6. Check online users
    results.push({
      name: 'Usuários Online',
      status: onlineUsers.length > 0 ? 'success' : 'warning',
      message: `${onlineUsers.length} usuário(s) online`,
      details: onlineUsers.length === 0 ? 'Nenhum usuário disponível para chamada' : 'Usuários disponíveis para chamada'
    })

    // 7. Check current call state
    results.push({
      name: 'Estado da Chamada',
      status: callState.isInCall ? 'warning' : 'success',
      message: callState.isInCall ? `Em chamada ${callState.callType}` : 'Nenhuma chamada ativa',
      details: callState.isInCall ? `Com ${callState.callingUser?.display_name}` : 'Pronto para novas chamadas'
    })

    // 8. Test media devices
    if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        const videoInputs = devices.filter(d => d.kind === 'videoinput')
        const audioInputs = devices.filter(d => d.kind === 'audioinput')
        
        results.push({
          name: 'Dispositivos de Mídia',
          status: (videoInputs.length > 0 && audioInputs.length > 0) ? 'success' : 'warning',
          message: `${videoInputs.length} câmera(s), ${audioInputs.length} microfone(s)`,
          details: 'Dispositivos detectados pelo sistema'
        })
      } catch (error) {
        results.push({
          name: 'Dispositivos de Mídia',
          status: 'error',
          message: 'Erro ao listar dispositivos',
          details: error instanceof Error ? error.message : 'Erro desconhecido'
        })
      }
    }

    setDiagnostics(results)
    setIsRunning(false)
  }

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case 'loading':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
    }
  }

  const getStatusColor = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'error':
        return 'bg-red-100 text-red-700 border-red-200'
      case 'warning':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'loading':
        return 'bg-blue-100 text-blue-700 border-blue-200'
    }
  }

  useEffect(() => {
    if (isVisible) {
      runDiagnostics()
    }
  }, [isVisible, user, camera, microphone])

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button 
          onClick={() => setIsVisible(true)}
          variant="outline"
          size="sm"
          className="bg-white shadow-lg hover:shadow-xl"
        >
          <Monitor className="h-4 w-4 mr-2" />
          Diagnóstico WebRTC
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Diagnóstico WebRTC
            </CardTitle>
            <div className="flex gap-2">
              <Button
                onClick={runDiagnostics}
                disabled={isRunning}
                size="sm"
                variant="outline"
              >
                {isRunning ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Atualizar
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
            {!hasPermissions && (
              <Button
                onClick={requestPermissions}
                size="sm"
                className="bg-blue-500 hover:bg-blue-600"
              >
                <Camera className="h-4 w-4 mr-2" />
                Solicitar Permissões
              </Button>
            )}
            <Button
              onClick={checkPermissions}
              size="sm"
              variant="outline"
            >
              <Mic className="h-4 w-4 mr-2" />
              Verificar Permissões
            </Button>
          </div>

          {/* Diagnostics Results */}
          {diagnostics.length > 0 ? (
            <div className="space-y-3">
              {diagnostics.map((result, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${getStatusColor(result.status)}`}
                >
                  <div className="flex items-start gap-3">
                    {getStatusIcon(result.status)}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{result.name}</div>
                      <div className="text-sm opacity-90">{result.message}</div>
                      {result.details && (
                        <div className="text-xs opacity-75 mt-1">{result.details}</div>
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
                  Executando diagnósticos...
                </div>
              ) : (
                <div>
                  <Monitor className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  Clique em "Atualizar" para executar os diagnósticos
                </div>
              )}
            </div>
          )}

          {/* Summary */}
          {diagnostics.length > 0 && !isRunning && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium mb-2">Resumo:</div>
              <div className="flex gap-4 text-xs">
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  ✅ {diagnostics.filter(d => d.status === 'success').length} OK
                </Badge>
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                  ⚠️ {diagnostics.filter(d => d.status === 'warning').length} Avisos
                </Badge>
                <Badge variant="secondary" className="bg-red-100 text-red-700">
                  ❌ {diagnostics.filter(d => d.status === 'error').length} Erros
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
