/**
 * WebRTC Configuration and Utilities
 * Handles ICE servers configuration including STUN and TURN servers
 */

export interface RTCConfig {
  iceServers: RTCIceServer[];
}

export function getWebRTCConfig(): RTCConfig {
  const config: RTCConfig = {
    iceServers: [
      // Google's public STUN server (default)
      { urls: 'stun:stun.l.google.com:19302' },
    ],
  };

  // Add TURN server if configured via environment variables
  const turnUrl = process.env.NEXT_PUBLIC_TURN_URL;
  const turnUser = process.env.NEXT_PUBLIC_TURN_USER;
  const turnPass = process.env.NEXT_PUBLIC_TURN_PASS;

  if (turnUrl && turnUser && turnPass) {
    config.iceServers.push({
      urls: turnUrl,
      username: turnUser,
      credential: turnPass,
    });
    console.log('TURN server configured:', turnUrl);
  } else {
    console.warn('TURN server not configured. Using STUN only. Configure TURN for production.');
  }

  return config;
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