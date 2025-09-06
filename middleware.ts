import { createClient } from '@/utils/supabase/middleware'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  try {
    // Criar cliente do Supabase para middleware
    const { supabase, response } = createClient(request)

    // Refresh session se necessário
    const { data: { user } } = await supabase.auth.getUser()

    // Se não houver usuário e a rota precisar de autenticação, redirecionar para login
    const protectedPaths = ['/dashboard', '/profile', '/messages', '/communities/create']
    const isProtectedPath = protectedPaths.some(path => request.nextUrl.pathname.startsWith(path))
    
    if (isProtectedPath && !user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Se o usuário estiver logado e tentar acessar a página de login, redirecionar para home
    if (user && request.nextUrl.pathname === '/login') {
      return NextResponse.redirect(new URL('/', request.url))
    }

    return response
  } catch (e) {
    // Se houver erro na autenticação, deixar passar (não bloquear o site)
    console.warn('Middleware auth error:', e)
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
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api/auth).*)',
  ],
}
