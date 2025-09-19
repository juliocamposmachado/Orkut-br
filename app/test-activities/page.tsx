'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/enhanced-auth-context'

export default function TestActivitiesPage() {
  const { user, profile } = useAuth()
  const [testResults, setTestResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const addResult = (test: string, success: boolean, data?: any) => {
    setTestResults(prev => [...prev, {
      test,
      success,
      data,
      timestamp: new Date().toLocaleTimeString()
    }])
  }

  const runTests = async () => {
    if (!user || !profile) {
      addResult('Verificação do usuário', false, 'Usuário não logado')
      return
    }

    setLoading(true)
    setTestResults([])

    // Teste 1: Verificar se o usuário está logado
    addResult('Usuário logado', true, {
      id: user.id,
      name: profile.display_name,
      photo: profile.photo_url
    })

    // Teste 2: Testar API de atividades (GET)
    try {
      const response = await fetch(`/api/recent-activities?profile_id=${user.id}&limit=5`)
      const data = await response.json()
      
      addResult('GET /api/recent-activities', data.success, {
        activities: data.activities?.length || 0,
        source: data.source
      })
    } catch (error) {
      addResult('GET /api/recent-activities', false, error)
    }

    // Teste 3: Criar atividade de teste (POST)
    try {
      const testActivity = {
        profile_id: user.id,
        activity_type: 'post',
        activity_data: {
          content: 'Post de teste criado em ' + new Date().toLocaleString(),
          post_content: 'Este é um post de teste para verificar se o sistema de atividades está funcionando!'
        }
      }

      const response = await fetch('/api/recent-activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testActivity)
      })
      
      const data = await response.json()
      addResult('POST /api/recent-activities', data.success, data)
    } catch (error) {
      addResult('POST /api/recent-activities', false, error)
    }

    // Teste 4: Verificar se atividade foi criada
    setTimeout(async () => {
      try {
        const response = await fetch(`/api/recent-activities?profile_id=${user.id}&limit=5`)
        const data = await response.json()
        
        addResult('Verificação pós-criação', data.success, {
          activities: data.activities?.length || 0,
          source: data.source,
          latest: data.activities?.[0]?.activity_type
        })
      } catch (error) {
        addResult('Verificação pós-criação', false, error)
      }
      
      setLoading(false)
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">🧪 Teste do Sistema de Atividades</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Informações do Usuário</h2>
          {user && profile ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <strong>ID:</strong> {user.id}
              </div>
              <div>
                <strong>Nome:</strong> {profile.display_name}
              </div>
              <div>
                <strong>Email:</strong> {user.email}
              </div>
              <div>
                <strong>Foto:</strong> {profile.photo_url ? '✅ Presente' : '❌ Ausente'}
              </div>
            </div>
          ) : (
            <p className="text-red-600">❌ Usuário não logado</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Testes da API</h2>
            <button
              onClick={runTests}
              disabled={loading || !user}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg disabled:opacity-50"
            >
              {loading ? '⏳ Executando...' : '▶️ Executar Testes'}
            </button>
          </div>

          <div className="space-y-4">
            {testResults.map((result, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-l-4 ${
                  result.success 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-red-500 bg-red-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">
                    {result.success ? '✅' : '❌'} {result.test}
                  </h3>
                  <span className="text-sm text-gray-500">{result.timestamp}</span>
                </div>
                {result.data && (
                  <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">📋 Instruções</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Clique em "Executar Testes" para testar a API</li>
            <li>Todos os testes devem aparecer com ✅ se tudo estiver funcionando</li>
            <li>Depois vá para seu <a href={`/perfil/${profile?.username || 'seu-username'}`} className="text-purple-600 underline">perfil</a> e verifique a seção "Atividades Recentes"</li>
            <li>Crie um post normal na página inicial e veja se aparece nas atividades</li>
          </ol>
        </div>

        <div className="mt-6 text-center">
          <a
            href="/"
            className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            🏠 Voltar à Página Inicial
          </a>
        </div>
      </div>
    </div>
  )
}
