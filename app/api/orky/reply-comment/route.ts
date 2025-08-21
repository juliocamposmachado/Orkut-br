import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Só criar cliente se as variáveis estiverem configuradas
const supabase = (supabaseUrl && supabaseServiceKey && 
                  supabaseUrl.startsWith('https://') && 
                  !supabaseUrl.includes('placeholder') &&
                  !supabaseUrl.includes('your_')) 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null

// Configuração da API do Gemini
const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent'

const ORKY_BOT_ID = 'orky-bot-2024'

export async function POST(request: NextRequest) {
  try {
    const { commentContent, postContent, userDisplayName } = await request.json()

    if (!commentContent || !postContent) {
      return NextResponse.json(
        { error: 'commentContent e postContent são obrigatórios' },
        { status: 400 }
      )
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY não configurada' },
        { status: 500 }
      )
    }

    console.log('🤖 Orky gerando resposta para comentário...')
    console.log('💬 Comentário:', commentContent)
    console.log('📝 Post original:', postContent)

    // Gerar resposta via Gemini AI
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Você é o Orky, um bot musical inteligente e amigável do Orkut Retrô. Um usuário comentou em seu post sobre música.

CONTEXTO:
- Você é divertido, nostálgico e conhece muito de música
- Foca em música brasileira e internacional (80s, 90s, 2000s, atual)
- Quer manter conversas musicais engajantes
- Tom casual e amigável, como um amigo falando sobre música

SEU POST ORIGINAL:
"${postContent}"

COMENTÁRIO DO USUÁRIO (${userDisplayName || 'Usuário'}):
"${commentContent}"

INSTRUÇÕES PARA SUA RESPOSTA:
- Responda de forma natural e envolvente
- Use emojis musicais apropriados (🎵🎸🎤🎧🎶)
- Máximo 200 caracteres
- Seja específico sobre música quando possível
- Faça perguntas de follow-up para manter a conversa
- Se o usuário mencionou uma banda/música, comente sobre ela
- Mantenha o tom nostálgico e divertido
- Agradeça pela participação

EXEMPLOS DE RESPOSTAS:
- "🎸 Ótima escolha! [Banda X] era demais mesmo! Qual música deles mais te marca? Eu amo [música específica]!"
- "🎵 Concordo totalmente! E que tal [sugestão relacionada]? Conhece?"
- "😅 Hahaha, todos fazíamos isso! Qual era a parte que você mais 'inventava' a letra?"

Gere UMA resposta natural e engajante para o comentário.`
          }]
        }],
        generationConfig: {
          temperature: 0.8,
          topK: 1,
          topP: 1,
          maxOutputTokens: 512,
        }
      }),
    })

    if (!response.ok) {
      throw new Error(`Erro da API do Gemini: ${response.status}`)
    }

    const data = await response.json()
    
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('Nenhuma resposta gerada pelo Gemini')
    }

    const orkyReply = data.candidates[0].content.parts[0].text.trim()
    
    console.log('💭 Resposta do Orky:', orkyReply)

    return NextResponse.json({
      success: true,
      reply: orkyReply,
      message: 'Resposta gerada pelo Orky!'
    })

  } catch (error) {
    console.error('❌ Erro ao gerar resposta do Orky:', error)
    
    // Resposta de fallback se o Gemini falhar
    const fallbackReplies = [
      "🎵 Que legal! Obrigado por compartilhar! Conta mais sobre seus gostos musicais!",
      "🎸 Show! Adoro quando vocês participam! Qual mais música você curte desse estilo?",
      "🎤 Massa! Continue participando das discussões musicais aqui!",
      "🎧 Ótimo gosto musical! Vamos continuar batendo papo sobre música!",
      "🎶 Valeu pela participação! Música é vida, não é mesmo?"
    ]
    
    const randomReply = fallbackReplies[Math.floor(Math.random() * fallbackReplies.length)]
    
    return NextResponse.json({
      success: true,
      reply: randomReply,
      message: 'Resposta de fallback do Orky',
      fallback: true
    })
  }
}

// Configurar CORS se necessário
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
