'use client'

import { supabase } from '@/lib/supabase'

/**
 * Configuração de fallback para WebRTC e WebSocket
 * Resolve problemas de conexão em ambientes com restrições
 */

export interface WebRTCConfig {
  iceServers: RTCIceServer[]
  iceCandidatePoolSize: number
  iceTransportPolicy?: RTCIceTransportPolicy
  bundlePolicy?: RTCBundlePolicy
}

export interface WebSocketConfig {
  url: string
  protocols?: string[]
  reconnectAttempts: number
  reconnectDelay: number
}

/**
 * Configuração robusta para WebRTC com múltiplos servidores STUN/TURN
 */
export const getWebRTCConfig = (): WebRTCConfig => {
  // Configuração básica para desenvolvimento/produção
  const config: WebRTCConfig = {
    iceServers: [
      // Google STUN servers (gratuitos, mas básicos)
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      
      // Outros servidores STUN públicos
      { urls: 'stun:stun.stunprotocol.org:3478' },
      { urls: 'stun:stun.voiparound.com' },
      { urls: 'stun:stun.voipbuster.com' },
      
      // Se você tiver um servidor TURN próprio, adicione aqui:
      // {
      //   urls: 'turn:your-turn-server.com:3478',
      //   username: 'your-username',
      //   credential: 'your-password'
      // }
    ],
    iceCandidatePoolSize: 10,
    iceTransportPolicy: 'all', // ou 'relay' para forçar uso de TURN
    bundlePolicy: 'max-bundle'
  }

  return config
}

/**
 * Testa conectividade WebRTC
 */
export const testWebRTCConnectivity = async (): Promise<boolean> => {
  return new Promise((resolve) => {
    try {
      const pc = new RTCPeerConnection(getWebRTCConfig())
      
      // Timeout de 10 segundos para o teste
      const timeout = setTimeout(() => {
        pc.close()
        resolve(false)
      }, 10000)

      pc.oniceconnectionstatechange = () => {
        console.log('ICE Connection State:', pc.iceConnectionState)
        
        if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
          clearTimeout(timeout)
          pc.close()
          resolve(true)
        } else if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
          clearTimeout(timeout)
          pc.close()
          resolve(false)
        }
      }

      // Criar um data channel para testar conectividade
      const dataChannel = pc.createDataChannel('test', {
        ordered: true
      })

      dataChannel.onopen = () => {
        console.log('✅ WebRTC Data Channel aberto')
      }

      dataChannel.onerror = (error) => {
        console.error('❌ Erro no WebRTC Data Channel:', error)
      }

      // Iniciar o processo de conexão
      pc.createOffer()
        .then(offer => pc.setLocalDescription(offer))
        .catch(error => {
          console.error('Erro ao criar offer:', error)
          clearTimeout(timeout)
          pc.close()
          resolve(false)
        })

    } catch (error) {
      console.error('Erro no teste de conectividade WebRTC:', error)
      resolve(false)
    }
  })
}

/**
 * Gerenciador de reconexão para Supabase Realtime
 */
export class RealtimeFallback {
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private isReconnecting = false

  constructor(private onReconnect?: () => void) {}

  async handleConnectionError(error: any): Promise<void> {
    console.error('🔌 Erro de conexão Realtime:', error)

    if (this.isReconnecting) {
      console.log('⏳ Já tentando reconectar...')
      return
    }

    this.isReconnecting = true

    while (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      
      console.log(`🔄 Tentativa de reconexão ${this.reconnectAttempts}/${this.maxReconnectAttempts}`)
      
      await this.delay(this.reconnectDelay * this.reconnectAttempts)

      try {
        // Testar conexão básica
        const { data, error } = await supabase.from('profiles').select('id').limit(1)
        
        if (!error) {
          console.log('✅ Reconexão bem-sucedida')
          this.reconnectAttempts = 0
          this.isReconnecting = false
          this.onReconnect?.()
          return
        }
      } catch (reconnectError) {
        console.error(`❌ Falha na reconexão ${this.reconnectAttempts}:`, reconnectError)
      }
    }

    console.error('💥 Falha em todas as tentativas de reconexão')
    this.isReconnecting = false
    this.reconnectAttempts = 0
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  reset(): void {
    this.reconnectAttempts = 0
    this.isReconnecting = false
  }
}

/**
 * Detector de ambiente e capacidades
 */
export const getEnvironmentCapabilities = () => {
  const capabilities = {
    webRTC: typeof RTCPeerConnection !== 'undefined',
    getUserMedia: typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia,
    webSocket: typeof WebSocket !== 'undefined',
    isMobile: typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
    isSecureContext: typeof window !== 'undefined' && window.isSecureContext,
    supportsAudio: typeof HTMLAudioElement !== 'undefined',
  }

  console.log('🔍 Capacidades do ambiente:', capabilities)
  return capabilities
}

/**
 * Configuração de mídia segura com fallbacks
 */
export const getSafeMediaConstraints = (preferredConstraints?: MediaStreamConstraints): MediaStreamConstraints => {
  const capabilities = getEnvironmentCapabilities()
  
  // Configuração básica segura
  let constraints: MediaStreamConstraints = {
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      sampleRate: 44100,
      channelCount: 1
    },
    video: false // Por padrão, apenas áudio
  }

  // Se o dispositivo for móvel, usar configuração mais conservadora
  if (capabilities.isMobile) {
    constraints.audio = {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      sampleRate: 22050, // Menor para dispositivos móveis
      channelCount: 1
    }
  }

  // Aplicar preferências do usuário se fornecidas
  if (preferredConstraints) {
    constraints = { ...constraints, ...preferredConstraints }
  }

  return constraints
}

/**
 * Teste completo do sistema WebRTC
 */
export const runWebRTCDiagnostics = async () => {
  console.log('🔧 Iniciando diagnósticos WebRTC...')
  
  const capabilities = getEnvironmentCapabilities()
  const results = {
    environment: capabilities,
    webrtcConnectivity: false,
    mediaAccess: false,
    supabaseConnection: false,
    errors: [] as string[]
  }

  try {
    // Testar conectividade WebRTC
    results.webrtcConnectivity = await testWebRTCConnectivity()
    
    // Testar acesso à mídia
    if (capabilities.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(getSafeMediaConstraints())
        stream.getTracks().forEach(track => track.stop()) // Limpar
        results.mediaAccess = true
      } catch (error: any) {
        results.errors.push(`Erro de mídia: ${error.message}`)
      }
    }

    // Testar conexão Supabase
    try {
      const { error } = await supabase.from('profiles').select('id').limit(1)
      results.supabaseConnection = !error
      if (error) {
        results.errors.push(`Erro Supabase: ${error.message}`)
      }
    } catch (error: any) {
      results.errors.push(`Erro na conexão: ${error.message}`)
    }

  } catch (error: any) {
    results.errors.push(`Erro geral: ${error.message}`)
  }

  console.log('📊 Resultados dos diagnósticos:', results)
  return results
}

/**
 * URL de WebSocket com fallback
 */
export const getWebSocketUrl = (): string => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  
  if (!supabaseUrl) {
    console.warn('URL do Supabase não configurada, usando localhost')
    return 'wss://localhost:3000/ws'
  }

  // Converter URL HTTP para WebSocket
  const wsUrl = supabaseUrl.replace('https://', 'wss://').replace('http://', 'ws://')
  return `${wsUrl}/realtime/v1/websocket`
}
