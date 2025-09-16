'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { toast } from 'sonner'

// Tipos locais baseados no sistema existente
type Profile = {
  id: string
  username: string
  display_name: string
  photo_url: string | null
  relationship: string | null
  location: string | null
  birthday: string | null
  bio: string | null
  fans_count: number
  created_at: string
  email_confirmed: boolean
  email_confirmed_at: string | null
  role?: string | null
}

interface User {
  id: string
  email?: string
  email_confirmed_at?: string | null
  created_at?: string
}

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, userData: { username: string, displayName: string }) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<void>
  isAdmin: () => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  // Chave para armazenar o token da sessão
  const SESSION_KEY = 'orkut_session_token'
  const USER_KEY = 'orkut_user_data'
  const PROFILE_KEY = 'orkut_profile_data'

  // Inicializar autenticação
  useEffect(() => {
    initializeAuth()
  }, [])

  const initializeAuth = async () => {
    console.log('🚀 [LOCAL AUTH] Inicializando autenticação local...')
    
    try {
      const sessionToken = localStorage.getItem(SESSION_KEY)
      
      if (sessionToken) {
        console.log('🔍 [LOCAL AUTH] Token de sessão encontrado, verificando...')
        
        // Verificar se a sessão ainda é válida
        const response = await fetch('/api/auth/local', {
          method: 'GET',
          headers: {
            'authorization': `Bearer ${sessionToken}`,
            'content-type': 'application/json'
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            console.log('✅ [LOCAL AUTH] Sessão válida, restaurando usuário')
            setUser(data.user)
            setProfile(data.profile)
            
            // Atualizar localStorage com dados mais recentes
            localStorage.setItem(USER_KEY, JSON.stringify(data.user))
            localStorage.setItem(PROFILE_KEY, JSON.stringify(data.profile))
          } else {
            console.log('❌ [LOCAL AUTH] Sessão inválida, limpando dados')
            clearAuthData()
          }
        } else {
          console.log('❌ [LOCAL AUTH] Erro na verificação da sessão')
          clearAuthData()
        }
      } else {
        console.log('ℹ️ [LOCAL AUTH] Nenhum token de sessão encontrado')
      }
    } catch (error) {
      console.error('❌ [LOCAL AUTH] Erro na inicialização:', error)
      clearAuthData()
    } finally {
      setLoading(false)
    }
  }

  const clearAuthData = () => {
    localStorage.removeItem(SESSION_KEY)
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem(PROFILE_KEY)
    setUser(null)
    setProfile(null)
  }

  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔐 [LOCAL AUTH] Tentando fazer login com:', email)
      
      const response = await fetch('/api/auth/local', {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          action: 'login',
          email,
          password
        })
      })
      
      const data = await response.json()
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro no login')
      }
      
      // Salvar dados da sessão
      localStorage.setItem(SESSION_KEY, data.session_token)
      localStorage.setItem(USER_KEY, JSON.stringify(data.user))
      localStorage.setItem(PROFILE_KEY, JSON.stringify(data.profile))
      
      setUser(data.user)
      setProfile(data.profile)
      
      console.log('✅ [LOCAL AUTH] Login realizado com sucesso')
      toast.success('Login realizado com sucesso!')
      
    } catch (error: any) {
      console.error('❌ [LOCAL AUTH] Erro no login:', error)
      toast.error(error.message || 'Erro no login')
      throw error
    }
  }

  const signUp = async (
    email: string, 
    password: string, 
    userData: { username: string, displayName: string }
  ) => {
    try {
      console.log('📝 [LOCAL AUTH] Tentando registrar usuário:', email)
      
      const response = await fetch('/api/auth/local', {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          action: 'register',
          email,
          password,
          username: userData.username,
          displayName: userData.displayName
        })
      })
      
      const data = await response.json()
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro no cadastro')
      }
      
      // Salvar dados da sessão
      localStorage.setItem(SESSION_KEY, data.session_token)
      localStorage.setItem(USER_KEY, JSON.stringify(data.user))
      localStorage.setItem(PROFILE_KEY, JSON.stringify(data.profile))
      
      setUser(data.user)
      setProfile(data.profile)
      
      console.log('🎉 [LOCAL AUTH] Cadastro realizado com sucesso')
      toast.success('Conta criada com sucesso!')
      
    } catch (error: any) {
      console.error('❌ [LOCAL AUTH] Erro no cadastro:', error)
      toast.error(error.message || 'Erro no cadastro')
      throw error
    }
  }

  const signInWithGoogle = async () => {
    try {
      console.log('🌐 [LOCAL AUTH] Simulando login com Google...')
      
      // Para demonstração, vou simular dados do Google
      // Em uma implementação real, você integraria com a API do Google OAuth
      const mockGoogleData = {
        id: `google_${Date.now()}`,
        email: 'usuario@gmail.com', // Você poderia pedir para o usuário inserir
        name: 'Usuário Google',
        picture: 'https://lh3.googleusercontent.com/a/default-user=s96-c'
      }
      
      toast.info('🔄 Simulando login com Google...')
      
      // Simular delay da API do Google
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const response = await fetch('/api/auth/local', {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          action: 'google_login',
          googleData: mockGoogleData
        })
      })
      
      const data = await response.json()
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro no login com Google')
      }
      
      // Salvar dados da sessão
      localStorage.setItem(SESSION_KEY, data.session_token)
      localStorage.setItem(USER_KEY, JSON.stringify(data.user))
      localStorage.setItem(PROFILE_KEY, JSON.stringify(data.profile))
      
      setUser(data.user)
      setProfile(data.profile)
      
      console.log('✅ [LOCAL AUTH] Login com Google realizado com sucesso')
      toast.success('Login com Google realizado com sucesso!')
      
    } catch (error: any) {
      console.error('❌ [LOCAL AUTH] Erro no login com Google:', error)
      toast.error(error.message || 'Erro no login com Google')
      throw error
    }
  }

  const signOut = async () => {
    try {
      console.log('👋 [LOCAL AUTH] Fazendo logout...')
      
      const sessionToken = localStorage.getItem(SESSION_KEY)
      
      if (sessionToken) {
        // Notificar o servidor sobre o logout
        await fetch('/api/auth/local', {
          method: 'DELETE',
          headers: {
            'authorization': `Bearer ${sessionToken}`,
            'content-type': 'application/json'
          }
        })
      }
      
      clearAuthData()
      console.log('✅ [LOCAL AUTH] Logout realizado com sucesso')
      toast.success('Logout realizado com sucesso!')
      
    } catch (error: any) {
      console.error('❌ [LOCAL AUTH] Erro no logout:', error)
      // Mesmo com erro, limpar dados locais
      clearAuthData()
      toast.success('Logout realizado!')
    }
  }

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!profile || !user) {
      throw new Error('Usuário não autenticado')
    }
    
    try {
      console.log('📝 [LOCAL AUTH] Atualizando perfil...')
      
      // Em uma implementação completa, você faria uma chamada para a API
      // Por enquanto, vamos atualizar localmente
      const updatedProfile = { ...profile, ...updates }
      
      localStorage.setItem(PROFILE_KEY, JSON.stringify(updatedProfile))
      setProfile(updatedProfile)
      
      console.log('✅ [LOCAL AUTH] Perfil atualizado com sucesso')
      toast.success('Perfil atualizado!')
      
    } catch (error: any) {
      console.error('❌ [LOCAL AUTH] Erro ao atualizar perfil:', error)
      toast.error(error.message || 'Erro ao atualizar perfil')
      throw error
    }
  }

  const isAdmin = () => {
    return profile?.role === 'admin' || profile?.role === 'moderator'
  }

  const value: AuthContextType = {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    updateProfile,
    isAdmin
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
