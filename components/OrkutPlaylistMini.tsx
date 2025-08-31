'use client';

import React from 'react';
import { OrkutCard, OrkutCardContent, OrkutCardHeader } from '@/components/ui/orkut-card';
import { Button } from '@/components/ui/button';
import { Radio, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import RadioPlayer from '@/components/RadioPlayer';

interface OrkutPlaylistMiniProps {
  streamUrl?: string;
  title?: string;
  description?: string;
  showHeader?: boolean;
}

const OrkutPlaylistMini: React.FC<OrkutPlaylistMiniProps> = ({
  streamUrl = 'http://82.145.41.50/stream.mp3?ipport=82.145.41.50_16784',
  title = 'Rádio Tatuapé FM',
  description = 'Playlist Orkut - Ao Vivo',
  showHeader = true
}) => {
  return (
    <OrkutCard>
      {showHeader && (
        <OrkutCardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Radio className="h-4 w-4 text-purple-500" />
              <span className="font-semibold text-gray-800 text-sm">Rádio</span>
            </div>
            <Link href="/playlists">
              <Button variant="ghost" size="sm" className="text-purple-600 hover:bg-purple-50 p-1">
                <ExternalLink className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        </OrkutCardHeader>
      )}
      <OrkutCardContent>
        <div className="space-y-3">
          <RadioPlayer
            streamUrl={streamUrl}
            title={title}
            description={description}
            showTitle={true}
            showControls={true}
            className=""
          />
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-sm text-gray-800">{title}</h4>
              <p className="text-xs text-gray-600">{description}</p>
            </div>
            <Link href="/playlists">
              <Button 
                size="sm" 
                variant="outline" 
                className="text-xs border-purple-300 text-purple-700 hover:bg-purple-50"
              >
                Ver Mais
              </Button>
            </Link>
          </div>
        </div>
      </OrkutCardContent>
    </OrkutCard>
  );
};

export default OrkutPlaylistMini;
