'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/enhanced-auth-context'
import { Button } from '@/components/ui/button'
import { OrkutCard, OrkutCardContent, OrkutCardHeader } from '@/components/ui/orkut-card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { CheckCircle, UserPlus, AlertCircle, Mail } from 'lucide-react'
import Link from 'next/link'

interface InviteData {
  id: string
  email: string
  name: string | null
  message: string | null
  status: string
  inviter: {
    id: string
    display_name: string
    photo_url: string | null
    username: string
  }
}

export default function AcceptInvitePage({ params }: { params: { token: string } }) {
  const { user } = useAuth()
  const router = useRouter()
  const [invite, setInvite] = useState<InviteData | null>(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    loadInvite()
  }, [params.token])

  const loadInvite = async () => {
    if (!params.token || !supabase) return

    try {
      const { data, error } = await supabase
        .from('email_invites')
        .select(`
          id,
          email,
          name,
          message,
          status,
          inviter:profiles!inviter_id(
            id,
            display_name,
            photo_url,
            username
          )
        `)
        .eq('invite_token', params.token)
        .single()

      if (error) {
        console.error('Error loading invite:', error)
        setError('Convite não encontrado ou inválido')
      } else {
        setInvite(data)
      }
    } catch (error) {
      console.error('Error loading invite:', error)
      setError('Erro ao carregar convite')
    } finally {
      setLoading(false)
    }
  }

  const acceptInvite = async () => {
    if (!invite || !user) return

    setAccepting(true)
    try {
      // Update invite status
      const { error: updateError } = await supabase
        .from('email_invites')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
          accepted_by: user.id
        })
        .eq('id', invite.id)

      if (updateError) throw updateError

      // Create friendship
      const { error: friendshipError } = await supabase
        .from('friendships')
        .insert({
          requester_id: invite.inviter.id,
          addressee_id: user.id,
          status: 'accepted'
        })

      if (friendshipError) {
        // Check if friendship already exists
        if (!friendshipError.message?.includes('duplicate key')) {
          throw friendshipError
        }
      }

      setSuccess(true)
    } catch (error) {
      console.error('Error accepting invite:', error)
      setError('Erro ao aceitar convite')
    } finally {
      setAccepting(false)
    }
  }

  const redirectToRegister = () => {
    // Store invite info for registration
    if (invite) {
      localStorage.setItem('pendingInvite', JSON.stringify({
        token: params.token,
        inviterName: invite.inviter.display_name,
        inviterUsername: invite.inviter.username
      }))
    }
    router.push('/register')
  }

  if (loading) {
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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <OrkutCard className="w-full max-w-md">
          <OrkutCardContent className="text-center py-12">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">Convite Inválido</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link href="/">
              <Button className="bg-purple-500 hover:bg-purple-600">
                Ir para o Orkut.BR
              </Button>
            </Link>
          </OrkutCardContent>
        </OrkutCard>
      </div>
    )
  }

  if (!invite) return null

  // Check if invite is already accepted
  if (invite.status === 'accepted') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <OrkutCard className="w-full max-w-md">
          <OrkutCardContent className="text-center py-12">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">Convite já aceito!</h2>
            <p className="text-gray-600 mb-6">Este convite já foi aceito anteriormente.</p>
            <Link href="/login">
              <Button className="bg-purple-500 hover:bg-purple-600">
                Fazer Login
              </Button>
            </Link>
          </OrkutCardContent>
        </OrkutCard>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <OrkutCard className="w-full max-w-md">
          <OrkutCardContent className="text-center py-12">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">Convite Aceito! 🎉</h2>
            <p className="text-gray-600 mb-6">
              Agora vocês são amigos! Explore o Orkut.BR e conecte-se com mais pessoas.
            </p>
            <div className="space-y-3">
              <Link href="/amigos">
                <Button className="bg-purple-500 hover:bg-purple-600 w-full">
                  Ver Meus Amigos
                </Button>
              </Link>
              <Link href="/home">
                <Button variant="outline" className="w-full">
                  Ir para o Feed
                </Button>
              </Link>
            </div>
          </OrkutCardContent>
        </OrkutCard>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
      <OrkutCard className="w-full max-w-2xl">
        <OrkutCardHeader>
          <div className="text-center">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white py-6 px-4 rounded-t-lg">
              <h1 className="text-2xl font-bold mb-2">🌟 Convite para o Orkut.BR</h1>
              <p className="opacity-90">Você foi convidado para fazer parte da nossa comunidade!</p>
            </div>
          </div>
        </OrkutCardHeader>
        
        <OrkutCardContent className="p-8">
          {/* Inviter Info */}
          <div className="text-center mb-8">
            <Avatar className="h-20 w-20 mx-auto mb-4">
              <AvatarImage src={invite.inviter.photo_url || undefined} alt={invite.inviter.display_name} />
              <AvatarFallback className="text-lg">{invite.inviter.display_name.charAt(0)}</AvatarFallback>
            </Avatar>
            
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              {invite.inviter.display_name} te convidou!
            </h2>
            <p className="text-purple-600">@{invite.inviter.username}</p>
          </div>

          {/* Personal Message */}
          {invite.message && (
            <div className="bg-purple-50 rounded-lg p-4 mb-8 border-l-4 border-purple-500">
              <h3 className="font-medium text-gray-800 mb-2">💬 Mensagem pessoal:</h3>
              <p className="text-gray-700 italic">"{invite.message}"</p>
            </div>
          )}

          {/* Invite Details */}
          <div className="bg-gray-50 rounded-lg p-4 mb-8">
            <div className="flex items-center mb-2">
              <Mail className="h-4 w-4 text-gray-500 mr-2" />
              <span className="text-sm text-gray-600">Convidado para:</span>
            </div>
            <p className="font-medium text-gray-800">{invite.email}</p>
            {invite.name && (
              <p className="text-sm text-gray-600">Como: {invite.name}</p>
            )}
          </div>

          {/* Features */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
              <div className="text-2xl mb-2">👥</div>
              <h4 className="font-medium text-gray-800">Conecte-se</h4>
              <p className="text-xs text-gray-600">Com amigos incríveis</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
              <div className="text-2xl mb-2">💬</div>
              <h4 className="font-medium text-gray-800">Scraps</h4>
              <p className="text-xs text-gray-600">Deixe recadinhos</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
              <div className="text-2xl mb-2">🎨</div>
              <h4 className="font-medium text-gray-800">Perfil</h4>
              <p className="text-xs text-gray-600">Personalize tudo</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
              <div className="text-2xl mb-2">🏆</div>
              <h4 className="font-medium text-gray-800">Comunidades</h4>
              <p className="text-xs text-gray-600">Participe e se divirta</p>
            </div>
          </div>

          {/* Action Buttons */}
          {user ? (
            // User is logged in
            user.email === invite.email ? (
              <div className="text-center">
                <Button
                  onClick={acceptInvite}
                  disabled={accepting}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-3 text-lg"
                >
                  {accepting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Aceitando...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-5 w-5 mr-2" />
                      Aceitar Convite
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-amber-600 mb-4">
                  Este convite é para {invite.email}, mas você está logado como {user.email}.
                </p>
                <div className="space-y-3">
                  <Link href="/logout">
                    <Button variant="outline" className="w-full">
                      Fazer Logout e Aceitar como {invite.email}
                    </Button>
                  </Link>
                  <Link href="/amigos">
                    <Button variant="ghost" className="w-full">
                      Continuar como {user.email}
                    </Button>
                  </Link>
                </div>
              </div>
            )
          ) : (
            // User is not logged in
            <div className="text-center space-y-4">
              <Button
                onClick={redirectToRegister}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-3 text-lg w-full"
              >
                <UserPlus className="h-5 w-5 mr-2" />
                Criar Conta e Aceitar Convite
              </Button>
              
              <p className="text-sm text-gray-500">
                Já tem uma conta?{' '}
                <Link href="/login" className="text-purple-600 hover:underline">
                  Fazer login
                </Link>
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="text-center mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Orkut.BR - A rede social brasileira que você estava esperando
            </p>
          </div>
        </OrkutCardContent>
      </OrkutCard>
    </div>
  )
}
