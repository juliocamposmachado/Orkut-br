'use client'

/**
 * Sistema de sons para chamadas
 * Gerencia reprodução de áudio para notificações de chamada
 */

// Tipos de sons disponíveis
export type SoundType = 'incoming_call' | 'call_end' | 'call_connect' | 'call_busy'

// Cache de objetos de áudio
const audioCache = new Map<SoundType, HTMLAudioElement>()

// URLs dos sons (podem ser substituídos por arquivos reais)
const SOUND_URLS: Record<SoundType, string> = {
  incoming_call: '/sounds/incoming-call.mp3',
  call_end: '/sounds/call-end.mp3', 
  call_connect: '/sounds/call-connect.mp3',
  call_busy: '/sounds/call-busy.mp3'
}

/**
 * Cria um som programaticamente usando Web Audio API
 * Fallback quando arquivos de áudio não estão disponíveis
 */
const createBeepSound = (frequency: number, duration: number): Promise<void> => {
  return new Promise((resolve) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime)
      oscillator.type = 'sine'
      
      // Envelope de volume suave
      gainNode.gain.setValueAtTime(0, audioContext.currentTime)
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.05)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + duration)
      
      oscillator.onended = () => resolve()
    } catch (error) {
      console.warn('Não foi possível criar som via Web Audio API:', error)
      resolve()
    }
  })
}

/**
 * Cria som de toque de telefone programaticamente
 */
const createRingtone = async (): Promise<void> => {
  const ringPattern = [
    { freq: 800, dur: 0.4 },
    { freq: 0, dur: 0.2 },
    { freq: 600, dur: 0.4 },
    { freq: 0, dur: 0.2 },
    { freq: 800, dur: 0.4 },
    { freq: 0, dur: 1.0 }
  ]
  
  for (const note of ringPattern) {
    if (note.freq > 0) {
      await createBeepSound(note.freq, note.dur)
    } else {
      await new Promise(resolve => setTimeout(resolve, note.dur * 1000))
    }
  }
}

/**
 * Toca um som específico
 */
export const playSound = async (soundType: SoundType): Promise<void> => {
  console.log('🔊 Tocando som:', soundType)
  
  try {
    // Verificar se o navegador suporta áudio
    if (typeof window === 'undefined' || !window.Audio) {
      console.warn('Audio não suportado neste ambiente')
      return
    }
    
    // Tentar usar arquivo de áudio primeiro
    let audio = audioCache.get(soundType)
    
    if (!audio) {
      audio = new Audio(SOUND_URLS[soundType])
      audio.preload = 'auto'
      audio.volume = 0.7
      audioCache.set(soundType, audio)
    }
    
    // Tentar reproduzir o arquivo
    try {
      audio.currentTime = 0
      await audio.play()
      console.log('✅ Som reproduzido com sucesso:', soundType)
      return
    } catch (audioError) {
      console.warn('Arquivo de áudio não disponível, usando fallback:', audioError)
      
      // Fallback para sons programáticos
      switch (soundType) {
        case 'incoming_call':
          await createRingtone()
          break
          
        case 'call_connect':
          await createBeepSound(600, 0.3)
          setTimeout(() => createBeepSound(800, 0.2), 100)
          break
          
        case 'call_end':
          await createBeepSound(400, 0.5)
          break
          
        case 'call_busy':
          for (let i = 0; i < 3; i++) {
            await createBeepSound(480, 0.25)
            await new Promise(resolve => setTimeout(resolve, 250))
          }
          break
          
        default:
          await createBeepSound(800, 0.3)
      }
    }
    
  } catch (error) {
    console.error('❌ Erro ao reproduzir som:', error)
  }
}

/**
 * Para a reprodução de um som específico
 */
export const stopSound = (soundType: SoundType): void => {
  const audio = audioCache.get(soundType)
  if (audio) {
    audio.pause()
    audio.currentTime = 0
  }
}

/**
 * Para todos os sons
 */
export const stopAllSounds = (): void => {
  audioCache.forEach(audio => {
    audio.pause()
    audio.currentTime = 0
  })
}

/**
 * Solicita permissão para reproduzir áudio
 * Necessário para contornar políticas de autoplay do navegador
 */
export const requestAudioPermission = async (): Promise<boolean> => {
  try {
    // Tentar criar contexto de áudio
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    
    // Se estiver suspenso, tentar retomar
    if (audioContext.state === 'suspended') {
      await audioContext.resume()
    }
    
    console.log('✅ Permissão de áudio obtida')
    return true
    
  } catch (error) {
    console.error('❌ Erro ao solicitar permissão de áudio:', error)
    return false
  }
}

/**
 * Pré-carrega todos os arquivos de áudio
 */
export const preloadSounds = (): void => {
  if (typeof window === 'undefined') return
  
  Object.entries(SOUND_URLS).forEach(([soundType, url]) => {
    try {
      const audio = new Audio(url)
      audio.preload = 'auto'
      audio.volume = 0.7
      audioCache.set(soundType as SoundType, audio)
      console.log('🎵 Som pré-carregado:', soundType)
    } catch (error) {
      console.warn('⚠️ Erro ao pré-carregar som:', soundType, error)
    }
  })
}

/**
 * Hook para gerenciar sons de chamada
 */
export const useCallSounds = () => {
  const [isPlaying, setIsPlaying] = React.useState<SoundType | null>(null)
  const ringIntervalRef = React.useRef<NodeJS.Timeout | null>(null)
  
  // Tocar toque de chamada continuamente
  const startRingtone = async () => {
    if (isPlaying === 'incoming_call') return
    
    setIsPlaying('incoming_call')
    
    // Tocar imediatamente
    await playSound('incoming_call')
    
    // Continuar tocando a cada 3 segundos
    ringIntervalRef.current = setInterval(async () => {
      await playSound('incoming_call')
    }, 3000)
  }
  
  // Parar toque de chamada
  const stopRingtone = () => {
    if (ringIntervalRef.current) {
      clearInterval(ringIntervalRef.current)
      ringIntervalRef.current = null
    }
    
    stopSound('incoming_call')
    setIsPlaying(null)
  }
  
  // Tocar som único
  const playSingleSound = async (soundType: SoundType) => {
    await playSound(soundType)
  }
  
  // Cleanup ao desmontar
  React.useEffect(() => {
    return () => {
      stopRingtone()
      stopAllSounds()
    }
  }, [])
  
  return {
    isPlaying,
    startRingtone,
    stopRingtone,
    playSingleSound,
    preloadSounds,
    requestAudioPermission
  }
}

// Para compatibilidade com React
import React from 'react'
