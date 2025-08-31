'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Crown, CheckCircle, Sparkles } from 'lucide-react';

export default function SubscriptionSuccessPage() {
  const [countdown, setCountdown] = useState(5);
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto bg-green-500 rounded-full p-4 w-20 h-20 flex items-center justify-center mb-4">
            <CheckCircle className="h-10 w-10 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-800 mb-2">
            Bem-vindo ao Orkut BR Pro! 🎉
          </CardTitle>
          <div className="inline-flex items-center space-x-2 bg-yellow-100 px-4 py-2 rounded-full">
            <Crown className="h-5 w-5 text-yellow-600" />
            <span className="text-yellow-800 font-medium">Status: PRO</span>
            <Sparkles className="h-5 w-5 text-yellow-600" />
          </div>
        </CardHeader>
        
        <CardContent className="text-center space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800 font-medium mb-2">
              ✅ Assinatura ativada com sucesso!
            </p>
            <p className="text-green-600 text-sm">
              Agora você tem acesso a todos os recursos premium do Orkut BR!
            </p>
          </div>

          <div className="space-y-3 text-left">
            <h3 className="font-bold text-gray-800 text-center mb-3">
              🚀 Recursos desbloqueados:
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center space-x-2">
                <span className="text-green-500">✨</span>
                <span>Temas personalizados</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-green-500">📞</span>
                <span>Chamadas de vídeo e áudio</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-green-500">🎤</span>
                <span>Assistente de voz IA</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-green-500">👑</span>
                <span>Badge PRO no seu perfil</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-green-500">🛠️</span>
                <span>Suporte prioritário</span>
              </li>
            </ul>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p className="text-purple-800 text-sm">
              Redirecionando para o Orkut em <strong>{countdown}</strong> segundos...
            </p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => router.push('/')}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              <Crown className="mr-2 h-5 w-5" />
              Ir para o Orkut BR Pro
            </Button>
            
            <Button
              variant="outline"
              onClick={() => router.push('/configuracoes')}
              className="w-full"
            >
              Gerenciar Assinatura
            </Button>
          </div>

          <p className="text-xs text-gray-500">
            Obrigado por apoiar o projeto Orkut BR! 💜
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
