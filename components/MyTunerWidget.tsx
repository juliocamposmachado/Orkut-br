'use client';

import React, { useState, useEffect } from 'react';
import { ExternalLink, Music, Users } from 'lucide-react';

interface RadioWidgetProps {
  className?: string;
}

interface RadioData {
  currentSong: string;
  serverStatus: string;
  streamStatus: string;
  listeners: number;
  lastUpdated: string;
  error?: string;
}

const RadioWidget: React.FC<RadioWidgetProps> = ({ 
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
  const fetchRadioData = async () => {
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
      
      // Verificar se realmente temos uma música válida
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
  };

  // Buscar dados ao carregar o componente
  useEffect(() => {
    fetchRadioData();
    
    // Atualizar dados a cada 30 segundos
    const interval = setInterval(fetchRadioData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Função para abrir o site da rádio
  const openRadioWebsite = () => {
    window.open(radioWebsite, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg border overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 text-white">
        <div className="flex items-center space-x-3">
          <img 
            src="https://static2.mytuner.mobi/media/tvos_radios/545/radio-tatuape-fm.b636f170.jpg" 
            alt="Rádio Tatuapé FM" 
            className="w-12 h-12 rounded-lg object-cover shadow-lg"
          />
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
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">
              Tocando Agora
            </p>
            <p className="text-sm font-medium text-gray-800 truncate">
              {isLoading ? (
                <span className="inline-flex items-center space-x-1">
                  <span className="animate-pulse">Carregando...</span>
                </span>
              ) : (
                radioData.currentSong
              )}
            </p>
            {radioData.error && (
              <p className="text-xs text-red-500 mt-1">{radioData.error}</p>
            )}
          </div>
        </div>
      </div>

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

export default RadioWidget;
