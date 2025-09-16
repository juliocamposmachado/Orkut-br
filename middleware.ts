import { createClient } from '@/utils/supabase/middleware'
import { NextResponse, type NextRequest } from 'next/server'
import { pasteDBMiddleware } from './middleware/pastedb-migration'

export async function middleware(request: NextRequest) {
  try {
    // 🚀 SISTEMA REVOLUCIONÁRIO: Verificar se PasteDB está habilitado
    const usePasteDB = process.env.NEXT_PUBLIC_USE_PASTEDB === 'true' || true
    
    if (usePasteDB) {
      // Interceptar operações de banco de dados primeiro
      const pasteDBResponse = await pasteDBMiddleware(request)
      if (pasteDBResponse.status !== 200 || pasteDBResponse.headers.get('x-pastedb-handled')) {
        console.log('🚀 Request processado pelo PasteDB middleware')
        return pasteDBResponse
      }
    }

    // Continuar com autenticação tradicional para outras rotas
    const { supabase, response } = createClient(request)

    // Refresh session se necessário (se não estiver usando PasteDB para auth)
    let user = null
    if (!usePasteDB) {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      user = authUser
    }

    // Se não houver usuário e a rota precisar de autenticação, redirecionar para login
    const protectedPaths = ['/dashboard', '/profile', '/messages', '/communities/create']
    const isProtectedPath = protectedPaths.some(path => request.nextUrl.pathname.startsWith(path))
    
    if (isProtectedPath && !user && !usePasteDB) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Se o usuário estiver logado e tentar acessar a página de login, redirecionar para home
    if (user && request.nextUrl.pathname === '/login' && !usePasteDB) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    // Para PasteDB, permitir acesso livre (sistema descentralizado)
    if (usePasteDB) {
      console.log('🚀 PasteDB ativo - permitindo acesso livre')      
      return NextResponse.next({
        request: {
          headers: request.headers,
        },
      })
    }

    return response
  } catch (e) {
    // Se houver erro na autenticação, deixar passar (não bloquear o site)
    console.warn('Middleware error:', e)
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    })
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     * - API routes that don't need auth
     * - auth/callback (Supabase callback)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api/auth|auth/callback).*)',
  ],
}
