'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

// Enhanced types for user profile
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
  emailVerificationSent: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, userData: { username: string, displayName: string }) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<void>
  sendPasswordReset: (email: string) => Promise<void>
  resendEmailVerification: () => Promise<void>
  checkEmailVerified: () => Promise<boolean>
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
  const [emailVerificationSent, setEmailVerificationSent] = useState(false)

  // Check if Supabase is properly configured
  const isSupabaseConfigured = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    return supabaseUrl && 
           supabaseAnonKey && 
           !supabaseUrl.includes('placeholder') && 
           !supabaseUrl.includes('your_') &&
           supabaseUrl.startsWith('https://')
  }

  useEffect(() => {
    const initializeAuth = async () => {
      if (isSupabaseConfigured()) {
        // Initialize Supabase auth
        await initSupabaseAuth()
      } else {
        // Fallback mode
        console.warn('Supabase not configured, using fallback auth')
        await initFallbackAuth()
      }
    }

    initializeAuth()
  }, [])

  const initSupabaseAuth = async () => {
    try {
      // Get initial session
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Error getting session:', error)
        return
      }

      if (session?.user) {
        await handleSupabaseUser(session.user)
      }

      // Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state changed:', event)
        
        if (session?.user) {
          await handleSupabaseUser(session.user)
        } else {
          setUser(null)
          setProfile(null)
        }
        
        setLoading(false)
      })

      return () => subscription.unsubscribe()
    } catch (error) {
      console.error('Error initializing Supabase auth:', error)
      await initFallbackAuth()
    } finally {
      setTimeout(() => setLoading(false), 1000)
    }
  }

  const handleSupabaseUser = async (supabaseUser: any) => {
    const user: User = {
      id: supabaseUser.id,
      email: supabaseUser.email,
      email_confirmed_at: supabaseUser.email_confirmed_at,
      created_at: supabaseUser.created_at
    }

    setUser(user)

    // Load user profile
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading profile:', error)
        return
      }

      if (data) {
        setProfile({
          ...data,
          email_confirmed: !!user.email_confirmed_at,
          email_confirmed_at: user.email_confirmed_at
        })
      } else {
        // Create profile if it doesn't exist
        await createUserProfile(user, {
          username: user.email?.split('@')[0] || 'user',
          displayName: user.email?.split('@')[0] || 'Usuário'
        })
      }
    } catch (error) {
      console.error('Error handling user profile:', error)
    }
  }

  const initFallbackAuth = async () => {
    console.log('Initializing fallback auth')
    
    const storedUser = localStorage.getItem('orkut_user')
    const storedProfile = localStorage.getItem('orkut_profile')
    
    if (storedUser && storedProfile) {
      try {
        const user = JSON.parse(storedUser)
        const profile = JSON.parse(storedProfile)
        
        setUser(user)
        setProfile({
          ...profile,
          email_confirmed: true, // In fallback mode, consider emails confirmed
          email_confirmed_at: new Date().toISOString()
        })
      } catch (error) {
        console.error('Error parsing stored auth data:', error)
        localStorage.removeItem('orkut_user')
        localStorage.removeItem('orkut_profile')
      }
    }
    
    setLoading(false)
  }

  const signIn = async (email: string, password: string) => {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        if (error.message.includes('Email not confirmed')) {
          throw new Error('Por favor, confirme seu email antes de fazer login. Verifique sua caixa de entrada.')
        }
        throw error
      }

      // User will be handled by the auth state change listener
    } else {
      // Fallback mode
      const mockUserId = crypto.randomUUID()
      const mockUser: User = {
        id: mockUserId,
        email: email,
        email_confirmed_at: new Date().toISOString()
      }
      
      const mockProfile: Profile = {
        id: mockUser.id,
        username: email.split('@')[0],
        display_name: email.split('@')[0],
        created_at: new Date().toISOString(),
        photo_url: null,
        bio: null,
        location: null,
        birthday: null,
        relationship: null,
        fans_count: 0,
        email_confirmed: true,
        email_confirmed_at: new Date().toISOString()
      }
      
      localStorage.setItem('orkut_user', JSON.stringify(mockUser))
      localStorage.setItem('orkut_profile', JSON.stringify(mockProfile))
      
      setUser(mockUser)
      setProfile(mockProfile)
    }
  }

  const signUp = async (
    email: string, 
    password: string, 
    userData: { username: string, displayName: string }
  ) => {
    if (isSupabaseConfigured()) {
      // Check if username is already taken
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', userData.username)
        .single()

      if (existingProfile) {
        throw new Error('Nome de usuário já está em uso')
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: userData.username,
            display_name: userData.displayName
          }
        }
      })

      if (error) throw error

      if (data.user && !data.session) {
        // Email verification required
        setEmailVerificationSent(true)
        toast.success('Conta criada! Verifique seu email para ativar a conta.')
        return
      }

      // If user is immediately available, create profile
      if (data.user) {
        await createUserProfile(data.user, userData)
      }
    } else {
      // Fallback mode
      const mockUserId = crypto.randomUUID()
      const mockUser: User = {
        id: mockUserId,
        email: email,
        email_confirmed_at: new Date().toISOString()
      }
      
      const mockProfile: Profile = {
        id: mockUser.id,
        username: userData.username,
        display_name: userData.displayName,
        created_at: new Date().toISOString(),
        photo_url: null,
        bio: null,
        location: null,
        birthday: null,
        relationship: null,
        fans_count: 0,
        email_confirmed: true,
        email_confirmed_at: new Date().toISOString()
      }
      
      localStorage.setItem('orkut_user', JSON.stringify(mockUser))
      localStorage.setItem('orkut_profile', JSON.stringify(mockProfile))
      
      setUser(mockUser)
      setProfile(mockProfile)
    }
  }

  const createUserProfile = async (user: any, userData: { username: string, displayName: string }) => {
    try {
      const profileData = {
        id: user.id,
        username: userData.username,
        display_name: userData.displayName,
        photo_url: null,
        bio: null,
        location: null,
        birthday: null,
        relationship: 'Solteiro(a)',
        fans_count: 0
      }

      const { error } = await supabase
        .from('profiles')
        .insert([profileData])

      if (error) {
        console.error('Error creating profile:', error)
        throw error
      }

      // Reload profile
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (data) {
        setProfile({
          ...data,
          email_confirmed: !!user.email_confirmed_at,
          email_confirmed_at: user.email_confirmed_at
        })
      }
    } catch (error) {
      console.error('Error in createUserProfile:', error)
      throw error
    }
  }

  const signOut = async () => {
    if (isSupabaseConfigured()) {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Error signing out:', error)
      }
    } else {
      localStorage.removeItem('orkut_user')
      localStorage.removeItem('orkut_profile')
    }
    
    setUser(null)
    setProfile(null)
    setEmailVerificationSent(false)
  }

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!profile) return
    
    if (isSupabaseConfigured()) {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', profile.id)

      if (error) {
        console.error('Error updating profile:', error)
        throw error
      }
    }
    
    const updatedProfile = { ...profile, ...updates }
    localStorage.setItem('orkut_profile', JSON.stringify(updatedProfile))
    setProfile(updatedProfile)
  }

  const sendPasswordReset = async (email: string) => {
    if (isSupabaseConfigured()) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (error) throw error
      
      toast.success('Email de redefinição enviado! Verifique sua caixa de entrada.')
    } else {
      throw new Error('Redefinição de senha não disponível no modo offline')
    }
  }

  const resendEmailVerification = async () => {
    if (isSupabaseConfigured() && user?.email) {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email
      })

      if (error) throw error
      
      setEmailVerificationSent(true)
      toast.success('Email de verificação reenviado!')
    } else {
      throw new Error('Não é possível reenviar verificação no modo offline')
    }
  }

  const checkEmailVerified = async (): Promise<boolean> => {
    if (isSupabaseConfigured()) {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user) return false
      
      const isVerified = !!user.email_confirmed_at
      
      if (isVerified && profile && !profile.email_confirmed) {
        // Update local profile state
        setProfile({
          ...profile,
          email_confirmed: true,
          email_confirmed_at: user.email_confirmed_at
        })
      }
      
      return isVerified
    }
    
    return true // In fallback mode, always consider verified
  }

  const value: AuthContextType = {
    user,
    profile,
    loading,
    emailVerificationSent,
    signIn,
    signUp,
    signOut,
    updateProfile,
    sendPasswordReset,
    resendEmailVerification,
    checkEmailVerified
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
