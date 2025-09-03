import { NextResponse } from 'next/server'

/**
 * API para testar se as variáveis de ambiente estão configuradas no Vercel
 * Acesse: /api/test-env
 */
export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    const envCheck = {
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
      vercel: {
        url: process.env.VERCEL_URL,
        environment: process.env.VERCEL_ENV,
        region: process.env.VERCEL_REGION
      },
      supabase: {
        url: {
          configured: !!supabaseUrl,
          valid: supabaseUrl ? supabaseUrl.startsWith('https://') : false,
          preview: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'Not set'
        },
        serviceKey: {
          configured: !!supabaseServiceKey,
          length: supabaseServiceKey ? supabaseServiceKey.length : 0,
          preview: supabaseServiceKey ? `${supabaseServiceKey.substring(0, 20)}...` : 'Not set'
        },
        anonKey: {
          configured: !!supabaseAnonKey,
          length: supabaseAnonKey ? supabaseAnonKey.length : 0,
          preview: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'Not set'
        }
      },
      status: 'ready_for_photo_upload'
    }

    // Verificar se tudo está configurado
    const allConfigured = 
      envCheck.supabase.url.configured && 
      envCheck.supabase.url.valid && 
      (envCheck.supabase.serviceKey.configured || envCheck.supabase.anonKey.configured)

    envCheck.status = allConfigured 
      ? '✅ Pronto para upload de fotos' 
      : '❌ Configuração incompleta'

    return NextResponse.json(envCheck, { 
      status: allConfigured ? 200 : 400,
      headers: {
        'Cache-Control': 'no-cache'
      }
    })

  } catch (error) {
    return NextResponse.json({
      error: 'Erro ao verificar variáveis de ambiente',
      details: error instanceof Error ? error.message : 'Erro desconhecido',
      status: '❌ Erro na configuração'
    }, { status: 500 })
  }
}
