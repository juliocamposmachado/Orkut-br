import { supabase } from './supabase'
import { compressImage, generateThumbnails, validateImage, generateUniqueFileName } from '../utils/imageUtils'

export interface UploadResult {
  success: boolean
  data?: {
    url: string
    path: string
    thumbnails?: { [size: string]: string }
  }
  error?: string
}

/**
 * Faz upload de uma imagem de perfil com compressão automática
 */
export async function uploadProfileImage(file: File, userId: string): Promise<UploadResult> {
  try {
    // Valida o arquivo
    const validation = validateImage(file)
    if (!validation.valid) {
      return { success: false, error: validation.error }
    }

    // Comprime a imagem principal
    const compressed = await compressImage(file, {
      maxWidth: 800,
      maxHeight: 800,
      quality: 0.85,
      format: 'webp'
    })

    // Gera thumbnails
    const thumbnails = await generateThumbnails(file)

    // Remove foto de perfil antiga se existir
    await removeOldProfileImage(userId)

    // Gera nome único para o arquivo
    const fileName = generateUniqueFileName(file.name, userId, 'profile')

    // Upload da imagem principal
    const { data, error } = await supabase.storage
      .from('user-photos')
      .upload(fileName, compressed.file, {
        contentType: 'image/webp',
        upsert: false
      })

    if (error) {
      throw new Error(`Erro no upload: ${error.message}`)
    }

    // Upload dos thumbnails
    const thumbnailUrls: { [size: string]: string } = {}
    
    for (const thumb of thumbnails) {
      const thumbName = fileName.replace('.webp', `_${thumb.size}.webp`)
      
      const { data: thumbData, error: thumbError } = await supabase.storage
        .from('user-photos')
        .upload(thumbName, thumb.file, {
          contentType: 'image/webp',
          upsert: false
        })

      if (!thumbError && thumbData) {
        const { data: { publicUrl } } = supabase.storage
          .from('user-photos')
          .getPublicUrl(thumbName)
        
        thumbnailUrls[thumb.size] = publicUrl
      }
    }

    // Get URL pública da imagem principal
    const { data: { publicUrl } } = supabase.storage
      .from('user-photos')
      .getPublicUrl(fileName)

    // Atualiza o perfil do usuário com a nova foto
    await updateUserProfileImage(userId, publicUrl, thumbnailUrls)

    return {
      success: true,
      data: {
        url: publicUrl,
        path: fileName,
        thumbnails: thumbnailUrls
      }
    }

  } catch (error) {
    console.error('Erro no upload:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido no upload' 
    }
  }
}

/**
 * Remove imagem de perfil antiga do usuário
 */
async function removeOldProfileImage(userId: string) {
  try {
    // Lista arquivos do usuário
    const { data: files } = await supabase.storage
      .from('user-photos')
      .list(`profile/${userId}`)

    if (files && files.length > 0) {
      // Remove todos os arquivos antigos
      const filePaths = files.map(file => `profile/${userId}/${file.name}`)
      await supabase.storage
        .from('user-photos')
        .remove(filePaths)
    }
  } catch (error) {
    console.error('Erro ao remover imagem antiga:', error)
  }
}

/**
 * Atualiza o banco de dados com as URLs das imagens
 */
async function updateUserProfileImage(userId: string, imageUrl: string, thumbnails: { [size: string]: string }) {
  const { error } = await supabase
    .from('profiles')
    .update({
      photo_url: imageUrl,
      // Note: avatar_thumbnails field doesn't exist in profiles table
      // thumbnails can be stored in a separate table if needed
    })
    .eq('id', userId)

  if (error) {
    throw new Error(`Erro ao atualizar perfil: ${error.message}`)
  }
}

/**
 * Upload de foto para posts
 */
export async function uploadPostImage(file: File, userId: string): Promise<UploadResult> {
  try {
    const validation = validateImage(file)
    if (!validation.valid) {
      return { success: false, error: validation.error }
    }

    // Comprime para posts (pode ser maior que perfil)
    const compressed = await compressImage(file, {
      maxWidth: 1200,
      maxHeight: 1200,
      quality: 0.8,
      format: 'webp'
    })

    const fileName = generateUniqueFileName(file.name, userId, 'post')

    const { data, error } = await supabase.storage
      .from('user-photos')
      .upload(fileName, compressed.file, {
        contentType: 'image/webp',
        upsert: false
      })

    if (error) {
      throw new Error(`Erro no upload: ${error.message}`)
    }

    const { data: { publicUrl } } = supabase.storage
      .from('user-photos')
      .getPublicUrl(fileName)

    return {
      success: true,
      data: {
        url: publicUrl,
        path: fileName
      }
    }

  } catch (error) {
    console.error('Erro no upload de post:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido no upload' 
    }
  }
}

/**
 * Remove uma imagem do storage
 */
export async function deleteImage(filePath: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from('user-photos')
      .remove([filePath])

    return !error
  } catch (error) {
    console.error('Erro ao deletar imagem:', error)
    return false
  }
}
