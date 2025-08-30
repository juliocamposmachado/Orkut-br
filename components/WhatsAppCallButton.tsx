'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Phone, Video, ExternalLink, MessageCircle, MessageSquare, Users } from 'lucide-react';

interface WhatsAppConfig {
  id?: string;
  user_id: string;
  is_enabled: boolean;
  allow_calls: boolean;
  voice_call_link?: string;
  video_call_link?: string;
  whatsapp_phone?: string;
  whatsapp_groups?: Array<{ name: string; link: string }>;
  created_at?: string;
  updated_at?: string;
}

interface WhatsAppCallButtonProps {
  userId?: string;
  userConfig?: WhatsAppConfig;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
  showBoth?: boolean;
  className?: string;
  disabled?: boolean;
}

const validateWhatsAppLink = (link: string, type: 'voice' | 'video' | 'group'): boolean => {
  if (!link) return false;
  if (type === 'voice') return /^https:\/\/call\.whatsapp\.com\/voice\/[A-Za-z0-9_-]+$/.test(link);
  if (type === 'video') return /^https:\/\/call\.whatsapp\.com\/video\/[A-Za-z0-9_-]+$/.test(link);
  if (type === 'group') return /^https:\/\/chat\.whatsapp\.com\/[A-Za-z0-9_-]+$/.test(link);
  return false;
};

const validatePhone = (phone: string): boolean => {
  if (!phone) return false;
  return /^\d{8,15}$/.test(phone.replace(/\D/g, ''));
};

