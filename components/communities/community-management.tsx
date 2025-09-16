'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/local-auth-context'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Settings, 
  Users, 
  UserPlus, 
  UserMinus, 
  Crown, 
  Shield, 
  Ban, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  MoreHorizontal,
  Mail,
  UserCheck,
  TrendingUp
} from 'lucide-react'
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface CommunityManagementProps {
  communityId: number
  userRole: 'admin' | 'moderator' | 'member'
  onUpdate?: () => void
}

interface AdminData {
  stats: {
    total_posts: number
    total_comments: number
    total_likes: number
    posts_today: number
    posts_this_week: number
    active_members_today: number
    active_members_week: number
    last_activity_at: string
  }
  pendingRequests: Array<{
    id: number
    user_id: string
    message: string
    created_at: string
    profiles: {
      display_name: string
      username: string
      photo_url: string
    }
  }>
  pendingReports: Array<{
    id: number
    reported_by: string
    target_type: string
    category: string
    description: string
    created_at: string
  }>
}

interface Member {
  id: string
  username: string
  display_name: string
  photo_url: string
  role: 'member' | 'moderator' | 'admin'
  joined_at: string
  last_activity_at: string
  posts_count: number
  is_banned: boolean
  is_muted: boolean
}

interface Invite {
  id: number
  invited_email: string
  invited_user_id: string
  invitation_code: string
  message: string
  status: 'pending' | 'accepted' | 'rejected' | 'expired'
  created_at: string
  expires_at: string
  inviter: {
    display_name: string
    username: string
  }
  invited_user?: {
    display_name: string
    username: string
  }
}

