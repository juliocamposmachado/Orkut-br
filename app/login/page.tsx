'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/enhanced-auth-context';
import { toast } from 'sonner';
import { ChevronDown, ChevronUp, BarChart3 } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const { signInWithGoogle } = useAuth()
  const router = useRouter()

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    try {
      await signInWithGoogle()
      toast.success('Redirecionando para o Google...')
    } catch (error: any) {
      toast.error(error.message || 'Erro ao fazer login com Google')
      setIsLoading(false)
    }
  }

  const handleDeveloperAccess = () => {
    toast.success('🛠️ Redirecionando para o Dashboard do Desenvolvedor!')
    router.push('/dashboard/project/orkut')
  }

  const handleDiagnosticAccess = () => {
    toast.success('📊 Redirecionando para o Dashboard Diagnóstico!')
    router.push('/dashboard/project/orkut')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        
        {/* Logo Principal */}
        <div className="text-center mb-8">
          <div className="bg-white rounded-full p-6 inline-block mb-6 shadow-2xl">
            <span className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Orkut
            </span>
          </div>
          <h1 className="text-white text-2xl font-bold mb-2">
            Bem-vindo de volta! 🌟
          </h1>
          <p className="text-purple-100 text-lg">
            Reviva a nostalgia das redes sociais
          </p>
        </div>

        {/* Card Principal */}
        <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
          <CardHeader className="pb-6">
            <CardTitle className="text-center text-2xl text-gray-800">Entre no Orkut</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {/* Botão Google - Principal */}
            <Button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              size="lg"
              className="w-full bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-300 font-semibold py-4 text-lg shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <FcGoogle className="mr-3 text-2xl" />
              {isLoading ? 'Conectando...' : 'Continuar com Google'}
            </Button>
            <p className="text-center text-sm text-gray-600">
              Rápido, seguro e sem senhas para lembrar! 🚀
            </p>
            
            {/* Seção Expansível - Info Técnica */}
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
              <CollapsibleTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="w-full p-3 text-sm text-blue-600 hover:bg-blue-50 transition-colors"
                >
                  <span className="mr-2">ℹ️</span>
                  Sobre o nome técnico do Google
                  {isOpen ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="px-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm space-y-3">
                  <p className="text-blue-700 font-medium">
                    <strong>Sobre o nome técnico na tela de login:</strong>
                  </p>
                  <p className="text-blue-600 leading-relaxed">
                    Utilizamos o <strong>Supabase</strong> como plataforma de banco de dados, 
                    que gera automaticamente nomes técnicos não editáveis.
                  </p>
                  <p className="text-blue-600 leading-relaxed">
                    Quando você clicar no botão Google, pode aparecer um nome como 
                    <span className="font-mono bg-blue-100 px-1 rounded mx-1">
                      "woyyikaztjrhqzgvbhmn.supabase.co"
                    </span>
                    - é o identificador automático da plataforma.
                  </p>
                  <p className="text-blue-700 font-medium">
                    <strong>Pedimos desculpas pelo inconveniente!</strong>
                  </p>
                  <p className="text-blue-600">
                    O sistema funciona perfeitamente, continue utilizando normalmente! 🚀
                  </p>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Divisor */}
            <div className="border-t border-gray-200 pt-4">
              
              {/* Botões dos Desenvolvedores */}
              <div className="space-y-3">
                <Button
                  onClick={handleDeveloperAccess}
                  disabled={isLoading}
                  variant="outline"
                  className="w-full border-purple-300 hover:bg-purple-50 text-purple-700 font-medium py-3"
                >
                  <span className="mr-2 text-lg">🛠️</span>
                  Dashboard do Desenvolvedor
                </Button>
                
                <Button
                  onClick={handleDiagnosticAccess}
                  disabled={isLoading}
                  variant="outline"
                  className="w-full border-green-300 hover:bg-green-50 text-green-700 font-medium py-3"
                >
                  <BarChart3 className="mr-2 h-5 w-5" />
                  Dashboard Diagnóstico
                </Button>
              </div>
            </div>

          </CardContent>
        </Card>

        {/* Recursos em destaque */}
        <div className="mt-8 text-center text-white">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 hover:bg-white/20 transition-colors">
              <div className="text-3xl mb-2">🎤</div>
              <p className="font-medium">Assistente de Voz</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 hover:bg-white/20 transition-colors">
              <div className="text-3xl mb-2">📞</div>
              <p className="font-medium">Chamadas A/V</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 hover:bg-white/20 transition-colors">
              <div className="text-3xl mb-2">👥</div>
              <p className="font-medium">Comunidades</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 hover:bg-white/20 transition-colors">
              <div className="text-3xl mb-2">💝</div>
              <p className="font-medium">Scraps & Depoimentos</p>
            </div>
          </div>
          
          {/* Disclaimer */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-sm text-purple-100">
            <p className="mb-2">
              📢 <strong>Aviso:</strong> Este é um projeto FAN MADE! 🎭
            </p>
            <p className="mb-2">
              O <a 
                href="https://www.orkut.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-yellow-300 hover:text-yellow-200 underline"
              >
                Orkut original
              </a> ainda diz que "vai voltar" desde 2014... 😴⏰
            </p>
            <p className="text-xs opacity-90">
              💜 Feito com amor (e nostalgia) por fãs!
            </p>
          </div>
          
          {/* Tributo */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-sm mt-4">
            <p className="mb-2 text-purple-200">
              🙏 <strong>Tributo ao criador original:</strong>
            </p>
            <p className="mb-2">
              <strong>Orkut Büyükkökten</strong> - O gênio que criou nossa nostalgia! 🧠✨
            </p>
            <p className="text-purple-300 mb-3">
              "Obrigado pelos melhores anos da internet brasileira!" 🇧🇷❤️
            </p>
            
            <div className="border-t border-white/20 pt-3">
              <p className="text-purple-200 text-xs flex items-center justify-center gap-2">
                <span>2004-2014</span>
                <span>💀</span>
                <span>Never Forget</span>
                <span>😢</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
