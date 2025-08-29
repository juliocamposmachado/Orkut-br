'use client'

import { useState, useEffect } from 'react'
import { OrkutCard, OrkutCardContent, OrkutCardHeader } from '@/components/ui/orkut-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  TrendingUp, 
  ExternalLink, 
  RefreshCw,
  Clock,
  Search,
  Loader2
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface TrendingTopic {
  title: string
  traffic: string
  description?: string
  url?: string
  image?: string
  publishedAt?: string
}

interface GoogleTrendsResponse {
  success: boolean
  trends: TrendingTopic[]
  updatedAt: string
  error?: string
}

export default function GoogleTrends() {
  const [trends, setTrends] = useState<TrendingTopic[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  const fetchTrends = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/google-trends', {
        cache: 'no-store'
      })
      
      const data: GoogleTrendsResponse = await response.json()
      
      if (data.trends && data.trends.length > 0) {
        setTrends(data.trends.slice(0, 5)) // Mostrar apenas 5 trends
        setLastUpdated(data.updatedAt)
        
        if (!data.success && data.error) {
          setError(data.error)
        }
      }
    } catch (err) {
      console.error('Erro ao buscar trends:', err)
      setError('Erro ao carregar tendências')
      
      // Fallback com dados mockados
      setTrends([
        {
          title: 'Novela Dona de Mim',
          traffic: '100 mil+ pesquisas',
          description: 'Resumo e novidades do capítulo...',
          publishedAt: new Date().toISOString()
        },
        {
          title: 'Lollapalooza 2025',
          traffic: '50 mil+ pesquisas',
          description: 'Festival de música com grandes shows...',
          publishedAt: new Date().toISOString()
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTrends()
    
    // Atualizar a cada 15 minutos
    const interval = setInterval(fetchTrends, 15 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [])

  const handleTopicClick = (topic: TrendingTopic) => {
    if (topic.url) {
      window.open(topic.url, '_blank', 'noopener,noreferrer')
    } else {
      // Buscar no Google se não tiver URL específica
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(topic.title)}`
      window.open(searchUrl, '_blank', 'noopener,noreferrer')
    }
  }

  const getTrafficBadgeVariant = (traffic: string) => {
    if (traffic.includes('100') || traffic.includes('200') || traffic.includes('mil+')) {
      return 'default'
    }
    return 'secondary'
  }

  return (
    <OrkutCard>
      <OrkutCardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-red-500" />
            <span className="font-semibold">Assuntos em Alta</span>
            <Badge variant="outline" className="text-xs">
              Brasil
            </Badge>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={fetchTrends}
            disabled={loading}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        
        {lastUpdated && (
          <div className="flex items-center space-x-1 text-xs text-gray-500 mt-1">
            <Clock className="h-3 w-3" />
            <span>
              Atualizado {formatDistanceToNow(new Date(lastUpdated), { 
                addSuffix: true, 
                locale: ptBR 
              })}
            </span>
          </div>
        )}
        
        {error && (
          <div className="text-xs text-yellow-600 mt-1">
            ℹ️ {error}
          </div>
        )}
      </OrkutCardHeader>
      
      <OrkutCardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            <span className="text-sm text-gray-600">Carregando tendências...</span>
          </div>
        ) : trends.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhuma tendência encontrada</p>
          </div>
        ) : (
          <div className="space-y-3">
            {trends.map((trend, index) => (
              <div 
                key={index}
                onClick={() => handleTopicClick(trend)}
                className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors group"
              >
                <div className="flex-shrink-0 mt-0.5">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-r from-red-500 to-pink-500 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">
                      {index + 1}
                    </span>
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-1">
                    <h4 className="font-medium text-gray-900 group-hover:text-red-600 transition-colors line-clamp-2">
                      {trend.title}
                    </h4>
                    <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-red-500 transition-colors ml-2 flex-shrink-0" />
                  </div>
                  
                  <div className="flex items-center space-x-2 mb-2">
                    <Badge 
                      variant={getTrafficBadgeVariant(trend.traffic)}
                      className="text-xs"
                    >
                      {trend.traffic}
                    </Badge>
                    
                    {trend.publishedAt && (
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(trend.publishedAt), { 
                          addSuffix: true, 
                          locale: ptBR 
                        })}
                      </span>
                    )}
                  </div>
                  
                  {trend.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {trend.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-4 pt-3 border-t text-center">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => window.open('https://trends.google.com.br', '_blank')}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            Ver mais tendências no Google Trends
            <ExternalLink className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </OrkutCardContent>
    </OrkutCard>
  )
}
