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
  Zap,
  MessageCircle,
  Camera,
  Phone,
  Video,
  Send,
  Loader2
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

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
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
  
  // Chat states
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [isChatLoading, setIsChatLoading] = useState(false)

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

  // Novas funções de teste
  const testPostCreation = async () => {
    const newDiagnostic: DiagnosticResult = {
      name: 'Post Creation Test',
      status: 'running',
      message: 'Testando criação de posts...'
    }
    setDiagnostics(prev => [...prev, newDiagnostic])

    try {
      const testPost = {
        content: 'Teste de post do dashboard - ' + new Date().toLocaleString(),
        author: 'Dashboard Test',
        timestamp: Date.now()
      }

      const response = await fetch('/api/posts-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testPost)
      })

      if (response.ok) {
        const data = await response.json()
        setDiagnostics(prev => prev.map(d => 
          d.name === 'Post Creation Test' 
            ? { 
                ...d, 
                status: 'success', 
                message: 'Post criado com sucesso!',
                details: `ID: ${data.id || 'N/A'} - Salvo no banco de dados`
              }
            : d
        ))
      } else {
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (error) {
      setDiagnostics(prev => prev.map(d => 
        d.name === 'Post Creation Test' 
          ? { 
              ...d, 
              status: 'error', 
              message: 'Erro ao criar post', 
              details: error instanceof Error ? error.message : 'Erro desconhecido'
            }
          : d
      ))
    }
  }

  const testPhotoUpload = async () => {
    const newDiagnostic: DiagnosticResult = {
      name: 'Photo Upload Test',
      status: 'running',
      message: 'Testando upload de fotos...'
    }
    setDiagnostics(prev => [...prev, newDiagnostic])

    try {
      // Simular um arquivo de teste (pixel transparente 1x1)
      const canvas = document.createElement('canvas')
      canvas.width = 1
      canvas.height = 1
      
      canvas.toBlob(async (blob) => {
        if (!blob) {
          throw new Error('Erro ao criar imagem de teste')
        }

        const formData = new FormData()
        formData.append('file', blob, 'test-image.png')
        formData.append('type', 'profile')

        try {
          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
          })

          if (response.ok) {
            const data = await response.json()
            setDiagnostics(prev => prev.map(d => 
              d.name === 'Photo Upload Test' 
                ? { 
                    ...d, 
                    status: 'success', 
                    message: 'Upload de foto funcionando!',
                    details: `URL: ${data.url || 'N/A'} - Arquivo processado`
                  }
                : d
            ))
          } else if (response.status === 404) {
            setDiagnostics(prev => prev.map(d => 
              d.name === 'Photo Upload Test' 
                ? { 
                    ...d, 
                    status: 'warning', 
                    message: 'Endpoint de upload não implementado',
                    details: 'API /api/upload não encontrada - funcionalidade pendente'
                  }
                : d
            ))
          } else {
            throw new Error(`HTTP ${response.status}`)
          }
        } catch (fetchError) {
          setDiagnostics(prev => prev.map(d => 
            d.name === 'Photo Upload Test' 
              ? { 
                  ...d, 
                  status: 'error', 
                  message: 'Erro no upload', 
                  details: fetchError instanceof Error ? fetchError.message : 'Erro na requisição'
                }
              : d
          ))
        }
      }, 'image/png')
    } catch (error) {
      setDiagnostics(prev => prev.map(d => 
        d.name === 'Photo Upload Test' 
          ? { 
              ...d, 
              status: 'error', 
              message: 'Erro no teste de upload', 
              details: error instanceof Error ? error.message : 'Erro desconhecido'
            }
          : d
      ))
    }
  }

  const testAudioCall = async () => {
    const newDiagnostic: DiagnosticResult = {
      name: 'Audio Call Test',
      status: 'running',
      message: 'Testando funcionalidade de chamada de áudio...'
    }
    setDiagnostics(prev => [...prev, newDiagnostic])

    try {
      // Testar acesso ao microfone
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: false 
      })
      
      // Testar WebRTC peer connection
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      })
      
      // Adicionar stream ao peer connection
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream)
      })
      
      // Simular offer/answer
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      
      // Cleanup
      stream.getTracks().forEach(track => track.stop())
      pc.close()
      
      setDiagnostics(prev => prev.map(d => 
        d.name === 'Audio Call Test' 
          ? { 
              ...d, 
              status: 'success', 
              message: 'Sistema de áudio funcionando!',
              details: 'Microfone acessível, WebRTC configurado, pronto para chamadas'
            }
          : d
      ))
    } catch (error) {
      setDiagnostics(prev => prev.map(d => 
        d.name === 'Audio Call Test' 
          ? { 
              ...d, 
              status: 'error', 
              message: 'Erro no sistema de áudio', 
              details: error instanceof Error ? error.message : 'Verifique permissões do microfone'
            }
          : d
      ))
    }
  }

  const testVideoCall = async () => {
    const newDiagnostic: DiagnosticResult = {
      name: 'Video Call Test',
      status: 'running',
      message: 'Testando funcionalidade de chamada de vídeo...'
    }
    setDiagnostics(prev => [...prev, newDiagnostic])

    try {
      // Testar acesso à câmera e microfone
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: true 
      })
      
      // Testar WebRTC peer connection
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      })
      
      // Adicionar stream ao peer connection
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream)
      })
      
      // Simular offer/answer
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      
      // Verificar resolução de vídeo
      const videoTrack = stream.getVideoTracks()[0]
      const settings = videoTrack.getSettings()
      
      // Cleanup
      stream.getTracks().forEach(track => track.stop())
      pc.close()
      
      setDiagnostics(prev => prev.map(d => 
        d.name === 'Video Call Test' 
          ? { 
              ...d, 
              status: 'success', 
              message: 'Sistema de vídeo funcionando!',
              details: `Resolução: ${settings.width}x${settings.height} - Câmera e áudio prontos`
            }
          : d
      ))
    } catch (error) {
      setDiagnostics(prev => prev.map(d => 
        d.name === 'Video Call Test' 
          ? { 
              ...d, 
              status: 'error', 
              message: 'Erro no sistema de vídeo', 
              details: error instanceof Error ? error.message : 'Verifique permissões da câmera/microfone'
            }
          : d
      ))
    }
  }

  // Funções do Chat com IA
  const sendChatMessage = async () => {
    if (!chatInput.trim() || isChatLoading) return

    const currentMessage = chatInput // Salvar a mensagem antes de limpar o input
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: currentMessage,
      timestamp: Date.now()
    }

    setChatMessages(prev => [...prev, userMessage])
    setChatInput('')
    setIsChatLoading(true)

    try {
      // Coletar informações do sistema para contexto
      const systemContext = {
        systemStatus,
        diagnostics: diagnostics.slice(-5), // últimos 5 diagnósticos
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent
      }

      const response = await fetch('/api/gemini/chat-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: currentMessage,
          context: systemContext,
          chatHistory: chatMessages.slice(-10) // últimas 10 mensagens para contexto
        })
      })

      if (response.ok) {
        const data = await response.json()
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response || 'Desculpe, não consegui processar sua mensagem.',
          timestamp: Date.now()
        }
        setChatMessages(prev => [...prev, assistantMessage])
      } else {
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Erro ao conectar com a IA: ${error instanceof Error ? error.message : 'Erro desconhecido'}. Verifique se a API Gemini está configurada.`,
        timestamp: Date.now()
      }
      setChatMessages(prev => [...prev, errorMessage])
    }

    setIsChatLoading(false)
  }

  const clearChatHistory = () => {
    setChatMessages([])
  }

  const handleChatKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendChatMessage()
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
                className="border-purple-400 bg-purple-600/20 text-white hover:bg-purple-500/30 hover:border-purple-300"
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
                  className="border-blue-400 bg-blue-600/20 text-blue-100 hover:bg-blue-500/30 hover:text-white hover:border-blue-300"
                  disabled={isRunningTests}
                >
                  <Wifi className="h-4 w-4 mr-2" />
                  Teste WebRTC
                </Button>

                <Button 
                  onClick={runDatabaseTest}
                  variant="outline"
                  className="border-emerald-400 bg-emerald-600/20 text-emerald-100 hover:bg-emerald-500/30 hover:text-white hover:border-emerald-300"
                  disabled={isRunningTests}
                >
                  <Database className="h-4 w-4 mr-2" />
                  Teste Database
                </Button>

                <Button 
                  onClick={runAITest}
                  variant="outline"
                  className="border-violet-400 bg-violet-600/20 text-violet-100 hover:bg-violet-500/30 hover:text-white hover:border-violet-300"
                  disabled={isRunningTests}
                >
                  <Bot className="h-4 w-4 mr-2" />
                  Teste IA
                </Button>

                <Button 
                  onClick={runRadioTest}
                  variant="outline"
                  className="border-orange-400 bg-orange-600/20 text-orange-100 hover:bg-orange-500/30 hover:text-white hover:border-orange-300"
                  disabled={isRunningTests}
                >
                  <Radio className="h-4 w-4 mr-2" />
                  Teste Rádio
                </Button>
              </div>
              
              {/* Novos Testes de Funcionalidades */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10">
                <Button 
                  onClick={testPostCreation}
                  variant="outline"
                  className="border-green-400 bg-green-600/20 text-green-100 hover:bg-green-500/30 hover:text-white hover:border-green-300"
                  disabled={isRunningTests}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Testar Post
                </Button>

                <Button 
                  onClick={testPhotoUpload}
                  variant="outline"
                  className="border-cyan-400 bg-cyan-600/20 text-cyan-100 hover:bg-cyan-500/30 hover:text-white hover:border-cyan-300"
                  disabled={isRunningTests}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Testar Foto
                </Button>

                <Button 
                  onClick={testAudioCall}
                  variant="outline"
                  className="border-yellow-400 bg-yellow-600/20 text-yellow-100 hover:bg-yellow-500/30 hover:text-white hover:border-yellow-300"
                  disabled={isRunningTests}
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Testar Áudio
                </Button>

                <Button 
                  onClick={testVideoCall}
                  variant="outline"
                  className="border-pink-400 bg-pink-600/20 text-pink-100 hover:bg-pink-500/30 hover:text-white hover:border-pink-300"
                  disabled={isRunningTests}
                >
                  <Video className="h-4 w-4 mr-2" />
                  Testar Vídeo
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
                  className="border-red-400 bg-red-600/20 text-red-100 hover:bg-red-500/30 hover:text-white hover:border-red-300"
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
                  className="border-blue-400 bg-blue-600/20 text-blue-100 hover:bg-blue-500/30 hover:text-white hover:border-blue-300 justify-start"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Atualizar Status do Sistema
                </Button>

                <Button 
                  onClick={openLogs}
                  variant="outline"
                  className="border-emerald-400 bg-emerald-600/20 text-emerald-100 hover:bg-emerald-500/30 hover:text-white hover:border-emerald-300 justify-start"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Visualizar Logs do Sistema
                </Button>

                <Button 
                  onClick={() => window.open('https://github.com/juliocamposmachado/Orkut-br', '_blank')}
                  variant="outline"
                  className="border-violet-400 bg-violet-600/20 text-violet-100 hover:bg-violet-500/30 hover:text-white hover:border-violet-300 justify-start"
                >
                  <GitBranch className="h-4 w-4 mr-2" />
                  Repositório no GitHub
                </Button>

                <Button 
                  onClick={() => alert('Console do desenvolvedor: F12\nNetwork tab: Monitorar requisições\nApplication tab: LocalStorage/SessionStorage')}
                  variant="outline"
                  className="border-orange-400 bg-orange-600/20 text-orange-100 hover:bg-orange-500/30 hover:text-white hover:border-orange-300 justify-start"
                >
                  <Terminal className="h-4 w-4 mr-2" />
                  Ferramentas do Navegador
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chat com IA Gemini */}
        <Card className="bg-black/20 border-white/10 text-white mt-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Bot className="h-5 w-5 mr-2" />
                Chat com IA Gemini - Análise de Logs
              </div>
              <Badge 
                variant="outline" 
                className={`text-xs ${
                  systemStatus.ai === 'online' ? 'border-green-500 text-green-400' :
                  systemStatus.ai === 'offline' ? 'border-red-500 text-red-400' :
                  'border-yellow-500 text-yellow-400'
                }`}
              >
                {getStatusText(systemStatus.ai)}
              </Badge>
            </CardTitle>
            <CardDescription className="text-white/70">
              Converse com a IA sobre logs do sistema, erros e diagnósticos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Chat Messages */}
            <div className="h-64 overflow-y-auto bg-black/30 rounded-lg p-4 space-y-3">
              {chatMessages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-white/60">
                  <div className="text-center">
                    <Bot className="h-12 w-12 mx-auto mb-2 text-white/40" />
                    <p className="text-sm">Pergunte sobre logs, erros, status do sistema...</p>
                    <p className="text-xs mt-1">Ex: "Analise os últimos erros" ou "Como está o sistema?"</p>
                  </div>
                </div>
              ) : (
                chatMessages.map((message) => (
                  <div 
                    key={message.id} 
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                        message.role === 'user' 
                          ? 'bg-purple-600 text-white' 
                          : 'bg-white/10 text-white border border-white/20'
                      }`}
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        {message.role === 'assistant' && <Bot className="h-4 w-4 text-purple-300" />}
                        {message.role === 'user' && <span className="text-xs opacity-75">Você</span>}
                        <span className="text-xs opacity-75">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                ))
              )}
              {isChatLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/10 border border-white/20 px-3 py-2 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Bot className="h-4 w-4 text-purple-300" />
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">IA está pensando...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="flex space-x-2">
              <div className="flex-1">
                <textarea
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={handleChatKeyPress}
                  placeholder="Digite sua pergunta sobre logs, sistema, erros..."
                  className="w-full px-3 py-2 bg-black/30 border border-white/20 rounded-lg text-white placeholder-white/50 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={2}
                  disabled={isChatLoading}
                />
                <p className="text-xs text-white/60 mt-1">
                  Enter para enviar • Shift+Enter para nova linha
                </p>
              </div>
              <div className="flex flex-col space-y-2">
                <Button 
                  onClick={sendChatMessage}
                  disabled={!chatInput.trim() || isChatLoading}
                  className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                  size="sm"
                >
                  {isChatLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
                <Button 
                  onClick={clearChatHistory}
                  variant="outline"
                  size="sm"
                  className="border-red-400 bg-red-600/20 text-red-100 hover:bg-red-500/30 hover:text-white hover:border-red-300"
                  disabled={chatMessages.length === 0}
                >
                  Limpar
                </Button>
              </div>
            </div>

            {/* Mensagens Sugeridas */}
            <div className="flex flex-wrap gap-2">
              {[
                "Como está o sistema?",
                "Analise os últimos erros",
                "Status do banco de dados",
                "Problemas de WebRTC?",
                "Logs da API"
              ].map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="text-xs border-purple-400 bg-purple-600/20 text-purple-100 hover:bg-purple-500/30 hover:text-white hover:border-purple-300"
                  onClick={() => setChatInput(suggestion)}
                  disabled={isChatLoading}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

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
