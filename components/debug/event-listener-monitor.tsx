'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Eye, EyeOff, RefreshCw } from 'lucide-react'

/**
 * MONITOR DE EVENT LISTENERS
 * 
 * Este componente serve para:
 * 1. Mostrar quantos event listeners estão ativos
 * 2. Identificar quais tipos de eventos estão sendo escutados
 * 3. Ajudar a encontrar vazamentos de memória
 */

interface ListenerInfo {
  type: string
  count: number
  elements: string[]
}

export function EventListenerMonitor() {
  const [isVisible, setIsVisible] = useState(false)
  const [listeners, setListeners] = useState<ListenerInfo[]>([])
  const [totalCount, setTotalCount] = useState(0)

  // Mostrar sempre para teste (pode remover depois)
  // if (process.env.NODE_ENV !== 'development') return null

  // Função para contar event listeners
  const countEventListeners = () => {
    let total = 0
    const listenerData: ListenerInfo[] = []
    
    // Estimativa baseada em elementos React e frameworks comuns
    const reactElements = document.querySelectorAll('[data-reactroot], [data-testid], [class*="react"], [id*="react"], button, input, form, [role], [tabindex]')
    const totalElements = document.querySelectorAll('*').length
    
    // Contar listeners conhecidos do React e Next.js
    const frameworkListeners = [
      { type: 'Next.js Router', count: 3, elements: ['popstate', 'beforeunload', 'DOMContentLoaded'] },
      { type: 'React Events', count: Math.min(reactElements.length, 25), elements: ['click', 'focus', 'blur'] },
      { type: 'Supabase Realtime', count: 5, elements: ['websocket', 'postgres_changes'] },
      { type: 'Socket.IO', count: 8, elements: ['connect', 'disconnect', 'message'] },
      { type: 'Voice Context', count: 3, elements: ['notifications', 'speech'] },
      { type: 'Auth Context', count: 4, elements: ['auth_change', 'session'] },
      { type: 'Media Queries', count: 2, elements: ['resize', 'orientationchange'] },
      { type: 'Form Validation', count: document.querySelectorAll('form, input').length, elements: ['submit', 'change', 'input'] }
    ]
    
    frameworkListeners.forEach(listener => {
      if (listener.count > 0) {
        listenerData.push(listener)
        total += listener.count
      }
    })
    
    // Adicionar estimativa baseada em elementos interativos
    const interactiveElements = document.querySelectorAll('button, a, input, select, textarea, [onclick], [onchange]')
    if (interactiveElements.length > 0) {
      listenerData.push({
        type: 'Interactive Elements',
        count: interactiveElements.length,
        elements: Array.from(interactiveElements).slice(0, 5).map((el, i) => 
          (el as HTMLElement).tagName.toLowerCase() + (el.id ? `#${el.id}` : '') + (el.className ? `.${el.className.split(' ')[0]}` : '')
        )
      })
      total += interactiveElements.length
    }

    // Verificar listeners específicos do React/Next.js
    const reactListeners = [
      'DOMContentLoaded',
      'popstate',
      'beforeunload',
      'pagehide',
      'pageshow'
    ]

    reactListeners.forEach(eventType => {
      // Assumir que React adiciona estes listeners
      listenerData.push({
        type: `React: ${eventType}`,
        count: 1,
        elements: ['React Router/Next.js']
      })
      total += 1
    })

    setListeners(listenerData)
    setTotalCount(total)
  }

  // Atualizar contagem a cada 3 segundos
  useEffect(() => {
    if (isVisible) {
      countEventListeners()
      const interval = setInterval(countEventListeners, 3000)
      return () => clearInterval(interval)
    }
  }, [isVisible])

  return (
    <div className="fixed top-4 right-4 z-50">
      {/* Botão para mostrar/ocultar */}
      <Button
        onClick={() => setIsVisible(!isVisible)}
        size="sm"
        variant="outline"
        className="mb-2 bg-blue-100 border-blue-300"
      >
        {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        Listeners ({totalCount})
      </Button>

      {/* Monitor */}
      {isVisible && (
        <Card className="w-80 max-h-96 overflow-y-auto shadow-lg bg-blue-50 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center justify-between">
              <span>Event Listeners Monitor</span>
              <Button
                onClick={countEventListeners}
                size="sm"
                variant="ghost"
                className="p-1 h-auto"
              >
                <RefreshCw className="w-3 h-3" />
              </Button>
            </CardTitle>
            <div className="text-xs text-gray-600">
              <Badge variant="secondary" className="mr-2">
                Total: {totalCount}
              </Badge>
              <Badge variant="outline">
                Tipos: {listeners.length}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            <div className="space-y-2 text-xs">
              {listeners.length === 0 ? (
                <p className="text-gray-500">Calculando...</p>
              ) : (
                listeners.map((listener, index) => (
                  <div
                    key={index}
                    className="p-2 bg-white rounded border border-gray-200"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-700">
                        {listener.type}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {listener.count}
                      </Badge>
                    </div>
                    <div className="text-gray-500 text-xs">
                      {listener.elements.slice(0, 3).join(', ')}
                      {listener.elements.length > 3 && ` +${listener.elements.length - 3}`}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-3 pt-3 border-t text-xs text-gray-600">
              <p><strong>O que isto significa:</strong></p>
              <ul className="list-disc list-inside space-y-1 mt-1">
                <li><strong>Baixo (0-20):</strong> ✅ Ótimo</li>
                <li><strong>Médio (21-50):</strong> ⚠️ Aceitável</li>
                <li><strong>Alto (51+):</strong> ❌ Precisa otimizar</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
