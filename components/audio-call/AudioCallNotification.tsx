'use client'

import { useEffect, useState } from 'react'
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Phone, 
  PhoneOff, 
  Volume2,
  User
} from 'lucide-react'
import { IncomingCall } from '@/hooks/useAudioCall'
import { cn } from '@/lib/utils'

interface AudioCallNotificationProps {
  incomingCall: IncomingCall | null
  onAccept: () => void
  onReject: () => void
  className?: string
}

export function AudioCallNotification({
  incomingCall,
  onAccept,
  onReject,
  className
}: AudioCallNotificationProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [ringCount, setRingCount] = useState(0)

  // Controlar visibilidade e animação
  useEffect(() => {
    if (incomingCall) {
      setIsVisible(true)
      setRingCount(0)
      
      // Simular toques de chamada
      const ringInterval = setInterval(() => {
        setRingCount(prev => prev + 1)
      }, 1000)

      return () => clearInterval(ringInterval)
    } else {
      // Delay para suavizar o desaparecimento
      const timer = setTimeout(() => setIsVisible(false), 300)
      return () => clearTimeout(timer)
    }
  }, [incomingCall])

  // Auto-reject após um tempo (opcional)
  useEffect(() => {
    if (incomingCall) {
      const autoRejectTimer = setTimeout(() => {
        console.log('📞 Auto-rejeitando chamada após timeout')
        onReject()
      }, 30000) // 30 segundos

      return () => clearTimeout(autoRejectTimer)
    }
  }, [incomingCall, onReject])

  if (!isVisible || !incomingCall) {
    return null
  }

  const { callerInfo, callType } = incomingCall

  return (
    <div className={cn(
      "fixed top-4 right-4 z-50 transition-all duration-300",
      incomingCall ? "animate-in slide-in-from-right" : "animate-out slide-out-to-right",
      className
    )}>
      <Card className="w-80 shadow-2xl border-2 border-blue-200 bg-white">
        <CardContent className="p-4">
          {/* Header com badge */}
          <div className="flex items-center justify-between mb-3">
            <Badge className="bg-blue-500 hover:bg-blue-600">
              📞 Chamada recebida
            </Badge>
            <div className="flex items-center space-x-1">
              <Volume2 className={cn(
                "w-4 h-4 text-blue-500 transition-all",
                ringCount % 2 === 0 ? "scale-100" : "scale-110"
              )} />
            </div>
          </div>

          {/* Informações do usuário */}
          <div className="flex items-center space-x-3 mb-4">
            <div className="relative">
              <Avatar className="w-12 h-12 ring-2 ring-blue-200">
                <AvatarImage 
                  src={callerInfo.photo_url} 
                  alt={callerInfo.display_name} 
                />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                  {callerInfo.display_name[0] || <User className="w-4 h-4" />}
                </AvatarFallback>
              </Avatar>
              
              {/* Indicador de pulso */}
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse" />
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900 truncate">
                {callerInfo.display_name}
              </h4>
              <p className="text-sm text-gray-500 truncate">
                @{callerInfo.username}
              </p>
              <p className="text-xs text-gray-400">
                Chamada de {callType === 'audio' ? 'áudio' : 'vídeo'}
              </p>
            </div>
          </div>

          {/* Indicador de toque */}
          <div className="mb-4 text-center">
            <div className={cn(
              "inline-flex items-center space-x-2 text-sm text-gray-600 transition-all",
              ringCount % 2 === 0 ? "opacity-100" : "opacity-70"
            )}>
              <div className="flex space-x-1">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className={cn(
                      "w-2 h-2 rounded-full bg-blue-400 transition-all duration-300",
                      (ringCount + i) % 3 === 0 ? "scale-125 bg-blue-600" : "scale-100"
                    )}
                  />
                ))}
              </div>
              <span>Tocando...</span>
            </div>
          </div>

          {/* Botões de ação */}
          <div className="flex space-x-3">
            <Button
              variant="destructive"
              size="sm"
              className="flex-1 bg-red-500 hover:bg-red-600"
              onClick={onReject}
            >
              <PhoneOff className="w-4 h-4 mr-2" />
              Recusar
            </Button>
            
            <Button
              variant="default"
              size="sm"
              className="flex-1 bg-green-500 hover:bg-green-600"
              onClick={onAccept}
            >
              <Phone className="w-4 h-4 mr-2" />
              Aceitar
            </Button>
          </div>

          {/* Informações adicionais */}
          <div className="mt-3 pt-2 border-t text-xs text-gray-400 text-center">
            <p>A chamada será encerrada automaticamente em {30 - ringCount}s</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
