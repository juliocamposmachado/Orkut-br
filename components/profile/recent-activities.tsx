'use client'

import { useState, useEffect } from 'react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { MessageCircle, Heart, Users, Camera, Settings, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface RecentActivity {
  id: string
  profile_id: string
  activity_type: 'post' | 'like' | 'comment' | 'friend_request' | 'friend_accepted' | 'community_joined' | 'photo_added' | 'profile_updated'
  activity_data: {
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
  created_at: string
}

interface RecentActivitiesProps {
  profileId: string
  userProfile: {
    id: string
    display_name: string
    photo_url?: string
    username: string
  }
  loading?: boolean
}

export function RecentActivities({ profileId, userProfile, loading = false }: RecentActivitiesProps) {
  const [activities, setActivities] = useState<RecentActivity[]>([])
  const [loadingActivities, setLoadingActivities] = useState(true)

  useEffect(() => {
    if (profileId) {
      loadActivities()
    }
  }, [profileId])

  const loadActivities = async () => {
    try {
      setLoadingActivities(true)
      console.log(`🔄 Carregando atividades para: ${profileId}`)
      
      const response = await fetch(`/api/recent-activities?profile_id=${profileId}&limit=10`)
      const result = await response.json()

      if (result.success) {
        setActivities(result.activities || [])
        console.log(`✅ ${result.activities?.length || 0} atividades carregadas`)
      } else {
        console.warn('⚠️ Erro ao carregar atividades:', result.error)
      }
    } catch (error) {
      console.error('❌ Erro ao carregar atividades:', error)
    } finally {
      setLoadingActivities(false)
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'post':
        return <MessageCircle className="h-4 w-4 text-blue-500" />
      case 'like':
        return <Heart className="h-4 w-4 text-red-500" />
      case 'comment':
        return <MessageCircle className="h-4 w-4 text-green-500" />
      case 'friend_request':
      case 'friend_accepted':
        return <Users className="h-4 w-4 text-purple-500" />
      case 'community_joined':
        return <Users className="h-4 w-4 text-orange-500" />
      case 'photo_added':
        return <Camera className="h-4 w-4 text-pink-500" />
      case 'profile_updated':
        return <Settings className="h-4 w-4 text-gray-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getActivityText = (activity: RecentActivity) => {
    const { activity_type, activity_data } = activity
    
    switch (activity_type) {
      case 'post':
        return {
          action: 'publicou um novo post',
          content: activity_data.content || 'Novo post publicado'
        }
      case 'like':
        return {
          action: 'curtiu um post',
          content: activity_data.post_content?.substring(0, 50) + (activity_data.post_content && activity_data.post_content.length > 50 ? '...' : '') || 'Post curtido'
        }
      case 'comment':
        return {
          action: 'comentou em um post',
          content: activity_data.content || 'Novo comentário'
        }
      case 'friend_request':
        return {
          action: 'enviou solicitação de amizade para',
          content: activity_data.friend_name || 'Usuário'
        }
      case 'friend_accepted':
        return {
          action: 'aceitou solicitação de amizade de',
          content: activity_data.friend_name || 'Usuário'
        }
      case 'community_joined':
        return {
          action: 'entrou na comunidade',
          content: activity_data.community_name || 'Nova comunidade'
        }
      case 'photo_added':
        return {
          action: 'adicionou uma nova foto',
          content: 'Nova foto no perfil'
        }
      case 'profile_updated':
        return {
          action: 'atualizou o perfil',
          content: `${activity_data.old_value || 'Campo'} → ${activity_data.new_value || 'Novo valor'}`
        }
      default:
        return {
          action: 'teve uma atividade',
          content: 'Atividade no perfil'
        }
    }
  }

  if (loading || loadingActivities) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, idx) => (
          <div key={idx} className="border border-gray-200 rounded-lg p-3 animate-pulse">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex-shrink-0"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="mb-2">Nenhuma atividade recente</p>
        <p className="text-sm">
          As atividades aparecerão aqui conforme você usa o Orkut
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => {
        const activityText = getActivityText(activity)
        
        return (
          <div key={activity.id} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors">
            <div className="flex items-start space-x-3">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarImage 
                  src={userProfile.photo_url || undefined} 
                  alt={userProfile.display_name} 
                />
                <AvatarFallback className="text-xs bg-purple-500 text-white">
                  {userProfile.display_name?.charAt(0)?.toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium text-sm text-gray-800 truncate">
                        {userProfile.display_name}
                      </h4>
                      {getActivityIcon(activity.activity_type)}
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(activity.created_at), {
                          addSuffix: true,
                          locale: ptBR
                        })}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-700 mb-1">
                      {activityText.action}
                    </p>
                    
                    {activityText.content && (
                      <p className="text-xs text-gray-600 bg-gray-100 rounded p-2 break-words">
                        {activityText.content}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
