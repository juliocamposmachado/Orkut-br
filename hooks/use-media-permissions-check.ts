'use client'

import { useState, useEffect } from 'react'

export interface MediaPermissions {
  camera: PermissionState | 'unknown'
  microphone: PermissionState | 'unknown'
  isLoading: boolean
  hasPermissions: boolean
  requestPermissions: () => Promise<boolean>
  checkPermissions: () => Promise<void>
}

export function useMediaPermissions(): MediaPermissions {
  const [camera, setCamera] = useState<PermissionState | 'unknown'>('unknown')
  const [microphone, setMicrophone] = useState<PermissionState | 'unknown'>('unknown')
  const [isLoading, setIsLoading] = useState(false)

  const checkPermissions = async () => {
    if (typeof navigator === 'undefined' || !navigator.permissions) {
      console.log('Navigator permissions API not supported')
      return
    }

    try {
      setIsLoading(true)
      
      // Check camera permission
      try {
        const cameraPermission = await navigator.permissions.query({ name: 'camera' as PermissionName })
        setCamera(cameraPermission.state)
      } catch (error) {
        console.log('Camera permission check failed:', error)
        setCamera('unknown')
      }

      // Check microphone permission
      try {
        const micPermission = await navigator.permissions.query({ name: 'microphone' as PermissionName })
        setMicrophone(micPermission.state)
      } catch (error) {
        console.log('Microphone permission check failed:', error)
        setMicrophone('unknown')
      }
    } catch (error) {
      console.error('Error checking permissions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const requestPermissions = async (): Promise<boolean> => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
      console.error('Media devices not supported')
      return false
    }

    try {
      setIsLoading(true)
      
      // Request both camera and microphone permissions
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      })
      
      // Stop all tracks immediately - we just needed permissions
      stream.getTracks().forEach(track => track.stop())
      
      // Update permission states
      await checkPermissions()
      
      return true
    } catch (error) {
      console.error('Error requesting media permissions:', error)
      
      // Try audio only as fallback
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: true
        })
        audioStream.getTracks().forEach(track => track.stop())
        await checkPermissions()
        return true
      } catch (audioError) {
        console.error('Audio permission also failed:', audioError)
        return false
      }
    } finally {
      setIsLoading(false)
    }
  }

  const hasPermissions = camera === 'granted' && microphone === 'granted'

  useEffect(() => {
    checkPermissions()
  }, [])

  return {
    camera,
    microphone,
    isLoading,
    hasPermissions,
    requestPermissions,
    checkPermissions
  }
}
