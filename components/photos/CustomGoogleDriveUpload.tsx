'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { useAuth } from '@/contexts/enhanced-auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  FolderOpen,
  Settings,
  Link as LinkIcon,
  Copy,
  Check
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface CustomGoogleDriveUploadProps {
  onUploadComplete?: (photo: any) => void
  onUploadStart?: () => void
  trigger?: React.ReactNode
}

interface FileWithPreview extends File {
  preview?: string
  id?: string
}

interface DriveConfig {
  folderId: string
  folderName: string
  folderUrl: string
}

export function CustomGoogleDriveUpload({ 
  onUploadComplete,
  onUploadStart,
  trigger
}: CustomGoogleDriveUploadProps) {
  const { user } = useAuth()
  
  const [isOpen, setIsOpen] = useState(false)
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const [file, setFile] = useState<FileWithPreview | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [description, setDescription] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<any>(null)
  
  // Configuração da pasta personalizada
  const [driveConfig, setDriveConfig] = useState<DriveConfig | null>(null)
  const [folderUrl, setFolderUrl] = useState('')
  const [isValidatingUrl, setIsValidatingUrl] = useState(false)
  const [copied, setCopied] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)

  // Carregar configuração salva
  useEffect(() => {
    if (user) {
      const savedConfig = localStorage.getItem(`orkut-drive-config-${user.id}`)
      if (savedConfig) {
        try {
          setDriveConfig(JSON.parse(savedConfig))
        } catch (error) {
          console.error('Erro ao carregar configuração:', error)
        }
      }
    }
  }, [user])

  /**
   * Extrair ID da pasta do Google Drive a partir da URL
   */
  const extractFolderId = useCallback((url: string): string | null => {
    const patterns = [
      /\/folders\/([a-zA-Z0-9_-]+)/,
      /id=([a-zA-Z0-9_-]+)/,
      /\/drive\/folders\/([a-zA-Z0-9_-]+)/
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) {
        return match[1]
      }
    }

    return null
  }, [])

  /**
   * Validar e configurar pasta do Google Drive
   */
  const handleConfigureDrive = useCallback(async () => {
    if (!folderUrl.trim()) {
      toast.error('Por favor, insira o link da pasta')
      return
    }

    setIsValidatingUrl(true)
    
    try {
      const folderId = extractFolderId(folderUrl)
      if (!folderId) {
        toast.error('Link inválido. Use um link válido do Google Drive.')
        return
      }

      // Tentar validar a pasta (verificar se é acessível)
      const testUrl = `https://drive.google.com/uc?export=view&id=${folderId}`
      
      // Simular validação (em produção, você faria uma chamada real à API)
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const config: DriveConfig = {
        folderId,
        folderName: 'Pasta Personalizada',
        folderUrl: folderUrl.trim()
      }

      setDriveConfig(config)
      
      // Salvar no localStorage
      if (user) {
        localStorage.setItem(`orkut-drive-config-${user.id}`, JSON.stringify(config))
      }

      toast.success('✅ Pasta configurada com sucesso!')
      setIsConfigOpen(false)
      setFolderUrl('')
      
    } catch (error) {
      console.error('Erro na configuração:', error)
      toast.error('Erro ao validar a pasta. Verifique o link.')
    } finally {
      setIsValidatingUrl(false)
    }
  }, [folderUrl, extractFolderId, user])

  /**
   * Copiar link de exemplo
   */
  const copyExampleLink = useCallback(async () => {
    const exampleLink = 'https://drive.google.com/drive/folders/18j34IuC-KXX32J7B7IjWZQ-uqJO_ZhPB?usp=sharing'
    
    try {
      await navigator.clipboard.writeText(exampleLink)
      setCopied(true)
      toast.success('Link de exemplo copiado!')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Erro ao copiar link')
    }
  }, [])

  /**
   * Validar arquivo de imagem
   */
  const validateFile = useCallback((file: File): string | null => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp']
    if (!allowedTypes.includes(file.type)) {
      return 'Tipo de arquivo não suportado. Use JPEG, PNG, WebP, GIF ou BMP.'
    }

    const maxSize = 15 * 1024 * 1024 // 15MB
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
   * Simular upload (você implementaria a lógica real aqui)
   */
  const handleUpload = useCallback(async () => {
    if (!file || !user || !driveConfig) return

    setUploading(true)
    onUploadStart?.()
    
    try {
      // Simular upload para a pasta configurada
      toast.loading('📁 Salvando na sua pasta personalizada...', {
        id: 'upload-progress'
      })

      // Simular tempo de upload
      await new Promise(resolve => setTimeout(resolve, 2000))

      const mockResult = {
        id: `${Date.now()}-${Math.random()}`,
        filename: file.name,
        url: `https://drive.google.com/uc?export=view&id=${driveConfig.folderId}`,
        webViewLink: driveConfig.folderUrl,
        size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
        createdAt: new Date().toISOString(),
        description: description || 'Foto enviada via Orkut'
      }

      setUploadResult(mockResult)
      onUploadComplete?.(mockResult)

      toast.success('📁 Foto salva na sua pasta personalizada!', {
        id: 'upload-progress'
      })

      // Fechar diálogo após um tempo
      setTimeout(() => {
        resetForm()
        setIsOpen(false)
      }, 2000)

    } catch (error) {
      console.error('Erro no upload:', error)
      toast.error('Erro ao salvar foto', {
        id: 'upload-progress'
      })
    } finally {
      setUploading(false)
    }
  }, [file, user, driveConfig, description, onUploadStart, onUploadComplete])

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
    
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [file])

  /**
   * Limpar configuração
   */
  const clearConfig = useCallback(() => {
    setDriveConfig(null)
    if (user) {
      localStorage.removeItem(`orkut-drive-config-${user.id}`)
    }
    toast.success('Configuração removida')
  }, [user])

  // Default trigger
  const defaultTrigger = (
    <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
      <FolderOpen className="w-4 h-4 mr-2" />
      Minha Pasta Drive
    </Button>
  )

  return (
    <>
      {/* Dialog principal de upload */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          {trigger || defaultTrigger}
        </DialogTrigger>
        
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FolderOpen className="w-5 h-5" />
                <span>Salvar na Minha Pasta</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsConfigOpen(true)}
                className="text-gray-500 hover:text-gray-700"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Status da configuração */}
            {!driveConfig ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-yellow-800 mb-2">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">Configuração Necessária</span>
                </div>
                <p className="text-sm text-yellow-700 mb-3">
                  Configure primeiro sua pasta do Google Drive para salvar as fotos.
                </p>
                <Button 
                  size="sm" 
                  onClick={() => setIsConfigOpen(true)}
                  className="bg-yellow-600 hover:bg-yellow-700"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Configurar Pasta
                </Button>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-green-800">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Pasta Configurada</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsConfigOpen(true)}
                    className="text-green-600 hover:text-green-800"
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  Fotos serão salvas em: {driveConfig.folderName}
                </p>
              </div>
            )}

            {/* Drop Zone */}
            {!file && driveConfig && (
              <div
                ref={dropZoneRef}
                className={cn(
                  'border-2 border-dashed border-gray-300 rounded-lg p-8 text-center transition-colors',
                  dragActive && 'border-purple-500 bg-purple-50'
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
                  <span className="text-sm font-medium">Salvando na sua pasta...</span>
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
                  Sua foto foi salva na pasta configurada.
                </p>
                <Button 
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(driveConfig?.folderUrl, '_blank')}
                  className="bg-green-100 border-green-300 text-green-800 hover:bg-green-200"
                >
                  <ExternalLink className="w-3 h-3 mr-2" />
                  Ver Pasta
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
                
                {file && driveConfig && (
                  <Button 
                    onClick={handleUpload}
                    disabled={uploading}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Salvar na Pasta
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de configuração */}
      <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Settings className="w-5 h-5" />
              <span>Configurar Pasta do Drive</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Link da pasta do Google Drive
              </label>
              <Input
                value={folderUrl}
                onChange={(e) => setFolderUrl(e.target.value)}
                placeholder="https://drive.google.com/drive/folders/..."
                className="mb-2"
              />
              <p className="text-xs text-gray-500">
                Cole aqui o link de compartilhamento da sua pasta do Google Drive
              </p>
            </div>

            {/* Exemplo de link */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-700 font-medium mb-2">
                📝 Exemplo de link válido:
              </p>
              <div className="flex items-center space-x-2">
                <code className="text-xs bg-blue-100 px-2 py-1 rounded flex-1 truncate">
                  https://drive.google.com/drive/folders/18j34IuC-KXX32J7B7IjWZQ-uqJO_ZhPB
                </code>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={copyExampleLink}
                  className="flex-shrink-0"
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                </Button>
              </div>
            </div>

            {/* Instruções */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-xs text-gray-700 font-medium mb-1">
                💡 Como obter o link:
              </p>
              <ol className="text-xs text-gray-600 space-y-1 list-decimal list-inside">
                <li>Abra o Google Drive</li>
                <li>Crie ou escolha uma pasta</li>
                <li>Clique com botão direito → "Compartilhar"</li>
                <li>Configure como "Qualquer pessoa com o link pode ver"</li>
                <li>Copie o link e cole aqui</li>
              </ol>
            </div>

            {/* Configuração atual */}
            {driveConfig && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-green-800">
                    Configuração Atual
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={clearConfig}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
                <p className="text-xs text-green-700 truncate">
                  {driveConfig.folderUrl}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-between pt-4">
              <Button 
                variant="outline" 
                onClick={() => setIsConfigOpen(false)}
              >
                Cancelar
              </Button>
              
              <Button 
                onClick={handleConfigureDrive}
                disabled={isValidatingUrl || !folderUrl.trim()}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              >
                {isValidatingUrl ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Validando...
                  </>
                ) : (
                  <>
                    <LinkIcon className="w-4 h-4 mr-2" />
                    Configurar
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
