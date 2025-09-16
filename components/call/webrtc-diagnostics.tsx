'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/contexts/local-auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { 
  Camera, 
  Mic, 
  Monitor, 
  Wifi, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Play,
  Square,
  Volume2,
  VolumeX,
  Settings,
  RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'

interface DiagnosticsResult {
  test: string
  status: 'success' | 'warning' | 'error'
  message: string
  details?: any
  timestamp: string
}

interface STUNTestResult {
  server: string
  reachable: boolean
  responseTime?: number
  error?: string
  candidates?: RTCIceCandidate[]
}

export function WebRTCDiagnostics() {
  const { user } = useAuth()
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<DiagnosticsResult[]>([])
  const [stunResults, setStunResults] = useState<STUNTestResult[]>([])
  const [progress, setProgress] = useState(0)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  
  const stunServers = [
    'stun:stun.l.google.com:19302',
    'stun:stun1.l.google.com:19302',
    'stun:stun2.l.google.com:19302',
    'stun:stun.cloudflare.com:3478'
  ]

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop())
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [localStream])

  // Monitor audio level
  useEffect(() => {
    if (localStream && isRecording) {
      setupAudioMonitoring()
    }
  }, [localStream, isRecording])

  const setupAudioMonitoring = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const analyser = audioContext.createAnalyser()
      const microphone = audioContext.createMediaStreamSource(localStream!)
      
      analyser.smoothingTimeConstant = 0.8
      analyser.fftSize = 1024
      
      microphone.connect(analyser)
      
      audioContextRef.current = audioContext
      analyserRef.current = analyser
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount)
      
      const updateAudioLevel = () => {
        if (analyserRef.current && isRecording) {
          analyserRef.current.getByteFrequencyData(dataArray)
          const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length
          setAudioLevel(Math.round((average / 255) * 100))
          requestAnimationFrame(updateAudioLevel)
        }
      }
      
      updateAudioLevel()
    } catch (error) {
      console.error('Erro ao configurar monitoramento de áudio:', error)
    }
  }

  const addResult = (test: string, status: DiagnosticsResult['status'], message: string, details?: any) => {
    const result: DiagnosticsResult = {
      test,
      status,
      message,
      details,
      timestamp: new Date().toISOString()
    }
    
    setResults(prev => [...prev, result])
    console.log(`[WebRTC Test] ${test}: ${status} - ${message}`, details)
  }

  const runComprehensiveTests = async () => {
    if (!user) {
      toast.error('Usuário não autenticado')
      return
    }

    setIsRunning(true)
    setResults([])
    setStunResults([])
    setProgress(0)

    const totalTests = 8
    let currentTest = 0

    const updateProgress = () => {
      currentTest++
      setProgress((currentTest / totalTests) * 100)
    }

    try {
      // Test 1: Browser WebRTC Support
      addResult(
        'Suporte WebRTC',
        typeof window !== 'undefined' && window.RTCPeerConnection ? 'success' : 'error',
        typeof window !== 'undefined' && window.RTCPeerConnection ? 'WebRTC suportado' : 'WebRTC não suportado',
        {
          RTCPeerConnection: !!window.RTCPeerConnection,
          getUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
          MediaRecorder: !!window.MediaRecorder
        }
      )
      updateProgress()

      // Test 2: Device Enumeration
      try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        const videoInputs = devices.filter(d => d.kind === 'videoinput')
        const audioInputs = devices.filter(d => d.kind === 'audioinput')
        const audioOutputs = devices.filter(d => d.kind === 'audiooutput')
        
        addResult(
          'Dispositivos de Mídia',
          (videoInputs.length > 0 && audioInputs.length > 0) ? 'success' : 'warning',
          `${videoInputs.length} câmera(s), ${audioInputs.length} microfone(s), ${audioOutputs.length} alto-falante(s)`,
          { videoInputs, audioInputs, audioOutputs }
        )
      } catch (error) {
        addResult('Dispositivos de Mídia', 'error', 'Erro ao enumerar dispositivos', error)
      }
      updateProgress()

      // Test 3: Camera and Microphone Access
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 },
            frameRate: { ideal: 30 }
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        })
        
        const videoTracks = stream.getVideoTracks()
        const audioTracks = stream.getAudioTracks()
        
        setLocalStream(stream)
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
        
        addResult(
          'Acesso à Mídia',
          'success',
          'Câmera e microfone acessados com sucesso',
          {
            videoTracks: videoTracks.map(t => ({
              label: t.label,
              settings: t.getSettings()
            })),
            audioTracks: audioTracks.map(t => ({
              label: t.label,
              settings: t.getSettings()
            }))
          }
        )
      } catch (error) {
        addResult('Acesso à Mídia', 'error', 'Erro ao acessar câmera/microfone', error)
      }
      updateProgress()

      // Test 4: Screen Sharing
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false
        })
        screenStream.getTracks().forEach(track => track.stop())
        addResult('Compartilhamento de Tela', 'success', 'Compartilhamento de tela disponível')
      } catch (error) {
        addResult('Compartilhamento de Tela', 'warning', 'Compartilhamento de tela não disponível ou negado', error)
      }
      updateProgress()

      // Test 5: STUN Server Connectivity
      await testSTUNServers()
      updateProgress()

      // Test 6: WebRTC Peer Connection Test
      await testPeerConnection()
      updateProgress()

      // Test 7: Network Information
      testNetworkInfo()
      updateProgress()

      // Test 8: Audio/Video Codecs
      testCodecs()
      updateProgress()

    } catch (error) {
      console.error('Erro durante os testes:', error)
      addResult('Teste Geral', 'error', 'Erro durante execução dos testes', error)
    }

    setIsRunning(false)
  }

  const testSTUNServers = async () => {
    const results: STUNTestResult[] = []
    
    for (const server of stunServers) {
      try {
        const startTime = Date.now()
        
        const pc = new RTCPeerConnection({
          iceServers: [{ urls: server }]
        })
        
        const candidates: RTCIceCandidate[] = []
        
        const candidatePromise = new Promise<RTCIceCandidate[]>((resolve, reject) => {
          const timeout = setTimeout(() => {
            pc.close()
            resolve(candidates)
          }, 5000)
          
          pc.onicecandidate = (event) => {
            if (event.candidate) {
              candidates.push(event.candidate)
            }
          }
          
          pc.onicegatheringstatechange = () => {
            if (pc.iceGatheringState === 'complete') {
              clearTimeout(timeout)
              pc.close()
              resolve(candidates)
            }
          }
          
          pc.createDataChannel('test')
          pc.createOffer().then(offer => {
            pc.setLocalDescription(offer)
          }).catch(reject)
        })
        
        const gatheredCandidates = await candidatePromise
        const responseTime = Date.now() - startTime
        
        results.push({
          server,
          reachable: gatheredCandidates.length > 0,
          responseTime,
          candidates: gatheredCandidates
        })
        
      } catch (error) {
        results.push({
          server,
          reachable: false,
          error: (error as Error).message
        })
      }
    }
    
    setStunResults(results)
    
    const successCount = results.filter(r => r.reachable).length
    addResult(
      'Servidores STUN',
      successCount > 0 ? 'success' : 'error',
      `${successCount}/${results.length} servidores STUN acessíveis`,
      results
    )
  }

  const testPeerConnection = async () => {
    try {
      const pc1 = new RTCPeerConnection({
        iceServers: stunResults.filter(r => r.reachable).map(r => ({ urls: r.server }))
      })
      
      const pc2 = new RTCPeerConnection({
        iceServers: stunResults.filter(r => r.reachable).map(r => ({ urls: r.server }))
      })
      
      // Setup data channel
      const dataChannel = pc1.createDataChannel('test')
      let dataChannelOpen = false
      
      dataChannel.onopen = () => {
        dataChannelOpen = true
        dataChannel.send('Hello WebRTC!')
      }
      
      pc2.ondatachannel = (event) => {
        const channel = event.channel
        channel.onmessage = (e) => {
          console.log('Data channel message received:', e.data)
        }
      }
      
      // ICE candidate exchange
      pc1.onicecandidate = (event) => {
        if (event.candidate) {
          pc2.addIceCandidate(event.candidate)
        }
      }
      
      pc2.onicecandidate = (event) => {
        if (event.candidate) {
          pc1.addIceCandidate(event.candidate)
        }
      }
      
      // Create offer and answer
      const offer = await pc1.createOffer()
      await pc1.setLocalDescription(offer)
      await pc2.setRemoteDescription(offer)
      
      const answer = await pc2.createAnswer()
      await pc2.setLocalDescription(answer)
      await pc1.setRemoteDescription(answer)
      
      // Wait for connection
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Timeout na conexão peer-to-peer'))
        }, 10000)
        
        const checkConnection = () => {
          if (pc1.connectionState === 'connected' && pc2.connectionState === 'connected') {
            clearTimeout(timeout)
            resolve()
          } else if (pc1.connectionState === 'failed' || pc2.connectionState === 'failed') {
            clearTimeout(timeout)
            reject(new Error('Falha na conexão peer-to-peer'))
          } else {
            setTimeout(checkConnection, 100)
          }
        }
        
        checkConnection()
      })
      
      pc1.close()
      pc2.close()
      
      addResult(
        'Conexão Peer-to-Peer',
        'success',
        'Conexão WebRTC estabelecida com sucesso',
        { dataChannelWorking: dataChannelOpen }
      )
    } catch (error) {
      addResult('Conexão Peer-to-Peer', 'error', 'Falha na conexão WebRTC', error)
    }
  }

  const testNetworkInfo = () => {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
    
    addResult(
      'Informações de Rede',
      'success',
      'Informações coletadas',
      {
        online: navigator.onLine,
        effectiveType: connection?.effectiveType,
        downlink: connection?.downlink,
        rtt: connection?.rtt,
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        cookieEnabled: navigator.cookieEnabled
      }
    )
  }

  const testCodecs = () => {
    const pc = new RTCPeerConnection()
    
    // Test video codecs
    const videoCodecs: string[] = []
    const videoCapabilities = RTCRtpSender.getCapabilities?.('video')
    if (videoCapabilities) {
      videoCodecs.push(...videoCapabilities.codecs.map(codec => codec.mimeType))
    }
    
    // Test audio codecs
    const audioCodecs: string[] = []
    const audioCapabilities = RTCRtpSender.getCapabilities?.('audio')
    if (audioCapabilities) {
      audioCodecs.push(...audioCapabilities.codecs.map(codec => codec.mimeType))
    }
    
    pc.close()
    
    addResult(
      'Codecs Suportados',
      'success',
      `${videoCodecs.length} codecs de vídeo, ${audioCodecs.length} codecs de áudio`,
      { videoCodecs, audioCodecs }
    )
  }

  const toggleRecording = () => {
    if (!localStream) return
    
    if (isRecording) {
      localStream.getTracks().forEach(track => track.stop())
      setLocalStream(null)
      setIsRecording(false)
      setAudioLevel(0)
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
        audioContextRef.current = null
      }
    } else {
      setIsRecording(true)
    }
  }

  const getStatusIcon = (status: DiagnosticsResult['status']) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />
    }
  }

  const getStatusBadge = (status: DiagnosticsResult['status']) => {
    switch (status) {
      case 'success': return <Badge className="bg-green-500 text-white">OK</Badge>
      case 'warning': return <Badge className="bg-yellow-500 text-white">Aviso</Badge>
      case 'error': return <Badge variant="destructive">Erro</Badge>
    }
  }

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Diagnósticos WebRTC Avançados
          </CardTitle>
          <CardDescription>
            Teste completo de funcionalidades WebRTC, conectividade e diagnóstico de problemas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Control Buttons */}
          <div className="flex gap-4">
            <Button 
              onClick={runComprehensiveTests}
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              {isRunning ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              {isRunning ? 'Executando Testes...' : 'Executar Diagnósticos Completos'}
            </Button>
            
            {localStream && (
              <Button
                onClick={toggleRecording}
                variant={isRecording ? "destructive" : "secondary"}
                className="flex items-center gap-2"
              >
                {isRecording ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {isRecording ? 'Parar' : 'Iniciar'} Preview
              </Button>
            )}
          </div>

          {/* Progress Bar */}
          {isRunning && (
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Progresso dos testes</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {/* Live Preview */}
          {localStream && (
            <div className="space-y-4">
              <Separator />
              <h3 className="text-lg font-semibold">Preview da Mídia</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Vídeo Local</h4>
                  <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Monitor de Áudio</h4>
                  <div className="bg-gray-100 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Volume2 className="h-4 w-4" />
                      <span className="text-sm">Nível do Microfone</span>
                    </div>
                    <div className="w-full bg-gray-300 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-100"
                        style={{ width: `${audioLevel}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{audioLevel}% volume</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Test Results */}
          {results.length > 0 && (
            <div className="space-y-4">
              <Separator />
              <h3 className="text-lg font-semibold">Resultados dos Testes</h3>
              <div className="space-y-2">
                {results.map((result, index) => (
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
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        {getStatusIcon(result.status)}
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-sm">{result.test}</h4>
                            {getStatusBadge(result.status)}
                          </div>
                          <p className="text-sm opacity-90 mt-1">{result.message}</p>
                          {result.details && (
                            <details className="mt-2">
                              <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-800">
                                Ver detalhes técnicos
                              </summary>
                              <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto max-h-40">
                                {JSON.stringify(result.details, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STUN Results */}
          {stunResults.length > 0 && (
            <div className="space-y-4">
              <Separator />
              <h3 className="text-lg font-semibold">Teste de Servidores STUN</h3>
              <div className="space-y-2">
                {stunResults.map((result, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Wifi className="h-4 w-4" />
                      <span className="font-mono text-sm">{result.server}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {result.reachable ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <Badge className="bg-green-500 text-white">OK</Badge>
                          {result.responseTime && (
                            <span className="text-xs text-gray-500">
                              {result.responseTime}ms
                            </span>
                          )}
                          {result.candidates && (
                            <span className="text-xs text-gray-500">
                              {result.candidates.length} candidates
                            </span>
                          )}
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 text-red-500" />
                          <Badge variant="destructive">Falhou</Badge>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Summary */}
          {results.length > 0 && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-800 mb-2">Resumo dos Testes</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-xl font-bold text-green-600">
                    {results.filter(r => r.status === 'success').length}
                  </div>
                  <div className="text-green-700">Sucessos</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-yellow-600">
                    {results.filter(r => r.status === 'warning').length}
                  </div>
                  <div className="text-yellow-700">Avisos</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-red-600">
                    {results.filter(r => r.status === 'error').length}
                  </div>
                  <div className="text-red-700">Erros</div>
                </div>
              </div>
            </div>
          )}
          
        </CardContent>
      </Card>
    </div>
  )
}
