'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  ExternalLink, 
  RefreshCw, 
  Camera,
  Home,
  Upload,
  Folder,
  User,
  LogIn,
  Eye,
  EyeOff
} from 'lucide-react'

interface PostImagesIntegrationProps {
  className?: string
}

type ViewMode = 'login' | 'files' | 'upload'

export default function PostImagesIntegration({ className = '' }: PostImagesIntegrationProps) {
  const [currentView, setCurrentView] = useState<ViewMode>('login')
  const [isLoading, setIsLoading] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // URLs do PostImages
  const urls = {
    login: 'https://postimages.org/login',
    files: 'https://postimg.cc/files',
    upload: 'https://postimages.org/'
  }

  const getCurrentUrl = () => {
    return urls[currentView]
  }

  const handleIframeLoad = () => {
    setIsLoading(false)
  }

  const refreshIframe = () => {
    setIsLoading(true)
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src
    }
  }

  const openInNewTab = () => {
    window.open(getCurrentUrl(), '_blank')
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  // Tentar detectar mudanças no iframe e sugerir mudança para Files
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // PostImages pode não enviar messages, mas tentamos capturar
      if (event.origin === 'https://postimages.org' || event.origin === 'https://postimg.cc') {
        console.log('Message from PostImages:', event.data)
      }
    }

    // Detectar possível login através de mudanças na URL (limitado)
    const checkLoginStatus = () => {
      // Se está na página de login, mostrar dica após algum tempo
      if (currentView === 'login') {
        const timer = setTimeout(() => {
          // Mostrar toast ou notificação sugerindo ir para Files
          console.log('💡 Dica: Após fazer login, clique em "Files" para ver suas fotos!')
        }, 10000) // 10 segundos
        
        return () => clearTimeout(timer)
      }
    }

    window.addEventListener('message', handleMessage)
    const cleanupTimer = checkLoginStatus()
    
    return () => {
      window.removeEventListener('message', handleMessage)
      if (cleanupTimer) cleanupTimer()
    }
  }, [currentView])

  const containerClass = isFullscreen 
    ? 'fixed inset-0 z-50 bg-white' 
    : `${className} bg-white rounded-lg shadow-lg`

  return (
    <div className={containerClass}>
      {/* Toolbar */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-3 rounded-t-lg flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center space-x-2">
          <Camera className="w-5 h-5" />
          <span className="font-semibold">PostImages Integration</span>
          {isLoading && <RefreshCw className="w-4 h-4 animate-spin ml-2" />}
        </div>

        <div className="flex items-center space-x-2 flex-wrap">
          {/* Seletores de página */}
          <div className="flex bg-white/20 rounded-md p-1 space-x-1">
            <Button
              size="sm"
              variant={currentView === 'login' ? 'secondary' : 'ghost'}
              className={`text-xs h-7 ${currentView === 'login' ? 'bg-white text-purple-600' : 'text-white hover:bg-white/20'}`}
              onClick={() => setCurrentView('login')}
            >
              <LogIn className="w-3 h-3 mr-1" />
              Login
            </Button>
            <Button
              size="sm"
              variant={currentView === 'files' ? 'secondary' : 'ghost'}
              className={`text-xs h-7 ${currentView === 'files' ? 'bg-white text-purple-600' : 'text-white hover:bg-white/20'}`}
              onClick={() => setCurrentView('files')}
            >
              <Folder className="w-3 h-3 mr-1" />
              Files
            </Button>
            <Button
              size="sm"
              variant={currentView === 'upload' ? 'secondary' : 'ghost'}
              className={`text-xs h-7 ${currentView === 'upload' ? 'bg-white text-purple-600' : 'text-white hover:bg-white/20'}`}
              onClick={() => setCurrentView('upload')}
            >
              <Upload className="w-3 h-3 mr-1" />
              Upload
            </Button>
          </div>

          {/* Controles */}
          <div className="flex space-x-1">
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/20 h-7 w-7 p-0"
              onClick={refreshIframe}
              title="Refresh"
            >
              <RefreshCw className="w-3 h-3" />
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/20 h-7 w-7 p-0"
              onClick={openInNewTab}
              title="Open in new tab"
            >
              <ExternalLink className="w-3 h-3" />
            </Button>

            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/20 h-7 w-7 p-0"
              onClick={toggleFullscreen}
              title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10 rounded-lg">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-purple-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Carregando PostImages...</p>
          </div>
        </div>
      )}

      {/* Info card - apenas quando não está em tela cheia */}
      {!isFullscreen && (
        <div className="p-4 bg-blue-50 border-b">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Camera className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-blue-900 mb-1">
                Como usar a integração PostImages
              </h3>
              <div className="text-xs text-blue-700 space-y-1">
                <p><strong>1.</strong> Clique em "Login" e faça login na sua conta PostImages</p>
                <p><strong>2.</strong> Após login, clique em "Files" para ver suas fotos</p>
                <p><strong>3.</strong> Use "Upload" para fazer upload de novas fotos</p>
                <p className="text-blue-600 mt-2">
                  💡 <em>Dica: Use o botão de tela cheia para melhor experiência</em>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* URL display */}
      <div className="px-4 py-2 bg-gray-50 border-b text-xs text-gray-600 font-mono">
        📍 {getCurrentUrl()}
      </div>

      {/* Iframe container */}
      <div className="relative flex-1" style={{ height: isFullscreen ? 'calc(100vh - 140px)' : '600px' }}>
        <iframe
          ref={iframeRef}
          src={getCurrentUrl()}
          className="w-full h-full border-none"
          onLoad={handleIframeLoad}
          title="PostImages Integration"
          sandbox="allow-same-origin allow-scripts allow-forms allow-top-navigation"
        />
      </div>

      {/* Footer info */}
      {!isFullscreen && (
        <div className="p-3 bg-gray-50 rounded-b-lg border-t">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-4">
              <span>🔗 Integração PostImages.org</span>
              <span>📱 Responsivo</span>
              <span>🔒 Sandbox seguro</span>
            </div>
            <div className="text-right">
              <p>Desenvolvido para Orkut BR</p>
            </div>
          </div>
        </div>
      )}

      {/* Exit fullscreen overlay */}
      {isFullscreen && (
        <div className="absolute top-4 right-4">
          <Button
            size="sm"
            variant="secondary"
            onClick={toggleFullscreen}
            className="shadow-lg"
          >
            <EyeOff className="w-4 h-4 mr-2" />
            Sair da Tela Cheia
          </Button>
        </div>
      )}
    </div>
  )
}
