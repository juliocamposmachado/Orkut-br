'use client'

import React, { useState, useEffect } from 'react'
import { OrkutCard, OrkutCardContent, OrkutCardHeader } from '@/components/ui/orkut-card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { 
  LogIn, 
  Clock, 
  Eye, 
  RefreshCw,
  UserCheck,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Users
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useRouter } from 'next/navigation'

interface RecentLogin {
  id: string
  user_id: string
  display_name: string
  username: string
  photo_url: string
  login_time: string
  last_activity?: string
  user_agent?: string
  ip?: string
  status: 'online' | 'away' | 'offline'
  is_new_user?: boolean
}

export function RecentLoginsCard() {
  const [recentLogins, setRecentLogins] = useState<RecentLogin[]>([])
  const [loading, setLoading] = useState(true)
  const [isExpanded, setIsExpanded] = useState(false)
  const router = useRouter()

  const loadRecentLogins = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/auth/recent-logins')
      
      if (response.ok) {
        const data = await response.json()
        setRecentLogins(data.logins || [])
      } else {
        console.error('Erro ao carregar logins recentes')
        // Fallback com dados demo para demonstração
        setRecentLogins([
          {
            id: '1',
            user_id: 'demo1',
            display_name: 'Carlos Silva',
            username: 'carlos_silva',
            photo_url: 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=100',
            login_time: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
            status: 'online'
          },
          {
            id: '2',
            user_id: 'demo2',
            display_name: 'Ana Costa',
            username: 'ana_costa',
            photo_url: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=100',
            login_time: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
            status: 'online',
            is_new_user: true
          },
          {
            id: '3',
            user_id: 'demo3',
            display_name: 'Roberto Oliveira',
            username: 'roberto_oliveira',
            photo_url: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=100',
            login_time: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
            status: 'online'
          },
          {
            id: '4',
            user_id: 'demo4',
            display_name: 'Mariana Santos',
            username: 'mariana_santos',
            photo_url: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=100',
            login_time: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
            status: 'away'
          },
          {
            id: '5',
            user_id: 'demo5',
            display_name: 'Fernando Lima',
            username: 'fernando_lima',
            photo_url: 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=100',
            login_time: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
            status: 'online'
          }
        ])
      }
    } catch (error) {
      console.error('Erro ao buscar logins recentes:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRecentLogins()
    
    // Atualizar a cada 30 segundos
    const interval = setInterval(loadRecentLogins, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500'
      case 'away': return 'bg-yellow-500'
      case 'offline': return 'bg-gray-400'
      default: return 'bg-gray-400'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return 'Online'
      case 'away': return 'Ausente'
      case 'offline': return 'Offline'
      default: return 'Desconhecido'
    }
  }

  const onlineCount = recentLogins.filter(login => login.status === 'online').length
  const newUsersCount = recentLogins.filter(login => login.is_new_user).length

  const visibleLogins = isExpanded ? recentLogins : recentLogins.slice(0, 5)

  return (
    <OrkutCard className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
      <OrkutCardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <LogIn className="h-5 w-5 text-green-600" />
            <span className="font-semibold text-green-800">Logins Recentes</span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-green-600 hover:bg-green-100"
            onClick={loadRecentLogins}
            disabled={loading}
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Estatísticas */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="p-2 bg-white/80 rounded-lg border border-green-200 text-center">
            <div className="text-lg font-bold text-green-700">{onlineCount}</div>
            <div className="text-xs text-green-600">Online agora</div>
          </div>
          <div className="p-2 bg-white/80 rounded-lg border border-green-200 text-center">
            <div className="text-lg font-bold text-blue-700">{newUsersCount}</div>
            <div className="text-xs text-blue-600">Novos usuários</div>
          </div>
        </div>

        {/* Filtros rápidos */}
        <div className="mt-3 flex justify-center">
          <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300 text-xs">
            <Clock className="h-3 w-3 mr-1" />
            Últimos 30 minutos
          </Badge>
        </div>
      </OrkutCardHeader>

      <OrkutCardContent>
        {loading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto mb-2"></div>
            <p className="text-xs text-gray-500">Carregando logins...</p>
          </div>
        ) : recentLogins.length === 0 ? (
          <div className="p-6 text-center">
            <LogIn className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Nenhum login recente</p>
          </div>
        ) : (
          <div className="space-y-2">
            {visibleLogins.map((login) => (
              <div 
                key={login.id} 
                className="flex items-center space-x-3 p-3 rounded-lg bg-white/60 hover:bg-white/80 transition-colors border border-green-100 group"
              >
                <div className="relative">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={login.photo_url} alt={login.display_name} />
                    <AvatarFallback className="text-xs bg-green-500 text-white">
                      {login.display_name.substring(0, 1).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 ${getStatusColor(login.status)} rounded-full border border-white`}></div>
                  {login.is_new_user && (
                    <div className="absolute -top-1 -right-1">
                      <div className="w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                        <div className="w-1 h-1 bg-white rounded-full"></div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {login.display_name}
                    </p>
                    {login.is_new_user && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs h-4 px-1">
                        Novo
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    <span>
                      {formatDistanceToNow(new Date(login.login_time), { 
                        addSuffix: true, 
                        locale: ptBR 
                      })}
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className={login.status === 'online' ? 'text-green-600' : login.status === 'away' ? 'text-yellow-600' : 'text-gray-500'}>
                      {getStatusText(login.status)}
                    </span>
                  </div>
                </div>

                {/* Ações rápidas */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-6 w-6 p-0 text-gray-600 hover:bg-gray-200"
                    title="Ver perfil"
                    onClick={() => router.push(`/perfil/${login.username}`)}
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-6 w-6 p-0 text-gray-600 hover:bg-gray-200"
                    title="Enviar mensagem"
                    onClick={() => router.push(`/mensagens?user=${login.username}`)}
                  >
                    <MessageCircle className="h-3 w-3" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-6 w-6 p-0 text-gray-600 hover:bg-gray-200"
                    title="Adicionar amigo"
                    onClick={() => {/* Implementar lógica de adicionar amigo */}}
                  >
                    <UserCheck className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Botão Expandir/Recolher */}
        {recentLogins.length > 5 && (
          <div className="mt-3 text-center">
            <Button
              variant="ghost"
              size="sm"
              className="text-green-600 hover:bg-green-50 text-xs"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-3 w-3 mr-1" />
                  Mostrar menos
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3 mr-1" />
                  Ver mais ({recentLogins.length - 5} usuários)
                </>
              )}
            </Button>
          </div>
        )}

        {/* Ações do Card */}
        <div className="mt-4 pt-3 border-t border-green-200">
          <div className="grid grid-cols-2 gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              className="text-xs border-green-300 text-green-700 hover:bg-green-50"
              onClick={() => router.push('/membros')}
            >
              <Users className="h-3 w-3 mr-1" />
              Todos os membros
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="text-xs border-green-300 text-green-700 hover:bg-green-50"
              onClick={() => router.push('/buscar')}
            >
              <UserCheck className="h-3 w-3 mr-1" />
              Buscar amigos
            </Button>
          </div>
        </div>

      </OrkutCardContent>
    </OrkutCard>
  )
}
