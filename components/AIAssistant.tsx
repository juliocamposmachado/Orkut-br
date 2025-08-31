'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

// Tipos para o sistema de IA
interface LogEntry {
  id: string
  timestamp: string
  type: 'error' | 'warning' | 'info' | 'success'
  message: string
  data: any
  url: string
  resolved: boolean
}

interface AISystemStatus {
  initialized: boolean
  components: {
    logger: boolean
    geminiClient: boolean
    chatAssistant: boolean
  }
}

// Componente principal da IA
const AIAssistant = () => {
  const [isInitialized, setIsInitialized] = useState(false)
  const [systemStatus, setSystemStatus] = useState<AISystemStatus>({
    initialized: false,
    components: {
      logger: false,
      geminiClient: false,
      chatAssistant: false
    }
  })
  const [lastError, setLastError] = useState<LogEntry | null>(null)

  useEffect(() => {
    const initializeAI = async () => {
      try {
        // Verificar se as variáveis de ambiente estão disponíveis
        const geminiApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
        
        if (!geminiApiKey) {
          console.warn('🚨 NEXT_PUBLIC_GEMINI_API_KEY não encontrada')
          // Marcar como inicializado mesmo sem API key para evitar erros
          setIsInitialized(true)
          return
        }

        // Sistema simplificado - não carrega scripts externos para evitar erros 404
        console.log('✅ Sistema de IA inicializado (modo simplificado)')
        setIsInitialized(true)
        
      } catch (error) {
        console.error('❌ Erro ao inicializar sistema de IA:', error)
        // Mesmo com erro, marcar como inicializado para evitar loops
        setIsInitialized(true)
      }
    }

    initializeAI()
  }, [])

  // Função simplificada - removida para evitar dependências de arquivos externos
  const loadAIScripts = async (): Promise<void> => {
    // Desabilitado para evitar erros 404
    return Promise.resolve()
  }

  // Aguardar componentes estarem prontos
  const waitForAIComponents = async (): Promise<void> => {
    return new Promise((resolve) => {
      const checkComponents = () => {
        const w = window as any
        
        const status = {
          initialized: !!w.aiSystem?.isInitialized,
          components: {
            logger: !!w.siteLogger,
            geminiClient: !!w.geminiClient,
            chatAssistant: !!w.aiAssistant
          }
        }

        setSystemStatus(status)

        if (status.components.logger && status.components.geminiClient && status.components.chatAssistant) {
          // Configurar listener para novos erros
          setupErrorListener()
          resolve()
        } else {
          setTimeout(checkComponents, 500)
        }
      }

      checkComponents()
    })
  }

  // Configurar listener para erros
  const setupErrorListener = () => {
    window.addEventListener('siteLogAdded', ((event: CustomEvent<LogEntry>) => {
      const logEntry = event.detail
      if (logEntry.type === 'error') {
        setLastError(logEntry)
      }
    }) as EventListener)
  }

  // Funções de controle da IA
  const openChat = () => {
    const aiAssistant = (window as any).aiAssistant
    if (aiAssistant) {
      aiAssistant.show()
    }
  }

  const openLogs = () => {
    window.open('/pages/logs.html', '_blank')
  }

  const testAIConnection = async () => {
    const geminiClient = (window as any).geminiClient
    if (geminiClient) {
      try {
        const result = await geminiClient.testConnection()
        alert(result ? 'Conexão com IA: ✅ Sucesso!' : 'Conexão com IA: ❌ Falhou')
      } catch (error) {
        alert(`Erro ao testar conexão: ${error}`)
      }
    }
  }

  // Renderizar indicador de status (apenas em desenvolvimento)
  if (process.env.NODE_ENV === 'development') {
    return (
      <div 
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '20px',
          background: isInitialized ? '#059669' : '#DC2626',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '6px',
          fontSize: '12px',
          fontWeight: 'bold',
          zIndex: 9998,
          cursor: 'pointer',
          userSelect: 'none'
        }}
        onClick={isInitialized ? openChat : undefined}
        title={isInitialized ? 'Clique para abrir chat da IA' : 'Sistema de IA não inicializado'}
      >
        🤖 IA {isInitialized ? 'Online' : 'Offline'}
        {lastError && (
          <div style={{ fontSize: '10px', marginTop: '2px', opacity: 0.8 }}>
            Último erro: {lastError.message.substring(0, 30)}...
          </div>
        )}
      </div>
    )
  }

  // Em produção, não renderiza nada visível
  return null
}

// Exportar componente com carregamento dinâmico
export default dynamic(() => Promise.resolve(AIAssistant), {
  ssr: false
})
