'use client'

import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react'
import { useAuth } from '@/contexts/local-auth-context'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { callLogger } from '@/lib/call-logger'

interface WebRTCUser {
  id: string
  username: string
  display_name: string
  photo_url?: string
  isOnline: boolean
}

interface CallState {
  isInCall: boolean
  callType: 'audio' | 'video' | null
  callingUser: WebRTCUser | null
  receivingCall: boolean
  callAccepted: boolean
  localStream: MediaStream | null
  remoteStream: MediaStream | null
}

interface WebRTCContextType {
  // Call state
  callState: CallState
  
  // Actions
  startAudioCall: (userId: string) => Promise<void>
  startVideoCall: (userId: string) => Promise<void>
  acceptCall: () => Promise<void>
  rejectCall: () => void
  endCall: () => void
  
  // Media controls
  toggleMute: () => void
  toggleVideo: () => void
  
  // State
  isMuted: boolean
  isVideoEnabled: boolean
  onlineUsers: WebRTCUser[]
  
  // Refs for video elements
  localVideoRef: React.RefObject<HTMLVideoElement>
  remoteVideoRef: React.RefObject<HTMLVideoElement>
}

const WebRTCContext = createContext<WebRTCContextType | undefined>(undefined)

// ICE servers configuration (using free STUN servers)
  // Configurações avançadas para ICE Servers incluindo TURN servers
  const ICE_SERVERS = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun.cloudflare.com:3478' },
      // Adicione servidores TURN quando disponíveis para NAT traversal
      // { urls: 'turn:numb.viagenie.ca', username: 'webrtc@live.com', credential: 'muazkh' }
    ],
    iceCandidatePoolSize: 10
  }

