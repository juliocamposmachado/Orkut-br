'use client'

import React, { useState, useEffect } from 'react'
import { OrkutCard, OrkutCardContent, OrkutCardHeader } from '@/components/ui/orkut-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Image from 'next/image'
import { 
  ScrollText, 
  Shield, 
  Heart, 
  Users, 
  Briefcase, 
  Sparkles, 
  ChevronDown, 
  ChevronUp,
  ExternalLink,
  Info,
  BookOpen,
  AlertTriangle,
  Eye,
  EyeOff,
  UserX,
  UserCheck,
  ShieldOff,
  AlertCircle,
  RefreshCw
} from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface CommunityAnnouncement {
  id: string
  type: 'moderation' | 'system' | 'community' | 'warning'
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  icon: string
  color: string
  created_at: string
  is_active: boolean
}

interface CommunityRulesCardProps {
  className?: string
  isCollapsible?: boolean
}

export function CommunityRulesCard({ 
  className = '', 
  isCollapsible = true 
}: CommunityRulesCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [announcements, setAnnouncements] = useState<CommunityAnnouncement[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ 
    total: 0, 
    high_priority: 0, 
    moderation_actions: 0, 
    pending_reports: 0,
    posts_count: 0,
    profiles_count: 0,
    communities_count: 0,
    notifications_count: 0,
    has_real_data: false
  })

  // Carregar avisos da comunidade
  const loadCommunityAnnouncements = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/community/announcements')
      
      if (response.ok) {
        const data = await response.json()
        console.log('Avisos da comunidade:', {
          source: data.data_source,
          total: data.announcements?.length,
          stats: data.stats
        })
        
        if (data.success && data.announcements) {
          setAnnouncements(data.announcements)
          setStats(data.stats || { 
            total: 0, 
            high_priority: 0, 
            moderation_actions: 0, 
            pending_reports: 0,
            posts_count: 0,
            profiles_count: 0,
            communities_count: 0,
            notifications_count: 0,
            has_real_data: false
          })
        }
      } else {
        console.error('Erro ao carregar avisos da comunidade')
      }
    } catch (error) {
      console.error('Erro ao buscar avisos:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCommunityAnnouncements()
    // Atualizar a cada 5 minutos
    const interval = setInterval(loadCommunityAnnouncements, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  // Função para renderizar ícone baseado na string
  const renderIcon = (iconName: string) => {
    const iconProps = { className: "h-4 w-4" }
    switch (iconName) {
      case 'Heart': return <Heart {...iconProps} />
      case 'Shield': return <Shield {...iconProps} />
      case 'Users': return <Users {...iconProps} />
      case 'AlertTriangle': return <AlertTriangle {...iconProps} />
      case 'Eye': return <Eye {...iconProps} />
      case 'EyeOff': return <EyeOff {...iconProps} />
      case 'UserX': return <UserX {...iconProps} />
      case 'UserCheck': return <UserCheck {...iconProps} />
      case 'ShieldOff': return <ShieldOff {...iconProps} />
      case 'AlertCircle': return <AlertCircle {...iconProps} />
      default: return <AlertCircle {...iconProps} />
    }
  }

  const rulesData = [
    {
      id: 1,
      title: 'Princípios Fundamentais',
      icon: <Heart className="h-4 w-4" />,
      color: 'text-purple-600',
      description: 'Comunicação fraterna, ágil e construtiva inspirada nos ensinamentos Rosacruzes'
    },
    {
      id: 2,
      title: 'Proibição Absoluta',
      icon: <Shield className="h-4 w-4" />,
      color: 'text-red-600',
      description: 'Tolerância zero com conteúdo envolvendo menores (PL 2628/2022 e ECA)'
    },
    {
      id: 3,
      title: 'Conduta nas Postagens',
      icon: <Users className="h-4 w-4" />,
      color: 'text-green-600',
      description: 'Respeito à dignidade humana, sem ódio, discriminação ou fake news'
    },
    {
      id: 4,
      title: 'Convivência Fraterna',
      icon: <Heart className="h-4 w-4" />,
      color: 'text-pink-600',
      description: 'Respeito, crítica construtiva, solidariedade e cooperação'
    },
    {
      id: 5,
      title: 'Uso Profissional',
      icon: <Briefcase className="h-4 w-4" />,
      color: 'text-blue-600',
      description: 'Foco em projetos, estudos e conexões humanas éticas'
    },
    {
      id: 6,
      title: 'Inspiração Rosacruz',
      icon: <Sparkles className="h-4 w-4" />,
      color: 'text-yellow-600',
      description: 'Fraternidade, evolução espiritual e harmonia com o próximo'
    }
  ]

  return (
    <OrkutCard className={`${className} ${!isExpanded ? 'min-h-[200px] flex flex-col justify-between' : ''}`}>
      <OrkutCardHeader>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-2">
            <ScrollText className="h-5 w-5 text-purple-600" />
            <span className="font-semibold text-gray-800">Regras da Comunidade</span>
            <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-xs flex items-center gap-1.5">
              <span>Fraternal</span>
              <Image 
                src="/logorosacruz.png" 
                alt="Logo Rosacruz" 
                width={20} 
                height={20} 
                className="w-4 h-4 xs:w-5 xs:h-5 object-contain flex-shrink-0"
              />
            </Badge>
          </div>
          
          {isCollapsible && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-purple-600 hover:bg-purple-50 p-1"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </OrkutCardHeader>
      
      <OrkutCardContent>
        {/* Resumo sempre visível */}
        <div className="space-y-3">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-3 border border-purple-100">
            <p className="text-sm text-gray-700 leading-relaxed">
              📜 <strong>Comunidade Orkut Fraternal:</strong> Um espaço de evolução humana baseado nos 
              ensinamentos Rosacruzes, promovendo comunicação fraterna, ética e construtiva.
            </p>
          </div>

          {/* Lema */}
          <div className="text-center bg-white rounded-lg p-2 border border-purple-200">
            <p className="text-sm font-medium text-purple-700">
              💜 "Amor Fraternal, Comunicação Clara e Evolução Humana"
            </p>
          </div>

          {/* Preview das regras principais */}
          {!isExpanded && (
            <div className="space-y-2">
              <div className="grid grid-cols-1 gap-2">
                {rulesData.slice(0, 3).map((rule) => (
                  <div key={rule.id} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                    <div className={`${rule.color}`}>
                      {rule.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xs font-medium text-gray-800">{rule.title}</h4>
                      <p className="text-xs text-gray-600 line-clamp-1">{rule.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(true)}
                  className="text-purple-600 hover:bg-purple-50 text-xs"
                >
                  <Info className="h-3 w-3 mr-1" />
                  Ver todas as regras
                </Button>
              </div>
            </div>
          )}

          {/* Conteúdo expandido */}
          {isExpanded && (
            <div className="space-y-4">
              {/* Avisos da Comunidade (dados reais) */}
              {announcements.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      Avisos da Comunidade
                    </h3>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={loadCommunityAnnouncements}
                      disabled={loading}
                      className="h-6 w-6 p-0 text-gray-600 hover:bg-gray-100"
                    >
                      <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                  
                  {/* Estatísticas dos avisos */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="bg-red-50 p-2 rounded text-center">
                      <div className="text-sm font-bold text-red-700">{stats.high_priority}</div>
                      <div className="text-xs text-red-600">Prioridade Alta</div>
                    </div>
                    <div className="bg-green-50 p-2 rounded text-center">
                      <div className="text-sm font-bold text-green-700">{stats.posts_count || 0}</div>
                      <div className="text-xs text-green-600">Posts Recentes</div>
                    </div>
                    <div className="bg-purple-50 p-2 rounded text-center">
                      <div className="text-sm font-bold text-purple-700">{stats.profiles_count || 0}</div>
                      <div className="text-xs text-purple-600">Membros Ativos</div>
                    </div>
                  </div>
                  
                  {/* Indicador de dados reais */}
                  {stats.has_real_data && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-2 mb-3">
                      <div className="flex items-center space-x-2">
                        <RefreshCw className="h-3 w-3 text-green-600" />
                        <span className="text-xs text-green-800 font-medium">
                          Conectado ao banco de dados - Dados em tempo real!
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    {announcements.slice(0, 4).map((announcement) => (
                      <div key={announcement.id} className="border border-gray-200 rounded-lg p-2 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start space-x-2">
                          <div className={`${announcement.color} mt-0.5`}>
                            {renderIcon(announcement.icon)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-xs font-medium text-gray-800">
                                {announcement.title}
                              </h4>
                              <Badge 
                                variant="secondary" 
                                className={`text-xs h-4 px-1 ${
                                  announcement.priority === 'high' ? 'bg-red-100 text-red-700' :
                                  announcement.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}
                              >
                                {announcement.priority === 'high' ? 'Alta' : 
                                 announcement.priority === 'medium' ? 'Média' : 'Baixa'}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-600 leading-relaxed mb-1">
                              {announcement.description}
                            </p>
                            <div className="text-xs text-gray-400">
                              {formatDistanceToNow(new Date(announcement.created_at), { 
                                addSuffix: true, 
                                locale: ptBR 
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 gap-3">
                {rulesData.map((rule) => (
                  <div key={rule.id} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start space-x-3">
                      <div className={`${rule.color} mt-0.5`}>
                        {rule.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-gray-800 mb-1">
                          {rule.id}. {rule.title}
                        </h4>
                        <p className="text-xs text-gray-600 leading-relaxed">
                          {rule.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Avisos importantes */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <Shield className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-red-800">
                    <strong>⚠️ Importante:</strong> Violações graves serão reportadas às autoridades. 
                    Sistema de monitoramento ativo para proteção de menores.
                  </div>
                </div>
              </div>

              {/* Inspiração Rosacruz */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <Sparkles className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-yellow-800">
                    <strong>✨ Código Rosacruz:</strong> Nossa comunidade se inspira nos valores de 
                    fraternidade, evolução espiritual e busca da verdade interior.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Rodapé com ações */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <BookOpen className="h-3 w-3" />
              <span>Regras atualizadas</span>
            </div>
            
            <div className="flex space-x-2">
              <Link href="https://amorc.org.br/codigo-rosacruz-de-vida/" target="_blank">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-purple-600 hover:bg-purple-50 px-2 py-1 h-auto"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Ver completa
                </Button>
              </Link>
            </div>
          </div>

          {/* Mensagem de PAZ PROFUNDA */}
          <div className="text-center text-xs text-gray-500 italic">
            🙏 PAZ PROFUNDA E ABRAÇOS FRATERNAIS
          </div>
        </div>
      </OrkutCardContent>
    </OrkutCard>
  )
}
