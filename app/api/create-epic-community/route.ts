import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // Verificar se já existe a comunidade
    const { data: existingCommunity } = await supabase
      .from('communities')
      .select('*')
      .ilike('name', '%NÃO É CULPA NOSSA%')
      .single()

    if (existingCommunity) {
      return NextResponse.json({
        success: true,
        message: 'Comunidade já existe!',
        community: existingCommunity
      })
    }

    // Criar a comunidade épica
    const { data: community, error: communityError } = await supabase
      .from('communities')
      .insert({
        name: 'NÃO É CULPA NOSSA! 🤷‍♂️',
        description: '🎭 A primeira comunidade oficial do Novo Orkut! Aqui documentamos bugs, fails épicos e culpamos quem realmente tem culpa (spoiler: nunca somos nós). Venha compartilhar suas aventuras de debugging e descobrir que o Google Cloud Console é mais confuso que labirinto! 😅',
        category: 'Tecnologia',
        photo_url: 'https://images.pexels.com/photos/4164418/pexels-photo-4164418.jpeg',
        members_count: 1,
        owner: null // Sistema
      })
      .select()
      .single()

    if (communityError) {
      throw communityError
    }

    // Criar post épico (se tiver sistema de posts)
    try {
      // Tentar criar um post inicial usando a API de posts existente
      const epicPost = {
        content: `🎭 A ÉPICA SAGA: Caça ao OAuth Consent Screen do Google (3+ HORAS DE TORTURA)

🕵️‍♂️ A HISTÓRIA QUE VOCÊS PRECISAM SABER!

Galera, bem-vindos à **primeira comunidade oficial** do Novo Orkut! 🎉

🤯 O QUE ACONTECEU:
Passamos **3+ HORAS** procurando uma configuração no Google Cloud Console para mudar o nome estranho que aparece na tela de login (woyyikaztjrhqzgvbhmn.supabase.co).

🔍 O QUE TENTAMOS:
❌ 47 caminhos diferentes no Google Console
❌ URLs diretas, indiretas e telepáticas  
❌ Cada menu, submenu e sub-submenu
❌ Claude IA teve crise existencial
❌ Tentativas desesperadas de trocar ordem de domínios
❌ Invocação de entidades superiores

💡 SOLUÇÃO ENCONTRADA:
**DISCLAIMER SARCÁSTICO** na tela de login explicando que É CULPA DO GOOGLE! 😂

🆘 PEDIMOS SUA AJUDA:
Se ALGUÉM souber onde diabos fica a configuração para mudar o nome na tela de consentimento OAuth do Google, **PELO AMOR DE TODOS OS SANTOS**, compartilhe aqui! 🙏

🎯 MORAL DA HISTÓRIA:
Às vezes a melhor solução é aceitar o problema e explicar com humor! 

#GoogleCloudConsole #OAuthMysterio #NaoECulpaNossa #TrioMarciano

---
💜 Primeira comunidade criada em: ${new Date().toLocaleString('pt-BR')}`,
        author: 'system',
        author_name: 'TRIO MARCIANO 🚀',
        author_photo: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg',
        visibility: 'public',
        is_dj_post: false
      }

      // Fazer requisição para nossa própria API de posts
      const postResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/posts-db`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(epicPost)
      })

      if (postResponse.ok) {
        console.log('✅ Post épico criado com sucesso!')
      }
    } catch (postError) {
      console.warn('⚠️ Erro ao criar post épico:', postError)
      // Não falhar a criação da comunidade por causa do post
    }

    return NextResponse.json({
      success: true,
      message: 'Comunidade épica criada com sucesso!',
      community,
      epic: true
    })

  } catch (error) {
    console.error('❌ Erro ao criar comunidade épica:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro ao criar comunidade épica',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: '🎭 Endpoint para criar a comunidade épica "NÃO É CULPA NOSSA"',
    instructions: 'Use POST para criar a comunidade',
    epic: true
  })
}
