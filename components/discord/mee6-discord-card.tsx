'use client'

import React, { useState } from 'react'
import { OrkutCard, OrkutCardContent, OrkutCardHeader } from '@/components/ui/orkut-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Bot, 
  Shield, 
  Wrench, 
  Bell, 
  Gamepad2, 
  Palette, 
  Crown, 
  Sparkles,
  Users,
  MessageSquare,
  Music,
  Gift,
  Zap,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

interface MEE6Feature {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  category: string
  premium?: boolean
}

const mee6Features: MEE6Feature[] = [
  // Moderação e gerenciamento
  {
    id: 'moderation',
    name: 'Moderação Automática',
    description: 'Auto-mod, filtros de spam, detecção de mau comportamento',
    icon: <Shield className="h-4 w-4" />,
    category: 'Moderação'
  },
  {
    id: 'welcome',
    name: 'Mensagens de Boas-vindas',
    description: 'Saudações personalizadas para novos membros',
    icon: <Users className="h-4 w-4" />,
    category: 'Moderação'
  },
  {
    id: 'roles',
    name: 'Funções de Reação',
    description: 'Atribuição automática de roles por reações',
    icon: <Zap className="h-4 w-4" />,
    category: 'Moderação'
  },
  
  // Utilidades
  {
    id: 'commands',
    name: 'Comandos Personalizados',
    description: 'Comandos avançados, incorporações, pesquisas',
    icon: <Wrench className="h-4 w-4" />,
    category: 'Utilidades'
  },
  {
    id: 'timers',
    name: 'Temporizadores',
    description: 'Registro, estatísticas, canais temporários',
    icon: <Bell className="h-4 w-4" />,
    category: 'Utilidades'
  },
  
  // Alertas sociais
  {
    id: 'social-alerts',
    name: 'Alertas Sociais',
    description: 'Twitch, YouTube, Twitter, Instagram, Reddit, RSS',
    icon: <Bell className="h-4 w-4" />,
    category: 'Alertas'
  },
  
  // Jogos e Diversão
  {
    id: 'leveling',
    name: 'Sistema de Níveis',
    description: 'XP, rankings, recompensas por atividade',
    icon: <Gamepad2 className="h-4 w-4" />,
    category: 'Jogos'
  },
  {
    id: 'music-quiz',
    name: 'Quiz Musical',
    description: 'Brindes, aniversários, quiz de música',
    icon: <Music className="h-4 w-4" />,
    category: 'Jogos'
  },
  {
    id: 'giveaways',
    name: 'Sorteios',
    description: 'Sistema de brindes e economia do servidor',
    icon: <Gift className="h-4 w-4" />,
    category: 'Jogos'
  },
  
  // Premium
  {
    id: 'custom-bot',
    name: 'Bot Personalizado',
    description: 'Avatar, nome, história personalizada com IA',
    icon: <Palette className="h-4 w-4" />,
    category: 'Premium',
    premium: true
  },
  {
    id: 'mee6-ai',
    name: 'MEE6 IA',
    description: 'ChatGPT e Dall-E integrados',
    icon: <Sparkles className="h-4 w-4" />,
    category: 'Premium',
    premium: true
  }
]

