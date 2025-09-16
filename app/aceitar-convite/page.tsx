'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/local-auth-context'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Gift, 
  Mail, 
  Users, 
  Heart, 
  CheckCircle, 
  XCircle, 
  Clock,
  UserPlus,
  Loader2,
  ArrowRight,
  Shield,
  Sparkles
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface InvitationData {
  id: string
  email: string
  verificationCode: string
  inviter: {
    display_name: string
    photo_url: string
    username: string
  }
  invitedAt: string
  expiresAt: string
}

export default function AcceptInvitePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const [invitation, setInvitation] = useState<InvitationData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isAccepting, setIsAccepting] = useState(false)

  const token = searchParams?.get('token')

  const validateInvitation = useCallback(async () => {
    if (!token) return

    try {
      const response = await fetch('/api/invitations/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Convite inválido')
      }

      setInvitation(data.invitation)
    } catch (error: any) {
      console.error('Erro ao validar convite:', error)
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (token) {
      validateInvitation()
    } else {
      setError('Token de convite não encontrado')
      setIsLoading(false)
    }
  }, [token, validateInvitation])

  useEffect(() => {
    // Se o usuário já estiver logado, redirecionar para home
    if (user) {
      router.push('/')
      return
    }
  }, [user, router])

  const handleAcceptInvite = () => {
    if (invitation && token) {
      // Redirecionar para página de cadastro com dados pré-preenchidos
      const signupUrl = `/cadastro?invite_token=${token}&email=${encodeURIComponent(invitation.email)}&verification_code=${invitation.verificationCode}`
      router.push(signupUrl)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-purple-600">Validando convite...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center border border-red-200">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Convite Inválido</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            
            <div className="space-y-3">
              <Link href="/cadastro">
                <Button className="w-full bg-purple-600 hover:bg-purple-700">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Criar conta mesmo assim
                </Button>
              </Link>
              
              <Link href="/login">
                <Button variant="outline" className="w-full">
                  Já tenho conta - Fazer login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!invitation) {
    return null
  }

  const timeUntilExpires = new Date(invitation.expiresAt).getTime() - Date.now()
  const isExpired = timeUntilExpires <= 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center px-4">
      <div className="max-w-lg w-full">
        {/* Card Principal */}
        <div className="bg-white rounded-2xl shadow-xl border border-purple-200 overflow-hidden">
          {/* Header com Gradiente */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-6 text-center">
            <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <Gift className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Você foi convidado!</h1>
            <p className="text-purple-100">Para participar do Orkut Retrô</p>
          </div>

          {/* Conteúdo */}
          <div className="p-8">
            {/* Info do Convite */}
            <div className="text-center mb-6">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <Avatar className="h-12 w-12 border-2 border-purple-200">
                  <AvatarImage src={invitation.inviter.photo_url} alt={invitation.inviter.display_name} />
                  <AvatarFallback className="bg-purple-100 text-purple-700">
                    {invitation.inviter.display_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">
                    {invitation.inviter.display_name}
                  </p>
                  <p className="text-sm text-gray-500">
                    @{invitation.inviter.username}
                  </p>
                </div>
              </div>
              
              <p className="text-gray-700 mb-2">
                <strong>{invitation.inviter.display_name}</strong> te convidou para participar do <strong>Orkut Retrô</strong>!
              </p>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Mail className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Email do convite:</span>
                </div>
                <p className="font-mono text-sm text-gray-900 bg-white rounded px-3 py-1 border">
                  {invitation.email}
                </p>
              </div>
            </div>

            {/* Status do Convite */}
            <div className="mb-6">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Shield className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-blue-900">Código de Verificação</p>
                    <p className="text-sm text-blue-700">Para maior segurança</p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-white border-blue-300 text-blue-700 font-mono">
                  {invitation.verificationCode}
                </Badge>
              </div>
            </div>

            {/* Tempo de Expiração */}
            <div className="mb-6">
              <div className={`flex items-center justify-center space-x-2 p-3 rounded-lg ${
                isExpired 
                  ? 'bg-red-50 border border-red-200 text-red-700' 
                  : timeUntilExpires < 24 * 60 * 60 * 1000 
                    ? 'bg-yellow-50 border border-yellow-200 text-yellow-700'
                    : 'bg-green-50 border border-green-200 text-green-700'
              }`}>
                <Clock className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {isExpired 
                    ? 'Convite expirado' 
                    : `Expira em ${formatDistanceToNow(new Date(invitation.expiresAt), { locale: ptBR })}`
                  }
                </span>
              </div>
            </div>

            {/* Benefícios */}
            <div className="mb-8">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Sparkles className="h-4 w-4 mr-2 text-purple-600" />
                O que te espera:
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center space-x-2 text-sm text-gray-700">
                  <Users className="h-4 w-4 text-purple-600" />
                  <span>Comunidades</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-700">
                  <Heart className="h-4 w-4 text-pink-600" />
                  <span>Amigos reais</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-700">
                  <Mail className="h-4 w-4 text-blue-600" />
                  <span>Mensagens</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-700">
                  <Gift className="h-4 w-4 text-green-600" />
                  <span>DJ Orky</span>
                </div>
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="space-y-3">
              {!isExpired ? (
                <>
                  <Button 
                    onClick={handleAcceptInvite}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg"
                    size="lg"
                    disabled={isAccepting}
                  >
                    {isAccepting ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-5 w-5 mr-2" />
                        Aceitar Convite e Criar Conta
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                  
                  <Link href="/login">
                    <Button variant="outline" className="w-full">
                      Já tenho conta - Fazer login
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/cadastro">
                    <Button className="w-full bg-purple-600 hover:bg-purple-700">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Criar conta mesmo assim
                    </Button>
                  </Link>
                  
                  <Link href="/login">
                    <Button variant="outline" className="w-full">
                      Já tenho conta - Fazer login
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            Convite enviado {formatDistanceToNow(new Date(invitation.invitedAt), { locale: ptBR, addSuffix: true })}
          </p>
        </div>
      </div>
    </div>
  )
}