export function WebRTCProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  
  // Refs
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const socketRef = useRef<WebSocket | null>(null)
  
  // State
  const [callState, setCallState] = useState<CallState>({
    isInCall: false,
    callType: null,
    callingUser: null,
    receivingCall: false,
    callAccepted: false,
    localStream: null,
    remoteStream: null
  })
  
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [onlineUsers, setOnlineUsers] = useState<WebRTCUser[]>([])
  
  // Initialize WebSocket connection for signaling
  useEffect(() => {
    if (!user) return
    
    try {
      initializeSignaling()
    } catch (error) {
      console.error('Failed to connect to signaling server:', error)
    }
    
    return () => {
      if (socketRef.current) {
        socketRef.current.close()
      }
    }
  }, [user])
  
  const initializeSignaling = async () => {
    if (!user) {
      console.log('❌ Não foi possível inicializar signaling: usuário não autenticado')
      return
    }
    
    console.log('🚀 Inicializando signaling para usuário:', user.id)
    
    try {
      // Subscribe to call signals using Supabase realtime
      const callsChannel = supabase
        .channel('webrtc_calls')
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'call_signals',
            filter: `to_user_id=eq.${user.id}`
          }, 
          (payload) => {
            console.log('📡 Sinal WebRTC recebido:', payload)
            handleSignalingMessage(payload.new)
          }
        )
        .subscribe((status, error) => {
          if (error) {
            console.error('❌ Erro na subscrição do canal:', error)
          } else {
            console.log('✅ Canal de signaling subscrito com sucesso:', status)
          }
        })
      
      // Update user online status
      console.log('🔄 Atualizando status online...')
      await updateOnlineStatus(true)
      
      // Load online users
      console.log('👥 Carregando usuários online...')
      await loadOnlineUsers()
      
      console.log('✅ Signaling inicializado com sucesso')
    } catch (error) {
      console.error('❌ Erro ao inicializar signaling:', error)
    }
  }
  
  const updateOnlineStatus = async (isOnline: boolean) => {
    if (!user) return
    
    try {
      console.log(`🔄 Atualizando status para: ${isOnline ? 'online' : 'offline'}`)
      
      // Primeiro, tentar usar a função UPSERT se existir
      try {
        const { error: rpcError } = await supabase.rpc('upsert_user_presence', {
          p_user_id: user.id,
          p_is_online: isOnline,
          p_status: isOnline ? 'online' : 'offline',
          p_device_info: {
            platform: 'web',
            user_agent: navigator.userAgent,
            timestamp: new Date().toISOString()
          }
        })
        
        if (!rpcError) {
          console.log('✅ Status atualizado via função RPC')
          return
        } else {
          console.warn('⚠️ RPC falhou, tentando UPSERT manual:', rpcError)
        }
      } catch (rpcError) {
        console.warn('⚠️ RPC não disponível, usando UPSERT manual')
      }
      
      // Fallback: UPSERT manual
      const { error } = await supabase
        .from('user_presence')
        .upsert({
          user_id: user.id,
          is_online: isOnline,
          last_seen: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })
      
      if (error) {
        console.error('❌ Erro no UPSERT manual:', error)
        
        // Último fallback: INSERT ou UPDATE separado
        try {
          const { error: insertError } = await supabase
            .from('user_presence')
            .insert({
              user_id: user.id,
              is_online: isOnline,
              last_seen: new Date().toISOString()
            })
            
          if (insertError && insertError.code === '23505') { // Conflict
            // Tentar UPDATE
            const { error: updateError } = await supabase
              .from('user_presence')
              .update({
                is_online: isOnline,
                last_seen: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('user_id', user.id)
              
            if (updateError) {
              console.error('❌ Erro no UPDATE final:', updateError)
            } else {
              console.log('✅ Status atualizado via UPDATE')
            }
          } else if (!insertError) {
            console.log('✅ Status criado via INSERT')
          } else {
            console.error('❌ Erro no INSERT final:', insertError)
          }
        } catch (finalError) {
          console.error('❌ Erro no fallback final:', finalError)
        }
      } else {
        console.log('✅ Status atualizado via UPSERT manual')
      }
    } catch (error) {
      console.error('❌ Erro geral ao atualizar status online:', error)
    }
  }
  
  const loadOnlineUsers = async () => {
    if (!user) return
    
    try {
      console.log('🔍 Carregando usuários online...')
      
      // Primeiro, buscar users presence
      const { data: presenceData, error: presenceError } = await supabase
        .from('user_presence')
        .select('user_id, is_online, last_seen')
        .eq('is_online', true)
        .neq('user_id', user.id)
        .gte('last_seen', new Date(Date.now() - 5 * 60 * 1000).toISOString())
      
      if (presenceError) {
        console.error('❌ Erro ao buscar presença:', presenceError)
        setOnlineUsers([])
        return
      }
      
      console.log('✅ Presenças encontradas:', presenceData?.length || 0)
      
      if (!presenceData || presenceData.length === 0) {
        console.log('😕 Nenhum usuário online encontrado')
        setOnlineUsers([])
        return
      }
      
      // Depois, buscar profiles separadamente
      const userIds = presenceData.map(p => p.user_id)
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, display_name, photo_url')
        .in('id', userIds)
      
      if (profilesError) {
        console.error('❌ Erro ao buscar profiles:', profilesError)
        // Criar usuários sem profile como fallback
        const fallbackUsers: WebRTCUser[] = presenceData.map((presence, index) => ({
          id: presence.user_id,
          username: `user${index + 1}`,
          display_name: `Usuário ${index + 1}`,
          photo_url: undefined,
          isOnline: presence.is_online
        }))
        setOnlineUsers(fallbackUsers)
        return
      }
      
      // Combinar presence e profiles
      const users: WebRTCUser[] = presenceData.map(presence => {
        const profile = profilesData?.find(p => p.id === presence.user_id)
        return {
          id: presence.user_id,
          username: profile?.username || 'unknown',
          display_name: profile?.display_name || 'Usuário Desconhecido',
          photo_url: profile?.photo_url,
          isOnline: presence.is_online
        }
      })
      
      console.log('✅ Usuários online carregados:', users)
      
      // Sempre usar apenas dados reais do banco
      setOnlineUsers(users)
    } catch (error) {
      console.error('❌ Erro geral ao carregar usuários online:', error)
      setOnlineUsers([])
    }
  }
  
  const createPeerConnection = async () => {
    const peerConnection = new RTCPeerConnection(ICE_SERVERS)
    
    peerConnection.onicecandidate = async (event) => {
      if (event.candidate) {
        // Send ICE candidate through signaling
        await sendSignalingMessage({
          type: 'ice-candidate',
          candidate: event.candidate
        })
      }
    }
    
    peerConnection.ontrack = (event) => {
      const [remoteStream] = event.streams
      setCallState(prev => ({ ...prev, remoteStream }))
      
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream
      }
    }
    
    peerConnectionRef.current = peerConnection
    return peerConnection
  }
  
  const sendSignalingMessage = async (message: any) => {
    if (!user || !callState.callingUser) return
    
    try {
      await supabase
        .from('call_signals')
        .insert({
          from_user_id: user.id,
          to_user_id: callState.callingUser.id,
          signal_type: message.type,
          signal_data: message,
          created_at: new Date().toISOString()
        })
    } catch (error) {
      console.error('Error sending signaling message:', error)
    }
  }
  
  const handleSignalingMessage = async (signal: any) => {
    const { signal_type, signal_data } = signal
    
    console.log('🔄 Processando sinal:', signal_type, signal_data)
    
    try {
      switch (signal_type) {
        case 'call_offer':
          await handleIncomingCallOffer(signal_data)
          break
        case 'call_accepted':
          await handleCallAccepted(signal_data)
          break
        case 'call_rejected':
          handleCallRejected(signal_data)
          break
        case 'offer':
          if (peerConnectionRef.current) {
            await handleOffer(signal_data)
          } else {
            console.warn('⚠️ Recebido offer mas peerConnection não existe, criando...')
            await createPeerConnection()
            await handleOffer(signal_data)
          }
          break
        case 'answer':
          if (peerConnectionRef.current) {
            await handleAnswer(signal_data)
          } else {
            console.error('❌ Recebido answer mas peerConnection não existe')
          }
          break
        case 'ice-candidate':
          if (peerConnectionRef.current) {
            await handleIceCandidate(signal_data)
          } else {
            console.warn('⚠️ Recebido ICE candidate mas peerConnection não existe, criando...')
            await createPeerConnection()
            await handleIceCandidate(signal_data)
          }
          break
        case 'call-end':
          handleCallEnd()
          break
        default:
          console.warn('⚠️ Tipo de sinal desconhecido:', signal_type)
      }
    } catch (error) {
      console.error('❌ Erro ao processar sinal WebRTC:', error)
    }
  }
  
  const handleOffer = async (offer: RTCSessionDescriptionInit) => {
    if (!peerConnectionRef.current) await createPeerConnection()
    
    await peerConnectionRef.current!.setRemoteDescription(offer)
    
    // Get user media based on call type
    const stream = await getUserMedia(callState.callType || 'audio')
    setCallState(prev => ({ ...prev, localStream: stream, receivingCall: true }))
    
    // Add tracks to peer connection
    stream.getTracks().forEach(track => {
      peerConnectionRef.current!.addTrack(track, stream)
    })
    
    // Create and send answer
    const answer = await peerConnectionRef.current!.createAnswer()
    await peerConnectionRef.current!.setLocalDescription(answer)
    
    await sendSignalingMessage({
      type: 'answer',
      answer
    })
  }
  
  const handleAnswer = async (answer: RTCSessionDescriptionInit) => {
    if (!peerConnectionRef.current) return
    await peerConnectionRef.current.setRemoteDescription(answer)
    
    setCallState(prev => ({ ...prev, callAccepted: true }))
  }
  
  const handleIceCandidate = async (candidate: RTCIceCandidateInit) => {
    if (!peerConnectionRef.current) return
    await peerConnectionRef.current.addIceCandidate(candidate)
  }
  
  const handleIncomingCallOffer = async (signalData: any) => {
    console.log('📞 Oferta de chamada recebida:', signalData)
    
    // Esta função será chamada quando o usuário recebe uma notificação de chamada
    // A notificação já é tratada pelo IncomingCallNotification component
    // Aqui apenas preparamos para aceitar a chamada quando necessário
  }

  const handleCallAccepted = async (signalData: any) => {
    console.log('✅ Chamada aceita:', signalData)
    
    if (signalData.answer && peerConnectionRef.current) {
      await peerConnectionRef.current.setRemoteDescription(signalData.answer)
      setCallState(prev => ({ ...prev, callAccepted: true }))
      toast.success('Chamada aceita!')
    }
  }

  const handleCallRejected = (signalData: any) => {
    console.log('❌ Chamada rejeitada:', signalData)
    toast.error('Chamada rejeitada')
    endCall()
  }

  const handleCallEnd = () => {
    endCall()
  }
  
  const getUserMedia = async (callType: 'audio' | 'video'): Promise<MediaStream> => {
    console.log('🎯 Solicitando permissões de mídia para:', callType)
    // Detectar se é mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    console.log('📱 Dispositivo mobile:', isMobile)
    
    const constraints: MediaStreamConstraints = {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        // Mobile optimizations
        sampleRate: isMobile ? 22050 : 44100,
        channelCount: 1
      },
      video: callType === 'video' ? {
        width: isMobile ? { ideal: 640, max: 1280 } : { ideal: 1280, max: 1920 },
        height: isMobile ? { ideal: 480, max: 720 } : { ideal: 720, max: 1080 },
        frameRate: isMobile ? { ideal: 15, max: 30 } : { ideal: 30, max: 60 },
        facingMode: isMobile ? 'user' : undefined, // Front camera preferida no mobile
        aspectRatio: 16/9
      } : false
    }
    
    // Adicionar fallbacks para diferentes browsers
    try {
      // Verificar se o browser suporta getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia não suportado neste navegador');
      }
    
    console.log('🔍 Constraints:', JSON.stringify(constraints, null, 2))
    
    // Implementação principal
    try {
      console.log('🚀 Chamando getUserMedia...')
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      console.log('✅ Stream obtido com sucesso:', stream)
      console.log('📹 Video tracks:', stream.getVideoTracks().length)
      console.log('🎤 Audio tracks:', stream.getAudioTracks().length)
      
      if (localVideoRef.current && callType === 'video') {
        console.log('📺 Configurando vídeo local...')
        localVideoRef.current.srcObject = stream
        
        // Mobile: auto-play e configurações
        if (isMobile) {
          localVideoRef.current.playsInline = true
          localVideoRef.current.muted = true
          console.log('📱 Configurações mobile aplicadas')
        }
      }
      
      return stream
    } catch (error) {
      console.error('❌ Erro ao obter stream:', error)
      console.error('Erro detalhado:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        constraintName: (error as any)?.constraintName || 'Unknown'
      })
      
      // Série de fallbacks para diferentes situações
      
      // Fallback 1: Tentar apenas áudio se o vídeo falhar
      if (callType === 'video') {
        try {
          console.log('🔄 Tentando fallback: apenas áudio')
          const audioOnlyStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: false
          })
          console.log('✅ Stream de áudio obtido com sucesso')
          return audioOnlyStream
        } catch (audioError) {
          console.error('❌ Fallback de áudio falhou:', audioError)
        }
      }
      
      // Fallback 2: Para mobile com permissões limitadas
      if (isMobile && callType === 'video') {
        try {
          console.log('🔄 Tentando fallback mobile com resolução menor')
          const fallbackStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: {
              width: { ideal: 320, max: 640 },
              height: { ideal: 240, max: 480 },
              frameRate: { ideal: 10, max: 15 }
            }
          })
          
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = fallbackStream
            localVideoRef.current.playsInline = true
            localVideoRef.current.muted = true
          }
          
          return fallbackStream
        } catch (fallbackError) {
          console.error('❌ Fallback mobile falhou:', fallbackError)
        }
      }
      
      // Fallback 3: Último recurso - criar stream vazio com apenas áudio
      try {
        console.log('🔄 Tentando criar stream sintético como último recurso')
        // Criar um contexto de áudio e um destino como fallback extremo
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const destination = audioContext.createMediaStreamDestination();
        return destination.stream;
    } catch (error) {
      console.error('❌ Todos os fallbacks falharam')
    }
    
    throw error
  }
  } catch (outerError) {
    console.error('❌ Erro geral em getUserMedia:', outerError)
    throw outerError
  }
  }
  
  const startAudioCall = async (userId: string) => {
    const callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    callLogger.info('ui', 'Iniciando chamada de áudio', { targetUserId: userId }, user?.id, callId)
    
    try {
      // Find user info
      const targetUser = onlineUsers.find(u => u.id === userId)
      if (!targetUser) {
        callLogger.error('ui', 'Usuário não encontrado para chamada', { 
          targetUserId: userId, 
          onlineUsers: onlineUsers.map(u => ({ id: u.id, name: u.display_name })) 
        }, user?.id, callId)
        toast.error('Usuário não encontrado ou offline')
        return
      }
      
      callLogger.success('ui', 'Usuário alvo encontrado', { targetUser: targetUser.display_name }, user?.id, callId)
      
      // Set initial call state
      setCallState(prev => ({
        ...prev,
        isInCall: true,
        callType: 'audio',
        callingUser: targetUser
      }))
      
      // Get local media first
      callLogger.media('Solicitando mídia de áudio', { callType: 'audio' }, user?.id, callId)
      const stream = await getUserMedia('audio')
      setCallState(prev => ({ ...prev, localStream: stream }))
      callLogger.success('media', 'Stream de áudio obtido', { 
        audioTracks: stream.getAudioTracks().length,
        videoTracks: stream.getVideoTracks().length
      }, user?.id, callId)
      
      // Create peer connection and add tracks
      callLogger.webrtc('Criando conexão WebRTC', {}, user?.id, callId)
      const peerConnection = await createPeerConnection()
      
      // Monitor WebRTC events
      callLogger.monitorPeerConnection(peerConnection, callId)
      
      stream.getTracks().forEach(track => {
        callLogger.webrtc('Adicionando track ao peer connection', { trackKind: track.kind }, user?.id, callId)
        peerConnection.addTrack(track, stream)
      })
      
      // Create and send offer
      callLogger.webrtc('Criando oferta WebRTC', {}, user?.id, callId)
      const offer = await peerConnection.createOffer()
      await peerConnection.setLocalDescription(offer)
      callLogger.success('webrtc', 'Oferta criada e definida localmente', { 
        offerType: offer.type,
        signalingState: peerConnection.signalingState 
      }, user?.id, callId)
      
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        callLogger.error('auth', 'Token de autenticação não encontrado', {}, user?.id, callId)
        throw new Error('Token de autenticação não encontrado')
      }
      callLogger.auth('Token de autenticação obtido', { tokenLength: session.access_token.length }, user?.id)
      
      // Send call notification via API
      callLogger.api('Enviando notificação de chamada via API', { 
        targetUserId: userId, 
        callType: 'audio' 
      }, user?.id, callId)
      
      const response = await fetch('/api/call-notification', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          targetUserId: userId,
          callType: 'audio',
          offer: offer
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        callLogger.error('api', 'Erro na API de notificação', { 
          status: response.status, 
          statusText: response.statusText, 
          errorData 
        }, user?.id, callId)
        throw new Error(`Falha ao enviar notificação de chamada: ${response.status}`)
      }

      const result = await response.json()
      callLogger.success('api', 'Notificação de chamada enviada com sucesso', result, user?.id, callId)
      
      toast.success(`Chamando ${targetUser.display_name} via áudio...`)
      
      // Set calling state
      setCallState(prev => ({ ...prev, calling: true }))
      callLogger.success('ui', 'Chamada de áudio iniciada com sucesso', { 
        targetUser: targetUser.display_name 
      }, user?.id, callId)
      
    } catch (error) {
      callLogger.error('ui', 'Erro ao iniciar chamada de áudio', { 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      }, user?.id, callId)
      toast.error(`Erro ao iniciar chamada de áudio: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
      endCall()
    }
  }
  
  const startVideoCall = async (userId: string) => {
    console.log('📹 Iniciando chamada de vídeo para:', userId)
    try {
      // Find user info
      const targetUser = onlineUsers.find(u => u.id === userId)
      if (!targetUser) {
        console.error('❌ Usuário não encontrado:', userId, 'Online users:', onlineUsers)
        toast.error('Usuário não encontrado ou offline')
        return
      }
      console.log('✅ Usuário encontrado:', targetUser.display_name)
      
      // Set initial call state
      setCallState(prev => ({
        ...prev,
        isInCall: true,
        callType: 'video',
        callingUser: targetUser
      }))
      
      // Get local media first
      console.log('🎥 Obtendo mídia de vídeo...')
      const stream = await getUserMedia('video')
      setCallState(prev => ({ ...prev, localStream: stream }))
      
      // Create peer connection and add tracks
      console.log('🔗 Criando conexão WebRTC...')
      const peerConnection = await createPeerConnection()
      stream.getTracks().forEach(track => {
        console.log('➕ Adicionando track:', track.kind)
        peerConnection.addTrack(track, stream)
      })
      
      // Create and send offer
      console.log('📋 Criando oferta WebRTC...')
      const offer = await peerConnection.createOffer()
      await peerConnection.setLocalDescription(offer)
      console.log('✅ Oferta criada e definida localmente')
      
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('Token de autenticação não encontrado')
      }
      
      // Send call notification via API
      console.log('📨 Enviando notificação de chamada...')
      const response = await fetch('/api/call-notification', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          targetUserId: userId,
          callType: 'video',
          offer: offer
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('❌ Erro na API de notificação:', response.status, errorData)
        throw new Error(`Falha ao enviar notificação de chamada: ${response.status}`)
      }

      const result = await response.json()
      console.log('✅ Notificação de chamada enviada:', result)
      
      toast.success(`Chamando ${targetUser.display_name} via vídeo...`)
      
      // Set calling state
      setCallState(prev => ({ ...prev, calling: true }))
      
    } catch (error) {
      console.error('❌ Erro ao iniciar chamada de vídeo:', error)
      toast.error(`Erro ao iniciar chamada de vídeo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
      endCall()
    }
  }
  
  const acceptCall = async () => {
    try {
      setCallState(prev => ({ 
        ...prev, 
        callAccepted: true,
        receivingCall: false 
      }))
      
      toast.success('Chamada aceita!')
    } catch (error) {
      console.error('Error accepting call:', error)
      toast.error('Erro ao aceitar chamada')
    }
  }
  
  const rejectCall = () => {
    endCall()
    toast.info('Chamada rejeitada')
  }
  
  const endCall = () => {
    // Stop local stream
    if (callState.localStream) {
      callState.localStream.getTracks().forEach(track => track.stop())
    }
    
    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
      peerConnectionRef.current = null
    }
    
    // Send end call signal
    if (callState.callingUser) {
      sendSignalingMessage({ type: 'call-end' })
    }
    
    // Reset state
    setCallState({
      isInCall: false,
      callType: null,
      callingUser: null,
      receivingCall: false,
      callAccepted: false,
      localStream: null,
      remoteStream: null
    })
    
    setIsMuted(false)
    setIsVideoEnabled(true)
  }
  
  const toggleMute = () => {
    if (callState.localStream) {
      const audioTrack = callState.localStream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setIsMuted(!audioTrack.enabled)
      }
    }
  }
  
  const toggleVideo = () => {
    if (callState.localStream) {
      const videoTrack = callState.localStream.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        setIsVideoEnabled(videoTrack.enabled)
      }
    }
  }
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (user) {
        updateOnlineStatus(false)
      }
      endCall()
    }
  }, [])
  
  const value: WebRTCContextType = {
    callState,
    startAudioCall,
    startVideoCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
    isMuted,
    isVideoEnabled,
    onlineUsers,
    localVideoRef,
    remoteVideoRef
  }
  
  return (
    <WebRTCContext.Provider value={value}>
      {children}
    </WebRTCContext.Provider>
  )
}

export const useWebRTC = () => {
  const context = useContext(WebRTCContext)
  if (context === undefined) {
    throw new Error('useWebRTC must be used within a WebRTCProvider')
  }
  return context
}
