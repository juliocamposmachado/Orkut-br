'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/enhanced-auth-context'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Wifi, WifiOff, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

interface OnlineStatusToggleProps {
  isOwnProfile: boolean
  className?: string
}

export function OnlineStatusToggle({ isOwnProfile, className }: OnlineStatusToggleProps) {
  const { user } = useAuth()
  const [isOnline, setIsOnline] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)

  // Por padrão, quando o usuário loga ele fica online
  useEffect(() => {
    if (user && isOwnProfile) {
      // Marcar como online ao carregar o componente
      markAsOnline()
      
      // Salvar preferência no localStorage
      const storedStatus = localStorage.getItem(`user_online_status_${user.id}`)
      if (storedStatus) {
        setIsOnline(storedStatus === 'true')
      }
    }
  }, [user, isOwnProfile])

  const markAsOnline = async () => {
    if (!user) return
    
    try {
      const response = await fetch('/api/user_presence', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'mark_online'
        })
      })
      
      if (response.ok) {
        console.log('✅ Usuário marcado como online')
      }
    } catch (error) {
      console.warn('⚠️ Erro ao marcar como online:', error)
    }
  }

  const markAsOffline = async () => {
    if (!user) return
    
    try {
      const response = await fetch('/api/user_presence', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'mark_offline'
        })
      })
      
      if (response.ok) {
        console.log('✅ Usuário marcado como offline')
      }
    } catch (error) {
      console.warn('⚠️ Erro ao marcar como offline:', error)
    }
  }

  const toggleOnlineStatus = async () => {
    if (!user || !isOwnProfile || isUpdating) return

    setIsUpdating(true)
    const newStatus = !isOnline

    try {
      // Atualizar status no servidor
      if (newStatus) {
        await markAsOnline()
      } else {
        await markAsOffline()
      }

      // Atualizar estado local
      setIsOnline(newStatus)
      
      // Salvar preferência no localStorage
      localStorage.setItem(`user_online_status_${user.id}`, newStatus.toString())

      // Mostrar feedback
      toast.success(
        newStatus ? 'Você está visível como online' : 'Você está aparecendo como offline',
        {
          description: newStatus 
            ? 'Outros usuários podem ver que você está online'
            : 'Você aparecerá como offline para outros usuários',
          icon: newStatus ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />,
          duration: 3000,
        }
      )
    } catch (error) {
      console.error('❌ Erro ao alterar status:', error)
      toast.error('Erro ao alterar status de presença')
    } finally {
      setIsUpdating(false)
    }
  }

  // Se não for o próprio perfil, apenas mostrar o status (sem controle)
  if (!isOwnProfile) {
    return (
      <div className={className}>
        <Badge variant="secondary" className={`${isOnline ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
          {isOnline ? (
            <>
              <div className="w-2 h-2 bg-green-500 rounded-full mr-1.5 animate-pulse" />
              Online
            </>
          ) : (
            <>
              <div className="w-2 h-2 bg-gray-400 rounded-full mr-1.5" />
              Offline
            </>
          )}
        </Badge>
      </div>
    )
  }

  // Se for o próprio perfil, mostrar controle completo
  return (
    <div className={`space-y-3 ${className}`}>
      {/* Status atual */}
      <div className="flex items-center justify-center">
        <Badge 
          variant="secondary" 
          className={`${isOnline ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'} transition-all`}
        >
          {isOnline ? (
            <>
              <div className="w-2 h-2 bg-green-500 rounded-full mr-1.5 animate-pulse" />
              Online
            </>
          ) : (
            <>
              <div className="w-2 h-2 bg-gray-400 rounded-full mr-1.5" />
              Offline
            </>
          )}
        </Badge>
      </div>

      {/* Controle de visibilidade */}
      <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
        <div className="flex items-center space-x-2">
          {isOnline ? (
            <Eye className="h-4 w-4 text-purple-600" />
          ) : (
            <EyeOff className="h-4 w-4 text-gray-500" />
          )}
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-800">
              {isOnline ? 'Visível' : 'Invisível'}
            </span>
            <span className="text-xs text-gray-600">
              {isOnline ? 'Outros podem ver você online' : 'Você aparece offline'}
            </span>
          </div>
        </div>
        
        <Switch
          checked={isOnline}
          onCheckedChange={toggleOnlineStatus}
          disabled={isUpdating}
          className="data-[state=checked]:bg-green-500"
        />
      </div>

      {/* Botão alternativo para mudança rápida */}
      <Button
        variant="outline"
        size="sm"
        onClick={toggleOnlineStatus}
        disabled={isUpdating}
        className={`w-full transition-all ${
          isOnline 
            ? 'border-green-300 text-green-700 hover:bg-green-50' 
            : 'border-gray-300 text-gray-600 hover:bg-gray-50'
        }`}
      >
        {isUpdating ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
        ) : isOnline ? (
          <WifiOff className="h-4 w-4 mr-2" />
        ) : (
          <Wifi className="h-4 w-4 mr-2" />
        )}
        {isUpdating ? 'Atualizando...' : (isOnline ? 'Ficar Invisível' : 'Ficar Visível')}
      </Button>
    </div>
  )
}
