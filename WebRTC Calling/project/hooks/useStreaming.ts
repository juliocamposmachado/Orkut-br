'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { getWebRTCConfig } from '@/lib/webrtc';

export interface StreamQuality {
  width: number;
  height: number;
  frameRate: number;
  bitrate: number;
}

export const STREAM_QUALITIES: Record<string, StreamQuality> = {
  low: { width: 640, height: 360, frameRate: 15, bitrate: 500000 },
  medium: { width: 1280, height: 720, frameRate: 30, bitrate: 1500000 },
  high: { width: 1920, height: 1080, frameRate: 30, bitrate: 3000000 },
};

export interface StreamStats {
  viewers: number;
  bitrate: number;
  fps: number;
  resolution: string;
  uptime: number;
}

export interface Viewer {
  id: string;
  name: string;
  joinedAt: Date;
  quality: keyof typeof STREAM_QUALITIES;
}

interface UseStreamingProps {
  roomId: string;
  hostId: string;
  hostName: string;
}

export function useStreaming({ roomId, hostId, hostName }: UseStreamingProps) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamQuality, setStreamQuality] = useState<keyof typeof STREAM_QUALITIES>('medium');
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [viewers, setViewers] = useState<Viewer[]>([]);
  const [streamStats, setStreamStats] = useState<StreamStats>({
    viewers: 0,
    bitrate: 0,
    fps: 0,
    resolution: '',
    uptime: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const supabase = useRef(createClient());
  const channel = useRef<any>(null);
  const statsInterval = useRef<NodeJS.Timeout | null>(null);
  const streamStartTime = useRef<Date | null>(null);

  /**
   * Setup Supabase Realtime channel for streaming signaling
   */
  const setupStreamingChannel = useCallback(() => {
    if (channel.current) return;

    const supabaseChannel = supabase.current.channel(`stream:${roomId}`, {
      config: {
        broadcast: {
          self: false,
        },
      },
    });

    // Handle viewer join requests
    supabaseChannel.on('broadcast', { event: 'viewer-join' }, async ({ payload }) => {
      const { viewerId, viewerName, quality } = payload;
      console.log('Viewer joining:', viewerId, viewerName);

      try {
        await handleViewerJoin(viewerId, viewerName, quality);
      } catch (err) {
        console.error('Failed to handle viewer join:', err);
      }
    });

    // Handle viewer leave
    supabaseChannel.on('broadcast', { event: 'viewer-leave' }, ({ payload }) => {
      const { viewerId } = payload;
      console.log('Viewer leaving:', viewerId);
      handleViewerLeave(viewerId);
    });

    // Handle ICE candidates from viewers
    supabaseChannel.on('broadcast', { event: 'viewer-ice-candidate' }, ({ payload }) => {
      const { viewerId, candidate } = payload;
      handleViewerIceCandidate(viewerId, candidate);
    });

    // Handle answers from viewers
    supabaseChannel.on('broadcast', { event: 'viewer-answer' }, ({ payload }) => {
      const { viewerId, answer } = payload;
      handleViewerAnswer(viewerId, answer);
    });

    // Handle quality change requests
    supabaseChannel.on('broadcast', { event: 'quality-change' }, ({ payload }) => {
      const { viewerId, quality } = payload;
      handleViewerQualityChange(viewerId, quality);
    });

    supabaseChannel.subscribe((status) => {
      console.log('Streaming channel subscription status:', status);
    });

    channel.current = supabaseChannel;
  }, [roomId]);

  /**
   * Get user media with specific quality settings and better error handling
   */
  const getUserMedia = useCallback(async (quality: keyof typeof STREAM_QUALITIES) => {
    try {
      // Check if browser supports getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('WebRTC não suportado neste navegador');
      }

      // Check if we're in a secure context (HTTPS or localhost)
      if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
        throw new Error('WebRTC requer HTTPS ou localhost para funcionar');
      }

      const qualitySettings = STREAM_QUALITIES[quality];
      console.log('🎥 Solicitando permissões de mídia...', { quality, settings: qualitySettings });
      
      // Start with basic constraints and progressively enhance
      let constraints: MediaStreamConstraints = {};
      
      // Audio constraints - start simple
      if (isAudioEnabled) {
        constraints.audio = {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        };
      }
      
      // Video constraints - start with basic and fallback if needed
      if (isVideoEnabled) {
        constraints.video = {
          width: { ideal: qualitySettings.width, min: 320 },
          height: { ideal: qualitySettings.height, min: 240 },
          frameRate: { ideal: qualitySettings.frameRate, min: 10 },
          facingMode: { ideal: 'user' },
        };
      }

      console.log('📋 Constraints:', constraints);
      
      let stream: MediaStream;
      
      try {
        // Try with ideal constraints first
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        console.log('✅ Mídia obtida com constraints ideais');
      } catch (idealError) {
        console.warn('⚠️ Constraints ideais falharam, tentando fallback:', idealError);
        
        // Fallback to basic constraints
        const fallbackConstraints: MediaStreamConstraints = {
          audio: isAudioEnabled ? true : false,
          video: isVideoEnabled ? {
            width: { min: 320, ideal: 640, max: 1280 },
            height: { min: 240, ideal: 480, max: 720 },
            frameRate: { min: 10, ideal: 15, max: 30 }
          } : false
        };
        
        try {
          stream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
          console.log('✅ Mídia obtida com constraints de fallback');
        } catch (fallbackError) {
          console.error('❌ Fallback também falhou:', fallbackError);
          
          // Final fallback - just audio or just video
          if (isAudioEnabled && isVideoEnabled) {
            console.log('🔄 Tentando apenas áudio...');
            try {
              stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
              console.log('✅ Obtido apenas áudio');
            } catch {
              console.log('🔄 Tentando apenas vídeo...');
              stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: true });
              console.log('✅ Obtido apenas vídeo');
            }
          } else {
            throw fallbackError;
          }
        }
      }

      // Log successful stream info
      const audioTracks = stream.getAudioTracks();
      const videoTracks = stream.getVideoTracks();
      
      console.log('🎬 Stream obtido:', {
        audio: audioTracks.length > 0,
        video: videoTracks.length > 0,
        audioTrack: audioTracks[0]?.label,
        videoTrack: videoTracks[0]?.label
      });
      
      if (videoTracks.length > 0) {
        const videoTrack = videoTracks[0];
        const settings = videoTrack.getSettings();
        console.log('📐 Configurações de vídeo reais:', settings);
      }
      
      // Configure video track bitrate if supported
      if (stream.getVideoTracks().length > 0) {
        const videoTrack = stream.getVideoTracks()[0];
        const sender = videoTrack as any;
        
        if (sender.applyConstraints) {
          await sender.applyConstraints({
            width: qualitySettings.width,
            height: qualitySettings.height,
            frameRate: qualitySettings.frameRate,
          });
        }
      }

      setLocalStream(stream);
      return stream;
    } catch (err) {
      console.error('Failed to get user media:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to access camera/microphone';
      setError(errorMessage);
      throw err;
    }
  }, [isAudioEnabled, isVideoEnabled]);

  /**
   * Handle new viewer joining the stream
   */
  const handleViewerJoin = useCallback(async (viewerId: string, viewerName: string, quality: keyof typeof STREAM_QUALITIES) => {
    try {
      if (peerConnections.current.has(viewerId)) {
        console.log('Viewer already connected:', viewerId);
        return;
      }

      const config = getWebRTCConfig();
      const pc = new RTCPeerConnection(config);

      // Add local stream tracks to peer connection
      if (localStream) {
        localStream.getTracks().forEach((track) => {
          pc.addTrack(track, localStream);
        });
      }

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && channel.current) {
          channel.current.send({
            type: 'broadcast',
            event: 'host-ice-candidate',
            payload: {
              viewerId,
              candidate: event.candidate,
            },
          });
        }
      };

      // Handle connection state changes
      pc.oniceconnectionstatechange = () => {
        console.log(`Viewer ${viewerId} ICE state:`, pc.iceConnectionState);
        
        if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
          handleViewerLeave(viewerId);
        }
      };

      peerConnections.current.set(viewerId, pc);

      // Create and send offer
      const offer = await pc.createOffer({
        offerToReceiveAudio: false,
        offerToReceiveVideo: false,
      });

      await pc.setLocalDescription(offer);

      // Send offer to viewer
      if (channel.current) {
        channel.current.send({
          type: 'broadcast',
          event: 'stream-offer',
          payload: {
            viewerId,
            offer,
          },
        });
      }

      // Add viewer to list
      const newViewer: Viewer = {
        id: viewerId,
        name: viewerName,
        joinedAt: new Date(),
        quality,
      };

      setViewers(prev => [...prev, newViewer]);
      
      console.log(`Viewer ${viewerName} (${viewerId}) joined with ${quality} quality`);
    } catch (err) {
      console.error('Failed to handle viewer join:', err);
      setError(`Failed to connect viewer: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [localStream]);

  /**
   * Handle viewer leaving the stream
   */
  const handleViewerLeave = useCallback((viewerId: string) => {
    const pc = peerConnections.current.get(viewerId);
    if (pc) {
      pc.close();
      peerConnections.current.delete(viewerId);
    }

    setViewers(prev => prev.filter(viewer => viewer.id !== viewerId));
    console.log(`Viewer ${viewerId} left`);
  }, []);

  /**
   * Handle ICE candidate from viewer
   */
  const handleViewerIceCandidate = useCallback(async (viewerId: string, candidate: RTCIceCandidateInit) => {
    const pc = peerConnections.current.get(viewerId);
    if (pc && pc.remoteDescription) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
        console.log(`Added ICE candidate for viewer ${viewerId}`);
      } catch (err) {
        console.error(`Failed to add ICE candidate for viewer ${viewerId}:`, err);
      }
    }
  }, []);

  /**
   * Handle answer from viewer
   */
  const handleViewerAnswer = useCallback(async (viewerId: string, answer: RTCSessionDescriptionInit) => {
    const pc = peerConnections.current.get(viewerId);
    if (pc) {
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        console.log(`Set remote description for viewer ${viewerId}`);
      } catch (err) {
        console.error(`Failed to set remote description for viewer ${viewerId}:`, err);
      }
    }
  }, []);

  /**
   * Handle quality change request from viewer
   */
  const handleViewerQualityChange = useCallback((viewerId: string, quality: keyof typeof STREAM_QUALITIES) => {
    setViewers(prev => prev.map(viewer => 
      viewer.id === viewerId ? { ...viewer, quality } : viewer
    ));
    console.log(`Viewer ${viewerId} changed quality to ${quality}`);
  }, []);

  /**
   * Start streaming
   */
  const startStream = useCallback(async () => {
    try {
      setError(null);
      setupStreamingChannel();

      const stream = await getUserMedia(streamQuality);
      streamStartTime.current = new Date();
      setIsStreaming(true);

      // Start stats collection
      statsInterval.current = setInterval(() => {
        if (streamStartTime.current) {
          const uptime = Math.floor((Date.now() - streamStartTime.current.getTime()) / 1000);
          const quality = STREAM_QUALITIES[streamQuality];
          
          setStreamStats({
            viewers: viewers.length,
            bitrate: quality.bitrate,
            fps: quality.frameRate,
            resolution: `${quality.width}x${quality.height}`,
            uptime,
          });
        }
      }, 1000);

      // Notify viewers that stream is starting
      if (channel.current) {
        channel.current.send({
          type: 'broadcast',
          event: 'stream-started',
          payload: {
            hostId,
            hostName,
            quality: streamQuality,
          },
        });
      }

      console.log('Stream started successfully');
    } catch (err) {
      console.error('Failed to start stream:', err);
      setError(err instanceof Error ? err.message : 'Failed to start stream');
    }
  }, [setupStreamingChannel, getUserMedia, streamQuality, hostId, hostName, viewers.length]);

  /**
   * Stop streaming
   */
  const stopStream = useCallback(() => {
    console.log('Stopping stream');

    // Close all peer connections
    peerConnections.current.forEach((pc) => {
      pc.close();
    });
    peerConnections.current.clear();

    // Stop local stream
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        track.stop();
      });
      setLocalStream(null);
    }

    // Clear stats interval
    if (statsInterval.current) {
      clearInterval(statsInterval.current);
      statsInterval.current = null;
    }

    // Notify viewers that stream ended
    if (channel.current) {
      channel.current.send({
        type: 'broadcast',
        event: 'stream-ended',
        payload: {
          hostId,
        },
      });

      channel.current.unsubscribe();
      channel.current = null;
    }

    setIsStreaming(false);
    setViewers([]);
    setStreamStats({
      viewers: 0,
      bitrate: 0,
      fps: 0,
      resolution: '',
      uptime: 0,
    });
    streamStartTime.current = null;
    setError(null);
  }, [localStream, hostId]);

  /**
   * Toggle audio
   */
  const toggleAudio = useCallback(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    } else {
      setIsAudioEnabled(!isAudioEnabled);
    }
  }, [localStream, isAudioEnabled]);

  /**
   * Toggle video
   */
  const toggleVideo = useCallback(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    } else {
      setIsVideoEnabled(!isVideoEnabled);
    }
  }, [localStream, isVideoEnabled]);

  /**
   * Change stream quality
   */
  const changeQuality = useCallback(async (quality: keyof typeof STREAM_QUALITIES) => {
    if (!isStreaming) {
      setStreamQuality(quality);
      return;
    }

    try {
      // Get new stream with new quality
      const newStream = await getUserMedia(quality);
      
      // Update all peer connections with new stream
      peerConnections.current.forEach(async (pc) => {
        // Replace tracks in existing connections
        const senders = pc.getSenders();
        const newTracks = newStream.getTracks();

        for (let i = 0; i < senders.length && i < newTracks.length; i++) {
          try {
            await senders[i].replaceTrack(newTracks[i]);
          } catch (err) {
            console.error('Failed to replace track:', err);
          }
        }
      });

      setStreamQuality(quality);
      console.log('Stream quality changed to:', quality);
    } catch (err) {
      console.error('Failed to change quality:', err);
      setError('Failed to change stream quality');
    }
  }, [isStreaming, getUserMedia]);

  /**
   * Kick viewer from stream
   */
  const kickViewer = useCallback((viewerId: string) => {
    if (channel.current) {
      channel.current.send({
        type: 'broadcast',
        event: 'viewer-kicked',
        payload: {
          viewerId,
        },
      });
    }
    handleViewerLeave(viewerId);
  }, [handleViewerLeave]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isStreaming) {
        stopStream();
      }
    };
  }, [isStreaming, stopStream]);

  return {
    isStreaming,
    streamQuality,
    isAudioEnabled,
    isVideoEnabled,
    viewers,
    streamStats,
    error,
    localStream,
    startStream,
    stopStream,
    toggleAudio,
    toggleVideo,
    changeQuality,
    kickViewer,
  };
}
