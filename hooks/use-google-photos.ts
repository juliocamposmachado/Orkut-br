import { useState, useCallback } from 'react'
import { useAuth } from '@/contexts/enhanced-auth-context'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

interface GooglePhoto {
  id: string
  filename: string
  url: string
  thumbnailUrl: string
  width: number
  height: number
  mimeType: string
  createdAt: string
  albumId?: string
  albumTitle?: string
}

interface UploadResult {
  success: boolean
  photo?: GooglePhoto
  error?: string
  needsReauth?: boolean
}

interface GooglePhotosHook {
  photos: GooglePhoto[]
  loading: boolean
  uploading: boolean
  uploadPhoto: (file: File, description?: string) => Promise<UploadResult>
  fetchPhotos: () => Promise<void>
  hasGooglePhotosAccess: boolean
  checkAccess: () => Promise<boolean>
}

export function useGooglePhotos(): GooglePhotosHook {
  const [photos, setPhotos] = useState<GooglePhoto[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [hasGooglePhotosAccess, setHasGooglePhotosAccess] = useState(false)
  const { user } = useAuth()

  /**
   * Obter token de acesso do usuário logado
   */
  const getAccessToken = useCallback(async (): Promise<string | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      return session?.access_token || null
    } catch (error) {
      console.error('❌ Erro ao obter token de acesso:', error)
      return null
    }
  }, [])

  /**
   * Verificar se usuário tem acesso ao Google Photos
   */
  const checkAccess = useCallback(async (): Promise<boolean> => {
    if (!user) return false

    try {
      const token = await getAccessToken()
      if (!token) return false

      const response = await fetch('/api/photos/google', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.status === 401) {
        const data = await response.json()
        if (data.needsReauth) {
          console.log('⚠️ Usuário precisa reautenticar com Google Photos')
          setHasGooglePhotosAccess(false)
          return false
        }
      }

      const hasAccess = response.ok
      setHasGooglePhotosAccess(hasAccess)
      return hasAccess
    } catch (error) {
      console.error('❌ Erro ao verificar acesso ao Google Photos:', error)
      setHasGooglePhotosAccess(false)
      return false
    }
  }, [user, getAccessToken])

  /**
   * Buscar fotos do Google Photos
   */
  const fetchPhotos = useCallback(async () => {
    if (!user || loading) return

    setLoading(true)
    try {
      const token = await getAccessToken()
      if (!token) {
        toast.error('Erro de autenticação. Faça login novamente.')
        return
      }

      const response = await fetch('/api/photos/google', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        
        if (errorData.needsReauth) {
          toast.error('Suas permissões do Google Photos expiraram. Faça login novamente.')
          setHasGooglePhotosAccess(false)
          return
        }

        throw new Error(errorData.error || 'Erro ao buscar fotos')
      }

      const data = await response.json()
      setPhotos(data.photos || [])
      setHasGooglePhotosAccess(data.hasGooglePhotosAccess || false)
      
      console.log(`📸 ${data.photos?.length || 0} fotos carregadas do Google Photos`)
    } catch (error) {
      console.error('❌ Erro ao buscar fotos:', error)
      toast.error('Erro ao carregar fotos do Google Photos')
      setPhotos([])
    } finally {
      setLoading(false)
    }
  }, [user, loading, getAccessToken])

  /**
   * Fazer upload de foto para Google Photos
   */
  const uploadPhoto = useCallback(async (
    file: File, 
    description?: string
  ): Promise<UploadResult> => {
    if (!user) {
      return {
        success: false,
        error: 'Usuário não autenticado'
      }
    }

    if (uploading) {
      return {
        success: false,
        error: 'Upload já em andamento'
      }
    }

    setUploading(true)
    
    try {
      console.log('📤 Iniciando upload para Google Photos:', file.name)
      
      // Validações básicas
      if (!file.type.startsWith('image/')) {
        throw new Error('Arquivo deve ser uma imagem')
      }

      const maxSize = 10 * 1024 * 1024 // 10MB
      if (file.size > maxSize) {
        throw new Error('Arquivo muito grande. Máximo 10MB.')
      }

      const token = await getAccessToken()
      if (!token) {
        throw new Error('Token de acesso não disponível')
      }

      // Preparar FormData
      const formData = new FormData()
      formData.append('photo', file)
      if (description) {
        formData.append('description', description)
      }

      // Toast de progresso
      toast.loading('📤 Enviando foto para Google Photos...', {
        id: 'upload-progress'
      })

      // Fazer upload
      const response = await fetch('/api/photos/google', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      const result = await response.json()

      if (!response.ok) {
        // Verificar se precisa reautenticar
        if (result.needsReauth) {
          setHasGooglePhotosAccess(false)
          toast.error('Suas permissões do Google Photos expiraram. Faça login novamente.', {
            id: 'upload-progress'
          })
          return {
            success: false,
            error: result.error,
            needsReauth: true
          }
        }

        throw new Error(result.error || 'Erro no upload')
      }

      if (!result.success) {
        throw new Error(result.error || 'Upload falhou')
      }

      // Sucesso!
      const uploadedPhoto = result.photo
      console.log('✅ Upload concluído:', uploadedPhoto.filename)

      // Atualizar lista local de fotos
      setPhotos(currentPhotos => [uploadedPhoto, ...currentPhotos])

      toast.success(`📸 Foto enviada para Google Photos!`, {
        id: 'upload-progress',
        description: `${uploadedPhoto.filename} foi salva no álbum "${uploadedPhoto.albumTitle}"`
      })

      return {
        success: true,
        photo: uploadedPhoto
      }

    } catch (error) {
      console.error('❌ Erro no upload:', error)
      
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido no upload'
      toast.error(`Erro no upload: ${errorMessage}`, {
        id: 'upload-progress'
      })
      
      return {
        success: false,
        error: errorMessage
      }
    } finally {
      setUploading(false)
    }
  }, [user, uploading, getAccessToken])

  return {
    photos,
    loading,
    uploading,
    uploadPhoto,
    fetchPhotos,
    hasGooglePhotosAccess,
    checkAccess
  }
}
