'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/contexts/enhanced-auth-context'
import { supabase } from '@/lib/supabase'

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

// Função para atualizar presença usando UPSERT do banco
const updateUserPresence = async (
  userId: string, 
  isOnline: boolean, 
  status: 'online' | 'away' | 'busy' | 'offline',
  deviceInfo: any = {}
) => {
  try {
    const { error } = await supabase.rpc('upsert_user_presence', {
      p_user_id: userId,
      p_is_online: isOnline,
      p_status: status,
      p_device_info: deviceInfo
    });
    
    if (error) {
      console.warn('Erro ao atualizar presença:', error);
    }
  } catch (error) {
    console.warn('Erro ao atualizar presença:', error);
  }
};

export const OnlineStatusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<'online' | 'away' | 'busy' | 'offline'>('online');

  // Conectar ao servidor de signaling
  useEffect(() => {
    if (user && !socket) {
      try {
        const socketUrl = process.env.NODE_ENV === 'production' 
          ? 'https://orkut-br.vercel.app'
          : 'http://localhost:5001';
        
        const newSocket = io(socketUrl, {
          path: process.env.NODE_ENV === 'production' ? '/api/signaling' : '/socket.io',
          timeout: 10000,
          retries: 3,
          auth: {
            userId: user.id,
            userName: profile?.display_name || user.email || 'Usuário'
          },
          transports: ['websocket', 'polling']
        });

      newSocket.on('connect', () => {
        console.log('Conectado ao servidor de status online');
        setIsConnected(true);
        
        // Registrar usuário como online usando UPSERT
        updateUserPresence(user.id, true, 'online');
        
        newSocket.emit('join', {
          userId: user.id,
          userName: profile?.display_name || user.email || 'Usuário'
        });
      });

      newSocket.on('disconnect', () => {
        console.log('Desconectado do servidor de status online');
        setIsConnected(false);
      });

      // Receber lista de usuários online
      newSocket.on('online-users', (users: OnlineUser[]) => {
        setOnlineUsers(users);
      });

      // Usuário ficou online
      newSocket.on('user-online', (userData: OnlineUser) => {
        setOnlineUsers(prev => {
          const filtered = prev.filter(u => u.userId !== userData.userId);
          return [...filtered, userData];
        });
      });

      // Usuário ficou offline
      newSocket.on('user-offline', (userData: OnlineUser) => {
        setOnlineUsers(prev =>
          prev.map(u =>
            u.userId === userData.userId
              ? { ...u, isOnline: false, lastSeen: userData.lastSeen }
              : u
          )
        );
      });

      // Status do usuário mudou
      newSocket.on('user-status-changed', (userData: { userId: string; status: string; lastSeen: Date }) => {
        setOnlineUsers(prev =>
          prev.map(u =>
            u.userId === userData.userId
              ? { ...u, status: userData.status as any, lastSeen: userData.lastSeen }
              : u
          )
        );
      });

        newSocket.on('connect_error', (error) => {
          console.warn('Socket connection error:', error);
          setIsConnected(false);
        });

        setSocket(newSocket);

        return () => {
          newSocket.disconnect();
          setSocket(null);
          setIsConnected(false);
        };
      } catch (error) {
        console.warn('Failed to initialize socket connection:', error);
        setIsConnected(false);
      }
    }
  }, [user, profile]); // Remove socket dependency to prevent re-creation loop

  // Auto-away quando inativo
  useEffect(() => {
    let inactivityTimer: NodeJS.Timeout;
    let awayTimer: NodeJS.Timeout;

    const resetTimers = () => {
      clearTimeout(inactivityTimer);
      clearTimeout(awayTimer);

      if (currentStatus === 'away') {
        updateStatus('online');
      }

      // Definir como "away" após 5 minutos de inatividade
      awayTimer = setTimeout(() => {
        if (currentStatus === 'online') {
          updateStatus('away');
        }
      }, 5 * 60 * 1000); // 5 minutos
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, resetTimers, { passive: true });
    });

    resetTimers();

    return () => {
      clearTimeout(inactivityTimer);
      clearTimeout(awayTimer);
      events.forEach(event => {
        document.removeEventListener(event, resetTimers);
      });
    };
  }, [currentStatus]);

  // Heartbeat para manter conexão
  useEffect(() => {
    if (socket && isConnected) {
      const heartbeat = setInterval(() => {
        socket.emit('ping');
      }, 120000); // Aumentar para 2 minutos para reduzir carga ainda mais

      return () => clearInterval(heartbeat);
    }
  }, [socket, isConnected]);

  // Definir como offline quando a aba perde o foco
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (currentStatus === 'online') {
          updateStatus('away');
        }
      } else {
        if (currentStatus === 'away') {
          updateStatus('online');
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentStatus]);

  const isUserOnline = useCallback((userId: string): boolean => {
    const user = onlineUsers.find(u => u.userId === userId);
    return user?.isOnline || false;
  }, [onlineUsers]);

  const getUserStatus = useCallback((userId: string): 'online' | 'away' | 'busy' | 'offline' => {
    const user = onlineUsers.find(u => u.userId === userId);
    if (!user || !user.isOnline) return 'offline';
    return user.status || 'online';
  }, [onlineUsers]);

  const getLastSeen = useCallback((userId: string): Date | null => {
    const user = onlineUsers.find(u => u.userId === userId);
    return user?.lastSeen ? new Date(user.lastSeen) : null;
  }, [onlineUsers]);

  const updateStatus = useCallback((status: 'online' | 'away' | 'busy' | 'offline') => {
    if (socket && status !== currentStatus) {
      socket.emit('update-presence', { status });
      setCurrentStatus(status);
    }
  }, [socket, currentStatus]);

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

// Hook personalizado para verificar se um usuário específico está online
export const useUserOnlineStatus = (userId: string) => {
  const { isUserOnline, getUserStatus, getLastSeen } = useOnlineStatus();
  
  return {
    isOnline: isUserOnline(userId),
    status: getUserStatus(userId),
    lastSeen: getLastSeen(userId)
  };
};
