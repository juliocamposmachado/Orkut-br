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
  Clock
} from 'lucide-react';
import Link from 'next/link';

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

const ProfileContent: React.FC<{ username: string }> = ({ username }) => {
  const { user: currentUser } = useAuth();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [friendshipStatus, setFriendshipStatus] = useState<string>('none');
  
  // Fallback para status online
  const isOnline = true;
  const status = 'online';
  
  // Função simples para verificar status de amizade
  const getFriendshipStatus = (userId: string) => {
    // Fallback simples - sempre retorna 'none'
    return 'none';
  };

  useEffect(() => {
    if (username) {
      loadProfile();
    }
  }, [username]);

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
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <div key={idx} className="aspect-square bg-gray-200 rounded-md overflow-hidden">
                      <img 
                        src={`https://images.pexels.com/photos/${1000000 + idx}/pexels-photo-${1000000 + idx}.jpeg?auto=compress&cs=tinysrgb&w=100`}
                        alt={`Foto ${idx + 1}`}
                        className="w-full h-full object-cover hover:opacity-80 transition-opacity cursor-pointer"
                      />
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
                  <span>Fotos (0)</span>
                </div>
              </OrkutCardHeader>
              <OrkutCardContent>
                <div className="grid grid-cols-3 gap-2">
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <div key={idx} className="aspect-square bg-gray-200 rounded-md overflow-hidden">
                      <img 
                        src={`https://images.pexels.com/photos/${400000 + idx}/pexels-photo-${400000 + idx}.jpeg?auto=compress&cs=tinysrgb&w=100`}
                        alt={`Foto ${idx + 1}`}
                        className="w-full h-full object-cover hover:opacity-80 transition-opacity cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full mt-3 border-purple-300 text-purple-700 hover:bg-purple-50"
                >
                  Ver Todas as Fotos
                </Button>
              </OrkutCardContent>
            </OrkutCard>
            
            {/* Recent Posts/Activities */}
            <OrkutCard>
              <OrkutCardHeader>
                <div className="flex items-center space-x-2">
                  <MessageCircle className="h-4 w-4" />
                  <span>Atividades Recentes</span>
                </div>
              </OrkutCardHeader>
              <OrkutCardContent>
                <div className="text-center py-8 text-gray-500">
                  <p className="mb-4">Nenhuma atividade recente</p>
                  <p className="text-sm">Em breve: posts, fotos e scraps!</p>
                </div>
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
                  {Array.from({ length: 8 }).map((_, idx) => (
                    <div key={idx} className="text-center">
                      <img 
                        src={`https://images.pexels.com/photos/${220000 + idx}/pexels-photo-${220000 + idx}.jpeg?auto=compress&cs=tinysrgb&w=80`}
                        alt={`Amigo ${idx + 1}`}
                        className="w-12 h-12 rounded-full mx-auto mb-1 object-cover hover:opacity-80 transition-opacity cursor-pointer border-2 border-purple-200"
                      />
                      <p className="text-xs text-gray-600 truncate">Amigo {idx + 1}</p>
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
