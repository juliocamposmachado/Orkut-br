import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'

/**
 * 🚀 ORKUT PASTEDB AUTH API
 * =========================
 * 
 * API de autenticação usando banco descentralizado PasteDB (dpaste.org)
 * 
 * Endpoints:
 * POST /api/auth/pastedb - Register/Login
 * GET /api/auth/pastedb - Validate session
 * DELETE /api/auth/pastedb - Logout
 */

// Caminho para o script Python
const PYTHON_SCRIPT_PATH = path.join(process.cwd(), 'Banco', 'user_auth_interface.py')

interface AuthRequest {
  action: 'register' | 'login' | 'validate' | 'logout'
  email?: string
  password?: string
  username?: string
  displayName?: string
  session_token?: string
}

/**
 * Executa comando Python e retorna resultado
 */
async function executeUserAuth(operation: string, params: string[] = []): Promise<any> {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn('python', [PYTHON_SCRIPT_PATH, operation, ...params], {
      cwd: path.join(process.cwd(), 'Banco'),
      env: { 
        ...process.env, 
        PASTEDB_SERVICE: 'dpaste',
        PYTHONUNBUFFERED: '1' 
      }
    })

    let stdout = ''
    let stderr = ''

    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString()
    })

    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    pythonProcess.on('close', (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(stdout.trim())
          resolve(result)
        } catch (error) {
          console.error('Erro ao parsear JSON:', error)
          console.error('stdout:', stdout)
          reject(new Error('Resposta inválida do sistema de autenticação'))
        }
      } else {
        console.error(`Processo Python terminou com código ${code}`)
        console.error('stderr:', stderr)
        console.error('stdout:', stdout)
        reject(new Error(stderr || 'Erro no sistema de autenticação'))
      }
    })

    pythonProcess.on('error', (error) => {
      console.error('Erro ao executar processo Python:', error)
      reject(error)
    })
  })
}

/**
 * Extrai IP do cliente
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const ip = forwarded?.split(',')[0] || realIP || 'unknown'
  return ip
}

/**
 * POST - Registro e Login
 */
export async function POST(request: NextRequest) {
  try {
    const body: AuthRequest = await request.json()
    const { action, email, password, username, displayName } = body

    console.log(`[PASTEDB AUTH] ${action.toUpperCase()} request for:`, email || username)

    // Dados do cliente para auditoria
    const clientIP = getClientIP(request)
    const userAgent = request.headers.get('user-agent') || 'unknown'

    if (action === 'register') {
      // Validações
      if (!email || !password || !username || !displayName) {
        return NextResponse.json({
          success: false,
          error: 'Campos obrigatórios: email, password, username, displayName'
        }, { status: 400 })
      }

      if (password.length < 6) {
        return NextResponse.json({
          success: false,
          error: 'Senha deve ter pelo menos 6 caracteres'
        }, { status: 400 })
      }

      // Criar usuário
      const result = await executeUserAuth('register', [
        email,
        password,
        username,
        displayName,
        clientIP,
        userAgent
      ])

      if (result.success) {
        console.log(`✅ [PASTEDB AUTH] Usuário registrado: ${username}`)
        return NextResponse.json({
          success: true,
          message: 'Usuário criado com sucesso',
          user: result.user,
          profile: result.profile,
          session_token: result.session_token
        }, { status: 201 })
      } else {
        console.log(`❌ [PASTEDB AUTH] Erro no registro: ${result.error}`)
        return NextResponse.json({
          success: false,
          error: result.error
        }, { status: 400 })
      }

    } else if (action === 'login') {
      // Validações
      if (!email || !password) {
        return NextResponse.json({
          success: false,
          error: 'Email e senha são obrigatórios'
        }, { status: 400 })
      }

      // Autenticar usuário
      const result = await executeUserAuth('login', [
        email,
        password,
        clientIP,
        userAgent
      ])

      if (result.success) {
        console.log(`✅ [PASTEDB AUTH] Login realizado: ${result.user?.username}`)
        return NextResponse.json({
          success: true,
          message: 'Login realizado com sucesso',
          user: result.user,
          profile: result.profile,
          session_token: result.session_token
        }, { status: 200 })
      } else {
        console.log(`❌ [PASTEDB AUTH] Erro no login: ${result.error}`)
        return NextResponse.json({
          success: false,
          error: result.error || 'Credenciais inválidas'
        }, { status: 401 })
      }

    } else {
      return NextResponse.json({
        success: false,
        error: 'Ação inválida'
      }, { status: 400 })
    }

  } catch (error: any) {
    console.error('[PASTEDB AUTH] Erro na API:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    }, { status: 500 })
  }
}

/**
 * GET - Validar sessão
 */
export async function GET(request: NextRequest) {
  try {
    const authorization = request.headers.get('authorization')
    
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return NextResponse.json({
        success: false,
        error: 'Token de sessão não fornecido'
      }, { status: 401 })
    }

    const sessionToken = authorization.replace('Bearer ', '')
    
    console.log(`[PASTEDB AUTH] Validando sessão: ${sessionToken.substring(0, 16)}...`)

    // Validar sessão
    const result = await executeUserAuth('validate', [sessionToken])

    if (result.success && result.user) {
      console.log(`✅ [PASTEDB AUTH] Sessão válida para: ${result.user.username}`)
      return NextResponse.json({
        success: true,
        user: result.user,
        profile: result.profile
      }, { status: 200 })
    } else {
      console.log(`❌ [PASTEDB AUTH] Sessão inválida`)
      return NextResponse.json({
        success: false,
        error: 'Sessão inválida ou expirada'
      }, { status: 401 })
    }

  } catch (error: any) {
    console.error('[PASTEDB AUTH] Erro na validação:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 })
  }
}

/**
 * DELETE - Logout
 */
export async function DELETE(request: NextRequest) {
  try {
    const authorization = request.headers.get('authorization')
    
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return NextResponse.json({
        success: false,
        error: 'Token de sessão não fornecido'
      }, { status: 400 })
    }

    const sessionToken = authorization.replace('Bearer ', '')
    
    console.log(`[PASTEDB AUTH] Logout: ${sessionToken.substring(0, 16)}...`)

    // Invalidar sessão
    const result = await executeUserAuth('logout', [sessionToken])

    if (result.success) {
      console.log(`✅ [PASTEDB AUTH] Logout realizado`)
      return NextResponse.json({
        success: true,
        message: 'Logout realizado com sucesso'
      }, { status: 200 })
    } else {
      return NextResponse.json({
        success: false,
        error: 'Erro no logout'
      }, { status: 400 })
    }

  } catch (error: any) {
    console.error('[PASTEDB AUTH] Erro no logout:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 })
  }
}

/**
 * OPTIONS - CORS
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