export function MEE6DiscordCard() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string>('all')

  const categories = ['all', 'Moderação', 'Utilidades', 'Alertas', 'Jogos', 'Premium']
  
  const filteredFeatures = activeCategory === 'all' 
    ? mee6Features 
    : mee6Features.filter(feature => feature.category === activeCategory)

  const visibleFeatures = isExpanded ? filteredFeatures : filteredFeatures.slice(0, 4)

  return (
    <OrkutCard className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
      <OrkutCardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bot className="h-5 w-5 text-indigo-600" />
            <span className="font-semibold text-indigo-800">MEE6 Discord Bot</span>
          </div>
          <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 text-xs">
            Ativo
          </Badge>
        </div>
        
        {/* Status do Bot */}
        <div className="mt-3 p-3 bg-white/80 rounded-lg border border-indigo-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-700">Bot Online</span>
            </div>
            <Button 
              size="sm" 
              variant="outline" 
              className="h-6 px-2 text-xs border-indigo-300 text-indigo-700 hover:bg-indigo-50"
              onClick={() => window.open('https://mee6.xyz', '_blank')}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Dashboard
            </Button>
          </div>
          <div className="text-xs text-gray-600">
            Servidor: <span className="font-medium">Orkut BR Community</span>
          </div>
          <div className="text-xs text-gray-500">
            Membros ativos: <span className="font-medium text-green-600">2,340</span>
          </div>
        </div>

        {/* Filtros de Categoria */}
        <div className="mt-3 flex flex-wrap gap-1">
          {categories.map((category) => (
            <Button
              key={category}
              size="sm"
              variant={activeCategory === category ? "default" : "outline"}
              className={`h-6 px-2 text-xs ${
                activeCategory === category 
                  ? "bg-indigo-600 text-white hover:bg-indigo-700" 
                  : "border-indigo-300 text-indigo-700 hover:bg-indigo-50"
              }`}
              onClick={() => setActiveCategory(category)}
            >
              {category === 'all' ? 'Todos' : category}
            </Button>
          ))}
        </div>
      </OrkutCardHeader>

      <OrkutCardContent>
        <div className="space-y-2">
          {visibleFeatures.map((feature) => (
            <div 
              key={feature.id} 
              className="flex items-start space-x-3 p-3 rounded-lg bg-white/60 hover:bg-white/80 transition-colors border border-indigo-100"
            >
              <div className="flex-shrink-0 p-2 rounded-lg bg-indigo-100">
                {feature.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h4 className="text-sm font-medium text-gray-800 truncate">
                    {feature.name}
                  </h4>
                  {feature.premium && (
                    <Crown className="h-3 w-3 text-yellow-500" />
                  )}
                  <Badge 
                    variant="outline" 
                    className="text-xs h-4 px-1.5 border-indigo-200 text-indigo-600"
                  >
                    {feature.category}
                  </Badge>
                </div>
                <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Botão Expandir/Recolher */}
        {filteredFeatures.length > 4 && (
          <div className="mt-3 text-center">
            <Button
              variant="ghost"
              size="sm"
              className="text-indigo-600 hover:bg-indigo-50 text-xs"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-3 w-3 mr-1" />
                  Mostrar menos
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3 mr-1" />
                  Ver mais ({filteredFeatures.length - 4} recursos)
                </>
              )}
            </Button>
          </div>
        )}

        {/* Ações Rápidas do MEE6 */}
        <div className="mt-4 pt-4 border-t border-indigo-200">
          <div className="grid grid-cols-2 gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              className="text-xs border-indigo-300 text-indigo-700 hover:bg-indigo-50"
              onClick={() => window.open('https://mee6.xyz/dashboard', '_blank')}
            >
              <Shield className="h-3 w-3 mr-1" />
              Moderar
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="text-xs border-indigo-300 text-indigo-700 hover:bg-indigo-50"
              onClick={() => window.open('https://mee6.xyz/leaderboard', '_blank')}
            >
              <Gamepad2 className="h-3 w-3 mr-1" />
              Ranking
            </Button>
          </div>
        </div>

        {/* Link para upgrade Premium */}
        <div className="mt-3 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
          <div className="flex items-center space-x-2 mb-2">
            <Crown className="h-4 w-4 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-800">MEE6 Premium</span>
          </div>
          <p className="text-xs text-yellow-700 mb-2">
            Desbloqueie todos os recursos avançados com 50% de desconto!
          </p>
          <Button 
            size="sm" 
            className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white text-xs"
            onClick={() => window.open('https://mee6.xyz/premium', '_blank')}
          >
            <Sparkles className="h-3 w-3 mr-1" />
            Upgrade Premium
          </Button>
        </div>
      </OrkutCardContent>
    </OrkutCard>
  )
}
