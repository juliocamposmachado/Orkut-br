'use client'

import { useState, useEffect, useCallback } from 'react'

export interface MediaPermissions {
  camera: PermissionState | 'unknown'
  microphone: PermissionState | 'unknown'
  displayCapture: PermissionState | 'unknown'
}

export interface MediaPermissionsHook {
  permissions: MediaPermissions
  isSupported: boolean
  isMobile: boolean
  requestPermissions: (types: Array<'camera' | 'microphone' | 'displayCapture'>) => Promise<boolean>
  requestMicrophoneOnly: () => Promise<boolean>
  checkPermissions: () => Promise<void>
  hasAllPermissions: boolean
  hasMicrophonePermission: boolean
  isLoading: boolean
  error: string | null
}

export function useMediaPermissions(): MediaPermissionsHook {
  const [permissions, setPermissions] = useState<MediaPermissions>({
    camera: 'unknown',
    microphone: 'unknown',
    displayCapture: 'unknown'
  })
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent
      const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
      const isTouch = 'ontouchstart' in window
      const isSmallScreen = window.innerWidth <= 768
      
      setIsMobile(mobileRegex.test(userAgent) || isTouch || isSmallScreen)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const isSupported = typeof navigator !== 'undefined' && 
    'mediaDevices' in navigator && 
    'getUserMedia' in navigator.mediaDevices

  const checkPermissions = useCallback(async () => {
    if (!isSupported) return

    setIsLoading(true)
    setError(null)

    try {
      const newPermissions: MediaPermissions = {
        camera: 'unknown',
        microphone: 'unknown',
        displayCapture: 'unknown'
      }

      // Check camera permission
      try {
        if ('permissions' in navigator) {
          const cameraPermission = await navigator.permissions.query({ name: 'camera' as PermissionName })
          newPermissions.camera = cameraPermission.state
        }
      } catch (err) {
        console.warn('Cannot check camera permission:', err)
        newPermissions.camera = 'unknown'
      }

      // Check microphone permission
      try {
        if ('permissions' in navigator) {
          const micPermission = await navigator.permissions.query({ name: 'microphone' as PermissionName })
          newPermissions.microphone = micPermission.state
        }
      } catch (err) {
        console.warn('Cannot check microphone permission:', err)
        newPermissions.microphone = 'unknown'
      }

      // Display capture is usually prompt on request, so we keep it unknown
      newPermissions.displayCapture = 'unknown'

      setPermissions(newPermissions)
    } catch (err) {
      console.error('Error checking permissions:', err)
      setError('Erro ao verificar permissões de mídia')
    } finally {
      setIsLoading(false)
    }
  }, [isSupported])

  const requestPermissions = useCallback(async (
    types: Array<'camera' | 'microphone' | 'displayCapture'>
  ): Promise<boolean> => {
    if (!isSupported) {
      setError('MediaDevices não é suportado neste dispositivo')
      return false
    }

    setIsLoading(true)
    setError(null)

    try {
      const constraints: MediaStreamConstraints = {}
      
      if (types.includes('camera')) {
        constraints.video = isMobile ? {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 15 }
        } : true
      }
      
      if (types.includes('microphone')) {
        constraints.audio = isMobile ? {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } : true
      }

      // Request user media to trigger permission prompts
      let stream: MediaStream | null = null
      
      if (constraints.video || constraints.audio) {
        stream = await navigator.mediaDevices.getUserMedia(constraints)
      }

      // If display capture was requested, ask for it separately
      if (types.includes('displayCapture')) {
        try {
          if ('getDisplayMedia' in navigator.mediaDevices) {
            const displayStream = await navigator.mediaDevices.getDisplayMedia({
              video: true,
              audio: true
            })
            // Stop immediately, we just wanted to request permission
            displayStream.getTracks().forEach(track => track.stop())
          }
        } catch (err) {
          console.warn('Display capture not available or denied:', err)
        }
      }

      // Stop the stream, we just wanted to request permission
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }

      // Re-check permissions after request
      await checkPermissions()
      
      return true
    } catch (err: any) {
      console.error('Error requesting permissions:', err)
      
      if (err.name === 'NotAllowedError') {
        setError('Permissões de mídia foram negadas. Por favor, permita acesso à câmera e microfone.')
      } else if (err.name === 'NotFoundError') {
        setError('Dispositivos de mídia não encontrados.')
      } else if (err.name === 'NotSupportedError') {
        setError('Mídia não é suportada neste dispositivo.')
      } else {
        setError('Erro ao solicitar permissões de mídia')
      }
      
      return false
    } finally {
      setIsLoading(false)
    }
  }, [isSupported, isMobile, checkPermissions])

  const requestMicrophoneOnly = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError('MediaDevices não é suportado neste dispositivo')
      return false
    }

    setIsLoading(true)
    setError(null)

    try {
      const constraints: MediaStreamConstraints = {
        audio: isMobile ? {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } : true
      }

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      
      // Stop the stream immediately, we just wanted to request permission
      stream.getTracks().forEach(track => track.stop())

      // Re-check permissions after request
      await checkPermissions()
      
      return true
    } catch (err: any) {
      console.error('Error requesting microphone permission:', err)
      
      if (err.name === 'NotAllowedError') {
        setError('Acesso ao microfone foi negado. Para usar o assistente de voz, permita o acesso ao microfone.')
      } else if (err.name === 'NotFoundError') {
        setError('Microfone não encontrado. Verifique se há um microfone conectado ao seu dispositivo.')
      } else if (err.name === 'NotSupportedError') {
        setError('Microfone não é suportado neste dispositivo.')
      } else {
        setError('Erro ao solicitar acesso ao microfone.')
      }
      
      return false
    } finally {
      setIsLoading(false)
    }
  }, [isSupported, isMobile, checkPermissions])

  const hasAllPermissions = permissions.camera === 'granted' && 
    permissions.microphone === 'granted'
  
  const hasMicrophonePermission = permissions.microphone === 'granted'

  useEffect(() => {
    if (isSupported) {
      checkPermissions()
    }
  }, [isSupported, checkPermissions])

  return {
    permissions,
    isSupported,
    isMobile,
    requestPermissions,
    requestMicrophoneOnly,
    checkPermissions,
    hasAllPermissions,
    hasMicrophonePermission,
    isLoading,
    error
  }
}
