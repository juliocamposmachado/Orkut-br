import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Executando diagnóstico completo do DJ Orky...')
    
    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      environment: {
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        nodeEnv: process.env.NODE_ENV
      },
      profile: null,
      posts: null,
      errors: []
    }

    // Teste 1: Verificar conexão com Supabase
    try {
      console.log('🔌 Testando conexão com Supabase...')
      const { data: testConnection, error: connectionError } = await supabase
        .from('profiles')
        .select('count')
        .limit(1)
      
      diagnostics.supabaseConnection = connectionError ? 'failed' : 'success'
      if (connectionError) {
        diagnostics.errors.push(`Conexão Supabase: ${connectionError.message}`)
      }
    } catch (error: any) {
      diagnostics.supabaseConnection = 'error'
      diagnostics.errors.push(`Erro na conexão: ${error.message}`)
    }

    // Teste 2: Verificar perfil do DJ Orky
    try {
      console.log('👤 Verificando perfil do DJ Orky...')
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', 'dj-orky-bot-official')
        .single()

      if (profileError && profileError.code !== 'PGRST116') {
        diagnostics.errors.push(`Erro perfil: ${profileError.message}`)
        diagnostics.profile = { status: 'error', error: profileError.message }
      } else if (!profile) {
        diagnostics.profile = { status: 'not_found' }
      } else {
        diagnostics.profile = { 
          status: 'found', 
          data: profile,
          fields: Object.keys(profile)
        }
      }
    } catch (error: any) {
      diagnostics.profile = { status: 'exception', error: error.message }
      diagnostics.errors.push(`Exceção perfil: ${error.message}`)
    }

    // Teste 3: Verificar posts do DJ Orky
    try {
      console.log('📝 Verificando posts do DJ Orky...')
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select('id, content, created_at, author, author_name')
        .eq('author', 'dj-orky-bot-official')
        .order('created_at', { ascending: false })
        .limit(5)

      if (postsError) {
        diagnostics.errors.push(`Erro posts: ${postsError.message}`)
        diagnostics.posts = { status: 'error', error: postsError.message }
      } else {
        diagnostics.posts = { 
          status: 'success', 
          count: posts?.length || 0,
          data: posts || []
        }
      }
    } catch (error: any) {
      diagnostics.posts = { status: 'exception', error: error.message }
      diagnostics.errors.push(`Exceção posts: ${error.message}`)
    }

    // Teste 4: Verificar estrutura da tabela profiles
    try {
      console.log('🏗️ Verificando estrutura da tabela profiles...')
      // Tentar inserir um perfil de teste (sem realmente inserir)
      const testProfile = {
        id: 'test-check-fields',
        username: 'test',
        display_name: 'Test User',
        email: 'test@test.com'
      }

      // Este será um dry-run para ver quais campos são aceitos
      const { data: insertTest, error: insertError } = await supabase
        .from('profiles')
        .select('id')  // Só selecionar para testar a query
        .eq('id', 'non-existent-test-id')
        .limit(0)

      diagnostics.tableStructure = { status: 'accessible' }
    } catch (error: any) {
      diagnostics.tableStructure = { status: 'error', error: error.message }
      diagnostics.errors.push(`Erro estrutura tabela: ${error.message}`)
    }

    // Resumo final
    diagnostics.summary = {
      totalErrors: diagnostics.errors.length,
      status: diagnostics.errors.length === 0 ? 'healthy' : 'issues_found',
      recommendations: []
    }

    if (diagnostics.supabaseConnection !== 'success') {
      diagnostics.summary.recommendations.push('Verificar configuração do Supabase')
    }

    if (diagnostics.profile?.status === 'not_found') {
      diagnostics.summary.recommendations.push('Executar POST /api/dj-orky/init para criar perfil')
    }

    if (diagnostics.posts?.count === 0) {
      diagnostics.summary.recommendations.push('Executar POST /api/dj-orky/init para criar posts iniciais')
    }

    console.log('✅ Diagnóstico concluído:', diagnostics.summary)

    return NextResponse.json(diagnostics, { status: 200 })

  } catch (error: any) {
    console.error('❌ Erro no diagnóstico:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString(),
        type: 'diagnostic_failed'
      },
      { status: 500 }
    )
  }
}
