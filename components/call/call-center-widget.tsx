'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { 
  Phone, 
  PhoneCall, 
  PhoneOff, 
  Video, 
  Mic, 
  MicOff,
  Volume2,
  VolumeX,
  X,
  Minimize2,
  Maximize2,
  Clock,
  History
} from 'lucide-react'
import { useCall } from '@/hooks/use-call'

interface CallCenterWidgetProps {
  isVisible?: boolean
  className?: string
}

interface ActiveCall {
  id: string
  user: {
    id: string
    name: string
    photo?: string
  }
  type: 'audio' | 'video'
  status: 'connecting' | 'ringing' | 'active' | 'ended'
  startTime?: Date
  duration: number
}

interface CallHistory {
  id: string
  user: {
    id: string
    name: string
    photo?: string
  }
  type: 'audio' | 'video'
  direction: 'incoming' | 'outgoing'
  status: 'completed' | 'missed' | 'declined'
  duration: number
  timestamp: Date
}

export function CallCenterWidget({ isVisible = true, className = '' }: CallCenterWidgetProps) {
  const { callState } = useCall()
  const [isMinimized, setIsMinimized] = useState(false)
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null)
  const [callHistory, setCallHistory] = useState<CallHistory[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isSpeakerOn, setIsSpeakerOn] = useState(true)

  // Simular histórico de chamadas
  useEffect(() => {
    const demoHistory: CallHistory[] = [
      {
        id: '1',
        user: {
          id: 'ana',
          name: 'Ana Carolina',
          photo: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=100'
        },
        type: 'video',
        direction: 'outgoing',
        status: 'completed',
        duration: 325, // 5:25
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
      },
      {
        id: '2',
        user: {
          id: 'carlos',
          name: 'Carlos Eduardo',
          photo: 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=100'
        },
        type: 'audio',
        direction: 'incoming',
        status: 'missed',
        duration: 0,
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000)
      },
      {
        id: '3',
        user: {
          id: 'mariana',
          name: 'Mariana Silva',
          photo: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=100'
        },
        type: 'audio',
        direction: 'outgoing',
        status: 'completed',
        duration: 156, // 2:36
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000)
      }
    ]
    setCallHistory(demoHistory)
  }, [])

  // Simular chamada ativa quando modal de chamada estiver aberto
  useEffect(() => {
    if (callState.isOpen && callState.targetUser && callState.callType) {
      setActiveCall({
        id: Date.now().toString(),
        user: {
          id: callState.targetUser.id,
          name: callState.targetUser.name,
          photo: callState.targetUser.photo
        },
        type: callState.callType,
        status: 'connecting',
        startTime: new Date(),
        duration: 0
      })
      setIsMinimized(false)
    } else {
      setActiveCall(null)
    }
  }, [callState])

  // Timer para duração da chamada
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (activeCall && activeCall.status === 'active') {
      timer = setInterval(() => {
        setActiveCall(prev => prev ? { ...prev, duration: prev.duration + 1 } : null)
      }, 1000)
    }
    return () => {
      if (timer) clearInterval(timer)
    }
  }, [activeCall])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const formatTimestamp = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    
    if (diffHours < 1) {
      return `${Math.floor(diffMs / (1000 * 60))} min atrás`
    } else if (diffHours < 24) {
      return `${diffHours}h atrás`
    } else {
      return date.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }

  if (!isVisible) return null

  return (
    <div className={`fixed bottom-4 right-4 z-40 ${className}`}>
      {/* Widget Principal */}
      <div className={`bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden transition-all duration-300 ${
        isMinimized ? 'w-16 h-16' : activeCall ? 'w-80 h-96' : showHistory ? 'w-80 h-96' : 'w-64 h-auto'
      }`}>
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {activeCall ? (
                activeCall.type === 'video' ? <Video className="h-4 w-4" /> : <Phone className="h-4 w-4" />
              ) : (
                <PhoneCall className="h-4 w-4" />
              )}
              <span className="font-medium text-sm">
                {isMinimized ? '' : activeCall ? 'Chamada Ativa' : 'Central de Chamadas'}
              </span>
            </div>
            
            {!isMinimized && (
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowHistory(!showHistory)}
                  className="text-white hover:bg-white/20 p-1 h-6 w-6"
                  title="Histórico"
                >
                  <History className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMinimized(true)}
                  className="text-white hover:bg-white/20 p-1 h-6 w-6"
                  title="Minimizar"
                >
                  <Minimize2 className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Conteúdo */}
        {!isMinimized && (
          <div className="p-3">
            {activeCall ? (
              // Interface de Chamada Ativa
              <div className="space-y-4">
                {/* Info do usuário */}
                <div className="text-center">
                  <Avatar className="h-16 w-16 mx-auto mb-2">
                    <AvatarImage src={activeCall.user.photo} alt={activeCall.user.name} />
                    <AvatarFallback className="bg-purple-100 text-purple-700">
                      {activeCall.user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-medium text-gray-900">{activeCall.user.name}</h3>
                  <p className="text-sm text-gray-500">
                    {activeCall.status === 'connecting' && 'Conectando...'}
                    {activeCall.status === 'ringing' && 'Chamando...'}
                    {activeCall.status === 'active' && formatDuration(activeCall.duration)}
                  </p>
                </div>

                {/* Status da chamada */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Status:</span>
                    <span className={`font-medium ${
                      activeCall.status === 'active' ? 'text-green-600' : 
                      activeCall.status === 'connecting' ? 'text-blue-600' : 'text-gray-600'
                    }`}>
                      {activeCall.status === 'active' && '🟢 Ativo'}
                      {activeCall.status === 'connecting' && '🔄 Conectando'}
                      {activeCall.status === 'ringing' && '📞 Chamando'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-gray-600">Tipo:</span>
                    <span className="font-medium">
                      {activeCall.type === 'video' ? '📹 Vídeo' : '🎧 Áudio'}
                    </span>
                  </div>
                </div>

                {/* Controles da chamada */}
                {activeCall.status === 'active' && (
                  <div className="flex justify-center space-x-2">
                    <Button
                      variant={isMuted ? "destructive" : "secondary"}
                      size="sm"
                      onClick={() => setIsMuted(!isMuted)}
                      className="rounded-full w-10 h-10"
                    >
                      {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant={isSpeakerOn ? "secondary" : "destructive"}
                      size="sm"
                      onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                      className="rounded-full w-10 h-10"
                    >
                      {isSpeakerOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setActiveCall(null)}
                      className="rounded-full w-10 h-10"
                    >
                      <PhoneOff className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            ) : showHistory ? (
              // Histórico de Chamadas
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Histórico de Chamadas</h3>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {callHistory.map((call) => (
                    <div key={call.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={call.user.photo} alt={call.user.name} />
                        <AvatarFallback className="text-xs bg-purple-100 text-purple-700">
                          {call.user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{call.user.name}</p>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <span className={`${
                            call.direction === 'incoming' ? 'text-green-600' : 'text-blue-600'
                          }`}>
                            {call.direction === 'incoming' ? '↓' : '↑'}
                          </span>
                          <span>{call.type === 'video' ? '📹' : '🎧'}</span>
                          <span>{formatTimestamp(call.timestamp)}</span>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className={`text-xs font-medium ${
                          call.status === 'completed' ? 'text-green-600' : 
                          call.status === 'missed' ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {call.status === 'completed' && formatDuration(call.duration)}
                          {call.status === 'missed' && 'Perdida'}
                          {call.status === 'declined' && 'Recusada'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              // Estado Padrão
              <div className="text-center py-6">
                <PhoneCall className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Nenhuma chamada ativa</p>
                <p className="text-xs text-gray-400 mt-1">
                  {callHistory.length} chamadas no histórico
                </p>
                
                <div className="mt-4 space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowHistory(true)}
                    className="w-full text-xs"
                  >
                    <History className="h-3 w-3 mr-1" />
                    Ver Histórico
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Widget Minimizado */}
        {isMinimized && (
          <div 
            className="w-full h-full flex items-center justify-center cursor-pointer bg-gradient-to-r from-purple-600 to-pink-600"
            onClick={() => setIsMinimized(false)}
          >
            {activeCall ? (
              <div className="text-center">
                <Phone className="h-6 w-6 text-white mx-auto animate-pulse" />
                <div className="w-2 h-2 bg-green-400 rounded-full mx-auto mt-1"></div>
              </div>
            ) : (
              <PhoneCall className="h-6 w-6 text-white" />
            )}
          </div>
        )}
      </div>

      {/* Indicador de chamadas perdidas */}
      {callHistory.some(call => call.status === 'missed') && !activeCall && (
        <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
          <span className="text-xs text-white font-bold">
            {callHistory.filter(call => call.status === 'missed').length}
          </span>
        </div>
      )}
    </div>
  )
}
