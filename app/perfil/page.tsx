'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context-fallback'
import { Navbar } from '@/components/layout/navbar'
import { OrkyAssistant } from '@/components/voice/orky-assistant'
import { OrkutCard, OrkutCardContent, OrkutCardHeader } from '@/components/ui/orkut-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { supabase } from '@/lib/supabase'
import { 
  User, 
  Camera, 
  MapPin, 
  Calendar, 
  Heart, 
  MessageCircle, 
  Send,
  Star,
  Edit,
  Plus,
  Trash2,
  Users,
  Eye,
  Phone,
  Video,
  Mail
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Profile {
  id: string
  username: string
  display_name: string
  photo_url: string | null
  bio: string | null
  location: string | null
  birth_date: string | null
  relationship: string | null
  created_at: string
  profile_views: number
  scrapy_count: number
}

interface Scrap {
  id: number
  from_profile_id: string
  to_profile_id: string
  content: string
  created_at: string
  from_profile: {
    username: string
    display_name: string
    photo_url?: string
  }
}

interface Photo {
  id: number
  profile_id: string
  photo_url: string
  caption: string | null
  created_at: string
}

export default function ProfilePage() {
  const { user, profile: currentUserProfile, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const profileId = searchParams.get('id') || user?.id
  
  const [profile, setProfile] = useState<Profile | null>(null)
  const [scraps, setScraps] = useState<Scrap[]>([])
  const [photos, setPhotos] = useState<Photo[]>([])
  const [newScrap, setNewScrap] = useState('')
  const [sending, setSending] = useState(false)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [isOwnProfile, setIsOwnProfile] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
      return
    }

    if (user && profileId) {
      setIsOwnProfile(profileId === user.id)
      loadProfile()
      loadScraps()
      loadPhotos()
      updateProfileViews()
    }
  }, [user, loading, router, profileId])

  const loadProfile = async () => {
    if (!profileId) return

    // In fallback mode, use the current user's profile
    if (profileId === user?.id && currentUserProfile) {
      setProfile({
        ...currentUserProfile,
        profile_views: 0,
        scrapy_count: 0,
        birth_date: currentUserProfile.birthday
      })
      setLoadingProfile(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .single()

      if (error) throw error
      setProfile(data)
    } catch (error) {
      console.error('Error loading profile:', error)
      // Fallback for when Supabase is not available
      if (profileId === user?.id && currentUserProfile) {
        setProfile({
          ...currentUserProfile,
          profile_views: 0,
          scrapy_count: 0,
          birth_date: currentUserProfile.birthday
        })
      }
    } finally {
      setLoadingProfile(false)
    }
  }

  const loadScraps = async () => {
    if (!profileId) return

    try {
      const { data, error } = await supabase
        .from('scraps')
        .select(`
          *,
          from_profile:profiles!from_profile_id(username, display_name, photo_url)
        `)
        .eq('to_profile_id', profileId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setScraps(data || [])
    } catch (error) {
      console.error('Error loading scraps:', error)
      // Fallback: use empty array when Supabase is not available
      setScraps([])
    }
  }

  const loadPhotos = async () => {
    if (!profileId) return

    try {
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false })
        .limit(12)

      if (error) throw error
      setPhotos(data || [])
    } catch (error) {
      console.error('Error loading photos:', error)
      // Fallback: use empty array when Supabase is not available
      setPhotos([])
    }
  }

  const updateProfileViews = async () => {
    if (!profileId || isOwnProfile) return

    try {
      await supabase
        .from('profiles')
        .update({ profile_views: (profile?.profile_views || 0) + 1 })
        .eq('id', profileId)
    } catch (error) {
      console.error('Error updating profile views:', error)
    }
  }

  const sendScrap = async () => {
    if (!user || !newScrap.trim() || !profileId) return

    setSending(true)
    try {
      const { error } = await supabase
        .from('scraps')
        .insert({
          from_profile_id: user.id,
          to_profile_id: profileId,
          content: newScrap.trim()
        })

      if (error) throw error
      
      setNewScrap('')
      loadScraps()
    } catch (error) {
      console.error('Error sending scrap:', error)
      alert('Erro ao enviar recado')
    } finally {
      setSending(false)
    }
  }

  const deleteScrap = async (scrapId: number) => {
    if (!confirm('Tem certeza que deseja excluir este recado?')) return

    try {
      const { error } = await supabase
        .from('scraps')
        .delete()
        .eq('id', scrapId)
        .eq('to_profile_id', user?.id) // Only delete if user is the recipient

      if (error) throw error
      loadScraps()
    } catch (error) {
      console.error('Error deleting scrap:', error)
    }
  }

  if (loading || loadingProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-purple-600">Carregando perfil...</p>
        </div>
      </div>
    )
  }

  if (!user || !profile) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 py-6">
        
        {/* Profile Header */}
        <OrkutCard variant="gradient" className="mb-6">
          <div className="p-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center space-y-4 lg:space-y-0 lg:space-x-6">
              
              {/* Profile Photo */}
              <div className="relative">
                <Avatar className="h-32 w-32 border-4 border-white shadow-lg">
                  <AvatarImage src={profile.photo_url || undefined} alt={profile.display_name} />
                  <AvatarFallback className="text-2xl">
                    {profile.display_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {isOwnProfile && (
                  <Button 
                    size="sm" 
                    className="absolute bottom-0 right-0 rounded-full bg-purple-500 hover:bg-purple-600"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Profile Info */}
              <div className="flex-1">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">{profile.display_name}</h1>
                    <p className="text-gray-600 mb-3">@{profile.username}</p>
                    
                    {profile.bio && (
                      <p className="text-gray-700 mb-4 max-w-md">{profile.bio}</p>
                    )}

                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                      {profile.location && (
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-4 w-4" />
                          <span>{profile.location}</span>
                        </div>
                      )}
                      
                      {profile.birth_date && (
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(profile.birth_date).toLocaleDateString('pt-BR')}</span>
                        </div>
                      )}

                      <div className="flex items-center space-x-1">
                        <User className="h-4 w-4" />
                        <span>Membro desde {new Date(profile.created_at).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                        {profile.relationship || 'Não informado'}
                      </Badge>
                      <Badge variant="outline" className="border-gray-300">
                        <Eye className="h-3 w-3 mr-1" />
                        {profile.profile_views || 0} visualizações
                      </Badge>
                      <Badge variant="outline" className="border-gray-300">
                        <Heart className="h-3 w-3 mr-1" />
                        {scraps.length} recados
                      </Badge>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {!isOwnProfile && (
                    <div className="flex flex-col space-y-2 mt-4 lg:mt-0">
                      <Button className="bg-purple-500 hover:bg-purple-600">
                        <Users className="h-4 w-4 mr-2" />
                        Adicionar como Amigo
                      </Button>
                      <Button variant="outline" className="border-purple-300 text-purple-700">
                        <Mail className="h-4 w-4 mr-2" />
                        Enviar Mensagem
                      </Button>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" className="border-purple-300 text-purple-700">
                          <Phone className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" className="border-purple-300 text-purple-700">
                          <Video className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {isOwnProfile && (
                    <Button variant="outline" className="border-purple-300 text-purple-700">
                      <Edit className="h-4 w-4 mr-2" />
                      Editar Perfil
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </OrkutCard>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Sidebar */}
          <div className="space-y-6">
            
            {/* Quick Stats */}
            <OrkutCard>
              <OrkutCardHeader>
                <span>Estatísticas</span>
              </OrkutCardHeader>
              <OrkutCardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Amigos:</span>
                    <Badge variant="outline">156</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Comunidades:</span>
                    <Badge variant="outline">23</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Fotos:</span>
                    <Badge variant="outline">{photos.length}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Visualizações:</span>
                    <Badge variant="outline">{profile.profile_views || 0}</Badge>
                  </div>
                </div>
              </OrkutCardContent>
            </OrkutCard>

            {/* Recent Photos */}
            <OrkutCard>
              <OrkutCardHeader>
                <div className="flex items-center justify-between">
                  <span>Fotos Recentes</span>
                  {isOwnProfile && (
                    <Button size="sm" variant="ghost">
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </OrkutCardHeader>
              <OrkutCardContent>
                {photos.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {photos.slice(0, 9).map((photo) => (
                      <div key={photo.id} className="aspect-square bg-gray-200 rounded-md overflow-hidden">
                        <img 
                          src={photo.photo_url}
                          alt={photo.caption || 'Foto'}
                          className="w-full h-full object-cover hover:opacity-80 transition-opacity cursor-pointer"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Nenhuma foto ainda</p>
                  </div>
                )}
              </OrkutCardContent>
            </OrkutCard>

            {/* Top Friends */}
            <OrkutCard>
              <OrkutCardHeader>
                <span>Amigos ({156})</span>
              </OrkutCardHeader>
              <OrkutCardContent>
                <div className="grid grid-cols-4 gap-2">
                  {Array.from({ length: 8 }).map((_, idx) => (
                    <div key={idx} className="text-center">
                      <img 
                        src={`https://images.pexels.com/photos/${220000 + idx}/pexels-photo-${220000 + idx}.jpeg?auto=compress&cs=tinysrgb&w=100`}
                        alt={`Amigo ${idx + 1}`}
                        className="w-12 h-12 rounded-full mx-auto mb-1 object-cover hover:opacity-80 transition-opacity cursor-pointer"
                      />
                      <p className="text-xs text-gray-600 truncate">Amigo {idx + 1}</p>
                    </div>
                  ))}
                </div>
                <Button variant="outline" size="sm" className="w-full mt-3 border-purple-300 text-purple-700">
                  Ver Todos
                </Button>
              </OrkutCardContent>
            </OrkutCard>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            
            <Tabs defaultValue="scraps" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="scraps">Recados ({scraps.length})</TabsTrigger>
                <TabsTrigger value="photos">Fotos ({photos.length})</TabsTrigger>
                <TabsTrigger value="about">Sobre</TabsTrigger>
              </TabsList>

              {/* Scraps Tab */}
              <TabsContent value="scraps" className="space-y-4">
                
                {/* Send Scrap */}
                {!isOwnProfile && (
                  <OrkutCard>
                    <OrkutCardHeader>
                      <div className="flex items-center space-x-2">
                        <Heart className="h-4 w-4 text-pink-600" />
                        <span>💕 deixar recado para {profile.display_name}</span>
                      </div>
                    </OrkutCardHeader>
                    <OrkutCardContent>
                      <div className="space-y-4">
                        <Textarea
                          placeholder={`Deixe um recado especial para ${profile.display_name}...`}
                          value={newScrap}
                          onChange={(e) => setNewScrap(e.target.value)}
                          className="border-pink-300 focus:ring-pink-500 min-h-[100px]"
                          maxLength={300}
                        />
                        <div className="flex justify-between items-center">
                          <p className="text-xs text-gray-500">
                            {newScrap.length}/300 caracteres
                          </p>
                          <Button
                            onClick={sendScrap}
                            disabled={!newScrap.trim() || sending}
                            className="bg-pink-500 hover:bg-pink-600"
                          >
                            {sending ? 'Enviando...' : 'Deixar Recado'}
                          </Button>
                        </div>
                      </div>
                    </OrkutCardContent>
                  </OrkutCard>
                )}

                {/* Scraps List */}
                {scraps.length === 0 ? (
                  <OrkutCard>
                    <OrkutCardContent>
                      <div className="text-center py-12">
                        <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-800 mb-2">
                          {isOwnProfile ? 'Você ainda não tem recados' : `${profile.display_name} ainda não tem recados`}
                        </h3>
                        <p className="text-gray-600">
                          {isOwnProfile 
                            ? 'Seus amigos ainda não deixaram recados para você!' 
                            : 'Seja o primeiro a deixar um recado!'}
                        </p>
                      </div>
                    </OrkutCardContent>
                  </OrkutCard>
                ) : (
                  scraps.map((scrap) => (
                    <OrkutCard key={scrap.id}>
                      <OrkutCardContent>
                        <div className="flex items-start space-x-3 p-4">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={scrap.from_profile.photo_url} alt={scrap.from_profile.display_name} />
                            <AvatarFallback>{scrap.from_profile.display_name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium text-gray-800">{scrap.from_profile.display_name}</p>
                                <p className="text-sm text-gray-500">@{scrap.from_profile.username}</p>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-gray-500">
                                  {formatDistanceToNow(new Date(scrap.created_at), { 
                                    addSuffix: true,
                                    locale: ptBR 
                                  })}
                                </span>
                                {isOwnProfile && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => deleteScrap(scrap.id)}
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                            <div className="mt-3 p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg border-l-4 border-pink-400">
                              <p className="text-gray-700">{scrap.content}</p>
                            </div>
                          </div>
                        </div>
                      </OrkutCardContent>
                    </OrkutCard>
                  ))
                )}
              </TabsContent>

              {/* Photos Tab */}
              <TabsContent value="photos" className="space-y-4">
                {photos.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {photos.map((photo) => (
                      <OrkutCard key={photo.id} className="overflow-hidden">
                        <div className="aspect-square">
                          <img 
                            src={photo.photo_url}
                            alt={photo.caption || 'Foto'}
                            className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                          />
                        </div>
                        {photo.caption && (
                          <OrkutCardContent className="p-3">
                            <p className="text-sm text-gray-700 line-clamp-2">{photo.caption}</p>
                          </OrkutCardContent>
                        )}
                      </OrkutCard>
                    ))}
                  </div>
                ) : (
                  <OrkutCard>
                    <OrkutCardContent>
                      <div className="text-center py-12">
                        <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-800 mb-2">
                          {isOwnProfile ? 'Você ainda não tem fotos' : `${profile.display_name} ainda não tem fotos`}
                        </h3>
                        <p className="text-gray-600">
                          {isOwnProfile && 'Que tal adicionar algumas fotos ao seu perfil?'}
                        </p>
                        {isOwnProfile && (
                          <Button className="mt-4 bg-purple-500 hover:bg-purple-600">
                            <Plus className="h-4 w-4 mr-2" />
                            Adicionar Fotos
                          </Button>
                        )}
                      </div>
                    </OrkutCardContent>
                  </OrkutCard>
                )}
              </TabsContent>

              {/* About Tab */}
              <TabsContent value="about" className="space-y-4">
                <OrkutCard>
                  <OrkutCardHeader>
                    <span>Informações Pessoais</span>
                  </OrkutCardHeader>
                  <OrkutCardContent>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Nome</label>
                        <p className="text-gray-800">{profile.display_name}</p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-700">Username</label>
                        <p className="text-gray-800">@{profile.username}</p>
                      </div>

                      {profile.bio && (
                        <div>
                          <label className="text-sm font-medium text-gray-700">Sobre mim</label>
                          <p className="text-gray-800">{profile.bio}</p>
                        </div>
                      )}

                      {profile.location && (
                        <div>
                          <label className="text-sm font-medium text-gray-700">Localização</label>
                          <p className="text-gray-800">{profile.location}</p>
                        </div>
                      )}

                      {profile.birth_date && (
                        <div>
                          <label className="text-sm font-medium text-gray-700">Data de Nascimento</label>
                          <p className="text-gray-800">{new Date(profile.birth_date).toLocaleDateString('pt-BR')}</p>
                        </div>
                      )}

                      <div>
                        <label className="text-sm font-medium text-gray-700">Relacionamento</label>
                        <p className="text-gray-800">{profile.relationship || 'Não informado'}</p>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-700">Membro desde</label>
                        <p className="text-gray-800">{new Date(profile.created_at).toLocaleDateString('pt-BR')}</p>
                      </div>
                    </div>
                  </OrkutCardContent>
                </OrkutCard>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      <OrkyAssistant />
    </div>
  )
}
