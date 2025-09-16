'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function OAuthDebugPage() {
  const [sessionInfo, setSessionInfo] = useState<any>(null)
  const [userInfo, setUserInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          setError(`Session error: ${sessionError.message}`)
          return
        }

        setSessionInfo(session)

        // Check current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError) {
          setError(`User error: ${userError.message}`)
          return
        }

        setUserInfo(user)
        
      } catch (err: any) {
        setError(`Unexpected error: ${err.message}`)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [supabase])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
        <div className="text-white text-xl">Carregando informações de debug...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-pink-600 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              🔍 OAuth Debug Information
            </h1>
            <p className="text-gray-600">Informações de autenticação para diagnóstico</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-red-800 mb-2">Erro encontrado:</h3>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Session Info */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center">
                🔐 Session Information
              </h3>
              {sessionInfo ? (
                <div className="space-y-2">
                  <p className="text-sm"><strong>Access Token:</strong> {sessionInfo.access_token ? `${sessionInfo.access_token.substring(0, 20)}...` : 'None'}</p>
                  <p className="text-sm"><strong>Refresh Token:</strong> {sessionInfo.refresh_token ? `${sessionInfo.refresh_token.substring(0, 20)}...` : 'None'}</p>
                  <p className="text-sm"><strong>Expires At:</strong> {sessionInfo.expires_at ? new Date(sessionInfo.expires_at * 1000).toISOString() : 'None'}</p>
                  <p className="text-sm"><strong>Provider:</strong> {sessionInfo.user?.app_metadata?.provider || 'None'}</p>
                </div>
              ) : (
                <p className="text-red-600 text-sm">❌ Nenhuma sessão encontrada</p>
              )}
            </div>

            {/* User Info */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center">
                👤 User Information
              </h3>
              {userInfo ? (
                <div className="space-y-2">
                  <p className="text-sm"><strong>ID:</strong> {userInfo.id}</p>
                  <p className="text-sm"><strong>Email:</strong> {userInfo.email}</p>
                  <p className="text-sm"><strong>Email Verified:</strong> {userInfo.email_confirmed_at ? '✅ Sim' : '❌ Não'}</p>
                  <p className="text-sm"><strong>Provider:</strong> {userInfo.app_metadata?.provider}</p>
                  <p className="text-sm"><strong>Created At:</strong> {new Date(userInfo.created_at).toLocaleString()}</p>
                  <p className="text-sm"><strong>Last Sign In:</strong> {userInfo.last_sign_in_at ? new Date(userInfo.last_sign_in_at).toLocaleString() : 'Never'}</p>
                </div>
              ) : (
                <p className="text-red-600 text-sm">❌ Nenhum usuário encontrado</p>
              )}
            </div>
          </div>

          {/* Environment Info */}
          <div className="bg-blue-50 rounded-lg p-6 mt-6">
            <h3 className="font-bold text-blue-800 mb-4">🌍 Environment Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm"><strong>Current URL:</strong> {typeof window !== 'undefined' ? window.location.href : 'SSR'}</p>
                <p className="text-sm"><strong>User Agent:</strong> {typeof navigator !== 'undefined' ? navigator.userAgent : 'SSR'}</p>
              </div>
              <div>
                <p className="text-sm"><strong>Supabase URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL}</p>
                <p className="text-sm"><strong>Environment:</strong> {process.env.NODE_ENV}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => router.push('/login')}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              ← Voltar ao Login
            </button>
            
            {userInfo && (
              <button
                onClick={() => router.push('/')}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Ir para Home
              </button>
            )}
            
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              🔄 Atualizar
            </button>

            {sessionInfo && (
              <button
                onClick={async () => {
                  await supabase.auth.signOut()
                  router.push('/login')
                }}
                className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                🚪 Logout
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
