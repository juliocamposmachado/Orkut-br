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
import GoogleTrends from '@/components/GoogleTrends'
import { CommunityNotifications } from '@/components/CommunityNotifications'
import { MEE6DiscordCard } from '@/components/discord/mee6-discord-card'
import { RecentLoginsCard } from '@/components/auth/recent-logins-card'

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
        
        <div className="grid grid-cols-1 lg:grid-cols-[1fr] xl:grid-cols-[280px_1fr_280px] 2xl:grid-cols-[320px_1fr_320px] gap-2 xs:gap-4 lg:gap-6 items-start">
          
          {/* Left Sidebar - Hidden on mobile to fix layout */}
          <div className="hidden xl:block space-y-4 lg:sticky lg:top-4">
            {/* Espaçamento para alinhamento com card central */}
            <div className="h-16"></div>
            
            {/* Logins Recentes - NOVO CARD */}
            <RecentLoginsCard />
            
            {/* MEE6 Discord Bot - NOVO CARD */}
            <MEE6DiscordCard />
            
            {/* Radio Widget */}
            <RadioTatuapeWidget className="shadow-md" />
            
            {/* Navigation Menu */}
            <OrkutCard>
              <OrkutCardContent>
                <div className="space-y-1 p-2">
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

          
          {/* Main Content - Postagens no meio */}
          <div className="w-full space-y-4 lg:space-y-6 flex flex-col items-center">
            {/* Espaçamento para alinhamento com card central */}
            <div className="hidden lg:block h-16"></div>
            {/* Streaming Player Widget removido por não funcionar */}
            
            {/* Navigation Menu - Movido para cima para mais acessibilidade */}
            <OrkutCard>
              <OrkutCardContent>
                <div className="space-y-1 p-2">
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

            {/* Sponsored Ads Carousel - Movido para baixo */}
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


            {/* Minhas Playlists - movido para mais acima */}
            <OrkutCard>
              <OrkutCardHeader>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 text-sm font-medium">Minhas Playlists</span>
                  <div className="bg-red-600 px-2 py-1 rounded text-white text-xs font-bold">
                    YouTube
                  </div>
                </div>
              </OrkutCardHeader>
              <OrkutCardContent className="p-0">
                <div className="relative overflow-hidden rounded-b-lg">
                  {/* Thumbnail clicável */}
                  <div 
                    className="relative cursor-pointer group"
                    onClick={() => {
                      // Abre no miniplayer do YouTube - janela maior para mostrar melhor a capa
                      const miniplayerUrl = 'https://www.youtube.com/playlist?list=PLkm4QB9CKklpa5tej_S5yL-VM59O7mshE'
                      const windowFeatures = 'width=800,height=600,resizable=yes,scrollbars=yes,toolbar=no,menubar=no,location=yes,status=no'
                      window.open(miniplayerUrl, 'YouTubeMiniPlayer', windowFeatures)
                    }}
                  >
                    <div className="relative w-full aspect-video flex flex-col items-center justify-center text-white overflow-hidden">
                      {/* Background image */}
                      <img 
                        src="https://i.ytimg.com/vi/Evbbtpavsuo/maxresdefault.jpg?sqp=-oaymwEmCIAKENAF8quKqQMa8AEB-AH-CYAC0AWKAgwIABABGH8gEygaMA8=&rs=AOn4CLD1Ffb5W21keyPtr-CJhYH7XV3Sbg"
                        alt="Juliette Psicose - Voices of The Forgotten"
                        className="absolute inset-0 w-full h-full object-cover"
                        crossOrigin="anonymous"
                        onError={(e) => {
                          console.log('Erro ao carregar imagem da playlist:', e)
                          // Fallback para gradiente se a imagem não carregar
                          e.currentTarget.style.display = 'none'
                          e.currentTarget.parentElement!.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                        }}
                      />
                      {/* Dark overlay for better text readability */}
                      <div className="absolute inset-0 bg-black bg-opacity-40"></div>
                      
                      {/* Content */}
                      <div className="relative z-10 text-center">
                        <div className="text-4xl mb-3">🎵</div>
                        <div className="text-lg font-bold mb-1">Juliette Psicose</div>
                        <div className="text-sm opacity-90 mb-2">Voices of The Forgotten</div>
                        <div className="text-xs opacity-75 bg-black bg-opacity-30 px-3 py-1 rounded-full">
                          Playlist Musical
                        </div>
                      </div>
                      
                      {/* Overlay escuro */}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300"></div>
                      
                      {/* Botão Play Central */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-16 bg-red-600 bg-opacity-90 rounded-full flex items-center justify-center shadow-xl group-hover:bg-red-700 group-hover:scale-110 transition-all duration-300">
                          <svg className="w-8 h-8 text-white ml-1" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                        </div>
                      </div>
                      
                      {/* Badge Miniplayer */}
                      <div className="absolute top-2 left-2">
                        <div className="bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs font-medium">
                          📺 Miniplayer
                        </div>
                      </div>
                      
                      {/* Duração/Info */}
                      <div className="absolute bottom-2 right-2">
                        <div className="bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
                          Playlist
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Informações da playlist */}
                  <div className="p-3 bg-white">
                    <h3 className="font-semibold text-gray-800 text-sm mb-1 line-clamp-1">
                      Juliette Psicose
                    </h3>
                    <p className="text-gray-500 text-xs mb-3 line-clamp-1">
                      Voices of The Forgotten
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-xs text-gray-400">
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                        </svg>
                        <span>Lista de reprodução</span>
                      </div>
                      
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-red-600 hover:bg-red-50 px-2 py-1 h-auto text-xs"
                        onClick={(e) => {
                          e.stopPropagation()
                          window.open('https://www.youtube.com/playlist?list=PLkm4QB9CKklpa5tej_S5yL-VM59O7mshE', '_blank')
                        }}
                      >
                        Abrir YouTube
                      </Button>
                    </div>
                  </div>
                </div>
              </OrkutCardContent>
            </OrkutCard>

            {/* Quick Actions - Desktop Only */}
            <div className="hidden lg:block">
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
                      onClick={() => router.push('/comunidades/criar')}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Criar comunidade
                    </Button>
                  </div>
                </OrkutCardContent>
              </OrkutCard>
            </div>
            
            {/* Download Apps - Desktop Only */}
            <div className="hidden lg:block">
              <OrkutCard>
                <OrkutCardHeader>
                  <div className="flex items-center space-x-2">
                    <Download className="h-4 w-4 text-purple-600" />
                    <span className="text-gray-600 text-sm font-medium">Baixar Apps</span>
                  </div>
                </OrkutCardHeader>
                <OrkutCardContent>
                  <div className="space-y-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="w-full justify-start border-gray-300 text-gray-600 hover:bg-gray-50 cursor-not-allowed opacity-60"
                      disabled
                    >
                      <Monitor className="h-4 w-4 mr-2" />
                      Windows 10
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="w-full justify-start border-gray-300 text-gray-600 hover:bg-gray-50 cursor-not-allowed opacity-60"
                      disabled
                    >
                      <Smartphone className="h-4 w-4 mr-2" />
                      Android
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="w-full justify-start border-gray-300 text-gray-600 hover:bg-gray-50 cursor-not-allowed opacity-60"
                      disabled
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      iOS
                    </Button>
                  </div>
                  <div className="mt-3 text-center">
                    <p className="text-xs text-gray-500">
                      💡 Em desenvolvimento
                    </p>
                  </div>
                </OrkutCardContent>
              </OrkutCard>
            </div>


            {/* Top Friends - Desktop Only */}
            <div className="hidden lg:block">
              <OrkutCard>
                <OrkutCardHeader>
                  <div className="flex items-center space-x-2">
                    <Star className="h-4 w-4" />
                    <span>Top 10 Amigos</span>
                  </div>
                </OrkutCardHeader>
                <OrkutCardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {Array.from({ length: 4 }).map((_, idx) => (
                      <div key={idx} className="text-center">
                        <img 
                          src={`https://images.pexels.com/photos/${220000 + idx}/pexels-photo-${220000 + idx}.jpeg?auto=compress&cs=tinysrgb&w=100`}
                          alt={`Amigo ${idx + 1}`}
                          className="w-12 h-12 rounded-full mx-auto mb-1 object-cover hover:opacity-80 transition-opacity cursor-pointer"
                        />
                        <p className="text-xs text-gray-600">Amigo {idx + 1}</p>
                      </div>
                    ))}
                  </div>
                </OrkutCardContent>
              </OrkutCard>
            </div>
          </div>

          {/* Main Content - Postagens no meio */}
          <div className="space-y-4 lg:space-y-6 order-1 lg:order-2 flex flex-col items-center">
            {/* MOBILE ORDER - Card 1: Regras da Comunidade */}
            <div className="lg:hidden w-full max-w-2xl px-2">
              <CommunityRulesCard className="shadow-sm" />
            </div>
            
            {/* MOBILE ORDER - Card 2: Navigation Menu (Início, Amigos, Comunidades, Mensagens) */}
            <div className="lg:hidden w-full max-w-2xl px-2">
              <OrkutCard>
                <OrkutCardHeader>
                  <div className="flex items-center space-x-2">
                    <Home className="h-4 w-4 text-purple-600" />
                    <span className="text-gray-600 text-sm font-medium">Início</span>
                  </div>
                </OrkutCardHeader>
                <OrkutCardContent>
                  <div className="space-y-1 p-2">
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
            
            {/* MOBILE ORDER - Card 3: Patrocinado */}
            <div className="lg:hidden w-full max-w-2xl px-2">
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
            
            {/* MOBILE ORDER - Card 4: O que você está pensando (CreatePost) */}
            <div className="lg:hidden w-full max-w-2xl px-2">
              <CreatePost onPostCreated={() => {
                console.log('🎉 Post criado, GlobalFeed será atualizado automaticamente via evento')
              }} />
            </div>
            
            {/* MOBILE ORDER - Card 5: Feed Global */}
            <div className="lg:hidden w-full max-w-2xl px-2">
              <GlobalFeed />
            </div>
            
            {/* MOBILE ORDER - Card 6: Amigos Online */}
            <div className="lg:hidden w-full max-w-2xl px-2">
              <OnlineFriends 
                onOpenMessage={() => router.push('/mensagens')} 
                onStartAudioCall={(user) => startAudioCall(user)}
              />
            </div>
            
            {/* MOBILE ORDER - Card 6.5: Avisos da Comunidade */}
            <div className="lg:hidden w-full max-w-2xl px-2">
              <CommunityNotifications className="shadow-sm" />
            </div>
            
            {/* MOBILE ORDER - Card 7: Users Gmail */}
            <div className="lg:hidden w-full max-w-2xl px-2">
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
            </div>

            {/* DESKTOP CONTENT */}
            {/* Desktop: Regras da Comunidade primeiro */}
            <div className="hidden lg:block w-full max-w-2xl">
              <CommunityRulesCard className="shadow-sm" />
            </div>

            {/* Desktop: Criar Post */}
            <div className="hidden lg:block w-full max-w-2xl">
              <CreatePost onPostCreated={() => {
                console.log('🎉 Post criado, GlobalFeed será atualizado automaticamente via evento')
              }} />
            </div>
            
            {/* Desktop: Assuntos em Alta - Google Trends */}
            <div className="hidden lg:block w-full max-w-2xl">
              <GoogleTrends />
            </div>
            
            {/* Desktop: Novo Card Musical Expansível */}
            <div className="hidden lg:block w-full max-w-2xl">
              <ExpandableMusicCard />
            </div>
            
            {/* Desktop: Feed Global Otimizado */}
            <div className="hidden lg:block w-full max-w-2xl">
              <GlobalFeed />
            </div>
          </div>

          {/* Right Sidebar - Nova organização */}
          <div className="space-y-4 lg:space-y-6 lg:sticky lg:top-4 order-3">
            {/* Espaçamento para alinhamento com card central */}
            <div className="hidden lg:block h-16"></div>

            {/* 1. Amigos Online - PRIMEIRO CARD */}
            <OnlineFriends 
              onOpenMessage={() => router.push('/mensagens')} 
              onStartAudioCall={(user) => startAudioCall(user)}
            />

            {/* 2. Avisos da Comunidade - NOVO CARD */}
            <CommunityNotifications className="shadow-md" />

            {/* 3. Widget de Rádio - de volta à sidebar direita */}
            <RadioTatuapeWidget className="shadow-md" />

            {/* 2. Site Users - Gmail Users compacto */}
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


            {/* 4. Anúncios Patrocinados - sidebar direita */}
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

            {/* 5. Comunidades em Alta - de volta à sidebar */}
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

            {/* 6. Ações Rápidas - sidebar direita */}
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
                    onClick={() => router.push('/comunidades/criar')}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Criar comunidade
                  </Button>
                </div>
              </OrkutCardContent>
            </OrkutCard>

            {/* 7. Top Friends - sidebar direita */}
            <OrkutCard>
              <OrkutCardHeader>
                <div className="flex items-center space-x-2">
                  <Star className="h-4 w-4" />
                  <span>Top 10 Amigos</span>
                </div>
              </OrkutCardHeader>
              <OrkutCardContent>
                <div className="grid grid-cols-2 gap-3">
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <div key={idx} className="text-center">
                      <img 
                        src={`https://images.pexels.com/photos/${220000 + idx}/pexels-photo-${220000 + idx}.jpeg?auto=compress&cs=tinysrgb&w=100`}
                        alt={`Amigo ${idx + 1}`}
                        className="w-12 h-12 rounded-full mx-auto mb-1 object-cover hover:opacity-80 transition-opacity cursor-pointer"
                      />
                      <p className="text-xs text-gray-600">Amigo {idx + 1}</p>
                    </div>
                  ))}
                </div>
              </OrkutCardContent>
            </OrkutCard>

            {/* 8. Download Apps - sidebar direita */}
            <OrkutCard>
              <OrkutCardHeader>
                <div className="flex items-center space-x-2">
                  <Download className="h-4 w-4 text-purple-600" />
                  <span className="text-gray-600 text-sm font-medium">Baixar Apps</span>
                </div>
              </OrkutCardHeader>
              <OrkutCardContent>
                <div className="space-y-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full justify-start border-gray-300 text-gray-600 hover:bg-gray-50 cursor-not-allowed opacity-60"
                    disabled
                  >
                    <Monitor className="h-4 w-4 mr-2" />
                    Windows 10
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full justify-start border-gray-300 text-gray-600 hover:bg-gray-50 cursor-not-allowed opacity-60"
                    disabled
                  >
                    <Smartphone className="h-4 w-4 mr-2" />
                    Android
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full justify-start border-gray-300 text-gray-600 hover:bg-gray-50 cursor-not-allowed opacity-60"
                    disabled
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    iOS
                  </Button>
                </div>
                <div className="mt-3 text-center">
                  <p className="text-xs text-gray-500">
                    💡 Em desenvolvimento
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
