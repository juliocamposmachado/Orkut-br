'use client'

import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/contexts/enhanced-auth-context'
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
  Save,
  Hash
} from 'lucide-react'

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
  // Campos para o feed
  title?: string
  description?: string
  tags?: string[]
  is_saved_to_feed?: boolean
  feed_id?: string
}

interface ImgurUploadProps {
  onUploadComplete?: (image: UploadedImage) => void
  className?: string
}

export default function ImgurUpload({ onUploadComplete, className = '' }: ImgurUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([])
  const [error, setError] = useState<string>('')
  const [isSavingToFeed, setIsSavingToFeed] = useState<string | null>(null)
  const { user, session } = useAuth() as any
  const fileInputRef = useRef<HTMLInputElement>(null)

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
    
    for (const file of files) {
      await uploadSingleFile(file)
    }
  }

  const uploadSingleFile = async (file: File) => {
    setIsUploading(true)
    
    try {
      // Validações básicas
      if (file.size > 10 * 1024 * 1024) {
        throw new Error(`${file.name}: Arquivo muito grande (máximo 10MB)`)
      }

      if (!file.type.startsWith('image/')) {
        throw new Error(`${file.name}: Apenas imagens são permitidas`)
      }

      console.log('📤 Fazendo upload:', file.name)

      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/photos/imgur-upload', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Erro no upload')
      }

      const uploadedImage: UploadedImage = result.data
      setUploadedImages(prev => [...prev, uploadedImage])
      
      console.log('✅ Upload bem-sucedido:', uploadedImage.url)
      
      // Callback opcional
      if (onUploadComplete) {
        onUploadComplete(uploadedImage)
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      setError(errorMessage)
      console.error('❌ Erro no upload:', errorMessage)
    } finally {
      setIsUploading(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      console.log('📋 Link copiado:', text)
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
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Drop Zone */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200
          ${isDragging 
            ? 'border-purple-400 bg-purple-50 scale-105' 
            : 'border-gray-300 hover:border-purple-300 hover:bg-purple-25'
          }
          ${isUploading ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}
        `}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
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
                <h3 className="text-lg font-semibold text-gray-700">Fazendo upload...</h3>
                <p className="text-sm text-gray-500">Aguarde enquanto enviamos sua foto</p>
              </div>
            </>
          ) : (
            <>
              <Upload className="w-12 h-12 text-purple-500 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold text-gray-700">Upload de Fotos</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Arraste suas fotos aqui ou clique para selecionar
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  JPEG, PNG, GIF, WebP • Máximo 10MB • Via Imgur.com
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
          <div>
            <h4 className="text-sm font-semibold text-red-800">Erro no Upload</h4>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setError('')}
            className="text-red-500 hover:text-red-700 ml-auto"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Uploaded Images */}
      {uploadedImages.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold text-gray-800">
              Fotos Enviadas ({uploadedImages.length})
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

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {uploadedImages.map((image) => (
              <div key={image.id} className="bg-white border rounded-lg p-4 space-y-3">
                {/* Preview */}
                <div className="aspect-video relative bg-gray-100 rounded overflow-hidden">
                  <img
                    src={image.thumbnail_url}
                    alt={image.original_filename}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>

                {/* Info */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium text-gray-700 truncate">
                      {image.original_filename}
                    </span>
                  </div>

                  <div className="text-xs text-gray-500 space-y-1">
                    <p>{image.width} × {image.height} px</p>
                    <p>{(image.file_size / 1024).toFixed(1)} KB</p>
                    <p>{new Date(image.upload_time).toLocaleString('pt-BR')}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(image.direct_url)}
                      className="flex-1 text-xs"
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Copiar Link
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(image.page_url, '_blank')}
                      className="text-xs"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeImage(image.id)}
                      className="text-red-600 hover:text-red-700 text-xs"
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

      {/* Info Footer */}
      <div className="text-center">
        <p className="text-xs text-gray-400">
          🌐 Fotos hospedadas no <strong>Imgur.com</strong> • 
          Links permanentes • Sem necessidade de login
        </p>
      </div>
    </div>
  )
}
