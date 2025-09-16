'use client'

import React, { useState, useRef, useCallback } from 'react'
import { useAuth } from '@/contexts/local-auth-context'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  Upload, 
  X, 
  Image as ImageIcon, 
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface DirectUploadProps {
  onUploadComplete?: (urls: string[]) => void
  onUploadStart?: () => void
  maxFiles?: number
  bucket?: string
  folder?: string
}

interface FileWithPreview {
  file: File
  preview?: string
  id: string
  uploadProgress: number
  uploadStatus: 'pending' | 'uploading' | 'completed' | 'error'
  uploadUrl?: string
  error?: string
}

export function DirectUpload({ 
  onUploadComplete,
  onUploadStart,
  maxFiles = 5,
  bucket = 'user-photos',
  folder = 'uploads'
}: DirectUploadProps) {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)

  /**
   * Validar arquivo de imagem
   */
  const validateFile = useCallback((file: File): string | null => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']
    if (!allowedTypes.includes(file.type)) {
      return 'Tipo de arquivo não suportado. Use JPEG, PNG, WebP ou HEIC.'
    }

    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return 'Arquivo muito grande. Máximo 10MB permitido.'
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
      const exists = files.some(f => f.file.name === file.name && f.file.size === file.size)
      if (exists) continue

      // Validar arquivo
      const error = validateFile(file)
      if (error) {
        toast.error(`${file.name}: ${error}`)
        continue
      }

      // Criar preview
      const fileWithPreview: FileWithPreview = {
        file,
        id: `${Date.now()}-${Math.random()}`,
        uploadProgress: 0,
        uploadStatus: 'pending'
      }
      
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
      toast.warning(`Máximo ${maxFiles} arquivos permitidos. ${allowedCount} arquivo(s) adicionado(s).`)
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
      processFiles(selectedFiles)
    }
  }, [processFiles])

  /**
   * Remover arquivo
   */
  const removeFile = useCallback((fileId: string) => {
    setFiles(prev => {
      const updated = prev.filter(f => f.id !== fileId)
      const fileToRemove = prev.find(f => f.id === fileId)
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview)
      }
      return updated
    })
  }, [])

  /**
   * Compressar e redimensionar imagem
   */
  const compressImage = useCallback(async (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      img.onload = () => {
        // Calcular dimensões mantendo proporção
        const maxWidth = 1920
        const maxHeight = 1080
        let { width, height } = img

        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height
            height = maxHeight
          }
        }

        canvas.width = width
        canvas.height = height

        // Desenhar imagem redimensionada
        ctx?.drawImage(img, 0, 0, width, height)

        // Converter para blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/webp',
                lastModified: Date.now()
              })
              resolve(compressedFile)
            } else {
              resolve(file) // fallback
            }
          },
          'image/webp',
          0.85 // qualidade
        )
      }

      img.src = URL.createObjectURL(file)
    })
  }, [])

  /**
   * Upload individual de arquivo
   */
  const uploadSingleFile = useCallback(async (file: FileWithPreview): Promise<string | null> => {
    if (!user) return null

    try {
      // Atualizar status
      setFiles(prev => prev.map(f => 
        f.id === file.id 
          ? { ...f, uploadStatus: 'uploading' as const, uploadProgress: 0 }
          : f
      ))

      // Comprimir imagem
      const compressedFile = await compressImage(file.file)

      // Gerar nome único do arquivo
      const timestamp = Date.now()
      const randomStr = Math.random().toString(36).substring(2, 8)
      const extension = compressedFile.name.split('.').pop() || 'webp'
      const fileName = `${folder}/${user.id}/${timestamp}_${randomStr}.${extension}`

      // Atualizar para 50% (simulando progresso)
      setFiles(prev => prev.map(f => 
        f.id === file.id 
          ? { ...f, uploadProgress: 50 }
          : f
      ))

      // Upload direto para Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, compressedFile, {
          contentType: compressedFile.type,
          upsert: false
        })

      if (error) {
        throw new Error(error.message)
      }

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName)

      // Atualizar status de sucesso
      setFiles(prev => prev.map(f => 
        f.id === file.id 
          ? { 
              ...f, 
              uploadStatus: 'completed' as const, 
              uploadProgress: 100,
              uploadUrl: publicUrl 
            }
          : f
      ))

      return publicUrl

    } catch (error) {
      console.error('Erro no upload:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      
      // Atualizar status de erro
      setFiles(prev => prev.map(f => 
        f.id === file.id 
          ? { 
              ...f, 
              uploadStatus: 'error' as const, 
              uploadProgress: 0,
              error: errorMessage 
            }
          : f
      ))

      toast.error(`Erro no upload de ${file.file.name}: ${errorMessage}`)
      return null
    }
  }, [user, bucket, folder, compressImage])

  /**
   * Fazer upload de todos os arquivos
   */
  const handleUpload = useCallback(async () => {
    if (files.length === 0 || !user) return

    try {
      setUploading(true)
      onUploadStart?.()

      // Upload paralelo de todos os arquivos
      const uploadPromises = files
        .filter(f => f.uploadStatus === 'pending')
        .map(file => uploadSingleFile(file))

      const results = await Promise.all(uploadPromises)
      const successfulUploads = results.filter(Boolean) as string[]

      // Chamar callback de sucesso
      if (successfulUploads.length > 0) {
        onUploadComplete?.(successfulUploads)
        toast.success(`${successfulUploads.length} foto(s) enviada(s) com sucesso!`)
      }

      // Verificar se todos os uploads foram bem-sucedidos
      const allCompleted = files.every(f => f.uploadStatus === 'completed')
      if (allCompleted) {
        setTimeout(() => {
          resetForm()
          setIsOpen(false)
        }, 2000)
      }

    } catch (error) {
      console.error('Erro no upload:', error)
      toast.error('Erro no upload das fotos')
    } finally {
      setUploading(false)
    }
  }, [files, user, uploadSingleFile, onUploadStart, onUploadComplete])

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
    setUploading(false)
    
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [files])

  const getOverallProgress = () => {
    if (files.length === 0) return 0
    const totalProgress = files.reduce((sum, file) => sum + (file.uploadProgress || 0), 0)
    return Math.round(totalProgress / files.length)
  }

  const completedCount = files.filter(f => f.uploadStatus === 'completed').length
  const errorCount = files.filter(f => f.uploadStatus === 'error').length

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
          <Upload className="w-4 h-4 mr-2" />
          Upload Direto
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <ImageIcon className="w-5 h-5" />
            <span>Upload Direto - Supabase Storage</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
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
              Máximo: {maxFiles} fotos • 10MB por foto • Upload direto para Storage
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
          </div>

          {/* Progress geral */}
          {uploading && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Enviando {files.length} foto(s)...
                </span>
                <span className="text-sm text-gray-600">
                  {completedCount}/{files.length}
                </span>
              </div>
              <Progress value={getOverallProgress()} className="h-2" />
            </div>
          )}

          {/* Preview das fotos com progress individual */}
          {files.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-medium">Fotos Selecionadas</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {files.map(file => (
                  <div key={file.id} className="relative group">
                    <img
                      src={file.preview}
                      alt={file.file.name}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    
                    {/* Status overlay */}
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      {file.uploadStatus === 'pending' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => removeFile(file.id!)}
                          disabled={uploading}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      )}
                      {file.uploadStatus === 'uploading' && (
                        <div className="text-white text-center">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-1" />
                          <span className="text-xs">{file.uploadProgress}%</span>
                        </div>
                      )}
                      {file.uploadStatus === 'completed' && (
                        <CheckCircle className="w-6 h-6 text-green-500" />
                      )}
                      {file.uploadStatus === 'error' && (
                        <AlertCircle className="w-6 h-6 text-red-500" />
                      )}
                    </div>

                    {/* Progress bar para uploads em andamento */}
                    {file.uploadStatus === 'uploading' && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 rounded-b-lg overflow-hidden">
                        <div 
                          className="h-full bg-purple-500 transition-all duration-300"
                          style={{ width: `${file.uploadProgress || 0}%` }}
                        />
                      </div>
                    )}

                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b-lg truncate">
                      {file.file.name}
                    </div>
                  </div>
                ))}
              </div>

              {/* Status summary */}
              {(completedCount > 0 || errorCount > 0) && (
                <div className="flex items-center justify-between text-sm">
                  {completedCount > 0 && (
                    <span className="text-green-600">
                      ✅ {completedCount} sucesso(s)
                    </span>
                  )}
                  {errorCount > 0 && (
                    <span className="text-red-600">
                      ❌ {errorCount} erro(s)
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between pt-4">
            <Button 
              variant="outline" 
              onClick={resetForm}
              disabled={uploading}
            >
              Limpar Tudo
            </Button>
            
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setIsOpen(false)}
                disabled={uploading}
              >
                {uploading ? 'Aguarde...' : 'Cancelar'}
              </Button>
              <Button 
                onClick={handleUpload}
                disabled={files.length === 0 || uploading || files.every(f => f.uploadStatus !== 'pending')}
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
                    Upload Direto
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
