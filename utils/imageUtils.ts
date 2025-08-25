// Utilitários épicos para processamento de imagens! 🚀
export interface ImageProcessingOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  format?: 'webp' | 'jpeg' | 'png'
}

export interface ProcessedImage {
  file: File
  dataUrl: string
  width: number
  height: number
  originalSize: number
  compressedSize: number
  compressionRatio: number
}

/**
 * Comprime e redimensiona uma imagem mantendo a qualidade
 */
export async function compressImage(
  file: File, 
  options: ImageProcessingOptions = {}
): Promise<ProcessedImage> {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.8,
    format = 'webp'
  } = options

  return new Promise((resolve, reject) => {
    const img = new Image()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      reject(new Error('Não foi possível criar canvas'))
      return
    }

    img.onload = () => {
      // Calcula as novas dimensões mantendo proporção
      let { width, height } = img
      
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height)
        width *= ratio
        height *= ratio
      }

      canvas.width = width
      canvas.height = height

      // Desenha a imagem redimensionada
      ctx.drawImage(img, 0, 0, width, height)

      // Converte para blob
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Falha na compressão'))
            return
          }

          const compressedFile = new File([blob], file.name, {
            type: `image/${format}`,
            lastModified: Date.now()
          })

          const compressionRatio = ((file.size - blob.size) / file.size) * 100

          canvas.toDataURL(`image/${format}`, quality)
          
          resolve({
            file: compressedFile,
            dataUrl: canvas.toDataURL(`image/${format}`, quality),
            width,
            height,
            originalSize: file.size,
            compressedSize: blob.size,
            compressionRatio
          })
        },
        `image/${format}`,
        quality
      )
    }

    img.onerror = () => reject(new Error('Erro ao carregar imagem'))
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Gera múltiplos tamanhos de uma imagem (thumbnails)
 */
export async function generateThumbnails(file: File) {
  const sizes = [
    { name: 'thumb', maxWidth: 150, maxHeight: 150 },
    { name: 'medium', maxWidth: 400, maxHeight: 400 },
    { name: 'large', maxWidth: 800, maxHeight: 800 },
  ]

  const thumbnails = await Promise.all(
    sizes.map(size => 
      compressImage(file, {
        maxWidth: size.maxWidth,
        maxHeight: size.maxHeight,
        quality: 0.85,
        format: 'webp'
      }).then(result => ({
        ...result,
        size: size.name
      }))
    )
  )

  return thumbnails
}

/**
 * Valida se o arquivo é uma imagem válida
 */
export function validateImage(file: File): { valid: boolean; error?: string } {
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  const maxSize = 10 * 1024 * 1024 // 10MB

  if (!validTypes.includes(file.type)) {
    return { valid: false, error: 'Formato de arquivo não suportado. Use JPEG, PNG, GIF ou WebP.' }
  }

  if (file.size > maxSize) {
    return { valid: false, error: 'Arquivo muito grande. Máximo 10MB.' }
  }

  return { valid: true }
}

/**
 * Gera nome único para arquivo
 */
export function generateUniqueFileName(originalName: string, userId: string, type: 'profile' | 'post' = 'profile'): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  const extension = 'webp'
  
  return `${type}/${userId}/${timestamp}_${random}.${extension}`
}
