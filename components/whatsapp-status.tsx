import React, { useState, useEffect } from 'react'
import { FaWhatsapp, FaCog, FaEye, FaEyeSlash } from 'react-icons/fa'
import { useWhatsAppStatus } from '@/hooks/useWhatsAppStatus'

interface WhatsAppStatusProps {
  userId?: string
  isOwnProfile?: boolean
  showControls?: boolean
  compact?: boolean
}

export function WhatsAppStatus({ 
  userId, 
  isOwnProfile = false, 
  showControls = false,
  compact = false
}: WhatsAppStatusProps) {
  const { status, loading, error, requestConsent, revokeConsent } = useWhatsAppStatus()
  const [externalStatus, setExternalStatus] = useState<any>(null)
  const [externalLoading, setExternalLoading] = useState(false)

  // Buscar status de outro usuário se não for o próprio perfil
  useEffect(() => {
    if (!isOwnProfile && userId) {
      setExternalLoading(true)
      fetch(`/api/whatsapp-status?userId=${userId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setExternalStatus(data.whatsapp_status)
          }
        })
        .catch(console.error)
        .finally(() => setExternalLoading(false))
    }
  }, [userId, isOwnProfile])

  const currentStatus = isOwnProfile ? status : externalStatus
  const isLoading = isOwnProfile ? loading : externalLoading

  if (isLoading) {
    // No modo compacto, não mostrar loading
    if (compact) {
      return null
    }
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <FaWhatsapp className="w-4 h-4 animate-pulse" />
        <span>Verificando...</span>
      </div>
    )
  }

  if (error && isOwnProfile) {
    // No modo compacto, não mostrar erro
    if (compact) {
      return null
    }
    return (
      <div className="flex items-center gap-2 text-sm text-red-500">
        <FaWhatsapp className="w-4 h-4" />
        <span>Erro ao carregar status</span>
      </div>
    )
  }

  // Se não há status ou não está habilitado
  if (!currentStatus || !currentStatus.enabled) {
    if (isOwnProfile && showControls) {
      return (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FaWhatsapp className="w-5 h-5 text-gray-400" />
              <span className="font-medium text-gray-700">Status WhatsApp</span>
            </div>
            <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
              Desabilitado
            </span>
          </div>
          
          <p className="text-sm text-gray-600 mb-4">
            Mostre aos seus amigos quando você está online no WhatsApp Web
          </p>
          
          <button
            onClick={requestConsent}
            className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            <FaEye className="w-4 h-4" />
            Ativar Status WhatsApp
          </button>
          
          <div className="mt-3 text-xs text-gray-500">
            <div className="flex items-start gap-2">
              <span>💡</span>
              <div>
                <p><strong>Como funciona:</strong></p>
                <ul className="mt-1 space-y-1">
                  <li>• Detecta quando você está usando WhatsApp Web</li>
                  <li>• Não acessa suas mensagens ou contatos</li>
                  <li>• Funciona apenas no mesmo navegador</li>
                  <li>• Você pode desativar a qualquer momento</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )
    }
    
    return null
  }

  // Status ativo - mostrar indicador
  const isOnline = currentStatus.online && !currentStatus.isStale
  const lastActivityText = currentStatus.lastActivity 
    ? formatRelativeTime(currentStatus.lastActivity)
    : 'nunca'

  // Modo compacto - apenas um ícone pequeno ao lado do badge Online
  if (compact) {
    // Se não está online no WhatsApp, não mostrar nada no modo compacto
    if (!isOnline) {
      return null
    }
    
    return (
      <div 
        className="flex items-center" 
        title={`Online no WhatsApp Web${currentStatus.isStale ? ' (dados antigos)' : ''}`}
      >
        <div className="relative">
          <FaWhatsapp className="w-3 h-3 text-green-500" />
          <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className={`rounded-lg p-3 border ${
      isOwnProfile 
        ? 'bg-green-50 border-green-200' 
        : 'bg-gray-50 border-gray-200'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <FaWhatsapp className={`w-5 h-5 ${
              isOnline ? 'text-green-600' : 'text-gray-400'
            }`} />
            {isOnline && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full animate-pulse" />
            )}
          </div>
          
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium ${
                isOnline ? 'text-green-700' : 'text-gray-600'
              }`}>
                {isOnline ? 'Online no WhatsApp' : 'Offline no WhatsApp'}
              </span>
              {currentStatus.isStale && (
                <span className="text-xs text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                  Dados antigos
                </span>
              )}
            </div>
            
            {!isOwnProfile && (
              <p className="text-xs text-gray-500">
                Última atividade: {lastActivityText}
              </p>
            )}
          </div>
        </div>

        {isOwnProfile && showControls && (
          <div className="flex items-center gap-2">
            <button
              onClick={revokeConsent}
              className="p-1 text-gray-400 hover:text-red-500 transition-colors"
              title="Desativar monitoramento"
            >
              <FaEyeSlash className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {isOwnProfile && (
        <div className="mt-3 pt-3 border-t border-green-200">
          <div className="flex items-center justify-between text-xs">
            <span className="text-green-600">
              Status atualizado a cada 30 segundos
            </span>
            <span className="text-gray-500">
              {currentStatus.lastUpdate 
                ? `Atualizado ${formatRelativeTime(currentStatus.lastUpdate)}`
                : 'Nunca atualizado'
              }
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

// Função auxiliar para formatação de tempo relativo
function formatRelativeTime(dateString: string): string {
  const now = new Date()
  const date = new Date(dateString)
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMinutes < 1) return 'agora'
  if (diffMinutes < 60) return `${diffMinutes}m atrás`
  if (diffHours < 24) return `${diffHours}h atrás`
  if (diffDays < 7) return `${diffDays}d atrás`
  
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit'
  })
}

// Componente compacto para usar em listas
export function WhatsAppStatusCompact({ userId }: { userId: string }) {
  const [status, setStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/whatsapp-status?userId=${userId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.whatsapp_status.enabled) {
          setStatus(data.whatsapp_status)
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [userId])

  if (loading || !status || !status.online || status.isStale) {
    return null
  }

  return (
    <div className="flex items-center gap-1" title="Online no WhatsApp Web">
      <FaWhatsapp className="w-3 h-3 text-green-500" />
      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
    </div>
  )
}
