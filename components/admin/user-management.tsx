'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { OrkutCard, OrkutCardContent, OrkutCardHeader } from '@/components/ui/orkut-card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { 
  Search, 
  MoreVertical, 
  Ban, 
  UserX, 
  AlertTriangle, 
  Crown,
  MessageCircle,
  Trash2,
  Shield,
  Users,
  Clock,
  Mail,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'

interface User {
  id: string
  username: string
  display_name: string
  email: string
  photo_url?: string
  role: string
  bio?: string
  location?: string
  created_at: string
  last_sign_in_at?: string
  email_confirmed: boolean
  is_anonymous: boolean
  is_banned: boolean
  ban_info?: {
    ban_reason: string
    banned_at: string
    ban_type: string
  }
  posts_count: number
  friends_count: number
}

interface UserManagementProps {
  className?: string
}

export function UserManagement({ className }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    banned: 0,
    admins: 0,
    moderators: 0
  })
  
  // Modais e ações
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [actionModalOpen, setActionModalOpen] = useState(false)
  const [selectedAction, setSelectedAction] = useState<string>('')
  const [actionReason, setActionReason] = useState('')
  const [notificationMessage, setNotificationMessage] = useState('')
  const [suspensionDays, setSuspensionDays] = useState('7')
  const [newRole, setNewRole] = useState('moderator')

  /**
   * Buscar usuários da API
   */
  const fetchUsers = useCallback(async (page = 1, search = '', status = 'all') => {
    try {
      setLoading(true)

      // Obter token de autenticação
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        toast.error('Sessão expirada')
        return
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        search,
        status
      })

      const response = await fetch(`/api/admin/users?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao buscar usuários')
      }

      const data = await response.json()
      setUsers(data.users)
      setStats(data.stats)
      setCurrentPage(page)

    } catch (error) {
      console.error('Erro ao buscar usuários:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao carregar usuários')
    } finally {
      setLoading(false)
    }
  }, [])

  // Carregar usuários na montagem do componente
  useEffect(() => {
    fetchUsers(1, searchQuery, statusFilter)
  }, [fetchUsers, searchQuery, statusFilter])

  /**
   * Executar ação de moderação
   */
  const executeAction = useCallback(async () => {
    if (!selectedUser || !selectedAction) return

    try {
      // Obter token de autenticação
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        toast.error('Sessão expirada')
        return
      }

      const body: any = {
        action: selectedAction,
        userId: selectedUser.id,
        reason: actionReason
      }

      // Adicionar campos específicos por ação
      if (selectedAction === 'suspend') {
        body.duration = suspensionDays
      }
      if (selectedAction === 'promote') {
        body.role = newRole
      }
      if (selectedAction === 'notify') {
        body.notificationMessage = notificationMessage
      }

      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro na ação de moderação')
      }

      const result = await response.json()
      toast.success(result.message)

      // Fechar modal e limpar estado
      setActionModalOpen(false)
      setSelectedUser(null)
      setSelectedAction('')
      setActionReason('')
      setNotificationMessage('')

      // Recarregar lista de usuários
      await fetchUsers(currentPage, searchQuery, statusFilter)

    } catch (error) {
      console.error('Erro ao executar ação:', error)
      toast.error(error instanceof Error ? error.message : 'Erro na ação de moderação')
    }
  }, [selectedUser, selectedAction, actionReason, notificationMessage, suspensionDays, newRole, currentPage, searchQuery, statusFilter, fetchUsers])

  /**
   * Abrir modal de ação
   */
  const openActionModal = useCallback((user: User, action: string) => {
    setSelectedUser(user)
    setSelectedAction(action)
    setActionModalOpen(true)
    
    // Definir mensagem padrão baseada na ação
    switch (action) {
      case 'ban':
        setActionReason('Violação dos termos de uso')
        break
      case 'suspend':
        setActionReason('Suspensão temporária por comportamento inadequado')
        break
      case 'notify':
        setActionReason('Aviso sobre comportamento')
        setNotificationMessage('Olá! Detectamos que algumas de suas ações podem estar violando nossas regras da comunidade. Por favor, revise nossos termos de uso.')
        break
      case 'delete':
        setActionReason('Conta removida permanentemente')
        break
      default:
        setActionReason('')
    }
  }, [])

  /**
   * Renderizar badge de status do usuário
   */
  const renderUserStatus = (user: User) => {
    if (user.is_banned) {
      return <Badge variant="destructive" className="text-xs">Banido</Badge>
    }
    if (user.role === 'admin') {
      return <Badge className="text-xs bg-purple-600">Admin</Badge>
    }
    if (user.role === 'moderator') {
      return <Badge className="text-xs bg-blue-600">Moderador</Badge>
    }
    if (!user.email_confirmed) {
      return <Badge variant="outline" className="text-xs">Email não confirmado</Badge>
    }
    return <Badge variant="secondary" className="text-xs">Ativo</Badge>
  }

  /**
   * Renderizar ações disponíveis para cada usuário
   */
  const renderUserActions = (user: User) => {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {!user.is_banned ? (
            <>
              <DropdownMenuItem onClick={() => openActionModal(user, 'notify')}>
                <MessageCircle className="w-4 h-4 mr-2" />
                Enviar Aviso
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openActionModal(user, 'suspend')}>
                <Clock className="w-4 h-4 mr-2" />
                Suspender
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openActionModal(user, 'ban')}>
                <Ban className="w-4 h-4 mr-2" />
                Banir
              </DropdownMenuItem>
              {user.role === 'user' && (
                <DropdownMenuItem onClick={() => openActionModal(user, 'promote')}>
                  <Crown className="w-4 h-4 mr-2" />
                  Promover
                </DropdownMenuItem>
              )}
            </>
          ) : (
            <DropdownMenuItem onClick={() => openActionModal(user, 'unban')}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Remover Banimento
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => openActionModal(user, 'delete')}
            className="text-red-600 focus:text-red-600"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Deletar Permanentemente
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <div className={className}>
      {/* Header com estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <OrkutCard>
          <OrkutCardContent className="p-4 text-center">
            <Users className="w-6 h-6 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-sm text-gray-600">Total</p>
          </OrkutCardContent>
        </OrkutCard>
        
        <OrkutCard>
          <OrkutCardContent className="p-4 text-center">
            <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.active}</p>
            <p className="text-sm text-gray-600">Ativos</p>
          </OrkutCardContent>
        </OrkutCard>
        
        <OrkutCard>
          <OrkutCardContent className="p-4 text-center">
            <Ban className="w-6 h-6 text-red-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.banned}</p>
            <p className="text-sm text-gray-600">Banidos</p>
          </OrkutCardContent>
        </OrkutCard>
        
        <OrkutCard>
          <OrkutCardContent className="p-4 text-center">
            <Crown className="w-6 h-6 text-purple-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.admins}</p>
            <p className="text-sm text-gray-600">Admins</p>
          </OrkutCardContent>
        </OrkutCard>
        
        <OrkutCard>
          <OrkutCardContent className="p-4 text-center">
            <Shield className="w-6 h-6 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.moderators}</p>
            <p className="text-sm text-gray-600">Moderadores</p>
          </OrkutCardContent>
        </OrkutCard>
      </div>

      {/* Filtros */}
      <OrkutCard className="mb-6">
        <OrkutCardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Buscar usuários por nome, username ou email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os usuários</SelectItem>
                <SelectItem value="active">Usuários ativos</SelectItem>
                <SelectItem value="banned">Usuários banidos</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              onClick={() => fetchUsers(1, searchQuery, statusFilter)}
              variant="outline"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </OrkutCardContent>
      </OrkutCard>

      {/* Lista de usuários */}
      <OrkutCard>
        <OrkutCardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span className="font-semibold">Gestão de Usuários</span>
            </div>
            <span className="text-sm text-gray-500">
              {loading ? 'Carregando...' : `${users.length} usuários encontrados`}
            </span>
          </div>
        </OrkutCardHeader>
        
        <OrkutCardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span>Carregando usuários...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum usuário encontrado
              </h3>
              <p className="text-gray-600">
                Tente ajustar os filtros de busca
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((user) => (
                <div 
                  key={user.id} 
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={user.photo_url} alt={user.display_name} />
                      <AvatarFallback>
                        {user.display_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-gray-900 truncate">
                          {user.display_name}
                        </h4>
                        {renderUserStatus(user)}
                      </div>
                      
                      <p className="text-sm text-gray-600 truncate">
                        @{user.username} • {user.email}
                      </p>
                      
                      <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                        <span>{user.posts_count} posts</span>
                        <span>{user.friends_count} amigos</span>
                        <span>
                          Criado {formatDistanceToNow(new Date(user.created_at), { 
                            addSuffix: true, 
                            locale: ptBR 
                          })}
                        </span>
                        {user.last_sign_in_at && (
                          <span>
                            Último login {formatDistanceToNow(new Date(user.last_sign_in_at), { 
                              addSuffix: true, 
                              locale: ptBR 
                            })}
                          </span>
                        )}
                      </div>
                      
                      {user.ban_info && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs">
                          <p className="text-red-800 font-medium">Banido: {user.ban_info.ban_reason}</p>
                          <p className="text-red-600">
                            Em {formatDistanceToNow(new Date(user.ban_info.banned_at), { 
                              addSuffix: true, 
                              locale: ptBR 
                            })}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {!user.email_confirmed && (
                      <AlertTriangle className="w-5 h-5 text-yellow-500" />
                    )}
                    {renderUserActions(user)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </OrkutCardContent>
      </OrkutCard>

      {/* Modal de ações */}
      <Dialog open={actionModalOpen} onOpenChange={setActionModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedAction === 'ban' && '🚫 Banir Usuário'}
              {selectedAction === 'suspend' && '⏱️ Suspender Usuário'}
              {selectedAction === 'delete' && '🗑️ Deletar Usuário'}
              {selectedAction === 'notify' && '📢 Enviar Notificação'}
              {selectedAction === 'promote' && '👑 Promover Usuário'}
              {selectedAction === 'unban' && '✅ Remover Banimento'}
            </DialogTitle>
            <DialogDescription>
              {selectedUser && (
                <>
                  Ação para: <strong>{selectedUser.display_name}</strong> (@{selectedUser.username})
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Mostrar informações do usuário */}
            {selectedUser && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3 mb-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={selectedUser.photo_url} alt={selectedUser.display_name} />
                    <AvatarFallback>{selectedUser.display_name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-medium">{selectedUser.display_name}</h4>
                    <p className="text-sm text-gray-600">@{selectedUser.username} • {selectedUser.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Posts:</span> {selectedUser.posts_count}
                  </div>
                  <div>
                    <span className="font-medium">Amigos:</span> {selectedUser.friends_count}
                  </div>
                  <div>
                    <span className="font-medium">Membro desde:</span> {' '}
                    {formatDistanceToNow(new Date(selectedUser.created_at), { locale: ptBR })}
                  </div>
                  <div>
                    <span className="font-medium">Email confirmado:</span> {' '}
                    {selectedUser.email_confirmed ? '✅ Sim' : '❌ Não'}
                  </div>
                </div>
              </div>
            )}

            {/* Campos específicos por ação */}
            {selectedAction === 'suspend' && (
              <div>
                <label className="block text-sm font-medium mb-1">
                  Duração da suspensão (dias)
                </label>
                <Select value={suspensionDays} onValueChange={setSuspensionDays}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 dia</SelectItem>
                    <SelectItem value="3">3 dias</SelectItem>
                    <SelectItem value="7">7 dias (padrão)</SelectItem>
                    <SelectItem value="14">14 dias</SelectItem>
                    <SelectItem value="30">30 dias</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedAction === 'promote' && (
              <div>
                <label className="block text-sm font-medium mb-1">
                  Novo cargo
                </label>
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="moderator">Moderador</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedAction === 'notify' && (
              <div>
                <label className="block text-sm font-medium mb-1">
                  Mensagem da notificação
                </label>
                <Textarea
                  value={notificationMessage}
                  onChange={(e) => setNotificationMessage(e.target.value)}
                  placeholder="Digite a mensagem que o usuário receberá..."
                  rows={4}
                />
              </div>
            )}

            {/* Motivo (sempre presente) */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Motivo da ação
              </label>
              <Textarea
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Descreva o motivo para esta ação..."
                rows={3}
              />
            </div>

            {/* Aviso para ações críticas */}
            {(selectedAction === 'delete' || selectedAction === 'ban') && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-red-800">
                      {selectedAction === 'delete' ? 'Ação Irreversível' : 'Ação Permanente'}
                    </h4>
                    <p className="text-sm text-red-700 mt-1">
                      {selectedAction === 'delete' 
                        ? 'Esta ação irá deletar permanentemente o usuário e todos os seus dados. Não pode ser desfeita.'
                        : 'Esta ação irá banir o usuário permanentemente da plataforma.'
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Botões de ação */}
            <div className="flex space-x-3 pt-4">
              <Button
                onClick={executeAction}
                disabled={!actionReason.trim() || (selectedAction === 'notify' && !notificationMessage.trim())}
                className={
                  selectedAction === 'delete' || selectedAction === 'ban'
                    ? 'bg-red-600 hover:bg-red-700'
                    : selectedAction === 'unban'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }
              >
                {selectedAction === 'ban' && 'Confirmar Banimento'}
                {selectedAction === 'suspend' && 'Confirmar Suspensão'}
                {selectedAction === 'delete' && 'Confirmar Exclusão'}
                {selectedAction === 'notify' && 'Enviar Notificação'}
                {selectedAction === 'promote' && 'Confirmar Promoção'}
                {selectedAction === 'unban' && 'Remover Banimento'}
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => {
                  setActionModalOpen(false)
                  setSelectedUser(null)
                  setSelectedAction('')
                  setActionReason('')
                  setNotificationMessage('')
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
