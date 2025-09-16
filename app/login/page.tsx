'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/local-auth-context';
import { useSubscription } from '@/hooks/use-subscription';
import { toast } from 'sonner';
import { Eye, EyeOff, ChevronDown, ChevronUp, BarChart3, Database, Shield } from 'lucide-react';
import { Crown } from 'lucide-react';
import { Mic, Phone, Users, Heart } from 'lucide-react';
// Ícones das tecnologias
import { 
  SiNextdotjs, 
  SiReact, 
  SiTailwindcss, 
  SiSupabase, 
  SiVercel,
  SiGooglegemini,
  SiClaude
} from 'react-icons/si';
import { DiChrome, DiAndroid, DiApple } from 'react-icons/di';
import { IoTerminal } from 'react-icons/io5';

export default function LoginPage() {
  // Estados para login tradicional
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  // Estados para UI
  const [showMoreInfo, setShowMoreInfo] = useState(false)
  
  const { signIn } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()



  const handleDeveloperAccess = () => {
    toast.success('🛠️ Redirecionando para o Dashboard do Desenvolvedor!')
    router.push('/dashboard/project/orkut')
  }

  const handleDiagnosticAccess = () => {
    toast.success('📊 Redirecionando para o Dashboard Diagnóstico!')
    router.push('/dashboard/project/orkut')
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return

    setIsLoading(true)
    try {
      await signIn(email, password)
      toast.success('Login realizado com sucesso!')
      router.push('/')
    } catch (error: any) {
      toast.error(error.message || 'Erro ao fazer login')
    } finally {
      setIsLoading(false)
    }
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
          
          {/* Recomendação de Navegador */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 mt-4 border border-white/20">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <span className="text-xl">🌐</span>
              <span className="text-white font-medium text-sm">Para melhor experiência</span>
            </div>
            <p className="text-purple-100 text-xs mb-3">
              O Orkut funciona melhor no <strong>Google Chrome</strong> ou instalado como aplicativo!
            </p>
            <div className="flex space-x-2">
              <Button
                onClick={() => window.open('https://www.google.com/chrome/', '_blank')}
                variant="outline"
                size="sm"
                className="flex-1 bg-white/20 border-white/30 text-white hover:bg-white/30 text-xs py-2"
              >
                <span className="mr-1">🌐</span>
                Chrome
              </Button>
              <Button
                onClick={() => {
                  // Trigger PWA install prompt
                  if ('serviceWorker' in navigator) {
                    toast.success('💡 Procure pelo ícone "Instalar" na barra do navegador!');
                  } else {
                    toast.info('📱 Use o menu do seu navegador para "Adicionar à tela inicial"');
                  }
                }}
                variant="outline"
                size="sm"
                className="flex-1 bg-white/20 border-white/30 text-white hover:bg-white/30 text-xs py-2"
              >
                <span className="mr-1">📱</span>
                Instalar
              </Button>
            </div>
          </div>
        </div>

        {/* Login Principal */}
        <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl mb-6">
          <CardHeader className="pb-4">
            <CardTitle className="text-center text-gray-800 flex items-center justify-center gap-2">
              <Database className="h-5 w-5 text-purple-600" />
              Login Seguro
            </CardTitle>
            <p className="text-center text-sm text-gray-600 mt-1">
              🔒 Sistema de autenticação avançado com nova tecnologia
            </p>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Entrar</TabsTrigger>
                <TabsTrigger value="signup">Cadastrar</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin" className="space-y-4 mt-4">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div>
                    <Input
                      type="email"
                      placeholder="E-mail"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="border-purple-300 focus:ring-purple-500"
                    />
                  </div>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Senha"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="border-purple-300 focus:ring-purple-500 pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 p-1 h-auto"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-500" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-500" />
                      )}
                    </Button>
                  </div>
                  
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => router.push('/reset-password')}
                      className="text-sm text-purple-600 hover:text-purple-800 underline"
                    >
                      Esqueceu a senha?
                    </button>
                  </div>
                  
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    {isLoading ? 'Entrando...' : 'Entrar'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4 mt-4">
                <div className="text-center space-y-3">
                  <p className="text-sm text-gray-600">Para criar uma conta nova:</p>
                  <Button
                    onClick={() => router.push('/cadastro')}
                    className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                  >
                    Ir para Página de Cadastro
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
            
            {/* Seção sobre nova tecnologia */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-purple-600" />
                  <h4 className="text-sm font-bold text-purple-800">Nova Tecnologia de Banco de Dados</h4>
                </div>
                <p className="text-xs text-purple-700 leading-relaxed">
                  Implementamos um sistema de autenticação avançado e seguro, 
                  utilizando as mais modernas tecnologias de banco de dados. 
                  Seus dados estão protegidos com criptografia de ponta.
                </p>
              </div>
            </div>
            
            {/* Divisor */}
            <div className="flex items-center space-x-4 my-6">
              <hr className="flex-1 border-gray-300" />
              <span className="text-gray-500 text-sm font-medium">ou</span>
              <hr className="flex-1 border-gray-300" />
            </div>
            
            {/* Botão Orkut BR Pro */}
            <Button
              onClick={() => {
                toast.success('👑 Redirecionando para assinatura Orkut BR Pro!')
                router.push('/subscription')
              }}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold py-3 shadow-lg border-2 border-yellow-300"
            >
              <Crown className="mr-2 text-xl" />
              Assinar Orkut BR Pro
            </Button>
            <p className="text-xs text-gray-600 text-center font-medium mt-2">
              ✨ Recursos exclusivos por apenas R$ 1,99/mês!
            </p>

            {/* Botão desenvolvedor */}
            <div className="mt-6 pt-6 border-t border-gray-200">
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
          </CardContent>
        </Card>

        {/* Botão Saiba Mais */}
        <div className="text-center mb-6">
          <Button
            onClick={() => setShowMoreInfo(!showMoreInfo)}
            variant="outline"
            className="bg-white/20 border-white/30 text-white hover:bg-white/30 transition-all duration-300"
          >
            {showMoreInfo ? (
              <>
                <ChevronUp className="mr-2 h-4 w-4" />
                Ocultar informações
              </>
            ) : (
              <>
                <ChevronDown className="mr-2 h-4 w-4" />
                Saiba mais sobre o Orkut
              </>
            )}
          </Button>
        </div>

        {/* Conteúdo Adicional - Controlado por showMoreInfo */}
        {showMoreInfo && (
          <div className="animate-in slide-in-from-top-5 duration-500">
            {/* Recursos em destaque */}
            <div className="mt-8 text-center text-white">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 hover:bg-white/20 transition-colors">
              <div className="flex justify-center mb-2">
                <Mic className="h-6 w-6 text-green-400" />
              </div>
              <p className="font-medium text-sm">Assistente de Voz</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 hover:bg-white/20 transition-colors">
              <div className="flex justify-center mb-2">
                <Phone className="h-6 w-6 text-blue-400" />
              </div>
              <p className="font-medium text-sm">Chamadas A/V</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 hover:bg-white/20 transition-colors">
              <div className="flex justify-center mb-2">
                <Users className="h-6 w-6 text-purple-400" />
              </div>
              <p className="font-medium text-sm">Comunidades</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 hover:bg-white/20 transition-colors">
              <div className="flex justify-center mb-2">
                <Heart className="h-6 w-6 text-pink-400" />
              </div>
              <p className="font-medium text-sm">Scraps & Depoimentos</p>
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
              <h3 className="text-lg font-bold text-white mb-1">Instale o App do Orkut!</h3>
              <p className="text-sm text-purple-200">Acesso rápido direto da sua tela inicial 🚀</p>
            </div>
            
            {/* PWA Install */}
            <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-300/30 rounded-lg p-4 mb-4">
              <div className="text-center mb-3">
                <div className="text-3xl mb-2">📱</div>
                <h4 className="text-white font-bold text-sm mb-1">Instalar como App</h4>
                <p className="text-xs text-green-100">Funciona offline e carrega mais rápido!</p>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => {
                    if ('serviceWorker' in navigator) {
                      toast.success('💡 Procure pelo ícone "Instalar app" na barra de endereço!');
                    } else {
                      toast.info('📱 Use o menu "⋮" → "Instalar aplicativo" ou "Adicionar à tela inicial"');
                    }
                  }}
                  variant="outline"
                  size="sm"
                  className="bg-green-500/20 border-green-300/50 text-white hover:bg-green-500/30 text-xs py-2"
                >
                  <span className="mr-1">🌐</span>
                  Browser
                </Button>
                
                <Button
                  onClick={() => {
                    if (navigator.userAgent.includes('Mobile')) {
                      toast.success('📱 Abra o menu do navegador e toque em "Adicionar à tela inicial"!');
                    } else {
                      toast.success('💻 Procure pelo ícone de "Instalar" na barra de endereço do seu navegador!');
                    }
                  }}
                  variant="outline"
                  size="sm"
                  className="bg-blue-500/20 border-blue-300/50 text-white hover:bg-blue-500/30 text-xs py-2"
                >
                  <span className="mr-1">📲</span>
                  Celular
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Chrome Web Store */}
              <Button 
                onClick={() => {
                  toast.info('🌐 Em desenvolvimento! Por enquanto, use a instalação PWA acima.');
                }}
                variant="outline" 
                className="bg-white/20 border-white/30 text-white hover:bg-white/30 transition-all duration-300 h-auto py-3 px-4 flex flex-col items-center space-y-2"
              >
                <DiChrome className="text-2xl text-blue-400" />
                <div className="text-center">
                  <p className="font-medium text-sm">Chrome Store</p>
                  <p className="text-xs opacity-80">Em breve</p>
                </div>
              </Button>
              
              {/* Google Play */}
              <Button 
                onClick={() => {
                  toast.info('📱 App Android em desenvolvimento! Use a versão PWA por enquanto.');
                }}
                variant="outline" 
                className="bg-white/20 border-white/30 text-white hover:bg-white/30 transition-all duration-300 h-auto py-3 px-4 flex flex-col items-center space-y-2"
              >
                <DiAndroid className="text-2xl text-green-400" />
                <div className="text-center">
                  <p className="font-medium text-sm">Google Play</p>
                  <p className="text-xs opacity-80">Em desenvolvimento</p>
                </div>
              </Button>
              
              {/* App Store */}
              <Button 
                onClick={() => {
                  toast.info('🍎 App iOS em desenvolvimento! Use a versão PWA por enquanto.');
                }}
                variant="outline" 
                className="bg-white/20 border-white/30 text-white hover:bg-white/30 transition-all duration-300 h-auto py-3 px-4 flex flex-col items-center space-y-2"
              >
                <DiApple className="text-2xl text-white" />
                <div className="text-center">
                  <p className="font-medium text-sm">App Store</p>
                  <p className="text-xs opacity-80">Em desenvolvimento</p>
                </div>
              </Button>
            </div>
            
            <div className="mt-3 text-center">
              <p className="text-xs text-purple-200 opacity-80">
                💡 Instale como PWA para ter a melhor experiência!
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
                <div className="flex justify-center mb-1">
                  <SiClaude className="text-xl text-orange-400" />
                </div>
                <p className="text-xs font-medium text-white">Claude 4</p>
                <p className="text-xs text-purple-200">Sonnet</p>
              </div>
              
              <div className="bg-white/10 rounded-lg p-3 hover:bg-white/20 transition-colors">
                <div className="flex justify-center mb-1">
                  <SiGooglegemini className="text-xl text-blue-400" />
                </div>
                <p className="text-xs font-medium text-white">Gemini</p>
                <p className="text-xs text-purple-200">AI</p>
              </div>
              
              <div className="bg-white/10 rounded-lg p-3 hover:bg-white/20 transition-colors">
                <div className="flex justify-center mb-1">
                  <IoTerminal className="text-xl text-orange-500" />
                </div>
                <p className="text-xs font-medium text-white">Warp AI</p>
                <p className="text-xs text-purple-200">Terminal</p>
              </div>
              
              <div className="bg-white/10 rounded-lg p-3 hover:bg-white/20 transition-colors">
                <div className="flex justify-center mb-1">
                  <SiVercel className="text-xl text-white" />
                </div>
                <p className="text-xs font-medium text-white">Vercel</p>
                <p className="text-xs text-purple-200">Deploy</p>
              </div>
              
              <div className="bg-white/10 rounded-lg p-3 hover:bg-white/20 transition-colors">
                <div className="flex justify-center mb-1">
                  <SiSupabase className="text-xl text-green-400" />
                </div>
                <p className="text-xs font-medium text-white">Supabase</p>
                <p className="text-xs text-purple-200">Database</p>
              </div>
              
              <div className="bg-white/10 rounded-lg p-3 hover:bg-white/20 transition-colors">
                <div className="flex justify-center mb-1">
                  <Database className="text-xl text-indigo-400" />
                </div>
                <p className="text-xs font-medium text-white">PasteDB</p>
                <p className="text-xs text-purple-200">Database</p>
              </div>
              
              <div className="bg-white/10 rounded-lg p-3 hover:bg-white/20 transition-colors">
                <div className="flex justify-center mb-1">
                  <SiNextdotjs className="text-xl text-white" />
                </div>
                <p className="text-xs font-medium text-white">Next.js</p>
                <p className="text-xs text-purple-200">React</p>
              </div>
              
              <div className="bg-white/10 rounded-lg p-3 hover:bg-white/20 transition-colors">
                <div className="flex justify-center mb-1">
                  <SiTailwindcss className="text-xl text-cyan-400" />
                </div>
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
        )}
      </div>
    </div>
  )
}
