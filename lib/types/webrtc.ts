// Tipos para WebRTC e Sistema de Chamadas
export interface WebRTCSignal {
  type: 'offer' | 'answer' | 'ice-candidate' | 'call-start' | 'call-end' | 'call-reject'
  payload?: any
  roomId: string
  senderId: string
  recipientId: string
}

export interface CallState {
  status: 'idle' | 'calling' | 'ringing' | 'connected' | 'ended'
  localStream: MediaStream | null
  remoteStream: MediaStream | null
  currentCallId: string | null
  isMuted: boolean
  isCallActive: boolean
}

export interface WebRTCConfig {
  iceServers: RTCIceServer[]
  enableAudio: boolean
  enableVideo: boolean
}

export interface CallParticipant {
  id: string
  name: string
  avatar?: string
  status: 'online' | 'offline' | 'busy'
}

export interface RTCSignalPayload {
  sdp?: RTCSessionDescriptionInit
  candidate?: RTCIceCandidate
  callId: string
  timestamp: number
}

export interface AudioCallSettings {
  microphoneEnabled: boolean
  speakerVolume: number
  noiseSuppressionEnabled: boolean
  echoCancellationEnabled: boolean
}

export interface CallLog {
  id: string
  callerId: string
  calleeId: string
  duration: number
  startTime: Date
  endTime: Date
  type: 'audio' | 'video'
  status: 'completed' | 'missed' | 'rejected'
}

// Event types for Supabase Realtime
export interface SupabaseCallEvent {
  type: 'call:offer' | 'call:answer' | 'call:ice-candidate' | 'call:end' | 'call:reject'
  payload: {
    callId: string
    from: string
    to: string
    data?: any
  }
}

// WebRTC Connection Manager State
export interface WebRTCConnectionState {
  peerConnection: RTCPeerConnection | null
  localStream: MediaStream | null
  remoteStream: MediaStream | null
  connectionState: RTCPeerConnectionState
  iceConnectionState: RTCIceConnectionState
}

export default {}
