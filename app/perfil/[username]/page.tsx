'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Calendar, MapPin, Globe, Mail } from 'lucide-react';
import Link from 'next/link';

interface UserProfile {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar_url?: string;
  phone?: string;
  whatsapp_enabled: boolean;
  privacy_settings: any;
  created_at: string;
  bio?: string;
  location?: string;
  relationship?: string;
  website?: string;
  fans_count?: number;
  views_count?: number;
}

const ProfileContent: React.FC<{ username: string }> = ({ username }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Valores mock para status online
  const isOnline = false;
  const status = 'offline';
  const lastSeen = null;

  useEffect(() => {
    if (username) {
      loadProfile();
    }
  }, [username]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      // Usar consulta direta na tabela profiles
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          display_name,
          username,
          photo_url,
          bio,
          location,
          relationship,
          fans_count,
          created_at
        `)
        .eq('username', username)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          setError('Perfil não encontrado');
          return;
        }
        throw error;
      }

      if (!data) {
        setError('Perfil não encontrado');
        return;
      }

      // Mapear dados para a interface UserProfile
      const mappedProfile: UserProfile = {
        id: data.id,
        name: data.display_name,
        username: data.username,
        email: 'zarzamorera@gmail.com', // Temporário até corrigir no banco
        avatar_url: data.photo_url,
        phone: undefined,
        whatsapp_enabled: false,
        privacy_settings: {},
        created_at: data.created_at,
        bio: data.bio,
        location: data.location,
        relationship: data.relationship,
        website: undefined,
        fans_count: data.fans_count,
        views_count: 0
      };
      
      setProfile(mappedProfile);
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

  const isOwnProfile = false; // Simplificado para visualização pública
  const canViewPhone = true; // Permitir visualização para demo

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
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-pink-100">
      {/* Navbar temporariamente removida para debug */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 text-white text-center">
        <h1 className="text-2xl font-bold">Orkut Retrô</h1>
        <p>Perfil de {profile?.name}</p>
      </div>
      <div className="container mx-auto px-4 py-8">
        {/* Header do perfil */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-8 text-white">
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Avatar */}
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-white/20 flex items-center justify-center text-4xl font-bold overflow-hidden">
                  {profile.avatar_url ? (
                    <img 
                      src={profile.avatar_url} 
                      alt={profile.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    profile.name?.charAt(0)?.toUpperCase() || '?'
                  )}
                </div>
                
                {/* Indicador de status online */}
                <div className={`absolute bottom-2 right-2 w-6 h-6 rounded-full border-2 border-white ${getStatusColor(status)}`} />
              </div>

              {/* Informações básicas */}
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl font-bold mb-2">{profile.name}</h1>
                <p className="text-xl opacity-90 mb-2">@{profile.username}</p>
                
                <div className="flex items-center justify-center md:justify-start gap-2 text-sm opacity-80">
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(status)}`} />
                  <span className="capitalize">
                    {isOnline ? status : `Offline • ${formatLastSeen(lastSeen)}`}
                  </span>
                </div>

                <div className="flex items-center justify-center md:justify-start gap-2 mt-2 text-sm opacity-80">
                  <Calendar size={16} />
                  <span>Membro desde {formatDate(profile.created_at)}</span>
                </div>
              </div>

              {/* Botões de ação simplificados */}
              <div className="flex flex-col gap-3">
                <div className="bg-white/20 px-4 py-2 rounded-lg text-center">
                  <p className="text-sm">Perfil Público</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Conteúdo do perfil */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coluna principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Sobre */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Globe size={20} />
                Sobre
              </h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail size={16} className="text-gray-500" />
                  <span className="text-gray-700">{profile.email}</span>
                </div>
                
                {canViewPhone && profile.phone && (
                  <div className="flex items-center gap-3">
                    <div className="text-gray-500">📱</div>
                    <span className="text-gray-700">{profile.phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Posts/Atividades - Placeholder */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Atividades Recentes
              </h2>
              <div className="text-center py-8 text-gray-500">
                <p>Em breve: posts, fotos e atividades do usuário</p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Estatísticas */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Estatísticas</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Amigos</span>
                  <span className="font-semibold">Em breve</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Comunidades</span>
                  <span className="font-semibold">Em breve</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Scraps</span>
                  <span className="font-semibold">Em breve</span>
                </div>
              </div>
            </div>

            {/* Amigos recentes - Placeholder */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Amigos</h3>
              <div className="text-center py-4 text-gray-500">
                <p>Lista de amigos em breve</p>
              </div>
            </div>

            {/* Comunidades - Placeholder */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Comunidades</h3>
              <div className="text-center py-4 text-gray-500">
                <p>Comunidades em breve</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProfilePage: React.FC = () => {
  const params = useParams();
  const username = params?.username as string;
  
  return <ProfileContent username={username} />;
};

export default ProfilePage;
