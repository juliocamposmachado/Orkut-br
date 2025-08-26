'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Monitor, 
  Settings, 
  Activity, 
  Database, 
  Wifi, 
  Radio,
  Bot,
  FileText,
  TestTube,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  ExternalLink,
  Home,
  ArrowLeft,
  Code,
  Terminal,
  GitBranch,
  Zap
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

// Force dynamic rendering for development
export const dynamic = 'force-dynamic'

interface SystemStatus {
  database: 'online' | 'offline' | 'checking'
  webrtc: 'supported' | 'not-supported' | 'checking'
  api: 'online' | 'offline' | 'checking'
  ai: 'online' | 'offline' | 'checking'
}

interface DiagnosticResult {
  name: string
  status: 'success' | 'error' | 'warning' | 'running'
  message: string
  details?: string
}

const DeveloperDashboard = () => {
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    database: 'checking',
    webrtc: 'checking',
    api: 'checking',
    ai: 'checking'
  })
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([])
  const [isRunningTests, setIsRunningTests] = useState(false)

  // Verificar status do sistema ao carregar
  useEffect(() => {
    checkSystemStatus()
  }, [])

  const checkSystemStatus = async () => {
    // Reset status
    setSystemStatus({
      database: 'checking',
      webrtc: 'checking',
      api: 'checking',
      ai: 'checking'
    })

    // Check WebRTC
    const webrtcSupported = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
    
    // Check API endpoints
    try {
      const apiResponse = await fetch('/api/radio-status')
      const apiStatus = apiResponse.ok ? 'online' : 'offline'
      
      // Check AI endpoint
      const aiResponse = await fetch('/api/gemini/music-info', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artist: 'Test', song: 'Test' })
      })
      const aiStatus = aiResponse.status === 429 ? 'online' : (aiResponse.ok ? 'online' : 'offline')

      setSystemStatus({
        database: 'online', // Assumir online se API funciona
        webrtc: webrtcSupported ? 'supported' : 'not-supported',
        api: apiStatus,
        ai: aiStatus
      })
    } catch (error) {
      setSystemStatus({
        database: 'offline',
        webrtc: webrtcSupported ? 'supported' : 'not-supported',
        api: 'offline',
        ai: 'offline'
      })
    }
  }

  const runWebRTCTest = async () => {
    const newDiagnostic: DiagnosticResult = {
      name: 'WebRTC Test',
      status: 'running',
      message: 'Testando conexão WebRTC...'
    }
    setDiagnostics(prev => [...prev, newDiagnostic])

    try {
      // Test getUserMedia
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: false 
      })
      
      // Stop the stream immediately
      stream.getTracks().forEach(track => track.stop())
      
      // Test RTCPeerConnection
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      })
      
      pc.close()

      setDiagnostics(prev => prev.map(d => 
        d.name === 'WebRTC Test' 
          ? { ...d, status: 'success', message: 'WebRTC funcionando corretamente' }
          : d
      ))
    } catch (error) {
      setDiagnostics(prev => prev.map(d => 
        d.name === 'WebRTC Test' 
          ? { 
              ...d, 
              status: 'error', 
              message: 'Erro no WebRTC', 
              details: error instanceof Error ? error.message : 'Erro desconhecido'
            }
          : d
      ))
    }
  }

  const runDatabaseTest = async () => {
    const newDiagnostic: DiagnosticResult = {
      name: 'Database Test',
      status: 'running',
      message: 'Testando conexão com banco de dados...'
    }
    setDiagnostics(prev => [...prev, newDiagnostic])

    try {
      const response = await fetch('/api/posts-db')
      const data = await response.json()
      
      setDiagnostics(prev => prev.map(d => 
        d.name === 'Database Test' 
          ? { 
              ...d, 
              status: 'success', 
              message: `Banco conectado - ${data.total || 0} posts carregados`,
              details: `Source: ${data.source || 'unknown'}`
            }
          : d
      ))
    } catch (error) {
      setDiagnostics(prev => prev.map(d => 
        d.name === 'Database Test' 
          ? { 
              ...d, 
              status: 'error', 
              message: 'Erro na conexão com banco', 
              details: error instanceof Error ? error.message : 'Erro desconhecido'
            }
          : d
      ))
    }
  }

  const runAITest = async () => {
    const newDiagnostic: DiagnosticResult = {
      name: 'AI System Test',
      status: 'running',
      message: 'Testando sistema de IA...'
    }
    setDiagnostics(prev => [...prev, newDiagnostic])

    try {
      const response = await fetch('/api/gemini/music-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artist: 'Test Artist', song: 'Test Song' })
      })
      
      if (response.status === 429) {
        setDiagnostics(prev => prev.map(d => 
          d.name === 'AI System Test' 
            ? { 
                ...d, 
                status: 'warning', 
                message: 'IA funcionando (rate limit atingido)', 
                details: 'Sistema de IA está online mas com limite de requisições'
              }
            : d
        ))
      } else if (response.ok) {
        const data = await response.json()
        setDiagnostics(prev => prev.map(d => 
          d.name === 'AI System Test' 
            ? { 
                ...d, 
                status: 'success', 
                message: 'Sistema de IA funcionando', 
                details: `Resposta recebida: ${data.success ? 'Sucesso' : 'Fallback'}`
              }
            : d
        ))
      } else {
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (error) {
      setDiagnostics(prev => prev.map(d => 
        d.name === 'AI System Test' 
          ? { 
              ...d, 
              status: 'error', 
              message: 'Erro no sistema de IA', 
              details: error instanceof Error ? error.message : 'Erro desconhecido'
            }
          : d
      ))
    }
  }

  const runRadioTest = async () => {
    const newDiagnostic: DiagnosticResult = {
      name: 'Radio API Test',
      status: 'running',
      message: 'Testando API da rádio...'
    }
    setDiagnostics(prev => [...prev, newDiagnostic])

    try {
      const response = await fetch('/api/radio-status')
      const data = await response.json()
      
      setDiagnostics(prev => prev.map(d => 
        d.name === 'Radio API Test' 
          ? { 
              ...d, 
              status: 'success', 
              message: 'API da rádio funcionando', 
              details: `Música atual: ${data.currentSong || 'N/A'}`
            }
          : d
      ))
    } catch (error) {
      setDiagnostics(prev => prev.map(d => 
        d.name === 'Radio API Test' 
          ? { 
              ...d, 
              status: 'error', 
              message: 'Erro na API da rádio', 
              details: error instanceof Error ? error.message : 'Erro desconhecido'
            }
          : d
      ))
    }
  }

  const runAllTests = async () => {
    setIsRunningTests(true)
    setDiagnostics([])
    
    await Promise.all([
      runWebRTCTest(),
      runDatabaseTest(),
      runAITest(),
      runRadioTest()
    ])
    
    setIsRunningTests(false)
  }

  const clearDiagnostics = () => {
    setDiagnostics([])
  }

  const openMainSite = () => {
    window.open('/', '_blank')
  }

  const openLogs = () => {
    // Abrir console do desenvolvedor
    if (typeof window !== 'undefined') {
      console.log('🔍 Logs do Sistema:')
      console.log('- Para ver erros: Console > Errors')
      console.log('- Para ver network: Network tab')
      console.log('- Para ver storage: Application tab')
      alert('Logs abertos no console do desenvolvedor (F12)')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
      case 'supported':
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'offline':
      case 'not-supported':
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'checking':
      case 'running':
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online':
        return 'Online'
      case 'offline':
        return 'Offline'
      case 'supported':
        return 'Suportado'
      case 'not-supported':
        return 'Não Suportado'
      case 'checking':
        return 'Verificando...'
      case 'success':
        return 'Sucesso'
      case 'error':
        return 'Erro'
      case 'warning':
        return 'Alerta'
      case 'running':
        return 'Executando...'
      default:
        return 'Desconhecido'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900 text-white">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link 
                href="/login" 
                className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Voltar ao Login</span>
              </Link>
              <Separator orientation="vertical" className="h-6 bg-white/20" />
              <div className="flex items-center space-x-2">
                <Code className="h-6 w-6 text-purple-300" />
                <h1 className="text-xl font-bold">Dashboard do Desenvolvedor</h1>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="border-white/20 text-white">
                Ambiente de Desenvolvimento
              </Badge>
              <Button 
                onClick={openMainSite}
                variant="outline" 
                size="sm"
                className="border-white/20 text-white hover:bg-white/10"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Abrir Site Principal
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* System Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-black/20 border-white/10 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center">
                <Database className="h-4 w-4 mr-2" />
                Banco de Dados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                {getStatusIcon(systemStatus.database)}
                <span className="text-sm">{getStatusText(systemStatus.database)}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/20 border-white/10 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center">
                <Wifi className="h-4 w-4 mr-2" />
                WebRTC
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                {getStatusIcon(systemStatus.webrtc)}
                <span className="text-sm">{getStatusText(systemStatus.webrtc)}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/20 border-white/10 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center">
                <Activity className="h-4 w-4 mr-2" />
                API
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                {getStatusIcon(systemStatus.api)}
                <span className="text-sm">{getStatusText(systemStatus.api)}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/20 border-white/10 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center">
                <Bot className="h-4 w-4 mr-2" />
                Sistema IA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                {getStatusIcon(systemStatus.ai)}
                <span className="text-sm">{getStatusText(systemStatus.ai)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Diagnostic Tools */}
          <Card className="bg-black/20 border-white/10 text-white">
            <CardHeader>
              <CardTitle className="flex items-center">
                <TestTube className="h-5 w-5 mr-2" />
                Ferramentas de Diagnóstico
              </CardTitle>
              <CardDescription className="text-white/70">
                Teste funcionalidades específicas do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  onClick={runWebRTCTest}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                  disabled={isRunningTests}
                >
                  <Wifi className="h-4 w-4 mr-2" />
                  Teste WebRTC
                </Button>

                <Button 
                  onClick={runDatabaseTest}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                  disabled={isRunningTests}
                >
                  <Database className="h-4 w-4 mr-2" />
                  Teste Database
                </Button>

                <Button 
                  onClick={runAITest}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                  disabled={isRunningTests}
                >
                  <Bot className="h-4 w-4 mr-2" />
                  Teste IA
                </Button>

                <Button 
                  onClick={runRadioTest}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                  disabled={isRunningTests}
                >
                  <Radio className="h-4 w-4 mr-2" />
                  Teste Rádio
                </Button>
              </div>

              <Separator className="bg-white/10" />

              <div className="flex space-x-3">
                <Button 
                  onClick={runAllTests}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                  disabled={isRunningTests}
                >
                  {isRunningTests ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Zap className="h-4 w-4 mr-2" />
                  )}
                  {isRunningTests ? 'Executando...' : 'Executar Todos'}
                </Button>

                <Button 
                  onClick={clearDiagnostics}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Limpar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* System Tools */}
          <Card className="bg-black/20 border-white/10 text-white">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Ferramentas do Sistema
              </CardTitle>
              <CardDescription className="text-white/70">
                Acesso a logs, monitoramento e configurações
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                <Button 
                  onClick={checkSystemStatus}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10 justify-start"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Atualizar Status do Sistema
                </Button>

                <Button 
                  onClick={openLogs}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10 justify-start"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Visualizar Logs do Sistema
                </Button>

                <Button 
                  onClick={() => window.open('https://github.com/juliocamposmachado/Orkut-br', '_blank')}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10 justify-start"
                >
                  <GitBranch className="h-4 w-4 mr-2" />
                  Repositório no GitHub
                </Button>

                <Button 
                  onClick={() => alert('Console do desenvolvedor: F12\nNetwork tab: Monitorar requisições\nApplication tab: LocalStorage/SessionStorage')}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10 justify-start"
                >
                  <Terminal className="h-4 w-4 mr-2" />
                  Ferramentas do Navegador
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Diagnostic Results */}
        {diagnostics.length > 0 && (
          <Card className="bg-black/20 border-white/10 text-white mt-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                Resultados dos Diagnósticos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {diagnostics.map((diagnostic, index) => (
                  <div 
                    key={index} 
                    className="flex items-start space-x-3 p-3 rounded-lg bg-white/5 border border-white/10"
                  >
                    {getStatusIcon(diagnostic.status)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{diagnostic.name}</span>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            diagnostic.status === 'success' ? 'border-green-500 text-green-400' :
                            diagnostic.status === 'error' ? 'border-red-500 text-red-400' :
                            diagnostic.status === 'warning' ? 'border-yellow-500 text-yellow-400' :
                            'border-blue-500 text-blue-400'
                          }`}
                        >
                          {getStatusText(diagnostic.status)}
                        </Badge>
                      </div>
                      <p className="text-sm text-white/80 mt-1">{diagnostic.message}</p>
                      {diagnostic.details && (
                        <p className="text-xs text-white/60 mt-1">{diagnostic.details}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-white/60 text-sm">
          <p>Dashboard de Desenvolvimento - Orkut Retrô</p>
          <p className="mt-1">Para uso em ambiente de desenvolvimento local</p>
        </div>
      </div>
    </div>
  )
}

export default DeveloperDashboard
