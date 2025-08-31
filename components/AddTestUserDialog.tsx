'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { UserPlus, Phone, Video, Trash2 } from 'lucide-react'

interface TestUser {
  id: string
  email: string
  full_name: string
  phone?: string
  isOnline: boolean
}

export function AddTestUserDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [testUsers, setTestUsers] = useState<TestUser[]>([])
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    phone: ''
  })

  // Carregar usuários de teste ao abrir
  React.useEffect(() => {
    if (open) {
      loadTestUsers()
    }
  }, [open])

  const loadTestUsers = async () => {
    try {
      // Buscar usuários que não são o usuário atual
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, phone')
        .neq('id', currentUser?.id || '')
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) {
        console.error('Erro ao carregar usuários:', error)
        return
      }

      // Buscar status online de cada usuário
      const usersWithStatus = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: presence } = await supabase
            .from('user_presence')
            .select('is_online')
            .eq('user_id', profile.id)
            .single()
          
          return {
            ...profile,
            isOnline: presence?.is_online || false
          }
        })
      )

      setTestUsers(usersWithStatus)
    } catch (error) {
      console.error('Erro ao carregar usuários de teste:', error)
    }
  }

  const addTestUser = async () => {
    if (!formData.email || !formData.fullName) {
      toast.error('Email e nome são obrigatórios')
      return
    }

    setLoading(true)
    
    try {
      // Criar usuário via Supabase Auth Admin API (simulado)
      // Para desenvolvimento, vamos criar apenas o profile
      const fakeUserId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      
      // Inserir profile de teste
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: fakeUserId,
          email: formData.email,
          full_name: formData.fullName,
          phone: formData.phone || null,
          username: formData.email.split('@')[0],
          created_at: new Date().toISOString()
        })

      if (profileError) {
        throw profileError
      }

      // Marcar como online para teste
      const { error: presenceError } = await supabase.rpc('upsert_user_presence', {
        p_user_id: fakeUserId,
        p_is_online: true,
        p_status: 'online',
        p_device_info: { platform: 'test', created_by: 'manual_add' }
      })

      if (presenceError) {
        console.warn('Erro ao definir presença:', presenceError)
      }

      toast.success('Usuário de teste adicionado com sucesso!')
      
      // Limpar formulário
      setFormData({ email: '', fullName: '', phone: '' })
      
      // Recarregar lista
      await loadTestUsers()
      
    } catch (error: any) {
      console.error('Erro ao adicionar usuário:', error)
      toast.error(error.message || 'Erro ao adicionar usuário')
    } finally {
      setLoading(false)
    }
  }

  const removeTestUser = async (userId: string) => {
    try {
      // Remover presença
      await supabase
        .from('user_presence')
        .delete()
        .eq('user_id', userId)

      // Remover profile
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)

      if (error) {
        throw error
      }

      toast.success('Usuário removido')
      await loadTestUsers()
    } catch (error: any) {
      toast.error('Erro ao remover usuário')
      console.error(error)
    }
  }

  const toggleUserOnline = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.rpc('upsert_user_presence', {
        p_user_id: userId,
        p_is_online: !currentStatus,
        p_status: !currentStatus ? 'online' : 'offline',
        p_device_info: { platform: 'test', manual_toggle: true }
      })

      if (error) {
        throw error
      }

      toast.success(`Usuário ${!currentStatus ? 'online' : 'offline'}`)
      await loadTestUsers()
    } catch (error: any) {
      toast.error('Erro ao alterar status')
      console.error(error)
    }
  }

  const startTestCall = async (userId: string, callType: 'audio' | 'video') => {
    try {
      console.log(`🚀 Iniciando chamada ${callType} para usuário:`, userId)
      
      // Encontrar dados do usuário
      const targetUser = testUsers.find(u => u.id === userId)
      if (!targetUser) {
        toast.error('Usuário não encontrado')
        return
      }
      
      // Criar sessão de chamada no banco
      const { data: callSession, error: callError } = await supabase
        .from('call_sessions')
        .insert({
          caller_id: (await supabase.auth.getUser()).data.user?.id,
          callee_id: userId,
          call_type: callType,
          status: 'calling',
          metadata: {
            target_user: targetUser,
            initiated_from: 'test_dialog'
          }
        })
        .select()
        .single()
      
      if (callError) {
        throw callError
      }
      
      // Solicitar permissões de mídia
      const constraints = {
        audio: true,
        video: callType === 'video'
      }
      
      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints)
        
        toast.success(`📞 Chamada ${callType === 'audio' ? 'de áudio' : 'de vídeo'} iniciada!`)
        toast.info(`🎯 Chamando ${targetUser.full_name}...`)
        
        // Log detalhado para debug
        console.log('✅ Stream obtido:', {
          id: stream.id,
          audioTracks: stream.getAudioTracks().length,
          videoTracks: stream.getVideoTracks().length,
          active: stream.active
        })
        
        // Simular duração da chamada
        setTimeout(() => {
          // Parar stream após teste
          stream.getTracks().forEach(track => {
            track.stop()
            console.log(`🛑 Track parado: ${track.kind}`)
          })
          
          // Atualizar status da chamada
          supabase
            .from('call_sessions')
            .update({ 
              status: 'ended', 
              ended_at: new Date().toISOString(),
              duration_seconds: 10 
            })
            .eq('id', callSession.id)
            .then(() => {
              toast.success('📞 Chamada de teste finalizada!')
            })
        }, 10000) // 10 segundos de teste
        
      } catch (mediaError: any) {
        console.error('❌ Erro ao obter mídia:', mediaError)
        toast.error(`Erro de mídia: ${mediaError.message}`)
        
        // Atualizar status da chamada como rejeitada
        await supabase
          .from('call_sessions')
          .update({ status: 'rejected' })
          .eq('id', callSession.id)
      }
      
    } catch (error: any) {
      console.error('❌ Erro ao iniciar chamada:', error)
      toast.error(error.message || 'Erro ao iniciar chamada')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <UserPlus className="h-4 w-4" />
          Gerenciar Usuários de Teste
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>🧪 Gerenciar Usuários de Teste</DialogTitle>
          <DialogDescription>
            Adicione usuários fictícios para testar chamadas e funcionalidades do WebRTC
          </DialogDescription>
        </DialogHeader>

        {/* Formulário para adicionar usuário */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">➕ Adicionar Novo Usuário</CardTitle>
            <CardDescription>
              Crie um usuário fictício para testes de chamada
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="teste@exemplo.com"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="fullName">Nome Completo *</Label>
                <Input
                  id="fullName"
                  placeholder="João da Silva"
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                />
              </div>
              
              <div className="md:col-span-2">
                <Label htmlFor="phone">Telefone (opcional)</Label>
                <Input
                  id="phone"
                  placeholder="+55 11 99999-9999"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
            </div>
            
            <Button 
              onClick={addTestUser} 
              disabled={loading || !formData.email || !formData.fullName}
              className="w-full"
            >
              {loading ? 'Adicionando...' : 'Adicionar Usuário de Teste'}
            </Button>
          </CardContent>
        </Card>

        {/* Lista de usuários existentes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">👥 Usuários Disponíveis</CardTitle>
            <CardDescription>
              Usuários que você pode usar para testar chamadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {testUsers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum usuário de teste encontrado</p>
                <p className="text-sm">Adicione usuários acima para começar a testar</p>
              </div>
            ) : (
              <div className="space-y-3">
                {testUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${user.isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                      <div>
                        <p className="font-medium">{user.full_name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                        {user.phone && (
                          <p className="text-sm text-gray-400">{user.phone}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {/* Toggle Online Status */}
                      <Button
                        variant={user.isOnline ? "destructive" : "default"}
                        size="sm"
                        onClick={() => toggleUserOnline(user.id, user.isOnline)}
                      >
                        {user.isOnline ? 'Offline' : 'Online'}
                      </Button>
                      
                      {/* Chamada de Áudio */}
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!user.isOnline}
                        onClick={() => startTestCall(user.id, 'audio')}
                        className="gap-1"
                      >
                        <Phone className="h-4 w-4" />
                      </Button>
                      
                      {/* Chamada de Vídeo */}
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!user.isOnline}
                        onClick={() => startTestCall(user.id, 'video')}
                        className="gap-1"
                      >
                        <Video className="h-4 w-4" />
                      </Button>
                      
                      {/* Remover usuário */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTestUser(user.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Fechar
          </Button>
          <Button onClick={loadTestUsers}>
            🔄 Atualizar Lista
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
