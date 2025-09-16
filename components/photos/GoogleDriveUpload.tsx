'use client'

import React, { useState, useRef, useCallback } from 'react'
import { useAuth } from '@/contexts/local-auth-context'
import { useGoogleDrive } from '@/hooks/use-google-drive'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
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
  Upload, 
  X, 
  Image as ImageIcon, 
  Camera,
  CheckCircle,
  AlertCircle,
  Loader2,
  ExternalLink,
  FolderOpen
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface GoogleDriveUploadProps {
  onUploadComplete?: (photo: any) => void
  onUploadStart?: () => void
  trigger?: React.ReactNode
}

interface FileWithPreview extends File {
  preview?: string
  id?: string
}

export function GoogleDriveUpload({ 
  onUploadComplete,
  onUploadStart,
  trigger
}: GoogleDriveUploadProps) {
  const { user, signInWithGoogle } = useAuth()
  const { uploadPhoto, uploading, hasGoogleDriveAccess, checkAccess } = useGoogleDrive()
  
  const [isOpen, setIsOpen] = useState(false)
  const [file, setFile] = useState<FileWithPreview | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [description, setDescription] = useState('')
  const [uploadResult, setUploadResult] = useState<any>(null)
  const [needsReauth, setNeedsReauth] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)

  /**
   * Validar arquivo de imagem
   */
  const validateFile = useCallback((file: File): string | null => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp']
    if (!allowedTypes.includes(file.type)) {
      return 'Tipo de arquivo não suportado. Use JPEG, PNG, WebP, GIF ou BMP.'
    }

    const maxSize = 15 * 1024 * 1024 // 15MB (Google Drive é mais generoso)
    if (file.size > maxSize) {
      return 'Arquivo muito grande. Máximo 15MB permitido.'
    }

    return null
  }, [])

  /**
   * Processar arquivo selecionado
   */
  const processFile = useCallback(async (selectedFile: File) => {
    const error = validateFile(selectedFile)
    if (error) {
      toast.error(error)
      return
    }

    const fileWithPreview = selectedFile as FileWithPreview
    fileWithPreview.id = `${Date.now()}-${Math.random()}`
    
    try {
      fileWithPreview.preview = URL.createObjectURL(selectedFile)
      setFile(fileWithPreview)
    } catch (err) {
      console.warn('Erro ao criar preview:', err)
      toast.error('Erro ao processar arquivo')
    }
  }, [validateFile])

  /**
   * Handle drag & drop
   */
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)

    const droppedFiles = Array.from(e.dataTransfer.files)
    if (droppedFiles.length > 0) {
      processFile(droppedFiles[0])
    }
  }, [processFile])

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
    if (selectedFiles && selectedFiles.length > 0) {
      processFile(selectedFiles[0])
    }
  }, [processFile])

  /**
   * Remover arquivo
   */
  const removeFile = useCallback(() => {
    if (file?.preview) {
      URL.revokeObjectURL(file.preview)
    }
    setFile(null)
  }, [file])

  /**
   * Verificar acesso ao Google Drive
   */
  const handleCheckAccess = useCallback(async () => {
    const hasAccess = await checkAccess()
    if (!hasAccess) {
      setNeedsReauth(true)
      toast.warning('É necessário autorizar o acesso ao Google Drive')
    }
    return hasAccess
  }, [checkAccess])

  /**
   * Reautenticar com Google Drive
   */
  const handleReauth = useCallback(async () => {
    try {
      toast.info('Redirecionando para autorização do Google Drive...')
      await signInWithGoogle()
    } catch (error) {
      console.error('Erro na reautenticação:', error)
      toast.error('Erro ao autorizar Google Drive')
    }
  }, [signInWithGoogle])

  /**
   * Fazer upload
   */
  const handleUpload = useCallback(async () => {
    if (!file || !user) return

    const hasAccess = await handleCheckAccess()
    if (!hasAccess) {
      return
    }

    try {
      onUploadStart?.()
      
      const result = await uploadPhoto(file, description)
      
      if (result.needsReauth) {
        setNeedsReauth(true)
        return
      }

      if (result.success && result.photo) {
        setUploadResult(result.photo)
        onUploadComplete?.(result.photo)
        
        // Fechar diálogo após um tempo
        setTimeout(() => {
          resetForm()
          setIsOpen(false)
        }, 2000)
      } else {
        toast.error(result.error || 'Erro no upload')
      }
    } catch (error) {
      console.error('Erro no upload:', error)
      toast.error('Erro interno no upload')
    }
  }, [file, user, description, uploadPhoto, onUploadStart, onUploadComplete, handleCheckAccess])

  /**
   * Resetar formulário
   */
  const resetForm = useCallback(() => {
    if (file?.preview) {
      URL.revokeObjectURL(file.preview)
    }
    
    setFile(null)
    setDescription('')
    setUploadResult(null)
    setNeedsReauth(false)
    
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [file])

  // Default trigger
  const defaultTrigger = (
    <Button className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600">
      <FolderOpen className="w-4 h-4 mr-2" />
      Salvar no Drive
    </Button>
  )

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FolderOpen className="w-5 h-5" />
            <span>Salvar no Google Drive</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status de autorização */}
          {needsReauth && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-yellow-800 mb-2">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">Autorização Necessária</span>
              </div>
              <p className="text-sm text-yellow-700 mb-3">
                Para salvar fotos em seu Google Drive, é necessário autorizar o acesso.
              </p>
              <Button 
                size="sm" 
                onClick={handleReauth}
                className="bg-yellow-600 hover:bg-yellow-700"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Autorizar Google Drive
              </Button>
            </div>
          )}

          {/* Drop Zone */}
          {!file && !needsReauth && (
            <div
              ref={dropZoneRef}
              className={cn(
                'border-2 border-dashed border-gray-300 rounded-lg p-8 text-center transition-colors',
                dragActive && 'border-blue-500 bg-blue-50'
              )}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-700 mb-2">
                Arraste uma foto aqui ou clique para selecionar
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Suporte: JPEG, PNG, WebP, GIF, BMP • Máximo: 15MB
              </p>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              <Button 
                type="button"
                variant="outline" 
                onClick={() => fileInputRef.current?.click()}
              >
                Selecionar Arquivo
              </Button>
            </div>
          )}

          {/* Preview da foto */}
          {file && (
            <div className="space-y-4">
              <h4 className="font-medium">Foto Selecionada</h4>
              <div className="relative group">
                <img
                  src={file.preview}
                  alt={file.name}
                  className="w-full h-64 object-cover rounded-lg"
                />
                <button
                  onClick={removeFile}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-sm p-3 rounded-b-lg">
                  <div className="font-medium truncate">{file.name}</div>
                  <div className="text-xs text-gray-300">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Descrição (opcional)
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Adicione uma descrição para sua foto..."
                  rows={3}
                  maxLength={500}
                />
                <div className="text-xs text-gray-500 mt-1">
                  {description.length}/500 caracteres
                </div>
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {uploading && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Salvando no Google Drive...</span>
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
              <Progress value={undefined} className="h-2" />
            </div>
          )}

          {/* Upload Result */}
          {uploadResult && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-green-800 mb-2">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Foto salva com sucesso!</span>
              </div>
              <p className="text-sm text-green-700 mb-3">
                Sua foto foi salva na pasta "Orkut" do seu Google Drive.
              </p>
              <Button 
                size="sm"
                variant="outline"
                onClick={() => window.open(uploadResult.webViewLink, '_blank')}
                className="bg-green-100 border-green-300 text-green-800 hover:bg-green-200"
              >
                <ExternalLink className="w-3 h-3 mr-2" />
                Ver no Drive
              </Button>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between pt-4">
            <Button 
              variant="outline" 
              onClick={resetForm}
              disabled={uploading}
            >
              Limpar
            </Button>
            
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setIsOpen(false)}
                disabled={uploading}
              >
                Cancelar
              </Button>
              
              {file && !needsReauth && (
                <Button 
                  onClick={handleUpload}
                  disabled={uploading}
                  className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Salvar no Drive
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Info sobre Google Drive */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-700">
              <strong>📁 Como funciona:</strong> Sua foto será salva na pasta "Orkut" do seu Google Drive 
              com permissão pública para visualização. Você mantém total controle sobre o arquivo.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
