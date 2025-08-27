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
  const [buttonText, setButtonText] = useState('Continuar com Google')
  const { signInWithGoogle } = useAuth()
  const router = useRouter()

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    setButtonText('Verificando usuário...')
    
    try {
      await signInWithGoogle()
      setButtonText('Redirecionando para o Google...')
      toast.success('🔍 Redirecionando para autenticação Google...')
    } catch (error: any) {
      console.error('Erro no handleGoogleLogin:', error)
      toast.error(error.message || 'Erro ao conectar com Google. Tente novamente.')
      setIsLoading(false)
      setButtonText('Continuar com Google')
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
            
            {/* Botão Google Unificado */}
            <div className="space-y-4">
              <Button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                size="lg"
                className="w-full bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-300 font-semibold py-4 text-lg shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <FcGoogle className="mr-3 text-2xl" />
                {isLoading ? 'Conectando...' : 'Continuar com Google'}
              </Button>
            </div>
            
            <p className="text-center text-sm text-gray-600">
              Rápido, seguro e sem senhas para lembrar! 🚀
            </p>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
              <p className="text-xs text-green-700">
                🆕 <strong>Usuários novos e existentes:</strong> O mesmo botão funciona para login e cadastro automaticamente!
              </p>
            </div>
            
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
                
                <Button
                  onClick={() => {
                    toast.success('👤 Redirecionando para a página do desenvolvedor!')
                    router.push('/sobre-desenvolvedor')
                  }}
                  disabled={isLoading}
                  variant="outline"
                  className="w-full border-blue-300 hover:bg-blue-50 text-blue-700 font-medium py-3"
                >
                  <span className="mr-2 text-lg">👤</span>
                  Sobre o Desenvolvedor
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
          
          {/* Download Apps Section */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-4">
            <div className="text-center mb-4">
              <h3 className="text-lg font-bold text-white mb-1">Baixe nossos Apps!</h3>
              <p className="text-sm text-purple-200">Leve o Orkut para qualquer lugar 🚀</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Windows App */}
              <Button 
                variant="outline" 
                className="bg-white/20 border-white/30 text-white hover:bg-white/30 transition-all duration-300 h-auto py-3 px-4 flex flex-col items-center space-y-2"
                disabled
              >
                <div className="text-2xl">💻</div>
                <div className="text-center">
                  <p className="font-medium text-sm">Windows</p>
                  <p className="text-xs opacity-80">Em breve</p>
                </div>
              </Button>
              
              {/* Android App */}
              <Button 
                variant="outline" 
                className="bg-white/20 border-white/30 text-white hover:bg-white/30 transition-all duration-300 h-auto py-3 px-4 flex flex-col items-center space-y-2"
                disabled
              >
                <div className="text-2xl">📱</div>
                <div className="text-center">
                  <p className="font-medium text-sm">Android</p>
                  <p className="text-xs opacity-80">Em breve</p>
                </div>
              </Button>
              
              {/* iOS App */}
              <Button 
                variant="outline" 
                className="bg-white/20 border-white/30 text-white hover:bg-white/30 transition-all duration-300 h-auto py-3 px-4 flex flex-col items-center space-y-2"
                disabled
              >
                <div className="text-2xl">📱</div>
                <div className="text-center">
                  <p className="font-medium text-sm">iOS</p>
                  <p className="text-xs opacity-80">Em breve</p>
                </div>
              </Button>
            </div>
            
            <div className="mt-3 text-center">
              <p className="text-xs text-purple-200 opacity-80">
                💡 Versões nativas para uma experiência ainda melhor!
              </p>
            </div>
          </div>

          {/* Tecnologias Usadas */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-sm mb-4">
            <div className="text-center mb-4">
              <h3 className="text-white font-bold mb-2">⚡ Feito com as melhores tecnologias</h3>
              <p className="text-purple-200 text-xs">Agradecemos a todas as ferramentas que tornaram este projeto possível!</p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="bg-white/10 rounded-lg p-3 hover:bg-white/20 transition-colors">
                <div className="text-xl mb-1">🤖</div>
                <p className="text-xs font-medium text-white">Claude 4</p>
                <p className="text-xs text-purple-200">Sonnet</p>
              </div>
              
              <div className="bg-white/10 rounded-lg p-3 hover:bg-white/20 transition-colors">
                <div className="text-xl mb-1">💎</div>
                <p className="text-xs font-medium text-white">Gemini</p>
                <p className="text-xs text-purple-200">AI</p>
              </div>
              
              <div className="bg-white/10 rounded-lg p-3 hover:bg-white/20 transition-colors">
                <div className="text-xl mb-1">🔥</div>
                <p className="text-xs font-medium text-white">Warp AI</p>
                <p className="text-xs text-purple-200">Terminal</p>
              </div>
              
              <div className="bg-white/10 rounded-lg p-3 hover:bg-white/20 transition-colors">
                <div className="text-xl mb-1">▲</div>
                <p className="text-xs font-medium text-white">Vercel</p>
                <p className="text-xs text-purple-200">Deploy</p>
              </div>
              
              <div className="bg-white/10 rounded-lg p-3 hover:bg-white/20 transition-colors">
                <div className="text-xl mb-1">🗄️</div>
                <p className="text-xs font-medium text-white">Supabase</p>
                <p className="text-xs text-purple-200">Database</p>
              </div>
              
              <div className="bg-white/10 rounded-lg p-3 hover:bg-white/20 transition-colors">
                <div className="text-xl mb-1">🔍</div>
                <p className="text-xs font-medium text-white">Google</p>
                <p className="text-xs text-purple-200">Auth</p>
              </div>
              
              <div className="bg-white/10 rounded-lg p-3 hover:bg-white/20 transition-colors">
                <div className="text-xl mb-1">⚡</div>
                <p className="text-xs font-medium text-white">Next.js</p>
                <p className="text-xs text-purple-200">React</p>
              </div>
              
              <div className="bg-white/10 rounded-lg p-3 hover:bg-white/20 transition-colors">
                <div className="text-xl mb-1">🎨</div>
                <p className="text-xs font-medium text-white">Tailwind</p>
                <p className="text-xs text-purple-200">CSS</p>
              </div>
            </div>
            
            <div className="border-t border-white/20 pt-3 mt-4">
              <p className="text-center text-xs text-purple-200">
                💜 Obrigado por tornarem este sonho possível! 🚀
              </p>
            </div>
          </div>

          {/* Tributo */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-sm">
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
