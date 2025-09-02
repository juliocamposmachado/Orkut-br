import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Mercado Pago access token não configurado' },
        { status: 500 }
      );
    }

    // Criar plano Orkut BR Pro
    const planData = {
      reason: "Orkut BR Pro - Recursos Premium",
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        repetitions: 12, // 12 meses
        billing_day: 1, // Todo dia 1 do mês
        billing_day_proportional: true,
        free_trial: {
          frequency: 7,
          frequency_type: "days"
        },
        transaction_amount: 1.99,
        currency_id: "BRL"
      },
      payment_methods_allowed: {
        payment_types: [
          { id: "credit_card" },
          { id: "debit_card" },
          { id: "digital_wallet" }
        ],
        payment_methods: [
          { id: "visa" },
          { id: "master" },
          { id: "american_express" },
          { id: "elo" },
          { id: "pix" }
        ]
      },
      back_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription/success`
    };

    console.log('📝 Criando plano Orkut BR Pro...', planData);

    const response = await fetch('https://api.mercadopago.com/preapproval_plan', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(planData)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Erro ao criar plano:', data);
      return NextResponse.json(
        { error: 'Erro ao criar plano de assinatura', details: data },
        { status: response.status }
      );
    }

    console.log('✅ Plano criado com sucesso:', data);

    return NextResponse.json({
      success: true,
      plan_id: data.id,
      plan: data
    });

  } catch (error) {
    console.error('❌ Erro interno ao criar plano:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
