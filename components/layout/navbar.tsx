'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
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
  MoreHorizontal
} from 'lucide-react'
import { useAuth } from '@/contexts/auth-context-fallback'
import { useVoice } from '@/contexts/voice-context'
import { NotificationsDropdown } from '@/components/notifications/notifications-dropdown'

export function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, profile, signOut } = useAuth()
  const { isVoiceEnabled, toggleVoice, isListening } = useVoice()

  const navItems = [
    { icon: Home, label: 'início', href: '/' },
    { icon: Users, label: 'amigos', href: '/amigos' },
    { icon: Globe, label: 'comunidades', href: '/comunidades' },
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
    
    try {
      router.push(href)
      console.log(`[Navbar] Navegação iniciada com sucesso para: ${href}`)
    } catch (error) {
      console.error(`[Navbar] Erro na navegação para ${href}:`, error)
      // Fallback: try window.location if router fails
      window.location.href = href
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  if (!user) return null

  return (
    <nav className="bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <span className="text-2xl font-bold orkut-launch-logo">
                Orkut
              </span>
            </div>
          </Link>

          {/* Navigation Items - Facebook Style */}
          <div className="hidden md:flex items-center justify-center flex-1 max-w-md mx-8">
            <div className="flex items-center space-x-2">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link 
                    key={item.href} 
                    href={item.href}
                    onClick={(e) => handleNavClick(item.href, item.label, e)}
                    className={`group text-white hover:bg-white/30 transition-all duration-200 w-12 h-12 p-0 rounded-xl flex items-center justify-center relative z-10 cursor-pointer transform hover:scale-105 ${
                      isActive ? 'bg-white/30 border-b-2 border-white shadow-lg' : 'hover:shadow-md'
                    }`}
                    title={item.label.charAt(0).toUpperCase() + item.label.slice(1)}
                  >
                    <Icon className="h-6 w-6 group-hover:scale-110 transition-transform duration-200" />
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Right Side - Facebook Style */}
          <div className="flex items-center space-x-2">
            {/* Messages Icon */}
            <Link 
              href="/recados"
              onClick={(e) => handleNavClick('/recados', 'mensagens', e)}
              className="group text-white hover:bg-white/30 w-10 h-10 p-0 rounded-full flex items-center justify-center transition-all duration-200 relative z-10 cursor-pointer transform hover:scale-105 hover:shadow-md"
              title="Mensagens"
            >
              <MessageCircle className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
            </Link>

            {/* Notifications */}
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20 w-10 h-10 p-0 rounded-full relative"
              title="Notificações"
            >
              <Bell className="h-5 w-5" />
              {/* Notification badge */}
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-white">3</span>
              </div>
            </Button>

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
              className="cursor-pointer transform hover:scale-105 transition-transform duration-200"
            >
              <Avatar className="h-10 w-10 border-2 border-white hover:border-white/80 hover:shadow-lg transition-all duration-200 cursor-pointer">
                <AvatarImage src={profile?.photo_url || undefined} alt={profile?.display_name} />
                <AvatarFallback className="bg-white text-purple-600 font-semibold">
                  {profile?.display_name?.charAt(0)?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-white/20">
        <div className="flex justify-around py-2">
          {navItems.slice(0, 5).map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link 
                key={item.href} 
                href={item.href} 
                onClick={(e) => handleNavClick(item.href, item.label, e)}
                className="cursor-pointer"
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className={`text-white hover:bg-white/20 transition-all duration-200 flex-col h-auto py-2 cursor-pointer ${
                    isActive ? 'bg-white/20' : ''
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-xs mt-1">{item.label}</span>
                </Button>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}