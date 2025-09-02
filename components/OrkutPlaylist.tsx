'use client';

import React from 'react';
import { OrkutCard, OrkutCardContent, OrkutCardHeader } from '@/components/ui/orkut-card';
import { Music, Play, Headphones } from 'lucide-react';

interface OrkutPlaylistProps {
  playlistId?: string;
  title?: string;
  description?: string;
  theme?: '0' | '1'; // 0 = dark, 1 = light
}

const OrkutPlaylist: React.FC<OrkutPlaylistProps> = ({
  playlistId = '2a7srdzr6N0teReSG1i7vJ',
  title = 'Playlist Orkut',
  description = 'As melhores músicas para relembrar os bons tempos',
  theme = '0'
}) => {
  return (
    <OrkutCard>
      <OrkutCardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Music className="h-4 w-4 text-purple-500" />
            <span className="font-semibold text-gray-800">{title}</span>
          </div>
          <div className="flex items-center space-x-1 text-xs text-gray-500">
            <Headphones className="h-3 w-3" />
            <span>Spotify</span>
          </div>
        </div>
      </OrkutCardHeader>
      <OrkutCardContent>
        <div className="space-y-3">
          {description && (
            <p className="text-sm text-gray-600 mb-3">{description}</p>
          )}
          
          <div className="rounded-lg overflow-hidden border border-purple-100 shadow-sm">
            <iframe
              title="Spotify Embed: Orkut Playlist"
              src={`https://open.spotify.com/embed/playlist/${playlistId}?utm_source=generator&theme=${theme}`}
              width="100%"
              height="380"
              style={{ border: 'none' }}
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
            />
          </div>
          
          <div className="flex items-center justify-center pt-2 text-xs text-gray-400">
            <Play className="h-3 w-3 mr-1" />
            <span>Clique play para ouvir no Spotify</span>
          </div>
        </div>
      </OrkutCardContent>
    </OrkutCard>
  );
};

export default OrkutPlaylist;
