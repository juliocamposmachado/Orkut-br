'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/contexts/enhanced-auth-context'
import { Navbar } from '@/components/layout/navbar'
import { OrkutCard, OrkutCardContent, OrkutCardHeader } from '@/components/ui/orkut-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { 
  Users, 
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Calendar,
  Mail
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

interface Invitation {
  id: number
  community_id: number
  inviter_id: string
  invited_user_id: string | null
  invited_email: string | null
  invitation_code: string
  message: string
  status: 'pending' | 'accepted' | 'rejected' | 'expired'
  expires_at: string
  created_at: string
  community: {
    id: number
    name: string
    description: string
    category: string
    photo_url: string
    members_count: number
    visibility: string
  }
  inviter: {
    display_name: string
    username: string
    photo_url: string
  }
}

export default function CommunityInvitePage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const inviteCode = params?.code as string
  
  const [invitation, setInvitation] = useState<Invitation | null>(null)
  const [loadingInvite, setLoadingInvite] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (inviteCode) {
      loadInvitation()
    }
  }, [inviteCode])

  const loadInvitation = async () => {
    try {
      const { data, error } = await supabase
        .from('community_invitations')
        .select(`
          *,
          community:community_id(
            id,
            name,
            description,
            category,
            photo_url,
            members_count,
            visibility
          ),
          inviter:inviter_id(
            display_name,
            username,
            photo_url
          )
        `)
        .eq('invitation_code', inviteCode)
        .eq('status', 'pending')
        .single()

      if (error || !data) {
        setError('Convite não encontrado, expirado ou já processado.')
        return
      }

      // Verificar se o convite não expirou
      if (new Date(data.expires_at) < new Date()) {
        setError('Este convite expirou.')
        return
      }

      setInvitation(data as Invitation)
    } catch (error) {
      console.error('Error loading invitation:', error)
      setError('Erro ao carregar convite.')
    } finally {
      setLoadingInvite(false)
    }
  }

  const handleInviteResponse = async (action: 'accept' | 'reject') => {
    if (!user || !invitation) return

    setProcessing(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        toast.error('Você precisa estar logado para processar o convite')
        return
      }

      if (action === 'accept') {
        // Verificar se o usuário já é membro
        const { data: existingMember } = await supabase
          .from('community_members')
          .select('id')
          .eq('community_id', invitation.community_id)
          .eq('profile_id', user.id)
          .single()

        if (existingMember) {
          toast.error('Você já é membro desta comunidade!')
          return
        }

        // Adicionar como membro
        const { error: memberError } = await supabase
          .from('community_members')
          .insert({
            community_id: invitation.community_id,
            profile_id: user.id,
            role: 'member',
            invited_by: invitation.inviter_id,
            joined_at: new Date().toISOString(),
            last_activity_at: new Date().toISOString()
          })

        if (memberError) {
          console.error('Erro ao adicionar membro:', memberError)
          toast.error('Erro ao aceitar convite')
          return
        }

        // Atualizar contador de membros
        const { data: currentCommunity } = await supabase
          .from('communities')
          .select('members_count')
          .eq('id', invitation.community_id)
          .single()
        
        if (currentCommunity) {
          await supabase
            .from('communities')
            .update({ members_count: currentCommunity.members_count + 1 })
            .eq('id', invitation.community_id)
        }
      }

      // Atualizar status do convite
      const { error: updateError } = await supabase
        .from('community_invitations')
        .update({ 
          status: action === 'accept' ? 'accepted' : 'rejected',
          accepted_at: action === 'accept' ? new Date().toISOString() : null
        })
        .eq('id', invitation.id)

      if (updateError) {
        console.error('Erro ao atualizar convite:', updateError)
        toast.error('Erro ao processar convite')
        return
      }

      if (action === 'accept') {
        toast.success(`🎉 Você entrou na comunidade "${invitation.community.name}"!`)
        // Redirecionar para a comunidade
        router.push(`/comunidades/${invitation.community_id}`)
      } else {
        toast.success('Convite rejeitado.')
        router.push('/comunidades')
      }

    } catch (error) {
      console.error('Error processing invite:', error)
      toast.error('Erro ao processar convite')
    } finally {
      setProcessing(false)
    }
  }

  if (loading || loadingInvite) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-purple-600">Carregando convite...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-12">
          <OrkutCard>
            <OrkutCardContent className="text-center py-12">
              <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Convite Inválido</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <Button onClick={() => router.push('/comunidades')} className="bg-purple-500 hover:bg-purple-600">
                Ver Todas as Comunidades
              </Button>
            </OrkutCardContent>
          </OrkutCard>
        </div>
      </div>
    )
  }

  if (!invitation) {
    return null
  }

  const isExpired = new Date(invitation.expires_at) < new Date()
  const timeUntilExpiry = new Date(invitation.expires_at).getTime() - new Date().getTime()
  const daysUntilExpiry = Math.ceil(timeUntilExpiry / (1000 * 60 * 60 * 24))

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <Navbar />
      
      <div className="max-w-2xl mx-auto px-4 py-12">
        
        {/* Convite Header */}
        <div className="text-center mb-8">
          <Mail className="h-16 w-16 text-purple-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Você foi convidado!</h1>
          <p className="text-gray-600">
            {invitation.inviter.display_name} convidou você para participar de uma comunidade
          </p>
        </div>

        {/* Invitation Details */}
        <OrkutCard className="mb-6">
          <OrkutCardContent className="p-6">
            
            {/* Community Info */}
            <div className="flex items-start space-x-4 mb-6">
              <img
                src={invitation.community.photo_url}
                alt={invitation.community.name}
                className="w-20 h-20 object-cover rounded-lg border-2 border-purple-200"
              />
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-800 mb-2">{invitation.community.name}</h3>
                <p className="text-gray-700 mb-3">{invitation.community.description}</p>
                
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                    {invitation.community.category}
                  </Badge>
                  <Badge variant="outline" className="border-gray-300">
                    <Users className="h-3 w-3 mr-1" />
                    {invitation.community.members_count} membros
                  </Badge>
                  <Badge 
                    variant="outline" 
                    className={`${ 
                      invitation.community.visibility === 'private' ? 'border-red-300 text-red-600' :
                      invitation.community.visibility === 'restricted' ? 'border-yellow-300 text-yellow-600' :
                      'border-green-300 text-green-600'
                    }`}
                  >
                    {invitation.community.visibility === 'private' ? 'Privada' :
                     invitation.community.visibility === 'restricted' ? 'Restrita' : 'Pública'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Inviter Info */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={invitation.inviter.photo_url} />
                  <AvatarFallback>{invitation.inviter.display_name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-gray-800">{invitation.inviter.display_name}</p>
                  <p className="text-sm text-gray-600">@{invitation.inviter.username}</p>
                  <p className="text-sm text-gray-600">
                    Convite enviado {formatDistanceToNow(new Date(invitation.created_at), { addSuffix: true, locale: ptBR })}
                  </p>
                </div>
              </div>
              
              {invitation.message && (
                <div className="mt-4 p-3 bg-white rounded border-l-4 border-purple-500">
                  <p className="text-sm text-gray-700 italic">
                    "{invitation.message}"
                  </p>
                </div>
              )}
            </div>

            {/* Expiry Warning */}
            {!isExpired && daysUntilExpiry <= 2 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
                <div className="flex items-start space-x-2">
                  <Clock className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium">Atenção: Convite expira em breve!</p>
                    <p>Este convite expira em {daysUntilExpiry} dia{daysUntilExpiry !== 1 ? 's' : ''}.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {!loading && user && !isExpired ? (
              <div className="flex space-x-4 justify-center">
                <Button
                  onClick={() => handleInviteResponse('accept')}
                  disabled={processing}
                  className="bg-green-500 hover:bg-green-600 flex-1 max-w-[200px]"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {processing ? 'Processando...' : 'Aceitar Convite'}
                </Button>
                <Button
                  onClick={() => handleInviteResponse('reject')}
                  disabled={processing}
                  variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-50 flex-1 max-w-[200px]"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Recusar
                </Button>
              </div>
            ) : !user ? (
              <div className="text-center">
                <p className="text-gray-600 mb-4">Você precisa estar logado para aceitar este convite.</p>
                <Button onClick={() => router.push('/login')} className="bg-purple-500 hover:bg-purple-600">
                  Fazer Login
                </Button>
              </div>
            ) : isExpired ? (
              <div className="text-center">
                <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                <p className="text-red-600 font-medium">Este convite expirou</p>
                <p className="text-gray-600 text-sm mt-1">Entre em contato com um moderador da comunidade para obter um novo convite.</p>
              </div>
            ) : null}

            {/* Additional Info */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="font-medium text-gray-800 mb-3">Sobre esta comunidade:</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Categoria:</span>
                  <span className="ml-2 font-medium">{invitation.community.category}</span>
                </div>
                <div>
                  <span className="text-gray-600">Membros:</span>
                  <span className="ml-2 font-medium">{invitation.community.members_count.toLocaleString('pt-BR')}</span>
                </div>
                <div>
                  <span className="text-gray-600">Tipo:</span>
                  <span className="ml-2 font-medium">
                    {invitation.community.visibility === 'private' ? 'Privada' :
                     invitation.community.visibility === 'restricted' ? 'Restrita' : 'Pública'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Expira:</span>
                  <span className="ml-2 font-medium">
                    {formatDistanceToNow(new Date(invitation.expires_at), { addSuffix: true, locale: ptBR })}
                  </span>
                </div>
              </div>
            </div>
          </OrkutCardContent>
        </OrkutCard>

        {/* Back to Communities */}
        <div className="text-center">
          <Button variant="outline" onClick={() => router.push('/comunidades')}>
            Ver Todas as Comunidades
          </Button>
        </div>
      </div>
    </div>
  )
}
