import { NextRequest, NextResponse } from 'next/server'

// Configuração da API do Gemini
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyDaFdQ0tlAMSiSQU2u9Qwctbb2MfDTg3VQ'
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent'

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json()

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se a chave API está configurada
    if (!GEMINI_API_KEY) {
      console.warn('GEMINI_API_KEY não configurada, retornando mensagens de fallback')
      return NextResponse.json({
        messages: [
          "🚧 Site em desenvolvimento - Obrigado pela paciência!",
          "⚡ Melhorias chegando em breve - Aguarde novidades!",
          "🎵 DJ Orky está tocando suas músicas favoritas!",
          "💬 Comunidades crescendo a cada dia - Participe!",
          "🔄 Atualizações constantes em andamento",
          "🌟 Obrigado por fazer parte do novo Orkut!",
          "📱 Versão mobile chegando em breve",
          "✨ Funcionalidades incríveis a caminho!",
          "🛠️ Equipe trabalhando para melhorar sua experiência",
          "💻 Site em construção - Sugestões são bem-vindas!"
        ],
        source: 'fallback'
      })
    }

    // Fazer a chamada para o Gemini AI
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.9,
          topK: 1,
          topP: 1,
          maxOutputTokens: 2048,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      }),
    })

    if (!response.ok) {
      console.error('Erro na API do Gemini:', response.status, response.statusText)
      throw new Error(`Erro da API do Gemini: ${response.status}`)
    }

    const data = await response.json()
    
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('Nenhuma resposta gerada pelo Gemini')
    }

    const generatedText = data.candidates[0].content.parts[0].text
    
    // Processar o texto gerado para extrair as mensagens
    const messages = generatedText
      .split('\n')
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0 && !line.match(/^\d+\.?/)) // Remove linhas vazias e numeração
      .slice(0, 10) // Limita a 10 mensagens

    // Validar se temos mensagens válidas
    if (messages.length === 0) {
      throw new Error('Nenhuma mensagem válida foi gerada')
    }

    console.log(`✅ Gemini gerou ${messages.length} mensagens para o letreiro`)

    return NextResponse.json({
      messages,
      source: 'gemini',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Erro ao gerar mensagens com Gemini:', error)
    
    // Retornar mensagens de fallback em caso de erro
    return NextResponse.json({
      messages: [
        "🚧 Site em desenvolvimento - Obrigado pela paciência!",
        "⚡ Melhorias chegando em breve - Aguarde novidades!",
        "🎵 DJ Orky está tocando suas músicas favoritas!",
        "💬 Comunidades crescendo a cada dia - Participe!",
        "🔄 Atualizações constantes em andamento",
        "🌟 Obrigado por fazer parte do novo Orkut!",
        "📱 Versão mobile chegando em breve",
        "✨ Funcionalidades incríveis a caminho!",
        "🛠️ Equipe trabalhando para melhorar sua experiência",
        "💻 Site em construção - Sugestões são bem-vindas!"
      ],
      source: 'fallback',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    })
  }
}

// Configurar CORS se necessário
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
