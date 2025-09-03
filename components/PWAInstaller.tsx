'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, X, Smartphone, Monitor } from 'lucide-react'

interface PWAInstallerProps {
  onInstall?: () => void
  onDismiss?: () => void
}

export function PWAInstaller({ onInstall, onDismiss }: PWAInstallerProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Detectar iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent)
    setIsIOS(isIOSDevice)

    // Detectar se já está em modo standalone
    const isInStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                          (window.navigator as any).standalone === true
    setIsStandalone(isInStandalone)

    // Registrar Service Worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/'
          })
          
          console.log('✅ Service Worker registrado:', registration.scope)

          // Verificar por updates
          registration.addEventListener('updatefound', () => {
            console.log('🔄 Nova versão do Service Worker disponível')
          })

        } catch (error) {
          console.error('❌ Falha ao registrar Service Worker:', error)
        }
      })
    }

    // Event listener para prompt de instalação
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('📱 PWA pode ser instalado')
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstallPrompt(true)
    }

    // Event listener para quando o app é instalado
    const handleAppInstalled = () => {
      console.log('🎉 PWA foi instalado')
      setIsInstalled(true)
      setShowInstallPrompt(false)
      setDeferredPrompt(null)
      onInstall?.()
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    // Cleanup
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [onInstall])

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        console.log('✅ Usuário aceitou instalar o PWA')
      } else {
        console.log('❌ Usuário recusou instalar o PWA')
      }
      
      setDeferredPrompt(null)
      setShowInstallPrompt(false)
    }
  }

  const handleDismiss = () => {
    setShowInstallPrompt(false)
    onDismiss?.()
  }

  // Não mostrar se já está instalado ou em standalone
  if (isInstalled || isStandalone) {
    return null
  }

  // Prompt específico para iOS
  if (isIOS && !showInstallPrompt) {
    return (
      <div className="fixed bottom-4 left-4 right-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 rounded-lg shadow-lg z-50 md:left-auto md:right-4 md:max-w-sm">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center mb-2">
              <Smartphone className="w-5 h-5 mr-2" />
              <h3 className="font-semibold text-sm">Instalar Orkut BR</h3>
            </div>
            <p className="text-xs opacity-90 mb-3">
              Adicione à tela inicial para uma experiência completa de app nativo!
            </p>
            <div className="text-xs space-y-1 opacity-80">
              <div>1. Toque no ícone compartilhar ↗️</div>
              <div>2. Selecione "Adicionar à Tela de Início"</div>
              <div>3. Toque em "Adicionar"</div>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="ml-2 p-1 hover:bg-white/20 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  // Prompt padrão para outros navegadores
  if (showInstallPrompt && deferredPrompt) {
    return (
      <div className="fixed bottom-4 left-4 right-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 rounded-lg shadow-lg z-50 md:left-auto md:right-4 md:max-w-sm">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center mb-2">
              <Monitor className="w-5 h-5 mr-2" />
              <h3 className="font-semibold text-sm">Instalar Orkut BR</h3>
            </div>
            <p className="text-xs opacity-90 mb-3">
              Instale o Orkut BR no seu dispositivo para acesso rápido e experiência offline!
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={handleInstallClick}
                className="flex-1 bg-white/20 hover:bg-white/30 border-none"
              >
                <Download className="w-4 h-4 mr-1" />
                Instalar
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDismiss}
                className="px-3 hover:bg-white/20 text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}

// Hook para verificar status PWA
export function usePWAStatus() {
  const [isInstalled, setIsInstalled] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [canInstall, setCanInstall] = useState(false)

  useEffect(() => {
    // Verificar se está em modo standalone
    const checkStandalone = () => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                        (window.navigator as any).standalone === true
      setIsStandalone(standalone)
      setIsInstalled(standalone)
    }

    checkStandalone()

    // Listener para mudanças
    window.addEventListener('beforeinstallprompt', () => setCanInstall(true))
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true)
      setCanInstall(false)
    })

  }, [])

  return { isInstalled, isStandalone, canInstall }
}
