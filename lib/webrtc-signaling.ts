'use client'

import { supabase } from '@/lib/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'

/**
 * Sistema de Sinalização WebRTC via Supabase Realtime
 * Gerencia troca de SDPs e ICE candidates entre peers
 */

export interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate' | 'call-start' | 'call-end' | 'call-reject'
  callId: string
  fromUserId: string
  toUserId: string
  payload?: any
  timestamp: string
}

export interface CallOffer {
  sdp: RTCSessionDescriptionInit
  callType: 'audio' | 'video'
  callerInfo: {
    id: string
    username: string
    display_name: string
    photo_url?: string
  }
}

export interface CallAnswer {
  sdp: RTCSessionDescriptionInit
}

export interface ICECandidate {
  candidate: RTCIceCandidateInit
}

export class WebRTCSignaling {
  private channel: RealtimeChannel | null = null
  private userId: string
  private onMessageCallback: ((message: SignalingMessage) => void) | null = null
  
  constructor(userId: string) {
    this.userId = userId
    console.log('📡 WebRTC Signaling inicializado para usuário:', userId)
  }

  /**
   * Conecta ao canal de sinalização do usuário
   */
  async connect(): Promise<void> {
    if (this.channel) {
      console.log('⚠️ Canal já conectado')
      return
    }

    const channelName = `webrtc_signaling_${this.userId}`
    console.log('🔌 Conectando ao canal:', channelName)

    this.channel = supabase.channel(channelName)
      .on('broadcast', { event: 'signaling' }, (payload) => {
        console.log('📨 Mensagem de sinalização recebida:', payload)
        const message = payload.payload as SignalingMessage
        
        // Verificar se a mensagem é para este usuário
        if (message.toUserId === this.userId) {
          console.log('✅ Mensagem processada para usuário:', this.userId)
          this.onMessageCallback?.(message)
        } else {
          console.log('ℹ️ Mensagem não é para este usuário, ignorando')
        }
      })
      .subscribe((status) => {
        console.log('📡 Status da conexão de sinalização:', status)
        if (status === 'SUBSCRIBED') {
          console.log('✅ Conectado ao canal de sinalização')
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Erro na conexão do canal')
        }
      })
  }

  /**
   * Desconecta do canal de sinalização
   */
  disconnect(): void {
    if (this.channel) {
      console.log('🔌 Desconectando do canal de sinalização')
      supabase.removeChannel(this.channel)
      this.channel = null
    }
  }

  /**
   * Define callback para receber mensagens
   */
  onMessage(callback: (message: SignalingMessage) => void): void {
    this.onMessageCallback = callback
  }

  /**
   * Envia mensagem de sinalização para outro usuário
   */
  private async sendMessage(message: SignalingMessage): Promise<void> {
    if (!this.channel) {
      throw new Error('Canal não conectado')
    }

    console.log('📤 Enviando mensagem de sinalização:', message.type, 'para:', message.toUserId)
    
    await this.channel.send({
      type: 'broadcast',
      event: 'signaling',
      payload: message
    })

    console.log('✅ Mensagem enviada com sucesso')
  }

  /**
   * Inicia uma chamada enviando uma oferta
   */
  async sendCallOffer(
    toUserId: string,
    callId: string,
    offer: CallOffer
  ): Promise<void> {
    const message: SignalingMessage = {
      type: 'call-start',
      callId,
      fromUserId: this.userId,
      toUserId,
      payload: offer,
      timestamp: new Date().toISOString()
    }

    console.log('📞 Enviando oferta de chamada:', { callId, toUserId })
    await this.sendMessage(message)
  }

  /**
   * Envia SDP offer
   */
  async sendOffer(
    toUserId: string,
    callId: string,
    sdp: RTCSessionDescriptionInit
  ): Promise<void> {
    const message: SignalingMessage = {
      type: 'offer',
      callId,
      fromUserId: this.userId,
      toUserId,
      payload: { sdp },
      timestamp: new Date().toISOString()
    }

    console.log('📤 Enviando SDP Offer')
    await this.sendMessage(message)
  }

  /**
   * Envia SDP answer
   */
  async sendAnswer(
    toUserId: string,
    callId: string,
    sdp: RTCSessionDescriptionInit
  ): Promise<void> {
    const message: SignalingMessage = {
      type: 'answer',
      callId,
      fromUserId: this.userId,
      toUserId,
      payload: { sdp },
      timestamp: new Date().toISOString()
    }

    console.log('📤 Enviando SDP Answer')
    await this.sendMessage(message)
  }

  /**
   * Envia ICE candidate
   */
  async sendICECandidate(
    toUserId: string,
    callId: string,
    candidate: RTCIceCandidateInit
  ): Promise<void> {
    const message: SignalingMessage = {
      type: 'ice-candidate',
      callId,
      fromUserId: this.userId,
      toUserId,
      payload: { candidate },
      timestamp: new Date().toISOString()
    }

    console.log('🧊 Enviando ICE Candidate')
    await this.sendMessage(message)
  }

  /**
   * Rejeita uma chamada
   */
  async sendCallReject(
    toUserId: string,
    callId: string
  ): Promise<void> {
    const message: SignalingMessage = {
      type: 'call-reject',
      callId,
      fromUserId: this.userId,
      toUserId,
      payload: null,
      timestamp: new Date().toISOString()
    }

    console.log('❌ Enviando rejeição de chamada')
    await this.sendMessage(message)
  }

