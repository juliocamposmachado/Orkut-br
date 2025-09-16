'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { toast } from 'sonner'

/**
 * 🗄️ ORKUT PASTEDB AUTH CONTEXT
 * =============================
 * 
 * Contexto de autenticação usando banco descentralizado PasteDB (dpaste.org)
 * Sistema completamente independente sem dependência de Google ou outros provedores
 */

// Tipos baseados no sistema PasteDB
interface User {
  id: string
  email?: string
  email_confirmed_at?: string | null
  created_at?: number
}

interface Profile {
  id: string
  username: string
  display_name: string
  photo_url?: string | null
  relationship?: string | null
  location?: string | null
  birthday?: string | null
  bio?: string | null
  fans_count: number
  created_at: number
  email_confirmed: boolean
  email_confirmed_at?: string | null
  role?: string
}

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, userData: { username: string, displayName: string }) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<void>
  isAdmin: () => boolean
}

const PasteDBAuthContext = createContext<AuthContextType | undefined>(undefined)

export function usePasteDBAuth() {
  const context = useContext(PasteDBAuthContext)
  if (context === undefined) {
    throw new Error('usePasteDBAuth must be used within a PasteDBAuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function PasteDBAuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  // Chaves para localStorage
  const SESSION_KEY = 'pastedb_session_token'
  const USER_KEY = 'pastedb_user_data'
  const PROFILE_KEY = 'pastedb_profile_data'

  // API endpoint
  const API_ENDPOINT = '/api/auth/pastedb'

  // Inicializar autenticação ao carregar
  useEffect(() => {
    initializeAuth()
  }, [])

  const initializeAuth = async () => {
    console.log('🚀 [PASTEDB AUTH] Inicializando autenticação PasteDB...')
    
    try {
      const sessionToken = localStorage.getItem(SESSION_KEY)
      
      if (sessionToken) {
        console.log('🔍 [PASTEDB AUTH] Token encontrado, validando sessão...')
        
        // Validar sessão no servidor
        const response = await fetch(API_ENDPOINT, {
          method: 'GET',
          headers: {
            'authorization': `Bearer ${sessionToken}`,
            'content-type': 'application/json'
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.user && data.profile) {
            console.log('✅ [PASTEDB AUTH] Sessão válida, restaurando usuário:', data.profile.username)
            setUser(data.user)
            setProfile(data.profile)
            
            // Atualizar dados locais
            localStorage.setItem(USER_KEY, JSON.stringify(data.user))
            localStorage.setItem(PROFILE_KEY, JSON.stringify(data.profile))
          } else {
            console.log('❌ [PASTEDB AUTH] Sessão inválida, limpando dados')
            clearAuthData()
          }
        } else {
          console.log('❌ [PASTEDB AUTH] Erro na validação da sessão')
          clearAuthData()
        }
      } else {
        console.log('ℹ️ [PASTEDB AUTH] Nenhum token de sessão encontrado')
      }
    } catch (error) {
      console.error('❌ [PASTEDB AUTH] Erro na inicialização:', error)
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
      console.log('🔐 [PASTEDB AUTH] Tentando login com:', email)
      
      const response = await fetch(API_ENDPOINT, {
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
      
      console.log('✅ [PASTEDB AUTH] Login realizado com sucesso para:', data.profile.username)
      toast.success(`Bem-vindo, ${data.profile.display_name}!`, {
        description: 'Login realizado usando banco descentralizado'
      })
      
    } catch (error: any) {
      console.error('❌ [PASTEDB AUTH] Erro no login:', error)
      const message = error.message || 'Erro no login'
      toast.error('Erro no login', {
        description: message
      })
      throw error
    }
  }

  const signUp = async (
    email: string, 
    password: string, 
    userData: { username: string, displayName: string }
  ) => {
    try {
      console.log('📝 [PASTEDB AUTH] Registrando usuário:', email, userData.username)
      
      const response = await fetch(API_ENDPOINT, {
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
      
      console.log('✅ [PASTEDB AUTH] Cadastro realizado com sucesso para:', data.profile.username)
      toast.success(`Conta criada com sucesso!`, {
        description: `Usuário @${data.profile.username} criado no banco descentralizado`
      })
      
    } catch (error: any) {
      console.error('❌ [PASTEDB AUTH] Erro no cadastro:', error)
      const message = error.message || 'Erro no cadastro'
      toast.error('Erro no cadastro', {
        description: message
      })
      throw error
    }
  }

  const signOut = async () => {
    try {
      console.log('👋 [PASTEDB AUTH] Fazendo logout...')
      
      const sessionToken = localStorage.getItem(SESSION_KEY)
      
      if (sessionToken) {
        // Invalidar sessão no servidor
        await fetch(API_ENDPOINT, {
          method: 'DELETE',
          headers: {
            'authorization': `Bearer ${sessionToken}`,
            'content-type': 'application/json'
          }
        })
      }
      
      clearAuthData()
      console.log('✅ [PASTEDB AUTH] Logout realizado com sucesso')
      toast.success('Logout realizado', {
        description: 'Sessão encerrada com segurança'
      })
      
    } catch (error: any) {
      console.error('❌ [PASTEDB AUTH] Erro no logout:', error)
      // Mesmo com erro, limpar dados locais
      clearAuthData()
      toast.success('Logout realizado')
    }
  }

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!profile || !user) {
      throw new Error('Usuário não autenticado')
    }
    
    try {
      console.log('📝 [PASTEDB AUTH] Atualizando perfil...')
      
      // Por enquanto, atualizamos localmente
      // Em uma implementação futura, você pode criar um endpoint específico para isso
      const updatedProfile = { ...profile, ...updates }
      
      localStorage.setItem(PROFILE_KEY, JSON.stringify(updatedProfile))
      setProfile(updatedProfile)
      
      console.log('✅ [PASTEDB AUTH] Perfil atualizado localmente')
      toast.success('Perfil atualizado!')
      
    } catch (error: any) {
      console.error('❌ [PASTEDB AUTH] Erro ao atualizar perfil:', error)
      toast.error('Erro ao atualizar perfil')
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
    signOut,
    updateProfile,
    isAdmin
  }

  return (
    <PasteDBAuthContext.Provider value={value}>
      {children}
    </PasteDBAuthContext.Provider>
  )
}

// Hook alternativo com alias
export const useAuth = usePasteDBAuth
