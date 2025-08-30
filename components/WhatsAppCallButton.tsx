'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Phone, Video, ExternalLink, MessageCircle } from 'lucide-react';
import { useWhatsApp, WhatsAppConfig } from '@/hooks/useWhatsApp';

interface WhatsAppCallButtonProps {
  userId?: string;
  userConfig?: WhatsAppConfig;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
  showBoth?: boolean;
  className?: string;
  disabled?: boolean;
}

export const WhatsAppCallButton: React.FC<WhatsAppCallButtonProps> = ({
  userId,
  userConfig,
  size = 'default',
  variant = 'default',
  showBoth = false,
  className = '',
  disabled = false
}) => {
  const { validateWhatsAppLink } = useWhatsApp();

  // Se não tem configuração, não mostrar nada
  if (!userConfig?.is_enabled) {
    return null;
  }

  const hasValidVoiceLink = userConfig.voice_call_link && 
                           validateWhatsAppLink(userConfig.voice_call_link, 'voice');
  const hasValidVideoLink = userConfig.video_call_link && 
                           validateWhatsAppLink(userConfig.video_call_link, 'video');

  // Se não tem links válidos, não mostrar
  if (!hasValidVoiceLink && !hasValidVideoLink) {
    return null;
  }

  const openWhatsAppCall = (link: string, type: 'voice' | 'video') => {
    if (disabled) return;
    
    try {
      window.open(link, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Erro ao abrir WhatsApp:', error);
    }
  };

  // Se deve mostrar ambos os botões
  if (showBoth && hasValidVoiceLink && hasValidVideoLink) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Button
          size={size}
          variant={variant}
          disabled={disabled}
          onClick={() => openWhatsAppCall(userConfig.voice_call_link!, 'voice')}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <Phone className="h-4 w-4 mr-2" />
          Voz
        </Button>
        
        <Button
          size={size}
          variant={variant}
          disabled={disabled}
          onClick={() => openWhatsAppCall(userConfig.video_call_link!, 'video')}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <Video className="h-4 w-4 mr-2" />
          Vídeo
        </Button>
      </div>
    );
  }

  // Determinar qual botão mostrar (prioridade: vídeo > voz)
  const primaryLink = hasValidVideoLink ? userConfig.video_call_link! : userConfig.voice_call_link!;
  const primaryType = hasValidVideoLink ? 'video' : 'voice';
  const Icon = hasValidVideoLink ? Video : Phone;
  const label = hasValidVideoLink ? 'Chamada de Vídeo' : 'Chamada de Voz';

  return (
    <Button
      size={size}
      variant={variant}
      disabled={disabled}
      onClick={() => openWhatsAppCall(primaryLink, primaryType)}
      className={`bg-green-600 hover:bg-green-700 text-white ${className}`}
    >
      <Icon className="h-4 w-4 mr-2" />
      {label}
      <ExternalLink className="h-3 w-3 ml-2 opacity-70" />
    </Button>
  );
};

// Componente compacto para mostrar apenas ícones
interface WhatsAppCallIconsProps {
  userId?: string;
  userConfig?: WhatsAppConfig;
  size?: number;
  className?: string;
  disabled?: boolean;
}

export const WhatsAppCallIcons: React.FC<WhatsAppCallIconsProps> = ({
  userId,
  userConfig,
  size = 16,
  className = '',
  disabled = false
}) => {
  const { validateWhatsAppLink } = useWhatsApp();

  if (!userConfig?.is_enabled) {
    return null;
  }

  const hasValidVoiceLink = userConfig.voice_call_link && 
                           validateWhatsAppLink(userConfig.voice_call_link, 'voice');
  const hasValidVideoLink = userConfig.video_call_link && 
                           validateWhatsAppLink(userConfig.video_call_link, 'video');

  if (!hasValidVoiceLink && !hasValidVideoLink) {
    return null;
  }

  const openWhatsAppCall = (link: string, type: 'voice' | 'video') => {
    if (disabled) return;
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {hasValidVoiceLink && (
        <button
          onClick={() => openWhatsAppCall(userConfig.voice_call_link!, 'voice')}
          disabled={disabled}
          className="p-1 rounded-full bg-green-100 hover:bg-green-200 transition-colors disabled:opacity-50"
          title="Chamada de voz pelo WhatsApp"
        >
          <Phone size={size} className="text-green-600" />
        </button>
      )}
      
      {hasValidVideoLink && (
        <button
          onClick={() => openWhatsAppCall(userConfig.video_call_link!, 'video')}
          disabled={disabled}
          className="p-1 rounded-full bg-green-100 hover:bg-green-200 transition-colors disabled:opacity-50"
          title="Chamada de vídeo pelo WhatsApp"
        >
          <Video size={size} className="text-green-600" />
        </button>
      )}
    </div>
  );
};

// Badge para mostrar que o usuário tem WhatsApp configurado
interface WhatsAppBadgeProps {
  userConfig?: WhatsAppConfig;
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

export const WhatsAppBadge: React.FC<WhatsAppBadgeProps> = ({
  userConfig,
  size = 'default',
  className = ''
}) => {
  const { validateWhatsAppLink } = useWhatsApp();

  if (!userConfig?.is_enabled) {
    return null;
  }

  const hasValidVoiceLink = userConfig.voice_call_link && 
                           validateWhatsAppLink(userConfig.voice_call_link, 'voice');
  const hasValidVideoLink = userConfig.video_call_link && 
                           validateWhatsAppLink(userConfig.video_call_link, 'video');

  if (!hasValidVoiceLink && !hasValidVideoLink) {
    return null;
  }

  const getCallTypes = () => {
    const types = [];
    if (hasValidVoiceLink) types.push('Voz');
    if (hasValidVideoLink) types.push('Vídeo');
    return types.join(' • ');
  };

  return (
    <Badge 
      variant="secondary" 
      className={`bg-green-100 text-green-700 border-green-300 ${className}`}
    >
      <MessageCircle className="h-3 w-3 mr-1" />
      WhatsApp: {getCallTypes()}
    </Badge>
  );
};

export default WhatsAppCallButton;
