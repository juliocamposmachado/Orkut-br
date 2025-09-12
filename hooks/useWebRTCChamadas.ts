'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export interface RTCConfig {
  iceServers: RTCIceServer[];
}

export function getWebRTCConfig(): RTCConfig {
  return {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };
}

export type CallState = 
  | 'idle' 
  | 'calling' 
  | 'receiving' 
  | 'connecting' 
  | 'connected' 
  | 'disconnected' 
  | 'failed';

export type SignalingMessage = {
  type: 'offer' | 'answer' | 'ice-candidate' | 'hangup';
  payload: any;
  sender: string;
};

interface UseWebRTCProps {
  roomId: string;
  userId: string;
  isHost?: boolean;
}

export function useWebRTCChamadas({ roomId, userId, isHost = false }: UseWebRTCProps) {
  const [callState, setCallState] = useState<CallState>('idle');
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const channel = useRef<any>(null);
  const pendingIceCandidates = useRef<RTCIceCandidate[]>([]);

  /**
   * Initialize WebRTC peer connection with ICE servers
   */
  const initializePeerConnection = useCallback(() => {
    if (peerConnection.current) return peerConnection.current;

    const config = getWebRTCConfig();
    const pc = new RTCPeerConnection(config);

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && channel.current) {
        console.log('🧊 Sending ICE candidate:', event.candidate);
        channel.current.send({
          type: 'broadcast',
          event: 'ice-candidate',
          payload: {
            type: 'ice-candidate',
            payload: event.candidate,
            sender: userId,
          },
        });
      }
    };

    // Handle remote stream
    pc.ontrack = (event) => {
      console.log('📹 Received remote track:', event.streams[0]);
      setRemoteStream(event.streams[0]);
      toast.success('🎥 Conectado! Stream remoto recebido.');
    };

    // Handle connection state changes
    pc.oniceconnectionstatechange = () => {
      console.log('🔗 ICE connection state changed:', pc.iceConnectionState);
      
      switch (pc.iceConnectionState) {
        case 'connected':
        case 'completed':
          setCallState('connected');
          toast.success('✅ Chamada conectada com sucesso!');
          break;
        case 'disconnected':
          setCallState('disconnected');
          toast.info('📞 Chamada desconectada');
          break;
        case 'failed':
        case 'closed':
          setCallState('failed');
          toast.error('❌ Falha na conexão da chamada');
          cleanup();
          break;
        case 'connecting':
          setCallState('connecting');
          break;
      }
    };

    // Handle signaling state changes
    pc.onsignalingstatechange = () => {
      console.log('📡 Signaling state changed:', pc.signalingState);
    };

    peerConnection.current = pc;
    return pc;
  }, [userId]);

  /**
   * Setup Supabase Realtime channel for signaling
   */
  const setupSignalingChannel = useCallback(() => {
    if (channel.current) return;

    const supabaseChannel = supabase.channel(`orkut-room:${roomId}`, {
      config: {
        broadcast: {
          self: false, // Don't receive our own messages
        },
      },
    });

    // Handle signaling messages
    supabaseChannel.on('broadcast', { event: 'offer' }, ({ payload }: { payload: SignalingMessage }) => {
      console.log('📥 Received offer:', payload);
      if (payload.sender !== userId) {
        handleOffer(payload.payload);
      }
    });

    supabaseChannel.on('broadcast', { event: 'answer' }, ({ payload }: { payload: SignalingMessage }) => {
      console.log('📥 Received answer:', payload);
      if (payload.sender !== userId) {
        handleAnswer(payload.payload);
      }
    });

    supabaseChannel.on('broadcast', { event: 'ice-candidate' }, ({ payload }: { payload: SignalingMessage }) => {
      console.log('📥 Received ICE candidate:', payload);
      if (payload.sender !== userId) {
        handleIceCandidate(payload.payload);
      }
    });

    supabaseChannel.on('broadcast', { event: 'hangup' }, ({ payload }: { payload: SignalingMessage }) => {
      console.log('📥 Received hangup:', payload);
      if (payload.sender !== userId) {
        handleHangup();
      }
    });

    supabaseChannel.subscribe((status) => {
      console.log('📡 Orkut channel subscription status:', status);
    });

    channel.current = supabaseChannel;
  }, [roomId, userId]);

  /**
   * Get user media (camera and microphone)
   */
  const getUserMedia = useCallback(async (audio = true, video = true) => {
    try {
      console.log('🎥 Requesting user media - audio:', audio, 'video:', video);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: audio ? { 
          echoCancellation: true, 
          noiseSuppression: true,
          autoGainControl: true 
        } : false,
        video: video ? { 
          width: { ideal: 1280 }, 
          height: { ideal: 720 }, 
          facingMode: 'user' 
        } : false 
      });
      
      setLocalStream(stream);
      toast.success(`🎥 ${video ? 'Câmera e microfone' : 'Microfone'} ativados!`);
      return stream;
    } catch (err) {
      console.error('❌ Failed to get user media:', err);
      const errorMessage = err instanceof Error ? err.message : 'Falha ao acessar câmera/microfone';
      setError(errorMessage);
      toast.error(`❌ Erro: ${errorMessage}`);
      throw err;
    }
  }, []);

  /**
   * Create and send offer (caller side)
   */
  const createOffer = useCallback(async () => {
    try {
      setCallState('calling');
      setError(null);
      toast.info('📞 Iniciando chamada...');

      const pc = initializePeerConnection();
      setupSignalingChannel();

      // Get local media
      const stream = await getUserMedia(true, true);
      
      // Add tracks to peer connection
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      // Create and set local description (offer)
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });

      await pc.setLocalDescription(offer);

      // Send offer through signaling channel
      if (channel.current) {
        console.log('📤 Sending offer:', offer);
        channel.current.send({
          type: 'broadcast',
          event: 'offer',
          payload: {
            type: 'offer',
            payload: offer,
            sender: userId,
          },
        });
        toast.info('📡 Oferta de chamada enviada!');
      }
    } catch (err) {
      console.error('❌ Failed to create offer:', err);
      const errorMsg = err instanceof Error ? err.message : 'Falha ao criar chamada';
      setError(errorMsg);
      setCallState('failed');
      toast.error(`❌ ${errorMsg}`);
    }
  }, [initializePeerConnection, setupSignalingChannel, getUserMedia, userId]);

  /**
   * Handle incoming offer (receiver side)
   */
  const handleOffer = useCallback(async (offer: RTCSessionDescriptionInit) => {
    try {
      setCallState('receiving');
      setError(null);
      toast.info('📞 Chamada recebida! Conectando...');

      const pc = initializePeerConnection();
      
      // Set remote description (offer)
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      
      // Get local media
      const stream = await getUserMedia(true, true);
      
      // Add tracks to peer connection
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      // Process any pending ICE candidates
      for (const candidate of pendingIceCandidates.current) {
        try {
          await pc.addIceCandidate(candidate);
          console.log('✅ Added pending ICE candidate');
        } catch (err) {
          console.error('❌ Failed to add pending ICE candidate:', err);
        }
      }
      pendingIceCandidates.current = [];

      // Create and set local description (answer)
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      // Send answer through signaling channel
      if (channel.current) {
        console.log('📤 Sending answer:', answer);
        channel.current.send({
          type: 'broadcast',
          event: 'answer',
          payload: {
            type: 'answer',
            payload: answer,
            sender: userId,
          },
        });
      }

      setCallState('connecting');
      toast.info('📡 Respondendo chamada...');
    } catch (err) {
      console.error('❌ Failed to handle offer:', err);
      const errorMsg = err instanceof Error ? err.message : 'Falha ao responder chamada';
      setError(errorMsg);
      setCallState('failed');
      toast.error(`❌ ${errorMsg}`);
    }
  }, [initializePeerConnection, getUserMedia, userId]);

  /**
   * Handle incoming answer (caller side)
   */
  const handleAnswer = useCallback(async (answer: RTCSessionDescriptionInit) => {
    try {
      const pc = peerConnection.current;
      if (!pc) {
        console.error('❌ No peer connection when handling answer');
        return;
      }

      // Set remote description (answer)
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
      console.log('✅ Answer processed successfully');

      // Process any pending ICE candidates
      for (const candidate of pendingIceCandidates.current) {
        try {
          await pc.addIceCandidate(candidate);
          console.log('✅ Added pending ICE candidate');
        } catch (err) {
          console.error('❌ Failed to add pending ICE candidate:', err);
        }
      }
      pendingIceCandidates.current = [];

      setCallState('connecting');
      toast.info('🔄 Estabelecendo conexão...');
    } catch (err) {
      console.error('❌ Failed to handle answer:', err);
      const errorMsg = err instanceof Error ? err.message : 'Falha ao processar resposta';
      setError(errorMsg);
      setCallState('failed');
      toast.error(`❌ ${errorMsg}`);
    }
  }, []);

  /**
   * Handle incoming ICE candidate
   */
  const handleIceCandidate = useCallback(async (candidate: RTCIceCandidateInit) => {
    try {
      const pc = peerConnection.current;
      if (!pc) {
        console.error('❌ No peer connection when handling ICE candidate');
        return;
      }

      const iceCandidate = new RTCIceCandidate(candidate);

      // If we haven't set remote description yet, buffer the candidate
      if (pc.remoteDescription === null) {
        console.log('🧊 Buffering ICE candidate (no remote description yet)');
        pendingIceCandidates.current.push(iceCandidate);
        return;
      }

      await pc.addIceCandidate(iceCandidate);
      console.log('✅ ICE candidate added successfully');
    } catch (err) {
      console.error('❌ Failed to handle ICE candidate:', err);
      // ICE candidate failures are usually not fatal, so we don't set error state
    }
  }, []);

  /**
   * Handle hangup signal
   */
  const handleHangup = useCallback(() => {
    console.log('📞 Handling hangup signal');
    cleanup();
    setCallState('disconnected');
    toast.info('📞 Chamada encerrada pelo outro usuário');
  }, []);

  /**
   * Answer incoming call
   */
  const answerCall = useCallback(() => {
    console.log('✅ Answering call');
    setCallState('connecting');
    toast.info('✅ Atendendo chamada...');
  }, []);

  /**
   * Reject incoming call
   */
  const rejectCall = useCallback(() => {
    console.log('❌ Rejecting call');
    hangup();
    toast.info('❌ Chamada rejeitada');
  }, []);

  /**
   * End call and cleanup resources
   */
  const hangup = useCallback(() => {
    console.log('📞 Hanging up call');
    
    // Send hangup signal to remote peer
    if (channel.current && callState !== 'idle') {
      channel.current.send({
        type: 'broadcast',
        event: 'hangup',
        payload: {
          type: 'hangup',
          payload: null,
          sender: userId,
        },
      });
    }

    cleanup();
    setCallState('idle');
    toast.info('📞 Chamada encerrada');
  }, [callState, userId]);

  /**
   * Toggle audio mute
   */
  const toggleAudioMute = useCallback(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioMuted(!audioTrack.enabled);
        const status = audioTrack.enabled ? 'ativado' : 'desativado';
        console.log(`🎤 Audio ${status}`);
        toast.info(`🎤 Microfone ${status}`);
      }
    }
  }, [localStream]);

  /**
   * Initialize host automatically with media
   */
  const initializeHost = useCallback(async () => {
    try {
      console.log('🎙️ Host initialization - setting up media...');
      setupSignalingChannel();
      
      // Get local media for host (but don't create offer yet, just be online)
      await getUserMedia(true, true);
      
      toast.success('📷 Você está online! Aguardando participantes...');
    } catch (err) {
      console.error('❌ Failed to initialize host:', err);
      const errorMsg = err instanceof Error ? err.message : 'Falha ao inicializar transmissão';
      setError(errorMsg);
      toast.error(`❌ ${errorMsg}`);
    }
  }, [setupSignalingChannel, getUserMedia]);

  /**
   * Toggle video mute
   */
  const toggleVideoMute = useCallback(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoMuted(!videoTrack.enabled);
        const status = videoTrack.enabled ? 'ativada' : 'desativada';
        console.log(`🎥 Video ${status}`);
        toast.info(`🎥 Câmera ${status}`);
      }
    }
  }, [localStream]);

  /**
   * Cleanup all resources
   */
  const cleanup = useCallback(() => {
    console.log('🧹 Cleaning up WebRTC resources');

    // Stop local stream
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        track.stop();
        console.log('🛑 Stopped track:', track.kind);
      });
      setLocalStream(null);
    }

    // Clear remote stream
    setRemoteStream(null);

    // Close peer connection
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }

    // Unsubscribe from channel
    if (channel.current) {
      channel.current.unsubscribe();
      channel.current = null;
    }

    // Reset state
    pendingIceCandidates.current = [];
    setIsAudioMuted(false);
    setIsVideoMuted(false);
    setError(null);
  }, [localStream]);

  // Auto-initialize host when isHost=true
  useEffect(() => {
    console.log('🔍 Host Effect Debug:', {
      isHost,
      callState,
      hasLocalStream: !!localStream,
      userId
    });
    
    if (isHost && callState === 'idle' && !localStream) {
      console.log('🎯 Auto-initializing host...');
      initializeHost();
    }
  }, [isHost, callState, localStream, initializeHost, userId]);

  // Additional effect to ensure host initialization on mount
  useEffect(() => {
    if (isHost) {
      console.log('🎙️ Host detected on mount, initializing...');
      // Small delay to ensure component is fully mounted
      const timer = setTimeout(() => {
        if (!localStream && callState === 'idle') {
          initializeHost();
        }
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [isHost]); // Only depend on isHost to run once on mount

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    callState,
    localStream,
    remoteStream,
    isAudioMuted,
    isVideoMuted,
    error,
    createOffer,
    answerCall,
    rejectCall,
    hangup,
    toggleAudioMute,
    toggleVideoMute,
  };
}
