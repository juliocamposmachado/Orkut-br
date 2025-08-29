import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    // Buscar assinatura ativa do usuário
    const { data: subscription, error: subError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (subError && subError.code !== 'PGRST116') {
      console.error('❌ Erro ao buscar assinatura:', subError);
      return NextResponse.json(
        { error: 'Erro ao verificar assinatura' },
        { status: 500 }
      );
    }

    const hasActiveSubscription = !!subscription;

    return NextResponse.json({
      hasActiveSubscription,
      subscription: subscription || null,
      user: {
        id: user.id,
        email: user.email,
        isPro: hasActiveSubscription
      }
    });

  } catch (error) {
    console.error('❌ Erro interno ao verificar assinatura:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
