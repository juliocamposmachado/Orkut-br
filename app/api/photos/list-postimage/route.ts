import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

// Lista fotos salvas do PostImage
// Query params suportados:
// - user_id: uuid (opcional, se não informado usa o usuário logado)
// - limit: number (default: 20)
// - offset: number (default: 0)
// - tags: string (separado por vírgula)
// - search: string (busca no título, descrição, filename)
// - public_only: boolean (true para ver apenas públicas)

export async function GET(req: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { searchParams } = new URL(req.url)

  try {
    // Verificar usuário autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ success: false, message: 'Não autenticado' }, { status: 401 })
    }

    // Parâmetros de consulta
    const targetUserId = searchParams.get('user_id') || user.id
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100) // Max 100
    const offset = parseInt(searchParams.get('offset') || '0')
    const tagsParam = searchParams.get('tags')
    const searchText = searchParams.get('search')
    const publicOnly = searchParams.get('public_only') === 'true'

    // Construir query base
    let query = supabase
      .from('postimage_photos')
      .select(`
        id,
        title,
        description,
        filename,
        direct_link,
        thumbnail_link,
        postimage_page_url,
        markdown_link,
        html_link,
        bbcode_link,
        reddit_markdown,
        upload_date,
        original_size,
        tags,
        is_public,
        is_profile_photo,
        sort_order,
        created_at
      `)

    // Filtro por usuário
    if (targetUserId) {
      query = query.eq('user_id', targetUserId)
    }

    // Filtro público apenas
    if (publicOnly) {
      query = query.eq('is_public', true)
    }

    // Filtro por tags
    if (tagsParam) {
      const tags = tagsParam.split(',').map(tag => tag.trim()).filter(Boolean)
      if (tags.length > 0) {
        query = query.overlaps('tags', tags)
      }
    }

    // Filtro por busca de texto
    if (searchText) {
      query = query.or(`title.ilike.%${searchText}%,description.ilike.%${searchText}%,filename.ilike.%${searchText}%`)
    }

    // Ordenação e paginação
    query = query
      .order('upload_date', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: photos, error, count } = await query

    if (error) {
      console.error('Erro ao buscar fotos:', error)
      return NextResponse.json({ success: false, message: 'Erro ao buscar fotos', error }, { status: 500 })
    }

    // Buscar estatísticas do usuário
    const { data: stats } = await supabase
      .from('user_photo_stats')
      .select('*')
      .eq('user_id', targetUserId)
      .single()

    return NextResponse.json({
      success: true,
      photos: photos || [],
      pagination: {
        limit,
        offset,
        total: count || photos?.length || 0
      },
      stats: stats || {
        total_photos: 0,
        public_photos: 0,
        private_photos: 0,
        profile_photos: 0
      }
    })

  } catch (error: any) {
    console.error('Erro no endpoint list-postimage:', error)
    return NextResponse.json({ success: false, message: error?.message || 'Erro interno' }, { status: 500 })
  }
}

// Atualizar uma foto específica
export async function PATCH(req: Request) {
  const supabase = createRouteHandlerClient({ cookies })

  try {
    const body = await req.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ success: false, message: 'ID da foto é obrigatório' }, { status: 400 })
    }

    // Verificar usuário autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ success: false, message: 'Não autenticado' }, { status: 401 })
    }

    // Campos permitidos para atualização
    const allowedFields = [
      'title', 'description', 'tags', 'is_public', 
      'is_profile_photo', 'sort_order'
    ]

    const validUpdates: any = {}
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        validUpdates[key] = value
      }
    }

    if (Object.keys(validUpdates).length === 0) {
      return NextResponse.json({ success: false, message: 'Nenhum campo válido para atualização' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('postimage_photos')
      .update(validUpdates)
      .eq('id', id)
      .eq('user_id', user.id) // Só pode atualizar suas próprias fotos
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar foto:', error)
      return NextResponse.json({ success: false, message: 'Erro ao atualizar foto', error }, { status: 500 })
    }

    return NextResponse.json({ success: true, photo: data })

  } catch (error: any) {
    console.error('Erro no endpoint PATCH list-postimage:', error)
    return NextResponse.json({ success: false, message: error?.message || 'Erro interno' }, { status: 500 })
  }
}

// Deletar uma foto
export async function DELETE(req: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  try {
    if (!id) {
      return NextResponse.json({ success: false, message: 'ID da foto é obrigatório' }, { status: 400 })
    }

    // Verificar usuário autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ success: false, message: 'Não autenticado' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('postimage_photos')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id) // Só pode deletar suas próprias fotos
      .select()
      .single()

    if (error) {
      console.error('Erro ao deletar foto:', error)
      return NextResponse.json({ success: false, message: 'Erro ao deletar foto', error }, { status: 500 })
    }

    return NextResponse.json({ success: true, deleted_photo: data })

  } catch (error: any) {
    console.error('Erro no endpoint DELETE list-postimage:', error)
    return NextResponse.json({ success: false, message: error?.message || 'Erro interno' }, { status: 500 })
  }
}
