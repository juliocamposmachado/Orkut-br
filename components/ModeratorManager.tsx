'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/enhanced-auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { 
  Shield, 
  UserPlus, 
  Crown, 
  User, 
  Trash2,
  CheckCircle,
  XCircle 
} from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Moderator {
  id: string
  email: string
  display_name: string
  username: string
  photo_url: string
  role: 'admin' | 'moderator'
  created_at: string
}

export default function ModeratorManager() {
  const { user, profile } = useAuth()
  const [moderators, setModerators] = useState<Moderator[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [newModeratorEmail, setNewModeratorEmail] = useState('')
  const [newModeratorRole, setNewModeratorRole] = useState<'admin' | 'moderator'>('moderator')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Verificar se é admin principal
  const isMainAdmin = profile?.role === 'admin' && 
    ['juliocamposmachado@gmail.com', 'radiotatuapefm@gmail.com'].includes(user?.email || '')

  useEffect(() => {
    if (user && profile?.role === 'admin') {
      loadModerators()
    }
  }, [user, profile])

  const loadModerators = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, display_name, username, photo_url, role, created_at')
        .in('role', ['admin', 'moderator'])
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erro ao carregar moderadores:', error)
        toast.error('Erro ao carregar lista de moderadores')
        return
      }

      setModerators(data || [])
    } catch (error) {
      console.error('Erro ao carregar moderadores:', error)
      toast.error('Erro ao carregar moderadores')
    } finally {
      setLoading(false)
    }
  }

  const addModerator = async () => {
    if (!newModeratorEmail.trim()) {
      toast.error('Por favor, insira um email válido')
      return
    }

    if (!isMainAdmin) {
      toast.error('Apenas administradores principais podem adicionar moderadores')
      return
    }

    setIsSubmitting(true)
    try {
      // Verificar se o usuário já existe
      const { data: existingProfile, error: searchError } = await supabase
        .from('profiles')
        .select('id, email, role')
        .eq('email', newModeratorEmail.trim().toLowerCase())
        .single()

      if (searchError && searchError.code !== 'PGRST116') {
        console.error('Erro ao buscar usuário:', searchError)
        toast.error('Erro ao buscar usuário')
        return
      }

      if (existingProfile) {
        // Usuário existe, atualizar role
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ role: newModeratorRole })
          .eq('id', existingProfile.id)

        if (updateError) {
          console.error('Erro ao atualizar role:', updateError)
          toast.error('Erro ao atualizar permissões do usuário')
          return
        }

        toast.success(`${existingProfile.email} promovido a ${newModeratorRole === 'admin' ? 'Administrador' : 'Moderador'}`)
      } else {
        // Usuário não existe, precisará fazer login primeiro
        // Vamos criar uma entrada na tabela pending_moderators ou similar
        toast.info('Usuário não encontrado. Ele precisará fazer login primeiro para se tornar moderador.')
      }

      // Registrar ação de moderação
      await supabase
        .from('moderation_actions')
        .insert({
          moderator_id: user?.id,
          action_type: 'add_moderator',
          reason: `Adicionado ${newModeratorEmail} como ${newModeratorRole}`,
          details: {
            target_email: newModeratorEmail,
            new_role: newModeratorRole,
            added_by: user?.email
          }
        })

      setNewModeratorEmail('')
      setNewModeratorRole('moderator')
      setIsAddModalOpen(false)
      loadModerators()

    } catch (error) {
      console.error('Erro ao adicionar moderador:', error)
      toast.error('Erro ao adicionar moderador')
    } finally {
      setIsSubmitting(false)
    }
  }

  const removeModerator = async (moderatorId: string, moderatorEmail: string) => {
    if (!isMainAdmin) {
      toast.error('Apenas administradores principais podem remover moderadores')
      return
    }

    if (['juliocamposmachado@gmail.com', 'radiotatuapefm@gmail.com'].includes(moderatorEmail)) {
      toast.error('Não é possível remover administradores principais')
      return
    }

    if (confirm(`Tem certeza que deseja remover ${moderatorEmail} da moderação?`)) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ role: null })
          .eq('id', moderatorId)

        if (error) {
          console.error('Erro ao remover moderador:', error)
          toast.error('Erro ao remover moderador')
          return
        }

        // Registrar ação
        await supabase
          .from('moderation_actions')
          .insert({
            moderator_id: user?.id,
            action_type: 'remove_moderator',
            reason: `Removido ${moderatorEmail} da moderação`,
            details: {
              target_email: moderatorEmail,
              removed_by: user?.email
            }
          })

        toast.success(`${moderatorEmail} removido da moderação`)
        loadModerators()
      } catch (error) {
        console.error('Erro ao remover moderador:', error)
        toast.error('Erro ao remover moderador')
      }
    }
  }

  if (!user || profile?.role !== 'admin') {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-purple-600" />
            Gerenciar Moderadores
          </CardTitle>
          {isMainAdmin && (
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                  <UserPlus className="h-4 w-4 mr-1" />
                  Adicionar Moderador
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Novo Moderador</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Email do Usuário</label>
                    <Input
                      type="email"
                      placeholder="usuario@example.com"
                      value={newModeratorEmail}
                      onChange={(e) => setNewModeratorEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Nível de Acesso</label>
                    <Select value={newModeratorRole} onValueChange={(value: 'admin' | 'moderator') => setNewModeratorRole(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="moderator">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Moderador - Pode gerenciar denúncias
                          </div>
                        </SelectItem>
                        <SelectItem value="admin">
                          <div className="flex items-center gap-2">
                            <Crown className="h-4 w-4" />
                            Admin - Pode gerenciar tudo
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    onClick={addModerator}
                    disabled={isSubmitting}
                    className="w-full"
                  >
                    {isSubmitting ? 'Adicionando...' : 'Adicionar Moderador'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4">Carregando moderadores...</div>
        ) : (
          <div className="space-y-3">
            {moderators.map((moderator) => {
              const isMainAdminUser = ['juliocamposmachado@gmail.com', 'radiotatuapefm@gmail.com']
                .includes(moderator.email)
              
              return (
                <div key={moderator.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={moderator.photo_url} alt={moderator.display_name} />
                      <AvatarFallback>{moderator.display_name?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{moderator.display_name}</p>
                        {isMainAdminUser && (
                          <Crown className="h-4 w-4 text-yellow-500" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{moderator.email}</p>
                      <p className="text-xs text-gray-500">
                        Moderador há {formatDistanceToNow(new Date(moderator.created_at), { addSuffix: true, locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={moderator.role === 'admin' ? 'default' : 'secondary'}>
                      {moderator.role === 'admin' ? (
                        <>
                          <Crown className="h-3 w-3 mr-1" />
                          Administrador
                        </>
                      ) : (
                        <>
                          <Shield className="h-3 w-3 mr-1" />
                          Moderador
                        </>
                      )}
                    </Badge>
                    {isMainAdmin && !isMainAdminUser && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeModerator(moderator.id, moderator.email)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}

            {moderators.length === 0 && (
              <div className="text-center py-8">
                <Shield className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">
                  Nenhum moderador configurado
                </h3>
                <p className="text-gray-500">
                  Configure moderadores para ajudar na gestão da comunidade.
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
