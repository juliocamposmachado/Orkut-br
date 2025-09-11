'use client'

import React, { useState, useRef, useCallback } from 'react'
import { useAuth } from '@/contexts/enhanced-auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  Upload, 
  Image as ImageIcon, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Copy,
  ExternalLink,
  Trash2,
  Globe,
  Camera,
  RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface UploadedImage {
  id: string
  url: string
  direct_url: string
  page_url: string
  thumbnail_url: string
  delete_url: string
  width: number
  height: number
  file_size: number
  original_filename: string
  upload_time: string
  // Estado de salvamento
  title?: string
  description?: string
  tags?: string[]
  is_saved_to_feed?: boolean
  feed_id?: string
  saving_to_feed?: boolean
}

interface OptimizedImgurUploadProps {
  onUploadComplete?: (images: UploadedImage[]) => void
  onFeedSave?: (feedData: any) => void
  onFeedUpdate?: () => void // Callback para atualizar o feed global
  autoSaveToFeed?: boolean // Se true, salva automaticamente no feed após upload
  className?: string
}

export default function OptimizedImgurUpload({ 
  onUploadComplete,
  onFeedSave,
  onFeedUpdate,
  autoSaveToFeed = true,
  className = '' 
}: OptimizedImgurUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([])
  const [error, setError] = useState<string>('')
  const [uploadProgress, setUploadProgress] = useState(0)
  const { user, session } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Estados para edição rápida
  const [quickTitle, setQuickTitle] = useState('')
  const [quickDescription, setQuickDescription] = useState('')
  const [quickTags, setQuickTags] = useState('')

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    const imageFiles = files.filter(file => file.type.startsWith('image/'))
    
    if (imageFiles.length > 0) {
      handleFiles(imageFiles)
    } else {
      toast.error('Por favor, selecione apenas arquivos de imagem')
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      handleFiles(files)
    }
  }

  const handleFiles = async (files: File[]) => {
    setError('')
    setIsUploading(true)
    setUploadProgress(0)
    
    const newUploadedImages: UploadedImage[] = []
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        
        // Atualizar progresso
        setUploadProgress(((i + 0.5) / files.length) * 100)
        
        // Validações básicas
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name}: Arquivo muito grande (máximo 10MB)`)
          continue
        }

        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name}: Apenas imagens são permitidas`)
          continue
        }

        console.log(`📤 [Upload ${i + 1}/${files.length}] Enviando:`, file.name)

        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/photos/imgur-upload', {
          method: 'POST',
          body: formData
        })

        const result = await response.json()

        if (!result.success) {
          toast.error(`Erro no upload de ${file.name}: ${result.error}`)
          continue
        }

        const uploadedImage: UploadedImage = {
          ...result.data,
          title: quickTitle || result.data.original_filename,
          description: quickDescription || '',
          tags: quickTags ? quickTags.split(',').map(t => t.trim()).filter(t => t) : [],
          is_saved_to_feed: false,
          saving_to_feed: false
        }
        
        newUploadedImages.push(uploadedImage)
        console.log(`✅ [Upload ${i + 1}/${files.length}] Concluído:`, uploadedImage.url)
        
        // Atualizar progresso
        setUploadProgress(((i + 1) / files.length) * 100)
      }
      
      setUploadedImages(prev => [...prev, ...newUploadedImages])
      
      // Callback de upload completo
      if (onUploadComplete && newUploadedImages.length > 0) {
        onUploadComplete(newUploadedImages)
      }
      
      // Auto-salvar no feed se habilitado
      if (autoSaveToFeed && newUploadedImages.length > 0) {
        toast.info('Salvando fotos no feed global...')
        for (const image of newUploadedImages) {
          await saveToFeedOptimized(image.id, false) // false = não mostrar toast individual
        }
        toast.success(`${newUploadedImages.length} foto(s) adicionada(s) ao feed!`)
      }
      
      // Limpar campos de edição rápida
      if (newUploadedImages.length > 0) {
        setQuickTitle('')
        setQuickDescription('')
        setQuickTags('')
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      setError(errorMessage)
      toast.error(errorMessage)
      console.error('❌ Erro no upload:', errorMessage)
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const saveToFeedOptimized = async (imageId: string, showToast: boolean = true) => {
    if (!user || !session) {
      toast.error('Usuário não autenticado')
      return
    }

    const image = uploadedImages.find(img => img.id === imageId)
    if (!image || image.is_saved_to_feed) return

    // Marcar como salvando
    setUploadedImages(prev =>
      prev.map(img =>
        img.id === imageId
          ? { ...img, saving_to_feed: true }
          : img
      )
    )

    try {
      const feedData = {
        imgur_id: image.id,
        imgur_url: image.direct_url,
        imgur_page_url: image.page_url,
        imgur_delete_url: image.delete_url,
        width: image.width,
        height: image.height,
        file_size: image.file_size,
        mime_type: 'image/jpeg', // Imgur converte para JPEG
        original_filename: image.original_filename,
        title: image.title || image.original_filename,
        description: image.description || null,
        tags: image.tags || [],
        is_public: true,
        user_token: session.access_token
      }

      const response = await fetch('/api/photos/save-feed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedData)
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Erro ao salvar no feed')
      }

      // Atualizar estado da imagem
      setUploadedImages(prev =>
        prev.map(img =>
          img.id === imageId
            ? { 
                ...img, 
                is_saved_to_feed: true, 
                feed_id: result.data.id,
                saving_to_feed: false
              }
            : img
        )
      )

      if (showToast) {
        toast.success('Foto salva no feed global!')
      }
      
      // Callbacks
      if (onFeedSave) {
        onFeedSave(result.data)
      }
      
      if (onFeedUpdate) {
        onFeedUpdate()
      }

      console.log('✅ Salvo no feed:', result.data)

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      
      // Resetar estado de salvamento
      setUploadedImages(prev =>
        prev.map(img =>
          img.id === imageId
            ? { ...img, saving_to_feed: false }
            : img
        )
      )
      
      if (showToast) {
        toast.error(errorMessage)
      }
      console.error('❌ Erro ao salvar no feed:', errorMessage)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Link copiado!')
    } catch (error) {
      console.error('Erro ao copiar:', error)
    }
  }

  const removeImage = (imageId: string) => {
    setUploadedImages(prev => prev.filter(img => img.id !== imageId))
  }

  const clearAll = () => {
    setUploadedImages([])
    setError('')
    setQuickTitle('')
    setQuickDescription('')
    setQuickTags('')
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header com Info */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <Camera className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Upload Otimizado Imgur</h3>
            <p className="text-sm text-gray-600">
              {autoSaveToFeed ? '🎯 Auto-salvamento no feed habilitado' : '📷 Upload manual para o feed'}
            </p>
          </div>
        </div>
        <div className="text-xs text-gray-500 space-y-1">
          <p>✨ Upload direto para Imgur.com - Links permanentes</p>
          <p>🚀 Salvamento automático no banco de dados</p>
          <p>🌍 Aparece instantaneamente no feed global</p>
        </div>
      </div>

      {/* Formulário de edição rápida */}
      {!isUploading && uploadedImages.length === 0 && (
        <div className="bg-white rounded-lg border p-4 space-y-4">
          <h4 className="font-medium text-gray-800 mb-3">📝 Info Rápida (Aplicada a todas as fotos)</h4>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Título (opcional)
              </label>
              <Input
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                placeholder="Ex: Minha foto incrível"
                className="text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags (separadas por vírgula)
              </label>
              <Input
                value={quickTags}
                onChange={(e) => setQuickTags(e.target.value)}
                placeholder="natureza, paisagem, fotografia"
                className="text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrição (opcional)
            </label>
            <Textarea
              value={quickDescription}
              onChange={(e) => setQuickDescription(e.target.value)}
              placeholder="Conte mais sobre suas fotos..."
              rows={2}
              className="text-sm"
            />
          </div>
        </div>
      )}

      {/* Drop Zone */}
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer",
          isDragging 
            ? 'border-purple-400 bg-purple-50 scale-[1.02]' 
            : 'border-gray-300 hover:border-purple-300 hover:bg-purple-25',
          isUploading && 'opacity-50 pointer-events-none'
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />

        <div className="space-y-4">
          {isUploading ? (
            <>
              <Loader2 className="w-12 h-12 text-purple-500 mx-auto animate-spin" />
              <div>
                <h3 className="text-lg font-semibold text-gray-700">Uploading para Imgur...</h3>
                <p className="text-sm text-gray-500 mb-2">Enviando e salvando no feed</p>
                <div className="w-full bg-gray-200 rounded-full h-2 max-w-xs mx-auto">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-400 mt-1">{Math.round(uploadProgress)}%</p>
              </div>
            </>
          ) : (
            <>
              <Upload className="w-12 h-12 text-purple-500 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold text-gray-700">
                  {uploadedImages.length === 0 ? 'Upload de Fotos' : 'Adicionar Mais Fotos'}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Arraste suas fotos aqui ou clique para selecionar
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  JPEG, PNG, GIF, WebP • Máximo 10MB cada • Via Imgur.com
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-red-800">Erro</h4>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setError('')}
            className="text-red-500 hover:text-red-700"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Uploaded Images */}
      {uploadedImages.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
              <span>Fotos Enviadas ({uploadedImages.length})</span>
              {onFeedUpdate && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onFeedUpdate}
                  className="ml-2"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Atualizar Feed
                </Button>
              )}
            </h4>
            <Button
              size="sm"
              variant="outline"
              onClick={clearAll}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Limpar Tudo
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {uploadedImages.map((image) => (
              <div key={image.id} className="bg-white border rounded-lg p-4 space-y-3">
                {/* Preview e Info */}
                <div className="flex space-x-3">
                  <div className="w-20 h-20 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                    <img
                      src={image.thumbnail_url}
                      alt={image.original_filename}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      {image.is_saved_to_feed ? (
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      ) : image.saving_to_feed ? (
                        <Loader2 className="w-4 h-4 text-blue-500 animate-spin flex-shrink-0" />
                      ) : (
                        <ImageIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      )}
                      <span className="text-sm font-medium text-gray-700 truncate">
                        {image.title || image.original_filename}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mb-2">
                      {image.width} × {image.height} px • {(image.file_size / 1024).toFixed(1)} KB
                    </div>
                    {image.is_saved_to_feed && (
                      <div className="flex items-center space-x-1">
                        <Globe className="w-3 h-3 text-green-500" />
                        <span className="text-xs text-green-600">No feed global</span>
                      </div>
                    )}
                    {image.saving_to_feed && (
                      <div className="flex items-center space-x-1">
                        <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />
                        <span className="text-xs text-blue-600">Salvando no feed...</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex space-x-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(image.direct_url)}
                      className="text-xs h-6 px-2"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(image.page_url, '_blank')}
                      className="text-xs h-6 px-2"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </div>

                  <div className="flex space-x-1">
                    {!image.is_saved_to_feed && !image.saving_to_feed && !autoSaveToFeed && (
                      <Button
                        size="sm"
                        onClick={() => saveToFeedOptimized(image.id, true)}
                        className="text-xs h-6 px-2 bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        <Globe className="w-3 h-3 mr-1" />
                        Feed
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeImage(image.id)}
                      className="text-red-600 hover:text-red-700 text-xs h-6 px-2"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer Stats */}
      {uploadedImages.length > 0 && (
        <div className="text-center text-sm text-gray-500 bg-gray-50 rounded-lg p-3">
          📊 {uploadedImages.length} foto(s) enviada(s) • 
          {uploadedImages.filter(img => img.is_saved_to_feed).length} no feed • 
          {uploadedImages.filter(img => img.saving_to_feed).length} salvando
        </div>
      )}

      {/* Info Footer */}
      <div className="text-center">
        <p className="text-xs text-gray-400">
          🌐 Fotos hospedadas no <strong>Imgur.com</strong> • 
          Links permanentes • Integração automática com o feed global
        </p>
      </div>
    </div>
  )
}
