'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/enhanced-auth-context'
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { OrkutCard, OrkutCardContent, OrkutCardHeader } from '@/components/ui/orkut-card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  MapPin, 
  Globe, 
  Mail, 
  Shield, 
  Settings, 
  Users, 
  Camera, 
  Phone, 
  Video,
  MessageCircle,
  Heart,
  Star,
  Eye,
  UserPlus,
  Clock,
  UserCheck,
  Send
} from 'lucide-react';
import Link from 'next/link';
import { getUserPhotos, getRecentPhotos, getDefaultPhotos } from '@/data/profile-photos';
import { OnlineStatusToggle } from '@/components/profile/online-status-toggle';
import { CallModal } from '@/components/call/call-modal';
import { useCall } from '@/hooks/use-call';
import { BioEditor } from '@/components/profile/bio-editor';
import { MessageModal } from '@/components/messages/message-modal';
import { OnlineFriends } from '@/components/friends/online-friends'
import { RecentActivities } from '@/components/profile/recent-activities'
import Gallery from '@/components/Gallery'
import UpdateGalleries from '@/components/UpdateGalleries'
import { WhatsAppConfig } from '@/components/profile/whatsapp-config'
import { useUserWhatsApp } from '@/hooks/useUserWhatsApp'

interface UserProfile {
  id: string;
  display_name: string;
  username: string;
  email: string;
  photo_url?: string;
  phone?: string;
  bio?: string;
  location?: string;
  birthday?: string;
  relationship?: string;
  whatsapp_enabled: boolean;
  whatsapp_voice_link?: string;
  whatsapp_video_link?: string;
  privacy_settings: any;
  fans_count: number;
  created_at: string;
  scrapy_count: number;
  profile_views: number;
  birth_date?: string;
}

interface FriendItem {
  id: string;
  name: string;
  avatar?: string;
}

interface PhotoItem {
  id: number;
  url: string;
  title: string;
  description: string;
  uploadedAt: string;
  views: number;
  likes: number;
  comments: number;
}

interface GalleryItem {
  id: number;
  title: string;
  description?: string;
  photos: PhotoItem[];
  isPrivate: boolean;
  createdAt: string;
}

