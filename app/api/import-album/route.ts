import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

interface AlbumPhoto {
  url: string
  title: string
  description?: string
  thumbnail?: string
  source: 'google-photos' | 'facebook' | 'instagram'
  original_id?: string
}

interface ImportResult {
  success: boolean
  album_id?: string
  photos_imported: number
  photos_failed: number
  photos: AlbumPhoto[]
  error?: string
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { album_url, album_title, category } = await request.json()

    if (!album_url) {
      return NextResponse.json({ error: 'URL do álbum é obrigatória' }, { status: 400 })
    }

    // Detectar o tipo de álbum
    const albumType = detectAlbumType(album_url)
    if (!albumType) {
      return NextResponse.json({ 
        error: 'URL não suportada. Use links do Google Photos, Facebook ou Instagram' 
      }, { status: 400 })
    }

    console.log(`🔍 Importando álbum ${albumType}: ${album_url}`)

    // Importar fotos baseado no tipo
    let photos: AlbumPhoto[] = []
    
    try {
      switch (albumType) {
        case 'google-photos':
          photos = await importGooglePhotosAlbum(album_url)
          break
        case 'facebook':
          photos = await importFacebookAlbum(album_url)
          break
        case 'instagram':
          photos = await importInstagramAlbum(album_url)
          break
        default:
          return NextResponse.json({ error: 'Tipo de álbum não suportado' }, { status: 400 })
      }
    } catch (error) {
      console.error(`Erro ao importar álbum ${albumType}:`, error)
      return NextResponse.json({ 
        error: `Erro ao importar álbum: ${error instanceof Error ? error.message : 'Erro desconhecido'}` 
      }, { status: 500 })
    }

    if (photos.length === 0) {
      return NextResponse.json({ 
        error: 'Nenhuma foto encontrada no álbum. Verifique se o álbum é público.' 
      }, { status: 404 })
    }

    // Buscar dados do perfil do usuário
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, username')
      .eq('id', user.id)
      .single()

    const userName = profile?.full_name || profile?.username || 'Usuário'

    // Criar álbum na tabela
    const albumData = {
      user_id: user.id,
      title: album_title || `Álbum ${albumType} - ${new Date().toLocaleDateString()}`,
      source_url: album_url,
      source_type: albumType,
      category: category || null,
      photos_count: photos.length,
      is_public: true,
      created_at: new Date().toISOString()
    }

    const { data: album, error: albumError } = await supabase
      .from('imported_albums')
      .insert(albumData)
      .select('*')
      .single()

    if (albumError) {
      console.error('Erro ao criar álbum:', albumError)
      return NextResponse.json({ error: 'Erro ao salvar álbum' }, { status: 500 })
    }

    // Salvar fotos na tabela de links
    let photosImported = 0
    let photosFailed = 0
    
    for (const photo of photos.slice(0, 50)) { // Limitar a 50 fotos por álbum
      try {
        const photoData = {
          user_id: user.id,
          album_id: album.id,
          url: photo.url,
          title: photo.title,
          description: photo.description,
          category: category || null,
          source_type: albumType,
          original_id: photo.original_id,
          is_public: true,
          created_at: new Date().toISOString()
        }

        const { error: photoError } = await supabase
          .from('google_photos_links')
          .insert(photoData)

        if (photoError) {
          console.error('Erro ao salvar foto:', photoError)
          photosFailed++
        } else {
          photosImported++
        }
      } catch (error) {
        console.error('Erro ao processar foto:', error)
        photosFailed++
      }
    }

    // Atualizar contador do álbum
    await supabase
      .from('imported_albums')
      .update({ photos_count: photosImported })
      .eq('id', album.id)

    const result: ImportResult = {
      success: true,
      album_id: album.id,
      photos_imported: photosImported,
      photos_failed: photosFailed,
      photos: photos.slice(0, 10) // Retornar apenas primeiras 10 para preview
    }

    console.log(`✅ Álbum importado: ${photosImported} fotos, ${photosFailed} falharam`)

    return NextResponse.json(result, { status: 201 })

  } catch (error) {
    console.error('Erro interno na importação:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

function detectAlbumType(url: string): 'google-photos' | 'facebook' | 'instagram' | null {
  try {
    const urlObj = new URL(url)
    
    if (urlObj.hostname.includes('photos.google.com') || urlObj.hostname.includes('photos.app.goo.gl')) {
      return 'google-photos'
    }
    
    if (urlObj.hostname.includes('facebook.com') || urlObj.hostname.includes('fb.com')) {
      return 'facebook'
    }
    
    if (urlObj.hostname.includes('instagram.com')) {
      return 'instagram'
    }
    
    return null
  } catch {
    return null
  }
}

async function importGooglePhotosAlbum(url: string): Promise<AlbumPhoto[]> {
  // Para álbuns do Google Photos, vamos usar uma abordagem diferente
  // já que não podemos acessar diretamente as fotos individuais
  
  console.log('🔍 Processando álbum do Google Photos:', url)
  
  // Por enquanto, vamos retornar o álbum como uma única entrada
  // O usuário pode então usar o sistema de drag & drop para fotos individuais
  const albumId = extractGooglePhotosAlbumId(url)
  
  return [{
    url: url,
    title: `Álbum Google Photos - ${albumId}`,
    description: 'Álbum completo do Google Photos',
    source: 'google-photos',
    original_id: albumId
  }]
}

async function importFacebookAlbum(url: string): Promise<AlbumPhoto[]> {
  console.log('🔍 Processando álbum do Facebook:', url)
  
  // Para Facebook, devido às restrições de API, vamos criar uma entrada placeholder
  // que direciona o usuário para o álbum original
  const userId = extractFacebookUserId(url)
  
  return [{
    url: url,
    title: `Álbum Facebook - ${userId}`,
    description: 'Álbum público do Facebook',
    source: 'facebook',
    original_id: userId
  }]
}

async function importInstagramAlbum(url: string): Promise<AlbumPhoto[]> {
  console.log('🔍 Processando perfil do Instagram:', url)
  
  // Para Instagram, similar ao Facebook
  const username = extractInstagramUsername(url)
  
  return [{
    url: url,
    title: `Perfil Instagram - @${username}`,
    description: 'Perfil público do Instagram',
    source: 'instagram',
    original_id: username
  }]
}

function extractGooglePhotosAlbumId(url: string): string {
  try {
    const match = url.match(/\/([A-Za-z0-9_-]+)$/)
    return match ? match[1] : 'album'
  } catch {
    return 'album'
  }
}

function extractFacebookUserId(url: string): string {
  try {
    const match = url.match(/facebook\.com\/([^\/]+)/)
    return match ? match[1] : 'user'
  } catch {
    return 'user'
  }
}

function extractInstagramUsername(url: string): string {
  try {
    const match = url.match(/instagram\.com\/([^\/]+)/)
    return match ? match[1] : 'user'
  } catch {
    return 'user'
  }
}
