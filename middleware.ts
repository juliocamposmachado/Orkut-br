import { createClient } from '@/utils/supabase/middleware'
import { NextResponse, type NextRequest } from 'next/server'
import { pasteDBMiddleware } from './middleware/pastedb-migration'

export async function middleware(request: NextRequest) {
  try {
    // 🔐 SISTEMA HÍBRIDO: Supabase Auth + PasteDB Data
    // IMPORTANTE: Não interferir nas rotas de autenticação OAuth
    
    const pathname = request.nextUrl.pathname
    const isProduction = process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production'
    
    // Em produção, ser ainda mais permissivo com rotas de autenticação
    if (isProduction) {
      // Em produção, permitir passagem de TODAS as rotas de auth sem processamento
      if (pathname.startsWith('/auth') || 
          pathname.startsWith('/api/auth') ||
          pathname.includes('supabase') ||
          pathname.includes('oauth') ||
          pathname.includes('callback') ||
          pathname === '/login' ||
          pathname === '/') {
        console.log('🚀 [PROD] Permitindo passagem livre da rota:', pathname)
        return NextResponse.next()
      }
    }
    
    // Verificar se é uma rota de callback de autenticação - NUNCA interceptar essas rotas
    if (pathname.startsWith('/auth/callback') || 
        pathname.startsWith('/api/auth') ||
        pathname.includes('supabase') ||
        pathname.includes('oauth') ||
        pathname.includes('callback')) {
      console.log('🔐 [AUTH] Permitindo passagem de rota de autenticação:', pathname)
      return NextResponse.next()
    }

    // Verificar se PasteDB está habilitado apenas para DADOS (não para auth)
    const usePasteDBForData = process.env.NEXT_PUBLIC_USE_PASTEDB_FOR_DATA === 'true'
    const useSupabaseForAuth = process.env.NEXT_PUBLIC_USE_SUPABASE_FOR_AUTH === 'true' || true
    
    // Se usar PasteDB apenas para dados, ainda processar PasteDB middleware para APIs
    if (usePasteDBForData && pathname.startsWith('/api/') && !pathname.startsWith('/api/auth')) {
      const pasteDBResponse = await pasteDBMiddleware(request)
      if (pasteDBResponse.status !== 200 || pasteDBResponse.headers.get('x-pastedb-handled')) {
        console.log('🚀 [DATA] Request processado pelo PasteDB middleware para:', pathname)
        return pasteDBResponse
      }
    }

    // SEMPRE processar autenticação com Supabase (sistema híbrido)
    const { supabase, response } = createClient(request)

    // Verificar sessão do usuário
    let user = null
    if (useSupabaseForAuth) {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        user = authUser || null
        
        if (user) {
          console.log('✅ [AUTH] Usuário autenticado:', (user as any)?.email)
        }
      } catch (authError) {
        console.warn('⚠️ [AUTH] Erro ao verificar usuário:', authError)
      }
    }

    // Rotas protegidas que exigem autenticação
    const protectedPaths = ['/dashboard', '/profile', '/messages', '/communities/create']
    const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path))
    
    // Se rota protegida e usuário não autenticado, redirecionar para login
    if (isProtectedPath && !user && useSupabaseForAuth) {
      console.log('🚫 [AUTH] Rota protegida sem autenticação, redirecionando para login:', pathname)
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Se usuário autenticado tentar acessar login, redirecionar para home
    if (user && pathname === '/login' && useSupabaseForAuth) {
      console.log('✅ [AUTH] Usuário já autenticado tentando acessar login, redirecionando para home')
      return NextResponse.redirect(new URL('/', request.url))
    }

    // Para sistema híbrido, permitir acesso a rotas não protegidas
    console.log('✅ [HYBRID] Permitindo acesso a:', pathname)
    return response
    
  } catch (e) {
    // Se houver erro na autenticação, deixar passar (não bloquear o site)
    console.warn('⚠️ [MIDDLEWARE] Erro no middleware:', e)
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
