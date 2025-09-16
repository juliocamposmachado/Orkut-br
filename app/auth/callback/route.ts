import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// Forçar esta rota a ser dinâmica para evitar problemas de build
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  console.log('🔄 [CALLBACK] Iniciando processamento do callback...')
  console.log('🔄 [CALLBACK] Request URL:', request.url)
  console.log('🔄 [CALLBACK] Timestamp:', new Date().toISOString())
  
  try {
    // Extrair URL e parâmetros de forma segura
    const url = new URL(request.url)
    const code = url.searchParams.get('code')
    const error_description = url.searchParams.get('error_description')
    const error_code = url.searchParams.get('error')
    
    console.log('📋 [CALLBACK] Parâmetros recebidos:', {
      hasCode: !!code,
      codeLength: code?.length || 0,
      error_code,
      error_description,
      allParams: Object.fromEntries(url.searchParams.entries())
    })
    
    // Definir origem baseada no ambiente
    const origin = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3000'
      : (process.env.NEXT_PUBLIC_SITE_URL || 'https://orkut-br-oficial.vercel.app')
      
    console.log('🏠 [CALLBACK] Origin URL:', origin)

    // Verificar se há erro no callback
    if (error_code) {
      console.error('❌ [CALLBACK] Erro recebido do provedor OAuth:', {
        code: error_code,
        description: error_description
      })
      return NextResponse.redirect(`${origin}/login?error=oauth_provider_error&details=${encodeURIComponent(error_description || error_code)}`)
    }

    if (code) {
      console.log('✅ [CALLBACK] Código de autenticação encontrado, processando...')
      
      const cookieStore = cookies()
      const supabase = createClient(cookieStore)
      
      console.log('🔄 [CALLBACK] Trocando código por sessão...')
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      console.log('📋 [CALLBACK] Resultado da troca:', {
        hasData: !!data,
        hasError: !!error,
        hasSession: !!data?.session,
        hasUser: !!data?.user,
        userId: data?.user?.id,
        userEmail: data?.user?.email,
        errorMessage: error?.message
      })
      
      if (!error && data?.session && data?.user) {
        console.log('✅ [CALLBACK] Sessão criada com sucesso!')
        console.log('✅ [CALLBACK] Usuário logado:', {
          id: data.user.id,
          email: data.user.email,
          confirmed_at: data.user.email_confirmed_at
        })
        
        // Aguardar um pouco para garantir que a sessão está salva nos cookies
        console.log('⏳ [CALLBACK] Aguardando persistência da sessão...')
        await new Promise(resolve => setTimeout(resolve, 500))
        
        console.log('🏠 [CALLBACK] Redirecionando para home...')
        return NextResponse.redirect(`${origin}/`)
      } else {
        console.error('❌ [CALLBACK] Erro na troca do código:', {
          error: error?.message,
          code: error?.status,
          hasSession: !!data?.session,
          hasUser: !!data?.user
        })
        return NextResponse.redirect(`${origin}/login?error=session_exchange_failed&details=${encodeURIComponent(error?.message || 'Falha na criação da sessão')}`)
      }
    } else {
      console.error('❌ [CALLBACK] Código de autenticação não encontrado no callback')
      return NextResponse.redirect(`${origin}/login?error=missing_auth_code`)
    }
  } catch (error) {
    console.error('❌ [CALLBACK] Erro inesperado no callback:', error)
    console.error('❌ [CALLBACK] Stack trace:', (error as Error).stack)
    
    // Definir origem para fallback
    const origin = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3000'
      : (process.env.NEXT_PUBLIC_SITE_URL || 'https://orkut-br-oficial.vercel.app')
      
    return NextResponse.redirect(`${origin}/login?error=callback_exception&details=${encodeURIComponent((error as Error).message)}`)
  }
}
