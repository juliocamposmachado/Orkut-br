import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    // Se há um parâmetro next, usar ele; caso contrário, usar /login
    const next = searchParams.get('next') ?? '/login'

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
    // Em caso de erro, redirecionar para login
    const { origin } = new URL(request.url)
    return NextResponse.redirect(`${origin}/login?error=callback_error`)
  }
}