  /**
   * Encerra uma chamada
   */
  async sendCallEnd(
    toUserId: string,
    callId: string
  ): Promise<void> {
    const message: SignalingMessage = {
      type: 'call-end',
      callId,
      fromUserId: this.userId,
      toUserId,
      payload: null,
      timestamp: new Date().toISOString()
    }

    console.log('☎️ Enviando encerramento de chamada')
    await this.sendMessage(message)
  }
}

/**
 * Classe para gerenciar conexão WebRTC
 */
export class WebRTCPeerConnection {
  private pc: RTCPeerConnection
  private localStream: MediaStream | null = null
  private signaling: WebRTCSignaling
  private callId: string
  private remoteUserId: string
  private isInitiator: boolean

  // Callbacks
  private onRemoteStreamCallback: ((stream: MediaStream) => void) | null = null
  private onConnectionStateCallback: ((state: RTCPeerConnectionState) => void) | null = null

  // Configuração STUN
  private static readonly RTC_CONFIG: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun.stunprotocol.org:3478' }
    ],
    iceCandidatePoolSize: 10
  }

  constructor(
    signaling: WebRTCSignaling,
    callId: string,
    remoteUserId: string,
    isInitiator: boolean
  ) {
    this.signaling = signaling
    this.callId = callId
    this.remoteUserId = remoteUserId
    this.isInitiator = isInitiator

    console.log('🎮 Criando conexão WebRTC:', { callId, remoteUserId, isInitiator })
    
    this.pc = new RTCPeerConnection(WebRTCPeerConnection.RTC_CONFIG)
    this.setupPeerConnectionEvents()
  }

  /**
   * Configura eventos da peer connection
   */
  private setupPeerConnectionEvents(): void {
    // ICE candidates
    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('🧊 Novo ICE candidate local gerado')
        this.signaling.sendICECandidate(
          this.remoteUserId,
          this.callId,
          event.candidate.toJSON()
        ).catch(console.error)
      }
    }

    // Stream remoto
    this.pc.ontrack = (event) => {
      console.log('📡 Stream remoto recebido')
      const [remoteStream] = event.streams
      this.onRemoteStreamCallback?.(remoteStream)
    }

    // Estado da conexão
    this.pc.onconnectionstatechange = () => {
      const state = this.pc.connectionState
      console.log('🔄 Estado da conexão WebRTC:', state)
      this.onConnectionStateCallback?.(state)
    }

    // Estado do ICE
    this.pc.oniceconnectionstatechange = () => {
      console.log('🧊 Estado ICE:', this.pc.iceConnectionState)
    }
  }

  /**
   * Inicia uma chamada (para o iniciador)
   */
  async startCall(): Promise<RTCSessionDescriptionInit> {
    console.log('📞 Iniciando chamada...')
    
    // Obter mídia local
    await this.getLocalMedia()
    
    // Criar offer
    const offer = await this.pc.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: false // Apenas áudio por enquanto
    })

    await this.pc.setLocalDescription(offer)
    console.log('✅ Offer criado e definido localmente')
    
    return offer
  }

  /**
   * Aceita uma chamada (para o receptor)
   */
  async acceptCall(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    console.log('✅ Aceitando chamada...')
    
    // Obter mídia local
    await this.getLocalMedia()
    
    // Definir offer remoto
    await this.pc.setRemoteDescription(offer)
    
    // Criar answer
    const answer = await this.pc.createAnswer()
    await this.pc.setLocalDescription(answer)
    
    console.log('✅ Answer criado e definido localmente')
    
    return answer
  }

  /**
   * Processa answer recebido (para o iniciador)
   */
  async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    console.log('📨 Processando answer recebido')
    await this.pc.setRemoteDescription(answer)
    console.log('✅ Answer processado')
  }

  /**
   * Adiciona ICE candidate recebido
   */
  async addICECandidate(candidate: RTCIceCandidateInit): Promise<void> {
    console.log('🧊 Adicionando ICE candidate recebido')
    
    try {
      await this.pc.addIceCandidate(candidate)
      console.log('✅ ICE candidate adicionado')
    } catch (error) {
      console.error('❌ Erro ao adicionar ICE candidate:', error)
    }
  }

  /**
   * Obtém mídia local (áudio)
   */
  private async getLocalMedia(): Promise<void> {
    try {
      console.log('🎤 Obtendo mídia local...')
      
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false
      })

      // Adicionar tracks à peer connection
      this.localStream.getTracks().forEach(track => {
        console.log('➕ Adicionando track local:', track.kind)
        this.pc.addTrack(track, this.localStream!)
      })

      console.log('✅ Mídia local obtida e tracks adicionados')
    } catch (error) {
      console.error('❌ Erro ao obter mídia:', error)
      throw new Error('Não foi possível acessar o microfone')
    }
  }

  /**
   * Encerra a chamada
   */
  close(): void {
    console.log('☎️ Encerrando conexão WebRTC...')
    
    // Parar tracks locais
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        track.stop()
        console.log('⏹️ Track parado:', track.kind)
      })
      this.localStream = null
    }

    // Fechar peer connection
    this.pc.close()
    console.log('✅ Conexão WebRTC encerrada')
  }

  /**
   * Controles de mídia
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

  /**
   * Getters
   */
  getLocalStream(): MediaStream | null {
    return this.localStream
  }

  getConnectionState(): RTCPeerConnectionState {
    return this.pc.connectionState
  }

  /**
   * Callbacks
   */
  onRemoteStream(callback: (stream: MediaStream) => void): void {
    this.onRemoteStreamCallback = callback
  }

  onConnectionStateChange(callback: (state: RTCPeerConnectionState) => void): void {
    this.onConnectionStateCallback = callback
  }
}

/**
 * Utility function para gerar IDs únicos de chamada
 */
export function generateCallId(): string {
  return `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}
