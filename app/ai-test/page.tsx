'use client'

import { useState, useEffect } from 'react'
import AIAssistant from '@/components/AIAssistant'

export default function AITestPage() {
  const [testResults, setTestResults] = useState<string[]>([])
  const [isAIReady, setIsAIReady] = useState(false)

  useEffect(() => {
    // Verificar se a IA está pronta
    const checkAI = setInterval(() => {
      const w = window as any
      if (w.aiSystem?.isInitialized) {
        setIsAIReady(true)
        clearInterval(checkAI)
        addResult('✅ Sistema de IA inicializado com sucesso!')
      }
    }, 1000)

    return () => clearInterval(checkAI)
  }, [])

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  // Funções de teste
  const testJavaScriptError = () => {
    try {
      addResult('🧪 Testando erro JavaScript...')
      // @ts-ignore - Erro intencional para teste
      nonExistentFunction()
    } catch (error) {
      addResult(`🚨 Erro JavaScript capturado: ${error}`)
    }
  }

  const testNetworkError = async () => {
    try {
      addResult('🧪 Testando erro de rede...')
      await fetch('/api/nonexistent-endpoint')
    } catch (error) {
      addResult(`🌐 Erro de rede capturado: ${error}`)
    }
  }

  const testFormError = () => {
    addResult('🧪 Testando erro de validação...')
    const input = document.createElement('input')
    input.setCustomValidity('Este é um erro simulado de validação')
    input.reportValidity()
    addResult('📝 Erro de validação simulado')
  }

  const testAIChat = () => {
    const w = window as any
    if (w.aiAssistant) {
      w.aiAssistant.show()
      addResult('💬 Chat da IA aberto')
    } else {
      addResult('❌ Chat da IA não disponível')
    }
  }

  const testAIConnection = async () => {
    const w = window as any
    if (w.geminiClient) {
      try {
        addResult('🔗 Testando conexão com IA...')
        const result = await w.geminiClient.testConnection()
        addResult(result ? '✅ Conexão com IA bem-sucedida!' : '❌ Falha na conexão com IA')
      } catch (error) {
        addResult(`❌ Erro ao testar conexão: ${error}`)
      }
    } else {
      addResult('❌ Cliente Gemini não disponível')
    }
  }

  const clearLogs = () => {
    const w = window as any
    if (w.siteLogger) {
      w.siteLogger.clearLogs()
      addResult('🗑️ Logs limpos')
    } else {
      addResult('❌ Logger não disponível')
    }
  }

  const openLogs = () => {
    window.open('/pages/logs.html', '_blank')
    addResult('📊 Página de logs aberta')
  }

  const getSystemStatus = () => {
    const w = window as any
    const status = {
      logger: !!w.siteLogger,
      geminiClient: !!w.geminiClient,
      chatAssistant: !!w.aiAssistant,
      system: !!w.aiSystem?.isInitialized
    }
    
    addResult(`📊 Status do sistema: ${JSON.stringify(status)}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h1 className="text-4xl font-bold text-center text-gray-800 mb-8">
            🤖 Teste do Sistema de IA Assistente
          </h1>

          {/* Status da IA */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">📊 Status do Sistema</h2>
            <div className="flex items-center gap-4">
              <div className={`w-4 h-4 rounded-full ${isAIReady ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="font-medium">
                {isAIReady ? '✅ IA Online' : '🔄 Inicializando IA...'}
              </span>
              {process.env.NEXT_PUBLIC_GEMINI_API_KEY ? (
                <span className="text-green-600 text-sm">🔑 API Key configurada</span>
              ) : (
                <span className="text-red-600 text-sm">🚨 API Key não encontrada</span>
              )}
            </div>
          </div>

          {/* Botões de teste */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <button
              onClick={testJavaScriptError}
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-lg transition-colors"
            >
              🚨 Erro JS
            </button>
            
            <button
              onClick={testNetworkError}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-lg transition-colors"
            >
              📡 Erro Rede
            </button>
            
            <button
              onClick={testFormError}
              className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-4 rounded-lg transition-colors"
            >
              📝 Erro Form
            </button>
            
            <button
              onClick={testAIChat}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition-colors"
              disabled={!isAIReady}
            >
              💬 Abrir Chat
            </button>
            
            <button
              onClick={testAIConnection}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg transition-colors"
              disabled={!isAIReady}
            >
              🔗 Testar IA
            </button>
            
            <button
              onClick={getSystemStatus}
              className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg transition-colors"
            >
              📊 Status
            </button>
            
            <button
              onClick={openLogs}
              className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-4 rounded-lg transition-colors"
            >
              📋 Ver Logs
            </button>
            
            <button
              onClick={clearLogs}
              className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition-colors"
              disabled={!isAIReady}
            >
              🗑️ Limpar
            </button>
          </div>

          {/* Console de resultados */}
          <div className="bg-gray-900 text-green-400 p-6 rounded-lg font-mono text-sm">
            <h3 className="text-lg font-bold mb-4 text-white">📟 Console de Testes</h3>
            <div className="h-64 overflow-y-auto">
              {testResults.length === 0 ? (
                <div className="text-gray-500">Aguardando testes...</div>
              ) : (
                testResults.map((result, index) => (
                  <div key={index} className="mb-1">
                    {result}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Informações importantes */}
          <div className="mt-8 bg-blue-50 border-l-4 border-blue-400 p-6">
            <h3 className="text-lg font-semibold mb-2">ℹ️ Informações Importantes</h3>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li><strong>Atalhos:</strong> Ctrl+Shift+A (abrir chat), Ctrl+Shift+L (abrir logs)</li>
              <li><strong>Logs:</strong> Todos os erros são automaticamente registrados</li>
              <li><strong>IA:</strong> Chat abre automaticamente quando há erros críticos</li>
              <li><strong>API:</strong> Utiliza Google Gemini para análise inteligente</li>
              <li><strong>Armazenamento:</strong> Logs ficam salvos no localStorage</li>
            </ul>
          </div>

          {/* Formulário de teste */}
          <div className="mt-8 bg-white border-2 border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">📝 Formulário de Teste</h3>
            <form onSubmit={(e) => {
              e.preventDefault()
              addResult('📋 Formulário submetido - simulando erro...')
              setTimeout(() => {
                const error = new Error('Erro simulado no processamento do formulário')
                addResult(`🚨 ${error.message}`)
                throw error
              }, 1000)
            }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <input
                  type="text"
                  placeholder="Nome"
                  className="p-3 border border-gray-300 rounded-lg"
                  required
                />
                <input
                  type="email"
                  placeholder="Email"
                  className="p-3 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <textarea
                placeholder="Mensagem"
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg mb-4"
                required
              />
              <button
                type="submit"
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                Enviar (vai gerar erro)
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Incluir o componente da IA */}
      <AIAssistant />
    </div>
  )
}
