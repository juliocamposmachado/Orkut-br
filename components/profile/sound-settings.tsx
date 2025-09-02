'use client'

import React, { useState, useEffect } from 'react'
import { OrkutCard, OrkutCardContent, OrkutCardHeader } from '@/components/ui/orkut-card'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Volume2, 
  VolumeX, 
  Bell, 
  MessageCircle, 
  Heart, 
  Users, 
  Cloud,
  Phone,
  Share2,
  RefreshCw,
  Play
} from 'lucide-react'
import { useSounds, type SoundType } from '@/utils/soundManager'
import { toast } from 'sonner'

const SOUND_TYPES: Array<{
  type: SoundType;
  label: string;
  icon: React.ReactNode;
  description: string;
  color: string;
}> = [
  {
    type: 'message',
    label: 'Mensagens',
    icon: <MessageCircle className="h-4 w-4" />,
    description: 'Som ao receber mensagens',
    color: 'text-pink-500'
  },
  {
    type: 'like',
    label: 'Curtidas',
    icon: <Heart className="h-4 w-4" />,
    description: 'Som ao curtir posts',
    color: 'text-red-500'
  },
  {
    type: 'comment',
    label: 'Comentários',
    icon: <MessageCircle className="h-4 w-4" />,
    description: 'Som ao comentar',
    color: 'text-blue-500'
  },
  {
    type: 'share',
    label: 'Compartilhamentos',
    icon: <Share2 className="h-4 w-4" />,
    description: 'Som ao compartilhar',
    color: 'text-purple-500'
  },
  {
    type: 'friend_online',
    label: 'Amigo Online',
    icon: <Users className="h-4 w-4" />,
    description: 'Som quando amigo fica online',
    color: 'text-green-500'
  },
  {
    type: 'notification',
    label: 'Notificações',
    icon: <Bell className="h-4 w-4" />,
    description: 'Notificações gerais',
    color: 'text-orange-500'
  },
  {
    type: 'sync_success',
    label: 'Sincronização',
    icon: <Cloud className="h-4 w-4" />,
    description: 'Som de sincronização bem-sucedida',
    color: 'text-blue-600'
  },
  {
    type: 'call_incoming',
    label: 'Chamadas',
    icon: <Phone className="h-4 w-4" />,
    description: 'Som de chamada recebida',
    color: 'text-green-600'
  },
  {
    type: 'nudge',
    label: 'Cutucadas',
    icon: <RefreshCw className="h-4 w-4" />,
    description: 'Som de cutucada do MSN',
    color: 'text-yellow-500'
  }
];

export function SoundSettings() {
  const { 
    playSound, 
    getPreferences, 
    setEnabled, 
    setVolume, 
    muteSound, 
    unmuteSound 
  } = useSounds();

  const [preferences, setPreferences] = useState(() => getPreferences());

  // Atualizar preferências quando mudarem
  useEffect(() => {
    setPreferences(getPreferences());
  }, []);

  const handleEnabledChange = (enabled: boolean) => {
    setEnabled(enabled);
    setPreferences(prev => ({ ...prev, enabled }));
    
    if (enabled) {
      toast.success('🔊 Sons ativados!');
      playSound('notification');
    } else {
      toast.info('🔇 Sons desativados');
    }
  };

  const handleVolumeChange = (volume: number[]) => {
    const newVolume = volume[0] / 100;
    setVolume(newVolume);
    setPreferences(prev => ({ ...prev, volume: newVolume }));
  };

  const handleSoundToggle = (soundType: SoundType) => {
    const isMuted = preferences.mutedSounds.includes(soundType);
    
    if (isMuted) {
      unmuteSound(soundType);
      setPreferences(prev => ({
        ...prev,
        mutedSounds: prev.mutedSounds.filter(s => s !== soundType)
      }));
      toast.success(`Som de ${SOUND_TYPES.find(s => s.type === soundType)?.label} ativado`);
    } else {
      muteSound(soundType);
      setPreferences(prev => ({
        ...prev,
        mutedSounds: [...prev.mutedSounds, soundType]
      }));
      toast.info(`Som de ${SOUND_TYPES.find(s => s.type === soundType)?.label} desativado`);
    }
  };

  const testSound = (soundType: SoundType) => {
    playSound(soundType);
  };

  return (
    <OrkutCard>
      <OrkutCardHeader>
        <div className="flex items-center space-x-3">
          {preferences.enabled ? (
            <Volume2 className="h-5 w-5 text-purple-600" />
          ) : (
            <VolumeX className="h-5 w-5 text-gray-400" />
          )}
          <div>
            <h3 className="font-medium text-gray-800">Configurações de Som</h3>
            <p className="text-sm text-gray-600">
              Personalize os sons das notificações e interações
            </p>
          </div>
        </div>
      </OrkutCardHeader>

      <OrkutCardContent className="space-y-6">
        {/* Controle Global */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Sons Ativados</Label>
              <p className="text-xs text-gray-500">
                Ativar ou desativar todos os sons do site
              </p>
            </div>
            <Switch
              checked={preferences.enabled}
              onCheckedChange={handleEnabledChange}
            />
          </div>

          {preferences.enabled && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">
                Volume Geral: {Math.round(preferences.volume * 100)}%
              </Label>
              <Slider
                value={[preferences.volume * 100]}
                onValueChange={handleVolumeChange}
                max={100}
                step={5}
                className="w-full"
              />
            </div>
          )}
        </div>

        <Separator />

        {/* Controles Individuais */}
        {preferences.enabled && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Sons Específicos</Label>
              <Badge variant="outline" className="text-xs">
                {SOUND_TYPES.length - preferences.mutedSounds.length} de {SOUND_TYPES.length} ativos
              </Badge>
            </div>

            <div className="grid gap-3">
              {SOUND_TYPES.map((sound) => {
                const isMuted = preferences.mutedSounds.includes(sound.type);
                
                return (
                  <div 
                    key={sound.type}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                      isMuted 
                        ? 'bg-gray-50 border-gray-200' 
                        : 'bg-purple-50/30 border-purple-200 hover:bg-purple-50/50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`${sound.color} ${isMuted ? 'opacity-40' : ''}`}>
                        {sound.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <Label 
                            className={`text-sm font-medium cursor-pointer ${
                              isMuted ? 'text-gray-400' : 'text-gray-800'
                            }`}
                          >
                            {sound.label}
                          </Label>
                          {isMuted && (
                            <Badge variant="secondary" className="text-xs">
                              Mudo
                            </Badge>
                          )}
                        </div>
                        <p className={`text-xs ${
                          isMuted ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {sound.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {/* Botão de teste */}
                      {!isMuted && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-purple-600 hover:bg-purple-100"
                          onClick={() => testSound(sound.type)}
                          title="Testar som"
                        >
                          <Play className="h-3 w-3" />
                        </Button>
                      )}

                      {/* Switch para ativar/desativar */}
                      <Switch
                        checked={!isMuted}
                        onCheckedChange={() => handleSoundToggle(sound.type)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Informações adicionais */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start space-x-3">
            <Bell className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-blue-800 mb-1">
                💡 Dica Nostálgica
              </p>
              <p className="text-blue-700">
                Os sons foram inspirados nos clássicos alertas do MSN Messenger! 
                Você pode testar cada som individualmente usando o botão ▶️ ao lado de cada opção.
              </p>
            </div>
          </div>
        </div>
      </OrkutCardContent>
    </OrkutCard>
  );
}
