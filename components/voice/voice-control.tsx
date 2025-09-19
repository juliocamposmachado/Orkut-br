'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX,
  Shield,
  ShieldCheck,
  Sparkles,
  AlertTriangle
} from 'lucide-react'
import { useMediaPermissions } from '@/hooks/use-media-permissions'
import { useVoice } from '@/contexts/voice-context'
import { useAuth } from '@/contexts/enhanced-auth-context'

interface VoiceControlProps {
  onVoiceEnabled?: (enabled: boolean) => void
  compact?: boolean
}

export function VoiceControl({ onVoiceEnabled, compact = false }: VoiceControlProps) {
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false)
  const { 
    permissions, 
    isSupported, 
    requestMicrophoneOnly, 
    hasMicrophonePermission, 
    isLoading, 
    error 
  } = useMediaPermissions()
  
  const { 
    isVoiceEnabled, 
    isListening, 
    isSpeaking, 
    toggleVoice 
  } = useVoice()
  
  const { profile } = useAuth()

  // Check if we should show permission prompt
  useEffect(() => {
    if (isSupported && permissions.microphone === 'denied') {
      setShowPermissionPrompt(true)
    } else if (permissions.microphone === 'granted') {
      setShowPermissionPrompt(false)
    }
  }, [isSupported, permissions.microphone])

  const handleVoiceToggle = async () => {
    if (!isSupported) {
      return
    }

    // If microphone permission is not granted, request it first
    if (!hasMicrophonePermission && permissions.microphone !== 'granted') {
      const granted = await requestMicrophoneOnly()
      if (!granted) {
        setShowPermissionPrompt(true)
        return
      }
    }

    // Toggle voice after permission is granted
    await toggleVoice()
    onVoiceEnabled?.(isVoiceEnabled)
  }

  const handleRequestPermissions = async () => {
    const granted = await requestMicrophoneOnly()
    if (granted) {
      setShowPermissionPrompt(false)
      // Automatically enable voice after permission is granted
      if (!isVoiceEnabled) {
        await toggleVoice()
        onVoiceEnabled?.(true)
      }
    }
  }

  if (!isSupported) {
    return (
      <Alert className="border-amber-200 bg-amber-50">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          Reconhecimento de voz não é suportado neste navegador.
        </AlertDescription>
      </Alert>
    )
  }

  if (compact) {
    return (
      <div className="flex items-center space-x-2">
        {showPermissionPrompt && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRequestPermissions}
            disabled={isLoading}
            className="border-amber-300 text-amber-700 hover:bg-amber-50"
          >
            <Shield className="h-4 w-4 mr-1" />
            Permitir Mic
          </Button>
        )}
        
        <Button
          variant={isVoiceEnabled ? "default" : "outline"}
          size="sm"
          onClick={handleVoiceToggle}
          disabled={isLoading || (!hasMicrophonePermission && permissions.microphone === 'denied')}
          className={isVoiceEnabled ? "bg-purple-600 hover:bg-purple-700" : ""}
        >
          {isVoiceEnabled ? (
            <>
              {isListening ? <Mic className="h-4 w-4 animate-pulse text-red-500" /> : 
               isSpeaking ? <Volume2 className="h-4 w-4" /> : 
               <Sparkles className="h-4 w-4" />}
              <span className="ml-1">Ativo</span>
            </>
          ) : (
            <>
              <MicOff className="h-4 w-4" />
              <span className="ml-1">Voz</span>
            </>
          )}
        </Button>
      </div>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <span>Assistente de Voz</span>
          </div>
          {hasMicrophonePermission && (
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <ShieldCheck className="h-3 w-3 mr-1" />
              Permitido
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Permission Status */}
        {showPermissionPrompt && (
          <Alert className="border-amber-200 bg-amber-50">
            <Shield className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              Para usar o assistente de voz, precisamos acessar seu microfone.
              <Button
                variant="link"
                size="sm"
                onClick={handleRequestPermissions}
                disabled={isLoading}
                className="p-0 ml-2 text-amber-700 underline"
              >
                Permitir acesso
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Error Display */}
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Voice Status */}
        {isVoiceEnabled && (
          <div className="flex items-center justify-center p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
            <div className="text-center">
              {isListening ? (
                <>
                  <Mic className="h-8 w-8 mx-auto mb-2 text-red-500 animate-pulse" />
                  <p className="text-sm text-purple-800 font-medium">Ouvindo...</p>
                  <p className="text-xs text-purple-600">Fale agora</p>
                </>
              ) : isSpeaking ? (
                <>
                  <Volume2 className="h-8 w-8 mx-auto mb-2 text-purple-600 animate-bounce" />
                  <p className="text-sm text-purple-800 font-medium">Falando...</p>
                  <p className="text-xs text-purple-600">Orky está respondendo</p>
                </>
              ) : (
                <>
                  <Sparkles className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                  <p className="text-sm text-purple-800 font-medium">Assistente Ativo</p>
                  <p className="text-xs text-purple-600">Pronto para comandos</p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Toggle Button */}
        <div className="flex justify-center">
          <Button
            size="lg"
            onClick={handleVoiceToggle}
            disabled={isLoading || (!hasMicrophonePermission && permissions.microphone === 'denied')}
            className={
              isVoiceEnabled 
                ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700" 
                : "bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800"
            }
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
            ) : isVoiceEnabled ? (
              <VolumeX className="h-5 w-5 mr-2" />
            ) : (
              <Mic className="h-5 w-5 mr-2" />
            )}
            {isLoading ? 'Carregando...' : isVoiceEnabled ? 'Desativar Voz' : 'Ativar Voz'}
          </Button>
        </div>

        {/* Instructions */}
        {isVoiceEnabled && profile && (
          <div className="text-center text-xs text-gray-600">
            <p>Diga "Olá Orky" para começar uma conversa</p>
            <p className="mt-1">Ou clique no assistente flutuante para interagir</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
