import { NextRequest, NextResponse } from 'next/server'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent'

interface SystemContext {
  systemStatus: {
    database: string
    webrtc: string
    api: string
    ai: string
  }
  diagnostics: Array<{
    name: string
    status: string
    message: string
    details?: string
  }>
  timestamp: string
  url: string
  userAgent: string
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export async function POST(request: NextRequest) {
  try {
    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY não configurada' },
        { status: 500 }
      )
    }

    const { message, context, chatHistory } = await request.json() as {
      message: string
      context: SystemContext
      chatHistory: ChatMessage[]
    }

    if (!message?.trim()) {
      return NextResponse.json(
        { error: 'Mensagem é obrigatória' },
        { status: 400 }
      )
    }

    // Preparar o contexto do sistema para a IA
    const systemPrompt = `
Você é um assistente especializado em análise de logs e diagnósticos de sistema para o projeto Orkut Retrô.

CONTEXTO ATUAL DO SISTEMA:
- Status do Banco: ${context.systemStatus.database}
- Status WebRTC: ${context.systemStatus.webrtc}
- Status da API: ${context.systemStatus.api}
- Status da IA: ${context.systemStatus.ai}
- Timestamp: ${context.timestamp}
- URL: ${context.url}

DIAGNÓSTICOS RECENTES:
${context.diagnostics.map(d => 
  `- ${d.name}: ${d.status.toUpperCase()} - ${d.message}${d.details ? ` (${d.details})` : ''}`
).join('\n')}

HISTÓRICO DE CONVERSA:
${chatHistory.slice(-5).map(msg => 
  `${msg.role === 'user' ? 'Usuário' : 'Assistente'}: ${msg.content}`
).join('\n')}

INSTRUÇÕES:
1. Responda em português brasileiro
2. Analise o contexto do sistema e diagnósticos quando relevante
3. Seja objetivo e técnico, mas acessível
4. Sugira soluções quando identificar problemas
5. Se não houver dados suficientes, seja honesto sobre limitações
6. Foque em logs, erros, status do sistema e diagnósticos
7. Use emojis para facilitar a leitura quando apropriado

PERGUNTA DO USUÁRIO: ${message}
`

    const geminiPayload = {
      contents: [
        {
          parts: [
            {
              text: systemPrompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.9,
        maxOutputTokens: 1000,
      },
    }

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(geminiPayload),
    })

    if (!response.ok) {
      console.error('Erro na API do Gemini:', response.status, response.statusText)
      
      // Fallback response baseada no contexto
      let fallbackResponse = "🤖 Sistema de IA temporariamente indisponível. "
      
      // Análise básica baseada no contexto
      const offlineServices = []
      if (context.systemStatus.database === 'offline') offlineServices.push('Banco de Dados')
      if (context.systemStatus.api === 'offline') offlineServices.push('API')
      if (context.systemStatus.webrtc === 'not-supported') offlineServices.push('WebRTC')
      
      if (offlineServices.length > 0) {
        fallbackResponse += `\n\n⚠️ Serviços com problemas detectados: ${offlineServices.join(', ')}`
      }
      
      const errorDiagnostics = context.diagnostics.filter(d => d.status === 'error')
      if (errorDiagnostics.length > 0) {
        fallbackResponse += `\n\n🔍 Erros encontrados:\n${errorDiagnostics.map(d => `• ${d.name}: ${d.message}`).join('\n')}`
      }
      
      if (offlineServices.length === 0 && errorDiagnostics.length === 0) {
        fallbackResponse += "\n\n✅ Sistema aparenta estar funcionando normalmente!"
      }
      
      return NextResponse.json({ 
        response: fallbackResponse,
        fallback: true 
      })
    }

    const data = await response.json()
    
    if (!data.candidates || data.candidates.length === 0) {
      return NextResponse.json(
        { response: "🤖 Não consegui processar sua pergunta. Tente reformular ou seja mais específico sobre logs e sistema." },
        { status: 200 }
      )
    }

    const aiResponse = data.candidates[0].content.parts[0].text

    return NextResponse.json({ 
      response: aiResponse,
      timestamp: new Date().toISOString(),
      context: {
        systemStatus: context.systemStatus,
        diagnosticsCount: context.diagnostics.length
      }
    })

  } catch (error) {
    console.error('Erro no chat de logs:', error)
    
    return NextResponse.json({
      response: "🚨 Erro interno do servidor. Verifique os logs do console e tente novamente.",
      error: true
    }, { status: 500 })
  }
}

// Método OPTIONS para CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
