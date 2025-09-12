'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { getWebRTCConfig } from '@/lib/webrtc';
import { STREAM_QUALITIES } from './useStreaming';

// Re-export STREAM_QUALITIES for convenience
export { STREAM_QUALITIES } from './useStreaming';

export interface StreamInfo {
  hostId: string;
  hostName: string;
  quality: keyof typeof STREAM_QUALITIES;
  isLive: boolean;
}

export interface ViewerStats {
  bitrate: number;
  fps: number;
  resolution: string;
  bufferHealth: number;
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor' | 'disconnected';
}

interface UseStreamViewerProps {
  roomId: string;
  viewerId: string;
  viewerName: string;
  preferredQuality?: keyof typeof STREAM_QUALITIES;
}

export function useStreamViewer({ 
  roomId, 
  viewerId, 
  viewerName, 
  preferredQuality = 'medium' 
}: UseStreamViewerProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [streamInfo, setStreamInfo] = useState<StreamInfo | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [currentQuality, setCurrentQuality] = useState<keyof typeof STREAM_QUALITIES>(preferredQuality);
  const [volume, setVolume] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [viewerStats, setViewerStats] = useState<ViewerStats>({
    bitrate: 0,
    fps: 0,
    resolution: '',
    bufferHealth: 100,
    connectionQuality: 'disconnected',
  });
  const [error, setError] = useState<string | null>(null);
  const [isKicked, setIsKicked] = useState(false);

  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const supabase = useRef(createClient());
  const channel = useRef<any>(null);
  const statsInterval = useRef<NodeJS.Timeout | null>(null);
  const pendingIceCandidates = useRef<RTCIceCandidate[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  /**
   * Setup Supabase Realtime channel for receiving stream
   */
  const setupViewerChannel = useCallback(() => {
    if (channel.current) return;

    const supabaseChannel = supabase.current.channel(`stream:${roomId}`, {
      config: {
        broadcast: {
          self: false,
        },
      },
    });

    // Handle stream started notification
    supabaseChannel.on('broadcast', { event: 'stream-started' }, ({ payload }) => {
      const { hostId, hostName, quality } = payload;
      console.log('Stream started by host:', hostName);
      
      setStreamInfo({
        hostId,
        hostName,
        quality,
        isLive: true,
      });
    });

    // Handle stream ended notification
    supabaseChannel.on('broadcast', { event: 'stream-ended' }, ({ payload }) => {
      const { hostId } = payload;
      console.log('Stream ended by host:', hostId);
      
      handleStreamEnded();
    });

    // Handle offer from host
    supabaseChannel.on('broadcast', { event: 'stream-offer' }, ({ payload }) => {
      const { viewerId: targetViewerId, offer } = payload;
      if (targetViewerId === viewerId) {
        console.log('Received stream offer');
        handleStreamOffer(offer);
      }
    });

    // Handle ICE candidates from host
    supabaseChannel.on('broadcast', { event: 'host-ice-candidate' }, ({ payload }) => {
      const { viewerId: targetViewerId, candidate } = payload;
      if (targetViewerId === viewerId) {
        console.log('Received ICE candidate from host');
        handleHostIceCandidate(candidate);
      }
    });

    // Handle being kicked
    supabaseChannel.on('broadcast', { event: 'viewer-kicked' }, ({ payload }) => {
      const { viewerId: targetViewerId } = payload;
      if (targetViewerId === viewerId) {
        console.log('Kicked from stream');
        setIsKicked(true);
        disconnect();
      }
    });

    supabaseChannel.subscribe((status) => {
      console.log('Viewer channel subscription status:', status);
    });

    channel.current = supabaseChannel;
  }, [roomId, viewerId]);

  /**
   * Initialize peer connection for receiving stream
   */
  const initializePeerConnection = useCallback(() => {
    if (peerConnection.current) return peerConnection.current;

    const config = getWebRTCConfig();
    const pc = new RTCPeerConnection(config);

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && channel.current) {
        console.log('Sending ICE candidate to host');
        channel.current.send({
          type: 'broadcast',
          event: 'viewer-ice-candidate',
          payload: {
            viewerId,
            candidate: event.candidate,
          },
        });
      }
    };

    // Handle remote stream
    pc.ontrack = (event) => {
      console.log('Received remote stream from host');
      const [stream] = event.streams;
      setRemoteStream(stream);
      
      // Set up audio element if audio track exists
      if (stream.getAudioTracks().length > 0) {
        if (!audioRef.current) {
          audioRef.current = new Audio();
        }
        audioRef.current.srcObject = stream;
        audioRef.current.volume = volume;
        audioRef.current.muted = isMuted;
      }
    };

    // Handle connection state changes
    pc.oniceconnectionstatechange = () => {
      console.log('ICE connection state:', pc.iceConnectionState);
      
      switch (pc.iceConnectionState) {
        case 'connected':
        case 'completed':
          setIsConnected(true);
          setIsConnecting(false);
          setError(null);
          startStatsCollection();
          break;
        case 'disconnected':
          setIsConnected(false);
          updateConnectionQuality('poor');
          break;
        case 'failed':
        case 'closed':
          setIsConnected(false);
          setIsConnecting(false);
          updateConnectionQuality('disconnected');
          handleConnectionFailed();
          break;
        case 'checking':
          setIsConnecting(true);
          updateConnectionQuality('fair');
          break;
      }
    };

    // Handle signaling state changes
    pc.onsignalingstatechange = () => {
      console.log('Signaling state:', pc.signalingState);
    };

    peerConnection.current = pc;
    return pc;
  }, [viewerId, volume, isMuted]);

  /**
   * Join stream as viewer
   */
  const joinStream = useCallback(async () => {
    try {
      setError(null);
      setIsKicked(false);
      setIsConnecting(true);

      setupViewerChannel();
      initializePeerConnection();

      // Request to join stream
      if (channel.current) {
        console.log('Requesting to join stream');
        channel.current.send({
          type: 'broadcast',
          event: 'viewer-join',
          payload: {
            viewerId,
            viewerName,
            quality: currentQuality,
          },
        });
      }
    } catch (err) {
      console.error('Failed to join stream:', err);
      setError(err instanceof Error ? err.message : 'Failed to join stream');
      setIsConnecting(false);
    }
  }, [setupViewerChannel, initializePeerConnection, viewerId, viewerName, currentQuality]);

  /**
   * Handle stream offer from host
   */
  const handleStreamOffer = useCallback(async (offer: RTCSessionDescriptionInit) => {
    try {
      const pc = peerConnection.current;
      if (!pc) {
        console.error('No peer connection when handling offer');
        return;
      }

      // Set remote description
      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      // Process pending ICE candidates
      for (const candidate of pendingIceCandidates.current) {
        try {
          await pc.addIceCandidate(candidate);
          console.log('Added pending ICE candidate');
        } catch (err) {
          console.error('Failed to add pending ICE candidate:', err);
        }
      }
      pendingIceCandidates.current = [];

      // Create and send answer
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      if (channel.current) {
        console.log('Sending answer to host');
        channel.current.send({
          type: 'broadcast',
          event: 'viewer-answer',
          payload: {
            viewerId,
            answer,
          },
        });
      }
    } catch (err) {
      console.error('Failed to handle stream offer:', err);
      setError('Failed to process stream offer');
      setIsConnecting(false);
    }
  }, [viewerId]);

  /**
   * Handle ICE candidate from host
   */
  const handleHostIceCandidate = useCallback(async (candidate: RTCIceCandidateInit) => {
    try {
      const pc = peerConnection.current;
      if (!pc) {
        console.error('No peer connection when handling ICE candidate');
        return;
      }

      const iceCandidate = new RTCIceCandidate(candidate);

      // If remote description isn't set yet, buffer the candidate
      if (pc.remoteDescription === null) {
        console.log('Buffering ICE candidate (no remote description yet)');
        pendingIceCandidates.current.push(iceCandidate);
        return;
      }

      await pc.addIceCandidate(iceCandidate);
      console.log('Added ICE candidate from host');
    } catch (err) {
      console.error('Failed to handle ICE candidate:', err);
    }
  }, []);

  /**
   * Handle stream ended by host
   */
  const handleStreamEnded = useCallback(() => {
    setStreamInfo(prev => prev ? { ...prev, isLive: false } : null);
    setIsConnected(false);
    setIsConnecting(false);
    setRemoteStream(null);
    
    if (audioRef.current) {
      audioRef.current.srcObject = null;
    }

    stopStatsCollection();
    updateConnectionQuality('disconnected');
  }, []);

  /**
   * Handle connection failed
   */
  const handleConnectionFailed = useCallback(() => {
    setError('Connection to stream failed');
    cleanup();
  }, []);

  /**
   * Start collecting connection statistics
   */
  const startStatsCollection = useCallback(() => {
    if (statsInterval.current) return;

    statsInterval.current = setInterval(async () => {
      const pc = peerConnection.current;
      if (!pc) return;

      try {
        const stats = await pc.getStats();
        let bitrate = 0;
        let fps = 0;
        let resolution = '';
        let connectionQuality: ViewerStats['connectionQuality'] = 'excellent';

        stats.forEach((report) => {
          if (report.type === 'inbound-rtp' && report.kind === 'video') {
            bitrate = Math.round((report.bytesReceived * 8) / 1000); // kbps
            fps = report.framesPerSecond || 0;
            
            if (report.frameWidth && report.frameHeight) {
              resolution = `${report.frameWidth}x${report.frameHeight}`;
            }

            // Determine connection quality based on bitrate and packet loss
            const packetLossRate = report.packetsLost / (report.packetsLost + report.packetsReceived) || 0;
            
            if (packetLossRate > 0.05) {
              connectionQuality = 'poor';
            } else if (packetLossRate > 0.02) {
              connectionQuality = 'fair';
            } else if (bitrate < 500) {
              connectionQuality = 'fair';
            } else if (bitrate < 1000) {
              connectionQuality = 'good';
            } else {
              connectionQuality = 'excellent';
            }
          }
        });

        setViewerStats({
          bitrate,
          fps,
          resolution: resolution || `${STREAM_QUALITIES[currentQuality].width}x${STREAM_QUALITIES[currentQuality].height}`,
          bufferHealth: 100, // Simplified buffer health
          connectionQuality,
        });
      } catch (err) {
        console.error('Failed to get stats:', err);
      }
    }, 1000);
  }, [currentQuality]);

  /**
   * Stop collecting statistics
   */
  const stopStatsCollection = useCallback(() => {
    if (statsInterval.current) {
      clearInterval(statsInterval.current);
      statsInterval.current = null;
    }
  }, []);

  /**
   * Update connection quality
   */
  const updateConnectionQuality = useCallback((quality: ViewerStats['connectionQuality']) => {
    setViewerStats(prev => ({ ...prev, connectionQuality: quality }));
  }, []);

  /**
   * Disconnect from stream
   */
  const disconnect = useCallback(() => {
    console.log('Disconnecting from stream');

    // Notify host that we're leaving
    if (channel.current && isConnected) {
      channel.current.send({
        type: 'broadcast',
        event: 'viewer-leave',
        payload: {
          viewerId,
        },
      });
    }

    cleanup();
  }, [isConnected, viewerId]);

  /**
   * Change video quality
   */
  const changeQuality = useCallback((quality: keyof typeof STREAM_QUALITIES) => {
    setCurrentQuality(quality);
    
    if (channel.current && isConnected) {
      channel.current.send({
        type: 'broadcast',
        event: 'quality-change',
        payload: {
          viewerId,
          quality,
        },
      });
    }
  }, [isConnected, viewerId]);

  /**
   * Set volume
   */
  const setStreamVolume = useCallback((newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolume(clampedVolume);
    
    if (audioRef.current) {
      audioRef.current.volume = clampedVolume;
    }
  }, []);

  /**
   * Toggle mute
   */
  const toggleMute = useCallback(() => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    
    if (audioRef.current) {
      audioRef.current.muted = newMuted;
    }
  }, [isMuted]);

  /**
   * Clean up all resources
   */
  const cleanup = useCallback(() => {
    console.log('Cleaning up viewer resources');

    // Close peer connection
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }

    // Clear audio
    if (audioRef.current) {
      audioRef.current.srcObject = null;
      audioRef.current = null;
    }

    // Unsubscribe from channel
    if (channel.current) {
      channel.current.unsubscribe();
      channel.current = null;
    }

    // Stop stats collection
    stopStatsCollection();

    // Reset state
    setIsConnected(false);
    setIsConnecting(false);
    setRemoteStream(null);
    setError(null);
    pendingIceCandidates.current = [];
    
    setViewerStats({
      bitrate: 0,
      fps: 0,
      resolution: '',
      bufferHealth: 100,
      connectionQuality: 'disconnected',
    });
  }, [stopStatsCollection]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    isConnected,
    isConnecting,
    streamInfo,
    remoteStream,
    currentQuality,
    volume,
    isMuted,
    viewerStats,
    error,
    isKicked,
    joinStream,
    disconnect,
    changeQuality,
    setVolume: setStreamVolume,
    toggleMute,
  };
}
