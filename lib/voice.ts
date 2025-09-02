'use client'

// Extend the Window interface to include speech recognition APIs
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

interface SpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
  start(): void;
  stop(): void;
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
  item(index: number): SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  length: number;
  isFinal: boolean;
  item(index: number): SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message: string;
}

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
        console.warn('Speech synthesis error:', event.error)
        
        // Don't reject for common, non-critical errors
        if (event.error === 'interrupted' || event.error === 'canceled') {
          resolve() // Treat as success since these are expected interruptions
        } else {
          reject(new Error(`Speech synthesis error: ${event.error}`))
        }
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

  listen(options: { timeout?: number; waitForActivation?: boolean } = {}): Promise<string> {
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
      let timeoutId: NodeJS.Timeout | null = null
      
      // Set timeout if specified
      if (options.timeout) {
        timeoutId = setTimeout(() => {
          this.recognition?.stop()
          this.isListening = false
          reject(new Error('Listening timeout'))
        }, options.timeout)
      }

      this.recognition.onresult = (event) => {
        if (timeoutId) {
          clearTimeout(timeoutId)
        }
        
        const transcript = event.results[0]?.item(0)?.transcript || ''
        const cleanTranscript = transcript.trim().toLowerCase()
        
        this.isListening = false
        
        // If waiting for activation word, check if it's present
        if (options.waitForActivation) {
          const activationWords = ['orky', 'oi orky', 'olá orky', 'hey orky']
          const hasActivation = activationWords.some(word => cleanTranscript.includes(word))
          
          if (hasActivation) {
            // Remove activation word from the command
            let command = cleanTranscript
            activationWords.forEach(word => {
              command = command.replace(word, '').trim()
            })
            resolve(command || 'olá') // Default greeting if no command after activation
          } else {
            // Continue listening if no activation word detected
            setTimeout(() => {
              if (!this.isListening) {
                this.listen(options).then(resolve).catch(reject)
              }
            }, 100)
            return
          }
        } else {
          resolve(transcript.trim())
        }
      }

      this.recognition.onerror = (event) => {
        if (timeoutId) {
          clearTimeout(timeoutId)
        }
        this.isListening = false
        
        // Don't reject for common, recoverable errors when waiting for activation
        if (options.waitForActivation && (event.error === 'no-speech' || event.error === 'audio-capture')) {
          // Restart listening after a brief pause
          setTimeout(() => {
            if (!this.isListening) {
              this.listen(options).then(resolve).catch(reject)
            }
          }, 500)
          return
        }
        
        reject(new Error(`Speech recognition error: ${event.error}`))
      }

      this.recognition.onend = () => {
        if (timeoutId) {
          clearTimeout(timeoutId)
        }
        this.isListening = false
        
        // If waiting for activation and not manually stopped, restart
        if (options.waitForActivation && this.recognition) {
          setTimeout(() => {
            if (!this.isListening) {
              this.listen(options).then(resolve).catch(reject)
            }
          }, 100)
        }
      }

      try {
        this.recognition.start()
      } catch (error) {
        if (timeoutId) {
          clearTimeout(timeoutId)
        }
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