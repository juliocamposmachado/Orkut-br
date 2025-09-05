'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/enhanced-auth-context'
import { EmailVerificationBanner } from '@/components/auth/email-verification-banner'
import { Navbar } from '@/components/layout/navbar'
import { OrkyAssistant } from '@/components/voice/orky-assistant'
import { Feed } from '@/components/Feed'
import { GlobalFeed } from '@/components/GlobalFeed'
import { CreatePost } from '@/components/CreatePost'
import ExpandableMusicCard from '@/components/ExpandableMusicCard'
import { Footer } from '@/components/layout/footer'
import { OrkutCard, OrkutCardContent, OrkutCardHeader } from '@/components/ui/orkut-card'
import AIAssistant from '@/components/AIAssistant'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { 
  Heart, 
  MessageCircle, 
  Share, 
  Eye, 
  TrendingUp, 
  Users, 
  Calendar, 
  Plus, 
  Search,
  Star,
  Camera,
  Phone,
  Video,
  Home,
  UserCheck,
  MessageSquare,
  Globe,
  Bookmark,
  Clock,
  Settings,
  HelpCircle,
  Download,
  Monitor,
  Smartphone
} from 'lucide-react'
import { DiChrome, DiAndroid, DiApple } from 'react-icons/di'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'
import RadioTatuapeWidget from '@/components/RadioWidget'
import { CommentsModal } from '@/components/posts/comments-modal'
import { ShareModal } from '@/components/posts/share-modal'
import { UserMoodDisplay } from '@/components/status/user-mood-display'
import { SponsoredCarousel } from '@/components/ads/sponsored-carousel'
import { MarqueeBanner } from '@/components/ui/marquee-banner'
import { CallModal } from '@/components/call/call-modal'
import { useCall } from '@/hooks/use-call'
import { CommunityRulesCard } from '@/components/CommunityRulesCard'
import OnlineFriends from '@/components/friends/online-friends'
import { CommunityNotifications } from '@/components/CommunityNotifications'
import { RecentLoginsCard } from '@/components/auth/recent-logins-card'
import { CallCenterCard } from '@/components/call/call-center-card'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

interface Post {
  id: number
  content: string
  created_at: string
  likes_count: number
  comments_count: number
  author: {
    id: string
    display_name: string
    photo_url: string
    username: string
  }
}

interface Community {
  id: number
  name: string
  photo_url: string
  members_count: number
  category: string
}

