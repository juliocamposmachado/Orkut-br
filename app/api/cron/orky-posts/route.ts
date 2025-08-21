import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('⏰ Cronjob: Gerando post automático do Orky...')
    
    // Verificar autorização do cronjob (Vercel passa header específico)
    const authHeader = request.headers.get('authorization')
    const isVercelCron = request.headers.get('user-agent')?.includes('vercel-cron')
    
    // Para desenvolvimento local, permitir acesso direto
    const isDevelopment = process.env.NODE_ENV === 'development'
    
    if (!isDevelopment && !isVercelCron && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Acesso não autorizado' },
        { status: 401 }
      )
    }

    // Chamar a API de geração de posts do Orky
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    const response = await fetch(`${baseUrl}/api/orky/generate-post`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    })

    if (!response.ok) {
      throw new Error(`Erro ao gerar post: ${response.status}`)
    }

    const data = await response.json()
    
    console.log('✅ Post automático do Orky gerado com sucesso!')
    
    return NextResponse.json({
      success: true,
      message: 'Post automático do Orky gerado',
      post: data.post,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Erro no cronjob do Orky:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// Também permitir POST para testes manuais
export async function POST(request: NextRequest) {
  return GET(request)
}
