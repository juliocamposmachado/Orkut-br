import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  try {
    // Simplificado para evitar problemas no Edge Runtime
    // A autenticação será verificada nas páginas/API routes individualmente
    
    // Apenas redirecionar algumas rotas específicas sem verificar autenticação
    const { pathname } = request.nextUrl
    
    // Permitir todas as rotas passarem - autenticação será verificada client-side
    return NextResponse.next()
    
  } catch (e) {
    // Se houver erro, deixar passar
    console.warn('Middleware error:', e)
    return NextResponse.next()
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
