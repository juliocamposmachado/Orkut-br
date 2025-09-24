'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/enhanced-auth-context'
import { Navbar } from '@/components/layout/navbar'
import { OrkyAssistant } from '@/components/voice/orky-assistant'
import { OrkutCard, OrkutCardContent, OrkutCardHeader } from '@/components/ui/orkut-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { CreateCommunityModal } from '@/components/communities/create-community-modal'
import { supabase } from '@/lib/supabase'
import { 
  Search, 
  Users, 
  Plus, 
  TrendingUp,
  Filter,
  Grid,
  List,
  Star
} from 'lucide-react'

interface Community {
  id: number
  name: string
  description: string
  category: string
  photo_url: string
  members_count: number
  owner: string | null
  created_at: string
}

const categories = [
  'Todos',
  'Trabalho',
  'Educação',
  'Tecnologia',
  'Negócios', 
  'Carreira',
  'Música',
  'Jogos',
  'Entretenimento',
  'Esportes',
  'Culinária',
  'Cinema',
  'Turismo',
  'Nostalgia'
]

export default function CommunitiesPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [communities, setCommunities] = useState<Community[]>([])
  const [filteredCommunities, setFilteredCommunities] = useState<Community[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Todos')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [loadingCommunities, setLoadingCommunities] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
      return
    }

    if (user) {
      loadCommunities()
    }
  }, [user, loading, router])

  useEffect(() => {
    filterCommunities()
  }, [communities, searchTerm, selectedCategory])

  const loadCommunities = async () => {
    try {
      // Usar API do GitHub para comunidades
      const response = await fetch('/api/communities-github')
      const result = await response.json()
      
      if (result.success) {
        setCommunities(result.communities || [])
        if (result.demo) {
          console.warn('Usando dados demo para comunidades (GitHub não configurado)')
        }
        if (result.source === 'github') {
          console.log('Comunidades carregadas do GitHub com sucesso')
        }
      } else {
        console.error('Erro ao carregar comunidades:', result.error)
        setCommunities([])
      }
    } catch (error) {
      console.error('Error loading communities:', error)
      setCommunities([])
    } finally {
      setLoadingCommunities(false)
    }
  }

  const filterCommunities = () => {
    let filtered = communities

    if (searchTerm) {
      filtered = filtered.filter(community =>
        community.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        community.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedCategory !== 'Todos') {
      filtered = filtered.filter(community => community.category === selectedCategory)
    }

    setFilteredCommunities(filtered)
  }

  const createEpicCommunity = async () => {
    try {
      const response = await fetch('/api/create-epic-community', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const result = await response.json()
      
      if (result.success) {
        alert(`🎉 ${result.message}\n\n🎭 A primeira comunidade oficial do Novo Orkut foi criada!\n\n📜 Post épico sobre a saga OAuth foi adicionado!`)
        // Recarregar comunidades
        loadCommunities()
      } else {
        alert(`❌ Erro: ${result.error}`)
      }
    } catch (error) {
      console.error('Erro ao criar comunidade épica:', error)
      alert('❌ Erro ao criar comunidade épica!')
    }
  }

  const handleJoinCommunity = async (communityId: number) => {
    if (!user) return

    try {
      // Para demonstração, apenas simular o join localmente
      // Em produção, isso seria uma API call
      console.log('Simulando entrada na comunidade:', communityId)
      
      // Update local state
      setCommunities(prev => prev.map(community =>
        community.id === communityId
          ? { ...community, members_count: community.members_count + 1 }
          : community
      ))
      
      // TODO: Implementar API /api/communities/[id]/join quando Supabase estiver configurado
    } catch (error) {
      console.error('Error joining community:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-purple-600">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!user || !profile) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-6">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Comunidades</h1>
              <p className="text-gray-600 mb-4">
                Encontre pessoas que compartilham seus interesses
              </p>
              
              {/* Mensagem motivadora */}
              <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg p-4 border-l-4 border-purple-500">
                <div className="flex items-start space-x-3">
                  <span className="text-2xl">🚀</span>
                  <div>
                    <h3 className="font-semibold text-purple-800 mb-1">
                      Bem-vindo ao coração do Novo Orkut!
                    </h3>
                    <p className="text-sm text-purple-700 mb-2">
                      <strong>Aqui é onde a mágica acontece!</strong> Crie comunidades sobre seus hobbies, paixões e interesses. 
                      Reúna pessoas incríveis, compartilhe conhecimento e faça parte de algo maior.
                    </p>
                    <p className="text-xs text-purple-600">
                      💡 <strong>Dica:</strong> Seja o primeiro a criar a comunidade dos seus sonhos! 
                      Torne-se moderador e ajude nossa plataforma a crescer. Vamos colocar nossa criação à prova! 💪
                    </p>
                  </div>
                </div>
                
                {/* Botão Criar Comunidade */}
                <div className="mt-4 flex justify-center">
                  <CreateCommunityModal onCommunityCreated={loadCommunities} />
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar comunidades..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-purple-300 focus:ring-purple-500"
              />
            </div>
            
            <div className="flex items-center space-x-2 overflow-x-auto pb-2 lg:pb-0">
              {categories.map(category => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className={`whitespace-nowrap ${
                    selectedCategory === category
                      ? 'bg-purple-500 hover:bg-purple-600'
                      : 'border-purple-300 text-purple-700 hover:bg-purple-50'
                  }`}
                >
                  {category}
                </Button>
              ))}
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className={viewMode === 'grid' ? 'bg-purple-500' : 'border-purple-300'}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
                className={viewMode === 'list' ? 'bg-purple-500' : 'border-purple-300'}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {loadingCommunities ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-purple-600">Carregando comunidades...</p>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="mb-6">
              <p className="text-sm text-gray-600">
                {filteredCommunities.length} comunidades encontradas
                {searchTerm && ` para "${searchTerm}"`}
                {selectedCategory !== 'Todos' && ` na categoria "${selectedCategory}"`}
              </p>
            </div>

            {/* Communities Grid/List */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredCommunities.map((community) => (
                  <div 
                    key={community.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/comunidades/${community.id}`)}
                  >
                    <OrkutCard 
                      variant="community" 
                      className="hover:shadow-lg transition-shadow"
                    >
                    <div className="p-4">
                      <div className="relative mb-4">
                        <img
                          src={community.photo_url}
                          alt={community.name}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <Badge 
                          variant="secondary" 
                          className="absolute top-2 right-2 bg-white/90 text-purple-700"
                        >
                          {community.category}
                        </Badge>
                      </div>
                      
                      <h3 className="font-bold text-gray-800 mb-2 line-clamp-1">
                        {community.name}
                      </h3>
                      
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {community.description}
                      </p>
                      
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-1 text-sm text-gray-500">
                          <Users className="h-4 w-4" />
                          <span>{community.members_count.toLocaleString('pt-BR')} membros</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span className="text-sm text-gray-600">4.8</span>
                        </div>
                      </div>
                      
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleJoinCommunity(community.id)
                        }}
                        className="w-full bg-purple-500 hover:bg-purple-600"
                      >
                        Entrar na Comunidade
                      </Button>
                    </div>
                    </OrkutCard>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredCommunities.map((community) => (
                  <div 
                    key={community.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/comunidades/${community.id}`)}
                  >
                    <OrkutCard className="hover:shadow-lg transition-shadow">
                      <OrkutCardContent>
                      <div className="flex items-center space-x-4">
                        <img
                          src={community.photo_url}
                          alt={community.name}
                          className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-bold text-gray-800 mb-1">
                                {community.name}
                              </h3>
                              <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                {community.description}
                              </p>
                              <div className="flex items-center space-x-4">
                                <Badge variant="outline" className="border-purple-300 text-purple-700">
                                  {community.category}
                                </Badge>
                                <div className="flex items-center space-x-1 text-sm text-gray-500">
                                  <Users className="h-4 w-4" />
                                  <span>{community.members_count.toLocaleString('pt-BR')} membros</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                                  <span className="text-sm text-gray-600">4.8</span>
                                </div>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleJoinCommunity(community.id)
                              }}
                              className="bg-purple-500 hover:bg-purple-600 ml-4"
                            >
                              Entrar
                            </Button>
                          </div>
                        </div>
                      </div>
                      </OrkutCardContent>
                    </OrkutCard>
                  </div>
                ))}
              </div>
            )}

            {filteredCommunities.length === 0 && !loadingCommunities && (
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-800 mb-2">
                  Nenhuma comunidade encontrada
                </h3>
                <p className="text-gray-600 mb-4">
                  Tente ajustar seus filtros ou criar uma nova comunidade.
                </p>
                <CreateCommunityModal onCommunityCreated={loadCommunities} />
              </div>
            )}
          </>
        )}
      </div>

      <OrkyAssistant />
    </div>
  )
}