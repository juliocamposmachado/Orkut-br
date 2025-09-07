import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

interface GooglePhotoLink {
  id?: string
  user_id: string
  url: string
  title: string
  description?: string
  category?: string
  created_at?: string
  is_public?: boolean
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || user.id
    const isPublic = searchParams.get('public') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('google_photos_links')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Se buscar por usuário específico ou só públicas
    if (isPublic) {
      query = query.eq('is_public', true)
    } else {
      query = query.eq('user_id', userId)
    }

    const { data: links, error } = await query

    if (error) {
      console.error('Erro ao buscar links do Google Photos:', error)
      return NextResponse.json({ error: 'Erro ao buscar links' }, { status: 500 })
    }

    return NextResponse.json({ 
      links: links || [],
      total: links?.length || 0,
      offset,
      limit
    })

  } catch (error) {
    console.error('Erro interno na API de links:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { url, title, description, category, isPublic = true } = body

    // Validar URL
    if (!url || !isValidGooglePhotosUrl(url)) {
      return NextResponse.json({ error: 'URL do Google Photos inválida' }, { status: 400 })
    }

    // Verificar se o link já existe para este usuário
    const { data: existingLink } = await supabase
      .from('google_photos_links')
      .select('id')
      .eq('user_id', user.id)
      .eq('url', url)
      .single()

    if (existingLink) {
      return NextResponse.json({ error: 'Este link já foi adicionado' }, { status: 409 })
    }

    // Buscar dados do perfil do usuário
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, username')
      .eq('id', user.id)
      .single()

    const linkData: GooglePhotoLink = {
      user_id: user.id,
      url,
      title: title || extractPhotoTitle(url),
      description,
      category,
      is_public: isPublic,
      created_at: new Date().toISOString()
    }

    const { data: newLink, error } = await supabase
      .from('google_photos_links')
      .insert(linkData)
      .select('*')
      .single()

    if (error) {
      console.error('Erro ao salvar link do Google Photos:', error)
      return NextResponse.json({ error: 'Erro ao salvar link' }, { status: 500 })
    }

    // Adicionar dados do usuário ao link retornado
    const enrichedLink = {
      ...newLink,
      user_name: profile?.full_name || profile?.username || 'Usuário',
      user_username: profile?.username
    }

    return NextResponse.json({ 
      link: enrichedLink,
      message: 'Link adicionado com sucesso!'
    }, { status: 201 })

  } catch (error) {
    console.error('Erro interno na API de links:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const linkId = searchParams.get('id')

    if (!linkId) {
      return NextResponse.json({ error: 'ID do link é obrigatório' }, { status: 400 })
    }

    // Verificar se o link pertence ao usuário
    const { data: link, error: fetchError } = await supabase
      .from('google_photos_links')
      .select('user_id')
      .eq('id', linkId)
      .single()

    if (fetchError || !link || link.user_id !== user.id) {
      return NextResponse.json({ error: 'Link não encontrado ou não autorizado' }, { status: 404 })
    }

    const { error } = await supabase
      .from('google_photos_links')
      .delete()
      .eq('id', linkId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Erro ao deletar link:', error)
      return NextResponse.json({ error: 'Erro ao deletar link' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Link removido com sucesso!' })

  } catch (error) {
    console.error('Erro interno na API de links:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// Funções auxiliares
function isValidGooglePhotosUrl(url: string): boolean {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname === 'photos.google.com' || 
           urlObj.hostname.includes('photos.app.goo.gl') ||
           urlObj.hostname.includes('lh3.googleusercontent.com') ||
           urlObj.hostname.includes('drive.google.com')
  } catch {
    return false
  }
}

function extractPhotoTitle(url: string): string {
  try {
    const urlObj = new URL(url)
    const pathParts = urlObj.pathname.split('/')
    const shareId = pathParts.find(part => part.startsWith('AF1Q'))
    
    if (shareId) {
      return `Foto ${shareId.substring(0, 8)}...`
    }
    
    // Para URLs do Google Drive
    if (url.includes('drive.google.com')) {
      const fileId = pathParts.find(part => part.length > 20)
      return fileId ? `Drive ${fileId.substring(0, 8)}...` : 'Foto do Google Drive'
    }
    
    return 'Foto do Google Photos'
  } catch {
    return 'Foto do Google Photos'
  }
}
