'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/enhanced-auth-context'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { OrkutCard, OrkutCardContent, OrkutCardHeader } from '@/components/ui/orkut-card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { 
  Globe, 
  Search, 
  MessageCircle, 
  UserCheck, 
  ArrowLeft,
  Filter,
  Users
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function MembrosPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [gmailUsers, setGmailUsers] = useState<any[]>([])
  const [filteredUsers, setFilteredUsers] = useState<any[]>([])
  const [gmailUsersStats, setGmailUsersStats] = useState({ online: 0, total: 0 })
  const [loadingGmailUsers, setLoadingGmailUsers] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'online' | 'offline'>('all')

  useEffect(() => {
    if (loading) return
    
    if (!user) {
      router.push('/login')
      return
    }

    loadGmailUsers()
  }, [user, loading, router])

  useEffect(() => {
    // Filtrar usuários baseado na busca e status
    let filtered = gmailUsers

    // Filtro por busca
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtro por status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(user => user.status === filterStatus)
    }

    setFilteredUsers(filtered)
  }, [gmailUsers, searchTerm, filterStatus])

  const loadGmailUsers = async () => {
    try {
      const response = await fetch('/api/users/gmail')
      const data = await response.json()
      
      if (response.ok) {
        setGmailUsers(data.users || [])
        setFilteredUsers(data.users || [])
        setGmailUsersStats({ online: data.online || 0, total: data.total || 0 })
      } else {
        console.error('Erro ao carregar usuários Gmail:', data.error)
      }
    } catch (error) {
      console.error('Erro ao buscar usuários Gmail:', error)
    } finally {
      setLoadingGmailUsers(false)
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
      
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center space-x-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="text-purple-600 hover:bg-purple-50"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div className="flex items-center space-x-2">
              <Globe className="h-6 w-6 text-purple-600" />
              <h1 className="text-2xl font-bold text-gray-800">Usuários do Site</h1>
              <div className="bg-red-500 px-3 py-1 rounded text-white text-sm font-bold">
                Gmail
              </div>
            </div>
          </div>
          
          <p className="text-gray-600 mb-4">
            Descubra e conecte-se com outros usuários que usaram login com Google
          </p>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg p-4 border border-purple-200">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <p className="text-lg font-semibold text-gray-800">{gmailUsersStats.online}</p>
                  <p className="text-sm text-gray-600">Online agora</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-purple-200">
              <div className="flex items-center space-x-3">
                <Users className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-lg font-semibold text-gray-800">{gmailUsersStats.total}</p>
                  <p className="text-sm text-gray-600">Total de membros</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-purple-200">
              <div className="flex items-center space-x-3">
                <Globe className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-lg font-semibold text-gray-800">{filteredUsers.length}</p>
                  <p className="text-sm text-gray-600">Resultados</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <OrkutCard className="mb-6">
          <OrkutCardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nome, username ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {/* Status Filter */}
              <div className="flex space-x-2">
                <Button
                  variant={filterStatus === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus('all')}
                  className={filterStatus === 'all' ? 'bg-purple-600' : ''}
                >
                  Todos ({gmailUsers.length})
                </Button>
                <Button
                  variant={filterStatus === 'online' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus('online')}
                  className={filterStatus === 'online' ? 'bg-green-600' : ''}
                >
                  Online ({gmailUsersStats.online})
                </Button>
                <Button
                  variant={filterStatus === 'offline' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus('offline')}
                  className={filterStatus === 'offline' ? 'bg-gray-600' : ''}
                >
                  Offline ({gmailUsersStats.total - gmailUsersStats.online})
                </Button>
              </div>
            </div>
          </OrkutCardContent>
        </OrkutCard>

        {/* Users List */}
        <OrkutCard>
          <OrkutCardContent className="p-0">
            {loadingGmailUsers ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Carregando usuários...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-8 text-center">
                <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg text-gray-500 mb-2">
                  {searchTerm ? 'Nenhum usuário encontrado' : 'Nenhum usuário Gmail encontrado'}
                </p>
                <p className="text-sm text-gray-400">
                  {searchTerm ? 'Tente uma busca diferente' : 'Seja o primeiro a se cadastrar com Google!'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <div key={user.id} className="p-4 hover:bg-purple-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={user.photo_url} alt={user.display_name} />
                            <AvatarFallback className="bg-purple-500 text-white">
                              {user.display_name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div 
                            className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                              user.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                            }`}
                          ></div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {user.display_name}
                          </h3>
                          <p className="text-sm text-gray-500 truncate">@{user.username}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              user.status === 'online' 
                                ? 'bg-green-100 text-green-600' 
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {user.status === 'online' ? (
                                user.activity || 'Navegando no Orkut'
                              ) : (
                                user.lastSeen || 'Offline'
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push('/mensagens')}
                          className="border-purple-300 text-purple-700 hover:bg-purple-50"
                        >
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Mensagem
                        </Button>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => router.push(`/perfil/${user.username}`)}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          <UserCheck className="h-4 w-4 mr-2" />
                          Ver Perfil
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </OrkutCardContent>
        </OrkutCard>
      </div>

      <Footer />
    </div>
  )
}
