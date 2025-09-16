'use client'

import React, { useState, useCallback } from 'react'
import { useAuth } from '@/contexts/local-auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { OrkutCard, OrkutCardContent, OrkutCardHeader } from '@/components/ui/orkut-card'
import { Badge } from '@/components/ui/badge'
import { 
  Link2, 
  Instagram, 
  Facebook, 
  Globe,
  Camera,
  Loader2,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Import,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface SocialMediaImportProps {
  onImportComplete?: (photos: any[]) => void
  className?: string
}

interface SocialLink {
  url: string
  platform: 'google-photos' | 'facebook' | 'instagram' | 'other'
  title?: string
  description?: string
}

interface ImportedPhoto {
  id: string
  url: string
  thumbnail_url?: string
  title: string
  description?: string
  platform: string
  originalUrl: string
  imported_at: string
}

export function SocialMediaImport({ onImportComplete, className }: SocialMediaImportProps) {
  const { user } = useAuth()
  const [inputUrl, setInputUrl] = useState('')
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([])
  const [importing, setImporting] = useState(false)
  const [importResults, setImportResults] = useState<ImportedPhoto[]>([])
  const [showResults, setShowResults] = useState(false)

  // Detectar plataforma baseado na URL
  const detectPlatform = useCallback((url: string): SocialLink['platform'] => {
    const lowercaseUrl = url.toLowerCase()
    
    if (lowercaseUrl.includes('photos.google.com') || lowercaseUrl.includes('photos.app.goo.gl')) {
      return 'google-photos'
    }
    if (lowercaseUrl.includes('facebook.com') || lowercaseUrl.includes('fb.com')) {
      return 'facebook'
    }
    if (lowercaseUrl.includes('instagram.com') || lowercaseUrl.includes('instagr.am')) {
      return 'instagram'
    }
    
    return 'other'
  }, [])

  // Validar URL
  const validateUrl = useCallback((url: string): boolean => {
    try {
      const urlObj = new URL(url)
      return ['http:', 'https:'].includes(urlObj.protocol)
    } catch {
      return false
    }
  }, [])

  // Adicionar link à lista
  const addSocialLink = useCallback(() => {
    if (!inputUrl.trim()) {
      toast.error('Por favor, insira um link válido')
      return
    }

    if (!validateUrl(inputUrl)) {
      toast.error('URL inválida. Certifique-se de incluir http:// ou https://')
      return
    }

    const platform = detectPlatform(inputUrl)
    const newLink: SocialLink = {
      url: inputUrl.trim(),
      platform,
      title: `Link do ${platform === 'google-photos' ? 'Google Photos' : platform === 'facebook' ? 'Facebook' : platform === 'instagram' ? 'Instagram' : 'Web'}`
    }

    // Verificar se o link já foi adicionado
    if (socialLinks.some(link => link.url === newLink.url)) {
      toast.warning('Este link já foi adicionado')
      return
    }

    setSocialLinks(prev => [...prev, newLink])
    setInputUrl('')
    toast.success('Link adicionado!')
  }, [inputUrl, socialLinks, validateUrl, detectPlatform])

  // Remover link da lista
  const removeSocialLink = useCallback((url: string) => {
    setSocialLinks(prev => prev.filter(link => link.url !== url))
  }, [])

  // Limpar tudo
  const clearAll = useCallback(() => {
    setSocialLinks([])
    setInputUrl('')
    setImportResults([])
    setShowResults(false)
  }, [])

  // Importar fotos de todos os links
  const importPhotos = useCallback(async () => {
    if (socialLinks.length === 0) {
      toast.error('Adicione pelo menos um link antes de importar')
      return
    }

    if (!user) {
      toast.error('Você precisa estar logado para importar fotos')
      return
    }

    setImporting(true)
    setShowResults(false)
    const allImportedPhotos: ImportedPhoto[] = []

    try {
      for (const link of socialLinks) {
        toast.info(`Importando fotos de ${link.platform}...`)
        
        const response = await fetch('/api/social-media-import', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: link.url,
            platform: link.platform,
            title: link.title,
            description: link.description
          })
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || `Erro ao importar de ${link.platform}`)
        }

        if (result.photos && result.photos.length > 0) {
          allImportedPhotos.push(...result.photos)
          toast.success(`${result.photos.length} foto(s) importada(s) de ${link.platform}`)
        } else {
          toast.warning(`Nenhuma foto encontrada em ${link.url}`)
        }
      }

      if (allImportedPhotos.length > 0) {
        setImportResults(allImportedPhotos)
        setShowResults(true)
        onImportComplete?.(allImportedPhotos)
        
        toast.success(`Total: ${allImportedPhotos.length} fotos importadas com sucesso!`)
        
        // Limpar links após importação bem-sucedida
        setTimeout(() => {
          setSocialLinks([])
        }, 2000)
      } else {
        toast.warning('Nenhuma foto foi importada. Verifique se os links contêm fotos públicas.')
      }

    } catch (error) {
      console.error('Erro na importação:', error)
      toast.error(error instanceof Error ? error.message : 'Erro desconhecido na importação')
    } finally {
      setImporting(false)
    }
  }, [socialLinks, user, onImportComplete])

  // Ícone da plataforma
  const getPlatformIcon = (platform: SocialLink['platform']) => {
    switch (platform) {
      case 'google-photos':
        return <Camera className="w-4 h-4" />
      case 'facebook':
        return <Facebook className="w-4 h-4" />
      case 'instagram':
        return <Instagram className="w-4 h-4" />
      default:
        return <Globe className="w-4 h-4" />
    }
  }

  // Cor da badge da plataforma
  const getPlatformColor = (platform: SocialLink['platform']) => {
    switch (platform) {
      case 'google-photos':
        return 'bg-blue-100 text-blue-800'
      case 'facebook':
        return 'bg-blue-100 text-blue-800'
      case 'instagram':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className={className}>
      <OrkutCard>
        <OrkutCardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Import className="w-5 h-5 text-purple-500" />
              <h3 className="text-lg font-medium">Importar de Redes Sociais</h3>
            </div>
            <div className="flex items-center space-x-2">
              {socialLinks.length > 0 && (
                <Badge variant="outline">
                  {socialLinks.length} link{socialLinks.length !== 1 ? 's' : ''}
                </Badge>
              )}
              {socialLinks.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAll}
                  disabled={importing}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </OrkutCardHeader>
        
        <OrkutCardContent className="space-y-4">
          {/* Instruções */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Link2 className="w-5 h-5 text-purple-600" />
              <h4 className="font-medium text-purple-800">Como Importar</h4>
            </div>
            <div className="text-sm text-purple-700 space-y-1">
              <p>📸 <strong>Google Photos:</strong> {` https://photos.app.goo.gl/DAKV2gftsTfQVtxV9`}</p>
              <p>📘 <strong>Facebook:</strong> {` https://www.facebook.com/usuario/photos`}</p>
              <p>📱 <strong>Instagram:</strong> {` https://www.instagram.com/usuario/`}</p>
              <p className="text-xs mt-2 opacity-75">
                💡 Apenas fotos públicas podem ser importadas
              </p>
            </div>
          </div>

          {/* Input para adicionar links */}
          <div className="flex space-x-2">
            <Input
              placeholder="Cole o link da rede social aqui..."
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addSocialLink()
                }
              }}
              disabled={importing}
              className="flex-1"
            />
            <Button 
              onClick={addSocialLink}
              disabled={importing || !inputUrl.trim()}
              variant="outline"
            >
              <Link2 className="w-4 h-4 mr-2" />
              Adicionar
            </Button>
          </div>

          {/* Lista de links adicionados */}
          {socialLinks.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Links para Importar:</h4>
              <div className="space-y-2">
                {socialLinks.map((link, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between bg-white border rounded-lg p-3"
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <Badge 
                        variant="secondary" 
                        className={cn("flex items-center space-x-1", getPlatformColor(link.platform))}
                      >
                        {getPlatformIcon(link.platform)}
                        <span className="capitalize">{link.platform.replace('-', ' ')}</span>
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{link.title}</p>
                        <p className="text-xs text-gray-500 truncate">{link.url}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(link.url, '_blank')}
                        disabled={importing}
                        title="Abrir link"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSocialLink(link.url)}
                        disabled={importing}
                        title="Remover"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Botão de importar */}
          {socialLinks.length > 0 && (
            <div className="flex justify-center pt-2">
              <Button 
                onClick={importPhotos}
                disabled={importing}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
              >
                {importing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importando Fotos...
                  </>
                ) : (
                  <>
                    <Import className="w-4 h-4 mr-2" />
                    Importar {socialLinks.length === 1 ? '1 Link' : `${socialLinks.length} Links`}
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Resultados da importação */}
          {showResults && importResults.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h4 className="font-medium text-green-800">
                  Importação Concluída!
                </h4>
              </div>
              <p className="text-sm text-green-700 mb-3">
                {importResults.length} foto{importResults.length !== 1 ? 's' : ''} importada{importResults.length !== 1 ? 's' : ''} com sucesso!
              </p>
              
              {/* Preview das fotos importadas */}
              <div className="grid grid-cols-6 gap-2 mb-3">
                {importResults.slice(0, 6).map((photo, index) => (
                  <div key={photo.id} className="relative">
                    <img
                      src={photo.thumbnail_url || photo.url}
                      alt={photo.title}
                      className="w-full h-16 object-cover rounded"
                      loading="lazy"
                    />
                    {index === 5 && importResults.length > 6 && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 rounded flex items-center justify-center">
                        <span className="text-white text-xs font-bold">
                          +{importResults.length - 6}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="flex justify-between items-center">
                <div className="text-xs text-green-600">
                  As fotos aparecerão na galeria principal
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowResults(false)}
                >
                  Fechar
                </Button>
              </div>
            </div>
          )}

          {/* Status de importação */}
          {importing && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                <h4 className="font-medium text-blue-800">Importando Fotos...</h4>
              </div>
              <p className="text-sm text-blue-700">
                Processando {socialLinks.length} link{socialLinks.length !== 1 ? 's' : ''}. 
                Isso pode levar alguns minutos.
              </p>
            </div>
          )}

          {/* Informações adicionais */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-gray-500 mt-0.5" />
              <div className="text-xs text-gray-600 space-y-1">
                <p><strong>📍 Importante:</strong> Apenas fotos com visibilidade pública podem ser importadas.</p>
                <p><strong>⚡ Performance:</strong> A importação pode ser lenta dependendo da quantidade de fotos.</p>
                <p><strong>🔄 Atualização:</strong> Use o botão &quot;Atualizar&quot; na galeria para ver as novas fotos.</p>
              </div>
            </div>
          </div>
        </OrkutCardContent>
      </OrkutCard>
    </div>
  )
}
