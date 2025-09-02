import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/enhanced-auth-context'
import { supabase } from '@/lib/supabase'

interface WhatsAppStatus {
  enabled: boolean
  online: boolean
  lastActivity: string | null
  lastUpdate: string | null
  isStale: boolean
  consentGiven: boolean
}

interface WhatsAppDetector {
  status: WhatsAppStatus
  loading: boolean
  error: string | null
  requestConsent: () => void
  updateStatus: (isOnline: boolean) => Promise<void>
  revokeConsent: () => Promise<void>
}

export function useWhatsAppStatus(): WhatsAppDetector {
  const { user } = useAuth()
  const getAuthToken = useCallback(async (): Promise<string> => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      return session?.access_token || ''
    } catch {
      return ''
    }
  }, [])
  const [status, setStatus] = useState<WhatsAppStatus>({
    enabled: false,
    online: false,
    lastActivity: null,
    lastUpdate: null,
    isStale: false,
    consentGiven: false
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [detectionInterval, setDetectionInterval] = useState<NodeJS.Timeout | null>(null)

  // Detectar se o WhatsApp Web está ativo
  const detectWhatsAppActivity = useCallback(async (): Promise<boolean> => {
    try {
      // Método 1: Verificar se há uma aba do WhatsApp Web ativa
      if (typeof window !== 'undefined' && 'navigator' in window) {
        // Verificar se o usuário está na aba do WhatsApp
        const isWhatsAppTab = window.location.href.includes('web.whatsapp.com')
        
        if (isWhatsAppTab) {
          return document.visibilityState === 'visible'
        }

        // Método 2: Tentar detectar via iframe (limitado por CORS)
        // Este método tem limitações mas pode funcionar em alguns casos
        try {
          const frame = document.createElement('iframe')
          frame.style.display = 'none'
          frame.src = 'https://web.whatsapp.com/favicon.ico'
          
          return new Promise((resolve) => {
            frame.onload = () => {
              document.body.removeChild(frame)
              resolve(true)
            }
            frame.onerror = () => {
              document.body.removeChild(frame)
              resolve(false)
            }
            
            document.body.appendChild(frame)
            
            // Timeout após 3 segundos
            setTimeout(() => {
              if (frame.parentNode) {
                document.body.removeChild(frame)
              }
              resolve(false)
            }, 3000)
          })
        } catch {
          return false
        }
      }
      
      return false
    } catch {
      return false
    }
  }, [])

  // Atualizar status no servidor
  const updateStatus = useCallback(async (isOnline: boolean) => {
    if (!user) return

    try {
      const token = await getAuthToken()
      const response = await fetch('/api/whatsapp-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          isOnline,
          lastActivity: new Date().toISOString(),
          whatsappTabActive: window.location.href.includes('web.whatsapp.com'),
          detectionMethod: window.location.href.includes('web.whatsapp.com') 
            ? 'direct_tab' 
            : 'iframe_detection'
        })
      })

      if (!response.ok) {
        throw new Error('Erro ao atualizar status')
      }

      const data = await response.json()
      console.log('✅ Status WhatsApp atualizado:', data)

    } catch (error) {
      console.error('❌ Erro ao atualizar status WhatsApp:', error)
      setError(error instanceof Error ? error.message : 'Erro desconhecido')
    }
  }, [user, getAuthToken])

  // Buscar status atual do usuário
  const fetchStatus = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      const response = await fetch(`/api/whatsapp-status?userId=${user.id}`)
      
      if (!response.ok) {
        throw new Error('Erro ao buscar status')
      }

      const data = await response.json()
      
      if (data.success) {
        setStatus({
          enabled: data.whatsapp_status.enabled,
          online: data.whatsapp_status.online || false,
          lastActivity: data.whatsapp_status.lastActivity,
          lastUpdate: data.whatsapp_status.lastUpdate,
          isStale: data.whatsapp_status.isStale || false,
          consentGiven: data.whatsapp_status.enabled
        })
      }
    } catch (error) {
      console.error('❌ Erro ao buscar status WhatsApp:', error)
      setError(error instanceof Error ? error.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }, [user])

  // Solicitar consentimento do usuário
  const requestConsent = useCallback(async () => {
    if (!user) return

    const consent = window.confirm(`
🔒 Privacidade - Monitoramento WhatsApp Web

Você gostaria de permitir que o Orkut monitore se você está online no WhatsApp Web?

✅ Como funciona:
• Detecta apenas se você está com WhatsApp Web aberto
• Não acessa suas mensagens ou contatos
• Mostra um ícone verde "Online no WhatsApp" no seu perfil
• Você pode desativar a qualquer momento

❌ Limitações:
• Funciona apenas no mesmo navegador
• Requer que você mantenha uma aba do Orkut aberta
• Pode não funcionar em todos os navegadores devido a políticas de segurança

Autorizar monitoramento?
    `)

    if (consent) {
      try {
        const token = await getAuthToken()
        const response = await fetch('/api/whatsapp-status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            isOnline: false,
            consentGiven: true,
            detectionMethod: 'consent_request'
          })
        })

        if (response.ok) {
          setStatus(prev => ({ ...prev, consentGiven: true, enabled: true }))
          startMonitoring()
        }
      } catch (error) {
        console.error('❌ Erro ao salvar consentimento:', error)
      }
    }
  }, [user, getAuthToken])

  // Revogar consentimento
  const revokeConsent = useCallback(async () => {
    if (!user) return

    try {
      const token = await getAuthToken()
      const response = await fetch('/api/whatsapp-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          isOnline: false,
          consentGiven: false,
          detectionMethod: 'consent_revoked'
        })
      })

      if (response.ok) {
        setStatus(prev => ({ 
          ...prev, 
          consentGiven: false, 
          enabled: false, 
          online: false 
        }))
        stopMonitoring()
      }
    } catch (error) {
      console.error('❌ Erro ao revogar consentimento:', error)
    }
  }, [user, getAuthToken])

  // Iniciar monitoramento
  const startMonitoring = useCallback(() => {
    if (!status.consentGiven) return

    // Parar monitoramento anterior se existir
    if (detectionInterval) {
      clearInterval(detectionInterval)
    }

    // Detectar a cada 30 segundos
    const interval = setInterval(async () => {
      try {
        const isActive = await detectWhatsAppActivity()
        await updateStatus(isActive)
        
        setStatus(prev => ({
          ...prev,
          online: isActive,
          lastActivity: new Date().toISOString(),
          lastUpdate: new Date().toISOString()
        }))
      } catch (error) {
        console.error('❌ Erro na detecção automática:', error)
      }
    }, 30000) // 30 segundos

    setDetectionInterval(interval)

    // Primeira detecção imediata
    detectWhatsAppActivity().then(isActive => {
      updateStatus(isActive)
      setStatus(prev => ({ ...prev, online: isActive }))
    })
  }, [status.consentGiven, detectWhatsAppActivity, updateStatus, detectionInterval])

  // Parar monitoramento
  const stopMonitoring = useCallback(() => {
    if (detectionInterval) {
      clearInterval(detectionInterval)
      setDetectionInterval(null)
    }
  }, [detectionInterval])

  // Efeito para carregar status inicial
  useEffect(() => {
    if (user) {
      fetchStatus()
    }
  }, [user, fetchStatus])

  // Efeito para iniciar/parar monitoramento baseado no consentimento
  useEffect(() => {
    if (status.consentGiven && status.enabled) {
      startMonitoring()
    } else {
      stopMonitoring()
    }

    // Cleanup na desmontagem
    return () => {
      stopMonitoring()
    }
  }, [status.consentGiven, status.enabled, startMonitoring, stopMonitoring])

  // Detectar quando a aba perde/ganha foco
  useEffect(() => {
    if (!status.consentGiven) return

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Aba voltou a estar ativa, verificar WhatsApp
        detectWhatsAppActivity().then(isActive => {
          updateStatus(isActive)
          setStatus(prev => ({ ...prev, online: isActive }))
        })
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [status.consentGiven, detectWhatsAppActivity, updateStatus])

  return {
    status,
    loading,
    error,
    requestConsent,
    updateStatus,
    revokeConsent
  }
}
