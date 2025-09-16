'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context'
// import { supabase } from '@/lib/supabase' // DESABILITADO temporariamente

interface OnlineUser {
  userId: string;
  userName: string;
  isOnline: boolean;
  lastSeen?: Date;
  status?: 'online' | 'away' | 'busy' | 'offline';
}

interface OnlineStatusContextType {
  onlineUsers: OnlineUser[];
  isUserOnline: (userId: string) => boolean;
  getUserStatus: (userId: string) => 'online' | 'away' | 'busy' | 'offline';
  updateStatus: (status: 'online' | 'away' | 'busy' | 'offline') => void;
  getLastSeen: (userId: string) => Date | null;
  isConnected: boolean;
}

const OnlineStatusContext = createContext<OnlineStatusContextType | undefined>(undefined);

// 🎯 GAMBIARRA ÉPICA: Sistema de presença SEM WebSocket, usando API REST + Polling
const updateUserPresence = async (
  userId: string, 
  isOnline: boolean, 
  status: 'online' | 'away' | 'busy' | 'offline'
) => {
  try {
    // Usar nossa API REST confiável
    const { data: { session } } = await supabase.auth.getSession();
    const authToken = session?.access_token;
    
    const response = await fetch('/api/user_presence', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authToken ? `Bearer ${authToken}` : ''
      },
      body: JSON.stringify({
        action: isOnline ? 'mark_online' : 'mark_offline'
      })
    });
    
    return response.ok;
  } catch (error) {
    console.warn('⚠️ Erro ao atualizar presença:', error);
    return false;
  }
};

// 🚀 FUNÇÃO ÉPICA: Carregar usuários online via API
const loadOnlineUsers = async (): Promise<OnlineUser[]> => {
  try {
    const response = await fetch('/api/user_presence');
    if (response.ok) {
      const result = await response.json();
      if (result.success && result.data) {
        return result.data.map((item: any) => ({
          userId: item.user_id,
          userName: item.profiles?.display_name || 'Usuário',
          isOnline: item.is_online,
          lastSeen: new Date(item.last_seen),
          status: 'online'
        }));
      }
    }
  } catch (error) {
    console.warn('⚠️ Erro ao carregar usuários online:', error);
  }
  return [];
};

export const OnlineStatusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [isConnected, setIsConnected] = useState(true); // Sempre conectado no modo simplificado
  const [currentStatus, setCurrentStatus] = useState<'online' | 'away' | 'busy' | 'offline'>('online');

  // 🎯 MODO SIMPLIFICADO - SEM POLLING, SEM REQUESTS
  useEffect(() => {
    if (!user) return;
    
    console.log('✅ OnlineStatusProvider: Modo simplificado ativado (sem polling)');
    setIsConnected(true);
    
    // Dados mock para demonstração (sem requests reais)
    const mockUsers: OnlineUser[] = [
      {
        userId: 'demo1',
        userName: 'Mariana Santos',
        isOnline: true,
        lastSeen: new Date(),
        status: 'online'
      },
      {
        userId: 'demo2', 
        userName: 'Carlos Eduardo',
        isOnline: true,
        lastSeen: new Date(Date.now() - 5 * 60 * 1000),
        status: 'away'
      }
    ];
    
    setOnlineUsers(mockUsers);
    
    return () => {
      console.log('🧧 OnlineStatusProvider: Limpeza simplificada');
    };
  }, [user]);

  const isUserOnline = useCallback((userId: string): boolean => {
    const onlineUser = onlineUsers.find(u => u.userId === userId);
    return onlineUser?.isOnline || false;
  }, [onlineUsers]);

  const getUserStatus = useCallback((userId: string): 'online' | 'away' | 'busy' | 'offline' => {
    const onlineUser = onlineUsers.find(u => u.userId === userId);
    if (!onlineUser || !onlineUser.isOnline) return 'offline';
    return onlineUser.status || 'online';
  }, [onlineUsers]);

  const getLastSeen = useCallback((userId: string): Date | null => {
    const onlineUser = onlineUsers.find(u => u.userId === userId);
    return onlineUser?.lastSeen || null;
  }, [onlineUsers]);

  const updateStatus = useCallback((status: 'online' | 'away' | 'busy' | 'offline') => {
    if (status !== currentStatus && user) {
      setCurrentStatus(status);
      updateUserPresence(user.id, status !== 'offline', status);
    }
  }, [user, currentStatus]);

  const value: OnlineStatusContextType = {
    onlineUsers,
    isUserOnline,
    getUserStatus,
    updateStatus,
    getLastSeen,
    isConnected
  };

  return (
    <OnlineStatusContext.Provider value={value}>
      {children}
    </OnlineStatusContext.Provider>
  );
};

export const useOnlineStatus = () => {
  const context = useContext(OnlineStatusContext);
  if (!context) {
    throw new Error('useOnlineStatus must be used within an OnlineStatusProvider');
  }
  return context;
};

export const useUserOnlineStatus = (userId: string) => {
  const { isUserOnline, getUserStatus, getLastSeen } = useOnlineStatus();
  
  return {
    isOnline: isUserOnline(userId),
    status: getUserStatus(userId),
    lastSeen: getLastSeen(userId)
  };
};
