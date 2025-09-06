import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { GoogleDriveService, GoogleDriveUtils } from '@/lib/googleDrive'

export const dynamic = 'force-dynamic'

/**
 * GET - Buscar fotos do Google Drive do usuário
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
    const googleDrive = new GoogleDriveService({
      accessToken: providerToken
    })

    const isValidToken = await googleDrive.validateToken()
    if (!isValidToken) {
      console.log('❌ Token do Google inválido ou sem permissões necessárias')
      return NextResponse.json({ 
        error: 'Token do Google inválido. Faça login novamente.',
        needsReauth: true 
      }, { status: 401 })
    }

    console.log('📁 Buscando fotos do Google Drive para usuário:', session.user.id)

    // Buscar fotos da pasta Orkut
    const driveFiles = await googleDrive.getOrkutPhotos(20)

    // Transformar para formato do nosso sistema
    const photos = driveFiles.map(file => ({
      id: file.id,
      filename: file.name,
      url: googleDrive.getDirectViewUrl(file),
      thumbnailUrl: googleDrive.getThumbnailUrl(file, 300),
      webViewLink: file.webViewLink,
      size: GoogleDriveUtils.formatFileSize(file.size),
      mimeType: file.mimeType,
      createdAt: file.createdTime,
      description: file.name // Usar nome como descrição padrão
    }))

    console.log(`✅ ${photos.length} fotos encontradas no Google Drive`)

    return NextResponse.json({
      success: true,
      photos,
      hasGoogleDriveAccess: true,
      total: photos.length
    })

  } catch (error) {
    console.error('❌ Erro na API de fotos Drive:', error)
    
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

/**
 * POST - Fazer upload de foto para Google Drive
 */
export async function POST(request: NextRequest) {
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
    const googleDrive = new GoogleDriveService({
      accessToken: providerToken
    })

    const isValidToken = await googleDrive.validateToken()
    if (!isValidToken) {
      console.log('❌ Token do Google inválido ou sem permissões necessárias')
      return NextResponse.json({ 
        error: 'Token do Google inválido. Faça login novamente.',
        needsReauth: true 
      }, { status: 401 })
    }

    // Obter dados do FormData
    const formData = await request.formData()
    const photoFile = formData.get('photo') as File
    const description = formData.get('description') as string || ''

    if (!photoFile) {
      return NextResponse.json({ error: 'Arquivo de foto é obrigatório' }, { status: 400 })
    }

    // Validações básicas
    if (!photoFile.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Arquivo deve ser uma imagem' }, { status: 400 })
    }

    const maxSize = 15 * 1024 * 1024 // 15MB
    if (photoFile.size > maxSize) {
      return NextResponse.json({ error: 'Arquivo muito grande. Máximo 15MB.' }, { status: 400 })
    }

    console.log('📤 Iniciando upload para Google Drive:', {
      filename: photoFile.name,
      size: `${(photoFile.size / 1024 / 1024).toFixed(2)}MB`,
      type: photoFile.type,
      user: session.user.id
    })

    // Fazer upload da foto
    const uploadResult = await googleDrive.uploadPhoto(
      photoFile, 
      description || `Foto enviada via Orkut: ${photoFile.name}`
    )

    if (!uploadResult.success || !uploadResult.file) {
      return NextResponse.json({ 
        success: false,
        error: uploadResult.error || 'Erro no upload para Google Drive' 
      }, { status: 500 })
    }

    const driveFile = uploadResult.file

    // Salvar referência no banco de dados (opcional)
    const photoData = {
      user_id: session.user.id,
      google_drive_id: driveFile.id,
      filename: driveFile.name,
      url: googleDrive.getDirectViewUrl(driveFile),
      web_view_link: driveFile.webViewLink,
      mime_type: driveFile.mimeType,
      size: driveFile.size,
      description: description || null,
      created_at: new Date().toISOString()
    }

    // Tentar salvar no banco (não crítico se falhar)
    try {
      await supabase
        .from('user_google_drive_photos')
        .upsert(photoData, { onConflict: 'google_drive_id' })
    } catch (dbError) {
      console.warn('⚠️ Erro ao salvar no banco (não crítico):', dbError)
    }

    // Preparar resposta
    const responsePhoto = {
      id: driveFile.id,
      filename: driveFile.name,
      url: googleDrive.getDirectViewUrl(driveFile),
      thumbnailUrl: googleDrive.getThumbnailUrl(driveFile, 300),
      webViewLink: driveFile.webViewLink,
      size: GoogleDriveUtils.formatFileSize(driveFile.size),
      mimeType: driveFile.mimeType,
      createdAt: driveFile.createdTime,
      description: description
    }

    console.log('✅ Upload concluído com sucesso:', responsePhoto.filename)

    return NextResponse.json({
      success: true,
      photo: responsePhoto,
      message: 'Foto salva com sucesso no Google Drive!'
    })

  } catch (error) {
    console.error('❌ Erro no upload para Google Drive:', error)
    
    // Verificar se é erro de autenticação
    if (error instanceof Error && error.message.includes('401')) {
      return NextResponse.json({ 
        error: 'Token expirado. Faça login novamente.',
        needsReauth: true 
      }, { status: 401 })
    }

    return NextResponse.json({ 
      success: false,
      error: 'Erro interno no upload',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}
