'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ExternalLink, Music, Users, RefreshCw } from 'lucide-react';

interface RadioWidgetProps {
  className?: string;
}

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

const RadioTatuapeWidget: React.FC<RadioWidgetProps> = ({ 
  className = "" 
}) => {
  const [radioData, setRadioData] = useState<RadioData>({
    currentSong: 'Carregando...',
    serverStatus: 'Online',
    streamStatus: 'Ao Vivo',
    listeners: 0,
    lastUpdated: new Date().toISOString()
  });
  const [isLoading, setIsLoading] = useState(true);

  // Site oficial da rádio
  const radioWebsite = "https://radiotatuapefm.radiostream321.com/";

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
      
      if (data.currentSong && data.currentSong !== 'Rádio Tatuapé FM') {
        console.log('✅ Música válida encontrada:', data.currentSong);
      } else {
        console.log('⚠️ Nenhuma música específica, usando fallback');
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
  }, []); // Remove dependency to prevent infinite loop

  // Função para atualização manual
  const handleManualRefresh = async () => {
    setIsLoading(true);
    await fetchData(); // Atualização manual
  };

  // Buscar dados ao carregar o componente
  useEffect(() => {
    fetchData(); // Busca inicial
    
    // Atualiza sincronizado com DJ Orky - intervalo otimizado
    const interval = setInterval(fetchData, 90000); // 90s (1.5min)
    
    return () => clearInterval(interval);
  }, []); // Remove fetchData dependency to prevent infinite loop

  // Função para abrir o site da rádio
  const openRadioWebsite = () => {
    window.open(radioWebsite, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg border overflow-hidden ${className}`} data-radio-player>
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 text-white">
        <div className="flex items-center space-x-3">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 w-12 h-12 rounded-full bg-black/40 shadow-lg"></div>
            <img 
              src="/logo-radio-tatuape-fm.png" 
              alt="Rádio Tatuapé FM" 
              className="relative w-12 h-12 rounded-full object-cover"
              onError={(e) => {
                console.log('Erro ao carregar logo da rádio');
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg">Rádio Tatuapé FM</h3>
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

      {/* Now Playing */}
      <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-b">
        <div className="flex items-center space-x-2">
          <Music className="w-4 h-4 text-purple-500 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                Tocando Agora
              </p>
              <button
                onClick={handleManualRefresh}
                disabled={isLoading}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
                title="Atualizar agora"
              >
                <RefreshCw className={`w-3 h-3 text-gray-400 ${isLoading ? 'animate-spin' : 'hover:text-purple-500'}`} />
              </button>
            </div>
            <p className="text-sm font-medium text-gray-800 truncate">
              {isLoading ? (
                <span className="inline-flex items-center space-x-1">
                  <span className="animate-pulse">Carregando...</span>
                </span>
              ) : (
                radioData.currentSong
              )}
            </p>
            {!isLoading && radioData.lastUpdated && (
              <p className="text-xs text-gray-400 mt-1">
                Atualizado: {new Date(radioData.lastUpdated).toLocaleTimeString('pt-BR')}
              </p>
            )}
            {radioData.error && (
              <p className="text-xs text-red-500 mt-1">{radioData.error}</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Songs History - restaurado */}
      {radioData.recentSongs && radioData.recentSongs.length > 0 && (
        <div className="px-4 py-3 bg-white">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Últimas Tocadas</h4>
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

      {/* Play Button */}
      <div className="p-4 bg-gray-50 text-center">
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
        
        <p className="text-xs text-gray-500 mt-2">
          Abre o player externo da rádio
        </p>
      </div>
    </div>
  );
};

export default RadioTatuapeWidget;
