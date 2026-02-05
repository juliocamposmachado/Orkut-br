'use client'

export class VoiceService {
  private synthesis: SpeechSynthesis | null = null
  private recognition: SpeechRecognition | null = null
  private isListening = false
  private currentUtterance: SpeechSynthesisUtterance | null = null
  
  constructor() {
    if (typeof window !== 'undefined') {
      this.synthesis = window.speechSynthesis
      
      // Initialize speech recognition
      if ('webkitSpeechRecognition' in window) {
        this.recognition = new (window as any).webkitSpeechRecognition()
      } else if ('SpeechRecognition' in window) {
        this.recognition = new (window as any).SpeechRecognition()
      }
      
      if (this.recognition) {
        this.recognition.continuous = false
        this.recognition.interimResults = false
        this.recognition.lang = 'pt-BR'
      }
    }
  }

  speak(text: string, options: { speed?: number; volume?: number; voice?: string } = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synthesis) {
        reject(new Error('Speech synthesis not supported'))
        return
      }

      // Stop any current speech
      this.synthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = options.speed || 1.0
      utterance.volume = options.volume || 0.8
      utterance.lang = 'pt-BR'

      // Try to find a Portuguese voice
      const voices = this.synthesis.getVoices()
      const portugueseVoice = voices.find(voice => 
        voice.lang.startsWith('pt') || voice.name.toLowerCase().includes('portuguese')
      )
      
      if (portugueseVoice) {
        utterance.voice = portugueseVoice
      }

      utterance.onend = () => {
        this.currentUtterance = null
        resolve()
      }
      
      utterance.onerror = (event) => {
        this.currentUtterance = null
        reject(new Error(`Speech synthesis error: ${event.error}`))
      }

      this.currentUtterance = utterance
      this.synthesis.speak(utterance)
    })
  }

  stopSpeaking() {
    if (this.synthesis) {
      this.synthesis.cancel()
      this.currentUtterance = null
    }
  }

  isSpeaking(): boolean {
    return this.synthesis?.speaking || false
  }

  listen(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.recognition) {
        reject(new Error('Speech recognition not supported'))
        return
      }

      if (this.isListening) {
        reject(new Error('Already listening'))
        return
      }

      this.isListening = true

      this.recognition.onresult = (event) => {
        const transcript = event.results[0]?.item(0)?.transcript || ''
        this.isListening = false
        resolve(transcript.trim())
      }

      this.recognition.onerror = (event) => {
        this.isListening = false
        reject(new Error(`Speech recognition error: ${event.error}`))
      }

      this.recognition.onend = () => {
        this.isListening = false
      }

      try {
        this.recognition.start()
      } catch (error) {
        this.isListening = false
        reject(error)
      }
    })
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop()
      this.isListening = false
    }
  }

  isListeningActive(): boolean {
    return this.isListening
  }

  isSupported(): boolean {
    return !!(this.synthesis && this.recognition)
  }

  // Voice greetings for different times of day
  getGreeting(displayName: string): string {
    const hour = new Date().getHours()
    let timeGreeting = ''
    
    if (hour < 12) {
      timeGreeting = 'Bom dia'
    } else if (hour < 18) {
      timeGreeting = 'Boa tarde'
    } else {
      timeGreeting = 'Boa noite'
    }
    
    return `${timeGreeting}, ${displayName}! O que devo fazer? Posso ler seu feed, postar algo, ou ligar para um amigo?`
  }
}

export const voiceService = new VoiceService()