const ProfileContent: React.FC<{ username: string }> = ({ username }) => {
  const { user: currentUser, profile: currentUserProfile } = useAuth();
  const { callState, startVideoCall, startAudioCall, endCall } = useCall();
  const router = useRouter();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Hook para carregar configurações WhatsApp do usuário
  const userWhatsApp = useUserWhatsApp(profile?.id);
  
  const [friendshipStatus, setFriendshipStatus] = useState<string>('none');
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<string>('');
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [messageTarget, setMessageTarget] = useState<{
    id: string;
    name: string;
    username: string;
    photo?: string;
    isOnline?: boolean;
  } | null>(null);
  const [friends, setFriends] = useState<FriendItem[]>([]);
  const [recentConversations, setRecentConversations] = useState<any[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  
  // Exemplo estático de galerias para demo
  const [demoGalleries, setDemoGalleries] = useState<GalleryItem[]>([
    { 
      id: 1, 
      title: 'Paisagens', 
      description: 'Minhas fotos favoritas da natureza',
      photos: [
        {
          id: 101,
          url: 'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?auto=compress&cs=tinysrgb&w=400',
          title: 'Montanha ao amanhecer',
          description: 'Vista incrível das montanhas',
          uploadedAt: '2024-01-15T10:30:00Z',
          views: 127,
          likes: 34,
          comments: 5
        },
        {
          id: 102,
          url: 'https://images.pexels.com/photos/748837/pexels-photo-748837.jpeg?auto=compress&cs=tinysrgb&w=400',
          title: 'Floresta verdejante',
          description: 'Caminhada pela mata',
          uploadedAt: '2024-01-12T14:20:00Z',
          views: 89,
          likes: 23,
          comments: 3
        }
      ],
      isPrivate: false,
      createdAt: '2024-01-10T00:00:00Z'
    },
    { 
      id: 2, 
      title: 'Viagens', 
      description: 'Momentos especiais das minhas aventuras',
      photos: [
        {
          id: 201,
          url: 'https://images.pexels.com/photos/460621/pexels-photo-460621.jpeg?auto=compress&cs=tinysrgb&w=400',
          title: 'Praia paradisíaca',
          description: 'Férias no litoral',
          uploadedAt: '2024-01-08T16:45:00Z',
          views: 203,
          likes: 67,
          comments: 12
        }
      ],
      isPrivate: false,
      createdAt: '2024-01-05T00:00:00Z'
    },
    { 
      id: 3, 
      title: 'Arte', 
      photos: [],
      isPrivate: false,
      createdAt: '2024-01-03T00:00:00Z'
    },
    { 
      id: 4, 
      title: 'Família', 
      description: 'Momentos especiais com pessoas queridas',
      photos: [],
      isPrivate: true,
      createdAt: '2024-01-01T00:00:00Z'
    }
  ]);
  
  // Fotos do usuário baseadas no perfil
  const userPhotos = profile ? getUserPhotos(profile.username) : null;
  const displayPhotos = userPhotos?.photos || getDefaultPhotos();
  const recentPhotos = getRecentPhotos(6);
  
  // Handlers para o sistema de galerias
  const handleCreateGallery = async (gallery: Partial<any>) => {
    const newGallery: GalleryItem = {
      id: Date.now(), // ID temporário
      title: gallery.title || '',
      description: gallery.description,
      photos: [],
      isPrivate: gallery.isPrivate || false,
      createdAt: new Date().toISOString()
    };
    setDemoGalleries(prev => [...prev, newGallery]);
    console.log('✨ Nova galeria criada:', newGallery);
  };
  
  const handleUpdateGallery = async (updatedGallery: any) => {
    setDemoGalleries(prev => 
      prev.map(gallery => 
        gallery.id === updatedGallery.id ? updatedGallery : gallery
      )
    );
    console.log('📝 Galeria atualizada:', updatedGallery);
  };
  
  const handleDeleteGallery = async (galleryId: number) => {
    setDemoGalleries(prev => prev.filter(gallery => gallery.id !== galleryId));
    console.log('🗑️ Galeria deletada:', galleryId);
  };
  
  const handleAddPhotoToGallery = async (galleryId: number, files: File[]) => {
    // Simular upload e adição de fotos
    const newPhotos: PhotoItem[] = files.map((file, index) => ({
      id: Date.now() + index,
      url: URL.createObjectURL(file),
      title: file.name.split('.')[0],
      description: `Enviado em ${new Date().toLocaleDateString()}`,
      uploadedAt: new Date().toISOString(),
      views: 0,
      likes: 0,
      comments: 0
    }));
    
    setDemoGalleries(prev => 
      prev.map(gallery => 
        gallery.id === galleryId 
          ? { ...gallery, photos: [...gallery.photos, ...newPhotos] }
          : gallery
      )
    );
    
    console.log(`📸 ${files.length} foto(s) adicionada(s) à galeria ${galleryId}`);
  };
  
  // Fallback para status online
  const isOnline = true;
  const status = 'online';
  
  // Função real para verificar status de amizade no Supabase
  const getFriendshipStatus = async (userId: string) => {
    if (!currentUser?.id || !userId) {
      console.log('🚫 IDs necessários não disponíveis para verificar amizade');
      return 'none';
    }

    try {
      console.log('🔍 Verificando status de amizade entre:', currentUser.id, 'e', userId);
      
      // Buscar amizade nos dois sentidos
      const { data, error } = await supabase
        .from('friendships')
        .select('*')
        .or(`and(requester_id.eq.${currentUser.id},addressee_id.eq.${userId}),and(requester_id.eq.${userId},addressee_id.eq.${currentUser.id})`)
        .maybeSingle();
      
      if (error) {
        console.warn('⚠️ Erro ao verificar amizade, usando fallback:', error.message);
        return 'none';
      }
      
      if (data) {
        console.log('✅ Status de amizade encontrado:', data.status);
        return data.status as 'pending' | 'accepted' | 'rejected';
      }
      
      console.log('📭 Nenhuma amizade encontrada - status: none');
      return 'none';
      
    } catch (error) {
      console.error('❌ Erro ao verificar status de amizade:', error);
      return 'none';
    }
  };

  // Função para enviar pedido de amizade
  const handleFriendRequest = async () => {
    if (!profile?.id || !currentUser?.id) return;
    
    setActionLoading('friend');
    try {
      // Simular envio do pedido de amizade
      await new Promise(resolve => setTimeout(resolve, 1000));
      setFriendshipStatus('pending');
      
      // Criar notificação de pedido de amizade para o destinatário
      await createFriendRequestNotification();
      
      // Simular resposta automática após 3 segundos para demonstração
      setTimeout(async () => {
        setFriendshipStatus('accepted');
        
        // Criar notificação de aceite de amizade para o remetente
        await createFriendRequestAcceptedNotification();
        
        alert(`🎉 ${profile.display_name} aceitou seu pedido de amizade! Agora vocês são amigos e ele aparecerá no seu Top 10 Amigos.`);
      }, 3000);
      
      // Notificação visual
      alert('Pedido de amizade enviado com sucesso! Aguardando resposta...');
    } catch (error) {
      console.error('Erro ao enviar pedido de amizade:', error);
      alert('Erro ao enviar pedido de amizade. Tente novamente.');
    } finally {
      setActionLoading('');
    }
  };

  // Função para criar notificação de pedido de amizade
  const createFriendRequestNotification = async () => {
    if (!profile?.id || !currentUser?.id) return;

    try {
      console.log('Criando notificação de pedido de amizade...');
      
      const notificationData = {
        profile_id: profile.id, // Para quem será enviada a notificação
        type: 'friend_request',
        payload: {
          from_user: {
            id: currentUser.id,
            display_name: currentUserProfile?.display_name || 'Usuário',
            photo_url: currentUserProfile?.photo_url,
            username: currentUserProfile?.username || 'usuario'
          },
          action_url: `/perfil/${currentUserProfile?.username || currentUser.id}`
        },
        read: false
      };

      // Tentar salvar no Supabase primeiro
      if (supabase) {
        const { error } = await supabase
          .from('notifications')
          .insert(notificationData);

        if (!error) {
          console.log('✅ Notificação salva no Supabase');
          return;
        } else {
          console.warn('Erro no Supabase, usando localStorage:', error);
        }
      }

      // Fallback: salvar no localStorage do destinatário (simulação)
      const existingNotifications = JSON.parse(
        localStorage.getItem(`notifications_${profile.id}`) || '[]'
      );

      const newNotification = {
        id: Date.now().toString(),
        type: 'friend_request',
        title: 'Solicitação de amizade',
        message: 'enviou uma solicitação de amizade',
        read: false,
        created_at: new Date().toISOString(),
        from_user: notificationData.payload.from_user
      };

      const updatedNotifications = [newNotification, ...existingNotifications].slice(0, 50);
      localStorage.setItem(`notifications_${profile.id}`, JSON.stringify(updatedNotifications));
      
      console.log('✅ Notificação salva no localStorage');
      
    } catch (error) {
      console.error('Erro ao criar notificação:', error);
    }
  };

  // Função para criar notificação de aceite de amizade
  const createFriendRequestAcceptedNotification = async () => {
    if (!profile?.id || !currentUser?.id) return;

    try {
      console.log('Criando notificação de aceite de amizade...');
      
      const notificationData = {
        profile_id: currentUser.id, // Para quem enviou o pedido
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

      // Tentar salvar no Supabase primeiro
      if (supabase) {
        const { error } = await supabase
          .from('notifications')
          .insert(notificationData);

        if (!error) {
          console.log('✅ Notificação de aceite salva no Supabase');
        }
      }

      // Salvar também no localStorage local (para ver imediatamente)
      const existingNotifications = JSON.parse(
        localStorage.getItem(`notifications_${currentUser.id}`) || '[]'
      );

      const newNotification = {
        id: Date.now().toString(),
        type: 'friend_request_accepted',
        title: 'Pedido aceito',
        message: 'aceitou sua solicitação de amizade',
        read: false,
        created_at: new Date().toISOString(),
        from_user: notificationData.payload.from_user
      };

      const updatedNotifications = [newNotification, ...existingNotifications].slice(0, 50);
      localStorage.setItem(`notifications_${currentUser.id}`, JSON.stringify(updatedNotifications));
      
      // Disparar evento para atualizar o dropdown
      window.dispatchEvent(new CustomEvent('notificationUpdate', {
        detail: { notifications: updatedNotifications }
      }));
      
      console.log('✅ Notificação de aceite criada e evento disparado');
      
    } catch (error) {
      console.error('Erro ao criar notificação de aceite:', error);
    }
  };

  // Função para seguir/deixar de seguir
  const handleFollow = async () => {
    if (!profile?.id || !currentUser?.id) return;
    
    setActionLoading('follow');
    try {
      // Simular ação de seguir
      await new Promise(resolve => setTimeout(resolve, 800));
      setIsFollowing(!isFollowing);
      
      // Notificação visual
      alert(isFollowing ? 'Você não está mais seguindo este usuário.' : 'Agora você está seguindo este usuário!');
    } catch (error) {
      console.error('Erro ao seguir/deixar de seguir:', error);
      alert('Erro na operação. Tente novamente.');
    } finally {
      setActionLoading('');
    }
  };

  // Função para cancelar pedido de amizade
  const handleCancelFriendRequest = async () => {
    if (!profile?.id || !currentUser?.id) return;
    
    setActionLoading('cancel');
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setFriendshipStatus('none');
      alert('Pedido de amizade cancelado.');
    } catch (error) {
      console.error('Erro ao cancelar pedido:', error);
    } finally {
      setActionLoading('');
    }
  };

  // Função para redirecionar para página de mensagens
  const handleOpenMessage = (targetUser: {
    id: string;
    name: string;
    username: string;
    photo?: string;
    isOnline?: boolean;
  }) => {
    // Redirecionar para página de mensagens
    router.push('/mensagens');
  };

  // Função para fechar modal de mensagem
  const handleCloseMessage = () => {
    setMessageModalOpen(false);
    setMessageTarget(null);
  };

  // Função para abrir Gmail com dados preenchidos
  const handleOpenGmail = (email: string, userName: string) => {
    if (!email || isOwnProfile) return; // Não abre Gmail para o próprio perfil
    
    const subject = encodeURIComponent('mensagem vinda do orkut');
    const body = encodeURIComponent(`Olá ${userName},\n\nEspero que esteja bem!\n\nEnviado através do Orkut.\n\nAtenciosamente`);
    const gmailUrl = `https://mail.google.com/mail/u/0/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=${subject}&body=${body}`;
    
    window.open(gmailUrl, '_blank', 'noopener,noreferrer');
  };

  useEffect(() => {
    if (username) {
      loadProfile();
    }
  }, [username]);
  
  // Carregar posts quando o perfil for carregado
  useEffect(() => {
    if (profile?.id || currentUser?.id) {
      loadUserPosts();
    }
  }, [profile?.id, currentUser?.id]);

  // Carregar amigos reais quando o perfil for carregado
  useEffect(() => {
    if (profile?.id && currentUser?.id) {
      loadRealFriends();
      loadRecentConversations();
    }
  }, [profile?.id, currentUser?.id]);
  
  // Listener para novos posts (atualizar perfil quando posts são criados)
  useEffect(() => {
    const handleNewPost = (event: Event) => {
      console.log('📨 Novo post detectado no perfil!', (event as CustomEvent).detail);
      // Recarregar posts do usuário
      if (profile?.id || currentUser?.id) {
        loadUserPosts();
      }
    };
    
    // Listener para atualizações de amizade
    const handleFriendshipUpdate = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const { type, userId, requesterId } = customEvent.detail;
      
      console.log('🔔 Atualização de amizade recebida:', { type, userId, requesterId });
      
      // Se a atualização é relevante para este perfil
      if (profile?.id && currentUser?.id && 
          (userId === profile.id || requesterId === profile.id) && 
          (userId === currentUser.id || requesterId === currentUser.id)) {
        
        console.log('🔄 Recarregando status de amizade...');
        const newStatus = await getFriendshipStatus(profile.id);
        console.log('✨ Novo status:', newStatus);
        setFriendshipStatus(newStatus);
      }
    };

    window.addEventListener('new-post-created', handleNewPost);
    window.addEventListener('friendship-updated', handleFriendshipUpdate);
    
    return () => {
      window.removeEventListener('new-post-created', handleNewPost);
      window.removeEventListener('friendship-updated', handleFriendshipUpdate);
    };
  }, [profile?.id, currentUser?.id]);

  // Função para carregar conversas recentes do banco
  const loadRecentConversations = async () => {
    if (!currentUser?.id) return;
    
    setLoadingConversations(true);
    try {
      console.log('💬 Carregando conversas recentes...');
      
      // Buscar mensagens onde o usuário atual é remetente ou destinatário
      // Agrupadas por conversação e ordenadas por data da última mensagem
      const { data: messages, error } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          created_at,
          from_profile_id,
          to_profile_id,
          read_at,
          from_profile:profiles!from_profile_id(id, username, display_name, photo_url),
          to_profile:profiles!to_profile_id(id, username, display_name, photo_url)
        `)
        .or(`from_profile_id.eq.${currentUser.id},to_profile_id.eq.${currentUser.id}`)
        .order('created_at', { ascending: false })
        .limit(50); // Buscar últimas 50 mensagens para processar

      if (error) {
        console.warn('⚠️ Erro ao carregar mensagens, usando dados de exemplo:', error.message);
        // Usar dados de exemplo se houver erro
        setRecentConversations([
          {
            id: '1',
            userId: 'user1',
            userName: 'Ana Carolina',
            userUsername: 'ana_carolina',
            userPhoto: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=100',
            lastMessage: 'Oi! Como você está?',
            timeAgo: '30min',
            unreadCount: 2,
            isOnline: true
          },
          {
            id: '2',
            userId: 'user2',
            userName: 'Carlos Eduardo',
            userUsername: 'carlos_edu',
            userPhoto: 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=100',
            lastMessage: 'Vamos marcar aquele encontro!',
            timeAgo: '2h',
            unreadCount: 0,
            isOnline: false
          }
        ]);
        return;
      }

      if (!messages || messages.length === 0) {
        console.log('📭 Nenhuma conversa encontrada');
        setRecentConversations([]);
        return;
      }

      // Processar mensagens para criar lista de conversas
      const conversationsMap = new Map();
      
      messages.forEach((message: any) => {
        // Determinar quem é o outro usuário na conversa
        const otherUser = message.from_profile_id === currentUser.id 
          ? message.to_profile 
          : message.from_profile;
          
        const otherUserId = otherUser.id;
        
        // Se já temos uma conversa com este usuário, apenas atualizar se esta mensagem for mais recente
        if (conversationsMap.has(otherUserId)) {
          const existing = conversationsMap.get(otherUserId);
          const existingDate = new Date(existing.lastMessageDate);
          const currentDate = new Date(message.created_at);
          
          if (currentDate > existingDate) {
            // Esta mensagem é mais recente, atualizar
            existing.lastMessage = message.content;
            existing.lastMessageDate = message.created_at;
            existing.timeAgo = formatLastSeen(currentDate);
          }
          
          // Contar mensagens não lidas (enviadas para o usuário atual que ainda não foram lidas)
          if (message.to_profile_id === currentUser.id && !message.read_at) {
            existing.unreadCount += 1;
          }
        } else {
          // Nova conversa
          const timeAgo = formatLastSeen(new Date(message.created_at));
          const unreadCount = (message.to_profile_id === currentUser.id && !message.read_at) ? 1 : 0;
          
          conversationsMap.set(otherUserId, {
            id: otherUserId,
            userId: otherUserId,
            userName: otherUser.display_name,
            userUsername: otherUser.username,
            userPhoto: otherUser.photo_url,
            lastMessage: message.content,
            lastMessageDate: message.created_at,
            timeAgo: timeAgo,
            unreadCount: unreadCount,
            isOnline: Math.random() > 0.5 // Simular status online aleatório
          });
        }
      });

      // Converter Map para Array e ordenar por última mensagem
      const conversations = Array.from(conversationsMap.values())
        .sort((a, b) => new Date(b.lastMessageDate).getTime() - new Date(a.lastMessageDate).getTime())
        .slice(0, 5); // Manter apenas as 5 conversas mais recentes

      console.log(`✅ ${conversations.length} conversas recentes carregadas`);
      setRecentConversations(conversations);
      
    } catch (error) {
      console.error('❌ Erro ao carregar conversas:', error);
      // Usar dados de exemplo em caso de erro
      setRecentConversations([]);
    } finally {
      setLoadingConversations(false);
    }
  };

  // Função para carregar amigos reais do Supabase
  const loadRealFriends = async () => {
    if (!profile?.id || !currentUser?.id) return;
    
    try {
      console.log('👥 Carregando Top 10 Amigos reais...');
      
      const { data, error } = await supabase
        .from('friendships')
        .select(`
          *,
          requester:profiles!requester_id(id, username, display_name, photo_url),
          addressee:profiles!addressee_id(id, username, display_name, photo_url)
        `)
        .or(`requester_id.eq.${profile.id},addressee_id.eq.${profile.id}`)
        .eq('status', 'accepted')
        .order('created_at', { ascending: false })
        .limit(10);

      if (!error && data) {
        const friendsList = data.map(friendship => {
          const friend = friendship.requester_id === profile.id 
            ? friendship.addressee 
            : friendship.requester;
          
          return {
            id: friend.id,
            name: friend.display_name,
            avatar: friend.photo_url
          };
        });
        
        console.log('✅', friendsList.length, 'amigos reais carregados');
        setFriends(friendsList);
      } else {
        console.log('⚠️ Erro ao carregar amigos ou nenhum amigo encontrado');
        setFriends([]);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar Top 10 Amigos:', error);
      setFriends([]);
    }
  };

  // Função para carregar posts do usuário
  const loadUserPosts = async () => {
    const targetUserId = profile?.id || currentUser?.id;
    if (!targetUserId) return;
    
    setLoadingPosts(true);
    try {
      console.log('🔍 Carregando posts do usuário:', profile?.display_name || profile?.username || 'usuário');
      
      // Usar o novo parâmetro profile_posts para carregar apenas posts do usuário
      const response = await fetch(`/api/posts-db?user_id=${targetUserId}&profile_posts=true`, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success && Array.isArray(data.posts)) {
          console.log(`✅ ${data.posts.length} posts do usuário carregados (${data.source})`);
          setUserPosts(data.posts.slice(0, 20)); // Últimos 20 posts
        }
      }
    } catch (error) {
      console.error('❌ Erro ao carregar posts do usuário:', error);
    } finally {
      setLoadingPosts(false);
    }
  };

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Buscando perfil para username:', username);
      console.log('👤 Usuário atual:', { id: currentUser?.id, email: currentUser?.email });

      // Primeiro, tenta buscar no Supabase
      try {
        console.log('🔗 Tentando buscar no Supabase...');
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('username', username)
          .single();

        console.log('📊 Resultado Supabase:', { data, error });
        
        if (!error && data) {
          console.log('✅ Perfil encontrado no Supabase:', data);
          setProfile(data);
          return;
        } else {
          console.log('❌ Erro ou perfil não encontrado no Supabase:', error?.message);
        }
      } catch (supabaseError) {
        console.log('⚠️ Supabase indisponível, usando dados fallback:', supabaseError);
      }

      // Fallback para perfil da Rádio Tatuapé FM
      if (username === 'radiotatuapefm') {
        console.log('🔄 Usando fallback profile para Rádio Tatuapé FM...');
        
        const radioProfile: UserProfile = {
          id: 'radio-tatuape-fm-oficial',
          display_name: 'Rádio Tatuapé FM',
          username: 'radiotatuapefm',
          email: 'radiotatuapefm@gmail.com',
          photo_url: '/logoradiotatuapefm.png',
          phone: '11970603441',
          bio: 'Rádio Tatuapé FM Classic Rock, Hard Rock, 70s, 80s, 90s, Heavy Metal tradicional, Raridades, B-Sides e bandas atuais com influência sonora dos anos 80. Uma jornada abrangente e eclética.',
          location: 'São Paulo, SP',
          birthday: '1995-01-01',
          relationship: 'Solteiro(a)',
          whatsapp_enabled: true,
          whatsapp_voice_link: 'https://wa.me/5511970603441?text=Olá!%20Gostaria%20de%20falar%20com%20vocês%20da%20Rádio%20Tatuapé%20FM',
          whatsapp_video_link: 'https://wa.me/5511970603441?text=Olá!%20Gostaria%20de%20fazer%20uma%20videochamada%20com%20vocês%20da%20Rádio%20Tatuapé%20FM',
          privacy_settings: {
            phone_visibility: 'public',
            email_visibility: 'public'
          },
          fans_count: 0,
          created_at: '2024-01-01T00:00:00Z',
          scrapy_count: 0,
          profile_views: 1247,
          birth_date: '1995-01-01'
        };
        
        console.log('✅ Usando perfil da rádio:', radioProfile);
        setProfile(radioProfile);
        
        return;
      }

      // Fallback: usar dados do contexto de auth se for o próprio usuário
      if (currentUser && (username === 'juliocamposmachado' || username === currentUser.email?.split('@')[0])) {
        console.log('🔄 Usando fallback profile para o usuário atual...');
        
        const fallbackProfile: UserProfile = {
          id: currentUser.id,
          display_name: 'Julio Campos Machado',
          username: 'juliocamposmachado',
          email: 'julio@test.com',
          photo_url: undefined,
          phone: '+5511992946628',
          bio: 'Desenvolvedor apaixonado por tecnologia e criador do Orkut Retrô.',
          location: 'São Paulo, SP',
          birthday: '1990-01-01',
          relationship: 'Solteiro(a)',
          whatsapp_enabled: true,
          privacy_settings: {},
          fans_count: 0,
          created_at: '2024-01-01T00:00:00Z',
          scrapy_count: 0,
          profile_views: 42,
          birth_date: '1990-01-01'
        };
        
        console.log('✅ Usando perfil fallback:', fallbackProfile);
        setProfile(fallbackProfile);
        
        // Tentar criar o perfil no Supabase se não existir
        try {
          console.log('🔧 Tentando criar perfil no Supabase...');
          const { error: insertError } = await supabase
            .from('profiles')
            .upsert({
              id: currentUser.id,
              username: fallbackProfile.username,
              display_name: fallbackProfile.display_name,
              bio: fallbackProfile.bio,
              location: fallbackProfile.location,
              relationship: fallbackProfile.relationship,
              fans_count: 0,
              created_at: new Date().toISOString()
            }, {
              onConflict: 'id'
            });
          
          if (insertError) {
            console.log('⚠️ Erro ao criar perfil no Supabase:', insertError.message);
          } else {
            console.log('✅ Perfil criado/atualizado no Supabase');
          }
        } catch (createError) {
          console.log('⚠️ Erro ao tentar criar perfil:', createError);
        }
        
        return;
      }

      // Se não encontrou nem no Supabase nem é o usuário atual, erro
      console.log('❌ Perfil não encontrado');
      setError('Perfil não encontrado');
      
    } catch (err) {
      console.error('❌ Erro geral ao carregar perfil:', err);
      setError('Erro ao carregar perfil');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatLastSeen = (date: Date | null) => {
    if (!date) return '';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'agora mesmo';
    if (minutes < 60) return `${minutes}min atrás`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h atrás`;
    
    const days = Math.floor(hours / 24);
    return `${days}d atrás`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'busy': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const isOwnProfile = currentUser?.id === profile?.id;
  
  // Debug WhatsApp config
  useEffect(() => {
    if (profile?.id) {
      console.log('📊 Perfil DEBUG:', {
        profileId: profile.id,
        isOwnProfile,
        username: profile.username,
        displayName: profile.display_name,
        userWhatsAppConfig: {
          loading: userWhatsApp.loading,
          error: userWhatsApp.error,
          isEnabled: userWhatsApp.isEnabled,
          hasVoiceLink: userWhatsApp.hasVoiceLink,
          hasVideoLink: userWhatsApp.hasVideoLink,
          hasPhone: userWhatsApp.hasPhone,
          hasGroups: userWhatsApp.hasGroups,
          config: userWhatsApp.config
        }
      });
    }
  }, [profile?.id, isOwnProfile, userWhatsApp]);
  
  // Função para salvar biografia
  const handleSaveBio = async (newBio: string) => {
    if (!profile || !currentUser) {
      console.error('❌ Dados insuficientes para salvar:', { profile: !!profile, currentUser: !!currentUser });
      alert('Erro: Dados do usuário não disponíveis.');
      return;
    }
    
    try {
      console.log('🔄 Iniciando salvamento da biografia...');
      console.log('📝 Nova biografia:', newBio);
      console.log('👤 ID do usuário:', currentUser.id);
      
      // Verificar se o Supabase está configurado
      console.log('🔗 Testando conexão com Supabase...');
      
      // Salvar no Supabase
      const { data, error } = await supabase
        .from('profiles')
        .update({ bio: newBio })
        .eq('id', currentUser.id)
        .select();
      
      console.log('📊 Resposta do Supabase:', { data, error });
      
      if (error) {
        console.error('❌ Erro detalhado do Supabase:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw new Error(`Erro do banco: ${error.message}`);
      }
      
      // Verificar se algum registro foi atualizado
      if (data && data.length === 0) {
        console.warn('⚠️ Nenhum perfil foi atualizado - pode ser que o perfil não exista no banco');
        throw new Error('Perfil não encontrado no banco de dados');
      }
      
      // Atualizar o perfil local apenas após sucesso no banco
      setProfile(prev => prev ? { ...prev, bio: newBio } : null);
      
      console.log('✅ Biografia salva com sucesso!');
      alert('Biografia salva com sucesso!');
      
    } catch (error: any) {
      console.error('❌ Erro ao salvar biografia:', error);
      const errorMessage = error?.message || 'Erro desconhecido';
      alert(`Erro ao salvar biografia: ${errorMessage}`);
    }
  };
  
  // Carregar status de amizade quando o perfil for carregado
  useEffect(() => {
    const loadFriendshipStatus = async () => {
      if (profile?.id && currentUser?.id && !isOwnProfile) {
        console.log('🔄 Carregando status de amizade...');
        const status = await getFriendshipStatus(profile.id);
        console.log('🔗 Status carregado:', status);
        setFriendshipStatus(status);
      }
    };
    
    loadFriendshipStatus();
  }, [profile?.id, currentUser?.id, isOwnProfile]);

  // Quando amizade for aceita, adicionar ao Top 10 Amigos
  useEffect(() => {
    if (friendshipStatus === 'accepted' && profile) {
      setFriends(prev => {
        // já existe?
        if (prev.some(f => f.id === profile.id)) return prev;
        const updated = [{ id: profile.id, name: profile.display_name, avatar: profile.photo_url }, ...prev];
        return updated.slice(0, 10);
      });
    }
  }, [friendshipStatus, profile]);
  const canViewPhone = isOwnProfile || 
    (profile?.privacy_settings?.phone_visibility === 'public') ||
    (profile?.privacy_settings?.phone_visibility === 'friends' && friendshipStatus === 'accepted');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            {error || 'Perfil não encontrado'}
          </h1>
          <Link 
            href="/"
            className="text-purple-600 hover:text-purple-800 underline"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr_300px] xl:grid-cols-[320px_1fr_320px] gap-6">
          
          {/* Left Sidebar - Perfil do Usuário */}
          <div className="space-y-6">
            {/* Profile Card */}
            <OrkutCard>
              <OrkutCardContent>
                <div className="text-center p-4">
                  <Avatar className="h-20 w-20 mx-auto mb-3 border-2 border-purple-200">
                    <AvatarImage 
                      src={profile.photo_url || undefined} 
                      alt={profile.display_name} 
                    />
                    <AvatarFallback className="text-2xl font-bold bg-purple-500 text-white">
                      {profile.display_name?.charAt(0)?.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <h3 className="font-bold text-gray-800 text-lg mb-1">{profile.display_name}</h3>
                  <p className="text-sm text-gray-600 mb-3">@{profile.username}</p>
                  
                  {/* Status Online/Offline Toggle */}
                  <OnlineStatusToggle isOwnProfile={isOwnProfile} className="mb-4" />
                  
                  <p className="text-sm text-gray-700 mb-4">{profile.relationship || 'Solteiro(a)'}</p>
                  
                  {/* Action Buttons */}
                  <div className="space-y-2">
                    {/* Botões de Amizade e Seguir - apenas para outros perfis */}
                    {!isOwnProfile && (
                      <>
                        {/* Botão de Amizade */}
                        {friendshipStatus === 'none' && (
                          <Button 
                            size="sm" 
                            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold shadow-md transition-all"
                            onClick={handleFriendRequest}
                            disabled={actionLoading === 'friend'}
                          >
                            {actionLoading === 'friend' ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                            ) : (
                              <UserPlus className="h-4 w-4 mr-2" />
                            )}
                            Pedir Amizade
                          </Button>
                        )}
                        
                        {friendshipStatus === 'pending' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="w-full border-orange-300 text-orange-600 hover:bg-orange-50"
                            onClick={handleCancelFriendRequest}
                            disabled={actionLoading === 'cancel'}
                          >
                            {actionLoading === 'cancel' ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600 mr-2" />
                            ) : (
                              <Clock className="h-4 w-4 mr-2" />
                            )}
                            Pedido Enviado
                          </Button>
                        )}
                        
                        {friendshipStatus === 'accepted' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="w-full border-green-300 text-green-600 hover:bg-green-50 cursor-default"
                            disabled
                          >
                            <UserCheck className="h-4 w-4 mr-2" />
                            Amigos
                          </Button>
                        )}
                        
                        {/* Botão de Fotos */}
                        <Link href="/fotos">
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="w-full border-purple-300 text-purple-700 hover:bg-purple-50"
                          >
                            <Camera className="h-4 w-4 mr-2" />
                            Fotos
                          </Button>
                        </Link>
                        
                        {/* Botão de Seguir */}
                        <Button 
                          size="sm" 
                          variant="outline"
                          className={`w-full transition-all ${
                            isFollowing 
                              ? 'border-blue-300 bg-blue-50 text-blue-600 hover:bg-blue-100' 
                              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                          onClick={handleFollow}
                          disabled={actionLoading === 'follow'}
                        >
                          {actionLoading === 'follow' ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                          ) : isFollowing ? (
                            <UserCheck className="h-4 w-4 mr-2" />
                          ) : (
                            <UserPlus className="h-4 w-4 mr-2" />
                          )}
                          {isFollowing ? 'Seguindo' : 'Seguir'}
                        </Button>
                        
                        {/* Botão de Enviar Mensagem */}
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="w-full border-purple-300 text-purple-700 hover:bg-purple-50"
                          onClick={() => handleOpenMessage({
                            id: profile.id,
                            name: profile.display_name,
                            username: profile.username,
                            photo: profile.photo_url,
                            isOnline: isOnline
                          })}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Enviar Mensagem
                        </Button>
                        
                        {/* Botões de Chamada do Sistema Orkut - mantidos originais */}
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="w-full border-blue-300 text-blue-700 hover:bg-blue-50"
                          onClick={() => startAudioCall({
                            id: profile.id,
                            name: profile.display_name,
                            photo: profile.photo_url || undefined,
                            username: profile.username
                          })}
                        >
                          <Phone className="h-4 w-4 mr-2" />
                          Chamada de Áudio
                        </Button>
                        
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="w-full border-blue-300 text-blue-700 hover:bg-blue-50"
                          onClick={() => startVideoCall({
                            id: profile.id,
                            name: profile.display_name,
                            photo: profile.photo_url || undefined,
                            username: profile.username
                          })}
                        >
                          <Video className="h-4 w-4 mr-2" />
                          Chamada de Vídeo
                        </Button>
                      </>
                    )}
                    
                    {/* Botões WhatsApp ADICIONAIS - Seção separada que só aparece se configurado */}
                    {userWhatsApp.hasValidConfig() && (
                      <>
                        <div className="border-t pt-3 mt-3">
                          <div className="text-xs text-gray-500 mb-2 text-center font-medium flex items-center justify-center">
                            <span className="mr-1">📱</span>
                            Contato WhatsApp
                          </div>
                        </div>
                        
                        {/* Botão WhatsApp Áudio */}
                        {userWhatsApp.hasVoiceLink && (
                          <Button 
                            size="sm"
                            variant="outline" 
                            className="w-full border-green-300 text-green-700 hover:bg-green-50 bg-green-50"
                            onClick={() => {
                              const validLinks = userWhatsApp.getValidLinks();
                              if (validLinks.voice) {
                                window.open(validLinks.voice, '_blank', 'noopener,noreferrer');
                              }
                            }}
                            title="Abrir chamada de voz no WhatsApp"
                          >
                            <Phone className="h-4 w-4 mr-2" />
                            📞 WhatsApp Áudio
                          </Button>
                        )}
                        
                        {/* Botão WhatsApp Vídeo */}
                        {userWhatsApp.hasVideoLink && (
                          <Button 
                            size="sm"
                            variant="outline" 
                            className="w-full border-green-300 text-green-700 hover:bg-green-50 bg-green-50"
                            onClick={() => {
                              const validLinks = userWhatsApp.getValidLinks();
                              if (validLinks.video) {
                                window.open(validLinks.video, '_blank', 'noopener,noreferrer');
                              }
                            }}
                            title="Abrir videochamada no WhatsApp"
                          >
                            <Video className="h-4 w-4 mr-2" />
                            📹 WhatsApp Vídeo
                          </Button>
                        )}
                        
                        {/* Botão WhatsApp Mensagem */}
                        {userWhatsApp.hasPhone && (
                          <Button 
                            size="sm"
                            variant="outline" 
                            className="w-full border-green-300 text-green-700 hover:bg-green-50 bg-green-50"
                            onClick={() => {
                              const validLinks = userWhatsApp.getValidLinks();
                              if (validLinks.phone) {
                                window.open(`https://wa.me/${validLinks.phone}?text=Vim+do+Orkut,+Tudo+bem+?`, '_blank', 'noopener,noreferrer');
                              }
                            }}
                            title="Enviar mensagem pelo WhatsApp"
                          >
                            <MessageCircle className="h-4 w-4 mr-2" />
                            💬 WhatsApp Mensagem
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </OrkutCardContent>
            </OrkutCard>
            
            {/* Histórico de Conversas */}
            <OrkutCard>
              <OrkutCardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MessageCircle className="h-4 w-4" />
                    <span>Conversas Recentes</span>
                  </div>
                  <Link href="/mensagens">
                    <Button size="sm" variant="ghost" className="text-xs text-purple-600 hover:bg-purple-50">
                      Ver todas
                    </Button>
                  </Link>
                </div>
              </OrkutCardHeader>
              <OrkutCardContent>
                {recentConversations.length === 0 ? (
                  <div className="text-center py-4">
                    <MessageCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 mb-2">
                      Nenhuma conversa recente
                    </p>
                    <p className="text-xs text-gray-400">
                      Inicie uma conversa enviando uma mensagem
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentConversations.slice(0, 3).map((conversation) => (
                      <div key={conversation.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                           onClick={() => handleOpenMessage({
                             id: conversation.userId,
                             name: conversation.userName,
                             username: conversation.userUsername || '',
                             photo: conversation.userPhoto,
                             isOnline: conversation.isOnline || false
                           })}>
                        <div className="relative">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={conversation.userPhoto} alt={conversation.userName} />
                            <AvatarFallback className="text-sm bg-purple-500 text-white">
                              {conversation.userName.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {conversation.isOnline && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900 truncate">{conversation.userName}</p>
                            <p className="text-xs text-gray-500">{conversation.timeAgo}</p>
                          </div>
                          <p className="text-xs text-gray-600 truncate">
                            {conversation.lastMessage}
                          </p>
                          {conversation.unreadCount > 0 && (
                            <div className="mt-1">
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                {conversation.unreadCount} nova{conversation.unreadCount > 1 ? 's' : ''}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </OrkutCardContent>
            </OrkutCard>
            
            {/* Fotos Recentes */}
            <OrkutCard>
              <OrkutCardHeader>
                <div className="flex items-center space-x-2">
                  <Camera className="h-4 w-4" />
                  <span>Fotos Recentes</span>
                </div>
              </OrkutCardHeader>
              <OrkutCardContent>
                <div className="grid grid-cols-3 gap-2">
                  {recentPhotos.slice(0, 6).map((photo, idx) => (
                    <div key={photo.id || idx} className="aspect-square bg-gray-200 rounded-md overflow-hidden group relative">
                      <img 
                        src={photo.url}
                        alt={photo.title}
                        className="w-full h-full object-cover hover:opacity-80 transition-opacity cursor-pointer"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-end">
                        <div className="text-white text-xs p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {photo.title}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </OrkutCardContent>
            </OrkutCard>
          </div>

          {/* Main Content Area - Central */}
          <div className="space-y-6">
            {/* Profile Info Card - Movido para o topo */}
            <OrkutCard>
              <OrkutCardHeader>
                <div className="flex items-center space-x-2">
                  <Globe className="h-4 w-4" />
                  <span>Sobre {profile.display_name}</span>
                </div>
              </OrkutCardHeader>
              <OrkutCardContent>
                <div className="space-y-4">
                  <BioEditor 
                    bio={profile.bio} 
                    isOwnProfile={isOwnProfile} 
                    onSave={handleSaveBio} 
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail size={14} className="text-purple-500" />
                        {!isOwnProfile ? (
                          <span 
                            className="text-gray-700 cursor-pointer hover:text-purple-600 hover:underline transition-colors"
                            onClick={() => handleOpenGmail(profile.email, profile.display_name)}
                            title="Clique para enviar um email"
                          >
                            {profile.email}
                          </span>
                        ) : (
                          <span className="text-gray-700">{profile.email}</span>
                        )}
                      </div>
                      
                      {profile.location && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin size={14} className="text-purple-500" />
                          <span className="text-gray-700">{profile.location}</span>
                        </div>
                      )}
                      
                      {canViewPhone && profile.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone size={14} className="text-purple-500" />
                          <span className="text-gray-700">{profile.phone}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Heart size={14} className="text-purple-500" />
                        <span className="text-gray-700">{profile.relationship || 'Solteiro(a)'}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <Clock size={14} className="text-purple-500" />
                        <span className="text-gray-700 capitalize">
                          {isOnline ? status : 'Offline'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </OrkutCardContent>
            </OrkutCard>
            
            {/* Quick Actions Card - Movido para depois de Sobre */}
            {isOwnProfile && (
              <OrkutCard>
                <OrkutCardHeader>
                  <div className="flex items-center space-x-2">
                    <Settings className="h-4 w-4" />
                    <span>Ações Rápidas</span>
                  </div>
                </OrkutCardHeader>
                <OrkutCardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      variant="outline" 
                      className="border-purple-300 text-purple-700 hover:bg-purple-50"
                      onClick={() => {
                        // Funcionalidade de adicionar foto pode ser implementada futuramente
                        alert('Funcionalidade em desenvolvimento!');
                      }}
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Adicionar Foto
                    </Button>
                    <Link href="/">
                      <Button variant="outline" className="w-full border-purple-300 text-purple-700 hover:bg-purple-50">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Criar Post
                      </Button>
                    </Link>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Use a página inicial para criar e ver posts dos seus amigos
                  </p>
                </OrkutCardContent>
              </OrkutCard>
            )}
            
            {/* WhatsApp Configuration Card - apenas para o dono do perfil */}
            {isOwnProfile && (
              <WhatsAppConfig 
                isOwnProfile={true}
              />
            )}
            
            {/* Grupos WhatsApp - apenas para visitantes se o usuário tiver grupos configurados */}
            {!isOwnProfile && userWhatsApp.hasGroups && (
              <OrkutCard>
                <OrkutCardHeader>
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-green-600" />
                    <span>Grupos WhatsApp de {profile.display_name}</span>
                  </div>
                </OrkutCardHeader>
                <OrkutCardContent>
                  <div className="space-y-2">
                    {userWhatsApp.getValidLinks().groups.map((group, index) => (
                      <Button
                        key={index}
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(group.link, '_blank', 'noopener,noreferrer')}
                        className="w-full justify-start text-left bg-green-50 border-green-200 hover:bg-green-100"
                      >
                        <Users className="h-4 w-4 mr-2 text-green-600" />
                        <span className="truncate">{group.name}</span>
                        <span className="ml-auto text-xs text-green-600">Entrar →</span>
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-3 text-center">
                    Clique para entrar nos grupos do WhatsApp
                  </p>
                </OrkutCardContent>
              </OrkutCard>
            )}
            
            {/* Sistema de Galerias */}
            <Gallery 
              galleries={demoGalleries}
              isOwner={isOwnProfile}
              onCreateGallery={() => alert('Função criar galeria será implementada!')}
              onAddPhoto={(galleryId) => {
                // Simular seleção de arquivo
                const input = document.createElement('input');
                input.type = 'file';
                input.multiple = true;
                input.accept = 'image/*';
                input.onchange = (e) => {
                  const files = (e.target as HTMLInputElement).files;
                  if (files) {
                    handleAddPhotoToGallery(galleryId, Array.from(files));
                  }
                };
                input.click();
              }}
            />
            
            {/* Painel de Gerenciamento de Galerias - apenas para o dono do perfil */}
            {isOwnProfile && (
              <UpdateGalleries
                galleries={demoGalleries}
                userId={profile.id}
                onCreateGallery={handleCreateGallery}
                onUpdateGallery={handleUpdateGallery}
                onDeleteGallery={handleDeleteGallery}
                onAddPhotoToGallery={handleAddPhotoToGallery}
              />
            )}
            
            {/* Recent Activities */}
            <OrkutCard>
              <OrkutCardHeader>
                <div className="flex items-center space-x-2">
                  <MessageCircle className="h-4 w-4" />
                  <span>Atividades Recentes</span>
                </div>
              </OrkutCardHeader>
              <OrkutCardContent>
                <RecentActivities 
                  profileId={profile.id}
                  userProfile={{
                    id: profile.id,
                    display_name: profile.display_name,
                    photo_url: profile.photo_url,
                    username: profile.username
                  }}
                  loading={loading}
                />
              </OrkutCardContent>
            </OrkutCard>
            
            {/* Scraps */}
            <OrkutCard>
              <OrkutCardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Heart className="h-4 w-4" />
                    <span>Scraps ({profile.scrapy_count || 0})</span>
                  </div>
                  {!isOwnProfile && (
                    <Button size="sm" className="bg-purple-500 hover:bg-purple-600 text-white">
                      Enviar Scrap
                    </Button>
                  )}
                </div>
              </OrkutCardHeader>
              <OrkutCardContent>
                <div className="text-center py-8 text-gray-500">
                  <p>Nenhum scrap ainda</p>
                  <p className="text-sm">{isOwnProfile ? 'Seus amigos podem enviar scraps aqui!' : 'Seja o primeiro a enviar um scrap!'}</p>
                </div>
              </OrkutCardContent>
            </OrkutCard>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Amigos Online */}
            <OnlineFriends 
              onOpenMessage={handleOpenMessage}
              onStartAudioCall={startAudioCall}
            />
            
            {/* Minhas Comunidades */}
            <OrkutCard>
              <OrkutCardHeader>
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>Minhas Comunidades</span>
                </div>
              </OrkutCardHeader>
              <OrkutCardContent>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { name: 'Humor', icon: '😂' },
                    { name: 'Música', icon: '🎵' },
                    { name: 'Tecnologia', icon: '💻' },
                    { name: 'Nostalgia d...', icon: '📼' }
                  ].map((community, idx) => (
                    <div key={idx} className="text-center p-2 rounded-lg hover:bg-purple-50 transition-colors cursor-pointer">
                      <div className="w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-2 flex items-center justify-center text-lg">
                        {community.icon}
                      </div>
                      <p className="text-xs text-gray-600 truncate">{community.name}</p>
                    </div>
                  ))}
                </div>
              </OrkutCardContent>
            </OrkutCard>
            
            {/* Top 10 Amigos */}
            <OrkutCard>
              <OrkutCardHeader>
                <div className="flex items-center space-x-2">
                  <Heart className="h-4 w-4" />
                  <span>Top 10 Amigos</span>
                </div>
              </OrkutCardHeader>
              <OrkutCardContent>
                <div className="grid grid-cols-2 gap-3">
                  {friends.map((friend, idx) => (
                    <div key={friend.id || idx} className="text-center">
                      <img 
                        src={friend.avatar || `https://images.pexels.com/photos/${220000 + idx}/pexels-photo-${220000 + idx}.jpeg?auto=compress&cs=tinysrgb&w=80`}
                        alt={friend.name}
                        className="w-12 h-12 rounded-full mx-auto mb-1 object-cover hover:opacity-90 transition-opacity cursor-pointer border-2 border-purple-200"
                      />
                      <p className="text-xs text-gray-600 truncate">{friend.name}</p>
                    </div>
                  ))}
                </div>
              </OrkutCardContent>
            </OrkutCard>
          </div>
        </div>
      </div>
      
      <Footer />
      
      {/* Modal de Chamada */}
      {callState.isOpen && callState.targetUser && callState.callType && (
        <CallModal
          isOpen={callState.isOpen}
          onClose={endCall}
          callType={callState.callType}
          targetUser={callState.targetUser}
        />
      )}
      
      {/* Modal de Mensagem */}
      {messageModalOpen && messageTarget && (
        <MessageModal
          isOpen={messageModalOpen}
          onClose={handleCloseMessage}
          targetUser={messageTarget}
        />
      )}
    </div>
  );
};

const ProfilePage: React.FC = () => {
  const params = useParams();
  const username = params?.username as string;
  
  // Fallback simples sem FriendsProvider que pode estar causando erro
  return <ProfileContent username={username} />;
};

export default ProfilePage;
