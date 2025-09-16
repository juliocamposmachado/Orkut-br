'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/enhanced-auth-context'
import { Button } from '@/components/ui/button'

export default function AuthDebugPage() {
  const { user, profile, loading, signInWithGoogle } = useAuth()
  const [debugInfo, setDebugInfo] = useState<any>({})

  useEffect(() => {
    setDebugInfo({
      user: user ? {
        id: user.id,
        email: user.email,
        email_confirmed_at: user.email_confirmed_at,
        created_at: user.created_at
      } : null,
      profile: profile ? {
        id: profile.id,
        username: profile.username,
        display_name: profile.display_name,
        email_confirmed: profile.email_confirmed
      } : null,
      loading,
      timestamp: new Date().toISOString()
    })
    
    console.log('🔍 [DEBUG PAGE] Estado atualizado:', {
      loading,
      hasUser: !!user,
      hasProfile: !!profile,
      userEmail: user?.email,
      profileUsername: profile?.username
    })
  }, [user, profile, loading])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🔍 Debug de Autenticação</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Estado Atual</h2>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className={`p-4 rounded ${loading ? 'bg-yellow-100' : 'bg-green-100'}`}>
              <h3 className="font-medium">Loading</h3>
              <p className={loading ? 'text-yellow-800' : 'text-green-800'}>
                {loading ? '⏳ Carregando...' : '✅ Concluído'}
              </p>
            </div>
            <div className={`p-4 rounded ${user ? 'bg-green-100' : 'bg-red-100'}`}>
              <h3 className="font-medium">Usuário</h3>
              <p className={user ? 'text-green-800' : 'text-red-800'}>
                {user ? '✅ Logado' : '❌ Não logado'}
              </p>
            </div>
            <div className={`p-4 rounded ${profile ? 'bg-green-100' : 'bg-red-100'}`}>
              <h3 className="font-medium">Perfil</h3>
              <p className={profile ? 'text-green-800' : 'text-red-800'}>
                {profile ? '✅ Carregado' : '❌ Não carregado'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Detalhes do Estado</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Ações de Debug</h2>
          <div className="space-y-4">
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline"
            >
              🔄 Recarregar Página
            </Button>
            
            <Button 
              onClick={signInWithGoogle}
              className="bg-red-600 hover:bg-red-700"
            >
              🔐 Testar Login Google
            </Button>
            
            <Button 
              onClick={() => {
                console.log('🔍 Forçando log do estado atual')
                console.log('Loading:', loading)
                console.log('User:', user)
                console.log('Profile:', profile)
              }}
              variant="outline"
            >
              📝 Log Estado no Console
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Instruções</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Abra o DevTools (F12) e vá na aba Console</li>
            <li>Observe os logs que começam com [AUTH] para ver o fluxo</li>
            <li>Se loading ficar travado em "Carregando...", há um problema na inicialização</li>
            <li>Se user estiver null após loading concluído, o usuário não está autenticado</li>
            <li>Se profile estiver null com user presente, há problema no carregamento do perfil</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
