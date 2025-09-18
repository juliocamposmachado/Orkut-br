'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { getCallHistory, type CallHistoryData } from '@/lib/seed-call-history'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Phone, PhoneOff, Video, Mic, Clock, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface MissedCall extends CallHistoryData {}

export function MissedCallsHistory() {
  const { user } = useAuth()
  const [missedCalls, setMissedCalls] = useState<MissedCall[]>([])
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (!user) return

    loadMissedCalls()
    
    // Listener para mostrar o histórico quando solicitado
    const handleShowHistory = () => {
      setIsVisible(true)
      loadMissedCalls()
    }

    window.addEventListener('showMissedCallsHistory', handleShowHistory)
    
    return () => {
      window.removeEventListener('showMissedCallsHistory', handleShowHistory)
    }
  }, [user])

  const loadMissedCalls = async () => {
    if (!user) return

    try {
      console.log('📋 [PAUSADO] Histórico de chamadas temporáriamente desabilitado')
      
      // TODO: Reativar quando sistema estiver estabilizado
      // const allCalls = await getCallHistory(user.id)
      // const missedOnly = allCalls.filter(call => 
      //   call.type === 'missed_call' || 
      //   (call.payload.status === 'missed' && !call.read)
      // )
      // setMissedCalls(missedOnly)
      
      // Por enquanto, manter vazio para evitar erros
      setMissedCalls([])
      console.log('✅ Histórico pausado com sucesso (0 chamadas)')

    } catch (error) {
      console.error('❌ Erro ao pausar histórico:', error)
      setMissedCalls([])
    }
  }

  const clearHistory = async () => {
    if (!user) return

    try {
      // Limpar histórico local
      setMissedCalls([])
      console.log('✅ Histórico limpo (modo simulado)')
      
      // TODO: Implementar limpeza real no backend quando necessário
    } catch (error) {
      console.error('❌ Erro ao limpar histórico:', error)
    }
  }

  const callBack = async (fromUserId: string, callType: 'audio' | 'video') => {
    console.log('📞 Retornando chamada para:', fromUserId, 'tipo:', callType)
    // Implementar lógica de retorno de chamada
    // Pode usar o hook useCallNotifications para iniciar uma nova chamada
    setIsVisible(false)
  }

  if (!isVisible || missedCalls.length === 0) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        onClick={() => setIsVisible(false)}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="bg-white rounded-2xl p-6 shadow-2xl max-w-md mx-4 max-h-[70vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Chamadas Perdidas</h3>
              <p className="text-sm text-gray-600">Últimos 7 dias</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Lista de chamadas */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {missedCalls.map((call) => (
              <motion.div
                key={call.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                {/* Avatar */}
                <Avatar className="w-12 h-12">
                  <AvatarImage src={call.payload.from_user.photo_url} />
                  <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white">
                    {call.payload.from_user.display_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {call.payload.from_user.display_name}
                  </p>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    {call.payload.call_type === 'video' ? (
                      <Video className="w-3 h-3" />
                    ) : (
                      <Mic className="w-3 h-3" />
                    )}
                    <span>
                      {call.payload.call_type === 'video' ? 'Vídeo' : 'Áudio'}
                    </span>
                    <Clock className="w-3 h-3 ml-2" />
                    <span>
                      {formatDistanceToNow(new Date(call.created_at), { 
                        addSuffix: true, 
                        locale: ptBR 
                      })}
                    </span>
                  </div>
                </div>

                {/* Botão de retornar chamada */}
                <Button
                  size="sm"
                  onClick={() => callBack(call.payload.from_user.id, call.payload.call_type)}
                  className="h-8 w-8 p-0 rounded-full bg-green-500 hover:bg-green-600"
                  title="Retornar chamada"
                >
                  <Phone className="w-4 h-4" />
                </Button>
              </motion.div>
            ))}
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center mt-6 pt-4 border-t">
            <p className="text-sm text-gray-500">
              {missedCalls.length} chamada{missedCalls.length !== 1 ? 's' : ''} perdida{missedCalls.length !== 1 ? 's' : ''}
            </p>
            <div className="space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={clearHistory}
              >
                Limpar Histórico
              </Button>
              <Button
                size="sm"
                onClick={() => setIsVisible(false)}
              >
                Fechar
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