export const WhatsAppCallButton: React.FC<WhatsAppCallButtonProps> = ({
  userId,
  userConfig,
  size = 'default',
  variant = 'default',
  showBoth = false,
  className = '',
  disabled = false
}) => {
  // Se não tem configuração, não mostrar nada
  if (!userConfig?.is_enabled) {
    return null;
  }

  const hasValidVoiceLink = userConfig.voice_call_link && 
                           validateWhatsAppLink(userConfig.voice_call_link, 'voice');
  const hasValidVideoLink = userConfig.video_call_link && 
                           validateWhatsAppLink(userConfig.video_call_link, 'video');
  const hasValidPhone = userConfig.whatsapp_phone && 
                        validatePhone(userConfig.whatsapp_phone);

  // Se não tem links válidos, não mostrar
  if (!hasValidVoiceLink && !hasValidVideoLink && !hasValidPhone) {
    return null;
  }

  const openWhatsAppCall = (link: string, type?: string) => {
    if (disabled) return;
    
    try {
      window.open(link, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Erro ao abrir WhatsApp:', error);
    }
  };

  // Se deve mostrar múltiplos botões
  if (showBoth) {
    const buttons = [];
    
    if (hasValidVoiceLink) {
      buttons.push(
        <Button
          key="voice"
          size={size}
          variant={variant}
          disabled={disabled}
          onClick={() => openWhatsAppCall(userConfig.voice_call_link!)}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <Phone className="h-4 w-4 mr-2" />
          Voz
        </Button>
      );
    }
    
    if (hasValidVideoLink) {
      buttons.push(
        <Button
          key="video"
          size={size}
          variant={variant}
          disabled={disabled}
          onClick={() => openWhatsAppCall(userConfig.video_call_link!)}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <Video className="h-4 w-4 mr-2" />
          Vídeo
        </Button>
      );
    }
    
    if (hasValidPhone) {
      buttons.push(
        <Button
          key="message"
          size={size}
          variant={variant}
          disabled={disabled}
          onClick={() => openWhatsAppCall(`https://wa.me/${userConfig.whatsapp_phone}?text=Vim+do+Orkut,+Tudo+bem+?`)}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Mensagem
        </Button>
      );
    }
    
    return (
      <div className={`flex items-center space-x-2 flex-wrap gap-2 ${className}`}>
        {buttons}
      </div>
    );
  }

  // Determinar qual botão mostrar (prioridade: vídeo > voz > mensagem)
  let primaryLink: string;
  let primaryType: string;
  let Icon: React.ComponentType<any>;
  let label: string;
  
  if (hasValidVideoLink) {
    primaryLink = userConfig.video_call_link!;
    primaryType = 'video';
    Icon = Video;
    label = 'Vídeo';
  } else if (hasValidVoiceLink) {
    primaryLink = userConfig.voice_call_link!;
    primaryType = 'voice';
    Icon = Phone;
    label = 'Voz';
  } else {
    primaryLink = `https://wa.me/${userConfig.whatsapp_phone}?text=Vim+do+Orkut,+Tudo+bem+?`;
    primaryType = 'message';
    Icon = MessageSquare;
    label = 'Mensagem';
  }

  return (
    <Button
      size={size}
      variant={variant}
      disabled={disabled}
      onClick={() => openWhatsAppCall(primaryLink)}
      className={`bg-green-600 hover:bg-green-700 text-white ${className}`}
    >
      <Icon className="h-4 w-4 mr-2" />
      {label}
      <ExternalLink className="h-3 w-3 ml-2 opacity-70" />
    </Button>
  );
};

// Componente para mostrar grupos do WhatsApp
interface WhatsAppGroupsProps {
  userConfig?: WhatsAppConfig;
  maxGroups?: number;
  className?: string;
}

export const WhatsAppGroups: React.FC<WhatsAppGroupsProps> = ({
  userConfig,
  maxGroups = 3,
  className = ''
}) => {
  if (!userConfig?.is_enabled || !userConfig?.whatsapp_groups?.length) {
    return null;
  }

  const validGroups = userConfig.whatsapp_groups
    .filter(group => group.name && group.link && validateWhatsAppLink(group.link, 'group'))
    .slice(0, maxGroups);

  if (validGroups.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center space-x-2 mb-2">
        <Users className="h-4 w-4 text-green-600" />
        <span className="text-sm font-medium text-gray-700">Grupos WhatsApp</span>
      </div>
      <div className="space-y-1">
        {validGroups.map((group, index) => (
          <Button
            key={index}
            size="sm"
            variant="outline"
            onClick={() => window.open(group.link, '_blank', 'noopener,noreferrer')}
            className="w-full justify-start text-left bg-green-50 border-green-200 hover:bg-green-100"
          >
            <Users className="h-3 w-3 mr-2 text-green-600" />
            <span className="truncate">{group.name}</span>
            <ExternalLink className="h-3 w-3 ml-auto opacity-70" />
          </Button>
        ))}
      </div>
    </div>
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
  if (!userConfig?.is_enabled) {
    return null;
  }

  const hasValidVoiceLink = userConfig.voice_call_link && 
                           validateWhatsAppLink(userConfig.voice_call_link, 'voice');
  const hasValidVideoLink = userConfig.video_call_link && 
                           validateWhatsAppLink(userConfig.video_call_link, 'video');
  const hasValidPhone = userConfig.whatsapp_phone && 
                        validatePhone(userConfig.whatsapp_phone);

  if (!hasValidVoiceLink && !hasValidVideoLink && !hasValidPhone) {
    return null;
  }

  const openWhatsAppCall = (link: string) => {
    if (disabled) return;
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {hasValidVoiceLink && (
        <button
          onClick={() => openWhatsAppCall(userConfig.voice_call_link!)}
          disabled={disabled}
          className="p-1 rounded-full bg-green-100 hover:bg-green-200 transition-colors disabled:opacity-50"
          title="Chamada de voz pelo WhatsApp"
        >
          <Phone size={size} className="text-green-600" />
        </button>
      )}
      
      {hasValidVideoLink && (
        <button
          onClick={() => openWhatsAppCall(userConfig.video_call_link!)}
          disabled={disabled}
          className="p-1 rounded-full bg-green-100 hover:bg-green-200 transition-colors disabled:opacity-50"
          title="Chamada de vídeo pelo WhatsApp"
        >
          <Video size={size} className="text-green-600" />
        </button>
      )}
      
      {hasValidPhone && (
        <button
          onClick={() => openWhatsAppCall(`https://wa.me/${userConfig.whatsapp_phone}?text=Vim+do+Orkut,+Tudo+bem+?`)}
          disabled={disabled}
          className="p-1 rounded-full bg-green-100 hover:bg-green-200 transition-colors disabled:opacity-50"
          title="Enviar mensagem pelo WhatsApp"
        >
          <MessageSquare size={size} className="text-green-600" />
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
  if (!userConfig?.is_enabled) {
    return null;
  }

  const hasValidVoiceLink = userConfig.voice_call_link && 
                           validateWhatsAppLink(userConfig.voice_call_link, 'voice');
  const hasValidVideoLink = userConfig.video_call_link && 
                           validateWhatsAppLink(userConfig.video_call_link, 'video');
  const hasValidPhone = userConfig.whatsapp_phone && 
                        validatePhone(userConfig.whatsapp_phone);

  if (!hasValidVoiceLink && !hasValidVideoLink && !hasValidPhone) {
    return null;
  }

  const getCallTypes = () => {
    const types = [];
    if (hasValidVoiceLink) types.push('Voz');
    if (hasValidVideoLink) types.push('Vídeo');
    if (hasValidPhone) types.push('Mensagem');
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
