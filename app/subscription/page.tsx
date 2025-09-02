'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/enhanced-auth-context';
import { toast } from 'sonner';
import { Crown, Check, X, Star, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function SubscriptionPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [checkingSubscription, setCheckingSubscription] = useState(true);
  const { user, signInWithGoogle } = useAuth();
  const router = useRouter();

  // Verificar se usuário já tem assinatura
  useEffect(() => {
    const checkSubscription = async () => {
      if (!user) {
        setCheckingSubscription(false);
        return;
      }

      try {
        const response = await fetch('/api/subscription/status');
        if (response.ok) {
          const data = await response.json();
          setHasSubscription(data.hasActiveSubscription);
        }
      } catch (error) {
        console.error('Erro ao verificar assinatura:', error);
      } finally {
        setCheckingSubscription(false);
      }
    };

    checkSubscription();
  }, [user]);

  const handleSubscribe = async () => {
    if (!user) {
      toast.info('Você precisa estar logado para assinar o Orkut BR Pro');
      await signInWithGoogle();
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/subscription/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email,
          plan_type: 'pro'
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('🎉 Redirecionando para pagamento!');
        if (data.payment_url) {
          window.open(data.payment_url, '_blank');
        }
      } else {
        toast.error(data.error || 'Erro ao criar assinatura');
      }
    } catch (error) {
      console.error('Erro ao criar assinatura:', error);
      toast.error('Erro interno. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  if (checkingSubscription) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Verificando assinatura...</p>
        </div>
      </div>
    );
  }

  if (hasSubscription && user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto bg-yellow-400 rounded-full p-4 w-20 h-20 flex items-center justify-center mb-4">
              <Crown className="h-10 w-10 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-800">
              Você já é PRO! 👑
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 font-medium mb-2">
                ✅ Assinatura Orkut BR Pro ativa
              </p>
              <p className="text-green-600 text-sm">
                Aproveite todos os recursos premium!
              </p>
            </div>
            
            <div className="space-y-3">
              <Button
                onClick={() => router.push('/')}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                Ir para o Orkut
              </Button>
              
              <Link href="/configuracoes" className="block">
                <Button variant="outline" className="w-full">
                  Gerenciar Assinatura
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 p-4">
      <div className="max-w-4xl mx-auto py-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-3 mb-6">
            <div className="bg-yellow-400 rounded-full p-3">
              <Crown className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white">
              Orkut BR Pro
            </h1>
            <Sparkles className="h-8 w-8 text-yellow-300" />
          </div>
          <p className="text-xl text-purple-100 max-w-2xl mx-auto">
            Desbloqueie recursos exclusivos e tenha a melhor experiência no Orkut BR!
          </p>
        </div>

        {/* Planos */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          
          {/* Plano Gratuito */}
          <Card className="bg-white/90 backdrop-blur-sm border-2 border-gray-200">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl font-bold text-gray-800 mb-2">
                Orkut BR Grátis
              </CardTitle>
              <div className="text-3xl font-bold text-gray-600">
                R$ 0<span className="text-lg font-normal">/mês</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                <li className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-green-500" />
                  <span className="text-gray-700">Perfil e fotos básicas</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-green-500" />
                  <span className="text-gray-700">Scraps e depoimentos</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-green-500" />
                  <span className="text-gray-700">Participar de comunidades</span>
                </li>
                <li className="flex items-center space-x-3">
                  <X className="h-5 w-5 text-red-500" />
                  <span className="text-gray-500">Temas personalizados</span>
                </li>
                <li className="flex items-center space-x-3">
                  <X className="h-5 w-5 text-red-500" />
                  <span className="text-gray-500">Chamadas de vídeo/áudio</span>
                </li>
                <li className="flex items-center space-x-3">
                  <X className="h-5 w-5 text-red-500" />
                  <span className="text-gray-500">Assistente de voz IA</span>
                </li>
              </ul>
              
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => router.push('/login')}
              >
                Começar Grátis
              </Button>
            </CardContent>
          </Card>

          {/* Plano Pro */}
          <Card className="bg-gradient-to-br from-yellow-400 to-orange-500 text-white border-2 border-yellow-300 relative overflow-hidden">
            <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
              POPULAR
            </div>
            
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl font-bold mb-2">
                Orkut BR Pro
              </CardTitle>
              <div className="text-4xl font-bold">
                R$ 1,99<span className="text-lg font-normal">/mês</span>
              </div>
              <p className="text-yellow-100 text-sm mt-2">
                7 dias grátis para testar!
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                <li className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-white" />
                  <span>Tudo do plano gratuito</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Star className="h-5 w-5 text-white" />
                  <span><strong>Temas personalizados</strong></span>
                </li>
                <li className="flex items-center space-x-3">
                  <Star className="h-5 w-5 text-white" />
                  <span><strong>Chamadas de vídeo/áudio</strong></span>
                </li>
                <li className="flex items-center space-x-3">
                  <Star className="h-5 w-5 text-white" />
                  <span><strong>Assistente de voz IA</strong></span>
                </li>
                <li className="flex items-center space-x-3">
                  <Star className="h-5 w-5 text-white" />
                  <span><strong>Badge PRO no perfil</strong></span>
                </li>
                <li className="flex items-center space-x-3">
                  <Star className="h-5 w-5 text-white" />
                  <span><strong>Suporte prioritário</strong></span>
                </li>
                <li className="flex items-center space-x-3">
                  <Star className="h-5 w-5 text-white" />
                  <span><strong>Recursos exclusivos</strong></span>
                </li>
              </ul>
              
              <Button 
                onClick={handleSubscribe}
                disabled={isLoading}
                className="w-full bg-white text-orange-600 hover:bg-gray-100 font-bold py-3 text-lg shadow-lg"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
                    <span>Processando...</span>
                  </div>
                ) : (
                  <>
                    <Crown className="mr-2 h-5 w-5" />
                    Assinar Agora
                  </>
                )}
              </Button>
              
              <p className="text-center text-yellow-100 text-xs">
                Cancele a qualquer momento • Sem taxa de cancelamento
              </p>
            </CardContent>
          </Card>
        </div>

        {/* FAQ */}
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center text-gray-800">
              Perguntas Frequentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-bold text-gray-800 mb-2">
                🔄 Posso cancelar a qualquer momento?
              </h3>
              <p className="text-gray-600">
                Sim! Você pode cancelar sua assinatura a qualquer momento sem taxas extras. 
                Você continuará tendo acesso aos recursos Pro até o final do período já pago.
              </p>
            </div>
            
            <div>
              <h3 className="font-bold text-gray-800 mb-2">
                💳 Como funciona o período de teste?
              </h3>
              <p className="text-gray-600">
                Oferecemos 7 dias grátis para você testar todos os recursos Pro. 
                Após o período de teste, a cobrança de R$ 1,99/mês será iniciada automaticamente.
              </p>
            </div>
            
            <div>
              <h3 className="font-bold text-gray-800 mb-2">
                🛡️ É seguro?
              </h3>
              <p className="text-gray-600">
                Utilizamos o Mercado Pago, uma das plataformas de pagamento mais seguras do Brasil. 
                Seus dados estão protegidos com criptografia de ponta.
              </p>
            </div>
            
            <div>
              <h3 className="font-bold text-gray-800 mb-2">
                ✨ Que recursos exclusivos vou ter?
              </h3>
              <p className="text-gray-600">
                Chamadas de vídeo/áudio, assistente de voz IA, temas personalizados, 
                badge PRO no seu perfil e muito mais recursos que estamos desenvolvendo!
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Botão Voltar */}
        <div className="text-center mt-8">
          <Button 
            variant="outline" 
            onClick={() => router.push('/login')}
            className="bg-white/20 border-white/30 text-white hover:bg-white/30"
          >
            ← Voltar para Login
          </Button>
        </div>
      </div>
    </div>
  );
}
