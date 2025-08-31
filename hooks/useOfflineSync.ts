'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { soundManager } from '@/utils/soundManager';

// Função para enviar notificação global
const sendSyncNotification = (message: string, count: number) => {
  // Envia evento customizado para o sistema de notificações
  window.dispatchEvent(new CustomEvent('syncNotification', {
    detail: {
      message,
      count,
      type: 'sync_success',
      timestamp: Date.now()
    }
  }));
};

interface SyncItem {
  id: string;
  type: 'social' | 'whatsapp' | 'profile';
  data: any;
  timestamp: number;
  attempts: number;
}

interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  hasUnsyncedData: boolean;
  lastSyncTime: number | null;
}

export const useOfflineSync = () => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    isSyncing: false,
    hasUnsyncedData: false,
    lastSyncTime: null
  });

  const syncQueueRef = useRef<SyncItem[]>([]);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Monitora conexão de rede
  useEffect(() => {
    const handleOnline = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: true }));
      syncPendingItems();
    };

    const handleOffline = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Carrega itens pendentes do localStorage na inicialização
  useEffect(() => {
    loadPendingItems();
  }, []);

  const loadPendingItems = () => {
    try {
      const stored = localStorage.getItem('orkut_sync_queue');
      if (stored) {
        const items = JSON.parse(stored) as SyncItem[];
        syncQueueRef.current = items;
        setSyncStatus(prev => ({ 
          ...prev, 
          hasUnsyncedData: items.length > 0 
        }));
      }
    } catch (error) {
      console.error('Erro ao carregar itens pendentes:', error);
    }
  };

  const savePendingItems = () => {
    try {
      localStorage.setItem('orkut_sync_queue', JSON.stringify(syncQueueRef.current));
      setSyncStatus(prev => ({ 
        ...prev, 
        hasUnsyncedData: syncQueueRef.current.length > 0 
      }));
    } catch (error) {
      console.error('Erro ao salvar itens pendentes:', error);
    }
  };

  // Salvar item localmente e tentar sincronizar
  const saveLocally = useCallback((type: SyncItem['type'], data: any): Promise<void> => {
    return new Promise((resolve) => {
      // Salvar no localStorage primeiro
      const localKey = `orkut_${type}_draft`;
      localStorage.setItem(localKey, JSON.stringify({
        data,
        timestamp: Date.now(),
        saved: true
      }));

      // Adicionar à fila de sincronização
      const syncItem: SyncItem = {
        id: `${type}_${Date.now()}`,
        type,
        data,
        timestamp: Date.now(),
        attempts: 0
      };

      syncQueueRef.current.push(syncItem);
      savePendingItems();

      toast.success('💾 Dados salvos localmente!');
      resolve();

      // Tentar sincronizar imediatamente se online
      if (syncStatus.isOnline) {
        syncPendingItems();
      }
    });
  }, [syncStatus.isOnline]);

  // Sincronizar itens pendentes
  const syncPendingItems = useCallback(async () => {
    if (syncQueueRef.current.length === 0 || syncStatus.isSyncing) {
      return;
    }

    setSyncStatus(prev => ({ ...prev, isSyncing: true }));

    const itemsToSync = [...syncQueueRef.current];
    const successfulSyncs: string[] = [];

    for (const item of itemsToSync) {
      try {
        let success = false;

        switch (item.type) {
          case 'social':
            success = await syncSocialData(item.data);
            break;
          case 'whatsapp':
            success = await syncWhatsAppData(item.data);
            break;
          case 'profile':
            success = await syncProfileData(item.data);
            break;
        }

        if (success) {
          successfulSyncs.push(item.id);
          // Limpar dados locais após sincronização bem-sucedida
          localStorage.removeItem(`orkut_${item.type}_draft`);
        } else {
          // Incrementar tentativas
          item.attempts += 1;
          
          // Remover item se excedeu máximo de tentativas (10)
          if (item.attempts >= 10) {
            successfulSyncs.push(item.id);
            toast.error(`❌ Falha ao sincronizar ${item.type} após várias tentativas.`);
          }
        }
      } catch (error) {
        console.error(`Erro ao sincronizar ${item.type}:`, error);
        item.attempts += 1;
      }
    }

    // Remover itens sincronizados com sucesso
    syncQueueRef.current = syncQueueRef.current.filter(item => 
      !successfulSyncs.includes(item.id)
    );
    savePendingItems();

    setSyncStatus(prev => ({ 
      ...prev, 
      isSyncing: false,
      lastSyncTime: successfulSyncs.length > 0 ? Date.now() : prev.lastSyncTime
    }));

    if (successfulSyncs.length > 0) {
      // Toast com sucesso
      toast.success(`☁️ ${successfulSyncs.length} item(s) sincronizado(s) com sucesso!`);
      
      // Tocar som de sincronização
      soundManager.playSound('sync_success');
      
      // Enviar notificação para o sistema global
      sendSyncNotification(
        `Dados sincronizados com sucesso!`, 
        successfulSyncs.length
      );
    }

    // Programar nova tentativa se ainda há itens pendentes
    if (syncQueueRef.current.length > 0) {
      scheduleRetry();
    }
  }, [syncStatus.isSyncing]);

  const syncSocialData = async (data: any): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          social_instagram: data.social_instagram || null,
          social_facebook: data.social_facebook || null,
          social_twitter: data.social_twitter || null,
          social_linkedin: data.social_linkedin || null,
          social_youtube: data.social_youtube || null,
          social_tiktok: data.social_tiktok || null,
          social_github: data.social_github || null,
          social_website: data.social_website || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', data.user_id);

      return !error;
    } catch (error) {
      console.error('Erro ao sincronizar dados sociais:', error);
      return false;
    }
  };

  const syncWhatsAppData = async (data: any): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('whatsapp_config')
        .upsert({
          user_id: data.user_id,
          is_enabled: data.is_enabled,
          allow_calls: data.allow_calls,
          voice_call_link: data.voice_call_link,
          video_call_link: data.video_call_link,
          whatsapp_phone: data.whatsapp_phone,
          whatsapp_groups: data.whatsapp_groups,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      return !error;
    } catch (error) {
      console.error('Erro ao sincronizar dados WhatsApp:', error);
      return false;
    }
  };

  const syncProfileData = async (data: any): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: data.display_name,
          username: data.username,
          email: data.email,
          phone: data.phone,
          whatsapp_enabled: data.whatsapp_enabled,
          privacy_settings: data.privacy_settings,
          updated_at: new Date().toISOString()
        })
        .eq('id', data.user_id);

      return !error;
    } catch (error) {
      console.error('Erro ao sincronizar dados do perfil:', error);
      return false;
    }
  };

  const scheduleRetry = () => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }

    // Retry com backoff exponencial (30s, 1m, 2m, 4m, etc.)
    const maxAttempts = Math.max(...syncQueueRef.current.map(item => item.attempts));
    const delay = Math.min(30000 * Math.pow(2, maxAttempts), 300000); // Máximo 5 minutos

    retryTimeoutRef.current = setTimeout(() => {
      if (syncStatus.isOnline) {
        syncPendingItems();
      }
    }, delay);
  };

  // Verificar se há dados salvos localmente para um tipo específico
  const hasLocalData = (type: string): boolean => {
    try {
      const stored = localStorage.getItem(`orkut_${type}_draft`);
      return !!stored;
    } catch {
      return false;
    }
  };

  // Carregar dados locais para um tipo específico
  const loadLocalData = (type: string): any => {
    try {
      const stored = localStorage.getItem(`orkut_${type}_draft`);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.data;
      }
    } catch (error) {
      console.error('Erro ao carregar dados locais:', error);
    }
    return null;
  };

  // Forçar sincronização manual
  const forcSync = useCallback(() => {
    if (syncQueueRef.current.length > 0) {
      syncPendingItems();
    } else {
      toast.info('📡 Todos os dados já estão sincronizados!');
    }
  }, [syncPendingItems]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  return {
    syncStatus,
    saveLocally,
    hasLocalData,
    loadLocalData,
    forcSync,
    syncPendingItems
  };
};
