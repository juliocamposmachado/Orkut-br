'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth-context'

interface Friend {
  friend_id: string;
  friend_username: string;
  friend_name: string;
  friend_avatar: string | null;
  friend_phone: string | null;
  friend_whatsapp_enabled: boolean;
  friend_privacy_settings: any;
  friendship_date: string;
}

interface FriendshipRequest {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'blocked';
  created_at: string;
  requester_name: string;
  requester_username: string;
  requester_avatar: string | null;
  addressee_name: string;
  addressee_username: string;
  addressee_avatar: string | null;
}

interface FriendsContextType {
  friends: Friend[];
  pendingRequests: FriendshipRequest[];
  sentRequests: FriendshipRequest[];
  loading: boolean;
  error: string | null;
  
  // Ações
  sendFriendRequest: (addresseeId: string) => Promise<boolean>;
  acceptFriendRequest: (requestId: string) => Promise<boolean>;
  rejectFriendRequest: (requestId: string) => Promise<boolean>;
  removeFriend: (friendId: string) => Promise<boolean>;
  blockUser: (userId: string) => Promise<boolean>;
  
  // Verificações
  getFriendshipStatus: (userId: string) => 'none' | 'pending_sent' | 'pending_received' | 'friends' | 'blocked';
  searchUsers: (query: string) => Promise<any[]>;
  
  // Utilitários
  refreshFriends: () => Promise<void>;
  getFriendCount: () => number;
}

const FriendsContext = createContext<FriendsContextType | undefined>(undefined);

