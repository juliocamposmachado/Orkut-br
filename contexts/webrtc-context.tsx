'use client'

import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react'
import { useAuth } from '@/contexts/enhanced-auth-context'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

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
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]
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
    
    // For development, we'll use a simple WebSocket server
    // In production, you'd want to use a proper signaling server
    try {
      // This is a placeholder - you'd need to set up a WebSocket server
      // For now, we'll use Supabase realtime as signaling
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
    if (!user) return
    
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
          handleSignalingMessage(payload.new)
        }
      )
      .subscribe()
    
    // Update user online status
    await updateOnlineStatus(true)
    
    // Load online users
    await loadOnlineUsers()
  }
  
  const updateOnlineStatus = async (isOnline: boolean) => {
    if (!user) return
    
    try {
      await supabase
        .from('user_presence')
        .upsert({
          user_id: user.id,
          is_online: isOnline,
          last_seen: new Date().toISOString()
        })
    } catch (error) {
      console.error('Error updating online status:', error)
    }
  }
  
  const loadOnlineUsers = async () => {
    if (!user) return
    
    try {
      const { data, error } = await supabase
        .from('user_presence')
        .select(`
          user_id,
          is_online,
          profiles!inner(username, display_name, photo_url)
        `)
        .eq('is_online', true)
        .neq('user_id', user.id)
        .gte('last_seen', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // Active in last 5 minutes
      
      if (error) throw error
      
      const users: WebRTCUser[] = data.map((item: any) => ({
        id: item.user_id,
        username: item.profiles.username,
        display_name: item.profiles.display_name,
        photo_url: item.profiles.photo_url,
        isOnline: item.is_online
      }))
      
      setOnlineUsers(users)
    } catch (error) {
      console.error('Error loading online users:', error)
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
    
    if (!peerConnectionRef.current) return
    
    switch (signal_type) {
      case 'offer':
        await handleOffer(signal_data)
        break
      case 'answer':
        await handleAnswer(signal_data)
        break
      case 'ice-candidate':
        await handleIceCandidate(signal_data)
        break
      case 'call-end':
        handleCallEnd()
        break
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
  
  const handleCallEnd = () => {
    endCall()
  }
  
  const getUserMedia = async (callType: 'audio' | 'video'): Promise<MediaStream> => {
    const constraints = {
      audio: true,
      video: callType === 'video'
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      
      if (localVideoRef.current && callType === 'video') {
        localVideoRef.current.srcObject = stream
      }
      
      return stream
    } catch (error) {
      console.error('Error getting user media:', error)
      throw error
    }
  }
  
  const startAudioCall = async (userId: string) => {
    try {
      // Find user info
      const targetUser = onlineUsers.find(u => u.id === userId)
      if (!targetUser) {
        toast.error('Usuário não encontrado ou offline')
        return
      }
      
      setCallState(prev => ({
        ...prev,
        isInCall: true,
        callType: 'audio',
        callingUser: targetUser
      }))
      
      // Get local media
      const stream = await getUserMedia('audio')
      setCallState(prev => ({ ...prev, localStream: stream }))
      
      // Create peer connection and add tracks
      const peerConnection = await createPeerConnection()
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream)
      })
      
      // Create and send offer
      const offer = await peerConnection.createOffer()
      await peerConnection.setLocalDescription(offer)
      
      await sendSignalingMessage({
        type: 'offer',
        offer
      })
      
      toast.success(`Chamando ${targetUser.display_name}...`)
    } catch (error) {
      console.error('Error starting audio call:', error)
      toast.error('Erro ao iniciar chamada de áudio')
      endCall()
    }
  }
  
  const startVideoCall = async (userId: string) => {
    try {
      // Find user info
      const targetUser = onlineUsers.find(u => u.id === userId)
      if (!targetUser) {
        toast.error('Usuário não encontrado ou offline')
        return
      }
      
      setCallState(prev => ({
        ...prev,
        isInCall: true,
        callType: 'video',
        callingUser: targetUser
      }))
      
      // Get local media
      const stream = await getUserMedia('video')
      setCallState(prev => ({ ...prev, localStream: stream }))
      
      // Create peer connection and add tracks
      const peerConnection = await createPeerConnection()
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream)
      })
      
      // Create and send offer
      const offer = await peerConnection.createOffer()
      await peerConnection.setLocalDescription(offer)
      
      await sendSignalingMessage({
        type: 'offer',
        offer
      })
      
      toast.success(`Chamando ${targetUser.display_name} via vídeo...`)
    } catch (error) {
      console.error('Error starting video call:', error)
      toast.error('Erro ao iniciar chamada de vídeo')
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
