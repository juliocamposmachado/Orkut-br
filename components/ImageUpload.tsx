'use client'

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
// import { toast } from 'sonner' // Temporariamente removido para build

// Função temporária para substituir toast
const toast = {
  error: (message: string) => alert(`Erro: ${message}`),
  success: (message: string, options?: any) => {
    const description = options?.description ? ` - ${options.description}` : '';
    alert(`Sucesso: ${message}${description}`);
  }
};
import { Upload, X, Camera, Image as ImageIcon, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { uploadProfileImage, uploadPostImage } from '@/lib/uploadService'
import { validateImage, compressImage } from '@/utils/imageUtils'

interface ImageUploadProps {
  onUploadComplete?: (url: string) => void
  onUploadStart?: () => void
  userId: string
  type?: 'profile' | 'post'
  currentImage?: string
  className?: string
  variant?: 'default' | 'avatar'
}

export function ImageUpload({
  onUploadComplete,
  onUploadStart,
  userId,
  type = 'profile',
  currentImage,
  className,
  variant = 'default'
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [preview, setPreview] = useState<string | null>(currentImage || null)
  const [compressionInfo, setCompressionInfo] = useState<{
    originalSize: number
    compressedSize: number
    ratio: number
  } | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const file = files[0]
    
    // Validação
    const validation = validateImage(file)
    if (!validation.valid) {
      toast.error(validation.error || 'Erro na validação do arquivo')
      return
    }

    try {
      // Gera preview e comprime
      const compressed = await compressImage(file, {
        maxWidth: type === 'profile' ? 800 : 1200,
        maxHeight: type === 'profile' ? 800 : 1200,
        quality: 0.85
      })

      setPreview(compressed.dataUrl)
      setCompressionInfo({
        originalSize: compressed.originalSize,
        compressedSize: compressed.compressedSize,
        ratio: compressed.compressionRatio
      })

      // Inicia upload
      setIsUploading(true)
      setUploadProgress(0)
      onUploadStart?.()

      // Simula progresso (você pode usar um uploader com progresso real)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 10
        })
      }, 200)

      // Faz upload
      const result = type === 'profile' 
        ? await uploadProfileImage(file, userId)
        : await uploadPostImage(file, userId)

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (result.success && result.data) {
        toast.success(
          `${type === 'profile' ? 'Foto de perfil' : 'Imagem'} enviada com sucesso! 🎉`,
          {
            description: `Compressão: ${compressionInfo?.ratio.toFixed(1)}% menor`
          }
        )
        onUploadComplete?.(result.data.url)
      } else {
        throw new Error(result.error || 'Erro no upload')
      }

    } catch (error) {
      console.error('Erro no upload:', error)
      toast.error('Erro ao enviar imagem')
      setPreview(currentImage || null)
      setCompressionInfo(null)
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }, [userId, type, currentImage, onUploadComplete, onUploadStart, compressionInfo?.ratio])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFileSelect(e.dataTransfer.files)
  }, [handleFileSelect])

  const handleClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const clearPreview = useCallback(() => {
    setPreview(currentImage || null)
    setCompressionInfo(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [currentImage])

  if (variant === 'avatar') {
    return (
      <div className="relative">
        <div 
          className={cn(
            "relative w-32 h-32 rounded-full border-2 border-dashed border-gray-300 cursor-pointer overflow-hidden",
            "hover:border-purple-500 transition-colors",
            isDragging && "border-purple-500 bg-purple-50",
            isUploading && "pointer-events-none",
            className
          )}
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {preview ? (
            <img 
              src={preview} 
              alt="Preview" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <Camera className="w-8 h-8 mb-2" />
              <span className="text-sm">Foto</span>
            </div>
          )}
          
          {isUploading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="text-white text-center">
                <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <div className="text-xs">{uploadProgress}%</div>
              </div>
            </div>
          )}
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
      </div>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Área de upload */}
      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg p-6 transition-all duration-200 cursor-pointer",
          isDragging 
            ? "border-purple-500 bg-purple-50 scale-105" 
            : "border-gray-300 hover:border-purple-400 hover:bg-gray-50",
          isUploading && "pointer-events-none opacity-75"
        )}
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center space-y-4">
          {preview && !isUploading ? (
            <div className="relative">
              <img 
                src={preview} 
                alt="Preview" 
                className="max-w-40 max-h-40 object-contain rounded-lg shadow-md"
              />
              <Button
                variant="destructive"
                size="sm"
                className="absolute -top-2 -right-2 rounded-full w-6 h-6 p-0"
                onClick={(e) => {
                  e.stopPropagation()
                  clearPreview()
                }}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ) : (
            <div className="text-center">
              {isUploading ? (
                <div className="space-y-4">
                  <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  <div>
                    <p className="text-lg font-medium text-purple-600">Enviando...</p>
                    <Progress value={uploadProgress} className="mt-2" />
                    <p className="text-sm text-gray-500 mt-1">{uploadProgress}% completo</p>
                  </div>
                </div>
              ) : (
                <>
                  <Upload className={cn(
                    "w-12 h-12 mx-auto mb-4 transition-colors",
                    isDragging ? "text-purple-500" : "text-gray-400"
                  )} />
                  <div className="space-y-2">
                    <p className="text-lg font-medium">
                      Arraste sua imagem aqui
                    </p>
                    <p className="text-sm text-gray-500">
                      ou clique para selecionar
                    </p>
                    <p className="text-xs text-gray-400">
                      JPEG, PNG, GIF ou WebP até 10MB
                    </p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
      </div>

      {/* Informações de compressão */}
      {compressionInfo && !isUploading && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center space-x-2 text-green-800">
            <Check className="w-4 h-4" />
            <span className="text-sm font-medium">Imagem otimizada!</span>
          </div>
          <div className="text-xs text-green-600 mt-1">
            {(compressionInfo.originalSize / 1024 / 1024).toFixed(2)}MB → {' '}
            {(compressionInfo.compressedSize / 1024 / 1024).toFixed(2)}MB {' '}
            ({compressionInfo.ratio.toFixed(1)}% menor)
          </div>
        </div>
      )}

      {/* Botões de ação */}
      {preview && !currentImage && !isUploading && (
        <div className="flex space-x-2">
          <Button onClick={clearPreview} variant="outline">
            Cancelar
          </Button>
        </div>
      )}
    </div>
  )
}
