'use client'

import React, { useState, useRef, useCallback } from 'react'
import { useAuth } from '@/contexts/enhanced-auth-context'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { OrkutCard, OrkutCardContent, OrkutCardHeader } from '@/components/ui/orkut-card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Upload, 
  X, 
  Image as ImageIcon, 
  Camera,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface PhotoUploadProps {
  onUploadComplete?: (photos: any[]) => void
  onUploadStart?: () => void
  maxFiles?: number
  categories?: string[]
}

interface FileWithPreview extends File {
  preview?: string
  id?: string
}

interface UploadProgress {
  total: number
  completed: number
  current?: string
  status: 'idle' | 'uploading' | 'completed' | 'error'
}

const DEFAULT_CATEGORIES = [
  'tecnologia', 'lifestyle', 'trabalho', 'familia', 'viagem',
  'natureza', 'arte', 'culinaria', 'festa', 'hobby'
]

export function PhotoUpload({ 
  onUploadComplete,
  onUploadStart,
  maxFiles = 10,
  categories = DEFAULT_CATEGORIES
}: PhotoUploadProps) {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [progress, setProgress] = useState<UploadProgress>({
    total: 0,
    completed: 0,
    status: 'idle'
  })
  const [uploadResults, setUploadResults] = useState<any[]>([])

  // Form data
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [isPublic, setIsPublic] = useState(true)

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
      const exists = files.some(f => f.name === file.name && f.size === file.size)
      if (exists) continue

      // Validar arquivo
      const error = validateFile(file)
      if (error) {
        console.warn(`Arquivo ${file.name} rejeitado: ${error}`)
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
      alert(`Máximo ${maxFiles} arquivos permitidos. ${allowedCount} arquivo(s) adicionado(s).`)
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
      // Limpar preview URL
      const fileToRemove = prev.find(f => f.id === fileId)
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview)
      }
      return updated
    })
  }, [])

  /**
   * Fazer upload
   */
  const handleUpload = useCallback(async () => {
    if (files.length === 0 || !user) return

    try {
      onUploadStart?.()
      setProgress({
        total: files.length,
        completed: 0,
        status: 'uploading'
      })

      const formData = new FormData()

      // Adicionar arquivos
      files.forEach(file => {
        formData.append('files', file)
      })

      // Adicionar metadados
      formData.append('title', title || 'Nova foto')
      formData.append('description', description || '')
      formData.append('category', category || '')
      formData.append('isPublic', isPublic.toString())

      // Obter token de autenticação
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('Sessão expirada')
      }

      const response = await fetch('/api/photos/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        body: formData
      })

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      
      setProgress({
        total: files.length,
        completed: result.summary.success,
        status: 'completed'
      })

      setUploadResults(result.results)

      // Chamar callback de sucesso
      if (result.summary.success > 0) {
        onUploadComplete?.(result.results.filter((r: any) => r.success))
      }

      // Limpar formulário se todo upload foi bem-sucedido
      if (result.summary.errors === 0) {
        setTimeout(() => {
          resetForm()
          setIsOpen(false)
        }, 2000)
      }

    } catch (error) {
      console.error('Erro no upload:', error)
      setProgress({
        total: files.length,
        completed: 0,
        status: 'error'
      })
    }
  }, [files, title, description, category, isPublic, user, onUploadStart, onUploadComplete])

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
    setCategory('')
    setIsPublic(true)
    setProgress({ total: 0, completed: 0, status: 'idle' })
    setUploadResults([])
    
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [files])

  // Render progress
  const renderProgress = () => {
    if (progress.status === 'idle') return null

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            {progress.status === 'uploading' && 'Enviando...'}
            {progress.status === 'completed' && 'Concluído!'}
            {progress.status === 'error' && 'Erro no upload'}
          </span>
          <span className="text-sm text-gray-600">
            {progress.completed}/{progress.total}
          </span>
        </div>
        
        <Progress 
          value={(progress.completed / progress.total) * 100} 
          className="h-2"
        />

        {progress.status === 'completed' && uploadResults.length > 0 && (
          <div className="space-y-2 mt-4">
            {uploadResults.map((result, idx) => (
              <div key={idx} className="flex items-center space-x-2 text-sm">
                {result.success ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-green-700">Upload realizado com sucesso</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span className="text-red-700">{result.error}</span>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
          <Upload className="w-4 h-4 mr-2" />
          Upload Foto
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Camera className="w-5 h-5" />
            <span>Upload de Fotos</span>
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
            <p className="text-sm text-gray-500">
              Suporte: JPEG, PNG, WebP, HEIC • Máximo: {maxFiles} fotos • Tamanho: 10MB por foto
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
              className="mt-4"
              onClick={() => fileInputRef.current?.click()}
            >
              Selecionar Arquivos
            </Button>
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
            <OrkutCard>
              <OrkutCardHeader>
                <span>Informações das Fotos</span>
              </OrkutCardHeader>
              <OrkutCardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Título (opcional)
                  </label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Minha nova foto"
                    maxLength={100}
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
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Categoria (opcional)
                  </label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>
                          {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="isPublic" className="text-sm">
                    Tornar fotos públicas (visíveis para todos)
                  </label>
                </div>
              </OrkutCardContent>
            </OrkutCard>
          )}

          {/* Progress */}
          {renderProgress()}

          {/* Actions */}
          <div className="flex justify-between pt-4">
            <Button 
              variant="outline" 
              onClick={resetForm}
              disabled={progress.status === 'uploading'}
            >
              Limpar Tudo
            </Button>
            
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setIsOpen(false)}
                disabled={progress.status === 'uploading'}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleUpload}
                disabled={files.length === 0 || progress.status === 'uploading'}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                {progress.status === 'uploading' ? (
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
