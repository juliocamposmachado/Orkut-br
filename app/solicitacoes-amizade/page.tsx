'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/enhanced-auth-context';
import { supabase } from '@/lib/supabase';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { OrkutCard, OrkutCardContent, OrkutCardHeader } from '@/components/ui/orkut-card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  UserPlus, 
  UserCheck, 
  UserX, 
  Heart,
  MessageCircle,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface FriendRequest {
  id: string;
  from_user: {
    id: string;
    display_name: string;
    photo_url: string | null;
    username: string;
  };
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

export default function FriendRequestsPage() {
  const { user, profile } = useAuth();
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string>('');

  useEffect(() => {
    if (user) {
      loadFriendRequests();
    }
  }, [user]);

  const loadFriendRequests = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Carregar da base de dados primeiro
      let loadedRequests: FriendRequest[] = [];

      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('profile_id', user.id)
            .eq('type', 'friend_request')
            .order('created_at', { ascending: false });

          if (!error && data) {
            loadedRequests = data.map(req => ({
              id: req.id.toString(),
              from_user: req.payload?.from_user || {
                id: '',
                display_name: 'Usuário Desconhecido',
                photo_url: null,
                username: 'unknown'
              },
              status: req.read ? 'accepted' : 'pending',
              created_at: req.created_at
            }));
          }
        } catch (error) {
          console.warn('Erro na base de dados, usando localStorage');
        }
      }

      // Fallback para localStorage
      if (loadedRequests.length === 0) {
        const saved = localStorage.getItem(`notifications_${user.id}`);
        if (saved) {
          const notifications = JSON.parse(saved);
          loadedRequests = notifications
            .filter((n: any) => n.type === 'friend_request')
            .map((n: any) => ({
              id: n.id,
              from_user: n.from_user,
              status: 'pending',
              created_at: n.created_at
            }));
        }
      }

      setFriendRequests(loadedRequests);
    } catch (error) {
      console.error('Erro ao carregar pedidos de amizade:', error);
      toast.error('Erro ao carregar pedidos de amizade');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (request: FriendRequest) => {
    setActionLoading(`accept-${request.id}`)
    
    try {
      console.log('🔄 Aceitando pedido de amizade via API...')
      console.log('📆 Dados da solicitação:', {
        requestId: request.id,
        fromUserId: request.from_user.id,
        toUserId: user?.id,
        fromUserName: request.from_user.display_name
      })
      
      // Usar nossa API dedicada que contorna problemas de RLS
      const apiResponse = await fetch('/api/friendships/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requesterId: request.from_user.id,
          addresseeId: user?.id,
          notificationId: request.id,
          fromUser: request.from_user,
          currentUser: profile
        })
      })

      const apiResult = await apiResponse.json()
      
      if (!apiResponse.ok) {
        console.error('❌ API retornou erro:', apiResult)
        throw new Error(apiResult.error || 'Erro na API')
      }
      
      console.log('✅ API processou com sucesso:', apiResult)
      
      // PASSO 3: Atualizar status local do pedido
      setFriendRequests(prev => 
        prev.map(req => 
          req.id === request.id ? { ...req, status: 'accepted' } : req
        )
      )

      // PASSO 4: Criar notificação de aceite para quem enviou
      await createAcceptedNotification(request)
      
      // PASSO 5: Atualizar localStorage (backup)
      if (user) {
        const existingNotifications = JSON.parse(
          localStorage.getItem(`notifications_${user.id}`) || '[]'
        )
        
        const updatedNotifications = existingNotifications.map((n: any) => 
          n.id === request.id ? { ...n, read: true } : n
        )
        
        localStorage.setItem(`notifications_${user.id}`, JSON.stringify(updatedNotifications))
      }

      toast.success(`Você aceitou a solicitação de ${request.from_user.display_name}! 🎉`)
      
      // Disparar evento global para atualizar listas de amigos
      window.dispatchEvent(new CustomEvent('friendRequestAccepted', {
        detail: {
          friend: request.from_user,
          timestamp: new Date().toISOString()
        }
      }));
      
      console.log('✅ Evento friendRequestAccepted disparado');
      
      // Disparar também evento para atualizar contadores
      window.dispatchEvent(new CustomEvent('friendsListUpdated', {
        detail: {
          action: 'friend_added',
          friend: request.from_user
        }
      }));
      
    } catch (error) {
      console.error('Erro ao aceitar pedido:', error);
      toast.error('Erro ao aceitar pedido de amizade');
    } finally {
      setActionLoading('');
    }
  };

  const handleRejectRequest = async (request: FriendRequest) => {
    setActionLoading(`reject-${request.id}`);
    
    try {
      console.log('🚫 Rejeitando pedido de amizade...')
      
      // PASSO 1: Marcar notificação como lida/removida no banco
      if (supabase && user) {
        try {
          const { error: notificationError } = await supabase
            .from('notifications')
            .delete()
            .eq('id', request.id)
            .eq('profile_id', user.id)
          
          if (notificationError) {
            console.warn('⚠️ Erro ao remover notificação do banco:', notificationError)
          } else {
            console.log('✅ Notificação removida do banco')
          }
        } catch (dbError) {
          console.error('❌ Erro na operação do banco:', dbError)
          // Continua mesmo com erro, pois é apenas uma rejeição
        }
      } else {
        // Simular processamento se não há Supabase
        await new Promise(resolve => setTimeout(resolve, 800))
      }
      
      // PASSO 2: Atualizar status local do pedido
      setFriendRequests(prev => 
        prev.map(req => 
          req.id === request.id ? { ...req, status: 'rejected' } : req
        )
      );

      // PASSO 3: Remover da lista de notificações (localStorage backup)
      if (user) {
        const existingNotifications = JSON.parse(
          localStorage.getItem(`notifications_${user.id}`) || '[]'
        );
        
        const updatedNotifications = existingNotifications.filter((n: any) => n.id !== request.id);
        localStorage.setItem(`notifications_${user.id}`, JSON.stringify(updatedNotifications));
      }

      toast.success(`Pedido de ${request.from_user.display_name} foi rejeitado.`);
      
    } catch (error) {
      console.error('Erro ao rejeitar pedido:', error);
      toast.error('Erro ao rejeitar pedido de amizade');
    } finally {
      setActionLoading('');
    }
  };

  const createAcceptedNotification = async (request: FriendRequest) => {
    if (!profile) return;

    try {
      // Criar notificação para quem enviou o pedido
      const notificationData = {
        profile_id: request.from_user.id,
        type: 'friend_request_accepted',
        payload: {
          from_user: {
            id: profile.id,
            display_name: profile.display_name,
            photo_url: profile.photo_url,
            username: profile.username
          },
          action_url: `/perfil/${profile.username}`
        },
        read: false
      };

      // Salvar no localStorage do remetente (simulação)
      const existingNotifications = JSON.parse(
        localStorage.getItem(`notifications_${request.from_user.id}`) || '[]'
      );

      const newNotification = {
        id: Date.now().toString(),
        type: 'friend_request_accepted',
        title: 'Pedido aceito',
        message: 'aceitou sua solicitação de amizade',
        read: false,
        created_at: new Date().toISOString(),
        from_user: {
          id: profile.id,
          display_name: profile.display_name,
          photo_url: profile.photo_url,
          username: profile.username
        }
      };

      const updatedNotifications = [newNotification, ...existingNotifications].slice(0, 50);
      localStorage.setItem(`notifications_${request.from_user.id}`, JSON.stringify(updatedNotifications));
      
      console.log('✅ Notificação de aceite criada');
    } catch (error) {
      console.error('Erro ao criar notificação de aceite:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const pendingRequests = friendRequests.filter(req => req.status === 'pending');
  const processedRequests = friendRequests.filter(req => req.status !== 'pending');

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center">
            <UserPlus className="h-8 w-8 mr-3 text-purple-600" />
            Solicitações de Amizade
          </h1>
          <p className="text-gray-600">
            Gerencie seus pedidos de amizade recebidos
          </p>
        </div>

        <div className="grid gap-6">
          {/* Pedidos Pendentes */}
          <OrkutCard>
            <OrkutCardHeader>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-orange-500" />
                  <span className="text-lg font-semibold">Pedidos Pendentes</span>
                  {pendingRequests.length > 0 && (
                    <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                      {pendingRequests.length}
                    </Badge>
                  )}
                </div>
              </div>
            </OrkutCardHeader>
            <OrkutCardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Carregando pedidos...</p>
                </div>
              ) : pendingRequests.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <UserPlus className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Nenhum pedido pendente</h3>
                  <p className="text-sm">
                    Quando alguém enviar um pedido de amizade, ele aparecerá aqui.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingRequests.map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-12 w-12 border-2 border-purple-200">
                          <AvatarImage 
                            src={request.from_user.photo_url || undefined}
                            alt={request.from_user.display_name}
                          />
                          <AvatarFallback className="bg-purple-500 text-white font-bold">
                            {request.from_user.display_name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800">
                            {request.from_user.display_name}
                          </h4>
                          <p className="text-sm text-gray-600">
                            @{request.from_user.username}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Enviado em {formatDate(request.created_at)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Link href={`/perfil/${request.from_user.username}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-purple-300 text-purple-700 hover:bg-purple-50"
                          >
                            Ver Perfil
                          </Button>
                        </Link>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRejectRequest(request)}
                          disabled={actionLoading === `reject-${request.id}`}
                          className="border-red-300 text-red-700 hover:bg-red-50"
                        >
                          {actionLoading === `reject-${request.id}` ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600" />
                          ) : (
                            <>
                              <XCircle className="h-4 w-4 mr-1" />
                              Rejeitar
                            </>
                          )}
                        </Button>
                        
                        <Button
                          size="sm"
                          onClick={() => handleAcceptRequest(request)}
                          disabled={actionLoading === `accept-${request.id}`}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          {actionLoading === `accept-${request.id}` ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Aceitar
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </OrkutCardContent>
          </OrkutCard>

          {/* Histórico de Pedidos */}
          {processedRequests.length > 0 && (
            <OrkutCard>
              <OrkutCardHeader>
                <div className="flex items-center space-x-2">
                  <Heart className="h-5 w-5 text-green-500" />
                  <span className="text-lg font-semibold">Histórico</span>
                  <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                    {processedRequests.length}
                  </Badge>
                </div>
              </OrkutCardHeader>
              <OrkutCardContent>
                <div className="space-y-3">
                  {processedRequests.map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage 
                            src={request.from_user.photo_url || undefined}
                            alt={request.from_user.display_name}
                          />
                          <AvatarFallback className="bg-gray-500 text-white">
                            {request.from_user.display_name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div>
                          <h5 className="font-medium text-gray-800">
                            {request.from_user.display_name}
                          </h5>
                          <p className="text-xs text-gray-500">
                            {formatDate(request.created_at)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant={request.status === 'accepted' ? 'default' : 'destructive'}
                          className={
                            request.status === 'accepted' 
                              ? 'bg-green-100 text-green-800 border-green-300' 
                              : 'bg-red-100 text-red-800 border-red-300'
                          }
                        >
                          {request.status === 'accepted' ? (
                            <>
                              <UserCheck className="h-3 w-3 mr-1" />
                              Aceito
                            </>
                          ) : (
                            <>
                              <UserX className="h-3 w-3 mr-1" />
                              Rejeitado
                            </>
                          )}
                        </Badge>
                        
                        <Link href={`/perfil/${request.from_user.username}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-purple-600 hover:text-purple-800"
                          >
                            Ver Perfil
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </OrkutCardContent>
            </OrkutCard>
          )}
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
