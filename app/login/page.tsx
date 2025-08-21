'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/auth-context-fallback';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import publicProfiles from '@/lib/seed-public-profiles.json';

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { signIn, signUp } = useAuth()
  const router = useRouter()

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

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password || !username || !displayName) return

    setIsLoading(true)
    try {
      await signUp(email, password, { username, displayName })
      toast.success('Conta criada com sucesso!')
      router.push('/')
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar conta')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDemoLogin = async (type: 'audio' | 'video') => {
    setIsLoading(true)
    try {
      const demoCredentials = {
        audio: { email: 'teste.audio@orkut.com', password: 'admin123' },
        video: { email: 'teste.video@orkut.com', password: 'admin123' }
      }

      const { email, password } = demoCredentials[type]
      
      // Try to sign in with demo account
      try {
        await signIn(email, password)
      } catch {
        // If account doesn't exist, create it
        await signUp(email, password, {
          username: type === 'audio' ? 'teste_audio' : 'teste_video',
          displayName: type === 'audio' ? 'Teste Áudio' : 'Teste Vídeo'
        })
      }

      toast.success(`Login como conta de teste (${type}) realizado!`)
      router.push('/')
    } catch (error: any) {
      toast.error(`Erro ao fazer login como conta de teste: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePublicProfileLogin = async (profile: any) => {
    setIsLoading(true)
    try {
      // Try to sign in with public profile
      try {
        await signIn(profile.email, profile.password)
      } catch {
        // If account doesn't exist, create it with complete profile data
        await signUp(profile.email, profile.password, {
          username: profile.username,
          displayName: profile.display_name,
          bio: profile.bio,
          photo_url: profile.photo_url
        })
      }

      toast.success(`Logado como ${profile.display_name}! 😈`)
      router.push('/')
    } catch (error: any) {
      toast.error(`Erro ao fazer login: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="bg-white rounded-full p-4 inline-block mb-4">
            <span className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Orkut
            </span>
          </div>
          <h1 className="text-white text-2xl font-bold mb-2">
            Orkut - Até o dono do nome ver! 😂
          </h1>
          <p className="text-purple-100 mb-3">
            A rede social que volta... ou não! 🤷‍♂️💀
          </p>
        </div>

        <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-center text-gray-800">Entre ou cadastre-se</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Entrar</TabsTrigger>
                <TabsTrigger value="signup">Cadastrar</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin">
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
                  <div>
                    <Input
                      type="password"
                      placeholder="Senha"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="border-purple-300 focus:ring-purple-500"
                    />
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

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div>
                    <Input
                      type="text"
                      placeholder="Nome de usuário"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      className="border-purple-300 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <Input
                      type="text"
                      placeholder="Nome para exibição"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      required
                      className="border-purple-300 focus:ring-purple-500"
                    />
                  </div>
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
                  <div>
                    <Input
                      type="password"
                      placeholder="Senha"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="border-purple-300 focus:ring-purple-500"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    {isLoading ? 'Criando conta...' : 'Cadastrar'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            {/* Demo Accounts */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-center text-sm text-gray-600 mb-4">
                Ou experimente com contas de demonstração:
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDemoLogin('audio')}
                  disabled={isLoading}
                  className="border-purple-300 text-purple-700 hover:bg-purple-50"
                >
                  🎤 Teste Áudio
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDemoLogin('video')}
                  disabled={isLoading}
                  className="border-purple-300 text-purple-700 hover:bg-purple-50"
                >
                  📹 Teste Vídeo
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Perfeito para testar chamadas de áudio e vídeo
              </p>
            </div>

            {/* Public Profiles */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-center text-sm text-gray-600 mb-4">
                Ou entre com um perfil público (e seja um pouco sarcástico):
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {publicProfiles.map((profile) => (
                  <Card 
                    key={profile.id}
                    className="cursor-pointer hover:shadow-lg hover:border-purple-400 transition-all duration-200"
                    onClick={() => handlePublicProfileLogin(profile)}
                  >
                    <CardContent className="p-4 flex flex-col items-center text-center">
                      <Avatar className="w-16 h-16 mb-3">
                        <AvatarImage src={profile.photo_url} alt={profile.display_name} />
                        <AvatarFallback>{profile.display_name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <p className="font-semibold text-sm text-gray-800">{profile.display_name}</p>
                      <p className="text-xs text-gray-600">@{profile.username}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="mt-8 text-center text-white">
          <div className="grid grid-cols-2 gap-4 text-sm mb-6">
            <div>
              <div className="text-2xl mb-1">🎤</div>
              <p>Assistente de Voz</p>
            </div>
            <div>
              <div className="text-2xl mb-1">📞</div>
              <p>Chamadas A/V</p>
            </div>
            <div>
              <div className="text-2xl mb-1">👥</div>
              <p>Comunidades</p>
            </div>
            <div>
              <div className="text-2xl mb-1">💝</div>
              <p>Scraps & Depoimentos</p>
            </div>
          </div>
          
          {/* Sarcastic disclaimer */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-sm text-purple-100 mb-6">
            <p className="mb-2">
              📢 <strong>Aviso importante:</strong> Este é um projeto FAN MADE! 🎭
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
            <p className="text-xs opacity-80">
              💜 Feito com amor (e sarcasmo) por fãs nostálgicos!
            </p>
          </div>
          
          {/* Tribute to Orkut Büyükkökten */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-xs">
            <p className="mb-2 text-purple-200">
              🙏 <strong>Tributo ao criador original:</strong>
            </p>
            <p className="mb-2">
              <strong>Orkut Büyükkökten</strong> - O gênio que criou nossa nostalgia! 🧠✨
            </p>
            <p className="text-purple-300 mb-2">
              "Obrigado por nos dar os melhores anos da internet brasileira!" 🇧🇷❤️
            </p>
            
            <div className="border-t border-white/20 pt-2 mt-3">
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