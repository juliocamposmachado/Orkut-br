import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

// Salva os links do PostImage no Supabase
// Espera receber no body:
// {
//   filename: string,
//   links: {
//     direct?: string,
//     image?: string,
//     markdown?: string,
//     reddit_markdown?: string,
//     forum?: string,
//     html?: string,
//     page_url?: string
//   },
//   title?: string,
//   description?: string,
//   options?: { resize?: string; expire?: string },
//   size?: number,
//   tags?: string[],
//   is_public?: boolean
// }

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies })

  try {
    const body = await req.json()

    // Verificar usuário autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ success: false, message: 'Não autenticado' }, { status: 401 })
    }

    // Validar payload mínimo
    if (!body?.filename || !body?.links?.direct) {
      return NextResponse.json({ success: false, message: 'Payload inválido: filename e links.direct são obrigatórios' }, { status: 400 })
    }

    // Preparar dados para inserção
    const payload = {
      user_id: user.id,
      title: body.title || null,
      description: body.description || null,
      filename: body.filename,
      direct_link: body.links.direct || body.links.image,
      thumbnail_link: body.links.thumbnail || null,
      postimage_page_url: body.links.page_url || null,
      markdown_link: body.links.markdown || null,
      reddit_markdown: body.links.reddit_markdown || null,
      bbcode_link: body.links.forum || null,
      html_link: body.links.html || null,
      original_size: body.size || null,
      postimage_options: body.options ? JSON.parse(JSON.stringify(body.options)) : null,
      postimage_response: body.links ? JSON.parse(JSON.stringify(body.links)) : null,
      tags: body.tags || [],
      is_public: typeof body.is_public === 'boolean' ? body.is_public : true
    }

    const { data, error } = await supabase.from('postimage_photos').insert(payload).select('*').single()

    if (error) {
      console.error('Erro ao inserir no banco:', error)
      return NextResponse.json({ success: false, message: 'Erro ao salvar no banco de dados', error }, { status: 500 })
    }

    return NextResponse.json({ success: true, photo: data })
  } catch (error: any) {
    console.error('Erro no endpoint save-postimage:', error)
    return NextResponse.json({ success: false, message: error?.message || 'Erro interno' }, { status: 500 })
  }
}

