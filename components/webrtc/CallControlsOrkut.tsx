'use client';

import { Button } from '@/components/ui/button';
import { 
  Phone, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff,
  PhoneCall,
  UserCheck
} from 'lucide-react';
import { CallState } from '@/hooks/useWebRTCChamadas';

interface CallControlsOrkutProps {
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

export default function CallControlsOrkut({
  callState,
  isAudioMuted,
  isVideoMuted,
  onCall,
  onAnswer,
  onReject,
  onHangup,
  onToggleAudioMute,
  onToggleVideoMute,
}: CallControlsOrkutProps) {
  const renderCallActions = () => {
    switch (callState) {
      case 'idle':
        return (
          <Button
            onClick={onCall}
            className="px-8 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-full hover:from-green-700 hover:to-green-800 transition-all duration-300 font-semibold shadow-lg"
            size="lg"
          >
            <PhoneCall className="h-5 w-5 mr-2" />
            Iniciar Chamada
          </Button>
        );

      case 'receiving':
        return (
          <div className="flex gap-4">
            <Button
              onClick={onAnswer}
              className="px-6 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-full hover:from-green-700 hover:to-green-800 transition-all duration-300 font-semibold shadow-lg"
              size="lg"
            >
              <Phone className="h-5 w-5 mr-2" />
              Atender
            </Button>
            <Button
              onClick={onReject}
              className="px-6 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-full hover:from-red-700 hover:to-red-800 transition-all duration-300 font-semibold shadow-lg"
              size="lg"
            >
              <PhoneOff className="h-5 w-5 mr-2" />
              Rejeitar
            </Button>
          </div>
        );

      case 'calling':
      case 'connecting':
      case 'connected':
        return (
          <Button
            onClick={onHangup}
            className="px-8 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-full hover:from-red-700 hover:to-red-800 transition-all duration-300 font-semibold shadow-lg"
            size="lg"
          >
            <PhoneOff className="h-5 w-5 mr-2" />
            Encerrar Chamada
          </Button>
        );

      case 'disconnected':
      case 'failed':
        return (
          <div className="flex gap-4">
            <Button
              onClick={onCall}
              className="px-6 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-full hover:from-green-700 hover:to-green-800 transition-all duration-300 font-semibold shadow-lg"
              size="lg"
            >
              <PhoneCall className="h-5 w-5 mr-2" />
              Tentar Novamente
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  const canUseMediaControls = ['connected', 'calling', 'connecting'].includes(callState);

  return (
    <div className="p-6 flex flex-col sm:flex-row items-center justify-center gap-6">
      {/* Media Controls */}
      {canUseMediaControls && (
        <div className="flex gap-4">
          {/* Audio Mute Toggle */}
          <Button
            onClick={onToggleAudioMute}
            className={`p-4 rounded-full transition-all duration-300 shadow-lg ${
              isAudioMuted
                ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white'
                : 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white'
            }`}
            size="lg"
            title={isAudioMuted ? 'Ativar Microfone' : 'Desativar Microfone'}
          >
            {isAudioMuted ? (
              <MicOff className="w-6 h-6" />
            ) : (
              <Mic className="w-6 h-6" />
            )}
          </Button>

          {/* Video Mute Toggle */}
          <Button
            onClick={onToggleVideoMute}
            className={`p-4 rounded-full transition-all duration-300 shadow-lg ${
              isVideoMuted
                ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white'
                : 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white'
            }`}
            size="lg"
            title={isVideoMuted ? 'Ativar Câmera' : 'Desativar Câmera'}
          >
            {isVideoMuted ? (
              <VideoOff className="w-6 h-6" />
            ) : (
              <Video className="w-6 h-6" />
            )}
          </Button>
        </div>
      )}

      {/* Call Actions */}
      <div className="flex items-center">
        {renderCallActions()}
      </div>

      {/* Connection Status Indicator */}
      {callState !== 'idle' && (
        <div className="flex items-center space-x-2 text-white/80">
          <div className={`w-2 h-2 rounded-full ${
            callState === 'connected' ? 'bg-green-500 animate-pulse' : 
            callState === 'calling' || callState === 'connecting' ? 'bg-yellow-500 animate-pulse' :
            callState === 'failed' ? 'bg-red-500' :
            'bg-gray-500'
          }`} />
          <span className="text-sm">
            {callState === 'connected' && 'Conectado'}
            {callState === 'calling' && 'Chamando...'}
            {callState === 'connecting' && 'Conectando...'}
            {callState === 'receiving' && 'Chamada recebida'}
            {callState === 'disconnected' && 'Desconectado'}
            {callState === 'failed' && 'Falha na conexão'}
          </span>
        </div>
      )}
    </div>
  );
}
