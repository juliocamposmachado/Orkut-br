'use client';

import React from 'react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import OrkutPlaylist from '@/components/OrkutPlaylist';
import RadioPlayer from '@/components/RadioPlayer';
import { OrkutCard, OrkutCardContent, OrkutCardHeader } from '@/components/ui/orkut-card';
import { Button } from '@/components/ui/button';
import { Music, Plus, TrendingUp, Heart, Clock, Radio } from 'lucide-react';

// Lista de playlists populares do Orkut
const orkutPlaylists = [
  {
    id: '2a7srdzr6N0teReSG1i7vJ',
    title: 'Playlist Orkut - Rádio Tatuapé FM',
    description: 'As músicas que marcaram época no Orkut',
    category: 'Nostalgia'
  },
  {
    id: '37i9dQZF1DX0XUsuxWHRQd', // Rock classics
    title: 'Rock Clássico',
    description: 'Os maiores hits do rock que tocavam no Orkut',
    category: 'Rock'
  },
  {
    id: '37i9dQZF1DWXRqgorJj26U', // Pop 2000s
    title: 'Pop dos Anos 2000',
    description: 'Pop internacional que dominava as playlists',
    category: 'Pop'
  },
  {
    id: '37i9dQZF1DWYmmr74INQlb', // Brazilian hits
    title: 'Hits Brasileiros',
    description: 'Os sucessos nacionais da era Orkut',
    category: 'Nacional'
  }
];

const PlaylistsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Music className="h-8 w-8 text-purple-500 mr-3" />
            <h1 className="text-4xl font-bold text-gray-800">Playlists do Orkut</h1>
          </div>
          <p className="text-lg text-gray-600 mb-6">
            Reviva a nostalgia musical dos anos 2000 com nossas playlists especiais
          </p>
          <Button className="bg-purple-500 hover:bg-purple-600 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Criar Nova Playlist
          </Button>
        </div>

        {/* Radio Live Player */}
        <div className="mb-8">
          <OrkutCard>
            <OrkutCardHeader>
              <div className="flex items-center space-x-2">
                <Radio className="h-5 w-5 text-purple-500" />
                <h2 className="text-xl font-semibold text-gray-800">Rádio Tatuapé FM - Ao Vivo</h2>
                <span className="px-2 py-1 bg-red-100 text-red-600 text-xs font-medium rounded-full animate-pulse">
                  • LIVE
                </span>
              </div>
            </OrkutCardHeader>
            <OrkutCardContent>
              <div className="max-w-md mx-auto">
                <p className="text-center text-gray-600 mb-4">
                  Ouça agora a trilha sonora oficial do Orkut direto da Rádio Tatuapé FM!
                </p>
                <RadioPlayer
                  streamUrl="http://82.145.41.50/stream.mp3?ipport=82.145.41.50_16784"
                  title="Rádio Tatuapé FM"
                  description="Playlist Orkut - Ao Vivo"
                  showTitle={false}
                  showControls={true}
                />
              </div>
            </OrkutCardContent>
          </OrkutCard>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <OrkutCard>
            <OrkutCardContent>
              <div className="flex items-center space-x-3 p-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-purple-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">Em Alta</h3>
                  <p className="text-sm text-gray-600">12 playlists populares</p>
                </div>
              </div>
            </OrkutCardContent>
          </OrkutCard>

          <OrkutCard>
            <OrkutCardContent>
              <div className="flex items-center space-x-3 p-4">
                <div className="p-2 bg-pink-100 rounded-lg">
                  <Heart className="h-6 w-6 text-pink-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">Favoritas</h3>
                  <p className="text-sm text-gray-600">5 playlists salvas</p>
                </div>
              </div>
            </OrkutCardContent>
          </OrkutCard>

          <OrkutCard>
            <OrkutCardContent>
              <div className="flex items-center space-x-3 p-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Clock className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">Recentes</h3>
                  <p className="text-sm text-gray-600">3 ouvidas hoje</p>
                </div>
              </div>
            </OrkutCardContent>
          </OrkutCard>
        </div>

        {/* Playlists Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {orkutPlaylists.map((playlist, index) => (
            <div key={playlist.id}>
              <OrkutPlaylist
                playlistId={playlist.id}
                title={playlist.title}
                description={playlist.description}
                theme={index % 2 === 0 ? '0' : '1'}
              />
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="mt-12 text-center">
          <OrkutCard>
            <OrkutCardContent>
              <div className="py-8">
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                  Não encontrou a playlist perfeita?
                </h3>
                <p className="text-gray-600 mb-6">
                  Conecte sua conta do Spotify e crie suas próprias playlists personalizadas
                </p>
                <div className="flex gap-4 justify-center">
                  <Button variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-50">
                    Conectar Spotify
                  </Button>
                  <Button className="bg-purple-500 hover:bg-purple-600 text-white">
                    Explorar Mais Músicas
                  </Button>
                </div>
              </div>
            </OrkutCardContent>
          </OrkutCard>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default PlaylistsPage;
