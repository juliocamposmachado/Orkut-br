'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/local-auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export default function TestAuthLocalPage() {
  const { user, profile, loading, signIn, signUp, signInWithGoogle, signOut } = useAuth()
  
  const [loginForm, setLoginForm] = useState({
    email: 'test@example.com',
    password: '123456'
  })
  
  const [registerForm, setRegisterForm] = useState({
    email: 'new@example.com',
    password: '123456',
    displayName: 'Novo Usuário',
    username: 'novousuario'
  })

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await signIn(loginForm.email, loginForm.password)
      toast.success('Login realizado com sucesso!')
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await signUp(registerForm.email, registerForm.password, {
        username: registerForm.username,
        displayName: registerForm.displayName
      })
      toast.success('Cadastro realizado com sucesso!')
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle()
      toast.success('Login com Google realizado com sucesso!')
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleLogout = async () => {
    try {
      await signOut()
      toast.success('Logout realizado com sucesso!')
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">🧪 Teste de Autenticação Local</h1>
        
        {/* Status do usuário */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Status de Autenticação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">Usuário:</h3>
                {user ? (
                  <div className="bg-green-50 p-3 rounded border border-green-200">
                    <p><strong>ID:</strong> {user.id}</p>
                    <p><strong>Email:</strong> {user.email}</p>
                    <p><strong>Criado em:</strong> {user.created_at}</p>
                  </div>
                ) : (
                  <div className="bg-red-50 p-3 rounded border border-red-200">
                    <p>❌ Nenhum usuário logado</p>
                  </div>
                )}
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Perfil:</h3>
                {profile ? (
                  <div className="bg-green-50 p-3 rounded border border-green-200">
                    <p><strong>Username:</strong> {profile.username}</p>
                    <p><strong>Nome:</strong> {profile.display_name}</p>
                    <p><strong>Email confirmado:</strong> {profile.email_confirmed ? '✅' : '❌'}</p>
                  </div>
                ) : (
                  <div className="bg-red-50 p-3 rounded border border-red-200">
                    <p>❌ Nenhum perfil carregado</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Login */}
          <Card>
            <CardHeader>
              <CardTitle>🔐 Login</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <Input
                  type="email"
                  placeholder="Email"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                />
                <Input
                  type="password"
                  placeholder="Senha"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                />
                <Button type="submit" className="w-full">
                  Fazer Login
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Cadastro */}
          <Card>
            <CardHeader>
              <CardTitle>📝 Cadastro</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRegister} className="space-y-4">
                <Input
                  type="email"
                  placeholder="Email"
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm(prev => ({ ...prev, email: e.target.value }))}
                />
                <Input
                  type="password"
                  placeholder="Senha"
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm(prev => ({ ...prev, password: e.target.value }))}
                />
                <Input
                  type="text"
                  placeholder="Nome"
                  value={registerForm.displayName}
                  onChange={(e) => setRegisterForm(prev => ({ ...prev, displayName: e.target.value }))}
                />
                <Input
                  type="text"
                  placeholder="Username"
                  value={registerForm.username}
                  onChange={(e) => setRegisterForm(prev => ({ ...prev, username: e.target.value }))}
                />
                <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
                  Criar Conta
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Outras ações */}
          <Card>
            <CardHeader>
              <CardTitle>🌐 Outras Ações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={handleGoogleLogin}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                Login com Google (Simulado)
              </Button>
              
              {user && (
                <Button 
                  onClick={handleLogout}
                  variant="destructive"
                  className="w-full"
                >
                  Logout
                </Button>
              )}
              
              <Button 
                onClick={() => window.location.href = '/'}
                variant="outline"
                className="w-full"
              >
                Ir para Home
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Dados localStorage */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>💾 LocalStorage Debug</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h4 className="font-medium">Session Token:</h4>
                <code className="text-xs bg-gray-100 p-2 block rounded mt-1 break-all">
                  {typeof window !== 'undefined' ? localStorage.getItem('orkut_session_token') || 'null' : 'N/A'}
                </code>
              </div>
              
              <div>
                <h4 className="font-medium">User Data:</h4>
                <code className="text-xs bg-gray-100 p-2 block rounded mt-1 break-all">
                  {typeof window !== 'undefined' ? localStorage.getItem('orkut_user_data') || 'null' : 'N/A'}
                </code>
              </div>
              
              <div>
                <h4 className="font-medium">Profile Data:</h4>
                <code className="text-xs bg-gray-100 p-2 block rounded mt-1 break-all">
                  {typeof window !== 'undefined' ? localStorage.getItem('orkut_profile_data') || 'null' : 'N/A'}
                </code>
              </div>
            </div>
            
            <Button 
              onClick={() => {
                if (typeof window !== 'undefined') {
                  localStorage.clear()
                  window.location.reload()
                }
              }}
              variant="outline"
              size="sm"
              className="mt-4"
            >
              🗑️ Limpar localStorage
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