export const FriendsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendshipRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendshipRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar amigos
  const loadFriends = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Tentar carregar do Supabase primeiro
      try {
        // Carregar amigos
        const { data: friendsData, error: friendsError } = await supabase
          .from('friends_view')
          .select('*')
          .eq('user_id', user.id)
          .order('friendship_date', { ascending: false });

        if (!friendsError && friendsData) {
          setFriends(friendsData || []);
        }

        // Carregar solicitações recebidas (pendentes)
        const { data: receivedData, error: receivedError } = await supabase
          .from('friendships')
          .select(`
            *,
            requester:requester_id (
              name,
              username,
              avatar_url
            )
          `)
          .eq('addressee_id', user.id)
          .eq('status', 'pending');

        if (!receivedError && receivedData) {
          const formattedReceived = receivedData?.map(req => ({
            ...req,
            requester_name: req.requester?.name || '',
            requester_username: req.requester?.username || '',
            requester_avatar: req.requester?.avatar_url || null,
            addressee_name: (user as any).user_metadata?.name || '',
            addressee_username: (user as any).user_metadata?.username || '',
            addressee_avatar: (user as any).user_metadata?.avatar_url || null
          })) || [];

          setPendingRequests(formattedReceived);
        }

        // Carregar solicitações enviadas (pendentes)
        const { data: sentData, error: sentError } = await supabase
          .from('friendships')
          .select(`
            *,
            addressee:addressee_id (
              name,
              username,
              avatar_url
            )
          `)
          .eq('requester_id', user.id)
          .eq('status', 'pending');

        if (!sentError && sentData) {
          const formattedSent = sentData?.map(req => ({
            ...req,
            requester_name: (user as any).user_metadata?.name || '',
            requester_username: (user as any).user_metadata?.username || '',
            requester_avatar: (user as any).user_metadata?.avatar_url || null,
            addressee_name: req.addressee?.name || '',
            addressee_username: req.addressee?.username || '',
            addressee_avatar: req.addressee?.avatar_url || null
          })) || [];

          setSentRequests(formattedSent);
        }
      } catch (supabaseError) {
        console.log('Supabase indisponível, usando dados fallback para amigos');
        // Fallback: usar dados vazios
        setFriends([]);
        setPendingRequests([]);
        setSentRequests([]);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar amigos');
      console.error('Erro ao carregar amigos:', err);
      // Fallback em caso de erro
      setFriends([]);
      setPendingRequests([]);
      setSentRequests([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Carregar dados na inicialização
  useEffect(() => {
    if (user) {
      loadFriends();
    }
  }, [user, loadFriends]);

  // Enviar solicitação de amizade
  const sendFriendRequest = async (addresseeId: string): Promise<boolean> => {
    if (!user || user.id === addresseeId) return false;

    try {
      setError(null);

      const { error } = await supabase
        .from('friendships')
        .insert({
          requester_id: user.id,
          addressee_id: addresseeId,
          status: 'pending'
        });

      if (error) throw error;

      await loadFriends();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar solicitação');
      return false;
    }
  };

  // Aceitar solicitação de amizade
  const acceptFriendRequest = async (requestId: string): Promise<boolean> => {
    try {
      setError(null);

      const { error } = await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('id', requestId);

      if (error) throw error;

      await loadFriends();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao aceitar solicitação');
      return false;
    }
  };

  // Rejeitar solicitação de amizade
  const rejectFriendRequest = async (requestId: string): Promise<boolean> => {
    try {
      setError(null);

      const { error } = await supabase
        .from('friendships')
        .update({ status: 'rejected' })
        .eq('id', requestId);

      if (error) throw error;

      await loadFriends();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao rejeitar solicitação');
      return false;
    }
  };

  // Remover amigo
  const removeFriend = async (friendId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      setError(null);

      const { error } = await supabase
        .from('friendships')
        .delete()
        .or(`and(requester_id.eq.${user.id},addressee_id.eq.${friendId}),and(requester_id.eq.${friendId},addressee_id.eq.${user.id})`);

      if (error) throw error;

      await loadFriends();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover amigo');
      return false;
    }
  };

  // Bloquear usuário
  const blockUser = async (userId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      setError(null);

      // Verificar se já existe uma relação de amizade
      const { data: existing } = await supabase
        .from('friendships')
        .select('id')
        .or(`and(requester_id.eq.${user.id},addressee_id.eq.${userId}),and(requester_id.eq.${userId},addressee_id.eq.${user.id})`)
        .single();

      if (existing) {
        // Atualizar para bloqueado
        const { error } = await supabase
          .from('friendships')
          .update({ status: 'blocked' })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Criar nova entrada de bloqueio
        const { error } = await supabase
          .from('friendships')
          .insert({
            requester_id: user.id,
            addressee_id: userId,
            status: 'blocked'
          });

        if (error) throw error;
      }

      await loadFriends();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao bloquear usuário');
      return false;
    }
  };

  // Verificar status da amizade
  const getFriendshipStatus = (userId: string) => {
    if (!user || user.id === userId) return 'none';

    // Verificar se é amigo
    if (friends.some(friend => friend.friend_id === userId)) {
      return 'friends';
    }

    // Verificar solicitações enviadas
    if (sentRequests.some(req => req.addressee_id === userId)) {
      return 'pending_sent';
    }

    // Verificar solicitações recebidas
    if (pendingRequests.some(req => req.requester_id === userId)) {
      return 'pending_received';
    }

    return 'none';
  };

  // Buscar usuários
  const searchUsers = async (query: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, username, avatar_url')
        .or(`name.ilike.%${query}%,username.ilike.%${query}%`)
        .limit(20);

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Erro ao buscar usuários:', err);
      return [];
    }
  };

  const refreshFriends = loadFriends;
  const getFriendCount = () => friends.length;

  const value: FriendsContextType = {
    friends,
    pendingRequests,
    sentRequests,
    loading,
    error,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
    blockUser,
    getFriendshipStatus,
    searchUsers,
    refreshFriends,
    getFriendCount
  };

  return (
    <FriendsContext.Provider value={value}>
      {children}
    </FriendsContext.Provider>
  );
};

export const useFriends = () => {
  const context = useContext(FriendsContext);
  if (!context) {
    throw new Error('useFriends must be used within a FriendsProvider');
  }
  return context;
};
