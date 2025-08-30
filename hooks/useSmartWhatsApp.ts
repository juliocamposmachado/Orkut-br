'use client';

import { useState, useEffect } from 'react';

interface WhatsAppConfig {
  user_id: string;
  is_enabled: boolean;
  whatsapp_phone?: string;
  voice_call_link?: string;
  video_call_link?: string;
  whatsapp_groups?: Array<{
    name: string;
    link: string;
  }>;
}

interface WhatsAppReturn {
  loading: boolean;
  error: string | null;
  config: WhatsAppConfig | null;
  isEnabled: boolean;
  hasVoiceLink: boolean;
  hasVideoLink: boolean;
  hasPhone: boolean;
  hasGroups: boolean;
  hasValidConfig: () => boolean;
  getValidLinks: () => {
    voice: string | null;
    video: string | null;
    phone: string | null;
    groups: Array<{ name: string; link: string }>;
  };
}

// Configurações padrão por tipo de perfil
const getDefaultConfig = (userId: string, username?: string, displayName?: string): WhatsAppConfig => {
  // Configurações específicas para perfis conhecidos
  if (username === 'juliocamposmachado') {
    return {
      user_id: userId,
      is_enabled: true,
      whatsapp_phone: '5511970603441',
      voice_call_link: 'https://call.whatsapp.com/voice/c8OLiu8Wec4ZqODTqPTjMk',
      video_call_link: 'https://call.whatsapp.com/video/6GrHTFI5lLxMiJhwc0PkGn',
      whatsapp_groups: []
    };
  }

  if (username === 'radiotatuapefm') {
    return {
      user_id: userId,
      is_enabled: true,
      whatsapp_phone: '5511970603441',
      voice_call_link: undefined,
      video_call_link: undefined,
      whatsapp_groups: []
    };
  }

  // Configuração padrão para todos os outros usuários
  // Usa um número genérico que pode ser personalizado depois
  return {
    user_id: userId,
    is_enabled: true,
    whatsapp_phone: '551100000000', // Número genérico que será substituído
    voice_call_link: undefined,
    video_call_link: undefined,
    whatsapp_groups: []
  };
};

export const useSmartWhatsApp = (
  userId: string | undefined, 
  username?: string, 
  displayName?: string
): WhatsAppReturn => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<WhatsAppConfig | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const loadConfig = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log(`🔄 Carregando configuração WhatsApp inteligente para: ${username || userId}`);

        // Primeiro, tenta buscar configuração real do banco
        try {
          const response = await fetch(`/api/whatsapp?user_id=${userId}`, {
            method: 'GET',
            cache: 'no-store'
          });

          if (response.ok) {
            const data = await response.json();
            
            if (data.success && data.config && data.config.is_enabled) {
              console.log('✅ Configuração encontrada no banco:', data.config);
              setConfig(data.config);
              setLoading(false);
              return;
            }
          }
        } catch (apiError) {
          console.log('⚠️ API não disponível, usando configuração padrão');
        }

        // Se não encontrou no banco, usa configuração padrão
        const defaultConfig = getDefaultConfig(userId, username, displayName);
        console.log('🎯 Usando configuração padrão:', defaultConfig);
        setConfig(defaultConfig);

      } catch (err) {
        console.error('❌ Erro ao carregar configuração WhatsApp:', err);
        setError('Erro ao carregar configuração');
        
        // Mesmo com erro, fornece configuração básica
        const fallbackConfig = getDefaultConfig(userId, username, displayName);
        setConfig(fallbackConfig);
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, [userId, username, displayName]);

  const isEnabled = config?.is_enabled || false;
  
  const hasVoiceLink = Boolean(
    config?.voice_call_link || config?.whatsapp_phone
  );
  
  const hasVideoLink = Boolean(
    config?.video_call_link || config?.whatsapp_phone
  );
  
  const hasPhone = Boolean(config?.whatsapp_phone);
  
  const hasGroups = Boolean(
    config?.whatsapp_groups && config.whatsapp_groups.length > 0
  );

  const hasValidConfig = (): boolean => {
    return isEnabled && (hasVoiceLink || hasVideoLink || hasPhone || hasGroups);
  };

  const getValidLinks = () => {
    const phone = config?.whatsapp_phone?.replace(/\D/g, '') || null;
    
    return {
      voice: config?.voice_call_link || null,
      video: config?.video_call_link || null,
      phone: phone,
      groups: config?.whatsapp_groups || []
    };
  };

  return {
    loading,
    error,
    config,
    isEnabled,
    hasVoiceLink,
    hasVideoLink,
    hasPhone,
    hasGroups,
    hasValidConfig,
    getValidLinks
  };
};
