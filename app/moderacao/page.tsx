'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/local-auth-context'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { OrkutCard, OrkutCardContent, OrkutCardHeader } from '@/components/ui/orkut-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { 
  Shield, 
  Flag, 
  Ban, 
  Eye, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Search,
  MoreVertical,
  User,
  Mail,
  Clock,
  Activity,
  Trash2
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import ModeratorManager from '@/components/ModeratorManager'
import { UserManagement } from '@/components/admin/user-management'
import { BugReportsManagement } from '@/components/admin/bug-reports-management'

interface Report {
  id: number
  post_id: number
  report_category: string
  report_reason: string | null
  created_at: string
  reporter: {
    display_name: string
    username: string
    photo_url: string
  }
  post: {
    content: string
    created_at: string
    author: {
      display_name: string
      username: string
      photo_url: string
    }
  }
}

interface ModerationAction {
  id: number
  post_id: number | null
  target_user_id: string | null
  action_type: string
  reason: string
  details: any
  created_at: string
}

interface BannedUser {
  id: number
  user_id: string
  email: string
  ban_reason: string
  ban_type: string
  created_at: string
}

interface BannedEmail {
  id: number
  email: string
  ban_reason: string
  domain_ban: boolean
  created_at: string
}

export default function ModeracaoPage() {
  const { user, profile } = useAuth()
  const router = useRouter()
  
  const [reports, setReports] = useState<Report[]>([])
  const [moderationActions, setModerationActions] = useState<ModerationAction[]>([])
  const [bannedUsers, setBannedUsers] = useState<BannedUser[]>([])
  const [bannedEmails, setBannedEmails] = useState<BannedEmail[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('reports')
  
  // Estados para modais e ações
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [banModalOpen, setBanModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedUserToDelete, setSelectedUserToDelete] = useState<BannedUser | null>(null)
  const [banReason, setBanReason] = useState('')
  const [deleteReason, setDeleteReason] = useState('')
  const [emailToBan, setEmailToBan] = useState('')
  const [domainBan, setDomainBan] = useState(false)

  useEffect(() => {
    // Aguardar carregamento completo do usuário/perfil
    if (!user && !profile) return
    
    // Se usuário não está logado, redirecionar para login
    if (!user) {
      router.push('/login')
      return
    }

    // Se perfil ainda não carregou, aguardar
    if (!profile) return

    // Verificar permissões - se não for admin/moderador, mostrar mensagem e redirecionar
    if (!profile.role || !(['admin', 'moderator'].includes(profile.role))) {
      console.log('Usuário sem permissão:', profile)
      toast.error(`Acesso negado. Apenas administradores podem acessar esta página. Seu role: ${profile.role || 'undefined'}`)
      setTimeout(() => router.push('/'), 2000) // Aguardar 2s antes de redirecionar
      return
    }

    // Se chegou até aqui, tem permissão
    loadModerationData()
  }, [user, profile, router])

  const loadModerationData = async () => {
    setLoading(true)
    try {
      // Carregar denúncias do Supabase
      const { data: reportsData, error: reportsError } = await supabase
        .from('post_reports')
        .select(`
          *,
          post:posts (content, created_at, author, profiles!posts_author_fkey (display_name, username, photo_url)),
          profiles!post_reports_user_id_fkey (display_name, username, photo_url)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (reportsError) {
        console.error('Erro ao carregar denúncias:', reportsError)
      } else {
        const formattedReports = reportsData?.map((report: any) => ({
          id: report.id,
          post_id: report.post_id,
          report_category: report.category,
          report_reason: report.description,
          created_at: report.created_at,
          reporter: {
            display_name: report.profiles.display_name,
            username: report.profiles.username,
            photo_url: report.profiles.photo_url
          },
          post: {
            content: report.post.content,
            created_at: report.post.created_at,
            author: {
              display_name: report.post.profiles.display_name,
              username: report.post.profiles.username,
              photo_url: report.post.profiles.photo_url
            }
          }
        })) || []
        setReports(formattedReports)
      }

      // Carregar usuários banidos
      const { data: bannedData, error: bannedError } = await supabase
        .from('banned_users')
        .select('*')
        .order('banned_at', { ascending: false })

      if (bannedError) {
        console.error('Erro ao carregar usuários banidos:', bannedError)
      } else {
        const formattedBanned = bannedData?.map((banned: any) => ({
          id: banned.id,
          user_id: banned.user_id,
          email: banned.email,
          ban_reason: banned.ban_reason,
          ban_type: 'permanent',
          created_at: banned.banned_at
        })) || []
        setBannedUsers(formattedBanned)
      }

      // Por enquanto, deixar arrays vazios para ações e emails banidos
      setModerationActions([])
      setBannedEmails([])

    } catch (error) {
      console.error('Erro ao carregar dados de moderação:', error)
      toast.error('Erro ao carregar dados de moderação')
    } finally {
      setLoading(false)
    }
  }

  const handleModerationAction = async (postId: number, action: string, reason: string) => {
    try {
      const response = await fetch('/api/moderation/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, action, reason })
      })

      const data = await response.json()
      
      if (response.ok) {
        toast.success('Ação de moderação aplicada com sucesso')
        loadModerationData()
      } else {
        toast.error(data.error || 'Erro ao aplicar ação de moderação')
      }
    } catch (error) {
      console.error('Erro ao aplicar ação de moderação:', error)
      toast.error('Erro interno. Tente novamente.')
    }
  }

  const handleBanUser = async (userId: string, email: string) => {
    if (!banReason.trim()) {
      toast.error('Por favor, forneça um motivo para o banimento')
      return
    }

    try {
      const response = await fetch('/api/moderation/ban-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, email, reason: banReason })
      })

      const data = await response.json()
      
      if (response.ok) {
        toast.success('Usuário banido com sucesso')
        setBanModalOpen(false)
        setBanReason('')
        loadModerationData()
      } else {
        toast.error(data.error || 'Erro ao banir usuário')
      }
    } catch (error) {
      console.error('Erro ao banir usuário:', error)
      toast.error('Erro interno. Tente novamente.')
    }
  }

  const handleBanEmail = async () => {
    if (!emailToBan.trim() || !banReason.trim()) {
      toast.error('Por favor, forneça o email e o motivo para o banimento')
      return
    }

    try {
      const response = await fetch('/api/moderation/ban-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: emailToBan, 
          reason: banReason, 
          domainBan 
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        toast.success('Email banido com sucesso')
        setEmailToBan('')
        setBanReason('')
        setDomainBan(false)
        loadModerationData()
      } else {
        toast.error(data.error || 'Erro ao banir email')
      }
    } catch (error) {
      console.error('Erro ao banir email:', error)
      toast.error('Erro interno. Tente novamente.')
    }
  }

  const handleDeleteUser = async () => {
    if (!selectedUserToDelete || !deleteReason.trim()) {
      toast.error('Por favor, forneça um motivo para a exclusão')
      return
    }

    try {
      const response = await fetch('/api/moderation/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUserToDelete.user_id,
          reason: deleteReason
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        toast.success(data.message || 'Usuário deletado com sucesso')
        setDeleteModalOpen(false)
        setSelectedUserToDelete(null)
        setDeleteReason('')
        loadModerationData()
      } else {
        toast.error(data.error || 'Erro ao deletar usuário')
      }
    } catch (error) {
      console.error('Erro ao deletar usuário:', error)
      toast.error('Erro interno. Tente novamente.')
    }
  }

  if (!user || !profile || !profile.role || !(['admin', 'moderator'] as string[]).includes(profile.role)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Acesso Negado</h1>
          <p className="text-gray-600">Apenas administradores podem acessar esta página.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-purple-600">Carregando dados de moderação...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-purple-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Centro de Moderação</h1>
                <p className="text-gray-600">Painel de controle para moderação da comunidade</p>
              </div>
            </div>
            <Button onClick={() => router.push('/')} variant="outline">
              Voltar ao Feed
            </Button>
          </div>
        </div>

        {/* Estatísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <OrkutCard>
            <OrkutCardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Flag className="h-8 w-8 text-red-500" />
                <div>
                  <p className="text-2xl font-bold text-gray-800">{reports.length}</p>
                  <p className="text-sm text-gray-600">Denúncias Pendentes</p>
                </div>
              </div>
            </OrkutCardContent>
          </OrkutCard>
          
          <OrkutCard>
            <OrkutCardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Activity className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold text-gray-800">{moderationActions.length}</p>
                  <p className="text-sm text-gray-600">Ações de Moderação</p>
                </div>
              </div>
            </OrkutCardContent>
          </OrkutCard>
          
          <OrkutCard>
            <OrkutCardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Ban className="h-8 w-8 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold text-gray-800">{bannedUsers.length}</p>
                  <p className="text-sm text-gray-600">Usuários Banidos</p>
                </div>
              </div>
            </OrkutCardContent>
          </OrkutCard>
          
          <OrkutCard>
            <OrkutCardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Mail className="h-8 w-8 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold text-gray-800">{bannedEmails.length}</p>
                  <p className="text-sm text-gray-600">Emails Banidos</p>
                </div>
              </div>
            </OrkutCardContent>
          </OrkutCard>
        </div>

        {/* Tabs de conteúdo */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="reports">Denúncias</TabsTrigger>
            <TabsTrigger value="bugs">🐛 Bugs</TabsTrigger>
            <TabsTrigger value="actions">Ações</TabsTrigger>
            <TabsTrigger value="banned">Banimentos</TabsTrigger>
            <TabsTrigger value="moderators">Moderadores</TabsTrigger>
            <TabsTrigger value="tools">Ferramentas</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <UserManagement />
          </TabsContent>

          <TabsContent value="bugs" className="space-y-4">
            <BugReportsManagement />
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <OrkutCard>
              <OrkutCardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Flag className="h-5 w-5 text-red-500" />
                    <span className="font-semibold">Denúncias de Posts</span>
                  </div>
                  <Button onClick={loadModerationData} variant="outline" size="sm">
                    Atualizar
                  </Button>
                </div>
              </OrkutCardHeader>
              <OrkutCardContent>
                {reports.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-800 mb-2">Nenhuma denúncia pendente</h3>
                    <p className="text-gray-600">A comunidade está comportada! 🎉</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reports.map((report) => (
                      <div key={report.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={report.reporter.photo_url} alt={report.reporter.display_name} />
                              <AvatarFallback>{report.reporter.display_name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{report.reporter.display_name}</p>
                              <p className="text-xs text-gray-500">
                                {formatDistanceToNow(new Date(report.created_at), { addSuffix: true, locale: ptBR })}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {report.report_category}
                          </Badge>
                        </div>
                        
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-sm text-gray-800">{report.post.content}</p>
                          <div className="flex items-center space-x-2 mt-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={report.post.author.photo_url} alt={report.post.author.display_name} />
                              <AvatarFallback>{report.post.author.display_name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-gray-600">por {report.post.author.display_name}</span>
                          </div>
                        </div>
                        
                        {report.report_reason && (
                          <div className="bg-red-50 p-3 rounded-lg">
                            <p className="text-sm text-red-800">{report.report_reason}</p>
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-2 pt-2">
                          <Button
                            size="sm"
                            onClick={() => handleModerationAction(report.post_id, 'hide_post', 'Post ocultado por denúncia válida')}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Ocultar Post
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleModerationAction(report.post_id, 'dismiss_report', 'Denúncia considerada inválida')}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Dispensar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedReport(report)
                              setBanModalOpen(true)
                            }}
                          >
                            <Ban className="h-4 w-4 mr-1" />
                            Banir Autor
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </OrkutCardContent>
            </OrkutCard>
          </TabsContent>

          <TabsContent value="actions" className="space-y-4">
            <OrkutCard>
              <OrkutCardHeader>
                <div className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-blue-500" />
                  <span className="font-semibold">Histórico de Ações de Moderação</span>
                </div>
              </OrkutCardHeader>
              <OrkutCardContent>
                <div className="space-y-3">
                  {moderationActions.map((action) => (
                    <div key={action.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                      <div className="mt-0.5">
                        {action.action_type === 'auto_hide_post' && <XCircle className="h-4 w-4 text-red-500" />}
                        {action.action_type === 'hide_post' && <Eye className="h-4 w-4 text-orange-500" />}
                        {action.action_type === 'ban_user' && <Ban className="h-4 w-4 text-red-600" />}
                        {action.action_type === 'dismiss_report' && <CheckCircle className="h-4 w-4 text-green-500" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{action.action_type.replace('_', ' ')}</p>
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(action.created_at), { addSuffix: true, locale: ptBR })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{action.reason}</p>
                        {action.details && (
                          <p className="text-xs text-gray-500 mt-1">
                            Detalhes: {JSON.stringify(action.details)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </OrkutCardContent>
            </OrkutCard>
          </TabsContent>

          <TabsContent value="banned" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <OrkutCard>
                <OrkutCardHeader>
                  <div className="flex items-center space-x-2">
                    <Ban className="h-5 w-5 text-red-500" />
                    <span className="font-semibold">Usuários Banidos</span>
                  </div>
                </OrkutCardHeader>
                <OrkutCardContent>
                  <div className="space-y-3">
                    {bannedUsers.map((banned) => (
                      <div key={banned.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium">{banned.email}</p>
                            <p className="text-xs text-gray-500">{banned.ban_reason}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              Banido em {formatDistanceToNow(new Date(banned.created_at), { addSuffix: true, locale: ptBR })}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="destructive" className="text-xs">
                              {banned.ban_type}
                            </Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-300 text-red-700 hover:bg-red-50"
                              onClick={() => {
                                setSelectedUserToDelete(banned)
                                setDeleteModalOpen(true)
                              }}
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Deletar
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </OrkutCardContent>
              </OrkutCard>

              <OrkutCard>
                <OrkutCardHeader>
                  <div className="flex items-center space-x-2">
                    <Mail className="h-5 w-5 text-purple-500" />
                    <span className="font-semibold">Emails Banidos</span>
                  </div>
                </OrkutCardHeader>
                <OrkutCardContent>
                  <div className="space-y-3">
                    {bannedEmails.map((email) => (
                      <div key={email.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">{email.email}</p>
                            <p className="text-xs text-gray-500">{email.ban_reason}</p>
                          </div>
                          {email.domain_ban && (
                            <Badge variant="secondary" className="text-xs">
                              Domínio Completo
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                          Banido em {formatDistanceToNow(new Date(email.created_at), { addSuffix: true, locale: ptBR })}
                        </p>
                      </div>
                    ))}
                  </div>
                </OrkutCardContent>
              </OrkutCard>
            </div>
          </TabsContent>

          <TabsContent value="moderators" className="space-y-4">
            <ModeratorManager />
          </TabsContent>

          <TabsContent value="tools" className="space-y-4">
            <OrkutCard>
              <OrkutCardHeader>
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-purple-600" />
                  <span className="font-semibold">Ferramentas de Moderação</span>
                </div>
              </OrkutCardHeader>
              <OrkutCardContent className="space-y-6">
                {/* Banir email manualmente */}
                <div className="space-y-3">
                  <h3 className="text-lg font-medium">Banir Email Manualmente</h3>
                  <div className="space-y-3">
                    <Input
                      placeholder="Email para banir (ex: usuario@example.com)"
                      value={emailToBan}
                      onChange={(e) => setEmailToBan(e.target.value)}
                    />
                    <Textarea
                      placeholder="Motivo do banimento"
                      value={banReason}
                      onChange={(e) => setBanReason(e.target.value)}
                    />
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="domainBan"
                        checked={domainBan}
                        onChange={(e) => setDomainBan(e.target.checked)}
                      />
                      <label htmlFor="domainBan" className="text-sm">
                        Banir domínio completo (ex: todos os emails @example.com)
                      </label>
                    </div>
                    <Button onClick={handleBanEmail} className="bg-red-600 hover:bg-red-700">
                      Banir Email
                    </Button>
                  </div>
                </div>
              </OrkutCardContent>
            </OrkutCard>
          </TabsContent>
        </Tabs>

        {/* Modal de banimento */}
        <Dialog open={banModalOpen} onOpenChange={setBanModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Banir Usuário</DialogTitle>
              <DialogDescription>
                Esta ação irá banir permanentemente o usuário da plataforma.
              </DialogDescription>
            </DialogHeader>
            {selectedReport && (
              <div className="space-y-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm">
                    <strong>Usuário:</strong> {selectedReport.post.author.display_name}
                  </p>
                </div>
                <Textarea
                  placeholder="Motivo do banimento..."
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                />
                <div className="flex space-x-2">
                  <Button 
                    onClick={() => selectedReport && handleBanUser(
                      selectedReport.post.author.display_name, 
                      'email@unknown.com' // Precisaria pegar o email do usuário
                    )}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Confirmar Banimento
                  </Button>
                  <Button variant="outline" onClick={() => setBanModalOpen(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal de deletar usuário */}
        <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-red-600">Deletar Usuário Permanentemente</DialogTitle>
              <DialogDescription>
                ⚠️ Esta ação é IRREVERSÍVEL e irá deletar completamente o usuário e todos os seus dados do sistema.
              </DialogDescription>
            </DialogHeader>
            {selectedUserToDelete && (
              <div className="space-y-4">
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm font-medium text-red-800">
                    <strong>Usuário:</strong> {selectedUserToDelete.email}
                  </p>
                  <p className="text-xs text-red-600 mt-1">
                    Motivo do banimento: {selectedUserToDelete.ban_reason}
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Motivo para deletar permanentemente:
                  </label>
                  <Textarea
                    placeholder="Ex: Usuário de teste que precisa ser removido do sistema..."
                    value={deleteReason}
                    onChange={(e) => setDeleteReason(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-xs text-yellow-800">
                    <strong>O que será deletado:</strong>
                  </p>
                  <ul className="text-xs text-yellow-700 mt-1 space-y-1">
                    <li>• Todos os posts do usuário</li>
                    <li>• Todas as amizades</li>
                    <li>• Todas as notificações</li>
                    <li>• Relatórios feitos pelo usuário</li>
                    <li>• Perfil completo</li>
                    <li>• Conta de autenticação</li>
                  </ul>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    onClick={handleDeleteUser}
                    className="bg-red-600 hover:bg-red-700 text-white"
                    disabled={!deleteReason.trim()}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Confirmar Exclusão Permanente
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setDeleteModalOpen(false)
                      setSelectedUserToDelete(null)
                      setDeleteReason('')
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
