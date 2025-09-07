'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, Wifi, WifiOff, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface OfflineStatusIndicatorProps {
  className?: string
}

export function OfflineStatusIndicator({ className = '' }: OfflineStatusIndicatorProps) {
  const [isOnline, setIsOnline] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Atualizar relógio a cada segundo
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Monitorar status online/offline
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setLastUpdate(new Date())
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    // Verificar status inicial
    setIsOnline(navigator.onLine)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Função para recarregar a página
  const handleRefresh = () => {
    setIsRefreshing(true)
    window.location.reload()
  }

  // Calcular tempo desde última atualização
  const timeSinceUpdate = formatDistanceToNow(lastUpdate, {
    addSuffix: true,
    locale: ptBR
  })

  // Determinar se está desatualizado (mais de 5 minutos)
  const isStale = (currentTime.getTime() - lastUpdate.getTime()) > 5 * 60 * 1000

  if (isOnline && !isStale) {
    return null // Não mostrar nada quando online e atualizado
  }

  return (
    <div className={`bg-yellow-500 text-white text-xs py-1 px-2 flex items-center justify-between ${className}`}>
      <div className="flex items-center space-x-2">
        {/* Status Icon */}
        {!isOnline ? (
          <WifiOff className="h-3 w-3 text-red-200" />
        ) : (
          <Wifi className="h-3 w-3 text-yellow-200" />
        )}

        {/* Status Text */}
        <span className="font-medium">
          {!isOnline ? 'Modo Offline' : 'Dados Desatualizados'}
        </span>

        {/* Separator */}
        <span className="text-yellow-200">•</span>

        {/* Current Time Clock */}
        <div className="flex items-center space-x-1">
          <Clock className="h-3 w-3" />
          <span className="font-mono">
            {currentTime.toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            })}
          </span>
        </div>

        {/* Separator */}
        <span className="text-yellow-200">•</span>

        {/* Last Update Counter */}
        <span className="text-yellow-100">
          Última atualização: {timeSinceUpdate}
        </span>

        {/* Warning Message */}
        <Badge variant="secondary" className="bg-yellow-600 text-yellow-100 text-xs">
          {!isOnline ? 'Sem conexão' : 'Dados antigos'}
        </Badge>
      </div>

      {/* Refresh Button */}
      <Button
        size="sm"
        variant="ghost"
        onClick={handleRefresh}
        disabled={isRefreshing}
        className="text-white hover:bg-yellow-600 h-6 px-2 py-0 text-xs"
        title="Recarregar página"
      >
        <RefreshCw className={`h-3 w-3 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
        Recarregar
      </Button>
    </div>
  )
}

// Hook customizado para detectar status de rede avançado
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [lastOnline, setLastOnline] = useState(new Date())
  const [connectionType, setConnectionType] = useState<string>('unknown')

  useEffect(() => {
    // Verificar se está online
    setIsOnline(navigator.onLine)

    // Detectar tipo de conexão se suportado
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      setConnectionType(connection.effectiveType || 'unknown')
      
      const updateConnectionInfo = () => {
        setConnectionType(connection.effectiveType || 'unknown')
      }
      
      connection.addEventListener('change', updateConnectionInfo)
    }

    const handleOnline = () => {
      setIsOnline(true)
      setLastOnline(new Date())
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return { isOnline, lastOnline, connectionType }
}
