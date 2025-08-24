'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/enhanced-auth-context'
import { Navbar } from '@/components/layout/navbar'
import { OrkutCard, OrkutCardContent, OrkutCardHeader } from '@/components/ui/orkut-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Users, CheckCircle, AlertCircle, RefreshCw, Database } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export default function FixPresencePage() {
  const { user, profile } = useAuth()
  const [isFixing, setIsFixing] = useState(false)
  const [presenceStatus, setPresenceStatus] = useState<'checking' | 'exists' | 'missing' | 'error'>('checking')
  const [onlineUsers, setOnlineUsers] = useState([])

  useEffect(() => {
    if (user) {
      checkUserPresence()
      loadOnlineUsers()
    }
  }, [user])

  const checkUserPresence = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('user_presence')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = not found
        console.error('Error checking presence:', error)
        setPresenceStatus('error')
      } else if (data) {
        setPresenceStatus('exists')
      } else {
        setPresenceStatus('missing')
      }
    } catch (error) {
      console.error('Error checking presence:', error)
      setPresenceStatus('error')
    }
  }

  const loadOnlineUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_presence')
        .select(`
          user_id,
          is_online,
          last_seen,
          profiles!user_presence_user_id_fkey(
            display_name,
            username
          )
        `)
        .eq('is_online', true)
        .gte('last_seen', new Date(Date.now() - 5 * 60 * 1000).toISOString())

      if (!error && data) {
        setOnlineUsers(data)
      }
    } catch (error) {
      console.error('Error loading online users:', error)
    }
  }

  const createUserPresence = async () => {
    if (!user) return

    setIsFixing(true)
    try {
      // Usar a função simples que sempre funciona
      const { data, error } = await supabase.rpc('simple_mark_online', {
        p_user_id: user.id
      })

      if (!error) {
        toast.success('✅ Presença criada com sucesso!')
        setPresenceStatus('exists')
        await loadOnlineUsers()
      } else {
        console.error('Erro na função simple_mark_online:', error)
        toast.error(`❌ Erro: ${error.message}`)
      }
    } catch (error) {
      console.error('Error creating presence:', error)
      toast.error('❌ Erro ao criar presença do usuário')
    } finally {
      setIsFixing(false)
    }
  }

  const markAsOnline = async () => {
    if (!user) return

    setIsFixing(true)
    try {
      const { error } = await supabase
        .from('user_presence')
        .update({
          is_online: true,
          last_seen: new Date().toISOString()
        })
        .eq('user_id', user.id)

      if (!error) {
        toast.success('✅ Status atualizado para online!')
        await loadOnlineUsers()
      } else {
        toast.error(`❌ Erro ao atualizar status: ${error.message}`)
      }
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('❌ Erro ao atualizar status')
    } finally {
      setIsFixing(false)
    }
  }

  const refreshData = async () => {
    setIsFixing(true)
    await checkUserPresence()
    await loadOnlineUsers()
    setIsFixing(false)
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Acesso Restrito</h2>
          <p className="text-gray-600">Você precisa estar logado para acessar esta página.</p>
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
            <Database className="h-8 w-8 text-purple-600" />
            Corrigir Sistema de Presença
          </h1>
          <p className="text-gray-600">
            Esta página ajuda a corrigir problemas com o sistema de presença online.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Status da Presença */}
          <OrkutCard>
            <OrkutCardHeader>
              <span className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Status da Presença
              </span>
            </OrkutCardHeader>
            <OrkutCardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Usuário:</span>
                <Badge variant="default" className="bg-blue-100 text-blue-700">
                  {profile?.display_name || user.email}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status da Presença:</span>
                {presenceStatus === 'checking' && (
                  <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                    Verificando
                  </Badge>
                )}
                {presenceStatus === 'exists' && (
                  <Badge variant="default" className="bg-green-100 text-green-700">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Existe
                  </Badge>
                )}
                {presenceStatus === 'missing' && (
                  <Badge variant="destructive" className="bg-red-100 text-red-700">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Não existe
                  </Badge>
                )}
                {presenceStatus === 'error' && (
                  <Badge variant="destructive" className="bg-orange-100 text-orange-700">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Erro
                  </Badge>
                )}
              </div>

              <div className="space-y-2">
                {presenceStatus === 'missing' && (
                  <Button
                    onClick={createUserPresence}
                    disabled={isFixing}
                    className="w-full bg-green-500 hover:bg-green-600"
                  >
                    {isFixing ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Users className="h-4 w-4 mr-2" />
                    )}
                    Criar Presença do Usuário
                  </Button>
                )}
                
                {presenceStatus === 'exists' && (
                  <Button
                    onClick={markAsOnline}
                    disabled={isFixing}
                    className="w-full bg-blue-500 hover:bg-blue-600"
                  >
                    {isFixing ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Marcar como Online
                  </Button>
                )}
                
                <Button
                  onClick={refreshData}
                  disabled={isFixing}
                  variant="outline"
                  className="w-full"
                >
                  {isFixing ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Atualizar Status
                </Button>
              </div>
            </OrkutCardContent>
          </OrkutCard>

          {/* Usuários Online */}
          <OrkutCard>
            <OrkutCardHeader>
              <span className="flex items-center gap-2">
                <Badge variant="outline" className="ml-auto">
                  {onlineUsers.length} online
                </Badge>
                Usuários Online
              </span>
            </OrkutCardHeader>
            <OrkutCardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {onlineUsers.length === 0 ? (
                  <p className="text-gray-500 text-sm italic text-center py-4">
                    Nenhum usuário online encontrado.
                    <br />
                    Tente criar sua presença primeiro.
                  </p>
                ) : (
                  onlineUsers.map((user: any, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded"
                    >
                      <div>
                        <div className="text-sm font-medium">
                          {user.profiles?.display_name || 'Usuário Desconhecido'}
                        </div>
                        <div className="text-xs text-gray-500">
                          @{user.profiles?.username || 'unknown'}
                        </div>
                      </div>
                      <Badge variant="default" className="bg-green-100 text-green-700 text-xs">
                        Online
                      </Badge>
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
              <span>Instruções</span>
            </OrkutCardHeader>
            <OrkutCardContent>
              <div className="space-y-3 text-sm">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                  <strong>1. Execute o Script SQL:</strong> Primeiro, certifique-se de que executou o arquivo 
                  <code className="mx-1 px-2 py-1 bg-gray-200 rounded">CRIAR_TABELAS_WEBRTC.sql</code> 
                  no seu Supabase.
                </div>
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <strong>2. Crie sua Presença:</strong> Se aparecer "Não existe", clique em 
                  "Criar Presença do Usuário" para criar seu registro na tabela.
                </div>
                <div className="p-3 bg-green-50 border border-green-200 rounded">
                  <strong>3. Marque-se Online:</strong> Depois de criar a presença, clique em 
                  "Marcar como Online" para aparecer na lista de usuários online.
                </div>
                <div className="p-3 bg-purple-50 border border-purple-200 rounded">
                  <strong>4. Teste as Chamadas:</strong> Agora você pode voltar para a página principal 
                  e testar o sistema WebRTC com outros usuários online.
                </div>
              </div>
            </OrkutCardContent>
          </OrkutCard>
        </div>
      </div>
    </div>
  )
}
