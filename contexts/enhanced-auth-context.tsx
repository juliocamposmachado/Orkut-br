'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { getProxiedImageUrl } from '@/hooks/use-google-image-proxy'

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
  signInWithGoogle: () => Promise<void>
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

    // Debug: Log completo dos metadados do usuário
    console.log('🔍 [DEBUG] Dados completos do usuário Supabase:')
    console.log('- ID:', supabaseUser.id)
    console.log('- Email:', supabaseUser.email)
    console.log('- User Metadata:', JSON.stringify(supabaseUser.user_metadata, null, 2))
    console.log('- App Metadata:', JSON.stringify(supabaseUser.app_metadata, null, 2))
    console.log('- Identities:', JSON.stringify(supabaseUser.identities, null, 2))

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
        // Tentar várias fontes para a foto do Google
        let googlePhoto = null
        
        // Verificar múltiplas fontes de foto
        const photoSources = [
          supabaseUser.user_metadata?.avatar_url,
          supabaseUser.user_metadata?.picture, 
          supabaseUser.user_metadata?.photo_url,
          // Verificar também nas identities (mais confiável)
          supabaseUser.identities?.[0]?.identity_data?.avatar_url,
          supabaseUser.identities?.[0]?.identity_data?.picture,
        ]
        
        // Pegar a primeira foto válida (que não seja do Pexels)
        for (const photo of photoSources) {
          if (photo && typeof photo === 'string' && !photo.includes('pexels.com')) {
            googlePhoto = photo
            console.log('✅ Foto do Google encontrada:', photo)
            break
          }
        }
        
        if (!googlePhoto) {
          console.log('❌ Nenhuma foto válida do Google encontrada nos metadados')
          console.log('📋 Fontes verificadas:', photoSources.filter(Boolean))
        }
        
        // Usar foto do Google apenas se o perfil não tiver foto própria
        const displayPhoto = data.photo_url || googlePhoto
        
        console.log('📷 Usando foto para exibição:', {
          'perfil_tem_foto': !!data.photo_url,
          'google_tem_foto': !!googlePhoto,
          'usando_foto_do': data.photo_url ? 'Banco' : (googlePhoto ? 'Google' : 'Padrão')
        })
        
        setProfile({
          ...data,
          photo_url: displayPhoto, // Priorizar foto do banco, usar Google como fallback
          email_confirmed: !!user.email_confirmed_at,
          email_confirmed_at: user.email_confirmed_at || null
        })
      } else {
        // Create profile if it doesn't exist
        console.log('🆕 [CREATE USER] Perfil não encontrado, criando novo usuário...')
        console.log('📧 [CREATE USER] Email:', user.email)
        
        try {
          const baseUsername = user.email?.split('@')[0] || 'user'
          console.log('👤 [CREATE USER] Base username:', baseUsername)
          
          const uniqueUsername = await generateUniqueUsername(baseUsername)
          console.log('✨ [CREATE USER] Username único gerado:', uniqueUsername)
          
          await createUserProfile(supabaseUser, {
            username: uniqueUsername,
            displayName: user.email?.split('@')[0] || 'Usuário'
          })
          
          console.log('🎉 [CREATE USER] Perfil criado com sucesso!')
        } catch (profileError) {
          console.error('❌ [CREATE USER] Erro ao criar perfil:', profileError)
          // Não interromper o fluxo, usuário pode tentar novamente
          toast.error('Erro ao criar perfil. Tente fazer login novamente.')
        }
      }
    } catch (error) {
      console.error('Error handling user profile:', error)
    }
  }

  const generateUniqueUsername = async (baseUsername: string): Promise<string> => {
    if (!isSupabaseConfigured()) {
      return baseUsername
    }

    // Limpar o baseUsername (remover caracteres especiais)
    const cleanUsername = baseUsername.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
    
    // Verificar se o username base está disponível (usar .maybeSingle() em vez de .single())
    const { data: existingProfile, error } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', cleanUsername)
      .maybeSingle()

    // Se não houve erro e não encontrou nenhum perfil, username está disponível
    if (!error && !existingProfile) {
      console.log(`✅ Username '${cleanUsername}' está disponível`)
      return cleanUsername
    }

    console.log(`⚠️ Username '${cleanUsername}' já existe, gerando variação...`)

    // Se não estiver disponível, tentar variações
    let counter = 1
    let uniqueUsername = `${cleanUsername}${counter}`
    
    while (counter < 100) { // Limite para evitar loop infinito
      const { data: existingVariation, error: variationError } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', uniqueUsername)
        .maybeSingle()

      // Se não houve erro e não encontrou nenhum perfil, username está disponível
      if (!variationError && !existingVariation) {
        console.log(`✅ Username variação '${uniqueUsername}' está disponível`)
        return uniqueUsername
      }
      
      counter++
      uniqueUsername = `${cleanUsername}${counter}`
    }

    // Se ainda não conseguiu, usar timestamp
    const timestamp = Date.now().toString().slice(-6)
    const timestampUsername = `${cleanUsername}${timestamp}`
    console.log(`🔄 Usando username com timestamp: '${timestampUsername}'`)
    return timestampUsername
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

  const signInWithGoogle = async () => {
    console.log('🔍 [DEBUG] signInWithGoogle chamada')
    console.log('🔍 [DEBUG] isSupabaseConfigured:', isSupabaseConfigured())
    
    // Mostrar toast indicando que está verificando
    toast.info('🔍 Verificando se você já tem conta...')
    
    // Determinar a URL de redirect correta
    const getRedirectUrl = () => {
      // Verificar se estamos no browser e usar window.location
      if (typeof window !== 'undefined') {
        const currentUrl = window.location.origin
        // Se estiver em localhost, sempre usar localhost
        if (currentUrl.includes('localhost')) {
          console.log('🔍 [DEBUG] Detectado localhost, usando:', `${currentUrl}/`)
          return `${currentUrl}/`
        }
      }
      
      // Fallback: verificar NODE_ENV
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 [DEBUG] NODE_ENV development, usando localhost')
        return 'http://localhost:3000/'
      }
      
      // Em produção, usar a URL configurada nas variáveis de ambiente
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://orkut-br-oficial.vercel.app/'
      const finalUrl = siteUrl.endsWith('/') ? siteUrl : `${siteUrl}/`
      console.log('🔍 [DEBUG] Usando URL de produção:', finalUrl)
      return finalUrl
    }
    
    const redirectUrl = getRedirectUrl()
    console.log('🔍 [DEBUG] Redirect URL:', redirectUrl)
    
    if (isSupabaseConfigured()) {
      console.log('🔍 [DEBUG] Iniciando signInWithOAuth...')
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      })

      console.log('🔍 [DEBUG] signInWithOAuth response:', { data, error })

      if (error) {
        console.error('❌ [ERROR] Error signing in with Google:', error)
        throw new Error(`Erro ao fazer login com Google: ${error.message}`)
      }

      console.log('✅ [SUCCESS] Google OAuth iniciado com sucesso')
      // The redirect will be handled automatically by Supabase
    } else {
      console.error('❌ [ERROR] Supabase não configurado')
      throw new Error('Login com Google não disponível no modo offline')
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
    console.log('📄 [CREATE PROFILE] Iniciando criação de perfil...')
    console.log('📄 [CREATE PROFILE] User ID:', user.id)
    console.log('📄 [CREATE PROFILE] Username:', userData.username)
    console.log('📄 [CREATE PROFILE] Display Name:', userData.displayName)
    
    try {
      // Tentar obter foto do Google para salvar no banco na criação
      let googlePhoto = null
      
      // Verificar múltiplas fontes de foto do Google
      const photoSources = [
        user.user_metadata?.avatar_url,
        user.user_metadata?.picture, 
        user.user_metadata?.photo_url,
        // Verificar também nas identities (mais confiável)
        user.identities?.[0]?.identity_data?.avatar_url,
        user.identities?.[0]?.identity_data?.picture,
      ]
      
      // Pegar a primeira foto válida (que não seja do Pexels)
      for (const photo of photoSources) {
        if (photo && typeof photo === 'string' && !photo.includes('pexels.com')) {
          googlePhoto = photo
          console.log('✅ [CREATE PROFILE] Foto do Google encontrada:', photo)
          break
        }
      }
      
      if (!googlePhoto) {
        console.log('🖼️ [CREATE PROFILE] Nenhuma foto do Google encontrada, usando foto padrão')
      }
      
      // Dados completos para inserir na tabela profiles
      const profileData = {
        id: user.id,                                    // UUID obrigatório
        username: userData.username,                     // text NOT NULL UNIQUE
        display_name: userData.displayName,              // text NOT NULL
        photo_url: googlePhoto || null,                  // text (padrão será aplicado pelo banco)
        relationship: 'Solteiro(a)',                     // text (padrão)
        location: '',                                    // text (padrão vazio)
        birthday: null,                                  // date (opcional)
        bio: '',                                         // text (padrão vazio)
        fans_count: 0,                                   // integer (padrão 0)
        scrapy_count: 0,                                 // integer (padrão 0)
        profile_views: 0,                                // integer (padrão 0)
        birth_date: null,                                // date (opcional)
        email: user.email || null,                       // text (opcional)
        phone: null,                                     // text (opcional)
        whatsapp_enabled: false,                         // boolean (padrão false)
        privacy_settings: {                              // jsonb (padrão)
          phone_visibility: 'friends',
          profile_visibility: 'public'
        },
        posts_count: 0,                                  // integer (padrão 0)
        avatar_thumbnails: null                          // jsonb (opcional)
      }
      
      console.log('📊 [CREATE PROFILE] Dados do perfil a serem inseridos:', {
        id: profileData.id,
        username: profileData.username,
        display_name: profileData.display_name,
        photo_url: profileData.photo_url ? 'SIM' : 'NÃO',
        email: profileData.email
      })

      const { data: insertedData, error } = await supabase
        .from('profiles')
        .insert([profileData])
        .select('*')
        .single()

      if (error) {
        console.error('❌ [CREATE PROFILE] Erro na inserção:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        })
        throw error
      }
      
      console.log('✅ [CREATE PROFILE] Perfil inserido com sucesso!')
      console.log('📊 [CREATE PROFILE] Dados inseridos:', insertedData)

      // Se conseguiu inserir, carregar o perfil completo
      const { data: fullProfile, error: selectError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
        
      if (selectError) {
        console.error('❌ [CREATE PROFILE] Erro ao carregar perfil após criação:', selectError)
        throw selectError
      }

      if (fullProfile) {
        console.log('✅ [CREATE PROFILE] Perfil carregado com sucesso!')
        console.log('📊 [CREATE PROFILE] Dados do perfil:', fullProfile)
        
        setProfile({
          ...fullProfile,
          email_confirmed: !!user.email_confirmed_at,
          email_confirmed_at: user.email_confirmed_at || null
        })
        
        console.log('🎉 [CREATE PROFILE] SetProfile chamado com sucesso!')
      } else {
        console.error('❌ [CREATE PROFILE] Perfil não encontrado após criação')
        throw new Error('Perfil não encontrado após criação')
      }
      
    } catch (error) {
      console.error('❌ [CREATE PROFILE] Erro geral na criação do perfil:', error)
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
          email_confirmed_at: user.email_confirmed_at || null
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
    signInWithGoogle,
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
