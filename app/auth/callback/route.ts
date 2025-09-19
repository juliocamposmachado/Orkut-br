import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// Forçar esta rota a ser dinâmica para evitar problemas de build
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    // Extrair URL e parâmetros de forma segura
    const url = new URL(request.url)
    const code = url.searchParams.get('code')
    
    // Definir origem baseada no ambiente
    const origin = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3000'
      : (process.env.NEXT_PUBLIC_SITE_URL || 'https://orkut-br-oficial.vercel.app')

    if (code) {
      const cookieStore = cookies()
      const supabase = createClient(cookieStore)
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (!error) {
        // Redirecionar para a página inicial após login bem-sucedido
        return NextResponse.redirect(`${origin}/`)
      } else {
        console.error('Erro na troca do código de autenticação:', error)
        // Em caso de erro, redirecionar para login com parâmetro de erro
        return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
      }
    } else {
      console.error('Código de autenticação não encontrado no callback')
      // Sem código, redirecionar para login
      return NextResponse.redirect(`${origin}/login?error=missing_code`)
    }
  } catch (error) {
    console.error('Erro no callback de autenticação:', error)
    
    // Definir origem para fallback
    const origin = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3000'
      : (process.env.NEXT_PUBLIC_SITE_URL || 'https://orkut-br-oficial.vercel.app')
      
    return NextResponse.redirect(`${origin}/login?error=callback_error`)
  }
}
