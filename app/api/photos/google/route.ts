import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { GooglePhotosService, GooglePhotosUtils } from '@/lib/googlePhotos'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    console.log('📤 [GOOGLE PHOTOS] Iniciando upload...')
    
    // Verificar autenticação
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('photo') as File
    const description = formData.get('description') as string || ''

    if (!file) {
      return NextResponse.json(
        { error: 'Nenhuma foto foi enviada' }, 
        { status: 400 }
      )
    }

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Arquivo deve ser uma imagem' }, 
        { status: 400 }
      )
    }

    // Validar tamanho (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Arquivo muito grande. Máximo 10MB.' }, 
        { status: 400 }
      )
    }

    console.log('📁 Arquivo válido:', {
      name: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
      type: file.type
    })

    // Verificar se usuário tem provider_token do Google
    const providerToken = session.provider_token
    if (!providerToken) {
      console.log('❌ Provider token não encontrado na sessão')
      return NextResponse.json({ 
        error: 'Token do Google não disponível. Faça login com Google.',
        needsReauth: true 
      }, { status: 401 })
    }

    console.log('👤 Usuário autenticado:', session.user.email)

    // Validar token antes de usar
    const isValidToken = await GooglePhotosUtils.validateToken(providerToken)
    if (!isValidToken) {
      console.log('❌ Token do Google inválido ou sem permissões necessárias')
      return NextResponse.json({ 
        error: 'Token do Google inválido. Faça login novamente.',
        needsReauth: true 
      }, { status: 401 })
    }

    // Inicializar serviço Google Photos
    const googlePhotosService = new GooglePhotosService({
      accessToken: providerToken
    })

    // Buscar ou criar álbum do Orkut
    const orkutAlbum = await googlePhotosService.getOrCreateOrkutAlbum()
    if (!orkutAlbum) {
      console.error('❌ Erro ao obter/criar álbum do Orkut')
      return NextResponse.json(
        { error: 'Erro ao preparar álbum no Google Photos' }, 
        { status: 500 }
      )
    }

    console.log('📸 Álbum do Orkut:', orkutAlbum.title)

    // Fazer upload da foto
    const uploadResult = await googlePhotosService.uploadPhoto(
      file,
      orkutAlbum.id,
      description || `Foto enviada via Orkut por ${session.user.email}`
    )

    if (!uploadResult.success || !uploadResult.mediaItem) {
      console.error('❌ Erro no upload:', uploadResult.error)
      return NextResponse.json(
        { error: uploadResult.error || 'Erro no upload para Google Photos' }, 
        { status: 500 }
      )
    }

    const mediaItem = uploadResult.mediaItem
    console.log('✅ Upload concluído:', mediaItem.filename)

    // Salvar referência no banco de dados local (opcional)
    try {
      const { error: dbError } = await supabase
        .from('user_photos')
        .insert({
          profile_id: session.user.id,
          google_photos_id: mediaItem.id,
          google_photos_url: mediaItem.baseUrl,
          filename: mediaItem.filename,
          mime_type: mediaItem.mimeType,
          width: parseInt(mediaItem.mediaMetadata.width),
          height: parseInt(mediaItem.mediaMetadata.height),
          created_at: mediaItem.mediaMetadata.creationTime,
          album_id: orkutAlbum.id,
          description: description || null
        })

      if (dbError) {
        console.error('⚠️ Erro ao salvar referência no banco:', dbError)
        // Não falhar o upload por erro no banco, foto já está no Google Photos
      } else {
        console.log('💾 Referência salva no banco de dados')
      }
    } catch (dbError) {
      console.error('⚠️ Erro ao salvar no banco:', dbError)
    }

    // Retornar dados da foto enviada
    return NextResponse.json({
      success: true,
      photo: {
        id: mediaItem.id,
        filename: mediaItem.filename,
        url: GooglePhotosUtils.getOptimizedUrl(mediaItem.baseUrl, 800, 600),
        thumbnailUrl: GooglePhotosUtils.getThumbnailUrl(mediaItem.baseUrl, 300, 300),
        width: parseInt(mediaItem.mediaMetadata.width),
        height: parseInt(mediaItem.mediaMetadata.height),
        mimeType: mediaItem.mimeType,
        createdAt: mediaItem.mediaMetadata.creationTime,
        albumId: orkutAlbum.id,
        albumTitle: orkutAlbum.title
      }
    })

  } catch (error) {
    console.error('❌ Erro geral no upload:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' }, 
      { status: 500 }
    )
  }
}

/**
 * GET - Buscar fotos do Google Photos do usuário
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Verificar autenticação
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar se usuário tem provider_token do Google
    const providerToken = session.provider_token
    if (!providerToken) {
      console.log('❌ Provider token não encontrado na sessão')
      return NextResponse.json({ 
        error: 'Token do Google não disponível. Faça login com Google.',
        needsReauth: true 
      }, { status: 401 })
    }

    // Validar token antes de usar
    const isValidToken = await GooglePhotosUtils.validateToken(providerToken)
    if (!isValidToken) {
      console.log('❌ Token do Google inválido ou sem permissões necessárias')
      return NextResponse.json({ 
        error: 'Token do Google inválido. Faça login novamente.',
        needsReauth: true 
      }, { status: 401 })
    }

    // Criar instância do Google Photos Service
    const googlePhotos = new GooglePhotosService({
      accessToken: providerToken
    })

    console.log('📸 Buscando fotos do Google Photos para usuário:', session.user.id)

    // Buscar fotos do álbum do Orkut
    const mediaItems = await googlePhotos.getOrkutPhotos(20)

    // Transformar para formato do nosso sistema
    const photos = mediaItems.map(item => ({
      id: item.id,
      filename: item.filename,
      url: GooglePhotosUtils.getOptimizedUrl(item.baseUrl, 800, 600),
      thumbnailUrl: GooglePhotosUtils.getThumbnailUrl(item.baseUrl, 300, 300),
      width: parseInt(item.mediaMetadata.width),
      height: parseInt(item.mediaMetadata.height),
      mimeType: item.mimeType,
      createdAt: item.mediaMetadata.creationTime,
      albumTitle: 'Orkut Photos 📸'
    }))

    console.log(`✅ ${photos.length} fotos encontradas no Google Photos`)

    return NextResponse.json({
      success: true,
      photos,
      hasGooglePhotosAccess: true,
      total: photos.length
    })

  } catch (error) {
    console.error('❌ Erro na API de fotos:', error)
    
    // Verificar se é erro de autenticação
    if (error instanceof Error && error.message.includes('401')) {
      return NextResponse.json({ 
        error: 'Token expirado. Faça login novamente.',
        needsReauth: true 
      }, { status: 401 })
    }

    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}
