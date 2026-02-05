'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  MessageCircle, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX,
  Minimize2,
  Maximize2,
  Sparkles,
  Send,
  Phone,
  Users
} from 'lucide-react'
import { useVoice } from '@/contexts/voice-context'
import { useAuth } from '@/contexts/auth-context'
import { geminiConcierge, GeminiAction } from '@/lib/gemini'
import { useRouter } from 'next/navigation'

interface OrkyAssistantProps {
  onAction?: (action: GeminiAction) => void
}

export function OrkyAssistant({ onAction }: OrkyAssistantProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [messages, setMessages] = useState<Array<{ text: string; isUser: boolean; timestamp: Date }>>([])
  const [inputText, setInputText] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  
  const { isVoiceEnabled, isListening, startListening, speak, isSpeaking } = useVoice()
  const { profile } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isVoiceEnabled && profile) {
      // Initial greeting when voice is enabled
      const greeting = geminiConcierge.generateGreeting(profile.display_name)
      greeting.then(text => {
        speak(text)
        setMessages([{ text, isUser: false, timestamp: new Date() }])
      })
    }
  }, [isVoiceEnabled, profile, speak])

  const handleVoiceCommand = async () => {
    if (isListening || isProcessing) return

    try {
      setIsProcessing(true)
      const command = await startListening()
      
      if (command.trim()) {
        setMessages(prev => [...prev, { text: command, isUser: true, timestamp: new Date() }])
        await processCommand(command)
      }
    } catch (error) {
      console.error('Voice command error:', error)
      speak('Desculpe, não consegui entender. Tente novamente.')
    } finally {
      setIsProcessing(false)
    }
  }

  const processCommand = async (command: string) => {
    try {
      const context = {
        userName: profile?.display_name || 'Usuário',
        currentPage: window.location.pathname,
      }

      const result = await geminiConcierge.processCommand(command, context)
      
      setMessages(prev => [...prev, { 
        text: result.response, 
        isUser: false, 
        timestamp: new Date() 
      }])

      // Speak the response
      if (isVoiceEnabled) {
        await speak(result.response)
      }

      // Execute actions
      if (result.actions && result.actions.length > 0) {
        for (const action of result.actions) {
          await executeAction(action)
        }
      }
    } catch (error) {
      console.error('Error processing command:', error)
      const errorMessage = 'Desculpe, ocorreu um erro ao processar seu comando.'
      setMessages(prev => [...prev, { 
        text: errorMessage, 
        isUser: false, 
        timestamp: new Date() 
      }])
      if (isVoiceEnabled) {
        speak(errorMessage)
      }
    }
  }

  const executeAction = async (action: GeminiAction) => {
    try {
      switch (action.name) {
        case 'navigate':
          if (action.args.route) {
            router.push(action.args.route)
          }
          break
        case 'read_feed':
          router.push('/')
          break
        case 'call_user':
          // This would integrate with the WebRTC service
          console.log('Call user:', action.args)
          break
        default:
          // Pass action to parent component for handling
          onAction?.(action)
      }
    } catch (error) {
      console.error('Error executing action:', error)
    }
  }

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputText.trim() && !isProcessing) {
      processCommand(inputText.trim())
      setInputText('')
    }
  }

  const quickActions = [
    { label: 'Ler Feed', command: 'Leia meu feed', icon: MessageCircle },
    { label: 'Chamar Amigo', command: 'Quero fazer uma ligação', icon: Phone },
    { label: 'Ver Comunidades', command: 'Mostrar minhas comunidades', icon: Users },
  ]

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isExpanded ? (
        <Card className="w-96 h-96 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5" />
                <span className="font-semibold">Orky - Assistente</span>
              </div>
              <div className="flex items-center space-x-1">
                {isVoiceEnabled && (
                  <Badge variant="secondary" className="bg-white/20 text-white text-xs">
                    {isListening ? 'Ouvindo' : isSpeaking ? 'Falando' : 'Ativo'}
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(false)}
                  className="text-white hover:bg-white/20 h-6 w-6 p-0"
                >
                  <Minimize2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-0 flex flex-col h-80">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <Sparkles className="h-8 w-8 mx-auto mb-2 text-purple-400" />
                  <p className="text-sm">
                    Olá! Sou o Orky, seu assistente do Orkut.
                    <br />
                    Como posso ajudar?
                  </p>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-2 rounded-lg text-sm ${
                        msg.isUser
                          ? 'bg-purple-500 text-white'
                          : 'bg-white border border-purple-200 text-gray-800'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Quick Actions */}
            {messages.length === 0 && (
              <div className="p-3 border-t border-purple-200">
                <div className="grid grid-cols-1 gap-1">
                  {quickActions.map((action, idx) => (
                    <Button
                      key={idx}
                      variant="ghost"
                      size="sm"
                      onClick={() => processCommand(action.command)}
                      className="justify-start text-xs text-purple-700 hover:bg-purple-100"
                      disabled={isProcessing}
                    >
                      <action.icon className="h-3 w-3 mr-2" />
                      {action.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-3 border-t border-purple-200">
              <div className="flex space-x-2">
                {isVoiceEnabled && (
                  <Button
                    variant={isListening ? 'default' : 'outline'}
                    size="sm"
                    onClick={handleVoiceCommand}
                    disabled={isProcessing || isSpeaking}
                    className={`flex-shrink-0 ${
                      isListening 
                        ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
                        : 'border-purple-300 text-purple-700 hover:bg-purple-50'
                    }`}
                  >
                    {isListening ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                  </Button>
                )}
                
                <form onSubmit={handleTextSubmit} className="flex-1 flex space-x-2">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Digite seu comando..."
                    className="flex-1 px-3 py-1 text-sm border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    disabled={isProcessing}
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!inputText.trim() || isProcessing}
                    className="bg-purple-500 hover:bg-purple-600"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button
          onClick={() => setIsExpanded(true)}
          size="lg"
          className="rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-xl hover:shadow-2xl transition-all duration-200 h-14 w-14 p-0"
        >
          <div className="relative">
            <Sparkles className="h-6 w-6" />
            {(isListening || isSpeaking) && (
              <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-pulse"></div>
            )}
          </div>
        </Button>
      )}
    </div>
  )
}