'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import Image from 'next/image'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Home, 
  User, 
  Users, 
  MessageCircle, 
  Search, 
  Settings,
  LogOut,
  Mic,
  MicOff,
  Globe,
  Bell,
  Menu,
  MoreHorizontal,
  Heart,
  UserPlus,
  Github,
  ExternalLink,
  Camera,
  Shield,
  Crown
} from 'lucide-react'
import { useAuth } from '@/contexts/enhanced-auth-context'
import { useVoice } from '@/contexts/voice-context'
import { useSubscription } from '@/hooks/use-subscription'
import { NotificationsDropdown } from '@/components/notifications/notifications-dropdown'
import BugReporter from '@/components/bug-reporter'
import { AnimatediFoodButton } from '@/components/ui/animated-ifood-button'
import { OfflineStatusIndicator } from '@/components/ui/offline-status-indicator'

export function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, profile, signOut } = useAuth()
  const { isVoiceEnabled, toggleVoice, isListening } = useVoice()
  const { hasActiveSubscription, isLoading: subscriptionLoading } = useSubscription()

  const navItems = [
    { icon: Home, label: 'início', href: '/' },
    { icon: Users, label: 'amigos', href: '/amigos' },
    { icon: MessageCircle, label: 'mensagens', href: '/mensagens' },
    { icon: Globe, label: 'comunidades', href: '/comunidades' },
    { icon: Camera, label: 'fotos', href: '/fotos' },
    { icon: Search, label: 'buscar', href: '/buscar' },
  ]

  const handleNavClick = (href: string, label: string, event?: React.MouseEvent) => {
    // Previne o comportamento padrão do Link se necessário
    if (event) {
      event.preventDefault()
    }
    console.log(`[Navbar] Navegando para: ${href} (${label})`)
    console.log(`[Navbar] Profile state:`, { 
      username: profile?.username, 
      display_name: profile?.display_name,
      id: profile?.id 
    })
    
    // Navegar normalmente para todas as páginas (incluindo fotos)
    // O Google Photos deve ser acessado dentro da página /fotos
    
    try {
      router.push(href)
      console.log(`[Navbar] Navegação iniciada com sucesso para: ${href}`)
    } catch (error) {
      console.error(`[Navbar] Erro na navegação para ${href}:`, error)
      // Fallback: try window.location if router fails (only on client)
      if (typeof window !== 'undefined') {
        window.location.href = href
      }
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  if (!user) return null

  return (
    <>
      <nav className="bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center h-16">
          {/* Left Side - Logo + GitHub */}
          <div className="flex items-center space-x-2 xs:space-x-4 flex-shrink-0">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <div className="bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <span className="text-2xl font-bold orkut-launch-logo">
                  Orkut
                </span>
              </div>
            </Link>

            {/* iFood Button Animado - Left Side */}
            <div className="hidden lg:flex">
              <Link 
                href="https://www.ifood.com.br/delivery/sao-paulo-sp/adega-radio-tatuape-fm-24-horas-vila-regente-feijo/29aa6191-cf23-4569-a8c3-d7bd66d877b5"
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-red-600 hover:bg-red-700 text-white rounded-full transition-all duration-300 transform hover:scale-105 hover:shadow-lg border-2 border-red-400 px-6 py-1"
                title="Adega Rádio Tatuapé FM - Bebidas Nacionais e Importadas - Entrega em todo Brasil"
              >
                <AnimatediFoodButton className="group-hover:scale-110 transition-transform duration-200" />
              </Link>
            </div>

            {/* GitHub Button - Left Side */}
            <div className="hidden xl:flex">
              <Link 
                href="https://github.com/juliocamposmachado/Orkut-br"
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full transition-all duration-300 transform hover:scale-105 hover:shadow-lg border border-white/30 flex items-center space-x-2 px-3 py-2"
                title="Ver código-fonte no GitHub - Open Source"
              >
                <Image 
                  src="/opensource-logo.svg" 
                  alt="Open Source" 
                  width={24} 
                  height={24} 
                  className="transition-transform duration-200 group-hover:scale-110"
                />
              </Link>
            </div>
          </div>

          {/* Center - Navigation Items */}
          <div className="flex-1 flex justify-center">
            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link 
                    key={item.href} 
                    href={item.href}
                    onClick={(e) => handleNavClick(item.href, item.label, e)}
                    className={`group text-white hover:bg-white/30 transition-all duration-200 w-11 h-11 p-0 rounded-xl flex items-center justify-center relative z-10 cursor-pointer transform hover:scale-105 ${
                      isActive ? 'bg-white/30 border-b-2 border-white shadow-lg' : 'hover:shadow-md'
                    }`}
                    title={item.label.charAt(0).toUpperCase() + item.label.slice(1)}
                  >
                    <Icon className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Right Side - Facebook Style */}
          <div className="flex items-center space-x-1 xs:space-x-2 justify-end flex-shrink-0">
            {/* Bug Reporter */}
            <div className="relative">
              <BugReporter 
                variant="icon" 
                size="sm" 
                className="text-white hover:bg-white/30 w-10 h-10 p-0 rounded-full flex items-center justify-center transition-all duration-200 relative z-10 cursor-pointer transform hover:scale-105 hover:shadow-md"
                context={{
                  url: pathname || '',
                  component: 'navbar'
                }}
              />
            </div>

            {/* Moderation Button - Only for admins/moderators */}
            {(profile?.role === 'admin' || profile?.role === 'moderator') && (
              <Link 
                href="/moderacao"
                onClick={(e) => handleNavClick('/moderacao', 'moderação', e)}
                className="group text-white hover:bg-white/30 w-10 h-10 p-0 rounded-full flex items-center justify-center transition-all duration-200 relative z-10 cursor-pointer transform hover:scale-105 hover:shadow-md"
                title="Centro de Moderação"
              >
                <Shield className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
              </Link>
            )}
            
            {/* Badge Pro - Only show if user has active subscription */}
            {!subscriptionLoading && hasActiveSubscription && (
              <div className="hidden md:flex items-center space-x-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 xs:px-4 py-1.5 xs:py-2 rounded-full border-2 border-yellow-300 shadow-lg animate-pulse whitespace-nowrap">
                <Crown className="h-3 w-3 xs:h-4 xs:w-4 flex-shrink-0" />
                <span className="text-xs xs:text-sm font-bold">Orkut BR Pro</span>
              </div>
            )}
            
            {/* Notifications */}
            <NotificationsDropdown />

            {/* Menu Options */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20 w-10 h-10 p-0 rounded-full"
                  title="Menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={toggleVoice}>
                  {isListening ? (
                    <>
                      <Mic className="mr-2 h-4 w-4 text-red-500" />
                      <span>Ouvindo...</span>
                    </>
                  ) : isVoiceEnabled ? (
                    <>
                      <Mic className="mr-2 h-4 w-4" />
                      <span>Desativar Voz</span>
                    </>
                  ) : (
                    <>
                      <MicOff className="mr-2 h-4 w-4" />
                      <span>Ativar Assistente de Voz</span>
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/solicitacoes-amizade" className="w-full">
                    <UserPlus className="mr-2 h-4 w-4 text-purple-600" />
                    <span>Solicitações de Amizade</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/homenagem" className="w-full">
                    <Heart className="mr-2 h-4 w-4 text-red-500" />
                    <span>🕊️ Em Memória de Helen Vitai</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/configuracoes" className="w-full">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Configurações</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Profile Avatar Only */}
            <Link 
              href={profile?.username ? `/perfil/${profile.username}` : '/perfil'} 
              onClick={(e) => handleNavClick(profile?.username ? `/perfil/${profile.username}` : '/perfil', 'perfil', e)}
              title={profile?.display_name || 'Meu Perfil'}
              className="cursor-pointer transform hover:scale-105 transition-transform duration-200 flex-shrink-0"
            >
              <Avatar className="h-8 w-8 xs:h-10 xs:w-10 border-2 border-white hover:border-white/80 hover:shadow-lg transition-all duration-200 cursor-pointer">
                <AvatarImage src={profile?.photo_url || undefined} alt={profile?.display_name} />
                <AvatarFallback className="bg-white text-purple-600 font-semibold text-xs xs:text-sm">
                  {profile?.display_name?.charAt(0)?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-white/20">
        <div className="flex justify-around items-center py-1 px-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link 
                key={item.href} 
                href={item.href} 
                onClick={(e) => handleNavClick(item.href, item.label, e)}
                className="flex-1 max-w-[50px] cursor-pointer"
                title={item.label.charAt(0).toUpperCase() + item.label.slice(1)}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className={`w-full h-10 p-0 text-white hover:bg-white/20 transition-all duration-200 rounded-lg cursor-pointer ${
                    isActive ? 'bg-white/20 shadow-md' : ''
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </Button>
              </Link>
            )
          })}
          
          {/* iFood Button Mobile */}
          <Link 
            href="https://www.ifood.com.br/delivery/sao-paulo-sp/adega-radio-tatuape-fm-24-horas-vila-regente-feijo/29aa6191-cf23-4569-a8c3-d7bd66d877b5"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 max-w-[50px] cursor-pointer"
            title="iFood - Adega Rádio Tatuapé FM"
          >
            <Button
              variant="ghost"
              size="sm"
              className="w-full h-10 p-0 text-white hover:bg-white/20 transition-all duration-200 rounded-lg cursor-pointer"
            >
              <Image 
                src="/ifood-logo.png" 
                alt="iFood" 
                width={20} 
                height={20} 
                className="rounded"
              />
            </Button>
          </Link>
          
          {/* GitHub Button Mobile */}
          <Link 
            href="https://github.com/juliocamposmachado/Orkut-br"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 max-w-[50px] cursor-pointer"
            title="Código Aberto - GitHub"
          >
            <Button
              variant="ghost"
              size="sm"
              className="w-full h-10 p-0 text-white hover:bg-white/20 transition-all duration-200 rounded-lg cursor-pointer"
            >
              <Image 
                src="/opensource-logo.svg" 
                alt="Open Source" 
                width={20} 
                height={20}
              />
            </Button>
          </Link>
        </div>
      </div>
    </nav>
      
      {/* Status Indicator - aparece apenas quando offline ou dados desatualizados */}
      <OfflineStatusIndicator className="w-full" />
    </>
  )
}