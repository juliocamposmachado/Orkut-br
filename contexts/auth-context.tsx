'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

// Simplified profile type that matches our actual database schema
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
}

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, userData: { username: string, displayName: string }) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    // Durante build time ou renderização no servidor, retornar defaults seguros
    if (typeof window === 'undefined') {
      console.warn('[useAuth] Contexto não disponível durante SSR, usando defaults')
      return {
        user: null,
        profile: null,
        loading: false,
        signIn: async () => {
          throw new Error('Auth não disponível durante renderização servidor')
        },
        signUp: async () => {
          throw new Error('Auth não disponível durante renderização servidor')
        },
        signOut: async () => {
          throw new Error('Auth não disponível durante renderização servidor')
        },
        updateProfile: async () => {
          throw new Error('Auth não disponível durante renderização servidor')
        }
      }
    }
    console.error('[useAuth] Contexto não disponível - verifique se o componente está dentro de um AuthProvider')
    // Retornar defaults seguros também no cliente se o provider não estiver configurado
    return {
      user: null,
      profile: null,
      loading: false,
      signIn: async () => {
        throw new Error('Auth Provider não configurado')
      },
      signUp: async () => {
        throw new Error('Auth Provider não configurado')
      },
      signOut: async () => {
        throw new Error('Auth Provider não configurado')
      },
      updateProfile: async () => {
        throw new Error('Auth Provider não configurado')
      }
    }
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

  useEffect(() => {
    // Safety timeout to prevent infinite loading
    const safetyTimeout = setTimeout(() => {
      console.warn('Safety timeout triggered - forcing loading to stop')
      setLoading(false)
      
      // If we have a user but no profile, create a minimal one
      if (user && !profile) {
        setProfile({
          id: user.id,
          username: `user_${user.id.slice(-8)}`,
          display_name: 'Usuário',
          created_at: new Date().toISOString(),
          photo_url: null,
          bio: null,
          location: null,
          birthday: null,
          relationship: null,
          fans_count: 0
        })
      }
    }, 10000) // 10 seconds timeout

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        loadProfile(session.user.id)
      } else {
        setLoading(false)
        clearTimeout(safetyTimeout)
      }
    }).catch((error) => {
      console.error('Error getting session:', error)
      setLoading(false)
      clearTimeout(safetyTimeout)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          await loadProfile(session.user.id)
        } else {
          setProfile(null)
          setLoading(false)
        }
        clearTimeout(safetyTimeout)
      }
    )

    return () => {
      subscription.unsubscribe()
      clearTimeout(safetyTimeout)
    }
  }, [])

  const loadProfile = async (userId: string) => {
    try {
      console.log('Loading profile for user:', userId)
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error loading profile:', error)
        
        // If profile doesn't exist, try to create it
        if (error.code === 'PGRST116') {
          console.log('Profile not found, creating one...')
          try {
            // Create a basic profile directly
            const { data: createdProfile, error: createError } = await supabase
              .from('profiles')
              .insert({
                id: userId,
                username: `user_${userId.slice(-8)}`,
                display_name: 'Usuário'
              })
              .select()
              .single()
              
            if (!createError && createdProfile) {
              setProfile(createdProfile)
              console.log('Profile created successfully:', createdProfile)
            } else {
              console.error('Error creating profile:', createError)
              // Set a minimal profile to prevent infinite loading
              setProfile({
                id: userId,
                username: `user_${userId.slice(-8)}`,
                display_name: 'Usuário',
                created_at: new Date().toISOString(),
                photo_url: null,
                bio: null,
                location: null,
                birthday: null,
                relationship: null,
                fans_count: 0
              })
            }
          } catch (createError) {
            console.error('Error creating profile:', createError)
            // Set a minimal profile to prevent infinite loading
            setProfile({
              id: userId,
              username: `user_${userId.slice(-8)}`,
              display_name: 'Usuário',
              created_at: new Date().toISOString(),
              photo_url: null,
              bio: null,
              location: null,
              birthday: null,
              relationship: null,
              fans_count: 0
            })
          }
        } else {
          // For other errors, set a minimal profile to prevent infinite loading
          setProfile({
            id: userId,
            username: `user_${userId.slice(-8)}`,
            display_name: 'Usuário',
            created_at: new Date().toISOString(),
            photo_url: null,
            bio: null,
            location: null,
            birthday: null,
            relationship: null,
            fans_count: 0
          })
        }
      } else if (data) {
        setProfile(data)
        console.log('Profile loaded successfully:', data)
      }

      // Try to update presence (ignore errors)
      try {
        await supabase
          .from('presence')
          .upsert({ 
            profile_id: userId, 
            online: true, 
            last_seen: new Date().toISOString() 
          })
      } catch (presenceError) {
        console.log('Presence table not available, skipping...')
      }
      
    } catch (error) {
      console.error('Unexpected error loading profile:', error)
      // Set a minimal profile to prevent infinite loading
      setProfile({
        id: userId,
        username: `user_${userId.slice(-8)}`,
        display_name: 'Usuário',
        created_at: new Date().toISOString(),
        photo_url: null,
        bio: null,
        location: null,
        birthday: null,
        relationship: null,
        fans_count: 0
      })
    } finally {
      console.log('Setting loading to false')
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      throw error
    }
  }

  const signUp = async (
    email: string, 
    password: string, 
    userData: { username: string, displayName: string }
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    })

    if (error) {
      throw error
    }

    if (data.user) {
      try {
        // Try to create profile directly first
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            username: userData.username,
            display_name: userData.displayName
          })

        if (profileError) {
          console.error('Error creating profile directly:', profileError)
          
          // Fallback: try using the safe function
          try {
            await supabase.rpc('create_profile_safe', {
              user_id: data.user.id,
              user_email: email
            })
            
            // Update with custom data
            await supabase
              .from('profiles')
              .update({
                username: userData.username,
                display_name: userData.displayName,
              })
              .eq('id', data.user.id)
          } catch (safeError) {
            console.error('Safe profile creation also failed:', safeError)
            // Profile creation failed, but don't throw error - user is created
          }
        }

        // Create settings (ignore errors if already exists)
        try {
          await supabase
            .from('settings')
            .insert({
              profile_id: data.user.id,
            })
        } catch (settingsError) {
          // Ignore errors if settings already exist
          console.log('Settings creation failed, likely already exists')
        }
          
      } catch (error) {
        console.error('Error in profile setup:', error)
        // Don't throw error - user is created, profile will be created on login
      }
    }
  }

  const signOut = async () => {
    setLoading(true)
    
    // Update presence before signing out (ignore errors)
    if (user) {
      try {
        await supabase
          .from('presence')
          .update({ online: false })
          .eq('profile_id', user.id)
      } catch (error) {
        console.log('Presence update failed, continuing with logout...')
      }
    }

    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        throw error
      }
    } finally {
      // Always reset the state, even if signOut fails
      setUser(null)
      setProfile(null)
      setLoading(false)
    }
  }

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)

    if (error) {
      throw error
    }

    // Reload profile
    await loadProfile(user.id)
  }

  const value: AuthContextType = {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}