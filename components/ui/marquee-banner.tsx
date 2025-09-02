'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { Loader2, Sparkles } from 'lucide-react'

interface MarqueeBannerProps {
  className?: string
}

// Mensagens de fallback caso o Gemini não esteja disponível
const fallbackMessages = [
  "🚧 Estamos em desenvolvimento contínuo - obrigado pela paciência!",
  "🛠️ A equipe Orkut-BR está trabalhando em melhorias diárias",
  "🎵 Nova funcionalidade: DJ Orky agora toca músicas da sua infância!",
  "💬 Comunidades crescendo todos os dias - Participe!",
  "⚡ Melhorias de desempenho em andamento - Fique ligado",
  "🔄 Atualizações diárias sendo implementadas",
  "🌟 Obrigado por fazer parte dessa nova era do Orkut",
  "📱 Versão mobile em desenvolvimento",
  "💻 Site em construção - Sugestões são bem-vindas!",
  "✨ Novas funcionalidades a caminho - Aguarde!"
]

// Cache global para evitar chamadas desnecessárias
let cachedMessages: string[] | null = null
let lastUpdateTime = 0
const CACHE_DURATION = 10 * 60 * 1000 // 10 minutos
let isGenerating = false // Flag global para evitar múltiplas chamadas simultâneas

export function MarqueeBanner({ className = "" }: MarqueeBannerProps) {
  const [messages, setMessages] = useState<string[]>(fallbackMessages)
  const [isGeneratingNew, setIsGeneratingNew] = useState(false)
  const [geminiAvailable, setGeminiAvailable] = useState(false)
  const [lastGenerationTime, setLastGenerationTime] = useState<number>(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const generationIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Função para gerar mensagens com Gemini AI (otimizada para evitar loops)
  const generateGeminiMessages = useCallback(async () => {
    const now = Date.now()
    
    // Evitar chamadas muito frequentes (mínimo 9 minutos entre gerações)
    if (now - lastGenerationTime < 9 * 60 * 1000) {
      console.log('⏰ Aguardando intervalo mínimo para nova geração de mensagens')
      return
    }

    // Evitar múltiplas chamadas simultâneas globalmente
    if (isGenerating) {
      console.log('⚠️ Geração já em andamento, aguardando...')
      return
    }

    // Usar cache se ainda válido
    if (cachedMessages && (now - lastUpdateTime) < CACHE_DURATION) {
      console.log('📦 Usando mensagens do cache')
      setMessages(cachedMessages)
      setGeminiAvailable(true)
      return
    }
    
    isGenerating = true
    setIsGeneratingNew(true)
    
    try {
      console.log('🤖 Solicitando novas mensagens do Gemini AI...')
      
      const response = await fetch('/api/gemini/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: `Você é um assistente do site Orkut Retrô. Gere 8-10 mensagens curtas e animadoras para um letreiro que percorre a tela horizontalmente.

CONTEXTO:
- Estamos desenvolvendo uma nova versão do Orkut com recursos modernos
- O site ainda está em construção e desenvolvimento
- Queremos acalmar os usuários sobre eventuais instabilidades
- Promover as funcionalidades do site de forma empolgante
- Mencionar que estamos trabalhando constantemente

ESTILO das mensagens:
- Curtas (máximo 80 caracteres)
- Use emojis adequados no início
- Tom animado e positivo
- Foque em tranquilizar sobre desenvolvimento
- Mencione funcionalidades legais do site
- Inclua agradecimentos aos usuários

EXEMPLOS do tom desejado:
"🚧 Site em construção mas já incrível - Obrigado pela paciência!"
"⚡ Melhorias chegando diariamente - Fique por dentro!"
"🎵 DJ Orky toca suas músicas favoritas da infância!"

Retorne apenas as mensagens, uma por linha, sem numeração.`
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.messages && Array.isArray(data.messages) && data.messages.length > 0) {
          // Atualizar cache global
          cachedMessages = data.messages
          lastUpdateTime = now
          
          setMessages(data.messages)
          setGeminiAvailable(true)
          setLastGenerationTime(now)
          console.log('✅ Mensagens do Gemini carregadas e cacheadas:', data.messages.length)
        } else {
          throw new Error('Resposta inválida do Gemini')
        }
      } else {
        throw new Error(`Erro HTTP: ${response.status}`)
      }
    } catch (error) {
      console.warn('❌ Gemini indisponível, usando mensagens de fallback:', error)
      setMessages(fallbackMessages)
      setGeminiAvailable(false)
    } finally {
      isGenerating = false
      setIsGeneratingNew(false)
    }
  }, [lastGenerationTime])

  // Limpar intervalos na desmontagem do componente
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (generationIntervalRef.current) {
        clearInterval(generationIntervalRef.current)
      }
    }
  }, [])

  // Gerar novas mensagens com Gemini a cada 10 minutos (apenas uma vez na montagem)
  useEffect(() => {
    let mounted = true
    
    // Função interna para evitar dependências no useEffect
    const fetchInitialMessages = async () => {
      if (!mounted) return
      await generateGeminiMessages()
    }
    
    // Tentar gerar mensagens na inicialização
    fetchInitialMessages()

    // Atualizar mensagens periodicamente
    generationIntervalRef.current = setInterval(() => {
      if (mounted) {
        generateGeminiMessages()
      }
    }, 10 * 60 * 1000) // 10 minutos

    return () => {
      mounted = false
      if (generationIntervalRef.current) {
        clearInterval(generationIntervalRef.current)
        generationIntervalRef.current = null
      }
    }
  }, []) // Dependências vazias para executar apenas uma vez

  return (
    <div className={`relative bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg py-3 px-4 shadow-md overflow-hidden ${className}`}>
      {/* Indicador de AI */}
      <div className="absolute top-1 right-2 flex items-center space-x-1 opacity-70">
        {geminiAvailable ? (
          <>
            <Sparkles className="h-3 w-3 text-yellow-300" />
            <span className="text-xs text-white font-medium">AI</span>
          </>
        ) : null}
        {isGeneratingNew && (
          <Loader2 className="h-3 w-3 text-white animate-spin" />
        )}
      </div>

      <div className="marquee-container">
        <div className="marquee-content">
          <div className="flex items-center space-x-8 text-white animate-marquee whitespace-nowrap">
            {messages.map((message, index) => (
              <span key={index}>{message}</span>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .marquee-container {
          overflow: hidden;
          width: 100%;
        }
        .marquee-content {
          display: inline-block;
          white-space: nowrap;
        }
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          animation: marquee 45s linear infinite;
        }
      `}</style>
    </div>
  )
}
