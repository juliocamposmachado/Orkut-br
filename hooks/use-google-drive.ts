import { useState, useCallback } from 'react'
import { useAuth } from '@/contexts/enhanced-auth-context'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

interface GoogleDrivePhoto {
  id: string
  filename: string
  url: string
  thumbnailUrl: string
  webViewLink: string
  size: string
  mimeType: string
  createdAt: string
  description?: string
}

interface UploadResult {
  success: boolean
  photo?: GoogleDrivePhoto
  error?: string
  needsReauth?: boolean
}

interface GoogleDriveHook {
  photos: GoogleDrivePhoto[]
  loading: boolean
  uploading: boolean
  uploadPhoto: (file: File, description?: string) => Promise<UploadResult>
  fetchPhotos: () => Promise<void>
  hasGoogleDriveAccess: boolean
  checkAccess: () => Promise<boolean>
}

export function useGoogleDrive(): GoogleDriveHook {
  const [photos, setPhotos] = useState<GoogleDrivePhoto[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [hasGoogleDriveAccess, setHasGoogleDriveAccess] = useState(false)
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
   * Verificar se usuário tem acesso ao Google Drive
   */
  const checkAccess = useCallback(async (): Promise<boolean> => {
    if (!user) return false

    try {
      const token = await getAccessToken()
      if (!token) return false

      const response = await fetch('/api/photos/google-drive/check', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.status === 401) {
        const data = await response.json()
        if (data.needsReauth) {
          console.log('⚠️ Usuário precisa reautenticar com Google Drive')
          setHasGoogleDriveAccess(false)
          return false
        }
      }

      const hasAccess = response.ok
      setHasGoogleDriveAccess(hasAccess)
      return hasAccess
    } catch (error) {
      console.error('❌ Erro ao verificar acesso ao Google Drive:', error)
      setHasGoogleDriveAccess(false)
      return false
    }
  }, [user, getAccessToken])

  /**
   * Buscar fotos do Google Drive
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

      const response = await fetch('/api/photos/google-drive', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        
        if (errorData.needsReauth) {
          toast.error('Suas permissões do Google Drive expiraram. Faça login novamente.')
          setHasGoogleDriveAccess(false)
          return
        }

        throw new Error(errorData.error || 'Erro ao buscar fotos')
      }

      const data = await response.json()
      setPhotos(data.photos || [])
      setHasGoogleDriveAccess(data.hasGoogleDriveAccess || false)
      
      console.log(`📁 ${data.photos?.length || 0} fotos carregadas do Google Drive`)
    } catch (error) {
      console.error('❌ Erro ao buscar fotos:', error)
      toast.error('Erro ao carregar fotos do Google Drive')
      setPhotos([])
    } finally {
      setLoading(false)
    }
  }, [user, loading, getAccessToken])

  /**
   * Fazer upload de foto para Google Drive
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
      console.log('📤 Iniciando upload para Google Drive:', file.name)
      
      // Validações básicas
      if (!file.type.startsWith('image/')) {
        throw new Error('Arquivo deve ser uma imagem')
      }

      const maxSize = 15 * 1024 * 1024 // 15MB
      if (file.size > maxSize) {
        throw new Error('Arquivo muito grande. Máximo 15MB.')
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
      toast.loading('📁 Salvando no Google Drive...', {
        id: 'upload-progress'
      })

      // Fazer upload
      const response = await fetch('/api/photos/google-drive', {
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
          setHasGoogleDriveAccess(false)
          toast.error('Suas permissões do Google Drive expiraram. Faça login novamente.', {
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

      toast.success(`📁 Foto salva no Google Drive!`, {
        id: 'upload-progress',
        description: `${uploadedPhoto.filename} foi salva na pasta "Orkut"`
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
    hasGoogleDriveAccess,
    checkAccess
  }
}
