'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/local-auth-context'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { OrkutCard, OrkutCardContent, OrkutCardHeader } from '@/components/ui/orkut-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Activity,
  Heart,
  MessageCircle,
  UserPlus,
  Users,
  Camera,
  RefreshCw,
  Loader2,
  Clock,
  Filter,
  TrendingUp,
  AlertCircle,
  User,
  ExternalLink
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

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
  activity_type: 'post' | 'like' | 'comment' | 'friend_request' | 'friend_accepted' | 'community_joined' | 'photo_added' | 'profile_updated'
  activity_data: ActivityData
  created_at: string
  target_profile_id?: string
}

type FilterType = 'all' | 'social' | 'content' | 'friends' | 'communities'

// Dados demo para demonstração
const demoActivities: RecentActivity[] = [
  {
    id: '1',
    profile_id: 'demo-user-1',
    activity_type: 'post',
    activity_data: {
      post_id: 1,
      content: 'Acabei de postar uma nova reflexão sobre tecnologia e humanidade! 💜'
    },
    created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString()
  },
  {
    id: '2', 
    profile_id: 'demo-user-2',
    activity_type: 'like',
    activity_data: {
      post_id: 2,
      post_content: 'A página de fotos do Orkut BR ainda está em ajustes técnicos...'
    },
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString()
  },
  {
    id: '3',
    profile_id: 'demo-user-1',
    activity_type: 'friend_accepted',
    activity_data: {
      friend_id: 'demo-user-3',
      friend_name: 'Marina Santos'
    },
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '4',
    profile_id: 'demo-user-1',
    activity_type: 'community_joined',
    activity_data: {
      community_id: '1',
      community_name: 'Orkut Fraternal'
    },
    created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '5',
    profile_id: 'demo-user-1',
    activity_type: 'photo_added',
    activity_data: {
      photo_url: 'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?auto=compress&cs=tinysrgb&w=300&h=300'
    },
    created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '6',
    profile_id: 'demo-user-1',
    activity_type: 'comment',
    activity_data: {
      post_id: 3,
      content: 'Excelente reflexão! Concordo totalmente.',
      post_content: 'Comunidade Orkut Fraternal: Um espaço de evolução humana...'
    },
    created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
  }
]

