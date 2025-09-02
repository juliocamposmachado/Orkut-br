import { NextResponse } from 'next/server';

// Forçar renderização dinâmica
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('⏰ Cron: Executando job de posts automáticos da rádio...');
    
    // Chamar a API de posts automáticos
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/radio-auto-post`, {
      method: 'POST', // Usar POST para forçar execução
      cache: 'no-store'
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Cron: Post automático criado com sucesso!', result.postId);
      return NextResponse.json({
        success: true,
        message: 'Post automático da rádio criado',
        postId: result.postId,
        nextExecution: new Date(Date.now() + 15 * 60 * 1000).toISOString()
      });
    } else {
      console.log('⏸️ Cron: Aguardando próximo post:', result.message);
      return NextResponse.json({
        success: true,
        message: result.message,
        timeLeftMinutes: result.timeLeftMinutes,
        nextExecution: result.nextPostAt
      });
    }
    
  } catch (error) {
    console.error('❌ Cron: Erro no job automático:', error);
    
    return NextResponse.json({
      success: false,
      error: `Erro no cron: ${error instanceof Error ? error.message : 'Desconhecido'}`,
      nextRetry: new Date(Date.now() + 5 * 60 * 1000).toISOString()
    }, { status: 500 });
  }
}

// Também permitir POST para execução manual
export async function POST() {
  return await GET();
}
