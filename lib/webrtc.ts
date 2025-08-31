'use client'

import { supabase } from './supabase'

export class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null
  private localStream: MediaStream | null = null
  private remoteStream: MediaStream | null = null
  private callId: string | null = null
  private isInitiator = false

  private iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]

  constructor() {
    if (typeof window !== 'undefined') {
      this.setupSupabaseListener()
    }
  }

  async initializePeerConnection() {
    this.peerConnection = new RTCPeerConnection({
      iceServers: this.iceServers
    })

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.callId) {
        this.sendIceCandidate(event.candidate)
      }
    }

    this.peerConnection.ontrack = (event) => {
      this.remoteStream = event.streams[0]
      this.onRemoteStream?.(this.remoteStream)
    }

    this.peerConnection.onconnectionstatechange = () => {
      console.log('Connection state:', this.peerConnection?.connectionState)
      if (this.peerConnection?.connectionState === 'connected') {
        this.onConnectionEstablished?.()
      } else if (this.peerConnection?.connectionState === 'disconnected') {
        this.endCall()
      }
    }
  }

  async startCall(calleeId: string, type: 'audio' | 'video'): Promise<string> {
    try {
      this.isInitiator = true
      await this.initializePeerConnection()

      // Get local media
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === 'video'
      })

      // Add tracks to peer connection
      this.localStream.getTracks().forEach(track => {
        this.peerConnection?.addTrack(track, this.localStream!)
      })

      this.onLocalStream?.(this.localStream)

      // Create call record in Supabase
      const { data, error } = await supabase
        .from('calls')
        .insert({
          callee: calleeId,
          type,
          status: 'ringing'
        })
        .select()
        .single()

      if (error) throw error

      this.callId = data.id

      // Create and send offer
      const offer = await this.peerConnection!.createOffer()
      await this.peerConnection!.setLocalDescription(offer)

      await supabase
        .from('calls')
        .update({ sdp_offer: offer.sdp })
        .eq('id', this.callId)

      if (!this.callId) {
        throw new Error('Failed to create call ID')
      }
      return this.callId
    } catch (error) {
      console.error('Error starting call:', error)
      throw error
    }
  }

  async answerCall(callId: string): Promise<void> {
    try {
      this.callId = callId
      this.isInitiator = false
      await this.initializePeerConnection()

      // Get call data
      const { data: callData, error: callError } = await supabase
        .from('calls')
        .select('*')
        .eq('id', callId)
        .single()

      if (callError) throw callError

      // Get local media
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callData.type === 'video'
      })

      // Add tracks to peer connection
      this.localStream.getTracks().forEach(track => {
        this.peerConnection?.addTrack(track, this.localStream!)
      })

      this.onLocalStream?.(this.localStream)

      // Set remote description
      await this.peerConnection!.setRemoteDescription({
        type: 'offer',
        sdp: callData.sdp_offer
      })

      // Create answer
      const answer = await this.peerConnection!.createAnswer()
      await this.peerConnection!.setLocalDescription(answer)

      // Update call with answer
      await supabase
        .from('calls')
        .update({ 
          sdp_answer: answer.sdp,
          status: 'accepted'
        })
        .eq('id', callId)

    } catch (error) {
      console.error('Error answering call:', error)
      throw error
    }
  }

  async endCall() {
    try {
      if (this.callId) {
        await supabase
          .from('calls')
          .update({ 
            status: 'ended',
            ended_at: new Date().toISOString()
          })
          .eq('id', this.callId)
      }

      if (this.localStream) {
        this.localStream.getTracks().forEach(track => track.stop())
        this.localStream = null
      }

      if (this.peerConnection) {
        this.peerConnection.close()
        this.peerConnection = null
      }

      this.callId = null
      this.onCallEnded?.()
    } catch (error) {
      console.error('Error ending call:', error)
    }
  }

  private async sendIceCandidate(candidate: RTCIceCandidate) {
    if (!this.callId) return

    try {
      const { data: currentCall } = await supabase
        .from('calls')
        .select('ice_candidates')
        .eq('id', this.callId)
        .single()

      const candidates = currentCall?.ice_candidates || []
      candidates.push({
        candidate: candidate.candidate,
        sdpMLineIndex: candidate.sdpMLineIndex,
        sdpMid: candidate.sdpMid
      })

      await supabase
        .from('calls')
        .update({ ice_candidates: candidates })
        .eq('id', this.callId)
    } catch (error) {
      console.error('Error sending ICE candidate:', error)
    }
  }

  private setupSupabaseListener() {
    supabase
      .channel('calls')
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'calls' },
        (payload) => {
          if (payload.new.id === this.callId) {
            this.handleCallUpdate(payload.new as any)
          }
        }
      )
      .subscribe()
  }

  private async handleCallUpdate(callData: any) {
    if (!this.peerConnection) return

    try {
      // Handle answer (for caller)
      if (this.isInitiator && callData.sdp_answer && callData.status === 'accepted') {
        await this.peerConnection.setRemoteDescription({
          type: 'answer',
          sdp: callData.sdp_answer
        })
      }

      // Handle ICE candidates
      if (callData.ice_candidates) {
        for (const candidateData of callData.ice_candidates) {
          const candidate = new RTCIceCandidate(candidateData)
          await this.peerConnection.addIceCandidate(candidate)
        }
      }

      // Handle call end
      if (callData.status === 'ended') {
        this.endCall()
      }
    } catch (error) {
      console.error('Error handling call update:', error)
    }
  }

  // Event callbacks
  onLocalStream?: (stream: MediaStream) => void
  onRemoteStream?: (stream: MediaStream) => void
  onConnectionEstablished?: () => void
  onCallEnded?: () => void
}

export const webrtcService = new WebRTCService()