export default function AtividadesPage() {
  const { user } = useAuth()
  const [activities, setActivities] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterType>('all')
  const [refreshing, setRefreshing] = useState(false)

  // Carregar atividades
  const loadActivities = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/recent-activities?profile_id=${user.id}&limit=50`)
      const data = await response.json()
      
      if (data.success) {
        // Se não há atividades reais, usar dados demo
        if (data.activities.length === 0) {
          setActivities(demoActivities)
        } else {
          setActivities(data.activities)
        }
      } else {
        // Fallback para dados demo
        setActivities(demoActivities)
      }
    } catch (err) {
      console.error('Erro ao carregar atividades:', err)
      // Fallback para dados demo
      setActivities(demoActivities)
    } finally {
      setLoading(false)
    }
  }

  // Refresh das atividades
  const handleRefresh = async () => {
    setRefreshing(true)
    await loadActivities()
    setRefreshing(false)
  }

  // Filtrar atividades
  const filteredActivities = activities.filter(activity => {
    switch (filter) {
      case 'social':
        return ['like', 'comment'].includes(activity.activity_type)
      case 'content':
        return ['post', 'photo_added'].includes(activity.activity_type)
      case 'friends':
        return ['friend_request', 'friend_accepted'].includes(activity.activity_type)
      case 'communities':
        return ['community_joined'].includes(activity.activity_type)
      default:
        return true
    }
  })

  // Ícone da atividade
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'post': return <MessageCircle className="w-4 h-4" />
      case 'like': return <Heart className="w-4 h-4 text-red-500" />
      case 'comment': return <MessageCircle className="w-4 h-4" />
      case 'friend_request': return <UserPlus className="w-4 h-4" />
      case 'friend_accepted': return <User className="w-4 h-4 text-green-500" />
      case 'community_joined': return <Users className="w-4 h-4 text-blue-500" />
      case 'photo_added': return <Camera className="w-4 h-4 text-purple-500" />
      case 'profile_updated': return <User className="w-4 h-4 text-orange-500" />
      default: return <Activity className="w-4 h-4" />
    }
  }

  // Cor da atividade
  const getActivityColor = (type: string) => {
    switch (type) {
      case 'post': return 'text-blue-600 bg-blue-50'
      case 'like': return 'text-red-600 bg-red-50'
      case 'comment': return 'text-purple-600 bg-purple-50'
      case 'friend_request': return 'text-green-600 bg-green-50'
      case 'friend_accepted': return 'text-green-600 bg-green-50'
      case 'community_joined': return 'text-indigo-600 bg-indigo-50'
      case 'photo_added': return 'text-pink-600 bg-pink-50'
      case 'profile_updated': return 'text-orange-600 bg-orange-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  // Descrição da atividade
  const getActivityDescription = (activity: RecentActivity) => {
    const { activity_type, activity_data } = activity
    
    switch (activity_type) {
      case 'post':
        return 'Você publicou um novo post'
      case 'like':
        return 'Você curtiu um post'
      case 'comment':
        return `Você comentou: "${activity_data.content}"`
      case 'friend_request':
        return `Você enviou uma solicitação de amizade para ${activity_data.friend_name}`
      case 'friend_accepted':
        return `Você e ${activity_data.friend_name} agora são amigos`
      case 'community_joined':
        return `Você entrou na comunidade "${activity_data.community_name}"`
      case 'photo_added':
        return 'Você adicionou uma nova foto'
      case 'profile_updated':
        return 'Você atualizou seu perfil'
      default:
        return 'Atividade'
    }
  }

  useEffect(() => {
    if (user) {
      loadActivities()
    }
  }, [user])

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-16 h-16 text-purple-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Faça login para ver suas atividades</h2>
          <p className="text-gray-600 mb-4">Conecte-se para acompanhar todas as suas atividades no Orkut</p>
          <Button asChild>
            <Link href="/login">Fazer Login</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <Navbar />
      
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 rounded-full p-3">
                <Activity className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Minhas Atividades</h1>
                <p className="text-purple-100">
                  {loading 
                    ? 'Carregando atividades...' 
                    : `${filteredActivities.length} atividades encontradas`
                  }
                </p>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Button 
                variant="secondary"
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw className={cn('w-4 h-4 mr-2', refreshing && 'animate-spin')} />
                Atualizar
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          
          {/* Sidebar */}
          <div className="space-y-4">
            {/* Filtros */}
            <OrkutCard>
              <OrkutCardHeader>
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4" />
                  <span>Filtrar Atividades</span>
                </div>
              </OrkutCardHeader>
              <OrkutCardContent className="space-y-2">
                <Button
                  variant={filter === 'all' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setFilter('all')}
                >
                  <Activity className="w-4 h-4 mr-2" />
                  Todas
                </Button>
                <Button
                  variant={filter === 'content' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setFilter('content')}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Posts e Fotos
                </Button>
                <Button
                  variant={filter === 'social' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setFilter('social')}
                >
                  <Heart className="w-4 h-4 mr-2" />
                  Curtidas e Comentários
                </Button>
                <Button
                  variant={filter === 'friends' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setFilter('friends')}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Amigos
                </Button>
                <Button
                  variant={filter === 'communities' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setFilter('communities')}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Comunidades
                </Button>
              </OrkutCardContent>
            </OrkutCard>

            {/* Estatísticas */}
            <OrkutCard>
              <OrkutCardHeader>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4" />
                  <span>Estatísticas</span>
                </div>
              </OrkutCardHeader>
              <OrkutCardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total de atividades:</span>
                    <span className="font-medium">{activities.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Posts criados:</span>
                    <span className="font-medium">
                      {activities.filter(a => a.activity_type === 'post').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Curtidas dadas:</span>
                    <span className="font-medium">
                      {activities.filter(a => a.activity_type === 'like').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Novos amigos:</span>
                    <span className="font-medium">
                      {activities.filter(a => a.activity_type === 'friend_accepted').length}
                    </span>
                  </div>
                </div>
              </OrkutCardContent>
            </OrkutCard>

            {/* Instruções */}
            <OrkutCard>
              <OrkutCardHeader>
                <span>Sobre as Atividades</span>
              </OrkutCardHeader>
              <OrkutCardContent>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>📊 Acompanhe todas as suas ações no Orkut</p>
                  <p>🔍 Use os filtros para encontrar atividades específicas</p>
                  <p>⏰ Atividades são organizadas por data</p>
                  <p>🔄 Clique em "Atualizar" para ver as mais recentes</p>
                </div>
              </OrkutCardContent>
            </OrkutCard>
          </div>

          {/* Lista de Atividades */}
          <div className="space-y-4">
            {/* Error State */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <h3 className="font-medium text-red-800">Erro</h3>
                </div>
                <p className="text-red-600 mt-1">{error}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={loadActivities}
                >
                  Tentar novamente
                </Button>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500 mr-3" />
                <span className="text-gray-600">Carregando atividades...</span>
              </div>
            )}

            {/* Lista de Atividades */}
            {!loading && !error && (
              <div className="space-y-3">
                {filteredActivities.length > 0 ? (
                  filteredActivities.map((activity) => (
                    <OrkutCard key={activity.id} className="hover:shadow-md transition-shadow">
                      <OrkutCardContent className="p-4">
                        <div className="flex items-start space-x-3">
                          {/* Ícone da atividade */}
                          <div className={cn(
                            'rounded-full p-2 flex items-center justify-center',
                            getActivityColor(activity.activity_type)
                          )}>
                            {getActivityIcon(activity.activity_type)}
                          </div>
                          
                          {/* Conteúdo */}
                          <div className="flex-1 min-w-0">
                            <p className="text-gray-900 font-medium">
                              {getActivityDescription(activity)}
                            </p>
                            
                            {/* Conteúdo adicional */}
                            {activity.activity_data.post_content && (
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                "{activity.activity_data.post_content}"
                              </p>
                            )}
                            
                            {activity.activity_data.content && activity.activity_type === 'post' && (
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                "{activity.activity_data.content}"
                              </p>
                            )}
                            
                            {/* Foto */}
                            {activity.activity_data.photo_url && (
                              <div className="mt-2">
                                <img
                                  src={activity.activity_data.photo_url}
                                  alt="Foto"
                                  className="w-16 h-16 rounded-lg object-cover"
                                />
                              </div>
                            )}
                            
                            {/* Ações e timestamp */}
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center text-xs text-gray-500">
                                <Clock className="w-3 h-3 mr-1" />
                                {formatDistanceToNow(new Date(activity.created_at), {
                                  addSuffix: true,
                                  locale: ptBR
                                })}
                              </div>
                              
                              {/* Botão Ver Post - aparece para atividades relacionadas a posts */}
                              {activity.activity_data.post_id && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-xs h-7 px-2"
                                  asChild
                                >
                                  <Link 
                                    href={`/?scrollTo=post-${activity.activity_data.post_id}`}
                                    className="flex items-center space-x-1"
                                    title="Ver este post"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    <span>Ver post</span>
                                  </Link>
                                </Button>
                              )}
                            </div>
                          </div>
                          
                          {/* Badge do tipo */}
                          <Badge variant="secondary" className="text-xs">
                            {activity.activity_type === 'post' && 'Post'}
                            {activity.activity_type === 'like' && 'Curtida'}
                            {activity.activity_type === 'comment' && 'Comentário'}
                            {activity.activity_type === 'friend_request' && 'Amizade'}
                            {activity.activity_type === 'friend_accepted' && 'Novo Amigo'}
                            {activity.activity_type === 'community_joined' && 'Comunidade'}
                            {activity.activity_type === 'photo_added' && 'Foto'}
                            {activity.activity_type === 'profile_updated' && 'Perfil'}
                          </Badge>
                        </div>
                      </OrkutCardContent>
                    </OrkutCard>
                  ))
                ) : (
                  <div className="text-center py-12 bg-white rounded-lg">
                    <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {filter === 'all' ? 'Nenhuma atividade ainda' : 'Nenhuma atividade deste tipo'}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {filter === 'all' 
                        ? 'Comece a usar o Orkut para ver suas atividades aqui!'
                        : 'Tente alterar o filtro ou fazer alguma ação deste tipo.'
                      }
                    </p>
                    {filter !== 'all' && (
                      <Button variant="outline" onClick={() => setFilter('all')}>
                        Ver Todas as Atividades
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
