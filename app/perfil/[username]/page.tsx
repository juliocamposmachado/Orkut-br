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

const ProfileContent: React.FC<{ username: string }> = ({ username }) => {
  const { user: currentUser } = useAuth();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [friendshipStatus, setFriendshipStatus] = useState<string>('none');
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<string>('');
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [friends, setFriends] = useState<FriendItem[]>(() =>
    Array.from({ length: 8 }).map((_, idx) => ({
      id: `placeholder-${idx}`,
      name: `Amigo ${idx + 1}`,
      avatar: `https://images.pexels.com/photos/${220000 + idx}/pexels-photo-${220000 + idx}.jpeg?auto=compress&cs=tinysrgb&w=80`
    }))
  );
  
  // Fotos do usuário baseadas no perfil
  const userPhotos = profile ? getUserPhotos(profile.username) : null;
  const displayPhotos = userPhotos?.photos || getDefaultPhotos();
  const recentPhotos = getRecentPhotos(6);
  
  // Fallback para status online
  const isOnline = true;
  const status = 'online';
  
  // Função simples para verificar status de amizade
  const getFriendshipStatus = (userId: string) => {
    // Fallback simples - sempre retorna 'none'
    return 'none';
  };

  // Função para enviar pedido de amizade
  const handleFriendRequest = async () => {
    if (!profile?.id || !currentUser?.id) return;
    
    setActionLoading('friend');
    try {
      // Simular envio do pedido de amizade
      await new Promise(resolve => setTimeout(resolve, 1000));
      setFriendshipStatus('pending');
      
      // Simular resposta automática após 3 segundos para demonstração
      setTimeout(() => {
        setFriendshipStatus('accepted');
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
  
  // Listener para novos posts (atualizar perfil quando posts são criados)
  useEffect(() => {
    const handleNewPost = (event: Event) => {
      console.log('📨 Novo post detectado no perfil!', (event as CustomEvent).detail);
      // Recarregar posts do usuário
      if (profile?.id || currentUser?.id) {
        loadUserPosts();
      }
    };

    window.addEventListener('new-post-created', handleNewPost);
    return () => window.removeEventListener('new-post-created', handleNewPost);
  }, [profile?.id, currentUser?.id]);

  // Função para carregar posts do usuário
  const loadUserPosts = async () => {
    if (!profile?.id && !currentUser?.id) return;
    
    setLoadingPosts(true);
    try {
      console.log('🔍 Carregando posts do usuário:', profile?.display_name || profile?.username || 'usuário');
      
      const response = await fetch(`/api/posts-db`, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success && Array.isArray(data.posts)) {
          // Filtrar posts apenas deste usuário
          const currentUserId = profile?.id || currentUser?.id;
          const userSpecificPosts = data.posts.filter((post: any) => 
            post.author === currentUserId || 
            post.author === username || 
            (currentUser && post.author === currentUser.id)
          );
          
          console.log(`✅ Posts do usuário carregados:`, userSpecificPosts.length);
          setUserPosts(userSpecificPosts.slice(0, 10)); // Últimos 10 posts
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

      console.log('Buscando perfil para username:', username);

      // Primeiro, tenta buscar no Supabase
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('username', username)
          .single();

        if (!error && data) {
          console.log('Perfil encontrado no Supabase:', data);
          setProfile(data);
          return;
        }
      } catch (supabaseError) {
        console.log('Supabase indisponível, usando dados fallback');
      }

      // Fallback: usar dados do contexto de auth se for o próprio usuário
      if (currentUser && username === 'juliocamposmachado') {
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
        
        console.log('Usando perfil fallback:', fallbackProfile);
        setProfile(fallbackProfile);
        return;
      }

      // Se não encontrou nem no Supabase nem é o usuário atual, erro
      setError('Perfil não encontrado');
      
    } catch (err) {
      console.error('Erro ao carregar perfil:', err);
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
  
  // Carregar status de amizade quando o perfil for carregado
  useEffect(() => {
    if (profile?.id && currentUser?.id && !isOwnProfile) {
      const status = getFriendshipStatus(profile.id);
      setFriendshipStatus(status);
    }
  }, [profile?.id, currentUser?.id, getFriendshipStatus, isOwnProfile]);

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
                  
                  {/* User Status/Mood - apenas no próprio perfil */}
                  {isOwnProfile && (
                    <div className="mb-4">
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        😊 Online
                      </Badge>
                    </div>
                  )}
                  
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
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Enviar Mensagem
                        </Button>
                      </>
                    )}
                    
                    {/* Botões de Chamada - para todos */}
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="w-full border-purple-300 text-purple-700 hover:bg-purple-50"
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      Chamada de Áudio
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="w-full border-purple-300 text-purple-700 hover:bg-purple-50"
                    >
                      <Video className="h-4 w-4 mr-2" />
                      Chamada de Vídeo
                    </Button>
                  </div>
                </div>
              </OrkutCardContent>
            </OrkutCard>
            
            {/* Aniversários */}
            <OrkutCard>
              <OrkutCardHeader>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>Aniversários</span>
                </div>
              </OrkutCardHeader>
              <OrkutCardContent>
                <div className="text-center py-4">
                  <p className="text-sm text-gray-600 mb-2">
                    🎂 Hoje é aniversário do Paulo!
                  </p>
                  <p className="text-xs text-gray-500 mb-3">
                    Ele faz 55 anos
                  </p>
                  <Button size="sm" className="bg-purple-500 hover:bg-purple-600">
                    Parabenizar
                  </Button>
                </div>
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
            {/* Quick Actions Card */}
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
            
            {/* Profile Info Card */}
            <OrkutCard>
              <OrkutCardHeader>
                <div className="flex items-center space-x-2">
                  <Globe className="h-4 w-4" />
                  <span>Sobre {profile.display_name}</span>
                </div>
              </OrkutCardHeader>
              <OrkutCardContent>
                <div className="space-y-4">
                  {profile.bio ? (
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2">Sobre mim:</h4>
                      <p className="text-gray-700">{profile.bio}</p>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      <p>{isOwnProfile ? 'Adicione uma biografia ao seu perfil!' : 'Este usuário ainda não adicionou uma biografia.'}</p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail size={14} className="text-purple-500" />
                        <span className="text-gray-700">{profile.email}</span>
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
            
            {/* Profile Photos */}
            <OrkutCard>
              <OrkutCardHeader>
                <div className="flex items-center space-x-2">
                  <Camera className="h-4 w-4" />
                  <span>Fotos ({displayPhotos.length})</span>
                </div>
              </OrkutCardHeader>
              <OrkutCardContent>
                <div className="grid grid-cols-3 gap-2">
                  {displayPhotos.slice(0, 6).map((photo, idx) => (
                    <div key={photo.id || idx} className="aspect-square bg-gray-200 rounded-md overflow-hidden group relative">
                      <img 
                        src={photo.url}
                        alt={photo.title}
                        className="w-full h-full object-cover hover:opacity-90 transition-all duration-200 cursor-pointer group-hover:scale-105"
                      />
                      {/* Overlay com informações */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-end">
                        <div className="text-white p-2 w-full">
                          <p className="text-xs font-medium truncate">{photo.title}</p>
                          {photo.description && (
                            <p className="text-[10px] text-gray-300 truncate">{photo.description}</p>
                          )}
                        </div>
                      </div>
                      {/* Badge da categoria */}
                      {photo.category && (
                        <div className="absolute top-1 right-1 bg-purple-500 text-white text-[8px] px-1 py-0.5 rounded opacity-0 group-hover:opacity-90 transition-opacity">
                          {photo.category}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full mt-3 border-purple-300 text-purple-700 hover:bg-purple-50"
                >
                  Ver Todas as {displayPhotos.length} Fotos
                </Button>
              </OrkutCardContent>
            </OrkutCard>
            
            {/* Recent Posts/Activities */}
            <OrkutCard>
              <OrkutCardHeader>
                <div className="flex items-center space-x-2">
                  <MessageCircle className="h-4 w-4" />
                  <span>Atividades Recentes ({userPosts.length})</span>
                </div>
              </OrkutCardHeader>
              <OrkutCardContent>
                {loadingPosts ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-500">Carregando atividades...</p>
                  </div>
                ) : userPosts.length > 0 ? (
                  <div className="space-y-4">
                    {userPosts.map((post) => (
                      <div key={post.id} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start space-x-3">
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarImage 
                              src={post.author_photo || profile.photo_url || undefined} 
                              alt={post.author_name || profile.display_name} 
                            />
                            <AvatarFallback className="text-xs bg-purple-500 text-white">
                              {(post.author_name || profile.display_name)?.charAt(0)?.toUpperCase() || '?'}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className="font-medium text-sm text-gray-800 truncate">
                                {post.author_name || profile.display_name}
                              </h4>
                              <span className="text-xs text-gray-500">
                                {new Date(post.created_at).toLocaleDateString('pt-BR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: '2-digit'
                                })}
                              </span>
                            </div>
                            
                            <p className="text-sm text-gray-700 mb-2 break-words">
                              {post.content}
                            </p>
                            
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span className="flex items-center space-x-1">
                                <Heart className="h-3 w-3" />
                                <span>{post.likes_count || 0}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <MessageCircle className="h-3 w-3" />
                                <span>{post.comments_count || 0}</span>
                              </span>
                              {post.shares_count > 0 && (
                                <span className="flex items-center space-x-1">
                                  <Send className="h-3 w-3" />
                                  <span>{post.shares_count}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {userPosts.length >= 10 && (
                      <div className="text-center pt-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="border-purple-300 text-purple-700 hover:bg-purple-50"
                          onClick={() => alert('Funcionalidade de "Ver Mais" será implementada!')}
                        >
                          Ver Mais Posts
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="mb-2">
                      {isOwnProfile 
                        ? 'Você ainda não fez nenhum post!' 
                        : `${profile.display_name} ainda não fez posts`}
                    </p>
                    <p className="text-sm">
                      {isOwnProfile 
                        ? 'Que tal criar seu primeiro post?' 
                        : 'Volte depois para ver as novidades!'}
                    </p>
                    {isOwnProfile && (
                      <Link href="/">
                        <Button 
                          size="sm"
                          className="mt-3 bg-purple-500 hover:bg-purple-600"
                        >
                          Criar Meu Primeiro Post
                        </Button>
                      </Link>
                    )}
                  </div>
                )}
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
            {/* Comunidades em Alta */}
            <OrkutCard>
              <OrkutCardHeader>
                <div className="flex items-center space-x-2">
                  <Star className="h-4 w-4" />
                  <span>Comunidades em Alta</span>
                </div>
              </OrkutCardHeader>
              <OrkutCardContent>
                <div className="space-y-3">
                  {[
                    { name: 'Humor', members: '5.600 membros', icon: '😂' },
                    { name: 'Música', members: '3.420 membros', icon: '🎵' },
                    { name: 'Tecnologia', members: '2.800 membros', icon: '💻' },
                    { name: 'Nostalgia dos Anos 2000', members: '1.250 membros', icon: '📼' }
                  ].map((community, idx) => (
                    <div key={idx} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-purple-50 transition-colors cursor-pointer">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-lg">
                        {community.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm text-gray-800 truncate">
                          {community.name}
                        </h4>
                        <p className="text-xs text-gray-600">
                          {community.members}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full mt-3 border-purple-300 text-purple-700 hover:bg-purple-50"
                >
                  Ver Todas
                </Button>
              </OrkutCardContent>
            </OrkutCard>
            
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