export function CommunityManagement({ communityId, userRole, onUpdate }: CommunityManagementProps) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [adminData, setAdminData] = useState<AdminData | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [invites, setInvites] = useState<Invite[]>([])
  const [activeTab, setActiveTab] = useState('overview')

  // Estados para formulários
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteMessage, setInviteMessage] = useState('')
  const [sendingInvite, setSendingInvite] = useState(false)

  useEffect(() => {
    if (open && (userRole === 'admin' || userRole === 'moderator')) {
      loadAdminData()
    }
  }, [open, communityId, userRole])

  const loadAdminData = async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      if (!token) {
        toast.error('Sessão inválida')
        return
      }

      // Carregar dados administrativos
      const response = await fetch(`/api/communities/${communityId}/admin?type=overview`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      const result = await response.json()

      if (result.success) {
        setAdminData(result.data)
      } else {
        console.error('Erro ao carregar dados administrativos:', result.error)
      }

      // Carregar membros detalhados
      const membersResponse = await fetch(`/api/communities/${communityId}/admin?type=members`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      const membersResult = await membersResponse.json()

      if (membersResult.success) {
        setMembers(membersResult.data.members || [])
      }

      // Carregar convites
      const invitesResponse = await fetch(`/api/communities/${communityId}/invites`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      const invitesResult = await invitesResponse.json()

      if (invitesResult.success) {
        setInvites(invitesResult.invites || [])
      }

    } catch (error) {
      console.error('Erro ao carregar dados administrativos:', error)
      toast.error('Erro ao carregar dados de gerenciamento')
    } finally {
      setLoading(false)
    }
  }

  const handleMemberAction = async (targetUserId: string, action: string, newRole?: string, reason?: string, banDuration?: number) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      if (!token) {
        toast.error('Sessão inválida')
        return
      }

      const response = await fetch(`/api/communities/${communityId}/admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action,
          targetUserId,
          newRole,
          reason,
          banDuration
        })
      })

      const result = await response.json()

      if (result.success) {
        toast.success(result.message)
        loadAdminData() // Recarregar dados
        onUpdate?.() // Callback para atualizar página principal
      } else {
        toast.error(result.error || 'Erro ao executar ação')
      }

    } catch (error) {
      console.error('Erro na ação de membro:', error)
      toast.error('Erro ao executar ação')
    }
  }

  const handleJoinRequest = async (requestId: number, action: 'approve' | 'reject', message?: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      if (!token) {
        toast.error('Sessão inválida')
        return
      }

      const response = await fetch(`/api/communities/${communityId}/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action,
          requestId,
          reviewMessage: message
        })
      })

      const result = await response.json()

      if (result.success) {
        toast.success(result.message)
        loadAdminData() // Recarregar dados
      } else {
        toast.error(result.error || 'Erro ao processar solicitação')
      }

    } catch (error) {
      console.error('Erro ao processar solicitação:', error)
      toast.error('Erro ao processar solicitação')
    }
  }

  const sendInvite = async () => {
    if (!inviteEmail.trim()) {
      toast.error('Digite um email para convidar')
      return
    }

    setSendingInvite(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      if (!token) {
        toast.error('Sessão inválida')
        return
      }

      const response = await fetch(`/api/communities/${communityId}/invites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          targetEmail: inviteEmail.trim(),
          message: inviteMessage.trim()
        })
      })

      const result = await response.json()

      if (result.success) {
        toast.success(result.message)
        setInviteEmail('')
        setInviteMessage('')
        loadAdminData() // Recarregar dados
      } else {
        toast.error(result.error || 'Erro ao enviar convite')
      }

    } catch (error) {
      console.error('Erro ao enviar convite:', error)
      toast.error('Erro ao enviar convite')
    } finally {
      setSendingInvite(false)
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-500 text-white'
      case 'moderator': return 'bg-blue-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin': return 'Admin'
      case 'moderator': return 'Moderador'
      default: return 'Membro'
    }
  }

  // Apenas admins e moderadores podem acessar
  if (userRole !== 'admin' && userRole !== 'moderator') {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-purple-300 text-purple-700">
          <Settings className="h-4 w-4 mr-2" />
          Gerenciar
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-purple-600" />
            <span>Gerenciamento da Comunidade</span>
          </DialogTitle>
          <DialogDescription>
            Gerencie membros, convites, solicitações e configurações da comunidade
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="members">Membros</TabsTrigger>
              <TabsTrigger value="requests">Solicitações</TabsTrigger>
              <TabsTrigger value="invites">Convites</TabsTrigger>
              <TabsTrigger value="reports">Relatórios</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4 max-h-[400px] overflow-y-auto">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">Posts Hoje</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">{adminData?.stats?.posts_today || 0}</p>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Ativos Hoje</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">{adminData?.stats?.active_members_today || 0}</p>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-purple-600" />
                    <span className="text-sm font-medium text-purple-800">Solicitações</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-600">{adminData?.pendingRequests?.length || 0}</p>
                </div>
                
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <span className="text-sm font-medium text-red-800">Relatórios</span>
                  </div>
                  <p className="text-2xl font-bold text-red-600">{adminData?.pendingReports?.length || 0}</p>
                </div>
              </div>

              {/* Solicitações Pendentes */}
              {adminData?.pendingRequests && adminData.pendingRequests.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-800">Solicitações Pendentes</h4>
                  {adminData.pendingRequests.slice(0, 3).map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={request.profiles.photo_url} />
                          <AvatarFallback>{request.profiles.display_name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{request.profiles.display_name}</p>
                          <p className="text-xs text-gray-600">{request.message || 'Sem mensagem'}</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          onClick={() => handleJoinRequest(request.id, 'approve')}
                          className="bg-green-500 hover:bg-green-600"
                        >
                          <CheckCircle className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleJoinRequest(request.id, 'reject')}
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                          <XCircle className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Members Tab */}
            <TabsContent value="members" className="space-y-4 max-h-[400px] overflow-y-auto">
              <div className="space-y-3">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={member.photo_url} />
                        <AvatarFallback>{member.display_name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="font-medium">{member.display_name}</p>
                          <Badge className={getRoleBadgeColor(member.role)}>
                            {getRoleDisplayName(member.role)}
                          </Badge>
                          {member.is_banned && (
                            <Badge variant="destructive">Banido</Badge>
                          )}
                          {member.is_muted && (
                            <Badge variant="outline" className="border-orange-300 text-orange-600">
                              Silenciado
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          @{member.username} • {member.posts_count} posts • 
                          Entrou {formatDistanceToNow(new Date(member.joined_at), { addSuffix: true, locale: ptBR })}
                        </p>
                      </div>
                    </div>

                    {/* Ações do membro */}
                    {userRole === 'admin' && member.role !== 'admin' && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Ações do Membro</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          
                          {member.role === 'member' && (
                            <DropdownMenuItem 
                              onClick={() => handleMemberAction(member.id, 'promote_member', 'moderator', 'Promovido a moderador')}
                            >
                              <Crown className="h-4 w-4 mr-2" />
                              Promover a Moderador
                            </DropdownMenuItem>
                          )}
                          
                          {member.role === 'moderator' && (
                            <>
                              <DropdownMenuItem 
                                onClick={() => handleMemberAction(member.id, 'promote_member', 'admin', 'Promovido a admin')}
                              >
                                <Crown className="h-4 w-4 mr-2" />
                                Promover a Admin
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleMemberAction(member.id, 'demote_member', 'member', 'Rebaixado a membro')}
                              >
                                <UserMinus className="h-4 w-4 mr-2" />
                                Rebaixar a Membro
                              </DropdownMenuItem>
                            </>
                          )}
                          
                          <DropdownMenuSeparator />
                          
                          <DropdownMenuItem 
                            onClick={() => handleMemberAction(member.id, 'remove_member', undefined, 'Removido da comunidade')}
                            className="text-orange-600"
                          >
                            <UserMinus className="h-4 w-4 mr-2" />
                            Remover da Comunidade
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem 
                            onClick={() => handleMemberAction(member.id, 'ban_member', undefined, 'Banido da comunidade', 7)}
                            className="text-red-600"
                          >
                            <Ban className="h-4 w-4 mr-2" />
                            Banir (7 dias)
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem 
                            onClick={() => handleMemberAction(member.id, 'ban_member', undefined, 'Banido permanentemente')}
                            className="text-red-600"
                          >
                            <Ban className="h-4 w-4 mr-2" />
                            Banir Permanentemente
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Requests Tab */}
            <TabsContent value="requests" className="space-y-4 max-h-[400px] overflow-y-auto">
              {adminData?.pendingRequests && adminData.pendingRequests.length > 0 ? (
                <div className="space-y-3">
                  {adminData.pendingRequests.map((request) => (
                    <div key={request.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={request.profiles.photo_url} />
                            <AvatarFallback>{request.profiles.display_name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{request.profiles.display_name}</p>
                            <p className="text-sm text-gray-600">@{request.profiles.username}</p>
                            {request.message && (
                              <p className="text-sm text-gray-700 mt-1 italic">"{request.message}"</p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                              {formatDistanceToNow(new Date(request.created_at), { addSuffix: true, locale: ptBR })}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button 
                            size="sm"
                            onClick={() => handleJoinRequest(request.id, 'approve')}
                            className="bg-green-500 hover:bg-green-600"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Aprovar
                          </Button>
                          <Button 
                            size="sm"
                            variant="outline"
                            onClick={() => handleJoinRequest(request.id, 'reject')}
                            className="border-red-300 text-red-600 hover:bg-red-50"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Rejeitar
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Nenhuma solicitação pendente</p>
                </div>
              )}
            </TabsContent>

            {/* Invites Tab */}
            <TabsContent value="invites" className="space-y-4 max-h-[400px] overflow-y-auto">
              {/* Formulário para enviar convite */}
              <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                <h4 className="font-medium text-gray-800">Enviar Convite</h4>
                <div className="space-y-2">
                  <Input
                    placeholder="Email para convidar"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    type="email"
                  />
                  <Textarea
                    placeholder="Mensagem do convite (opcional)"
                    value={inviteMessage}
                    onChange={(e) => setInviteMessage(e.target.value)}
                    className="min-h-[60px]"
                    maxLength={200}
                  />
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-gray-500">{inviteMessage.length}/200 caracteres</p>
                    <Button 
                      onClick={sendInvite}
                      disabled={!inviteEmail.trim() || sendingInvite}
                      size="sm"
                      className="bg-purple-500 hover:bg-purple-600"
                    >
                      <Mail className="h-4 w-4 mr-1" />
                      {sendingInvite ? 'Enviando...' : 'Enviar Convite'}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Lista de convites */}
              <div className="space-y-3">
                {invites.length > 0 ? (
                  invites.map((invite) => (
                    <div key={invite.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            {invite.invited_user?.display_name || invite.invited_email}
                          </p>
                          <p className="text-sm text-gray-600">
                            Convidado por {invite.inviter.display_name} • 
                            {formatDistanceToNow(new Date(invite.created_at), { addSuffix: true, locale: ptBR })}
                          </p>
                          {invite.message && (
                            <p className="text-sm text-gray-700 mt-1 italic">"{invite.message}"</p>
                          )}
                        </div>
                        <Badge 
                          variant={
                            invite.status === 'accepted' ? 'default' :
                            invite.status === 'rejected' ? 'destructive' :
                            invite.status === 'expired' ? 'secondary' : 'outline'
                          }
                        >
                          {invite.status === 'pending' ? 'Pendente' :
                           invite.status === 'accepted' ? 'Aceito' :
                           invite.status === 'rejected' ? 'Rejeitado' : 'Expirado'}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Nenhum convite enviado</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Reports Tab */}
            <TabsContent value="reports" className="space-y-4 max-h-[400px] overflow-y-auto">
              {adminData?.pendingReports && adminData.pendingReports.length > 0 ? (
                <div className="space-y-3">
                  {adminData.pendingReports.map((report) => (
                    <div key={report.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                            <Badge variant="outline" className="border-red-300 text-red-600">
                              {report.category}
                            </Badge>
                            <Badge variant="secondary">
                              {report.target_type}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-700">{report.description || 'Sem descrição'}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDistanceToNow(new Date(report.created_at), { addSuffix: true, locale: ptBR })}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline">
                            Analisar
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
                  <p className="text-gray-600">Nenhum relatório pendente</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  )
}
