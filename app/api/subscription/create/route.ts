import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Mercado Pago access token não configurado' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { email, plan_type = 'pro' } = body;

    // Primeiro, criar o plano se não existir
    const planResponse = await fetch(`${request.nextUrl.origin}/api/subscription/create-plan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!planResponse.ok) {
      const planError = await planResponse.json();
      return NextResponse.json(
        { error: 'Erro ao criar plano', details: planError },
        { status: 500 }
      );
    }

    const planData = await planResponse.json();
    console.log('✅ Plano obtido/criado:', planData.plan_id);

    // Criar assinatura para o usuário
    const subscriptionData = {
      preapproval_plan_id: planData.plan_id,
      reason: 'Orkut BR Pro - Assinatura Premium',
      payer_email: email || user.email,
      card_token_id: '', // Será preenchido pelo frontend
      status: 'pending',
      back_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription/success`,
    };

    console.log('📝 Criando assinatura...', subscriptionData);

    const response = await fetch('https://api.mercadopago.com/preapproval', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(subscriptionData)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Erro ao criar assinatura:', data);
      return NextResponse.json(
        { error: 'Erro ao criar assinatura', details: data },
        { status: response.status }
      );
    }

    console.log('✅ Assinatura criada com sucesso:', data);

    // Salvar assinatura no banco de dados
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1); // 1 mês de assinatura

    const { error: dbError } = await supabase
      .from('user_subscriptions')
      .insert({
        user_id: user.id,
        plan_type,
        status: 'pending',
        mercado_pago_plan_id: planData.plan_id,
        mercado_pago_subscription_id: data.id,
        expires_at: expiresAt.toISOString(),
        metadata: {
          mercado_pago_data: data,
          created_via: 'api'
        }
      });

    if (dbError) {
      console.error('❌ Erro ao salvar assinatura no banco:', dbError);
      return NextResponse.json(
        { error: 'Erro ao salvar assinatura no banco de dados' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      subscription_id: data.id,
      payment_url: data.init_point,
      subscription: data
    });

  } catch (error) {
    console.error('❌ Erro interno ao criar assinatura:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
