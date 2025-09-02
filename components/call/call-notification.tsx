'use client'

import { useCallNotifications } from '@/hooks/use-call-notifications'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Phone, PhoneOff, Video, Mic } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'

export function CallNotification() {
  const { incomingCall, isRinging, acceptCall, rejectCall } = useCallNotifications()
  const [callDuration, setCallDuration] = useState(0)
  const [isResponding, setIsResponding] = useState(false)

  // Logging detalhado para debug
  console.log('🎦 [CallNotification] Renderizando:', {
    incomingCall: incomingCall ? {
      callId: incomingCall.callId,
      callType: incomingCall.callType,
      fromUser: incomingCall.fromUser.display_name
    } : null,
    isRinging,
    callDuration,
    isResponding
  })

  // Timer para contagem de tempo da chamada
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null
    
    if (isRinging && incomingCall) {
      timer = setInterval(() => {
        setCallDuration(prev => prev + 1)
        
        // Auto-rejeitar após 30 segundos
        if (callDuration >= 30) {
          handleReject()
        }
      }, 1000)
    } else {
      setCallDuration(0)
    }

    return () => {
      if (timer) clearInterval(timer)
    }
  }, [isRinging, callDuration, incomingCall])

  const handleAccept = async () => {
    if (!incomingCall || isResponding) return
    
    setIsResponding(true)
    try {
      await acceptCall(incomingCall)
    } finally {
      setIsResponding(false)
    }
  }

  const handleReject = async () => {
    if (!incomingCall || isResponding) return
    
    setIsResponding(true)
    try {
      await rejectCall(incomingCall.callId)
    } finally {
      setIsResponding(false)
    }
  }

  // Log para debug antes de retornar null
  if (!incomingCall && !isRinging) {
    console.log('📵 CallNotification: Nenhuma chamada ativa')
  } else if (!incomingCall && isRinging) {
    console.log('⚠️ CallNotification: isRinging=true mas incomingCall=null')
  } else if (incomingCall && !isRinging) {
    console.log('⚠️ CallNotification: incomingCall existe mas isRinging=false')
  }

  if (!incomingCall || !isRinging) {
    console.log('❌ CallNotification: Retornando null - não renderizando')
    return null
  }

  console.log('✅ CallNotification: RENDERIZANDO interface de chamada!')

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 50 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      >
        <motion.div
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="bg-white rounded-2xl p-8 shadow-2xl max-w-sm mx-4 border-4 border-purple-200"
        >
          {/* Avatar e Info do Usuário */}
          <div className="text-center mb-6">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="mb-4"
            >
              <Avatar className="w-24 h-24 mx-auto border-4 border-purple-300">
                <AvatarImage src={incomingCall.fromUser.photo_url} />
                <AvatarFallback className="text-2xl bg-gradient-to-br from-purple-400 to-pink-400 text-white">
                  {incomingCall.fromUser.display_name.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </motion.div>
            
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {incomingCall.fromUser.display_name}
            </h3>
            
            <p className="text-gray-600 text-sm mb-3">
              @{incomingCall.fromUser.username}
            </p>
            
            <Badge variant="secondary" className="mb-4 px-3 py-1">
              {incomingCall.callType === 'video' ? (
                <>
                  <Video className="w-4 h-4 mr-2" />
                  Chamada de Vídeo
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 mr-2" />
                  Chamada de Áudio
                </>
              )}
            </Badge>
          </div>

          {/* Status da chamada */}
          <div className="text-center mb-6">
            <motion.p
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-purple-600 font-semibold text-lg"
            >
              Chamada recebida...
            </motion.p>
            
            <p className="text-gray-500 text-sm mt-2">
              {Math.floor(callDuration / 60)}:{String(callDuration % 60).padStart(2, '0')}
            </p>
          </div>

          {/* Botões de Ação */}
          <div className="flex justify-center space-x-6">
            {/* Botão Rejeitar */}
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button
                onClick={handleReject}
                disabled={isResponding}
                size="lg"
                className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg border-4 border-white"
              >
                <PhoneOff className="w-7 h-7" />
              </Button>
            </motion.div>
            
            {/* Botão Aceitar */}
            <motion.div 
              whileHover={{ scale: 1.1 }} 
              whileTap={{ scale: 0.9 }}
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            >
              <Button
                onClick={handleAccept}
                disabled={isResponding}
                size="lg"
                className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-lg border-4 border-white"
              >
                <Phone className="w-7 h-7" />
              </Button>
            </motion.div>
          </div>
          
          {/* Loading */}
          {isResponding && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center mt-4 text-sm text-gray-500"
            >
              Processando...
            </motion.p>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
