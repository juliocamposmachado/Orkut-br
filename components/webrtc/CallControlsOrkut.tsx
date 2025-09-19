'use client';

import { Button } from '@/components/ui/button';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff,
  PhoneOff,
  MessageCircle
} from 'lucide-react';

interface CallControlsOrkutProps {
  isAudioMuted: boolean;
  isVideoMuted: boolean;
  isConnected: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onHangup: () => void;
  onToggleChat: () => void;
}

export default function CallControlsOrkut({
  isAudioMuted,
  isVideoMuted,
  isConnected,
  onToggleAudio,
  onToggleVideo,
  onHangup,
  onToggleChat
}: CallControlsOrkutProps) {
  return (
    <div className="flex items-center justify-center gap-6">
      {/* Media Controls */}
      <div className="flex gap-4">
        {/* Audio Mute Toggle */}
        <Button
          onClick={onToggleAudio}
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
          onClick={onToggleVideo}
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

        {/* Chat Toggle */}
        <Button
          onClick={onToggleChat}
          className="p-4 rounded-full transition-all duration-300 shadow-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
          size="lg"
          title="Abrir Chat"
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
      </div>

      {/* Hangup Button */}
      <Button
        onClick={onHangup}
        className="px-8 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-full hover:from-red-700 hover:to-red-800 transition-all duration-300 font-semibold shadow-lg"
        size="lg"
      >
        <PhoneOff className="h-5 w-5 mr-2" />
        Encerrar
      </Button>

      {/* Connection Status */}
      <div className="flex items-center space-x-2 text-white/80">
        <div className={`w-2 h-2 rounded-full ${
          isConnected ? 'bg-green-500 animate-pulse' : 'bg-yellow-500 animate-pulse'
        }`} />
        <span className="text-sm">
          {isConnected ? 'Conectado' : 'Aguardando conexão'}
        </span>
      </div>
    </div>
  );
}
