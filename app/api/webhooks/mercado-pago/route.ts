import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import crypto from 'crypto';

const WEBHOOK_SECRET = process.env.MERCADO_PAGO_WEBHOOK_SECRET || '924128aabcd4764c8406aae5b97e6ebf7bf3af3b1e4d0c4dc0c177afbac2e0e4';

function verifySignature(rawBody: string, signature: string): boolean {
  try {
    const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
    hmac.update(rawBody);
    const calculatedSignature = hmac.digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(calculatedSignature, 'hex')
    );
  } catch (error) {
    console.error('Erro na verificação da assinatura:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-signature');
    
    console.log('📥 Webhook recebido do Mercado Pago');
    
    // Verificar assinatura para segurança
    if (!signature || !verifySignature(rawBody, signature)) {
      console.error('❌ Assinatura inválida no webhook');
      return NextResponse.json(
        { error: 'Assinatura inválida' },
        { status: 401 }
      );
    }

    const data = JSON.parse(rawBody);
    console.log('📋 Dados do webhook:', JSON.stringify(data, null, 2));

    // Processar diferentes tipos de notificação
    if (data.type === 'subscription') {
      await handleSubscriptionNotification(data);
    } else if (data.type === 'payment') {
      await handlePaymentNotification(data);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('❌ Erro no webhook do Mercado Pago:', error);
    return NextResponse.json(
      { error: 'Erro interno no webhook' },
      { status: 500 }
    );
  }
}

async function handleSubscriptionNotification(data: any) {
  try {
    const subscriptionId = data.data?.id;
    if (!subscriptionId) return;

    console.log(`🔄 Processando notificação de assinatura: ${subscriptionId}`);

    // Buscar detalhes da assinatura no Mercado Pago
    const response = await fetch(`https://api.mercadopago.com/preapproval/${subscriptionId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`
      }
    });

    if (!response.ok) {
      console.error('❌ Erro ao buscar assinatura no MP:', response.status);
      return;
    }

    const subscription = await response.json();
    console.log('📄 Detalhes da assinatura:', JSON.stringify(subscription, null, 2));

    // Mapear status do Mercado Pago para nosso sistema
    let status = 'pending';
    switch (subscription.status) {
      case 'authorized':
      case 'active':
        status = 'active';
        break;
      case 'cancelled':
      case 'expired':
        status = 'cancelled';
        break;
      case 'paused':
        status = 'paused';
        break;
    }

    // Atualizar assinatura no banco
    const { error } = await supabase
      .from('user_subscriptions')
      .update({
        status,
        updated_at: new Date().toISOString(),
        metadata: {
          ...subscription,
          last_webhook: new Date().toISOString()
        }
      })
      .eq('mercado_pago_subscription_id', subscriptionId);

    if (error) {
      console.error('❌ Erro ao atualizar assinatura no banco:', error);
    } else {
      console.log(`✅ Assinatura ${subscriptionId} atualizada para status: ${status}`);
    }

  } catch (error) {
    console.error('❌ Erro ao processar notificação de assinatura:', error);
  }
}

async function handlePaymentNotification(data: any) {
  try {
    const paymentId = data.data?.id;
    if (!paymentId) return;

    console.log(`💳 Processando notificação de pagamento: ${paymentId}`);

    // Buscar detalhes do pagamento no Mercado Pago
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`
      }
    });

    if (!response.ok) {
      console.error('❌ Erro ao buscar pagamento no MP:', response.status);
      return;
    }

    const payment = await response.json();
    console.log('💰 Detalhes do pagamento:', JSON.stringify(payment, null, 2));

    // Se o pagamento foi aprovado, ativar/renovar assinatura
    if (payment.status === 'approved' && payment.external_reference) {
      const subscriptionId = payment.external_reference;
      
      // Calcular nova data de expiração (1 mês a partir de agora)
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1);

      const { error } = await supabase
        .from('user_subscriptions')
        .update({
          status: 'active',
          expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString(),
          metadata: {
            last_payment: payment,
            last_payment_date: new Date().toISOString()
          }
        })
        .eq('mercado_pago_subscription_id', subscriptionId);

      if (error) {
        console.error('❌ Erro ao ativar assinatura:', error);
      } else {
        console.log(`✅ Assinatura ${subscriptionId} ativada até ${expiresAt.toISOString()}`);
      }
    }

  } catch (error) {
    console.error('❌ Erro ao processar notificação de pagamento:', error);
  }
}
