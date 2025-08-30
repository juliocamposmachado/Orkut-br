import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { WhatsAppConfig } from './useWhatsApp';

interface UserWhatsAppState {
  config: WhatsAppConfig | null;
  loading: boolean;
  error: string | null;
}

export const useUserWhatsApp = (userId?: string) => {
  const [state, setState] = useState<UserWhatsAppState>({
    config: null,
    loading: false,
    error: null
  });

  const loadUserWhatsAppConfig = useCallback(async () => {
    if (!userId) {
      setState({ config: null, loading: false, error: null });
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const { data, error } = await supabase
        .from('whatsapp_config')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      // Se não há configuração ou está desabilitada, retornar null
      if (!data || !data.is_enabled) {
        setState({ config: null, loading: false, error: null });
        return;
      }

      setState({ config: data, loading: false, error: null });

    } catch (error) {
      console.error('Erro ao carregar configuração WhatsApp do usuário:', error);
      setState({
        config: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }, [userId]);

  // Validar link do WhatsApp
  const validateWhatsAppLink = useCallback((link: string, type: 'voice' | 'video' | 'group'): boolean => {
    if (!link) return false;
    if (type === 'group') {
      return /^https:\/\/chat\.whatsapp\.com\/[A-Za-z0-9_-]+$/.test(link);
    }
    const pattern = new RegExp(`^https://call\\.whatsapp\\.com/${type}/[A-Za-z0-9_-]+$`);
    return pattern.test(link);
  }, []);

  // Validar telefone WhatsApp
  const validatePhone = useCallback((phone: string): boolean => {
    if (!phone) return false;
    const cleanPhone = phone.replace(/\D/g, '');
    return cleanPhone.length >= 8 && cleanPhone.length <= 15;
  }, []);

  // Obter links válidos para exibição
  const getValidLinks = useCallback(() => {
    if (!state.config?.is_enabled) {
      return { voice: null, video: null, phone: null, groups: [] };
    }
    
    return {
      voice: state.config?.voice_call_link && 
             validateWhatsAppLink(state.config.voice_call_link, 'voice') 
             ? state.config.voice_call_link 
             : null,
      video: state.config?.video_call_link && 
             validateWhatsAppLink(state.config.video_call_link, 'video') 
             ? state.config.video_call_link 
             : null,
      phone: state.config?.whatsapp_phone && 
             validatePhone(state.config.whatsapp_phone) 
             ? state.config.whatsapp_phone 
             : null,
      groups: state.config?.whatsapp_groups?.filter(group => 
        group.name && group.link && validateWhatsAppLink(group.link, 'group')
      ) || []
    };
  }, [state.config, validateWhatsAppLink, validatePhone]);

  // Verificar se tem alguma configuração válida
  const hasValidConfig = useCallback(() => {
    const links = getValidLinks();
    return !!(links.voice || links.video || links.phone || links.groups.length > 0);
  }, [getValidLinks]);

  // Determinar o melhor tipo de comunicação disponível (prioridade: vídeo > voz > mensagem)
  const getBestCommunicationMethod = useCallback(() => {
    const links = getValidLinks();
    
    if (links.video) return { type: 'video', link: links.video, label: 'WhatsApp Vídeo' };
    if (links.voice) return { type: 'voice', link: links.voice, label: 'WhatsApp Áudio' };
    if (links.phone) return { 
      type: 'message', 
      link: `https://wa.me/${links.phone}?text=Vim+do+Orkut,+Tudo+bem+?`, 
      label: 'WhatsApp Mensagem' 
    };
    
    return null;
  }, [getValidLinks]);

  // Recarregar quando userId muda
  useEffect(() => {
    loadUserWhatsAppConfig();
  }, [loadUserWhatsAppConfig]);

  return {
    // Estado
    config: state.config,
    loading: state.loading,
    error: state.error,
    
    // Ações
    reload: loadUserWhatsAppConfig,
    
    // Utilitários
    validateWhatsAppLink,
    validatePhone,
    getValidLinks,
    hasValidConfig,
    getBestCommunicationMethod,
    
    // Estado computado
    isEnabled: state.config?.is_enabled || false,
    hasVoiceLink: !!(state.config?.voice_call_link && validateWhatsAppLink(state.config.voice_call_link, 'voice')),
    hasVideoLink: !!(state.config?.video_call_link && validateWhatsAppLink(state.config.video_call_link, 'video')),
    hasPhone: !!(state.config?.whatsapp_phone && validatePhone(state.config.whatsapp_phone)),
    hasGroups: !!(state.config?.whatsapp_groups?.some(group => 
      group.name && group.link && validateWhatsAppLink(group.link, 'group')
    )),
  };
};

export default useUserWhatsApp;
