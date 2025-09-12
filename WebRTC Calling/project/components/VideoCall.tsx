'use client';

import { useRef, useEffect } from 'react';
import { useWebRTC } from '@/hooks/useWebRTC';
import CallControls from './CallControls';

interface VideoCallProps {
  roomId: string;
  userId: string;
  onLeaveRoom: () => void;
}

export default function VideoCall({ roomId, userId, onLeaveRoom }: VideoCallProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const {
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
  } = useWebRTC({ roomId, userId });

  // Attach local stream to video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Attach remote stream to video element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const handleLeaveRoom = () => {
    hangup();
    onLeaveRoom();
  };

  const getCallStateMessage = () => {
    switch (callState) {
      case 'idle':
        return 'Ready to make a call';
      case 'calling':
        return 'Calling...';
      case 'receiving':
        return 'Incoming call';
      case 'connecting':
        return 'Connecting...';
      case 'connected':
        return 'Connected';
      case 'disconnected':
        return 'Call ended';
      case 'failed':
        return 'Connection failed';
      default:
        return '';
    }
  };

  const getCallStateColor = () => {
    switch (callState) {
      case 'connected':
        return 'text-green-600';
      case 'calling':
      case 'connecting':
        return 'text-yellow-600';
      case 'receiving':
        return 'text-blue-600';
      case 'failed':
        return 'text-red-600';
      case 'disconnected':
        return 'text-gray-600';
      default:
        return 'text-gray-900';
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 p-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Room: {roomId}</h1>
          <p className={`text-sm ${getCallStateColor()}`}>
            {getCallStateMessage()}
          </p>
        </div>
        <button
          onClick={handleLeaveRoom}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Leave Room
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-600 text-white p-3 text-center">
          <p>Error: {error}</p>
        </div>
      )}

      {/* Video Container */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4">
        {/* Remote Video (Main) */}
        <div className="flex-1 bg-black rounded-lg overflow-hidden relative">
          {remoteStream ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white">
              <div className="text-center">
                <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </div>
                <p className="text-lg">No remote video</p>
              </div>
            </div>
          )}
        </div>

        {/* Local Video (Picture-in-Picture) */}
        <div className="lg:w-80 lg:h-60 w-full h-48 bg-black rounded-lg overflow-hidden relative">
          {localStream ? (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform scale-x-[-1]"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 12c0 1.66 1.34 3 3 3s3-1.34 3-3-1.34-3-3-3-3 1.34-3 3zm3-8C6.48 4 2 8.48 2 14s4.48 10 10 10 10-4.48 10-10S17.52 4 12 4z"/>
                  </svg>
                </div>
                <p className="text-sm">You</p>
              </div>
            </div>
          )}
          {isVideoMuted && (
            <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Call Controls */}
      <CallControls
        callState={callState}
        isAudioMuted={isAudioMuted}
        isVideoMuted={isVideoMuted}
        onCall={createOffer}
        onAnswer={answerCall}
        onReject={rejectCall}
        onHangup={hangup}
        onToggleAudioMute={toggleAudioMute}
        onToggleVideoMute={toggleVideoMute}
      />
    </div>
  );
}