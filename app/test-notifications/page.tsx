'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/local-auth-context'
import { Navbar } from '@/components/layout/navbar'
import { OrkutCard, OrkutCardContent, OrkutCardHeader } from '@/components/ui/orkut-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bell, Heart, UserPlus, MessageCircle, TestTube } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export default function TestNotificationsPage() {
  const { user, profile } = useAuth()
  const [isCreatingNotification, setIsCreatingNotification] = useState(false)
  const [testResults, setTestResults] = useState<string[]>([])

  const addTestResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const testLikeNotification = async () => {
    if (!user || !supabase) {
      toast.error('Usuário não logado ou Supabase indisponível')
      return
    }

    setIsCreatingNotification(true)
    addTestResult('🔄 Testando notificação de curtida...')

    try {
      const testNotification = {
        profile_id: user.id,
        type: 'like',
        payload: {
          from_user: {
            id: 'test-user-like',
            display_name: 'Usuário Teste (Curtida)',
            photo_url: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100',
            username: 'teste_curtida'
          },
          post: {
            id: 999,
            content: 'Este é um post de teste para verificar se as notificações de curtida funcionam corretamente!'
          },
          action_url: '/post/999'
        },
        read: false
      }

      const { error } = await supabase
        .from('notifications')
        .insert(testNotification)

      if (error) {
        throw error
      }

      addTestResult('✅ Notificação de curtida criada no banco!')
      toast.success('Notificação de curtida criada! Verifique o sino de notificações.')
    } catch (error) {
      addTestResult(`❌ Erro ao criar notificação de curtida: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
      toast.error('Erro ao criar notificação de curtida')
      console.error('Error creating like notification:', error)
    } finally {
      setIsCreatingNotification(false)
    }
  }

  const testFriendRequestNotification = async () => {
    if (!user || !supabase) {
      toast.error('Usuário não logado ou Supabase indisponível')
      return
    }

    setIsCreatingNotification(true)
    addTestResult('🔄 Testando notificação de solicitação de amizade...')

    try {
      const testNotification = {
        profile_id: user.id,
        type: 'friend_request',
        payload: {
          from_user: {
            id: 'test-user-friend',
            display_name: 'Usuário Teste (Amizade)',
            photo_url: 'https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&w=100',
            username: 'teste_amigo'
          },
          action_url: '/perfil/teste_amigo'
        },
        read: false
      }

      const { error } = await supabase
        .from('notifications')
        .insert(testNotification)

      if (error) {
        throw error
      }

      addTestResult('✅ Notificação de solicitação de amizade criada no banco!')
      toast.success('Notificação de solicitação de amizade criada! Verifique o sino de notificações.')
    } catch (error) {
      addTestResult(`❌ Erro ao criar notificação de amizade: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
      toast.error('Erro ao criar notificação de amizade')
      console.error('Error creating friend request notification:', error)
    } finally {
      setIsCreatingNotification(false)
    }
  }

  const testCommentNotification = async () => {
    if (!user || !supabase) {
      toast.error('Usuário não logado ou Supabase indisponível')
      return
    }

    setIsCreatingNotification(true)
    addTestResult('🔄 Testando notificação de comentário...')

    try {
      const testNotification = {
        profile_id: user.id,
        type: 'comment',
        payload: {
          from_user: {
            id: 'test-user-comment',
            display_name: 'Usuário Teste (Comentário)',
            photo_url: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=100',
            username: 'teste_comentario'
          },
          post: {
            id: 998,
            content: 'Post para testar comentários e notificações'
          },
          comment: 'Que post interessante! Parabéns pelo conteúdo!',
          action_url: '/post/998#comments'
        },
        read: false
      }

      const { error } = await supabase
        .from('notifications')
        .insert(testNotification)

      if (error) {
        throw error
      }

      addTestResult('✅ Notificação de comentário criada no banco!')
      toast.success('Notificação de comentário criada! Verifique o sino de notificações.')
    } catch (error) {
      addTestResult(`❌ Erro ao criar notificação de comentário: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
      toast.error('Erro ao criar notificação de comentário')
      console.error('Error creating comment notification:', error)
    } finally {
      setIsCreatingNotification(false)
    }
  }

  const clearTestResults = () => {
    setTestResults([])
  }

  const clearAllNotifications = async () => {
    if (!user || !supabase) {
      toast.error('Usuário não logado ou Supabase indisponível')
      return
    }

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('profile_id', user.id)

      if (error) {
        throw error
      }

      // Also clear localStorage
      localStorage.removeItem(`notifications_${user.id}`)

      addTestResult('🗑️ Todas as notificações foram removidas!')
      toast.success('Todas as notificações foram removidas!')
    } catch (error) {
      addTestResult(`❌ Erro ao limpar notificações: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
      toast.error('Erro ao limpar notificações')
      console.error('Error clearing notifications:', error)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Acesso Restrito</h2>
          <p className="text-gray-600">Você precisa estar logado para testar as notificações.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-2">
            <TestTube className="h-8 w-8 text-purple-600" />
            Teste do Sistema de Notificações
          </h1>
          <p className="text-gray-600">
            Use esta página para testar se as notificações reais estão funcionando corretamente.
          </p>
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">Como usar:</h3>
            <ol className="text-sm text-blue-700 space-y-1">
              <li>1. Clique nos botões abaixo para criar notificações de teste</li>
              <li>2. Verifique se o sino de notificações no topo da página mostra um número</li>
              <li>3. Clique no sino para ver as notificações</li>
              <li>4. As notificações devem aparecer com dados reais (não mais dados de exemplo)</li>
            </ol>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Test Controls */}
          <OrkutCard>
            <OrkutCardHeader>
              <span className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Controles de Teste
              </span>
            </OrkutCardHeader>
            <OrkutCardContent className="space-y-4">
              <div className="space-y-3">
                <Button
                  onClick={testLikeNotification}
                  disabled={isCreatingNotification}
                  className="w-full bg-red-500 hover:bg-red-600 text-white"
                >
                  <Heart className="h-4 w-4 mr-2" />
                  {isCreatingNotification ? 'Criando...' : 'Testar Notificação de Curtida'}
                </Button>

                <Button
                  onClick={testFriendRequestNotification}
                  disabled={isCreatingNotification}
                  className="w-full bg-purple-500 hover:bg-purple-600 text-white"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  {isCreatingNotification ? 'Criando...' : 'Testar Solicitação de Amizade'}
                </Button>

                <Button
                  onClick={testCommentNotification}
                  disabled={isCreatingNotification}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  {isCreatingNotification ? 'Criando...' : 'Testar Notificação de Comentário'}
                </Button>

                <div className="border-t pt-3 space-y-2">
                  <Button
                    onClick={clearAllNotifications}
                    variant="outline"
                    className="w-full border-red-300 text-red-700 hover:bg-red-50"
                  >
                    🗑️ Limpar Todas as Notificações
                  </Button>
                  
                  <Button
                    onClick={clearTestResults}
                    variant="ghost"
                    size="sm"
                    className="w-full"
                  >
                    Limpar Log de Testes
                  </Button>
                </div>
              </div>
            </OrkutCardContent>
          </OrkutCard>

          {/* Test Results */}
          <OrkutCard>
            <OrkutCardHeader>
              <span className="flex items-center gap-2">
                <Badge variant="outline" className="ml-auto">
                  {testResults.length} eventos
                </Badge>
                Log de Testes
              </span>
            </OrkutCardHeader>
            <OrkutCardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {testResults.length === 0 ? (
                  <p className="text-gray-500 text-sm italic">
                    Nenhum teste executado ainda. Clique nos botões ao lado para começar.
                  </p>
                ) : (
                  testResults.map((result, index) => (
                    <div
                      key={index}
                      className="text-xs font-mono bg-gray-50 p-2 rounded border"
                    >
                      {result}
                    </div>
                  ))
                )}
              </div>
            </OrkutCardContent>
          </OrkutCard>
        </div>

        <div className="mt-8">
          <OrkutCard>
            <OrkutCardHeader>
              <span>Status do Sistema</span>
            </OrkutCardHeader>
            <OrkutCardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Usuário logado:</span>
                  <Badge variant="default" className="bg-green-100 text-green-700">
                    {profile?.display_name || user.email}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Supabase:</span>
                  <Badge variant="default" className="bg-green-100 text-green-700">
                    {supabase ? 'Conectado' : 'Desconectado'}
                  </Badge>
                </div>
                <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
                  <strong>Importante:</strong> Para que as notificações funcionem completamente, 
                  você precisa ter executado o script SQL <code>CRIAR_TABELA_NOTIFICACOES.sql</code> no 
                  seu banco de dados Supabase.
                </div>
              </div>
            </OrkutCardContent>
          </OrkutCard>
        </div>
      </div>
    </div>
  )
}
