'use client'

import { useEffect, useState } from 'react'
import { OrkutCard, OrkutCardContent, OrkutCardHeader } from '@/components/ui/orkut-card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Bell, 
  User, 
  MessageCircle, 
  UserPlus, 
  Heart, 
  Users, 
  Camera, 
  Settings,
  Clock,
  RefreshCw
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'

interface ActivityData {
  post_id?: number
  content?: string
  post_content?: string
  friend_id?: string
  friend_name?: string
  community_id?: string
  community_name?: string
  photo_url?: string
  old_value?: string
  new_value?: string
}

interface RecentActivity {
  id: string
  profile_id: string
  activity_type: 'post' | 'like' | 'comment' | 'friend_request' | 'friend_accepted' | 'community_joined' | 'photo_added' | 'profile_updated' | 'user_joined'
  activity_data: ActivityData
  created_at: string
  profile?: {
    id: string
    display_name: string
    username: string
    photo_url: string
  }
}

interface CommunityNotificationsProps {
  className?: string
}

export function CommunityNotifications({ className }: CommunityNotificationsProps) {
  const [activities, setActivities] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dataSource, setDataSource] = useState<string>('demo')

  // Demo activities para não deixar vazio
  const demoActivities: RecentActivity[] = [
    {
      id: 'demo1',
      profile_id: 'demo1',
      activity_type: 'user_joined',
      activity_data: {},
      created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 min atrás
      profile: {
        id: 'demo1',
        display_name: 'Ana Santos',
        username: 'ana_santos',
        photo_url: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=100'
      }
    },
    {
      id: 'demo2',
      profile_id: 'demo2',
      activity_type: 'post',
      activity_data: {
        content: 'Que nostalgia estar de volta no Orkut! 💜'
      },
      created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 min atrás
      profile: {
        id: 'demo2',
        display_name: 'Carlos Lima',
        username: 'carlos_lima',
        photo_url: 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=100'
      }
    },
    {
      id: 'demo3',
      profile_id: 'demo3',
      activity_type: 'community_joined',
      activity_data: {
        community_name: 'Nostalgia dos Anos 2000'
      },
      created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 min atrás
      profile: {
        id: 'demo3',
        display_name: 'Mariana Costa',
        username: 'mariana_costa',
        photo_url: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=100'
      }
    },
    {
      id: 'demo4',
      profile_id: 'demo4',
      activity_type: 'user_joined',
      activity_data: {},
      created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 min atrás
      profile: {
        id: 'demo4',
        display_name: 'Roberto Silva',
        username: 'roberto_silva',
        photo_url: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=100'
      }
    },
    {
      id: 'demo5',
      profile_id: 'demo5',
      activity_type: 'post',
      activity_data: {
        content: 'Este novo Orkut está incrível! Melhor que o original! 🚀'
      },
      created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1h atrás
      profile: {
        id: 'demo5',
        display_name: 'Juliana Oliveira',
        username: 'juliana_oliveira',
        photo_url: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100'
      }
    }
  ]

  const loadActivities = async () => {
    try {
      setLoading(true)
      setError(null)

      // Buscar atividades globais (de todos os usuários) para criar o feed da comunidade
      const response = await fetch('/api/recent-activities/global?limit=20')
      
      if (!response.ok) {
        throw new Error('Erro ao carregar atividades')
      }

      const data = await response.json()
      
      if (data.success) {
        // Se não há atividades no banco, usar demo
        const hasRealData = data.activities.length > 0
        setActivities(hasRealData ? data.activities : demoActivities)
        setDataSource(hasRealData ? data.source || 'database' : 'demo')
      } else {
        setActivities(demoActivities)
        setDataSource('demo')
      }
    } catch (err) {
      console.error('Erro ao carregar atividades:', err)
      setError('Erro ao carregar avisos')
      // Em caso de erro, usar demo
      setActivities(demoActivities)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadActivities()
    
    // Atualizar a cada 30 segundos
    const interval = setInterval(loadActivities, 30000)
    return () => clearInterval(interval)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_joined':
        return <UserPlus className="h-4 w-4 text-green-600" />
      case 'post':
        return <MessageCircle className="h-4 w-4 text-blue-600" />
      case 'like':
        return <Heart className="h-4 w-4 text-red-600" />
      case 'comment':
        return <MessageCircle className="h-4 w-4 text-purple-600" />
      case 'community_joined':
        return <Users className="h-4 w-4 text-orange-600" />
      case 'photo_added':
        return <Camera className="h-4 w-4 text-pink-600" />
      case 'profile_updated':
        return <Settings className="h-4 w-4 text-gray-600" />
      default:
        return <Bell className="h-4 w-4 text-gray-600" />
    }
  }

  const getActivityMessage = (activity: RecentActivity) => {
    const { activity_type, activity_data, profile } = activity
    const name = profile?.display_name || 'Usuário'
    
    switch (activity_type) {
      case 'user_joined':
        return `${name} acabou de se cadastrar no site! 🎉 Que tal dar as boas-vindas?`
      case 'post':
        return `${name} criou um novo post: "${activity_data.content?.substring(0, 60)}${activity_data.content && activity_data.content.length > 60 ? '...' : ''}"`
      case 'like':
        return `${name} curtiu uma publicação`
      case 'comment':
        return `${name} comentou em uma publicação`
      case 'friend_accepted':
        const friendName = activity_data.friend_name
        return friendName ? `${name} se tornou amigo(a) de ${friendName}! 🤝` : `${name} fez uma nova amizade!`
      case 'community_joined':
        return `${name} entrou na comunidade "${activity_data.community_name}" 👥`
      case 'photo_added':
        return `${name} adicionou uma nova foto 📸`
      case 'profile_updated':
        return `${name} atualizou o perfil ✨`
      default:
        return `${name} teve uma atividade recente`
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'user_joined':
        return 'bg-green-50 border-green-200'
      case 'post':
        return 'bg-blue-50 border-blue-200'
      case 'like':
        return 'bg-red-50 border-red-200'
      case 'comment':
        return 'bg-purple-50 border-purple-200'
      case 'community_joined':
        return 'bg-orange-50 border-orange-200'
      case 'photo_added':
        return 'bg-pink-50 border-pink-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  return (
    <OrkutCard className={className}>
      <OrkutCardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bell className="h-4 w-4 text-purple-600" />
            <span className="text-gray-600 text-sm font-medium">Avisos da Comunidade</span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="p-1 h-6 w-6 text-gray-500 hover:bg-gray-100"
            onClick={loadActivities}
            disabled={loading}
            title="Atualizar"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </OrkutCardHeader>
      <OrkutCardContent>
        {loading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto mb-2"></div>
            <p className="text-xs text-gray-500">Carregando avisos...</p>
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <Bell className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500 mb-2">{error}</p>
            <Button
              size="sm"
              variant="outline"
              onClick={loadActivities}
              className="text-xs"
            >
              Tentar novamente
            </Button>
          </div>
        ) : activities.length === 0 ? (
          <div className="p-6 text-center">
            <Bell className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500 mb-1">Nenhum aviso ainda</p>
            <p className="text-xs text-gray-400">Atividades da comunidade aparecerão aqui</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className={`p-3 rounded-lg border transition-colors hover:shadow-sm ${getActivityColor(activity.activity_type)}`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <Avatar className="h-8 w-8">
                      <AvatarImage 
                        src={activity.profile?.photo_url} 
                        alt={activity.profile?.display_name} 
                      />
                      <AvatarFallback className="text-xs bg-purple-500 text-white">
                        {activity.profile?.display_name?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      {getActivityIcon(activity.activity_type)}
                      <span className="text-xs text-gray-500 flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatDistanceToNow(new Date(activity.created_at), { addSuffix: true, locale: ptBR })}</span>
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-800 leading-relaxed">
                      {getActivityMessage(activity)}
                    </p>
                    
                    {/* Ações rápidas baseadas no tipo de atividade */}
                    <div className="flex items-center space-x-2 mt-2">
                      {activity.activity_type === 'user_joined' && (
                        <>
                          <Link href={`/perfil/${activity.profile?.username}`}>
                            <Button size="sm" variant="outline" className="text-xs h-6 px-2">
                              Ver perfil
                            </Button>
                          </Link>
                          <Button size="sm" variant="outline" className="text-xs h-6 px-2">
                            Adicionar amigo
                          </Button>
                        </>
                      )}
                      
                      {activity.activity_type === 'post' && activity.activity_data.post_id && (
                        <Button size="sm" variant="outline" className="text-xs h-6 px-2">
                          Ver post
                        </Button>
                      )}
                      
                      {activity.activity_type === 'community_joined' && (
                        <Button size="sm" variant="outline" className="text-xs h-6 px-2">
                          Ver comunidade
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Footer */}
        {!loading && !error && activities.length > 0 && (
          <div className="border-t border-gray-200 pt-3 mt-4">
            <Button
              variant="outline"
              size="sm"
              className="w-full border-purple-300 text-purple-700 hover:bg-purple-50 text-xs"
              onClick={() => window.location.href = '/atividades'}
            >
              Ver todas as atividades
            </Button>
          </div>
        )}
      </OrkutCardContent>
    </OrkutCard>
  )
}