export default function HomePage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const { callState, startVideoCall, startAudioCall, endCall } = useCall()
  const [posts, setPosts] = useState<Post[]>([])
  const [communities, setCommunities] = useState<Community[]>([])
  const [loadingPosts, setLoadingPosts] = useState(true)
  const [gmailUsers, setGmailUsers] = useState<any[]>([])
  const [gmailUsersStats, setGmailUsersStats] = useState({ online: 0, total: 0 })
  const [loadingGmailUsers, setLoadingGmailUsers] = useState(true)
  const [topFriends, setTopFriends] = useState<any[]>([])
  const [loadingTopFriends, setLoadingTopFriends] = useState(true)

  useEffect(() => {
    // Aguardar o loading completo antes de redirecionar
    if (loading) {
      return // Não fazer nada enquanto carregando
    }
    
    // Só redirecionar para login se realmente não tiver usuário após loading
    if (!user) {
      router.push('/login')
      return
    }

    // Se tem usuário, carregar conteúdo
    if (user) {
      loadFeed()
      loadCommunities()
      loadGmailUsers()
      loadTopFriends()
    }
  }, [user, loading, router])

  // Demo posts para não deixar o feed vazio
  const demoPosts: Post[] = [
    {
      id: 1,
      content: "🎉 MEU DEUS QUE SAUDADE DO ORKUT! Obrigada por trazerem de volta essa nostalgia! Esse novo Orkut está muito melhor que o original, com recursos modernos mas mantendo a essência que amamos! ❤️",
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      likes_count: 47,
      comments_count: 12,
      author: {
        id: 'demo1',
        display_name: 'Mariana Santos',
        photo_url: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=100',
        username: 'mariana_santos'
      }
    },
    {
      id: 2,
      content: "Gente, por que será que o Google nunca trouxe o Orkut original de volta? 🤔 Ainda bem que temos essa versão incrível! Os recursos de voz e chamadas estão SENSACIONAIS! Parabéns aos desenvolvedores! 👏",
      created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      likes_count: 89,
      comments_count: 23,
      author: {
        id: 'demo2',
        display_name: 'Carlos Eduardo',
        photo_url: 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=100',
        username: 'carlos_edu'
      }
    },
    {
      id: 3,
      content: "ESSE ORKUT RETRO ESTÁ PERFEITO! 😍 Muito melhor que o original! Tem tudo que a gente amava + recursos que nem sonhávamos em 2004. A rádio integrada é demais! Vou chamar todos os amigos!",
      created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      likes_count: 156,
      comments_count: 34,
      author: {
        id: 'demo3',
        display_name: 'Ana Paula',
        photo_url: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=100',
        username: 'anapaulinha'
      }
    },
    {
      id: 4,
      content: "Quem mais está tendo flashbacks dos anos 2000? 📸✨ Este Orkut novo conseguiu capturar perfeitamente a magia do original, mas com uma experiência muito superior! As comunidades estão voltando com força total!",
      created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      likes_count: 72,
      comments_count: 18,
      author: {
        id: 'demo4',
        display_name: 'Roberto Silva',
        photo_url: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=100',
        username: 'roberto_silva'
      }
    },
    {
      id: 5,
      content: "Gente, sinceramente, o Google fez uma burrada gigante encerrando o Orkut original. Mas agora temos algo MUITO MELHOR! 🚀 A interface está linda, responsiva, e os recursos são incríveis. AMANDO!",
      created_at: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
      likes_count: 134,
      comments_count: 28,
      author: {
        id: 'demo5',
        display_name: 'Juliana Costa',
        photo_url: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100',
        username: 'ju_costa'
      }
    },
    {
      id: 6,
      content: "Acabei de descobrir esse Orkut Retrô e já estou VICIADO! 🎯 Conseguiram fazer algo melhor que o original! O sistema de chamadas de voz é revolucionário para uma rede social. Parabéns, equipe!",
      created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      likes_count: 203,
      comments_count: 45,
      author: {
        id: 'demo6',
        display_name: 'Fernando Oliveira',
        photo_url: 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=100',
        username: 'fernando_oli'
      }
    },
    {
      id: 7,
      content: "Teoria conspiratória: o Google sabia que alguém ia criar um Orkut melhor e encerrou o original para não fazer feio 😂 Brincadeiras à parte, este projeto está ESPETACULAR! A nostalgia bateu forte aqui! 💜",
      created_at: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(),
      likes_count: 98,
      comments_count: 31,
      author: {
        id: 'demo7',
        display_name: 'Priscila Andrade',
        photo_url: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=100',
        username: 'pri_andrade'
      }
    },
    {
      id: 8,
      content: "FINALMENTE! Uma rede social que valoriza a amizade de verdade! 👥 Este Orkut novo tem tudo: nostalgia + inovação. O assistente de voz Orky é genial! Quero ver o Facebook fazer igual! 😎",
      created_at: new Date(Date.now() - 16 * 60 * 60 * 1000).toISOString(),
      likes_count: 167,
      comments_count: 52,
      author: {
        id: 'demo8',
        display_name: 'Thiago Souza',
        photo_url: 'https://images.pexels.com/photos/1040881/pexels-photo-1040881.jpeg?auto=compress&cs=tinysrgb&w=100',
        username: 'thiago_souza'
      }
    },
    {
      id: 9,
      content: "Minha mãe perguntou: 'Por que o Orkut original não volta?' Mostrei este aqui pra ela e ela falou: 'Esse está muito melhor, filho!' 😄 Até a mamãe aprovou! A interface está incrível!",
      created_at: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
      likes_count: 89,
      comments_count: 19,
      author: {
        id: 'demo9',
        display_name: 'Lucas Pereira',
        photo_url: 'https://images.pexels.com/photos/1121796/pexels-photo-1121796.jpeg?auto=compress&cs=tinysrgb&w=100',
        username: 'lucas_pereira'
      }
    },
    {
      id: 10,
      content: "Quem mais está montando de novo aquele Top 8 de amigos? 😂 Esse Orkut Retrô me fez voltar à adolescência! E olha que está 1000x melhor que o original. Os recursos modernos fazem toda a diferença! 🌟",
      created_at: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
      likes_count: 245,
      comments_count: 67,
      author: {
        id: 'demo10',
        display_name: 'Camila Ferreira',
        photo_url: 'https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg?auto=compress&cs=tinysrgb&w=100',
        username: 'camila_ferreira'
      }
    }
  ]

  const loadFeed = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:author (
            id,
            display_name,
            photo_url,
            username
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error

      // Transform the data to match our interface
      const transformedPosts = data?.map(post => ({
        ...post,
        author: post.profiles as any
      })) || []

      // Se não houver posts reais, usar os posts demo
      setPosts(transformedPosts.length > 0 ? transformedPosts : demoPosts)
    } catch (error) {
      console.error('Error loading feed:', error)
      // Em caso de erro, usar posts demo
      setPosts(demoPosts)
    } finally {
      setLoadingPosts(false)
    }
  }

  const loadCommunities = async () => {
    try {
      const { data, error } = await supabase
        .from('communities')
        .select('*')
        .order('members_count', { ascending: false })
        .limit(6)

      if (error) throw error
      setCommunities(data || [])
    } catch (error) {
      console.error('Error loading communities:', error)
    }
  }

  const loadGmailUsers = async () => {
    try {
      const response = await fetch('/api/users/gmail')
      const data = await response.json()
      
      if (response.ok) {
        setGmailUsers(data.users || [])
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

  const loadTopFriends = async () => {
    if (!user || !supabase) return

    try {
      // Buscar amigos aceitos com informações de atividade
      const { data, error } = await supabase
        .from('friendships')
        .select(`
          *,
          requester:profiles!requester_id(id, username, display_name, photo_url, bio, location, last_seen),
          addressee:profiles!addressee_id(id, username, display_name, photo_url, bio, location, last_seen)
        `)
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
        .eq('status', 'accepted')
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error

      // Transform the data to get the friend's profile and calculate activity score
      const friendsList = data?.map(friendship => {
        const friend = friendship.requester_id === user.id 
          ? friendship.addressee 
          : friendship.requester
        
        // Calculate activity score based on last seen and friendship duration
        const friendshipDate = new Date(friendship.created_at)
        const lastSeen = friend.last_seen ? new Date(friend.last_seen) : friendshipDate
        const now = new Date()
        const daysSinceLastSeen = Math.floor((now.getTime() - lastSeen.getTime()) / (1000 * 60 * 60 * 24))
        const friendshipDays = Math.floor((now.getTime() - friendshipDate.getTime()) / (1000 * 60 * 60 * 24))
        
        // Score: friendship longevity + recent activity (lower days since last seen = higher score)
        const activityScore = Math.max(1, friendshipDays) + Math.max(1, 30 - daysSinceLastSeen)
        
        return {
          ...friend,
          friendship_created_at: friendship.created_at,
          activity_score: activityScore,
          days_since_last_seen: daysSinceLastSeen
        }
      }) || []

      // Sort by activity score (highest first) and limit to top 10
      const topFriendsList = friendsList
        .sort((a, b) => b.activity_score - a.activity_score)
        .slice(0, 10)

      setTopFriends(topFriendsList)
    } catch (error) {
      console.error('Error loading top friends:', error)
      // In case of error, keep empty array
      setTopFriends([])
    } finally {
      setLoadingTopFriends(false)
    }
  }

  const handleLike = async (postId: number) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('likes')
        .upsert({ 
          post_id: postId, 
          profile_id: user.id 
        })

      if (!error) {
        // Update local state
        setPosts(prev => prev.map(post => 
          post.id === postId 
            ? { ...post, likes_count: post.likes_count + 1 }
            : post
        ))
      }
    } catch (error) {
      console.error('Error liking post:', error)
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
      
      {/* AI-Powered Marquee Banner - Full Width */}
      <MarqueeBanner className="mb-2" />
      
      <div className="w-full max-w-7xl mx-auto px-2 xs:px-4 py-2 xs:py-4 overflow-hidden">
        {/* Email Verification Banner */}
        <EmailVerificationBanner />
        
        {/* Layout com 3 colunas: Sidebar Esquerda | Feed Central | Sidebar Direita */}
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr_300px] xl:grid-cols-[320px_1fr_320px] gap-4 lg:gap-6 items-start max-w-7xl mx-auto">
          
          {/* Left Sidebar - 7 Cards Equilibrados */}
          <div className="hidden lg:block space-y-4 sticky top-4">
            {/* 1. Regras da Comunidade */}
            <CommunityRulesCard />
            
            {/* 2. Navigation Menu */}
            <OrkutCard>
              <OrkutCardHeader>
                <div className="flex items-center space-x-2">
                  <Home className="h-4 w-4 text-purple-600" />
                  <span className="text-gray-700 font-medium">Navegação</span>
                </div>
              </OrkutCardHeader>
              <OrkutCardContent>
                <div className="space-y-1">
                  <Link href="/" className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-purple-50 transition-colors">
                    <Home className="h-5 w-5 text-purple-600" />
                    <span className="text-gray-700 font-medium">Início</span>
                  </Link>
                  <Link href={`/perfil/${profile.username}`} className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-purple-50 transition-colors">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={profile.photo_url || undefined} alt={profile.display_name} />
                      <AvatarFallback className="text-xs">
                        {profile.display_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-gray-700">{profile.display_name}</span>
                  </Link>
                  <Link href="/amigos" className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-purple-50 transition-colors">
                    <UserCheck className="h-5 w-5 text-purple-600" />
                    <span className="text-gray-700">Amigos</span>
                  </Link>
                  <Link href="/comunidades" className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-purple-50 transition-colors">
                    <Users className="h-5 w-5 text-purple-600" />
                    <span className="text-gray-700">Comunidades</span>
                  </Link>
                  <Link href="/mensagens" className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-purple-50 transition-colors">
                    <MessageSquare className="h-5 w-5 text-purple-600" />
                    <span className="text-gray-700">Mensagens</span>
                  </Link>
                </div>
              </OrkutCardContent>
            </OrkutCard>

            {/* 3. Ações Rápidas */}
            <OrkutCard>
              <OrkutCardHeader>
                <span className="text-gray-600 text-sm font-medium">Ações rápidas</span>
              </OrkutCardHeader>
              <OrkutCardContent>
                <div className="space-y-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full justify-start border-purple-300 text-purple-700 hover:bg-purple-50"
                    onClick={() => router.push('/buscar')}
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Buscar pessoas
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full justify-start border-purple-300 text-purple-700 hover:bg-purple-50"
                    onClick={() => router.push('/comunidades')}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Criar comunidade
                  </Button>
                </div>
              </OrkutCardContent>
            </OrkutCard>

            {/* 4. Comunidades em Alta - Movido para esquerda */}
            <OrkutCard>
              <OrkutCardHeader>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4" />
                  <span>Comunidades em Alta</span>
                </div>
              </OrkutCardHeader>
              <OrkutCardContent>
                <div className="space-y-3">
                  {communities.slice(0, 5).map((community) => (
                    <div key={community.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-purple-50 transition-colors cursor-pointer">
                      <img 
                        src={community.photo_url} 
                        alt={community.name}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm text-gray-800 truncate">
                          {community.name}
                        </h4>
                        <p className="text-xs text-gray-600">
                          {community.members_count.toLocaleString('pt-BR')} membros
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full mt-3 border-purple-300 text-purple-700 hover:bg-purple-50"
                  onClick={() => router.push('/comunidades')}
                >
                  Ver Todas
                </Button>
              </OrkutCardContent>
            </OrkutCard>

            {/* 5. Card Escrito */}
            <OrkutCard>
              <OrkutCardHeader>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Escrito</span>
                  <span className="text-xs text-gray-400">Conteúdo</span>
                </div>
              </OrkutCardHeader>
              <OrkutCardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm font-medium text-blue-700">Artigo em Destaque</span>
                    </div>
                    <h4 className="font-medium text-sm text-gray-800 mb-1">
                      Como o Orkut Revolucionou as Redes Sociais
                    </h4>
                    <p className="text-xs text-gray-600 mb-2">
                      Relembre a história da rede social que marcou uma geração e inspire-se com os novos recursos...
                    </p>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="w-full border-blue-300 text-blue-700 hover:bg-blue-50 text-xs"
                    >
                      Ler mais
                    </Button>
                  </div>
                  
                  <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium text-green-700">Novidade</span>
                    </div>
                    <h4 className="font-medium text-sm text-gray-800 mb-1">
                      Recursos de Chamada de Voz
                    </h4>
                    <p className="text-xs text-gray-600 mb-2">
                      Descubra como usar as novas funcionalidades de comunicação em tempo real...
                    </p>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="w-full border-green-300 text-green-700 hover:bg-green-50 text-xs"
                    >
                      Explorar
                    </Button>
                  </div>
                </div>
              </OrkutCardContent>
            </OrkutCard>

            {/* 6. Top Friends - Movido para esquerda */}
            <OrkutCard>
              <OrkutCardHeader>
                <div className="flex items-center space-x-2">
                  <Star className="h-4 w-4" />
                  <span>Top 10 Amigos</span>
                  {topFriends.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {topFriends.length}
                    </Badge>
                  )}
                </div>
              </OrkutCardHeader>
              <OrkutCardContent>
                {loadingTopFriends ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto mb-2"></div>
                    <p className="text-xs text-gray-500">Carregando amigos...</p>
                  </div>
                ) : topFriends.length === 0 ? (
                  <div className="text-center py-6">
                    <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 mb-1">Nenhum amigo ainda</p>
                    <p className="text-xs text-gray-400">Faça novas amizades!</p>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="mt-2 border-purple-300 text-purple-700 hover:bg-purple-50"
                      onClick={() => router.push('/buscar')}
                    >
                      Buscar pessoas
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {topFriends.slice(0, 8).map((friend, idx) => (
                      <div 
                        key={friend.id} 
                        className="text-center group cursor-pointer"
                        onClick={() => router.push(`/perfil/${friend.username}`)}
                      >
                        <div className="relative">
                          <Avatar className="w-12 h-12 mx-auto mb-1 group-hover:opacity-80 transition-opacity">
                            <AvatarImage 
                              src={friend.photo_url || undefined} 
                              alt={friend.display_name}
                            />
                            <AvatarFallback className="bg-purple-500 text-white text-xs">
                              {friend.display_name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {/* Ranking badge */}
                          <div className="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-lg">
                            {idx + 1}
                          </div>
                          {/* Online status */}
                          {friend.days_since_last_seen <= 1 && (
                            <div className="absolute -bottom-0 -right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 truncate px-1" title={friend.display_name}>
                          {friend.display_name.split(' ')[0]}
                        </p>
                        {/* Activity indicator */}
                        <div className="text-xs text-gray-400 mt-0.5">
                          {friend.days_since_last_seen === 0 ? (
                            <span className="text-green-600">Online</span>
                          ) : friend.days_since_last_seen === 1 ? (
                            <span className="text-yellow-600">1d</span>
                          ) : friend.days_since_last_seen <= 7 ? (
                            <span className="text-orange-600">{friend.days_since_last_seen}d</span>
                          ) : (
                            <span className="text-gray-500">+7d</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {topFriends.length > 8 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full mt-3 border-purple-300 text-purple-700 hover:bg-purple-50"
                    onClick={() => router.push('/amigos')}
                  >
                    Ver todos ({topFriends.length})
                  </Button>
                )}
              </OrkutCardContent>
            </OrkutCard>

            {/* 7. Anúncios Patrocinados */}
            <OrkutCard>
              <OrkutCardHeader>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Patrocinado</span>
                  <span className="text-xs text-gray-400">Anúncio</span>
                </div>
              </OrkutCardHeader>
              <OrkutCardContent className="p-0">
                <SponsoredCarousel />
              </OrkutCardContent>
            </OrkutCard>
          </div>

          

          {/* Central Content - Feed Global no Centro */}
          <div className="w-full space-y-4 order-2">
            {/* MOBILE: Navegação e Cards */}
            <div className="lg:hidden space-y-4">
              <CommunityRulesCard className="shadow-sm" />
              
              <OrkutCard>
                <OrkutCardHeader>
                  <div className="flex items-center space-x-2">
                    <Home className="h-4 w-4 text-purple-600" />
                    <span className="text-gray-600 text-sm font-medium">Navegação</span>
                  </div>
                </OrkutCardHeader>
                <OrkutCardContent>
                  <div className="space-y-1">
                    <Link href="/" className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-purple-50 transition-colors">
                      <Home className="h-5 w-5 text-purple-600" />
                      <span className="text-gray-700 font-medium">Início</span>
                    </Link>
                    <Link href={`/perfil/${profile.username}`} className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-purple-50 transition-colors">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={profile.photo_url || undefined} alt={profile.display_name} />
                        <AvatarFallback className="text-xs">
                          {profile.display_name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-gray-700">{profile.display_name}</span>
                    </Link>
                    <Link href="/amigos" className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-purple-50 transition-colors">
                      <UserCheck className="h-5 w-5 text-purple-600" />
                      <span className="text-gray-700">Amigos</span>
                    </Link>
                    <Link href="/comunidades" className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-purple-50 transition-colors">
                      <Users className="h-5 w-5 text-purple-600" />
                      <span className="text-gray-700">Comunidades</span>
                    </Link>
                    <Link href="/mensagens" className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-purple-50 transition-colors">
                      <MessageSquare className="h-5 w-5 text-purple-600" />
                      <span className="text-gray-700">Mensagens</span>
                    </Link>
                  </div>
                </OrkutCardContent>
              </OrkutCard>
            </div>
            
            {/* DESKTOP & MOBILE: Criar Post */}
            <CreatePost onPostCreated={() => {
              console.log('🎉 Post criado, GlobalFeed será atualizado automaticamente via evento')
            }} />
            
            
            {/* FEED GLOBAL - PRINCIPAL CONTEÚDO NO CENTRO */}
            <GlobalFeed />
            
            {/* DESKTOP: Card Musical Expansível */}
            <div className="hidden lg:block">
              <ExpandableMusicCard />
            </div>
            
            {/* MOBILE: Cards adicionais */}
            <div className="lg:hidden space-y-4">
              <OnlineFriends 
                onOpenMessage={() => router.push('/mensagens')} 
                onStartAudioCall={(user) => startAudioCall(user)}
              />
              
              <CommunityNotifications className="shadow-sm" />
            </div>
          </div>

          {/* Right Sidebar - 7 Cards Equilibrados */}
          <div className="space-y-4 lg:space-y-6 lg:sticky lg:top-4 order-3">
            {/* 1. Amigos Online */}
            <OnlineFriends 
              onOpenMessage={() => router.push('/mensagens')} 
              onStartAudioCall={(user) => startAudioCall(user)}
            />

            {/* 2. Central de Chamadas */}
            <CallCenterCard />

            {/* 3. Avisos da Comunidade */}
            <CommunityNotifications className="shadow-md" />

            {/* 4. Widget de Rádio */}
            <RadioTatuapeWidget className="shadow-md" />

            {/* 5. Site Users - Gmail Users */}
            <OrkutCard className="flex flex-col">
              <OrkutCardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Globe className="h-4 w-4" />
                    <span>Users</span>
                    <div className="bg-red-500 px-2 py-1 rounded text-white text-xs font-bold">
                      Gmail
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <span>🔄 {gmailUsersStats.total}</span>
                  </div>
                </div>
                
                {/* Meta Compacta */}
                <div className="mt-2 p-2 bg-gradient-to-r from-purple-50 to-pink-50 rounded border border-purple-200">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-purple-600 font-medium">🎯 Meta: 1.000</span>
                    <span className="font-bold text-purple-700">{gmailUsersStats.total}/1000</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((gmailUsersStats.total / 1000) * 100, 100)}%` }}
                    ></div>
                  </div>
                  {gmailUsersStats.total < 1000 && (
                    <div className="text-xs text-gray-500 mt-1 text-center">
                      {Math.max(1000 - gmailUsersStats.total, 0)} restantes
                    </div>
                  )}
                </div>

                {/* Next Level 500.000 */}
                <div className="mt-2 p-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded border border-green-200">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-green-600 font-medium">🚀 Next level: 500.000</span>
                    <span className="font-bold text-green-700">{gmailUsersStats.total}/500000</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-emerald-500 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((gmailUsersStats.total / 500000) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </OrkutCardHeader>
              <OrkutCardContent className="p-0 flex-1 flex flex-col">
                {loadingGmailUsers ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto mb-2"></div>
                    <p className="text-xs text-gray-500">Carregando usuários...</p>
                  </div>
                ) : gmailUsers.length === 0 ? (
                  <div className="p-8 text-center">
                    <Globe className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 mb-1">Nenhum user Gmail</p>
                    <p className="text-xs text-gray-400">Cadastre-se com Google!</p>
                  </div>
                ) : (
                  <div className="max-h-72 overflow-y-auto">
                    {/* Online Users Section - Compacta */}
                    {gmailUsers.filter(u => u.status === 'online').length > 0 && (
                      <div className="px-2 pb-1">
                        <div className="flex items-center space-x-1 mb-1.5">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                          <span className="text-xs font-medium text-gray-600">
                            Online ({gmailUsers.filter(u => u.status === 'online').length})
                          </span>
                        </div>
                        <div className="space-y-1">
                          {gmailUsers.filter(u => u.status === 'online').slice(0, 3).map((user, idx) => (
                            <div key={user.id} className="flex items-center space-x-2 px-1.5 py-1 rounded hover:bg-gray-50 transition-colors cursor-pointer group">
                              <div className="relative">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={user.photo_url} alt={user.display_name} />
                                  <AvatarFallback className="text-xs bg-purple-500 text-white">
                                    {user.display_name.substring(0, 1).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border border-white"></div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-gray-900 truncate">{user.display_name.split(' ')[0]}</p>
                              </div>
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="p-0.5 h-5 w-5 text-gray-600 hover:bg-gray-200"
                                  title="Ver perfil"
                                  onClick={() => router.push(`/perfil/${user.username}`)}
                                >
                                  <UserCheck className="h-2.5 w-2.5" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Offline Users Section - Compacta */}
                    {gmailUsers.filter(u => u.status === 'offline').length > 0 && (
                      <div className="px-2 pb-1">
                        <div className="flex items-center space-x-1 mb-1.5">
                          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                          <span className="text-xs font-medium text-gray-600">
                            Offline ({gmailUsers.filter(u => u.status === 'offline').length})
                          </span>
                        </div>
                        <div className="space-y-1">
                          {gmailUsers.filter(u => u.status === 'offline').slice(0, 2).map((user) => (
                            <div key={user.id} className="flex items-center space-x-2 px-1.5 py-1 rounded hover:bg-gray-50 transition-colors cursor-pointer group opacity-60">
                              <div className="relative">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={user.photo_url} alt={user.display_name} />
                                  <AvatarFallback className="text-xs bg-gray-500 text-white">
                                    {user.display_name.substring(0, 1).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-gray-400 rounded-full border border-white"></div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-gray-700 truncate">{user.display_name.split(' ')[0]}</p>
                              </div>
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="p-0.5 h-5 w-5 text-gray-600 hover:bg-gray-200"
                                  title="Ver perfil"
                                  onClick={() => router.push(`/perfil/${user.username}`)}
                                >
                                  <UserCheck className="h-2.5 w-2.5" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Footer with total count */}
                {!loadingGmailUsers && gmailUsers.length > 0 && (
                  <div className="border-t border-gray-100 p-3">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full border-purple-300 text-purple-700 hover:bg-purple-50 text-xs"
                      onClick={() => router.push('/membros')}
                    >
                      Ver todos ({gmailUsersStats.total})
                    </Button>
                  </div>
                )}
              </OrkutCardContent>
            </OrkutCard>

            {/* 6. Logins Recentes - Movido para direita */}
            <RecentLoginsCard />

            {/* 7. Install App */}
            <OrkutCard>
              <OrkutCardHeader>
                <div className="flex items-center space-x-2">
                  <Download className="h-4 w-4 text-purple-600" />
                  <span className="text-gray-600 text-sm font-medium">Instalar App</span>
                </div>
              </OrkutCardHeader>
              <OrkutCardContent>
                {/* PWA Install Section */}
                <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-3 mb-3">
                  <div className="text-center mb-2">
                    <div className="text-lg mb-1">📱</div>
                    <p className="text-xs font-medium text-gray-700">Instalar como App</p>
                    <p className="text-xs text-gray-500">Acesso rápido + offline</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={() => {
                        if ('serviceWorker' in navigator) {
                          toast.success('💡 Procure pelo ícone "Instalar" na barra do navegador!');
                        } else {
                          toast.info('📱 Menu → "Adicionar à tela inicial"');
                        }
                      }}
                      size="sm"
                      variant="outline"
                      className="border-green-300 text-green-700 hover:bg-green-50 text-xs"
                    >
                      🌐 Browser
                    </Button>
                    
                    <Button
                      onClick={() => {
                        window.open('https://www.google.com/chrome/', '_blank');
                        toast.success('🌐 Chrome oferece a melhor experiência!');
                      }}
                      size="sm"
                      variant="outline"
                      className="border-blue-300 text-blue-700 hover:bg-blue-50 text-xs"
                    >
                      🌐 Chrome
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Button 
                    onClick={() => {
                      toast.info('🌐 Chrome Store: Em desenvolvimento! Use PWA acima.');
                    }}
                    size="sm" 
                    variant="outline" 
                    className="w-full justify-start border-gray-300 text-gray-600 hover:bg-gray-50"
                  >
                    <DiChrome className="h-4 w-4 mr-2 text-blue-400" />
                    Chrome Store
                  </Button>
                  <Button 
                    onClick={() => {
                      toast.info('📱 Google Play: Em desenvolvimento! Use PWA acima.');
                    }}
                    size="sm" 
                    variant="outline" 
                    className="w-full justify-start border-gray-300 text-gray-600 hover:bg-gray-50"
                  >
                    <DiAndroid className="h-4 w-4 mr-2 text-green-400" />
                    Google Play
                  </Button>
                  <Button 
                    onClick={() => {
                      toast.info('🍎 App Store: Em desenvolvimento! Use PWA acima.');
                    }}
                    size="sm" 
                    variant="outline" 
                    className="w-full justify-start border-gray-300 text-gray-600 hover:bg-gray-50"
                  >
                    <DiApple className="h-4 w-4 mr-2 text-gray-700" />
                    App Store
                  </Button>
                </div>
                <div className="mt-3 text-center">
                  <p className="text-xs text-gray-500">
                    💡 PWA disponível agora!
                  </p>
                </div>
              </OrkutCardContent>
            </OrkutCard>

          </div>
        </div>
      </div>

      <Footer />
      <OrkyAssistant />
      <AIAssistant />
      
      
      {/* Modal de Chamada */}
      {callState.isOpen && callState.targetUser && callState.callType && (
        <CallModal
          isOpen={callState.isOpen}
          onClose={endCall}
          callType={callState.callType}
          targetUser={callState.targetUser}
        />
      )}
    </div>
  )
}
