import React, { useState } from 'react';
import { useWebRTC } from '@/contexts/webrtc-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Phone, Video, Loader2 } from 'lucide-react';

interface CallButtonsProps {
  userId: string;
  userName: string;
  isOnline?: boolean;
  size?: 'small' | 'medium' | 'large';
  layout?: 'horizontal' | 'vertical';
  showLabels?: boolean;
}

export const CallButtons: React.FC<CallButtonsProps> = ({
  userId,
  userName,
  isOnline = true,
  size = 'medium',
  layout = 'horizontal',
  showLabels = false
}) => {
  const { startAudioCall, startVideoCall, callState } = useWebRTC();
  const isCallActive = callState.isInCall;
  const [isLoading, setIsLoading] = useState<'audio' | 'video' | null>(null);

  const handleAudioCall = async () => {
    if (isCallActive || !isOnline) return;
    
    setIsLoading('audio');
    try {
      await startAudioCall(userId);
    } catch (error) {
      console.error('Erro ao iniciar chamada de áudio:', error);
    } finally {
      setIsLoading(null);
    }
  };

  const handleVideoCall = async () => {
    if (isCallActive || !isOnline) return;
    
    setIsLoading('video');
    try {
      await startVideoCall(userId);
    } catch (error) {
      console.error('Erro ao iniciar chamada de vídeo:', error);
    } finally {
      setIsLoading(null);
    }
  };

  const isDisabled = !isOnline || isCallActive;

  // Dynamic sizing
  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-10 h-10',
    large: 'w-12 h-12'
  }

  const iconSizes = {
    small: 'h-4 w-4',
    medium: 'h-5 w-5', 
    large: 'h-6 w-6'
  }

  return (
    <div className={`flex items-center gap-2 ${
      layout === 'vertical' ? 'flex-col' : 'flex-row'
    }`}>
      {/* Audio Call Button */}
      <Button
        onClick={handleAudioCall}
        disabled={isDisabled || isLoading !== null}
        size="sm"
        className={`
          ${sizeClasses[size]} 
          rounded-full 
          transition-all duration-300 
          transform hover:scale-105 active:scale-95
          bg-gradient-to-r from-purple-500 to-purple-600 
          hover:from-purple-600 hover:to-purple-700
          disabled:from-gray-400 disabled:to-gray-500
          disabled:cursor-not-allowed disabled:transform-none
          shadow-lg hover:shadow-xl
          border-2 border-white/20
          group
        `}
        title={
          !isOnline 
            ? `${userName} está offline`
            : isCallActive 
            ? 'Chamada em andamento'
            : `Ligar para ${userName}`
        }
      >
        {isLoading === 'audio' ? (
          <Loader2 className={`${iconSizes[size]} animate-spin text-white`} />
        ) : (
          <Phone className={`${iconSizes[size]} text-white group-hover:text-purple-100`} />
        )}
      </Button>

      {/* Video Call Button */}
      <Button
        onClick={handleVideoCall}
        disabled={isDisabled || isLoading !== null}
        size="sm"
        className={`
          ${sizeClasses[size]} 
          rounded-full 
          transition-all duration-300 
          transform hover:scale-105 active:scale-95
          bg-gradient-to-r from-pink-500 to-pink-600 
          hover:from-pink-600 hover:to-pink-700
          disabled:from-gray-400 disabled:to-gray-500
          disabled:cursor-not-allowed disabled:transform-none
          shadow-lg hover:shadow-xl
          border-2 border-white/20
          group
        `}
        title={
          !isOnline 
            ? `${userName} está offline`
            : isCallActive 
            ? 'Chamada em andamento'
            : `Videochamada com ${userName}`
        }
      >
        {isLoading === 'video' ? (
          <Loader2 className={`${iconSizes[size]} animate-spin text-white`} />
        ) : (
          <Video className={`${iconSizes[size]} text-white group-hover:text-pink-100`} />
        )}
      </Button>

      {/* Labels (se habilitado) */}
      {showLabels && (
        <div className={`text-xs text-gray-600 ${
          layout === 'vertical' ? 'text-center' : 'ml-2'
        }`}>
          <div>Áudio | Vídeo</div>
        </div>
      )}

      {/* Offline Indicator */}
      {!isOnline && (
        <Badge 
          variant="secondary" 
          className="ml-2 bg-gray-100 text-gray-600 text-xs"
        >
          <div className="w-2 h-2 rounded-full bg-gray-400 mr-1" />
          Offline
        </Badge>
      )}

      {/* Call Active Indicator */}
      {isCallActive && (
        <Badge 
          variant="default" 
          className="ml-2 bg-green-100 text-green-700 text-xs animate-pulse"
        >
          <div className="w-2 h-2 rounded-full bg-green-500 mr-1" />
          Em chamada
        </Badge>
      )}
    </div>
  );
};
