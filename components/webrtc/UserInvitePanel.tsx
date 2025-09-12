'use client';

import { useState, useEffect } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Users, 
  Search, 
  UserPlus, 
  Clock, 
  CheckCircle, 
  XCircle,
  Loader2,
  Wifi,
  WifiOff,
  Phone,
  Video,
  X
} from 'lucide-react';
import { toast } from 'sonner';

interface User {
  id: string;
  username: string;
  display_name: string;
  photo_url?: string;
  is_online: boolean;
  last_seen: string;
  call_availability: 'available' | 'busy' | 'unavailable';
}

interface Invite {
  id: string;
  invited_user_id: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  created_at: string;
}

interface UserInvitePanelProps {
  roomId: string;
  userId: string;
  callType: 'individual' | 'group';
  isOpen: boolean;
  onClose: () => void;
}

export default function UserInvitePanel({
  roomId,
  userId,
  callType,
  isOpen,
  onClose
}: UserInvitePanelProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [invitingUsers, setInvitingUsers] = useState<Set<string>>(new Set());

  // Buscar usuários disponíveis
  const fetchUsers = async (search = '') => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const params = new URLSearchParams({
        userId,
        limit: '50'
      });
      
      if (search.trim()) {
        params.set('search', search.trim());
      }

      const response = await fetch(`/api/calls/users?${params}`);
      const data = await response.json();

      if (data.users) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  // Buscar convites existentes para a sala
  const fetchInvites = async () => {
    if (!roomId) return;

    try {
      const response = await fetch(`/api/calls/invites?roomId=${roomId}`);
      const data = await response.json();

      if (data.invites) {
        setInvites(data.invites);
      }
    } catch (error) {
      console.error('Erro ao buscar convites:', error);
    }
  };

  // Convidar usuário para a chamada
  const inviteUser = async (invitedUserId: string, displayName: string) => {
    if (invitingUsers.has(invitedUserId)) return;

    setInvitingUsers(prev => new Set([...prev, invitedUserId]));

    try {
      const response = await fetch('/api/calls/invites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId,
          invitedUserId,
          inviterUserId: userId,
          callType,
          message: `Você foi convidado(a) para uma ${callType === 'individual' ? 'chamada individual' : 'chamada em grupo'}`
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`🎉 Convite enviado para ${displayName}!`);
        
        // Atualizar lista de convites
        setInvites(prev => [...prev, data.invite]);
        
        // Refresh da lista de usuários
        fetchUsers(searchTerm);
      } else {
        if (data.inviteStatus === 'already_sent') {
          toast.info(`📨 Convite já enviado para ${displayName}`);
        } else if (data.userStatus === 'unavailable') {
          toast.warning(`📵 ${displayName} não está disponível para chamadas`);
        } else {
          toast.error(data.error || 'Erro ao enviar convite');
        }
      }
    } catch (error) {
      console.error('Erro ao convidar usuário:', error);
      toast.error('Erro ao enviar convite');
    } finally {
      setInvitingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(invitedUserId);
        return newSet;
      });
    }
  };

  // Verificar se usuário já foi convidado
  const isUserInvited = (userId: string) => {
    return invites.some(invite => 
      invite.invited_user_id === userId && 
      invite.status === 'pending'
    );
  };

  // Buscar usuários quando o componente monta ou quando o termo de busca muda
  useEffect(() => {
    if (isOpen) {
      fetchUsers(searchTerm);
      fetchInvites();
    }
  }, [isOpen, userId, searchTerm]);

  // Buscar com debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (isOpen && searchTerm !== '') {
        fetchUsers(searchTerm);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  if (!isOpen) return null;

  const getAvailabilityIcon = (availability: string, isOnline: boolean) => {
    if (!isOnline) return <WifiOff className="h-3 w-3 text-gray-400" />;
    
    switch (availability) {
      case 'available':
        return <Wifi className="h-3 w-3 text-green-500" />;
      case 'busy':
        return <Clock className="h-3 w-3 text-yellow-500" />;
      case 'unavailable':
        return <XCircle className="h-3 w-3 text-red-500" />;
      default:
        return <Wifi className="h-3 w-3 text-gray-400" />;
    }
  };

  const getAvailabilityText = (availability: string, isOnline: boolean) => {
    if (!isOnline) return 'Offline';
    
    switch (availability) {
      case 'available':
        return 'Disponível';
      case 'busy':
        return 'Ocupado';
      case 'unavailable':
        return 'Indisponível';
      default:
        return 'Offline';
    }
  };

  const getAvailabilityColor = (availability: string, isOnline: boolean) => {
    if (!isOnline) return 'bg-gray-100 text-gray-600';
    
    switch (availability) {
      case 'available':
        return 'bg-green-100 text-green-700';
      case 'busy':
        return 'bg-yellow-100 text-yellow-700';
      case 'unavailable':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-2xl border-l border-gray-200 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span className="font-semibold">Convidar Usuários</span>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20 p-1 h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center space-x-2 text-sm text-white/90">
          {callType === 'individual' ? (
            <>
              <Phone className="h-4 w-4" />
              <span>Chamada Individual</span>
            </>
          ) : (
            <>
              <Video className="h-4 w-4" />
              <span>Chamada em Grupo</span>
            </>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar usuários..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Users List */}
      <ScrollArea className="flex-1 p-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
            <span className="ml-2 text-gray-600">Carregando usuários...</span>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchTerm ? 'Nenhum usuário encontrado' : 'Nenhum usuário disponível'}
          </div>
        ) : (
          <div className="space-y-3">
            {users.map((user) => {
              const isInvited = isUserInvited(user.id);
              const isInviting = invitingUsers.has(user.id);
              
              return (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-purple-300 hover:shadow-sm transition-all duration-200"
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.photo_url} alt={user.display_name} />
                        <AvatarFallback className="bg-purple-100 text-purple-600 font-medium">
                          {user.display_name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {user.is_online && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {user.display_name}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge 
                          variant="secondary" 
                          className={`text-xs px-2 py-0.5 ${getAvailabilityColor(user.call_availability, user.is_online)}`}
                        >
                          <div className="flex items-center space-x-1">
                            {getAvailabilityIcon(user.call_availability, user.is_online)}
                            <span>{getAvailabilityText(user.call_availability, user.is_online)}</span>
                          </div>
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    {isInvited ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled
                        className="text-green-600 border-green-600"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Convidado
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => inviteUser(user.id, user.display_name)}
                        disabled={isInviting || user.call_availability === 'unavailable' || !user.is_online}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        {isInviting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <UserPlus className="h-4 w-4 mr-1" />
                            Convidar
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-600 text-center">
          {users.length} usuário{users.length !== 1 ? 's' : ''} encontrado{users.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
}
