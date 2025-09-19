'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  Search, 
  Copy,
  Share2,
  X
} from 'lucide-react';
import { toast } from 'sonner';

interface UserInvitePanelProps {
  roomId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function UserInvitePanel({
  roomId,
  isOpen,
  onClose
}: UserInvitePanelProps) {
  const [link, setLink] = useState('');

  const copyRoomLink = () => {
    if (typeof window !== 'undefined') {
      const roomLink = `${window.location.origin}/chamadas/${roomId}`;
      navigator.clipboard.writeText(roomLink);
      toast.success('📋 Link da sala copiado!');
      setLink(roomLink);
    }
  };

  const shareRoom = () => {
    if (typeof window !== 'undefined') {
      const roomLink = `${window.location.origin}/chamadas/${roomId}`;
      
      if (navigator.share) {
        navigator.share({
          title: 'Orkut - Chamada de Vídeo',
          text: 'Junte-se à minha chamada de vídeo no Orkut!',
          url: roomLink,
        });
      } else {
        copyRoomLink();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-2xl border-l border-gray-200 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span className="font-semibold">Compartilhar Sala</span>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20 p-1 h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <p className="text-sm text-white/90">
          Compartilhe o link da sala para convidar outros usuários
        </p>
      </div>

      {/* Share Options */}
      <div className="flex-1 p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ID da Sala
            </label>
            <div className="flex items-center space-x-2">
              <Input
                value={roomId}
                readOnly
                className="flex-1 bg-gray-50"
              />
              <Button
                onClick={copyRoomLink}
                size="sm"
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {link && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Link da Sala
              </label>
              <div className="p-3 bg-gray-50 rounded-lg border text-sm break-all">
                {link}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3">
            <Button
              onClick={copyRoomLink}
              variant="outline"
              className="flex items-center justify-center space-x-2"
            >
              <Copy className="h-4 w-4" />
              <span>Copiar Link</span>
            </Button>
            
            <Button
              onClick={shareRoom}
              className="flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700"
            >
              <Share2 className="h-4 w-4" />
              <span>Compartilhar</span>
            </Button>
          </div>
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="text-sm font-medium text-blue-800 mb-2">
            Como convidar usuários:
          </h4>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• Copie o link da sala</li>
            <li>• Envie para seus amigos</li>
            <li>• Eles entram automaticamente na sala</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
