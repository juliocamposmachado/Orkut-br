'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ExternalLink, Music, Users, RefreshCw, Radio, Info, Clock, MapPin, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface RecentSong {
  title: string;
  time: string;
  isCurrent?: boolean;
}

interface RadioData {
  currentSong: string;
  serverStatus: string;
  streamStatus: string;
  listeners: number;
  recentSongs?: RecentSong[];
  lastUpdated: string;
  error?: string;
}

interface ArtistInfo {
  genre?: string;
  year?: string;
  info?: string;
}

interface EnhancedRadioWidgetProps {
  className?: string;
}

const EnhancedRadioWidget: React.FC<EnhancedRadioWidgetProps> = ({ 
  className = "" 
}) => {
  const [radioData, setRadioData] = useState<RadioData>({
    currentSong: 'Carregando...',
    serverStatus: 'Online',
    streamStatus: 'Ao Vivo',
    listeners: 0,
    lastUpdated: new Date().toISOString()
  });
  
  const [artistInfo, setArtistInfo] = useState<ArtistInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingArtistInfo, setIsLoadingArtistInfo] = useState(false);

  // Site oficial da rádio
  const radioWebsite = "https://radiotatuapefm.radiostream321.com/";

  // Função para extrair nome do artista de uma string "Artista - Música"
  const extractArtistName = (songTitle: string): string | null => {
    if (!songTitle || songTitle === 'Carregando...' || songTitle === 'Rádio Tatuapé FM') return null;
    
    // Tentar extrair no formato "Artista - Música"
    const parts = songTitle.split(' - ');
    if (parts.length >= 2) {
      return parts[0].trim();
    }
    
    // Se não tem separador, tentar usar toda a string como artista
    return songTitle.trim();
  };

  // Função para buscar informações do artista
  const fetchArtistInfo = useCallback(async (songTitle: string) => {
    const artistName = extractArtistName(songTitle);
    if (!artistName) return;

    setIsLoadingArtistInfo(true);
    try {
      console.log(`🎵 Buscando informações para artista: ${artistName}`);
      
      const response = await fetch(`/api/music-info?artist=${encodeURIComponent(artistName)}&quick=true`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const result = await response.json();
      if (result.success && result.data) {
        console.log(`✅ Informações encontradas:`, result.data);
        setArtistInfo(result.data);
      } else {
        setArtistInfo(null);
      }
    } catch (error) {
      console.error('❌ Erro ao buscar informações do artista:', error);
      setArtistInfo(null);
    } finally {
      setIsLoadingArtistInfo(false);
    }
  }, []);

  // Função para buscar dados da rádio
  const fetchData = useCallback(async () => {
    try {
      console.log('🎵 Widget: Buscando dados da rádio...');
      const response = await fetch('/api/radio-status', {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      console.log('🎵 Widget: Dados recebidos:', data);
      
      // Verificar se a música mudou para buscar novas informações
      if (data.currentSong && data.currentSong !== radioData.currentSong && data.currentSong !== 'Rádio Tatuapé FM') {
        console.log('🎵 Nova música detectada, buscando informações...');
        fetchArtistInfo(data.currentSong);
      }
      
      setRadioData(data);
    } catch (error) {
      console.error('❌ Erro ao buscar dados da rádio:', error);
      setRadioData(prev => ({
        ...prev,
        currentSong: 'Rádio Tatuapé FM - Transmissão ao Vivo',
        error: `Erro: ${error instanceof Error ? error.message : 'Desconhecido'}`
      }));
    } finally {
      setIsLoading(false);
    }
  }, [radioData.currentSong, fetchArtistInfo]);

  // Função para atualização manual
  const handleManualRefresh = async () => {
    setIsLoading(true);
    await fetchData();
  };

  // Buscar dados ao carregar o componente
  useEffect(() => {
    fetchData();
    
    // Atualiza automaticamente a cada 90 segundos
    const interval = setInterval(fetchData, 90000);
    
    return () => clearInterval(interval);
  }, []);

  // Buscar informações do artista quando a música muda
  useEffect(() => {
    if (radioData.currentSong && radioData.currentSong !== 'Carregando...' && radioData.currentSong !== 'Rádio Tatuapé FM') {
      fetchArtistInfo(radioData.currentSong);
    }
  }, [radioData.currentSong, fetchArtistInfo]);

  // Função para abrir o site da rádio
  const openRadioWebsite = () => {
    window.open(radioWebsite, '_blank', 'noopener,noreferrer');
  };

  // Formatar nome da música para exibição
  const formatSongTitle = (title: string) => {
    if (title.includes(' - ')) {
      const [artist, song] = title.split(' - ');
      return { artist: artist.trim(), song: song.trim() };
    }
    return { artist: title, song: null };
  };

  const currentSongFormatted = formatSongTitle(radioData.currentSong || 'Rádio Tatuapé FM');

  return (
    <TooltipProvider>
      <div className={`bg-white rounded-lg shadow-lg border overflow-hidden ${className}`} data-radio-player>
        {/* Header com DJ Orky */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 text-white">
          <div className="flex items-center space-x-3">
            <div className="relative w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm border-2 border-green-400/60">
              <img 
                src="/logoradiotatuapefm.png" 
                alt="Rádio Tatuapé FM" 
                className="w-8 h-8 rounded-full object-cover"
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
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg flex items-center">
                🎵 DJ Orky Informa
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-4 h-4 ml-2 opacity-75" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Informações inteligentes sobre música</p>
                  </TooltipContent>
                </Tooltip>
              </h3>
              <div className="flex items-center space-x-2 text-sm opacity-90">
                <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></span>
                <span>AO VIVO</span>
                {radioData.listeners > 0 && (
                  <>
                    <span>•</span>
                    <Users className="w-3 h-3" />
                    <span>{radioData.listeners}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Now Playing com informações enriquecidas */}
        <div className="px-4 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Music className="w-4 h-4 text-purple-500 flex-shrink-0" />
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                Tocando Agora
              </p>
            </div>
            <button
              onClick={handleManualRefresh}
              disabled={isLoading}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
              title="Atualizar informações"
            >
              <RefreshCw className={`w-3 h-3 text-gray-400 ${isLoading ? 'animate-spin' : 'hover:text-purple-500'}`} />
            </button>
          </div>

          {/* Informações da música */}
          <div className="space-y-2">
            {isLoading ? (
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ) : (
              <>
                <div>
                  <p className="font-semibold text-gray-800 text-sm leading-tight">
                    {currentSongFormatted.artist}
                  </p>
                  {currentSongFormatted.song && (
                    <p className="text-gray-600 text-sm">
                      {currentSongFormatted.song}
                    </p>
                  )}
                </div>

                {/* Informações enriquecidas do artista */}
                {artistInfo && !isLoadingArtistInfo && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {artistInfo.genre && (
                      <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">
                        {artistInfo.genre}
                      </Badge>
                    )}
                    {artistInfo.year && (
                      <Badge variant="outline" className="text-xs">
                        <Calendar className="w-3 h-3 mr-1" />
                        {artistInfo.year}
                      </Badge>
                    )}
                  </div>
                )}

                {artistInfo?.info && !isLoadingArtistInfo && (
                  <div className="bg-white rounded-lg p-3 border-l-4 border-purple-400 mt-3">
                    <p className="text-xs text-gray-600 leading-relaxed">
                      📎 {artistInfo.info}
                    </p>
                  </div>
                )}

                {isLoadingArtistInfo && (
                  <div className="flex items-center space-x-2 pt-2">
                    <div className="w-3 h-3 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin"></div>
                    <p className="text-xs text-gray-500">Buscando informações...</p>
                  </div>
                )}
              </>
            )}

            {!isLoading && radioData.lastUpdated && (
              <p className="text-xs text-gray-400 flex items-center mt-2">
                <Clock className="w-3 h-3 mr-1" />
                Atualizado: {new Date(radioData.lastUpdated).toLocaleTimeString('pt-BR')}
              </p>
            )}

            {radioData.error && (
              <p className="text-xs text-red-500 mt-2">{radioData.error}</p>
            )}
          </div>
        </div>

        {/* Recent Songs History */}
        {radioData.recentSongs && radioData.recentSongs.length > 0 && (
          <div className="px-4 py-3 bg-white">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Nossos DJs selecionaram os melhores hits para você! Não perca - Rádio Tatuapé FM no ar! 🎵📻
              </h4>
              <span className="text-xs text-gray-400">{radioData.recentSongs.length} músicas</span>
            </div>
            <div className="space-y-2">
              {radioData.recentSongs.map((song, index) => (
                <div key={index} className={`flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0 ${
                  song.isCurrent ? 'bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg px-2 -mx-2' : ''
                }`}>
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                      song.isCurrent 
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse' 
                        : 'bg-gradient-to-r from-gray-400 to-gray-500'
                    }`}>
                      <Music className="w-3 h-3 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm truncate ${
                        song.isCurrent 
                          ? 'font-semibold text-purple-800' 
                          : 'font-medium text-gray-700'
                      }`} title={song.title}>
                        {song.title}
                        {song.isCurrent && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            AO VIVO
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs font-mono ml-2 flex-shrink-0 ${
                    song.isCurrent ? 'text-purple-600 font-semibold' : 'text-gray-400'
                  }`}>
                    {song.time}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Powered by e Play Button */}
        <div className="p-4 bg-gray-50">
          <div className="text-center mb-3">
            <p className="text-xs text-gray-500 flex items-center justify-center">
              Atualizado há {!isLoading && radioData.lastUpdated ? '0' : '...'} min 
              <span className="mx-2">•</span>
              Powered by <span className="font-semibold ml-1">Gemini AI</span>
            </p>
          </div>
          
          <button
            onClick={openRadioWebsite}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
            title="Clique para ouvir no site da rádio"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
            <span>Ouvir Rádio</span>
            <ExternalLink className="w-4 h-4" />
          </button>
          
          <p className="text-xs text-gray-500 mt-2 text-center">
            Abre o player externo da rádio
          </p>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default EnhancedRadioWidget;
