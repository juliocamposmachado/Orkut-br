'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertTriangle, CheckCircle, Clock, RefreshCw, Bug, Server, Activity } from 'lucide-react'

interface BugNotification {
  id: string
  type: 'bug_alert' | 'deploy_status' | 'maintenance' | 'performance_warning'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  message: string
  details?: string
  timestamp: string
  status: 'active' | 'resolved' | 'investigating'
  affected_systems: string[]
  estimated_fix_time?: string
  actions_taken?: string[]
}

interface SystemStatus {
  overall_status: 'operational' | 'degraded' | 'partial_outage' | 'major_outage'
  services: {
    [key: string]: {
      status: 'operational' | 'degraded' | 'outage'
      last_incident?: string
    }
  }
  active_notifications: BugNotification[]
  last_updated: string
}

interface DeployCheckResult {
  status: 'healthy' | 'warning' | 'error'
  bugs: Array<{
    severity: 'low' | 'medium' | 'high' | 'critical'
    category: string
    description: string
    recommendation: string
    timestamp: string
  }>
  performance_score: number
  uptime: string
  last_check: string
  suggestions: string[]
}

const SystemStatusDashboard: React.FC = () => {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null)
  const [deployStatus, setDeployStatus] = useState<DeployCheckResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  // Função para buscar status do sistema
  const fetchSystemStatus = async () => {
    try {
      const response = await fetch('/api/bug-notifications')
      if (response.ok) {
        const data = await response.json()
        setSystemStatus(data.system_status)
      }
    } catch (error) {
      console.error('Erro ao buscar status do sistema:', error)
    }
  }

  // Função para buscar status de deploy
  const fetchDeployStatus = async () => {
    try {
      const response = await fetch('/api/bug-monitor')
      if (response.ok) {
        const data = await response.json()
        setDeployStatus(data)
      }
    } catch (error) {
      console.error('Erro ao buscar status de deploy:', error)
    }
  }

  // Função para executar verificação manual
  const runManualCheck = async () => {
    setIsLoading(true)
    try {
      // Executar verificação de bugs
      const bugResponse = await fetch('/api/bug-monitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force_check: true })
      })

      if (bugResponse.ok) {
        const bugData = await bugResponse.json()
        setDeployStatus(bugData)

        // Se encontrou bugs, criar notificação
        if (bugData.bugs && bugData.bugs.length > 0) {
          const highestSeverityBug = bugData.bugs.reduce((prev: any, current: any) => {
            const severityOrder: { [key: string]: number } = { low: 1, medium: 2, high: 3, critical: 4 }
            return (severityOrder[current.severity] || 0) > (severityOrder[prev.severity] || 0) ? current : prev
          })

          await fetch('/api/bug-notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              bug_report: highestSeverityBug,
              auto_post_to_feed: true
            })
          })
        }
      }

      await fetchSystemStatus()
      setLastRefresh(new Date())
    } catch (error) {
      console.error('Erro na verificação manual:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Carregar dados iniciais
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchSystemStatus(), fetchDeployStatus()])
      setLastRefresh(new Date())
      setIsLoading(false)
    }

    loadData()

    // Atualizar a cada 2 minutos
    const interval = setInterval(loadData, 120000)
    return () => clearInterval(interval)
  }, [])

  // Função para obter cor do status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
      case 'healthy':
        return 'text-green-600'
      case 'degraded':
      case 'warning':
        return 'text-yellow-600'
      case 'partial_outage':
      case 'error':
        return 'text-orange-600'
      case 'major_outage':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  // Função para obter badge de severidade
  const getSeverityBadge = (severity: string) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    }
    
    return (
      <Badge className={colors[severity as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {severity.toUpperCase()}
      </Badge>
    )
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading && !systemStatus) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="animate-spin h-8 w-8 text-purple-600" />
        <span className="ml-2">Carregando status do sistema...</span>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sistema Orkut - Monitoramento</h1>
          <p className="text-gray-600 mt-1">
            Dashboard de bugs e status de deployment • IA integrada com Gemini
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-500">
            {lastRefresh && `Última atualização: ${formatTimestamp(lastRefresh.toISOString())}`}
          </span>
          <Button 
            onClick={runManualCheck}
            disabled={isLoading}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isLoading ? (
              <RefreshCw className="animate-spin h-4 w-4 mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Verificar Agora
          </Button>
        </div>
      </div>

      {/* Status Geral */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status Geral</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getStatusColor(systemStatus?.overall_status || 'operational')}`}>
              {systemStatus?.overall_status === 'operational' ? '✅ Operacional' :
               systemStatus?.overall_status === 'degraded' ? '⚠️ Degradado' :
               systemStatus?.overall_status === 'partial_outage' ? '🔴 Parcial' :
               systemStatus?.overall_status === 'major_outage' ? '🚨 Crítico' : '🔍 Verificando'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {deployStatus?.performance_score || 0}/100
            </div>
            <p className="text-xs text-muted-foreground">
              {deployStatus?.uptime || 'Verificando...'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bugs Ativos</CardTitle>
            <Bug className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {systemStatus?.active_notifications?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {deployStatus?.bugs?.length || 0} detectados na última verificação
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Status dos Serviços */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            Status dos Serviços
          </CardTitle>
          <CardDescription>
            Monitoramento em tempo real dos principais sistemas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {systemStatus?.services && Object.entries(systemStatus.services).map(([service, info]) => (
              <div key={service} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium capitalize">{service.replace('_', ' ')}</p>
                  {info.last_incident && (
                    <p className="text-xs text-gray-500">
                      Último incidente: {formatTimestamp(info.last_incident)}
                    </p>
                  )}
                </div>
                <div className={`flex items-center ${getStatusColor(info.status)}`}>
                  {info.status === 'operational' ? '✅' :
                   info.status === 'degraded' ? '⚠️' : '🔴'}
                  <span className="ml-1 text-sm capitalize">{info.status}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bugs Recentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Bugs e Alertas Recentes
          </CardTitle>
          <CardDescription>
            Problemas detectados pela IA e status de resolução
          </CardDescription>
        </CardHeader>
        <CardContent>
          {deployStatus?.bugs && deployStatus.bugs.length > 0 ? (
            <div className="space-y-4">
              {deployStatus.bugs.slice(0, 5).map((bug, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        {getSeverityBadge(bug.severity)}
                        <Badge variant="outline">{bug.category}</Badge>
                        <span className="text-xs text-gray-500">
                          {formatTimestamp(bug.timestamp)}
                        </span>
                      </div>
                      <p className="font-medium text-gray-900 mb-1">{bug.description}</p>
                      <p className="text-sm text-gray-600">{bug.recommendation}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-2" />
              <p className="text-gray-600">Nenhum bug detectado no momento!</p>
              <p className="text-sm text-gray-500 mt-1">Sistema funcionando normalmente</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sugestões do Sistema */}
      {deployStatus?.suggestions && deployStatus.suggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Sugestões de Melhoria
            </CardTitle>
            <CardDescription>
              Recomendações geradas pela IA para otimização
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {deployStatus.suggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-purple-600 mr-2">•</span>
                  <span className="text-sm">{suggestion}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Notificações Ativas */}
      {systemStatus?.active_notifications && systemStatus.active_notifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Notificações Ativas no Feed
            </CardTitle>
            <CardDescription>
              Alertas postados automaticamente no feed do Orkut
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {systemStatus.active_notifications.slice(0, 3).map((notification) => (
                <div key={notification.id} className="border-l-4 border-purple-500 pl-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{notification.title}</h4>
                    {getSeverityBadge(notification.severity)}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                  <div className="flex items-center text-xs text-gray-500">
                    <span>{formatTimestamp(notification.timestamp)}</span>
                    {notification.estimated_fix_time && (
                      <>
                        <span className="mx-2">•</span>
                        <span>ETA: {notification.estimated_fix_time}</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default SystemStatusDashboard
