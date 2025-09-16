'use client'

import React, { useState, useRef, useCallback } from 'react'
import { useAuth } from '@/contexts/local-auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { OrkutCard, OrkutCardContent, OrkutCardHeader } from '@/components/ui/orkut-card'
import { 
  Upload, 
  X, 
  Image as ImageIcon, 
  Camera,
  CheckCircle,
  AlertCircle,
  Loader2,
  ExternalLink
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface PostImageUploadProps {
  onUploadComplete?: (photos: any[]) => void
  onUploadStart?: () => void
  maxFiles?: number
}

interface FileWithPreview extends File {
  preview?: string
  id?: string
}

interface PostImageResponse {
  status: string
  url?: string
  directUrl?: string
  thumbnailUrl?: string
  error?: string
}

export function PostImageUpload({ 
  onUploadComplete,
  onUploadStart,
  maxFiles = 5
}: PostImageUploadProps) {
  const { user } = useAuth()
  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [uploadResults, setUploadResults] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  // Form data
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)

  /**
   * Validar arquivo de imagem
   */
  const validateFile = useCallback((file: File): string | null => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return 'Tipo de arquivo não suportado. Use JPEG, PNG, WebP ou GIF.'
    }

    const maxSize = 32 * 1024 * 1024 // PostImage permite até 32MB
    if (file.size > maxSize) {
      return 'Arquivo muito grande. Máximo 32MB permitido.'
    }

    return null
  }, [])

  /**
   * Processar arquivos selecionados
   */
  const processFiles = useCallback(async (fileList: FileList | File[]) => {
    const newFiles: FileWithPreview[] = []

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList instanceof FileList ? fileList[i] : fileList[i]
      
      // Verificar se já existe
      const exists = files.some(f => f.name === file.name && f.size === file.size)
      if (exists) continue

      // Validar arquivo
      const errorMsg = validateFile(file)
      if (errorMsg) {
        console.warn(`Arquivo ${file.name} rejeitado: ${errorMsg}`)
        setError(errorMsg)
        continue
      }

      // Criar preview
      const fileWithPreview = file as FileWithPreview
      fileWithPreview.id = `${Date.now()}-${Math.random()}`
      
      try {
        fileWithPreview.preview = URL.createObjectURL(file)
        newFiles.push(fileWithPreview)
      } catch (err) {
        console.warn('Erro ao criar preview:', err)
      }
    }

    // Limitar número de arquivos
    const totalFiles = files.length + newFiles.length
    if (totalFiles > maxFiles) {
      const allowedCount = maxFiles - files.length
      setFiles(prev => [...prev, ...newFiles.slice(0, allowedCount)])
      setError(`Máximo ${maxFiles} arquivos permitidos. ${allowedCount} arquivo(s) adicionado(s).`)
    } else {
      setFiles(prev => [...prev, ...newFiles])
    }
  }, [files, maxFiles, validateFile])

  /**
   * Handle drag & drop
   */
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    setError(null)

    const droppedFiles = Array.from(e.dataTransfer.files)
    processFiles(droppedFiles)
  }, [processFiles])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (!dropZoneRef.current?.contains(e.relatedTarget as Node)) {
      setDragActive(false)
    }
  }, [])

  /**
   * Handle file input
   */
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (selectedFiles) {
      setError(null)
      processFiles(selectedFiles)
    }
  }, [processFiles])

  /**
   * Remover arquivo
   */
  const removeFile = useCallback((fileId: string) => {
    setFiles(prev => {
      const updated = prev.filter(f => f.id !== fileId)
      // Limpar preview URL
      const fileToRemove = prev.find(f => f.id === fileId)
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview)
      }
      return updated
    })
  }, [])

  /**
   * Upload para PostImage.org via nossa API proxy
   */
  const uploadToPostImage = async (file: File): Promise<PostImageResponse> => {
    const formData = new FormData()
    formData.append('file', file)
    // Removido 'resize' - será processado pela API proxy
    
    try {
      console.log('📤 [Component] Enviando arquivo para API proxy:', {
        name: file.name,
        size: `${(file.size / 1024).toFixed(2)}KB`,
        type: file.type
      })
      
      // Usar nossa API proxy para evitar CORS
      const response = await fetch('/api/photos/upload-postimage', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`)
      }
      
      const result = await response.json()
      
      if (result.success) {
        return {
          status: 'success',
          url: result.data.page_url,
          directUrl: result.data.direct_url,
          thumbnailUrl: result.data.thumb_url
        }
      } else {
        throw new Error(result.error || 'Erro no upload')
      }
    } catch (error) {
      console.error('Erro no upload para PostImage:', error)
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  }

  /**
   * Fazer upload de todas as fotos
   */
  const handleUpload = useCallback(async () => {
    if (files.length === 0 || !user) return

    try {
      setUploading(true)
      setError(null)
      setProgress(0)
      onUploadStart?.()

      const results: any[] = []
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        
        try {
          // Upload para PostImage
          const postImageResult = await uploadToPostImage(file)
          
          if (postImageResult.status === 'success') {
            // Salvar informações no banco de dados local
            const saveResult = await fetch('/api/photos/postimage', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${'mock-token'}`
              },
              body: JSON.stringify({
                url: postImageResult.directUrl,
                thumbnail_url: postImageResult.thumbnailUrl,
                page_url: postImageResult.url,
                title: title || `Foto enviada em ${new Date().toLocaleDateString('pt-BR')}`,
                description: description || '',
                category: 'geral',
                filename: file.name,
                filesize: file.size,
                mime_type: file.type
              })
            })
            
            if (saveResult.ok) {
              const savedPhoto = await saveResult.json()
              results.push({
                success: true,
                data: savedPhoto,
                postImageUrl: postImageResult.url
              })
            } else {
              throw new Error('Erro ao salvar no banco de dados')
            }
          } else {
            throw new Error(postImageResult.error || 'Erro no upload')
          }
          
        } catch (error) {
          console.error(`Erro no upload do arquivo ${file.name}:`, error)
          results.push({
            success: false,
            filename: file.name,
            error: error instanceof Error ? error.message : 'Erro desconhecido'
          })
        }
        
        // Atualizar progresso
        setProgress(((i + 1) / files.length) * 100)
      }

      setUploadResults(results)
      
      // Chamar callback de sucesso
      const successfulUploads = results.filter(r => r.success)
      if (successfulUploads.length > 0) {
        onUploadComplete?.(successfulUploads.map(r => r.data))
      }

      // Limpar formulário se todos uploads foram bem-sucedidos
      if (results.every(r => r.success)) {
        setTimeout(() => {
          resetForm()
        }, 3000)
      }

    } catch (error) {
      console.error('Erro no upload:', error)
      setError(error instanceof Error ? error.message : 'Erro desconhecido no upload')
    } finally {
      setUploading(false)
    }
  }, [files, title, description, user, onUploadStart, onUploadComplete])

  /**
   * Resetar formulário
   */
  const resetForm = useCallback(() => {
    // Limpar previews
    files.forEach(file => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview)
      }
    })

    setFiles([])
    setTitle('')
    setDescription('')
    setProgress(0)
    setUploadResults([])
    setError(null)
    
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [files])

  return (
    <OrkutCard>
      <OrkutCardHeader>
        <div className="flex items-center space-x-2">
          <div className="bg-purple-100 rounded-full p-2">
            <Camera className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-medium">Upload de Fotos</h3>
            <p className="text-sm text-gray-600">
              Hospedado gratuitamente no PostImage.org
            </p>
          </div>
        </div>
      </OrkutCardHeader>

      <OrkutCardContent className="space-y-6">
        {/* Drop Zone */}
        <div
          ref={dropZoneRef}
          className={cn(
            'border-2 border-dashed border-gray-300 rounded-lg p-8 text-center transition-colors',
            dragActive && 'border-purple-500 bg-purple-50',
            files.length > 0 && 'border-green-500 bg-green-50'
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-700 mb-2">
            {files.length === 0 
              ? 'Arraste fotos aqui ou clique para selecionar'
              : `${files.length} foto(s) selecionada(s)`
            }
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Suporte: JPEG, PNG, WebP, GIF • Máximo: {maxFiles} fotos • Tamanho: 32MB por foto
          </p>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <Button 
            type="button"
            variant="outline" 
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            Selecionar Arquivos
          </Button>

          {/* Link para PostImage */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <a 
              href="https://postimages.org" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              Powered by PostImage.org
            </a>
          </div>
        </div>

        {/* Preview das fotos */}
        {files.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-medium">Fotos Selecionadas</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {files.map(file => (
                <div key={file.id} className="relative group">
                  <img
                    src={file.preview}
                    alt={file.name}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => removeFile(file.id!)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    disabled={uploading}
                  >
                    <X className="w-3 h-3" />
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b-lg truncate">
                    {file.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Formulário de metadados */}
        {files.length > 0 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Título (opcional)
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Minha nova foto"
                maxLength={100}
                disabled={uploading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Descrição (opcional)
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Conte mais sobre suas fotos..."
                rows={3}
                maxLength={500}
                disabled={uploading}
              />
            </div>
          </div>
        )}

        {/* Progress */}
        {uploading && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                Enviando para PostImage.org...
              </span>
              <span className="text-sm text-gray-600">
                {Math.round(progress)}%
              </span>
            </div>
            
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Results */}
        {uploadResults.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Resultados do Upload</h4>
            {uploadResults.map((result, idx) => (
              <div key={idx} className="flex items-center space-x-2 text-sm p-2 rounded-lg bg-gray-50">
                {result.success ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-green-700 flex-1">
                      Upload realizado com sucesso
                    </span>
                    {result.postImageUrl && (
                      <a 
                        href={result.postImageUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span className="text-red-700">
                      {result.filename}: {result.error}
                    </span>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <h4 className="font-medium text-red-800">Erro</h4>
            </div>
            <p className="text-red-600 mt-1">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between pt-4 border-t border-gray-200">
          <Button 
            variant="outline" 
            onClick={resetForm}
            disabled={uploading}
          >
            Limpar Tudo
          </Button>
          
          <Button 
            onClick={handleUpload}
            disabled={files.length === 0 || uploading}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload {files.length} Foto{files.length !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </div>
      </OrkutCardContent>
    </OrkutCard>
  )
}
