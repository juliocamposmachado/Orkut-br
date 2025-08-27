import React, { useState } from 'react';
import { UserPlus, UserCheck, UserX, Clock, Shield, Trash2 } from 'lucide-react';
import { useFriends } from '@/contexts/FriendsContext';
import { WhatsAppButton, PhoneLink } from './WhatsAppButton';

interface FriendshipButtonsProps {
  userId: string;
  userName: string;
  userPhone?: string;
  whatsappEnabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  layout?: 'horizontal' | 'vertical';
  showWhatsApp?: boolean;
  showPhone?: boolean;
}

export const FriendshipButtons: React.FC<FriendshipButtonsProps> = ({
  userId,
  userName,
  userPhone,
  whatsappEnabled = false,
  size = 'medium',
  layout = 'horizontal',
  showWhatsApp = true,
  showPhone = true
}) => {
  const { 
    sendFriendRequest, 
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend, 
    blockUser, 
    getFriendshipStatus,
    loading,
    refreshFriends,
    pendingRequests 
  } = useFriends();
  
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState<string | null>(null);
  
  const friendshipStatus = getFriendshipStatus(userId);

  const handleAction = async (action: string, callback: () => Promise<boolean>) => {
    setActionLoading(action);
    try {
      await callback();
    } catch (error) {
      console.error(`Erro ao executar ação ${action}:`, error);
    } finally {
      setActionLoading(null);
      setShowConfirm(null);
    }
  };

  const getButtonSize = () => {
    switch (size) {
      case 'small': return 'px-2 py-1 text-xs';
      case 'large': return 'px-6 py-3 text-base';
      default: return 'px-4 py-2 text-sm';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'small': return 14;
      case 'large': return 20;
      default: return 16;
    }
  };

  const baseButtonClass = `
    inline-flex items-center justify-center rounded-lg font-medium 
    transition-all duration-200 focus:outline-none focus:ring-2 
    focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed
    ${getButtonSize()}
  `;

  const buttonVariants = {
    primary: `${baseButtonClass} bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500`,
    success: `${baseButtonClass} bg-green-600 hover:bg-green-700 text-white focus:ring-green-500`,
    warning: `${baseButtonClass} bg-yellow-600 hover:bg-yellow-700 text-white focus:ring-yellow-500`,
    danger: `${baseButtonClass} bg-red-600 hover:bg-red-700 text-white focus:ring-red-500`,
    secondary: `${baseButtonClass} bg-gray-200 hover:bg-gray-300 text-gray-800 focus:ring-gray-500`
  };

  const renderFriendshipButton = () => {
    switch (friendshipStatus) {
      case 'friends':
        return (
          <div className="flex gap-2">
            <button
              className={buttonVariants.success}
              disabled={true}
              title={`Vocês são amigos`}
            >
              <UserCheck size={getIconSize()} className="mr-2" />
              Amigos
            </button>
            
            {showConfirm === 'remove' ? (
              <div className="flex gap-1">
                <button
                  onClick={() => handleAction('remove', () => removeFriend(userId))}
                  className={`${buttonVariants.danger} px-2`}
                  disabled={actionLoading !== null}
                  title="Confirmar remoção"
                >
                  {actionLoading === 'remove' ? '...' : '✓'}
                </button>
                <button
                  onClick={() => setShowConfirm(null)}
                  className={`${buttonVariants.secondary} px-2`}
                  title="Cancelar"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowConfirm('remove')}
                className={buttonVariants.secondary}
                title="Remover amizade"
              >
                <Trash2 size={getIconSize()} />
              </button>
            )}
          </div>
        );

      case 'pending_sent':
        return (
          <button
            className={buttonVariants.warning}
            disabled={true}
            title="Solicitação enviada, aguardando resposta"
          >
            <Clock size={getIconSize()} className="mr-2" />
            Solicitação Enviada
          </button>
        );

      case 'pending_received':
        return (
          <div className="flex gap-2">
            <button
              onClick={() => handleAction('accept', async () => {
                // Encontrar o ID da solicitação pendente
                const request = pendingRequests.find(req => req.requester_id === userId);
                if (request) {
                  const success = await acceptFriendRequest(request.id);
                  if (success) {
                    await refreshFriends(); // Forçar atualização
                  }
                  return success;
                }
                return false;
              })}
              className={buttonVariants.success}
              disabled={actionLoading !== null}
              title="Aceitar solicitação de amizade"
            >
              <UserCheck size={getIconSize()} className="mr-2" />
              {actionLoading === 'accept' ? 'Aceitando...' : 'Aceitar'}
            </button>
            
            <button
              onClick={() => handleAction('reject', async () => {
                const request = pendingRequests.find(req => req.requester_id === userId);
                if (request) {
                  const success = await rejectFriendRequest(request.id);
                  if (success) {
                    await refreshFriends(); // Forçar atualização
                  }
                  return success;
                }
                return false;
              })}
              className={buttonVariants.secondary}
              disabled={actionLoading !== null}
              title="Rejeitar solicitação"
            >
              <UserX size={getIconSize()} />
            </button>
          </div>
        );

      case 'blocked':
        return (
          <button
            className={buttonVariants.danger}
            disabled={true}
            title="Usuário bloqueado"
          >
            <Shield size={getIconSize()} className="mr-2" />
            Bloqueado
          </button>
        );

      default:
        return (
          <div className="flex gap-2">
            <button
              onClick={() => handleAction('add', () => sendFriendRequest(userId))}
              className={buttonVariants.primary}
              disabled={actionLoading !== null}
              title={`Adicionar ${userName} como amigo`}
            >
              <UserPlus size={getIconSize()} className="mr-2" />
              {actionLoading === 'add' ? 'Enviando...' : 'Adicionar'}
            </button>
            
            {showConfirm === 'block' ? (
              <div className="flex gap-1">
                <button
                  onClick={() => handleAction('block', () => blockUser(userId))}
                  className={`${buttonVariants.danger} px-2`}
                  disabled={actionLoading !== null}
                  title="Confirmar bloqueio"
                >
                  {actionLoading === 'block' ? '...' : '✓'}
                </button>
                <button
                  onClick={() => setShowConfirm(null)}
                  className={`${buttonVariants.secondary} px-2`}
                  title="Cancelar"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowConfirm('block')}
                className={buttonVariants.secondary}
                title="Bloquear usuário"
              >
                <Shield size={getIconSize()} />
              </button>
            )}
          </div>
        );
    }
  };

  const containerClass = layout === 'vertical' 
    ? 'flex flex-col gap-2' 
    : 'flex flex-wrap items-center gap-2';

  return (
    <div className={containerClass}>
      {renderFriendshipButton()}
      
      {/* Botões de contato - apenas para amigos ou perfil público */}
      {(friendshipStatus === 'friends' || friendshipStatus === 'none') && (
        <>
          {showWhatsApp && userPhone && whatsappEnabled && (
            <WhatsAppButton
              phone={userPhone}
              name={userName}
              size={size}
              variant="compact"
            />
          )}
          
          {showPhone && userPhone && friendshipStatus === 'friends' && (
            <PhoneLink phone={userPhone} />
          )}
        </>
      )}
    </div>
  );
};
