'use client';

import { CallState } from '@/lib/webrtc';

interface CallControlsProps {
  callState: CallState;
  isAudioMuted: boolean;
  isVideoMuted: boolean;
  onCall: () => void;
  onAnswer: () => void;
  onReject: () => void;
  onHangup: () => void;
  onToggleAudioMute: () => void;
  onToggleVideoMute: () => void;
}

export default function CallControls({
  callState,
  isAudioMuted,
  isVideoMuted,
  onCall,
  onAnswer,
  onReject,
  onHangup,
  onToggleAudioMute,
  onToggleVideoMute,
}: CallControlsProps) {
  const renderCallActions = () => {
    switch (callState) {
      case 'idle':
        return (
          <button
            onClick={onCall}
            className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            📞 Start Call
          </button>
        );

      case 'receiving':
        return (
          <div className="flex gap-4">
            <button
              onClick={onAnswer}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              📞 Answer
            </button>
            <button
              onClick={onReject}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              ❌ Reject
            </button>
          </div>
        );

      case 'calling':
      case 'connecting':
      case 'connected':
        return (
          <button
            onClick={onHangup}
            className="px-8 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            📞 Hang Up
          </button>
        );

      case 'disconnected':
      case 'failed':
        return (
          <div className="flex gap-4">
            <button
              onClick={onCall}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              📞 Call Again
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  const canUseMediaControls = ['connected', 'calling', 'connecting'].includes(callState);

  return (
    <div className="bg-gray-800 p-6 flex flex-col sm:flex-row items-center justify-center gap-4">
      {/* Media Controls */}
      {canUseMediaControls && (
        <div className="flex gap-3">
          {/* Audio Mute Toggle */}
          <button
            onClick={onToggleAudioMute}
            className={`p-3 rounded-full transition-colors ${
              isAudioMuted
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-gray-600 hover:bg-gray-700'
            }`}
            title={isAudioMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isAudioMuted ? (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            )}
          </button>

          {/* Video Mute Toggle */}
          <button
            onClick={onToggleVideoMute}
            className={`p-3 rounded-full transition-colors ${
              isVideoMuted
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-gray-600 hover:bg-gray-700'
            }`}
            title={isVideoMuted ? 'Turn On Video' : 'Turn Off Video'}
          >
            {isVideoMuted ? (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
        </div>
      )}

      {/* Call Actions */}
      {renderCallActions()}
    </div>
  );
}