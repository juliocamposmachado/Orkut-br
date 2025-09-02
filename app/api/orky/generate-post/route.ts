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
    console.log('🤖 Orky gerando novo post musical...')

    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY não configurada' },
        { status: 500 }
      )
    }

    // Gerar pergunta musical via Gemini AI
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Você é o Orky, um bot musical inteligente do Orkut Retrô. Gere UMA pergunta envolvente sobre música para postar no feed.

CONTEXTO:
- Você é um assistente musical nostálgico e divertido
- Foca em música dos anos 80, 90, 2000 e atual
- Quer gerar engajamento e nostalgia
- Público brasileiro que cresceu com Orkut
- Inclui rock nacional, pop, sertanejo, funk, etc.

ESTILO da pergunta:
- Use emojis musicais (🎵🎸🎤🎧🎶)
- Tom casual e nostálgico  
- Máximo 280 caracteres
- Faça uma pergunta que gere debate/discussão
- Inclua exemplos ou contexto
- Seja específico e interessante

TEMAS POSSÍVEIS:
- Bandas que marcaram época
- Músicas de festa/balada
- Rock nacional vs internacional
- Primeiras músicas que amaram
- Músicas que tocavam no rádio
- Bandas que separaram e sentimos saudade
- Covers melhores que originais
- Músicas de desenho/novela
- Festivais que gostariam de ir
- Músicas para diferentes momentos

EXEMPLOS:
"🎸 Qual banda nacional dos anos 2000 vocês acham que deveria voltar? Eu voto no Charlie Brown Jr.! E vocês?"
"🎵 Confessem: qual música vocês fingiam que sabiam cantar mas só faziam lálálá? 😅🎤"

Gere apenas UMA pergunta criativa e envolvente, sem introdução.`
          }]
        }],
        generationConfig: {
          temperature: 0.9,
          topK: 1,
          topP: 1,
          maxOutputTokens: 1024,
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

    const generatedQuestion = data.candidates[0].content.parts[0].text.trim()
    
    console.log('💭 Pergunta gerada:', generatedQuestion)

    // Verificar se Supabase está configurado
    if (!supabase) {
      console.log('⚠️ Supabase não configurado, retornando apenas pergunta gerada')
      return NextResponse.json({
        success: true,
        post: {
          content: generatedQuestion,
          author: { display_name: 'Orky 🤖', username: 'orky_bot' }
        },
        message: 'Post musical gerado pelo Orky (sem salvar no banco)!'
      })
    }

    // Salvar post no banco de dados
    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert([{
        author: ORKY_BOT_ID,
        content: generatedQuestion,
        created_at: new Date().toISOString()
      }])
      .select(`
        *,
        profiles:author (
          id,
          display_name,
          photo_url,
          username
        )
      `)
      .single()

    if (postError) {
      console.error('❌ Erro ao salvar post:', postError)
      throw postError
    }

    console.log('✅ Post do Orky criado com sucesso!')

    return NextResponse.json({
      success: true,
      post: post,
      message: 'Post musical gerado pelo Orky!'
    })

  } catch (error) {
    console.error('❌ Erro ao gerar post do Orky:', error)
    
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      success: false
    }, { status: 500 })
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
