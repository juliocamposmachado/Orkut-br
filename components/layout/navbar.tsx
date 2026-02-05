'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { 
  Home, 
  User, 
  Users, 
  MessageCircle, 
  Search, 
  Settings,
  LogOut,
  Mic,
  MicOff
} from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useVoice } from '@/contexts/voice-context'

export function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, profile, signOut } = useAuth()
  const { isVoiceEnabled, toggleVoice, isListening } = useVoice()

  const navItems = [
    { icon: Home, label: 'início', href: '/' },
    { icon: User, label: 'perfil', href: '/perfil' },
    { icon: Users, label: 'amigos', href: '/amigos' },
    { icon: MessageCircle, label: 'comunidades', href: '/comunidades' },
    { icon: MessageCircle, label: 'mensagens', href: '/mensagens' },
    { icon: Search, label: 'buscar', href: '/buscar' },
  ]

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
            <div className="bg-white rounded-full p-2">
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Orkut
              </span>
            </div>
          </Link>

          {/* Navigation Items */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`text-white hover:bg-white/20 transition-all duration-200 ${
                      isActive ? 'bg-white/20' : ''
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.label}
                  </Button>
                </Link>
              )
            })}
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-4">
            {/* Voice Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleVoice}
              className={`text-white hover:bg-white/20 transition-all duration-200 ${
                isVoiceEnabled ? 'bg-white/20' : ''
              }`}
            >
              {isListening ? (
                <div className="flex items-center space-x-2">
                  <Mic className="h-4 w-4 text-red-300 animate-pulse" />
                  <span className="text-xs">Ouvindo...</span>
                </div>
              ) : isVoiceEnabled ? (
                <div className="flex items-center space-x-2">
                  <Mic className="h-4 w-4" />
                  <span className="text-xs">Voz Ativa</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <MicOff className="h-4 w-4" />
                  <span className="text-xs">Usar por Áudio</span>
                </div>
              )}
            </Button>

            {/* Settings */}
            <Link href="/configuracoes">
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </Link>

            {/* Profile */}
            <div className="flex items-center space-x-2">
              <Avatar className="h-8 w-8 border-2 border-white">
                <AvatarImage src={profile?.photo_url} alt={profile?.display_name} />
                <AvatarFallback>
                  {profile?.display_name?.charAt(0)?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-white text-sm font-medium hidden sm:block">
                {profile?.display_name}
              </span>
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                online
              </Badge>
            </div>

            {/* Sign Out */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-white hover:bg-white/20"
            >
              <LogOut className="h-4 w-4" />
            </Button>
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
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`text-white hover:bg-white/20 transition-all duration-200 flex-col h-auto py-2 ${
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