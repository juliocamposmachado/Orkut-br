import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

// Sistema de autenticação local usando PasteDB
// Simula um banco de dados em memória para desenvolvimento/fallback

interface User {
  id: string
  email: string
  password_hash: string
  username: string
  display_name: string
  photo_url?: string
  created_at: string
  last_login?: string
  provider: 'local' | 'google'
  google_id?: string
}

interface Profile {
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

// Armazenamento em memória (em produção, seria PasteDB)
let users: User[] = []
let profiles: Profile[] = []
let sessions: { [key: string]: string } = {} // sessionId -> userId

// Utilitário para hash de senha
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + 'orkut_salt_2024').digest('hex')
}

// Gerar ID único
function generateId(): string {
  return crypto.randomUUID()
}

// Gerar token de sessão
function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

// Verificar se email já existe
function findUserByEmail(email: string): User | undefined {
  return users.find(user => user.email.toLowerCase() === email.toLowerCase())
}

// Criar perfil para usuário
function createProfile(user: User): Profile {
  const profile: Profile = {
    id: user.id,
    username: user.username,
    display_name: user.display_name,
    photo_url: user.photo_url || null,
    relationship: 'Solteiro(a)',
    location: '',
    birthday: null,
    bio: '',
    fans_count: 0,
    created_at: user.created_at,
    email_confirmed: true,
    email_confirmed_at: user.created_at,
    role: null
  }
  
  profiles.push(profile)
  return profile
}

// POST - Login ou Registro
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, email, password, username, displayName, googleData } = body

    console.log('🔐 [LOCAL AUTH] Ação solicitada:', action)
    console.log('🔐 [LOCAL AUTH] Email:', email)

    if (action === 'login') {
      // LOGIN LOCAL
      const user = findUserByEmail(email)
      
      if (!user) {
        return NextResponse.json(
          { success: false, error: 'Email não encontrado' },
          { status: 401 }
        )
      }

      if (user.provider === 'google') {
        return NextResponse.json(
          { success: false, error: 'Esta conta foi criada com Google. Use "Continuar com Google".' },
          { status: 401 }
        )
      }

      const passwordHash = hashPassword(password)
      if (user.password_hash !== passwordHash) {
        return NextResponse.json(
          { success: false, error: 'Senha incorreta' },
          { status: 401 }
        )
      }

      // Atualizar último login
      user.last_login = new Date().toISOString()

      // Criar sessão
      const sessionToken = generateSessionToken()
      sessions[sessionToken] = user.id

      // Buscar perfil
      const profile = profiles.find(p => p.id === user.id)

      console.log('✅ [LOCAL AUTH] Login realizado com sucesso')

      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          email_confirmed_at: user.created_at,
          created_at: user.created_at
        },
        profile: profile,
        session_token: sessionToken
      })

    } else if (action === 'register') {
      // REGISTRO LOCAL
      const existingUser = findUserByEmail(email)
      
      if (existingUser) {
        return NextResponse.json(
          { success: false, error: 'Email já está em uso' },
          { status: 400 }
        )
      }

      // Verificar se username já existe
      const existingProfile = profiles.find(p => p.username === username)
      if (existingProfile) {
        return NextResponse.json(
          { success: false, error: 'Nome de usuário já está em uso' },
          { status: 400 }
        )
      }

      // Criar novo usuário
      const userId = generateId()
      const now = new Date().toISOString()

      const newUser: User = {
        id: userId,
        email: email.toLowerCase(),
        password_hash: hashPassword(password),
        username,
        display_name: displayName,
        created_at: now,
        provider: 'local'
      }

      users.push(newUser)

      // Criar perfil
      const profile = createProfile(newUser)

      // Criar sessão
      const sessionToken = generateSessionToken()
      sessions[sessionToken] = userId

      console.log('🎉 [LOCAL AUTH] Usuário registrado com sucesso:', username)

      return NextResponse.json({
        success: true,
        user: {
          id: newUser.id,
          email: newUser.email,
          email_confirmed_at: newUser.created_at,
          created_at: newUser.created_at
        },
        profile: profile,
        session_token: sessionToken
      })

    } else if (action === 'google_login') {
      // LOGIN COM GOOGLE (simulado)
      console.log('🌐 [LOCAL AUTH] Simulando login com Google...')
      
      if (!googleData || !googleData.email) {
        return NextResponse.json(
          { success: false, error: 'Dados do Google inválidos' },
          { status: 400 }
        )
      }

      // Verificar se usuário já existe
      let user = users.find(u => u.google_id === googleData.id || u.email === googleData.email)
      
      if (!user) {
        // Criar novo usuário do Google
        const userId = generateId()
        const now = new Date().toISOString()
        
        // Gerar username único baseado no email
        let baseUsername = googleData.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
        let username = baseUsername
        let counter = 1
        
        while (profiles.find(p => p.username === username)) {
          username = `${baseUsername}${counter}`
          counter++
        }

        user = {
          id: userId,
          email: googleData.email.toLowerCase(),
          password_hash: '', // Sem senha para login Google
          username,
          display_name: googleData.name || googleData.email.split('@')[0],
          photo_url: googleData.picture,
          created_at: now,
          provider: 'google',
          google_id: googleData.id
        }

        users.push(user)
        
        // Criar perfil
        const profile = createProfile(user)
        profile.photo_url = googleData.picture || null

      } else {
        // Atualizar dados do Google se necessário
        if (googleData.picture && user.photo_url !== googleData.picture) {
          user.photo_url = googleData.picture
          const profile = profiles.find(p => p.id === user!.id)
          if (profile) {
            profile.photo_url = googleData.picture
          }
        }
      }

      // Atualizar último login
      user.last_login = new Date().toISOString()

      // Criar sessão
      const sessionToken = generateSessionToken()
      sessions[sessionToken] = user.id

      // Buscar perfil
      const profile = profiles.find(p => p.id === user.id)

      console.log('✅ [LOCAL AUTH] Login com Google realizado com sucesso')

      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          email_confirmed_at: user.created_at,
          created_at: user.created_at
        },
        profile: profile,
        session_token: sessionToken
      })

    } else {
      return NextResponse.json(
        { success: false, error: 'Ação não suportada' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('❌ [LOCAL AUTH] Erro:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// GET - Verificar sessão
export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: 'Token de sessão não fornecido' },
        { status: 401 }
      )
    }

    const userId = sessions[sessionToken]
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Sessão inválida' },
        { status: 401 }
      )
    }

    const user = users.find(u => u.id === userId)
    const profile = profiles.find(p => p.id === userId)

    if (!user || !profile) {
      delete sessions[sessionToken]
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        email_confirmed_at: user.created_at,
        created_at: user.created_at
      },
      profile: profile
    })

  } catch (error) {
    console.error('❌ [LOCAL AUTH] Erro na verificação:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Logout
export async function DELETE(request: NextRequest) {
  try {
    const sessionToken = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (sessionToken && sessions[sessionToken]) {
      delete sessions[sessionToken]
      console.log('👋 [LOCAL AUTH] Logout realizado')
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('❌ [LOCAL AUTH] Erro no logout:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
