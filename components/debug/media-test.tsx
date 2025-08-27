'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
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
  VolumeX
} from 'lucide-react'

interface MediaTestResult {
  camera: boolean
  microphone: boolean
  screen: boolean
  error?: string
  details?: any
}

interface STUNTestResult {
  server: string
  reachable: boolean
  responseTime?: number
  error?: string
}

export default function MediaTest() {
  const [isTestingMedia, setIsTestingMedia] = useState(false)
  const [mediaResults, setMediaResults] = useState<MediaTestResult | null>(null)
  const [stunResults, setStunResults] = useState<STUNTestResult[]>([])
  const [isTestingStun, setIsTestingStun] = useState(false)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  
  const stunServers = [
    'stun:stun.l.google.com:19302',
    'stun:stun1.l.google.com:19302',
    'stun:stun.cloudflare.com:3478'
  ]

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop())
      }
    }
  }, [localStream])

  const testMediaPermissions = async () => {
    setIsTestingMedia(true)
    const results: MediaTestResult = {
      camera: false,
      microphone: false,
      screen: false
    }

    try {
      // Test camera and microphone
      console.log('🎥 Testando acesso à câmera e microfone...')
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      })
      
      const videoTracks = stream.getVideoTracks()
      const audioTracks = stream.getAudioTracks()
      
      results.camera = videoTracks.length > 0
      results.microphone = audioTracks.length > 0
      
      console.log('✅ Acesso obtido:', {
        video: videoTracks.length,
        audio: audioTracks.length
      })
      
      // Store stream for live preview
      setLocalStream(stream)
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      
      results.details = {
        videoTracks: videoTracks.map(track => ({
          label: track.label,
          kind: track.kind,
          enabled: track.enabled,
          settings: track.getSettings?.()
        })),
        audioTracks: audioTracks.map(track => ({
          label: track.label,
          kind: track.kind,
          enabled: track.enabled,
          settings: track.getSettings?.()
        }))
      }
      
    } catch (error: any) {
      console.error('❌ Erro ao acessar mídia:', error)
      results.error = error.message
      
      if (error.name === 'NotAllowedError') {
        results.error = 'Permissão negada para câmera/microfone'
      } else if (error.name === 'NotFoundError') {
        results.error = 'Câmera ou microfone não encontrado'
      } else if (error.name === 'NotReadableError') {
        results.error = 'Câmera ou microfone já está em uso'
      }
    }

    // Test screen sharing
    try {
      console.log('🖥️ Testando compartilhamento de tela...')
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false
      })
      
      results.screen = true
      screenStream.getTracks().forEach(track => track.stop()) // Stop immediately
      console.log('✅ Compartilhamento de tela disponível')
    } catch (error: any) {
      console.error('❌ Compartilhamento de tela não disponível:', error)
    }

    setMediaResults(results)
    setIsTestingMedia(false)
  }

  const testSTUNServers = async () => {
    setIsTestingStun(true)
    setStunResults([])
    
    const results: STUNTestResult[] = []
    
    for (const server of stunServers) {
      console.log(`🌐 Testando servidor STUN: ${server}`)
      
      try {
        const startTime = Date.now()
        
        const pc = new RTCPeerConnection({
          iceServers: [{ urls: server }]
        })
        
        // Create a dummy data channel to trigger ICE gathering
        pc.createDataChannel('test')
        
        // Wait for ICE candidate or timeout
        const candidate = await new Promise<RTCIceCandidate | null>((resolve, reject) => {
          const timeout = setTimeout(() => {
            pc.close()
            reject(new Error('Timeout'))
          }, 5000)
          
          pc.onicecandidate = (event) => {
            if (event.candidate) {
              clearTimeout(timeout)
              pc.close()
              resolve(event.candidate)
            }
          }
          
          pc.onicegatheringstatechange = () => {
            if (pc.iceGatheringState === 'complete') {
              clearTimeout(timeout)
              pc.close()
              resolve(null)
            }
          }
          
          // Create offer to start ICE gathering
          pc.createOffer().then(offer => {
            pc.setLocalDescription(offer)
          }).catch(reject)
        })
        
        const responseTime = Date.now() - startTime
        
        results.push({
          server,
          reachable: candidate !== null,
          responseTime
        })
        
        console.log(`✅ ${server}: ${candidate ? 'OK' : 'No candidates'} (${responseTime}ms)`)
        
      } catch (error: any) {
        console.error(`❌ ${server}: ${error.message}`)
        results.push({
          server,
          reachable: false,
          error: error.message
        })
      }
      
      setStunResults([...results])
    }
    
    setIsTestingStun(false)
  }

  const toggleRecording = () => {
    if (!localStream) return
    
    if (isRecording) {
      localStream.getTracks().forEach(track => track.stop())
      setLocalStream(null)
      setIsRecording(false)
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
    } else {
      setIsRecording(true)
    }
  }

  const toggleMute = () => {
    if (!localStream) return
    
    const audioTrack = localStream.getAudioTracks()[0]
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled
      setIsMuted(!audioTrack.enabled)
    }
  }

  const getStatusIcon = (status: boolean, error?: string) => {
    if (error) return <XCircle className="h-5 w-5 text-red-500" />
    return status ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />
  }

  const getStatusBadge = (status: boolean, error?: string) => {
    if (error) return <Badge variant="destructive">Erro</Badge>
    return status ? <Badge variant="default" className="bg-green-500">OK</Badge> : <Badge variant="destructive">Falha</Badge>
  }

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-6 w-6" />
            Teste de Funcionalidades WebRTC
          </CardTitle>
          <CardDescription>
            Verifique se seu navegador e dispositivo suportam chamadas de áudio e vídeo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Media Permissions Test */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Permissões de Mídia</h3>
              <Button 
                onClick={testMediaPermissions}
                disabled={isTestingMedia}
                className="flex items-center gap-2"
              >
                {isTestingMedia ? 'Testando...' : 'Testar Permissões'}
              </Button>
            </div>
            
            {mediaResults && (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    <span>Câmera</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(mediaResults.camera, mediaResults.error)}
                    {getStatusBadge(mediaResults.camera, mediaResults.error)}
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Mic className="h-5 w-5" />
                    <span>Microfone</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(mediaResults.microphone, mediaResults.error)}
                    {getStatusBadge(mediaResults.microphone, mediaResults.error)}
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-5 w-5" />
                    <span>Compartilhamento de Tela</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(mediaResults.screen)}
                    {getStatusBadge(mediaResults.screen)}
                  </div>
                </div>
                
                {mediaResults.error && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                    <div>
                      <p className="text-red-700 font-medium">Erro detectado</p>
                      <p className="text-red-600 text-sm">{mediaResults.error}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Live Preview */}
          {localStream && (
            <div>
              <Separator />
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Prévia da Câmera</h3>
                
                <div className="relative bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-64 object-cover"
                  />
                  
                  <div className="absolute bottom-4 left-4 flex gap-2">
                    <Button
                      size="sm"
                      variant={isRecording ? "destructive" : "default"}
                      onClick={toggleRecording}
                    >
                      {isRecording ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      {isRecording ? 'Parar' : 'Gravar'}
                    </Button>
                    
                    <Button
                      size="sm"
                      variant={isMuted ? "destructive" : "secondary"}
                      onClick={toggleMute}
                    >
                      {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                      {isMuted ? 'Mudo' : 'Som'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <Separator />
          
          {/* STUN Server Test */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Conectividade STUN</h3>
              <Button 
                onClick={testSTUNServers}
                disabled={isTestingStun}
                className="flex items-center gap-2"
              >
                <Wifi className="h-4 w-4" />
                {isTestingStun ? 'Testando...' : 'Testar STUN'}
              </Button>
            </div>
            
            {stunResults.length > 0 && (
              <div className="space-y-3">
                {stunResults.map((result, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Wifi className="h-5 w-5" />
                      <span className="font-mono text-sm">{result.server}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(result.reachable, result.error)}
                      {getStatusBadge(result.reachable, result.error)}
                      {result.responseTime && (
                        <span className="text-xs text-gray-500">
                          {result.responseTime}ms
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* System Info */}
          <div>
            <Separator />
            <h3 className="text-lg font-semibold mb-4">Informações do Sistema</h3>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm font-mono">
              <p><strong>User Agent:</strong> {navigator.userAgent}</p>
              <p><strong>Plataforma:</strong> {navigator.platform}</p>
              <p><strong>Idioma:</strong> {navigator.language}</p>
              <p><strong>Online:</strong> {navigator.onLine ? 'Sim' : 'Não'}</p>
              <p><strong>WebRTC Support:</strong> {typeof window !== 'undefined' && window.RTCPeerConnection ? 'Sim' : 'Não'}</p>
              <p><strong>getUserMedia Support:</strong> {typeof navigator !== 'undefined' && navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function' ? 'Sim' : 'Não'}</p>
            </div>
          </div>
          
        </CardContent>
      </Card>
    </div>
  )
}
