'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function TesteRedirectPage() {
  const router = useRouter()
  const [log, setLog] = useState<string[]>([])

  const addLog = (message: string) => {
    console.log(message)
    setLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  useEffect(() => {
    addLog('Componente TesteRedirect montado')
    addLog(`URL atual: ${window.location.href}`)
    addLog(`Pathname: ${window.location.pathname}`)
    
    // Verificar se há redirecionamentos automáticos
    const originalPushState = window.history.pushState
    const originalReplaceState = window.history.replaceState
    
    window.history.pushState = function(...args) {
      addLog(`History.pushState chamado: ${args[2]}`)
      return originalPushState.apply(this, args)
    }
    
    window.history.replaceState = function(...args) {
      addLog(`History.replaceState chamado: ${args[2]}`)
      return originalReplaceState.apply(this, args)
    }
    
    // Interceptar mudanças de localização
    const originalLocationHref = window.location.href
    let locationChangeCount = 0
    
    const checkLocationChange = () => {
      if (window.location.href !== originalLocationHref) {
        locationChangeCount++
        addLog(`Localização mudou (${locationChangeCount}): ${window.location.href}`)
      }
      
      if (locationChangeCount < 10) { // Evitar loop infinito
        setTimeout(checkLocationChange, 100)
      }
    }
    
    checkLocationChange()
    
    return () => {
      window.history.pushState = originalPushState
      window.history.replaceState = originalReplaceState
    }
  }, [])

  const testarAPI = async () => {
    try {
      addLog('Testando GET /api/user_presence...')
      const response = await fetch('/api/user_presence')
      const data = await response.json()
      addLog(`Resposta da API: ${JSON.stringify(data)}`)
    } catch (error) {
      addLog(`Erro na API: ${error}`)
    }
  }

  const limparLog = () => {
    setLog([])
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Teste de Redirecionamentos</h1>
        
        <div className="bg-white p-4 rounded-lg shadow mb-4">
          <div className="flex gap-2 mb-4">
            <button 
              onClick={testarAPI}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Testar API
            </button>
            <button 
              onClick={limparLog}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Limpar Log
            </button>
          </div>
          
          <div className="bg-black text-green-400 p-4 rounded font-mono text-sm h-96 overflow-y-auto">
            {log.length === 0 ? (
              <div>Log vazio...</div>
            ) : (
              log.map((entry, index) => (
                <div key={index}>{entry}</div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
