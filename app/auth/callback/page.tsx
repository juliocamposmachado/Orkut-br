'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function AuthCallbackPage() {
  const [status, setStatus] = useState<string>('Processando...')
  const [details, setDetails] = useState<any>({})
  const [error, setError] = useState<string | null>(null)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Capturar todos os parâmetros da URL
        const code = searchParams.get('code')
        const error_code = searchParams.get('error')
        const error_description = searchParams.get('error_description')
        const state = searchParams.get('state')
        
        const debugInfo = {
          code: code ? `${code.substring(0, 20)}...` : null,
          error_code,
          error_description,
          state,
          fullUrl: window.location.href,
          timestamp: new Date().toISOString()
        }
        
        setDetails(debugInfo)
        
        if (error_code) {
          setError(`OAuth Error: ${error_code} - ${error_description}`)
          setStatus('Erro no OAuth')
          return
        }
        
        if (!code) {
          setError('Código de autorização não encontrado')
          setStatus('Erro: Código ausente')
          return
        }
        
        setStatus('Verificando sessão atual...')
        
        // Verificar sessão atual
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          setError(`Erro ao obter sessão: ${sessionError.message}`)
          setStatus('Erro na sessão')
          return
        }
        
        if (session) {
          setStatus('✅ Login bem-sucedido! Redirecionando...')
          setTimeout(() => {
            router.push('/')
          }, 2000)
        } else {
          setStatus('Aguardando processamento do callback...')
          // Aguardar um pouco mais para o callback processar
          setTimeout(async () => {
            const { data: { session: newSession } } = await supabase.auth.getSession()
            if (newSession) {
              setStatus('✅ Login bem-sucedido! Redirecionando...')
              router.push('/')
            } else {
              setError('Sessão não foi criada após o callback')
              setStatus('Erro: Sessão não criada')
            }
          }, 3000)
        }
        
      } catch (err: any) {
        setError(`Erro inesperado: ${err.message}`)
        setStatus('Erro inesperado')
        console.error('Callback error:', err)
      }
    }

    handleCallback()
  }, [searchParams, router, supabase])

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="text-4xl mb-4">🔄</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Processando Login
          </h1>
          <p className="text-gray-600">{status}</p>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-red-800 mb-2">Erro encontrado:</h3>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
        
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-gray-800 mb-2">Informações de Debug:</h3>
          <pre className="text-xs text-gray-600 overflow-x-auto">
            {JSON.stringify(details, null, 2)}
          </pre>
        </div>
        
        <div className="text-center">
          <button
            onClick={() => router.push('/login')}
            className="text-purple-600 hover:text-purple-800 font-medium"
          >
            ← Voltar para o Login
          </button>
        </div>
      </div>
    </div>
  )
}
