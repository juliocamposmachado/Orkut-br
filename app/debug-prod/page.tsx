'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/local-auth-context'

export default function DebugProdPage() {
  const { user, profile, loading } = useAuth()
  const [debugInfo, setDebugInfo] = useState<any>({})

  useEffect(() => {
    const info = {
      // Environment info
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV,
      currentUrl: window.location.href,
      
      // Supabase config
      SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '[CONFIGURED]' : '[NOT CONFIGURED]',
      
      // System config
      USE_PASTEDB_FOR_DATA: process.env.NEXT_PUBLIC_USE_PASTEDB_FOR_DATA,
      USE_SUPABASE_FOR_AUTH: process.env.NEXT_PUBLIC_USE_SUPABASE_FOR_AUTH,
      SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
      
      // Auth state
      userLoggedIn: !!user,
      userEmail: user?.email,
      profileExists: !!profile,
      authLoading: loading,
      
      // Browser info
      userAgent: navigator.userAgent,
      cookies: document.cookie,
    }
    
    setDebugInfo(info)
    
    // Log to console for debugging
    console.log('🔍 DEBUG PROD INFO:', info)
  }, [user, profile, loading])

  const testGoogleLogin = async () => {
    try {
      console.log('🔍 Testando Google Login...')
      const { signInWithGoogle } = await import('@/contexts/local-auth-context')
      // This won't work directly, but will show in console
      console.log('Google login function available:', typeof signInWithGoogle)
    } catch (error) {
      console.error('Erro ao testar Google login:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🔍 Debug Produção - Orkut BR</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Environment Info */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">🌍 Environment</h2>
            <div className="space-y-2 text-sm">
              <div><strong>NODE_ENV:</strong> {debugInfo.NODE_ENV || 'undefined'}</div>
              <div><strong>VERCEL_ENV:</strong> {debugInfo.VERCEL_ENV || 'undefined'}</div>
              <div><strong>Current URL:</strong> {debugInfo.currentUrl}</div>
              <div><strong>SITE_URL:</strong> {debugInfo.SITE_URL || 'undefined'}</div>
            </div>
          </div>

          {/* Supabase Config */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">🔧 Supabase Config</h2>
            <div className="space-y-2 text-sm">
              <div><strong>SUPABASE_URL:</strong> {debugInfo.SUPABASE_URL || 'NOT SET'}</div>
              <div><strong>SUPABASE_ANON_KEY:</strong> {debugInfo.SUPABASE_ANON_KEY}</div>
              <div><strong>USE_SUPABASE_FOR_AUTH:</strong> {debugInfo.USE_SUPABASE_FOR_AUTH || 'undefined'}</div>
              <div><strong>USE_PASTEDB_FOR_DATA:</strong> {debugInfo.USE_PASTEDB_FOR_DATA || 'undefined'}</div>
            </div>
          </div>

          {/* Auth State */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">👤 Auth State</h2>
            <div className="space-y-2 text-sm">
              <div><strong>Loading:</strong> {debugInfo.authLoading ? 'true' : 'false'}</div>
              <div><strong>User Logged In:</strong> {debugInfo.userLoggedIn ? 'true' : 'false'}</div>
              <div><strong>User Email:</strong> {debugInfo.userEmail || 'none'}</div>
              <div><strong>Profile Exists:</strong> {debugInfo.profileExists ? 'true' : 'false'}</div>
            </div>
          </div>

          {/* Browser Info */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">🌐 Browser</h2>
            <div className="space-y-2 text-sm">
              <div><strong>User Agent:</strong> {debugInfo.userAgent?.substring(0, 50) + '...'}</div>
              <div><strong>Cookies:</strong> {debugInfo.cookies ? 'Present' : 'None'}</div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">🛠️ Actions</h2>
          <div className="space-x-4">
            <button 
              onClick={testGoogleLogin}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Test Google Login Function
            </button>
            <button 
              onClick={() => window.location.href = '/login'}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Go to Login
            </button>
            <button 
              onClick={() => window.location.href = '/'}
              className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
            >
              Go to Home
            </button>
          </div>
        </div>

        {/* Raw Debug Data */}
        <div className="mt-8 bg-gray-900 text-green-400 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">📋 Raw Debug Data</h2>
          <pre className="text-xs overflow-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
}
