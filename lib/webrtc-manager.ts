'use client'

/**
 * Sistema WebRTC Manager - Gerencia conexões reais de áudio e vídeo
 * Implementa peer-to-peer connection, sinalização e controles de mídia
 */

export interface WebRTCCallConfig {
  callId: string
  callType: 'audio' | 'video'
  isInitiator: boolean
  remoteUserId: string
  remoteUserInfo: {
    username: string
    display_name: string
    photo_url?: string
  }
}

export interface MediaConstraints {
  audio: boolean
  video: boolean
}

export class WebRTCManager {
  private peerConnection: RTCPeerConnection | null = null
  private localStream: MediaStream | null = null
  private remoteStream: MediaStream | null = null
  private dataChannel: RTCDataChannel | null = null
  private callConfig: WebRTCCallConfig | null = null
  
  // Callbacks para eventos
  private onRemoteStreamCallback: ((stream: MediaStream) => void) | null = null
  private onConnectionStateCallback: ((state: RTCPeerConnectionState) => void) | null = null
  private onCallEndedCallback: (() => void) | null = null
  private onErrorCallback: ((error: string) => void) | null = null

  // Configuração STUN/TURN servers
  private rtcConfiguration: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' }
    ],
    iceCandidatePoolSize: 10
  }

  constructor() {
    console.log('🎮 WebRTCManager inicializado')
  }

  /**
   * Iniciar uma chamada (como caller)
   */
  async startCall(config: WebRTCCallConfig): Promise<RTCSessionDescriptionInit> {
    console.log('📞 Iniciando chamada:', config)
    this.callConfig = config

    try {
      // Criar peer connection
      await this.createPeerConnection()
      
      // Obter mídia local
      const constraints: MediaConstraints = {
        audio: true,
        video: config.callType === 'video'
      }
      
      await this.getUserMedia(constraints)
      
      // Criar data channel
      this.dataChannel = this.peerConnection!.createDataChannel('callData', {
        ordered: true
      })
      
      this.setupDataChannelEvents(this.dataChannel)
      
      // Criar offer
      const offer = await this.peerConnection!.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: config.callType === 'video'
      })
      
      await this.peerConnection!.setLocalDescription(offer)
      
      console.log('✅ Offer criado:', offer)
      return offer
      
    } catch (error) {
      console.error('❌ Erro ao iniciar chamada:', error)
      this.onErrorCallback?.('Erro ao acessar câmera/microfone')
      throw error
    }
  }

  /**
   * Aceitar uma chamada (como receiver)
   */
  async acceptCall(config: WebRTCCallConfig, offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    console.log('✅ Aceitando chamada:', config)
    this.callConfig = config

    try {
      // Criar peer connection
      await this.createPeerConnection()
      
      // Obter mídia local
      const constraints: MediaConstraints = {
        audio: true,
        video: config.callType === 'video'
      }
      
      await this.getUserMedia(constraints)
      
      // Configurar offer remoto
      await this.peerConnection!.setRemoteDescription(offer)
      
      // Criar answer
      const answer = await this.peerConnection!.createAnswer()
      await this.peerConnection!.setLocalDescription(answer)
      
      console.log('✅ Answer criado:', answer)
      return answer
      
    } catch (error) {
      console.error('❌ Erro ao aceitar chamada:', error)
      this.onErrorCallback?.('Erro ao acessar câmera/microfone')
      throw error
    }
  }

  /**
   * Processar answer do receiver (para caller)
   */
  async processAnswer(answer: RTCSessionDescriptionInit) {
    console.log('📨 Processando answer:', answer)
    
    if (!this.peerConnection) {
      throw new Error('Peer connection não existe')
    }
    
    await this.peerConnection.setRemoteDescription(answer)
    console.log('✅ Answer processado')
  }

  /**
   * Adicionar ICE candidate
   */
  async addIceCandidate(candidate: RTCIceCandidateInit) {
    console.log('🧊 Adicionando ICE candidate:', candidate)
    
    if (!this.peerConnection) {
      console.warn('⚠️ Peer connection não existe para ICE candidate')
      return
    }
    
    try {
      await this.peerConnection.addIceCandidate(candidate)
      console.log('✅ ICE candidate adicionado')
    } catch (error) {
      console.error('❌ Erro ao adicionar ICE candidate:', error)
    }
  }

  /**
   * Criar peer connection
   */
  private async createPeerConnection() {
    console.log('🔗 Criando peer connection...')
    
    this.peerConnection = new RTCPeerConnection(this.rtcConfiguration)
    
    // Event listeners
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('🧊 Novo ICE candidate gerado:', event.candidate)
        // Aqui você enviaria o candidate via sinalização
        this.sendSignalingMessage({
          type: 'ice-candidate',
          candidate: event.candidate.toJSON()
        })
      }
    }
    
    this.peerConnection.ontrack = (event) => {
      console.log('📡 Stream remoto recebido:', event.streams[0])
      this.remoteStream = event.streams[0]
      this.onRemoteStreamCallback?.(event.streams[0])
    }
    
    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection!.connectionState
      console.log('🔄 Estado da conexão:', state)
      this.onConnectionStateCallback?.(state)
      
      if (state === 'disconnected' || state === 'failed' || state === 'closed') {
        this.onCallEndedCallback?.()
      }
    }
    
    this.peerConnection.ondatachannel = (event) => {
      console.log('📨 Data channel recebido')
      this.setupDataChannelEvents(event.channel)
    }
    
    console.log('✅ Peer connection criado')
  }

  /**
   * Obter mídia do usuário (câmera/microfone)
   */
  private async getUserMedia(constraints: MediaConstraints) {
    console.log('🎥 Obtendo mídia do usuário:', constraints)
    
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia(constraints)
      
      // Adicionar tracks ao peer connection
      this.localStream.getTracks().forEach(track => {
        console.log('➕ Adicionando track:', track.kind)
        this.peerConnection!.addTrack(track, this.localStream!)
      })
      
      console.log('✅ Mídia local obtida:', this.localStream)
      return this.localStream
      
    } catch (error) {
      console.error('❌ Erro ao obter mídia:', error)
      throw new Error('Não foi possível acessar câmera/microfone')
    }
  }

  /**
   * Configurar eventos do data channel
   */
  private setupDataChannelEvents(channel: RTCDataChannel) {
    channel.onopen = () => {
      console.log('📨 Data channel aberto')
    }
    
    channel.onmessage = (event) => {
      console.log('📨 Mensagem recebida:', event.data)
      // Processar mensagens de controle da chamada
    }
    
    channel.onclose = () => {
      console.log('📨 Data channel fechado')
    }
  }

  /**
   * Enviar mensagem de sinalização
   */
  private async sendSignalingMessage(message: any) {
    console.log('📡 Enviando sinalização:', message)
    
    if (!this.callConfig) return
    
    try {
      await fetch('/api/call-signaling', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callId: this.callConfig.callId,
          targetUserId: this.callConfig.remoteUserId,
          message
        })
      })
    } catch (error) {
      console.error('❌ Erro ao enviar sinalização:', error)
    }
  }

  /**
   * Controles de mídia durante chamada
   */
  toggleMicrophone(): boolean {
    if (!this.localStream) return false
    
    const audioTrack = this.localStream.getAudioTracks()[0]
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled
      console.log('🎤 Microfone:', audioTrack.enabled ? 'ligado' : 'desligado')
      return audioTrack.enabled
    }
    return false
  }

  toggleCamera(): boolean {
    if (!this.localStream) return false
    
    const videoTrack = this.localStream.getVideoTracks()[0]
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled
      console.log('📹 Câmera:', videoTrack.enabled ? 'ligada' : 'desligada')
      return videoTrack.enabled
    }
    return false
  }

  /**
   * Encerrar chamada
   */
  async endCall() {
    console.log('☎️ Encerrando chamada...')
    
    // Parar tracks locais
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        track.stop()
        console.log('⏹️ Track parado:', track.kind)
      })
      this.localStream = null
    }
    
    // Fechar data channel
    if (this.dataChannel) {
      this.dataChannel.close()
      this.dataChannel = null
    }
    
    // Fechar peer connection
    if (this.peerConnection) {
      this.peerConnection.close()
      this.peerConnection = null
    }
    
    // Enviar sinalização de fim de chamada
    if (this.callConfig) {
      await this.sendSignalingMessage({
        type: 'call-ended'
      })
    }
    
    this.callConfig = null
    this.remoteStream = null
    
    console.log('✅ Chamada encerrada')
  }

  /**
   * Getters para streams
   */
  getLocalStream(): MediaStream | null {
    return this.localStream
  }

  getRemoteStream(): MediaStream | null {
    return this.remoteStream
  }

  /**
   * Configurar callbacks
   */
  onRemoteStream(callback: (stream: MediaStream) => void) {
    this.onRemoteStreamCallback = callback
  }

  onConnectionStateChange(callback: (state: RTCPeerConnectionState) => void) {
    this.onConnectionStateCallback = callback
  }

  onCallEnded(callback: () => void) {
    this.onCallEndedCallback = callback
  }

  onError(callback: (error: string) => void) {
    this.onErrorCallback = callback
  }

  /**
   * Verificar suporte WebRTC
   */
  static isWebRTCSupported(): boolean {
    return !!(typeof navigator !== 'undefined' &&
              navigator.mediaDevices && 
              typeof navigator.mediaDevices.getUserMedia === 'function' && 
              typeof window !== 'undefined' &&
              window.RTCPeerConnection)
  }
}
