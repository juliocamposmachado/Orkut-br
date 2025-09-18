'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/local-auth-context'
import { supabase } from '@/lib/supabase'
// import { toast } from 'sonner' // Temporariamente comentado para build

export interface NotificationSettings {
  // Tipos de notificação
  likes: boolean
  comments: boolean  
  shares: boolean
  friend_requests: boolean
  mentions: boolean
  posts_from_friends: boolean
  community_activity: boolean
  
  // Métodos de entrega
  browser_push: boolean
  email_notifications: boolean
  sound_enabled: boolean
  
  // Configurações avançadas
  quiet_hours_enabled: boolean
  quiet_hours_start: string
  quiet_hours_end: string
  notification_preview: boolean // Mostrar preview do conteúdo
}

const defaultSettings: NotificationSettings = {
  likes: true,
  comments: true,
  shares: true,
  friend_requests: true,
  mentions: true,
  posts_from_friends: true,
  community_activity: false,
  browser_push: true,
  email_notifications: false,
  sound_enabled: true,
  quiet_hours_enabled: false,
  quiet_hours_start: '22:00',
  quiet_hours_end: '08:00',
  notification_preview: true,
}

export function useNotificationSettings() {
  const { user } = useAuth()
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings)
  const [isLoading, setIsLoading] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)

  // Carregar configurações do usuário
  const loadSettings = useCallback(async () => {
    if (!user) return

    try {
      setIsLoading(true)
      
      // Primeiro tenta carregar do Supabase
      try {
        const { data, error } = await supabase
          .from('settings')
          .select('*')
          .eq('profile_id', user.id)
          .single()

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
          console.error('Error loading notification settings:', error)
          // Fallback para localStorage
          loadFromLocalStorage()
          return
        }

        if (data) {
        // Converter os dados do Supabase para o formato esperado
        const notificationSettings: NotificationSettings = {
          likes: data.notifications_enabled ?? defaultSettings.likes,
          comments: data.notifications_enabled ?? defaultSettings.comments,
          shares: data.notifications_enabled ?? defaultSettings.shares,
          friend_requests: data.notifications_enabled ?? defaultSettings.friend_requests,
          mentions: data.notifications_enabled ?? defaultSettings.mentions,
          posts_from_friends: data.notifications_enabled ?? defaultSettings.posts_from_friends,
          community_activity: false,
          browser_push: data.notifications_enabled ?? defaultSettings.browser_push,
          email_notifications: false,
          sound_enabled: true,
          quiet_hours_enabled: false,
          quiet_hours_start: '22:00',
          quiet_hours_end: '08:00',
          notification_preview: true,
        }
        
        // Se temos configurações mais detalhadas no localStorage, usar elas
        const localSettings = localStorage.getItem(`notification_settings_${user.id}`)
        if (localSettings) {
          const parsedLocal = JSON.parse(localSettings)
          setSettings({ ...notificationSettings, ...parsedLocal })
        } else {
          setSettings(notificationSettings)
        }
        } else {
          loadFromLocalStorage()
        }
      } catch (supabaseError) {
        console.error('Error accessing Supabase:', supabaseError)
        loadFromLocalStorage()
      }
    } catch (error) {
      console.error('Error loading notification settings:', error)
      loadFromLocalStorage()
    } finally {
      setIsLoading(false)
      setHasLoaded(true)
    }
  }, [user])

  const loadFromLocalStorage = () => {
    if (!user) return
    
    try {
      const saved = localStorage.getItem(`notification_settings_${user.id}`)
      if (saved) {
        const parsed = JSON.parse(saved)
        setSettings({ ...defaultSettings, ...parsed })
      } else {
        setSettings(defaultSettings)
      }
    } catch (error) {
      console.error('Error loading settings from localStorage:', error)
      setSettings(defaultSettings)
    }
  }

  // Salvar configurações
  const saveSettings = useCallback(async (newSettings: Partial<NotificationSettings>) => {
    if (!user) return

    const updatedSettings = { ...settings, ...newSettings }
    setSettings(updatedSettings)

    try {
      // Salvar no localStorage imediatamente
      localStorage.setItem(`notification_settings_${user.id}`, JSON.stringify(updatedSettings))

      // Tentar salvar no Supabase
      const { error } = await supabase
        .from('settings')
        .upsert({
          profile_id: user.id,
          notifications_enabled: updatedSettings.browser_push,
          voice_enabled: true,
          locale: 'pt-BR',
          tts_speed: 1,
          tts_volume: 0.8,
          updated_at: new Date().toISOString()
        })

      if (error) {
        console.error('Error saving notification settings to Supabase:', error)
        // Mesmo com erro no Supabase, mantemos as configurações no localStorage
        console.log('Configurações salvas localmente')
      } else {
        console.log('Configurações salvas com sucesso!')
      }
    } catch (error) {
      console.error('Error saving notification settings:', error)
      console.error('Erro ao salvar configurações')
    }
  }, [user, settings])

  // Verificar se notificações push estão disponíveis
  const checkPushSupport = useCallback(() => {
    if (!('Notification' in window)) {
      return { supported: false, reason: 'Notificações não são suportadas neste navegador' }
    }
    
    if (!('serviceWorker' in navigator)) {
      return { supported: false, reason: 'Service Workers não são suportados' }
    }

    if (!('PushManager' in window)) {
      return { supported: false, reason: 'Push API não é suportada' }
    }

    return { supported: true }
  }, [])

  // Solicitar permissão para notificações
  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.error('Notificações não são suportadas neste navegador')
      return false
    }

    try {
      const permission = await Notification.requestPermission()
      
      if (permission === 'granted') {
        await saveSettings({ browser_push: true })
        console.log('Permissão para notificações concedida!')
        return true
      } else if (permission === 'denied') {
        await saveSettings({ browser_push: false })
        console.error('Permissão para notificações negada')
        return false
      } else {
        console.log('Permissão para notificações não foi concedida')
        return false
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      console.error('Erro ao solicitar permissão para notificações')
      return false
    }
  }, [saveSettings])

  // Verificar se está em horário silencioso
  const isQuietHours = useCallback(() => {
    if (!settings.quiet_hours_enabled) return false

    const now = new Date()
    const currentTime = now.getHours() * 60 + now.getMinutes()
    
    const [startHour, startMin] = settings.quiet_hours_start.split(':').map(Number)
    const [endHour, endMin] = settings.quiet_hours_end.split(':').map(Number)
    
    const startTime = startHour * 60 + startMin
    const endTime = endHour * 60 + endMin
    
    // Se o horário de fim é menor que o de início, significa que atravessa meia-noite
    if (endTime < startTime) {
      return currentTime >= startTime || currentTime <= endTime
    } else {
      return currentTime >= startTime && currentTime <= endTime
    }
  }, [settings.quiet_hours_enabled, settings.quiet_hours_start, settings.quiet_hours_end])

  useEffect(() => {
    if (user && !hasLoaded) {
      loadSettings()
    }
  }, [user, hasLoaded, loadSettings])

  return {
    settings,
    isLoading,
    hasLoaded,
    saveSettings,
    loadSettings,
    checkPushSupport,
    requestNotificationPermission,
    isQuietHours,
    notificationPermission: typeof window !== 'undefined' ? Notification.permission : 'default'
  }
}
