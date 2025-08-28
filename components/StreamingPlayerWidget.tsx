'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

interface StreamingPlayerWidgetProps {
  className?: string;
}

declare global {
  interface Window {
    mtPlayer: any;
    openRadioTable: (slug: string) => void;
    mytuner_vars: any;
  }
}

const StreamingPlayerWidget: React.FC<StreamingPlayerWidgetProps> = ({ className = "" }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Dados extraídos do código HTML original
  const radioData = {
    id: 490545,
    name: "Rádio Tatuape FM",
    slug: "radio-tatuape-fm",
    image: "https://static.mytuner.mobi/media/tvos_radios/545/radio-tatuape-fm.b636f170.jpg",
    slogan: "Nitro Rádio It's Just Culture",
    categories: "Classic Rock, Alternative Rock, 80s"
  };

  useEffect(() => {
    // Inicializar variáveis globais necessárias para o player
    if (typeof window !== 'undefined') {
      window.mytuner_vars = window.mytuner_vars || {};
      window.mytuner_vars.radio_names = [radioData.name];
      window.mytuner_vars.radio_images = [radioData.image];
      window.mytuner_vars.radio_playlists = [[{
        'cipher': 'C2cuuCNpG+1LTaU6/uWAtiaJ/KkjBRfbzY11Cs6A1eOypYEFkO6IB95fPB3Ir4soKTXkilWEphUB5Cyr1dKZbg==',
        'iv': '8a68516b31e7e2255fcc221add8745bf',
        'type': 'mp3',
        'is_https': 'false'
      }]];
      window.mytuner_vars.radio_urls = [`/${radioData.slug}`];
      window.mytuner_vars.radio_slugs = [radioData.slug];
      window.mytuner_vars.radio_ids = [radioData.id];
      window.mytuner_vars.sync = '<style>.spinner_V8m1{transform-origin:center;animation:spinner_zKoa 2s linear infinite}.spinner_V8m1 circle{stroke-linecap:round;animation:spinner_YpZS 1.5s ease-in-out infinite}@keyframes spinner_zKoa{100%{transform:rotate(360deg)}}@keyframes spinner_YpZS{0%{stroke-dasharray:0 150;stroke-dashoffset:0}47.5%{stroke-dasharray:42 150;stroke-dashoffset:-16}95%,100%{stroke-dasharray:42 150;stroke-dashoffset:-59}}</style><g class="spinner_V8m1"><circle cx="12" cy="12" r="9.5" fill="none" stroke="#000" stroke-width="3"></circle></g>';
      window.mytuner_vars.pause = '<path d="M8 19c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2s-2 .9-2 2v10c0 1.1.9 2 2 2zm6-12v10c0 1.1.9 2 2 2s2-.9 2-2V7c0-1.1-.9-2-2-2s-2 .9-2 2z"/>';
      window.mytuner_vars.play_arrow = '<path d="M8 6.82v10.36c0 .79.87 1.27 1.54.84l8.14-5.18c.62-.39.62-1.29 0-1.69L9.54 5.98C8.87 5.55 8 6.03 8 6.82z"/>';

      // Função openRadioTable simulada
      window.openRadioTable = (slug: string) => {
        handlePlayToggle();
      };

      // Carregar scripts necessários
      loadExternalScripts();
    }
  }, []);

  const loadExternalScripts = () => {
    // Script para SoundManager2
    const sm2Script = document.createElement('script');
    sm2Script.src = 'https://cdn.mytuner.mobi/static/ctr/js/sm2/soundmanager2-nodebug-jsmin.js';
    sm2Script.async = true;
    document.head.appendChild(sm2Script);

    // Script principal do player
    const playerScript = document.createElement('script');
    playerScript.src = 'https://cdn.mytuner.mobi/static/ctr/js/radio-player.min.js?2e9d2d56';
    playerScript.async = true;
    document.head.appendChild(playerScript);
  };

  const handlePlayToggle = () => {
    if (isPlaying) {
      setIsPlaying(false);
      setIsLoading(false);
      // Para o player
      if (window.mtPlayer && typeof window.mtPlayer.stop === 'function') {
        window.mtPlayer.stop();
      }
    } else {
      setIsLoading(true);
      setIsPlaying(false);
      
      // Simula carregamento e inicia o player
      setTimeout(() => {
        setIsLoading(false);
        setIsPlaying(true);
        
        // Inicia o player se disponível
        if (window.mtPlayer && typeof window.mtPlayer.play === 'function') {
          window.mtPlayer.play();
        }
      }, 1500); // Simula tempo de carregamento
    }
  };

  const getButtonIcon = () => {
    if (isLoading) {
      return (
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
      );
    } else if (isPlaying) {
      return (
        <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 19c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2s-2 .9-2 2v10c0 1.1.9 2 2 2zm6-12v10c0 1.1.9 2 2 2s2-.9 2-2V7c0-1.1-.9-2-2-2s-2 .9-2 2z"/>
        </svg>
      );
    } else {
      return (
        <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 6.82v10.36c0 .79.87 1.27 1.54.84l8.14-5.18c.62-.39.62-1.29 0-1.69L9.54 5.98C8.87 5.55 8 6.03 8 6.82z"/>
        </svg>
      );
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg border overflow-hidden ${className}`}>
      {/* Estilo similar ao original */}
      <div 
        className="radio-content-container"
        style={{
          '--mdc-theme-primary': '#455A64',
          '--mdc-theme-accent': '#CFD8DC',
          '--mdc-theme-background': '#1C313A',
          '--mdc-theme-text-primary-on-primary': '#ffffff',
          '--mdc-theme-text-secondary-on-primary': '#cccccc',
        } as React.CSSProperties}
      >
        <div className="content-column-left">
          <div id="player_table_container" className="p-4">
            
            {/* Header com título */}
            <div className="mb-4 text-center">
              <h3 className="font-bold text-lg text-gray-800 mb-1">
                {radioData.name}
              </h3>
              <p className="text-sm text-gray-600 italic mb-2">
                {radioData.slogan}
              </p>
              <p className="text-xs text-gray-500">
                {radioData.categories}
              </p>
            </div>

            {/* Player Box */}
            <div id="player_box_container" className="flex items-center justify-center space-x-4">
              
              {/* Radio Image */}
              <div id="player_image_container" className="flex-shrink-0">
                <img 
                  id="player_image"
                  src={radioData.image}
                  alt={radioData.name}
                  className="w-20 h-20 rounded-lg object-cover shadow-md cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={handlePlayToggle}
                />
              </div>

              {/* Play/Pause Button */}
              <div id="play_pause_container" className="flex-shrink-0">
                <button
                  id="play_pause_button"
                  className="w-14 h-14 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-full flex items-center justify-center shadow-lg transition-all duration-200 transform hover:scale-105"
                  onClick={handlePlayToggle}
                  aria-label={isPlaying ? "Pause" : "Play"}
                  disabled={isLoading}
                >
                  {getButtonIcon()}
                </button>
              </div>
            </div>

            {/* Status */}
            <div className="mt-4 text-center">
              <div className="flex items-center justify-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  isLoading ? 'bg-yellow-500 animate-pulse' : 
                  isPlaying ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                }`}></div>
                <span className="text-sm font-medium text-gray-700">
                  {isLoading ? 'Carregando...' : isPlaying ? 'AO VIVO' : 'Clique para ouvir'}
                </span>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* CSS Styles embutido */}
      <style jsx>{`
        #player_table_container {
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
        }
        
        #player_image {
          transition: transform 0.2s ease;
        }
        
        #player_image:hover {
          transform: scale(1.05);
        }
        
        .radio-content-container {
          font-family: "Roboto", "Helvetica", "Arial", sans-serif;
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
};

export default StreamingPlayerWidget;
