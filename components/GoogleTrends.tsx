'use client'

import { useState, useEffect, useRef } from 'react'
import { OrkutCard, OrkutCardContent, OrkutCardHeader } from '@/components/ui/orkut-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  TrendingUp, 
  ExternalLink, 
  RefreshCw,
  Loader2
} from 'lucide-react'

// Declaração global para o Google Trends
declare global {
  interface Window {
    trends: {
      embed: {
        renderExploreWidget: (type: string, config: any, options: any) => void
      }
    }
  }
}

export default function GoogleTrends() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const widgetRef = useRef<HTMLDivElement>(null)

  const loadGoogleTrendsScript = () => {
    return new Promise<void>((resolve, reject) => {
      // Verificar se o script já foi carregado
      if (window.trends) {
        resolve()
        return
      }

      // Verificar se já existe um script carregando
      if (document.querySelector('script[src*="trends_nrtr"]')) {
        // Aguardar o script carregar
        const checkTrends = setInterval(() => {
          if (window.trends) {
            clearInterval(checkTrends)
            resolve()
          }
        }, 100)
        return
      }

      const script = document.createElement('script')
      script.type = 'text/javascript'
      script.src = 'https://ssl.gstatic.com/trends_nrtr/4116_RC01/embed_loader.js'
      script.onload = () => {
        // Aguardar o trends object estar disponível
        const checkTrends = setInterval(() => {
          if (window.trends) {
            clearInterval(checkTrends)
            resolve()
          }
        }, 100)
      }
      script.onerror = () => reject(new Error('Erro ao carregar Google Trends'))
      document.head.appendChild(script)
    })
  }

  const renderTrendsWidget = async () => {
    if (!widgetRef.current) return

    try {
      setLoading(true)
      setError(null)
      
      // Criar um ID único para este widget
      const widgetId = `trends-widget-${Date.now()}`
      
      // Limpar o container e adicionar um div com ID único
      widgetRef.current.innerHTML = `<div id="${widgetId}"></div>`
      
      // Carregar o script do Google Trends
      await loadGoogleTrendsScript()
      
      // Aguardar o DOM atualizar
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Renderizar o widget
      window.trends.embed.renderExploreWidget(
        "RELATED_QUERIES", 
        {
          "comparisonItem": [
            {
              "keyword": "/m/0290kv", // Orkut
              "geo": "BR", 
              "time": "today 12-m"
            }
          ],
          "category": 0,
          "property": ""
        }, 
        {
          "exploreQuery": "geo=BR&q=%2Fm%2F0290kv&hl=pt-BR&date=today 12-m",
          "guestPath": "https://trends.google.com.br:443/trends/embed/"
        }
      )
      
      // Aguardar um pouco para o widget carregar
      setTimeout(() => setLoading(false), 1000)
    } catch (err) {
      console.error('Erro ao carregar Google Trends:', err)
      setError('Erro ao carregar widget do Google Trends')
      setLoading(false)
    }
  }

  useEffect(() => {
    renderTrendsWidget()
  }, [])

  return (
    <OrkutCard>
      <OrkutCardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-red-500" />
            <span className="font-semibold">Assuntos em Alta</span>
            <Badge variant="outline" className="text-xs">
              Orkut - Brasil
            </Badge>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={renderTrendsWidget}
            disabled={loading}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        
        {error && (
          <div className="text-xs text-yellow-600 mt-1">
            ⚠️ {error}
          </div>
        )}
      </OrkutCardHeader>
      
      <OrkutCardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            <span className="text-sm text-gray-600">Carregando Google Trends...</span>
          </div>
        ) : (
          <>
            {/* Container para o widget do Google Trends */}
            <div 
              ref={widgetRef}
              className="w-full min-h-[400px] bg-white rounded-lg"
              style={{
                maxWidth: '100%',
                overflow: 'hidden'
              }}
            />
            
            <div className="mt-4 pt-3 border-t text-center">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => window.open('https://trends.google.com.br/trends/explore?geo=BR&q=%2Fm%2F0290kv', '_blank')}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Ver mais sobre Orkut no Google Trends
                <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </>
        )}
      </OrkutCardContent>
    </OrkutCard>
  )
}
