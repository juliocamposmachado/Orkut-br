'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Music, Users, Radio, ExternalLink } from 'lucide-react';

interface RadioPlayerWidgetProps {
  className?: string;
}

interface PlayerState {
  isPlaying: boolean;
  isLoading: boolean;
  volume: number;
  isMuted: boolean;
  error: string | null;
}

const RadioPlayerWidget: React.FC<RadioPlayerWidgetProps> = ({ className = "" }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [state, setState] = useState<PlayerState>({
    isPlaying: false,
    isLoading: false,
    volume: 0.5,
    isMuted: false,
    error: null
  });

  const streamUrl = 'https://centova.svdns.com.br:20019/stream';
  const radioWebsite = "https://radiotatuapefm.radiostream321.com/";

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadStart = () => {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
    };

    const handleCanPlay = () => {
      setState(prev => ({ ...prev, isLoading: false }));
    };

    const handlePlay = () => {
      setState(prev => ({ ...prev, isPlaying: true, isLoading: false }));
    };

    const handlePause = () => {
      setState(prev => ({ ...prev, isPlaying: false, isLoading: false }));
    };

    const handleError = () => {
      setState(prev => ({ 
        ...prev, 
        isPlaying: false, 
        isLoading: false, 
        error: 'Erro ao conectar com a rádio' 
      }));
    };

    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('error', handleError);

    // Set initial volume
    audio.volume = state.volume;

    return () => {
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('error', handleError);
    };
  }, []);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      if (state.isPlaying) {
        audio.pause();
        audio.src = '';
      } else {
        audio.src = streamUrl;
        audio.load();
        await audio.play();
      }
    } catch (error) {
      console.error('Erro ao reproduzir:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Erro ao reproduzir. Tente novamente.',
        isPlaying: false,
        isLoading: false
      }));
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value) / 100;
    setState(prev => ({ ...prev, volume: newVolume, isMuted: newVolume === 0 }));
    
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      const newMutedState = !state.isMuted;
      setState(prev => ({ ...prev, isMuted: newMutedState }));
      audioRef.current.volume = newMutedState ? 0 : state.volume;
    }
  };

  const openRadioWebsite = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(radioWebsite, '_blank', 'noopener,noreferrer');
  };

  const getStatusText = () => {
    if (state.error) return 'Erro na conexão';
    if (state.isLoading) return 'Carregando...';
    if (state.isPlaying) return 'Reproduzindo';
    return 'Parado';
  };

  const getStatusColor = () => {
    if (state.error) return 'bg-red-500';
    if (state.isLoading) return 'bg-yellow-500';
    if (state.isPlaying) return 'bg-green-500';
    return 'bg-gray-500';
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg border overflow-hidden ${className}`}>
      {/* Hidden audio element */}
      <audio ref={audioRef} preload="none" crossOrigin="anonymous" />
      
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 text-white">
        <div className="flex items-center space-x-3">
          <div className="relative">
            {state.isPlaying && !state.isMuted ? (
              <img 
                src="https://i.gifer.com/origin/a0/a0fdfb0039405b9a8c222dd252be9565.gif" 
                alt="Radio tocando" 
                className="w-12 h-12 rounded-full object-cover shadow-lg"
              />
            ) : (
              <div className="relative w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-lg">
                <img 
                  src="/logoradiotatuapefm.png" 
                  alt="Rádio Tatuapé FM" 
                  className="w-11 h-11 rounded-full object-cover"
                  onError={(e) => {
                    // Fallback para ícone genérico caso o logo não carregue
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = target.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center" style={{ display: 'none' }}>
                  <Radio className="w-6 h-6 text-white" />
                </div>
                {state.isMuted && (
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                    <VolumeX className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg">Rádio Tatuapé FM</h3>
            <div className="flex items-center space-x-2 text-sm opacity-90">
              <span className={`w-2 h-2 rounded-full ${getStatusColor()} ${state.isPlaying ? 'animate-pulse' : ''}`}></span>
              <span>AO VIVO</span>
            </div>
          </div>
          
          {/* External Link Button */}
          <button
            onClick={openRadioWebsite}
            className="p-2 hover:bg-white/20 rounded-full transition-colors duration-200"
            title="Abrir site da rádio"
          >
            <ExternalLink className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Player Controls */}
      <div className="p-4 bg-gray-50">
        <div className="flex items-center space-x-4">
          {/* Play/Pause Button */}
          <button
            onClick={togglePlay}
            disabled={state.isLoading}
            className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white hover:from-purple-600 hover:to-pink-600 transition-all duration-200 disabled:opacity-50 shadow-lg"
            title={state.isPlaying ? 'Pausar' : 'Reproduzir'}
          >
            {state.isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
            ) : state.isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5 ml-0.5" />
            )}
          </button>

          {/* Volume Control */}
          <div className="flex-1 flex items-center space-x-3">
            <button
              onClick={toggleMute}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              title={state.isMuted ? 'Ativar som' : 'Silenciar'}
            >
              {state.isMuted || state.volume === 0 ? (
                <VolumeX className="w-5 h-5 text-gray-600" />
              ) : (
                <Volume2 className="w-5 h-5 text-gray-600" />
              )}
            </button>
            
            <input
              type="range"
              min="0"
              max="100"
              value={state.isMuted ? 0 : state.volume * 100}
              onChange={handleVolumeChange}
              className="flex-1 h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #8B5CF6 0%, #8B5CF6 ${state.isMuted ? 0 : state.volume * 100}%, #D1D5DB ${state.isMuted ? 0 : state.volume * 100}%, #D1D5DB 100%)`
              }}
            />
          </div>
        </div>

        {/* Status */}
        <div className="mt-3 text-center">
          <div className="flex items-center justify-center space-x-2 text-sm">
            <Music className="w-4 h-4 text-purple-500" />
            <span className={`font-medium ${
              state.error ? 'text-red-600' : 
              state.isPlaying ? 'text-green-600' : 'text-gray-600'
            }`}>
              {getStatusText()}
            </span>
          </div>
          {state.error && (
            <p className="text-xs text-red-500 mt-1">{state.error}</p>
          )}
        </div>
      </div>

      {/* Radio Info */}
      <div className="px-4 py-3 bg-white border-t">
        <div className="text-center">
          <h4 className="font-semibold text-gray-800 text-sm">Rádio Tatuapé FM</h4>
          <p className="text-xs text-gray-500 italic">Nitro Rádio It's Just Culture</p>
          <div className="flex items-center justify-center space-x-2 mt-2 text-xs text-gray-400">
            <span>Classic Rock</span>
            <span>•</span>
            <span>Alternative Rock</span>
            <span>•</span>
            <span>80s</span>
          </div>
        </div>
      </div>

      {/* Custom slider styles */}
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          background: #8B5CF6;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        
        .slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          background: #8B5CF6;
          border-radius: 50%;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
      `}</style>
    </div>
  );
};

export default RadioPlayerWidget;
