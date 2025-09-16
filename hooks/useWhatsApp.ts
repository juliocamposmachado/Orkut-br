import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/local-auth-context'

// Interface para configuração do WhatsApp
export interface WhatsAppConfig {
  id?: string
  user_id: string
  is_enabled: boolean
  allow_calls: boolean
  voice_call_link?: string
  video_call_link?: string
  whatsapp_phone?: string
  whatsapp_groups?: Array<{ name: string; link: string }>
  created_at?: string
  updated_at?: string
}

// Interface para o estado do hook
interface WhatsAppState {
  config: WhatsAppConfig | null
  loading: boolean
  saving: boolean
  error: string | null
}

// Interface para atualizar configuração
interface UpdateConfigParams {
  is_enabled: boolean
  allow_calls?: boolean
  voice_call_link?: string
  video_call_link?: string
  whatsapp_phone?: string
  whatsapp_groups?: Array<{ name: string; link: string }>
}

export const useWhatsApp = () => {
  const { user } = useAuth()
  const [state, setState] = useState<WhatsAppState>({
    config: null,
    loading: false,
    saving: false,
    error: null
  })

  // Carregar configuração do WhatsApp
  const loadConfig = useCallback(async () => {
    if (!user?.id) return

    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const response = await fetch('/api/whatsapp', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao carregar configurações')
      }

      if (result.success) {
        setState(prev => ({
          ...prev,
          config: result.data,
          loading: false
        }))
      }

    } catch (error) {
      console.error('Erro ao carregar configuração WhatsApp:', error)
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }))
    }
  }, [user?.id])

  // Salvar configuração do WhatsApp
  const saveConfig = useCallback(async (params: UpdateConfigParams) => {
    if (!user?.id) {
      throw new Error('Usuário não autenticado')
    }

    setState(prev => ({ ...prev, saving: true, error: null }))

    try {
      const response = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao salvar configurações')
      }

      if (result.success) {
        setState(prev => ({
          ...prev,
          config: result.data,
          saving: false
        }))
        
        return result.data
      }

    } catch (error) {
      console.error('Erro ao salvar configuração WhatsApp:', error)
      setState(prev => ({
        ...prev,
        saving: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }))
      throw error
    }
  }, [user?.id])

  // Desabilitar WhatsApp
  const disableWhatsApp = useCallback(async () => {
    if (!user?.id) {
      throw new Error('Usuário não autenticado')
    }

    setState(prev => ({ ...prev, saving: true, error: null }))

    try {
      const response = await fetch('/api/whatsapp', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao desabilitar WhatsApp')
      }

      if (result.success) {
        // Atualizar estado local
        setState(prev => ({
          ...prev,
          config: prev.config ? {
            ...prev.config,
            is_enabled: false,
            allow_calls: false,
            voice_call_link: '',
            video_call_link: '',
            whatsapp_phone: '',
            whatsapp_groups: []
          } : null,
          saving: false
        }))
        
        return true
      }

    } catch (error) {
      console.error('Erro ao desabilitar WhatsApp:', error)
      setState(prev => ({
        ...prev,
        saving: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }))
      throw error
    }
  }, [user?.id])

  // Validar link do WhatsApp
  const validateWhatsAppLink = useCallback((link: string, type: 'voice' | 'video' | 'group'): boolean => {
    if (!link) return true // Link vazio é válido
    if (type === 'group') {
      return /^https:\/\/chat\.whatsapp\.com\/[A-Za-z0-9_-]+$/.test(link)
    }
    const pattern = new RegExp(`^https://call\\.whatsapp\\.com/${type}/[A-Za-z0-9_-]+$`)
    return pattern.test(link)
  }, [])

  // Validar telefone WhatsApp
  const validatePhone = useCallback((phone: string): boolean => {
    if (!phone) return true // Telefone vazio é válido
    const cleanPhone = phone.replace(/\D/g, '')
    return cleanPhone.length >= 8 && cleanPhone.length <= 15
  }, [])

  // Gerar links de exemplo
  const getExampleLinks = useCallback(() => ({
    voice: 'https://call.whatsapp.com/voice/SEU_CODIGO_AQUI',
    video: 'https://call.whatsapp.com/video/SEU_CODIGO_AQUI',
    group: 'https://chat.whatsapp.com/SEU_CODIGO_AQUI'
  }), [])

  // Verificar se o usuário tem WhatsApp configurado
  const isConfigured = useCallback(() => {
    return !!(state.config?.is_enabled && (
      state.config?.voice_call_link || 
      state.config?.video_call_link ||
      state.config?.whatsapp_phone
    ))
  }, [state.config])

  // Obter links válidos
  const getValidLinks = useCallback(() => {
    if (!state.config?.is_enabled) return { voice: null, video: null, phone: null, groups: [] }
    
    return {
      voice: state.config?.voice_call_link && 
             validateWhatsAppLink(state.config.voice_call_link, 'voice') 
             ? state.config.voice_call_link 
             : null,
      video: state.config?.video_call_link && 
             validateWhatsAppLink(state.config.video_call_link, 'video') 
             ? state.config.video_call_link 
             : null,
      phone: state.config?.whatsapp_phone && 
             validatePhone(state.config.whatsapp_phone) 
             ? state.config.whatsapp_phone 
             : null,
      groups: state.config?.whatsapp_groups?.filter(group => 
        group.name && group.link && validateWhatsAppLink(group.link, 'group')
      ) || []
    }
  }, [state.config, validateWhatsAppLink, validatePhone])

  // Limpar erro
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  // Carregar configuração automaticamente quando o usuário muda
  useEffect(() => {
    if (user?.id) {
      loadConfig()
    } else {
      setState({
        config: null,
        loading: false,
        saving: false,
        error: null
      })
    }
  }, [user?.id, loadConfig])

  return {
    // Estado
    config: state.config,
    loading: state.loading,
    saving: state.saving,
    error: state.error,
    
    // Ações
    loadConfig,
    saveConfig,
    disableWhatsApp,
    clearError,
    
    // Utilitários
    validateWhatsAppLink,
    validatePhone,
    getExampleLinks,
    isConfigured,
    getValidLinks,
    
    // Estado computado
    isEnabled: state.config?.is_enabled || false,
    hasVoiceLink: !!(state.config?.voice_call_link),
    hasVideoLink: !!(state.config?.video_call_link),
    hasPhone: !!(state.config?.whatsapp_phone),
    hasGroups: !!(state.config?.whatsapp_groups?.length),
  }
}

export default useWhatsApp
