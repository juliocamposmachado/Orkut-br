'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface RadioPlayerProps {
  streamUrl: string;
  title?: string;
  description?: string;
  showTitle?: boolean;
  showControls?: boolean;
  autoPlay?: boolean;
  className?: string;
}

const RadioPlayer: React.FC<RadioPlayerProps> = ({
  streamUrl,
  title = "Rádio Tatuapé FM",
  description = "Playlist Orkut - Ao Vivo",
  showTitle = true,
  showControls = true,
  autoPlay = false,
  className = ""
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = volume;
    audio.preload = 'none';

    const handleLoadStart = () => {
      setIsLoading(true);
      setError(null);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
    };

    const handlePlay = () => {
      setIsPlaying(true);
      setIsLoading(false);
    };

    const handlePause = () => {
      setIsPlaying(false);
      setIsLoading(false);
    };

    const handleError = () => {
      setError('Erro ao carregar a rádio');
      setIsLoading(false);
      setIsPlaying(false);
    };

    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('error', handleError);

    if (autoPlay) {
      handlePlayPause();
    }

    return () => {
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('error', handleError);
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const handlePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      if (isPlaying) {
        audio.pause();
      } else {
        setIsLoading(true);
        await audio.play();
      }
    } catch (err) {
      setError('Erro ao reproduzir a rádio');
      setIsLoading(false);
    }
  };

  const handleVolumeChange = (newVolume: number[]) => {
    const volumeValue = newVolume[0] / 100;
    setVolume(volumeValue);
    setIsMuted(volumeValue === 0);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  return (
    <div className={`bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg p-4 border border-purple-200 ${className}`}>
      <audio
        ref={audioRef}
        src={streamUrl}
        preload="none"
      />

      {showTitle && (
        <div className="mb-3 text-center">
          <div className="flex items-center justify-center space-x-2 mb-1">
            <Radio className="h-4 w-4 text-purple-600" />
            <h3 className="font-semibold text-gray-800 text-sm">{title}</h3>
          </div>
          <p className="text-xs text-gray-600">{description}</p>
        </div>
      )}

      {error && (
        <div className="mb-3 text-center">
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      {showControls && (
        <div className="space-y-3">
          {/* Play/Pause Button */}
          <div className="flex justify-center">
            <Button
              onClick={handlePlayPause}
              disabled={isLoading || !!error}
              className="bg-purple-500 hover:bg-purple-600 text-white rounded-full w-12 h-12 p-0"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              ) : isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5 ml-0.5" />
              )}
            </Button>
          </div>

          {/* Volume Control */}
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMute}
              className="p-1 h-6 w-6 text-purple-600"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="h-3 w-3" />
              ) : (
                <Volume2 className="h-3 w-3" />
              )}
            </Button>
            <Slider
              value={[isMuted ? 0 : volume * 100]}
              onValueChange={handleVolumeChange}
              max={100}
              step={1}
              className="flex-1"
            />
          </div>

          {/* Status */}
          <div className="text-center">
            {isLoading ? (
              <p className="text-xs text-purple-600 animate-pulse">Carregando...</p>
            ) : isPlaying ? (
              <p className="text-xs text-green-600 flex items-center justify-center space-x-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span>Ao Vivo</span>
              </p>
            ) : (
              <p className="text-xs text-gray-500">Parado</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RadioPlayer;
