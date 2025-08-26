import { NextRequest, NextResponse } from 'next/server'

// Configuração do Gemini AI para análise musical
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent"
const GEMINI_API_KEY = process.env.GEMINI_API_KEY_MUSIC || 'AIzaSyDBzVSol7wdgCBy9MiekzTmgXhQIO959c4' // Nova chave para análise musical

export async function POST(request: NextRequest) {
  try {
    // Verificar se a chave API está configurada
    if (!GEMINI_API_KEY) {
      console.warn('⚠️ GEMINI_API_KEY_MUSIC não configurada - usando fallback')
      return NextResponse.json({
        success: false,
        error: 'API Key não configurada',
        fallback: true
      }, { status: 500 })
    }

    const { artist, song } = await request.json()

    if (!artist || !song) {
      return NextResponse.json({
        success: false,
        error: 'Artista e música são obrigatórios'
      }, { status: 400 })
    }

    // Prompt inteligente para o Gemini
    const prompt = `
Você é o DJ Orky da Rádio Tatuapé FM! 🎵📻

Crie um post informativo e interessante sobre a música "${song}" de "${artist}" que está tocando agora na rádio.

INCLUIR:
🎤 Informações sobre o(s) vocalista(s)
🎸 Curiosidades sobre a banda/artista
📅 Ano de lançamento e contexto histórico
🏆 Conquistas e premiações importantes
💡 Fatos interessantes ou histórias por trás da música
🎵 Estilo musical e influências

FORMATO:
- Use emojis para deixar mais atrativo
- Seja informativo mas descontraído
- Máximo 280 caracteres
- SEMPRE termine convidando para ouvir na "Rádio Tatuapé FM" 📻

EXEMPLO DE TOM:
"🎵 Sabia que essa música foi gravada em apenas uma take? O vocalista [Nome] conseguiu essa performance incrível na primeira tentativa! 🎤✨ Ouça mais na Rádio Tatuapé FM! 📻"

Agora crie para "${song}" de "${artist}":
`

    // Fazer requisição para o Gemini
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
          temperature: 0.8,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 300,
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
      })
    })

    if (!response.ok) {
      console.error('❌ Erro na API do Gemini:', response.status, response.statusText)
      return NextResponse.json({
        success: false,
        error: 'Erro na API do Gemini',
        fallback: true
      }, { status: response.status })
    }

    const data = await response.json()
    
    // Extrair o texto da resposta
    const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''

    if (!generatedText) {
      console.error('❌ Resposta vazia do Gemini')
      return NextResponse.json({
        success: false,
        error: 'Resposta vazia do Gemini',
        fallback: true
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      content: generatedText.trim(),
      artist,
      song,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Erro na análise musical:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      fallback: true
    }, { status: 500 })
  }
}

// Método GET para testar a API
export async function GET() {
  return NextResponse.json({
    message: '🎵 API de Análise Musical - DJ Orky',
    status: 'ativo',
    endpoint: '/api/gemini/music-info',
    method: 'POST',
    body: {
      artist: 'Nome do Artista',
      song: 'Nome da Música'
    }
  })
}
