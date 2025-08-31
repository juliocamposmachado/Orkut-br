'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

// Simplified profile type for fallback mode
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

interface User {
  id: string
  email?: string
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

  useEffect(() => {
    console.log('Starting fallback auth context')
    
    // Function to validate UUID
    const isValidUUID = (uuid: string) => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      return uuidRegex.test(uuid)
    }
    
    // Check if there's a stored session
    const storedUser = localStorage.getItem('orkut_user')
    const storedProfile = localStorage.getItem('orkut_profile')
    
    if (storedUser && storedProfile) {
      try {
        const user = JSON.parse(storedUser)
        const profile = JSON.parse(storedProfile)
        
        // Validate UUID format
        if (isValidUUID(user.id)) {
          setUser(user)
          setProfile(profile)
          console.log('Valid user session restored:', user.id)
        } else {
          console.warn('Invalid UUID in localStorage, clearing...')
          localStorage.removeItem('orkut_user')
          localStorage.removeItem('orkut_profile')
          
          // Auto-login with existing valid user
          const existingUser = {
            id: '137fa9a8-561c-4ae2-85c6-34919cd4bcad',
            email: 'julio@test.com'
          }
          const existingProfile = {
            id: '137fa9a8-561c-4ae2-85c6-34919cd4bcad',
            username: 'juliocamposmachado',
            display_name: 'Julio Campos Machado',
            created_at: new Date().toISOString(),
            photo_url: null,
            bio: '',
            location: '',
            birthday: null,
            relationship: 'Solteiro(a)',
            fans_count: 0
          }
          
          localStorage.setItem('orkut_user', JSON.stringify(existingUser))
          localStorage.setItem('orkut_profile', JSON.stringify(existingProfile))
          
          setUser(existingUser)
          setProfile(existingProfile)
          console.log('Auto-logged in with existing user:', existingUser.id)
        }
      } catch (error) {
        console.error('Error parsing stored data:', error)
        localStorage.removeItem('orkut_user')
        localStorage.removeItem('orkut_profile')
      }
    }
    
    // Always stop loading after 1 second to improve UX
    const loadingTimeout = setTimeout(() => {
      setLoading(false)
    }, 1000)
    
    return () => clearTimeout(loadingTimeout)
  }, [])

  const signIn = async (email: string, password: string) => {
    // Simulate login for fallback mode
    // Generate a proper UUID for compatibility with Supabase
    const mockUserId = crypto.randomUUID()
    const mockUser: User = {
      id: mockUserId,
      email: email
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
      fans_count: 0
    }
    
    // Store in localStorage
    localStorage.setItem('orkut_user', JSON.stringify(mockUser))
    localStorage.setItem('orkut_profile', JSON.stringify(mockProfile))
    
    setUser(mockUser)
    setProfile(mockProfile)
  }

  const signUp = async (
    email: string, 
    password: string, 
    userData: { username: string, displayName: string, bio?: string, photo_url?: string }
  ) => {
    // Simulate signup for fallback mode
    // Generate a proper UUID for compatibility with Supabase
    const mockUserId = crypto.randomUUID()
    const mockUser: User = {
      id: mockUserId,
      email: email
    }
    
    const mockProfile: Profile = {
      id: mockUser.id,
      username: userData.username,
      display_name: userData.displayName,
      created_at: new Date().toISOString(),
      photo_url: userData.photo_url || null,
      bio: userData.bio || null,
      location: null,
      birthday: null,
      relationship: null,
      fans_count: 0
    }
    
    // Store in localStorage
    localStorage.setItem('orkut_user', JSON.stringify(mockUser))
    localStorage.setItem('orkut_profile', JSON.stringify(mockProfile))
    
    setUser(mockUser)
    setProfile(mockProfile)
  }

  const signOut = async () => {
    // Clear stored data
    localStorage.removeItem('orkut_user')
    localStorage.removeItem('orkut_profile')
    
    setUser(null)
    setProfile(null)
  }

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!profile) return
    
    const updatedProfile = { ...profile, ...updates }
    localStorage.setItem('orkut_profile', JSON.stringify(updatedProfile))
    setProfile(updatedProfile)
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
