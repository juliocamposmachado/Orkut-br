'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { User, Settings, ArrowRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function SetupProfilePage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [setupLoading, setSetupLoading] = useState(false)
  const [formData, setFormData] = useState({
    displayName: '',
    username: ''
  })

  useEffect(() => {
    // Se já tem perfil, redirecionar para home
    if (profile) {
      router.push('/')
      return
    }

    // Se não tem usuário, redirecionar para login
    if (!loading && !user) {
      router.push('/login')
      return
    }

    // Pré-preencher com dados do usuário se disponíveis
    if (user) {
      setFormData({
        displayName: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
        username: generateUsernameFromEmail(user.email || '')
      })
    }
  }, [user, profile, loading, router])

  const generateUsernameFromEmail = (email: string): string => {
    const username = email.split('@')[0]
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 12)
    
    return `${username}${Math.random().toString(36).substring(2, 6)}`
  }

  const handleCreateProfile = async () => {
    if (!user) {
      toast.error('Erro: usuário não encontrado')
      return
    }

    if (!formData.displayName.trim() || !formData.username.trim()) {
      toast.error('Preencha todos os campos')
      return
    }

    setSetupLoading(true)

    try {
      // Verificar se username já existe
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', formData.username.trim())
        .single()

      if (existingUser) {
        toast.error('Username já existe. Tente outro.')
        setSetupLoading(false)
        return
      }

      // Criar perfil
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          username: formData.username.trim(),
          display_name: formData.displayName.trim(),
          photo_url: user.user_metadata?.avatar_url || null,
        })

      if (profileError) {
        throw profileError
      }

      // Criar configurações padrão
      await supabase
        .from('settings')
        .insert({
          profile_id: user.id,
        })
        .catch(() => {
          // Ignorar erro se já existir
        })

      toast.success('Perfil criado com sucesso!')
      
      // Aguardar um pouco para o contexto atualizar
      setTimeout(() => {
        router.push('/')
      }, 1000)

    } catch (error: any) {
      console.error('Erro ao criar perfil:', error)
      toast.error(`Erro ao criar perfil: ${error.message}`)
    } finally {
      setSetupLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Verificando conta...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // O useEffect vai redirecionar
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-purple-100 rounded-full p-4 inline-block mb-4">
            <Settings className="h-8 w-8 text-purple-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Finalizar Cadastro
          </h1>
          <p className="text-gray-600 text-sm">
            Vamos criar seu perfil no Orkut
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome de exibição
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                value={formData.displayName}
                onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                className="pl-10 border-purple-200 focus:border-purple-500"
                placeholder="Como você quer ser chamado?"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Este será o nome que aparece para outros usuários
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome de usuário (username)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-gray-400 text-sm">@</span>
              <Input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '')})}
                className="pl-8 border-purple-200 focus:border-purple-500"
                placeholder="seuusername"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Usado para seu perfil: orkut.com/perfil/@{formData.username || 'username'}
            </p>
          </div>

          {user.email && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Conectado como:</span>
              </div>
              <p className="text-sm font-medium text-purple-700 mt-1">
                {user.email}
              </p>
            </div>
          )}

          <Button
            onClick={handleCreateProfile}
            disabled={setupLoading || !formData.displayName.trim() || !formData.username.trim()}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            {setupLoading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Criando perfil...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <span>Criar Perfil</span>
                <ArrowRight className="h-4 w-4" />
              </div>
            )}
          </Button>

          <div className="text-center">
            <button
              onClick={() => router.push('/debug-oauth')}
              className="text-sm text-purple-600 hover:text-purple-800 underline"
            >
              Problemas? Ver informações de debug
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
