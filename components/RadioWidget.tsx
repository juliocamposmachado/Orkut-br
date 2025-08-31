'use client';

import React, { useState, useEffect } from 'react';
import { ExternalLink, Music, Users, RefreshCw, Radio, Volume2, VolumeX, ChevronDown, ChevronUp, History } from 'lucide-react';
import { useRadio } from '@/contexts/RadioContext';

interface RadioWidgetProps {
  className?: string;
}

const RadioTatuapeWidget: React.FC<RadioWidgetProps> = ({ 
  className = "" 
}) => {
  // Use the shared radio context instead of local state
  const { radioData, isLoading, setIsLoading } = useRadio();
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Função para limpar e normalizar títulos de músicas
  const cleanSongTitle = (title: string): string => {
    if (!title) return title;
    
    return title
      .normalize('NFC') // Normalizar caracteres Unicode
      .replace(/\u00e7/g, 'ç') // ç correto
      .replace(/\u00e3/g, 'ã') // ã correto
      .replace(/\u00e1/g, 'á') // á correto
      .replace(/\u00e9/g, 'é') // é correto
      .replace(/\u00ed/g, 'í') // í correto
      .replace(/\u00f3/g, 'ó') // ó correto
      .replace(/\u00fa/g, 'ú') // ú correto
      .replace(/\u00e0/g, 'à') // à correto
      .replace(/\u00ea/g, 'ê') // ê correto
      .replace(/\u00f4/g, 'ô') // ô correto
      .replace(/\u00e2/g, 'â') // â correto
      .replace(/\u00fc/g, 'ü') // ü correto
      .replace(/\u00f1/g, 'ñ') // ñ correto
      .replace(/&amp;/g, '&')    // & correto
      .replace(/&lt;/g, '<')     // < correto
      .replace(/&gt;/g, '>')     // > correto
      .replace(/&quot;/g, '"')   // " correto
      .replace(/&#39;/g, "'")    // ' correto
      .trim();
  };

  // Site oficial da rádio
  const radioWebsite = "https://radiotatuapefm.radiostream321.com/";

  // Função para atualização manual
  const handleManualRefresh = async (e: React.MouseEvent) => {
    e.stopPropagation();
    // The context will handle the data fetching
    setIsLoading(true);
  };

  // Função para abrir o site da rádio
  const openRadioWebsite = () => {
    setIsPlaying(!isPlaying);
    window.open(radioWebsite, '_blank', 'noopener,noreferrer');
  };

  // Função para alternar mute
  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
  };

  // Função para clique no card inteiro
  const handleCardClick = () => {
    openRadioWebsite();
  };

  return (
    <div 
      className={`bg-white rounded-lg shadow-lg border overflow-hidden transition-all duration-300 ${className} ${
        isExpanded ? 'min-h-auto' : 'min-h-[200px]'
      }`} 
      data-radio-player
    >
      {/* Header */}
      <div 
        className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 text-white relative cursor-pointer hover:from-purple-600 hover:to-pink-600 transition-all duration-300"
        onClick={handleCardClick}
      >
        <div className="flex items-center space-x-3">
          <div className="relative">
            {/* GIF animado quando tocando */}
            {isPlaying && !isMuted ? (
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
                {isMuted && (
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
          
          {/* Botão de Mute */}
          <button
            onClick={toggleMute}
            className="p-2 hover:bg-white/20 rounded-full transition-colors duration-200"
            title={isMuted ? 'Ativar som' : 'Silenciar'}
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5 text-white" />
            ) : (
              <Volume2 className="w-5 h-5 text-white" />
            )}
          </button>
        </div>
      </div>

      {/* Now Playing */}
      <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100">
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
                cleanSongTitle(radioData.currentSong)
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
      
      {/* Botão Expandir/Colapsar */}
      <div className="flex justify-center py-3 border-b">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="flex items-center space-x-2 px-4 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors text-sm font-medium"
        >
          <History className="w-4 h-4" />
          <span>{isExpanded ? 'Ocultar Histórico' : 'Ver Últimas Tocadas'}</span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 w-4" />
          )}
        </button>
      </div>

      {/* Recent Songs History - Expandido */}
      {isExpanded && radioData.recentSongs && radioData.recentSongs.length > 0 && (
        <div className="px-4 py-3 bg-white border-b">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Últimas Tocadas</h4>
            <span className="text-xs text-gray-400">{radioData.recentSongs.length} músicas</span>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
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
                    }`} title={cleanSongTitle(song.title)}>
                      {cleanSongTitle(song.title)}
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
          onClick={(e) => {
            e.stopPropagation();
            openRadioWebsite();
          }}
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
