'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { OrkutCard, OrkutCardContent, OrkutCardHeader } from '@/components/ui/orkut-card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { 
  Bug, 
  MoreVertical, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  User,
  Calendar,
  ExternalLink,
  Loader2,
  RefreshCw,
  Filter,
  Eye,
  Play,
  CheckCheck,
  X
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'

interface BugReport {
  id: number
  title: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  category: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  url?: string
  browser_info?: string
  created_at: string
  resolved_at?: string
  reporter: {
    display_name: string
    username: string
    photo_url: string
  }
  assignee?: {
    display_name: string
    username: string
  }
}

export function BugReportsManagement() {
  const [reports, setReports] = useState<BugReport[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [severityFilter, setSeverityFilter] = useState('all')
  const [stats, setStats] = useState({
    total: 0,
    byStatus: {} as Record<string, number>,
    bySeverity: {} as Record<string, number>
  })
  
  // Modal states
  const [selectedReport, setSelectedReport] = useState<BugReport | null>(null)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [updateModalOpen, setUpdateModalOpen] = useState(false)
  const [updateData, setUpdateData] = useState({
    status: '',
    resolution_notes: ''
  })
  const [updating, setUpdating] = useState(false)

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        toast.error('Sessão expirada')
        return
      }

      const params = new URLSearchParams({
        status: statusFilter,
        limit: '50'
      })

      const response = await fetch(`/api/bug-reports?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao carregar bug reports')
      }

      const data = await response.json()
      setReports(data.reports)
      setStats(data.statistics)

    } catch (error) {
      console.error('Erro ao buscar bug reports:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao carregar bug reports')
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  const handleUpdateReport = async () => {
    if (!selectedReport || !updateData.status) {
      toast.error('Status é obrigatório')
      return
    }

    setUpdating(true)
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        toast.error('Sessão expirada')
        return
      }

      const response = await fetch('/api/bug-reports', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: selectedReport.id,
          status: updateData.status,
          resolution_notes: updateData.resolution_notes
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        toast.success('Bug report atualizado com sucesso')
        setUpdateModalOpen(false)
        setUpdateData({ status: '', resolution_notes: '' })
        fetchReports()
      } else {
        toast.error(data.error || 'Erro ao atualizar bug report')
      }
    } catch (error) {
      console.error('Erro ao atualizar bug report:', error)
      toast.error('Erro interno. Tente novamente.')
    } finally {
      setUpdating(false)
    }
  }

  const getSeverityBadge = (severity: string) => {
    const variants = {
      low: { variant: 'secondary' as const, icon: '🟢', text: 'Baixa' },
      medium: { variant: 'default' as const, icon: '🟡', text: 'Média' },
      high: { variant: 'destructive' as const, icon: '🟠', text: 'Alta' },
      critical: { variant: 'destructive' as const, icon: '🔴', text: 'Crítica' }
    }
    
    const config = variants[severity as keyof typeof variants] || variants.medium
    
    return (
      <Badge variant={config.variant} className="text-xs">
        {config.icon} {config.text}
      </Badge>
    )
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      open: { variant: 'destructive' as const, icon: AlertTriangle, text: 'Aberto' },
      in_progress: { variant: 'default' as const, icon: Clock, text: 'Em Progresso' },
      resolved: { variant: 'secondary' as const, icon: CheckCircle, text: 'Resolvido' },
      closed: { variant: 'outline' as const, icon: X, text: 'Fechado' }
    }
    
    const config = variants[status as keyof typeof variants] || variants.open
    const IconComponent = config.icon
    
    return (
      <Badge variant={config.variant} className="text-xs">
        <IconComponent className="w-3 h-3 mr-1" />
        {config.text}
      </Badge>
    )
  }

  const openDetailsModal = (report: BugReport) => {
    setSelectedReport(report)
    setDetailsModalOpen(true)
  }

  const openUpdateModal = (report: BugReport) => {
    setSelectedReport(report)
    setUpdateData({
      status: report.status,
      resolution_notes: ''
    })
    setUpdateModalOpen(true)
  }

  const filteredReports = reports.filter(report => {
    if (severityFilter !== 'all' && report.severity !== severityFilter) {
      return false
    }
    return true
  })

  return (
    <div className="space-y-6">
      {/* Header com estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <OrkutCard>
          <OrkutCardContent className="p-4 text-center">
            <Bug className="w-6 h-6 text-red-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-sm text-gray-600">Total</p>
          </OrkutCardContent>
        </OrkutCard>
        
        <OrkutCard>
          <OrkutCardContent className="p-4 text-center">
            <AlertTriangle className="w-6 h-6 text-red-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.byStatus.open || 0}</p>
            <p className="text-sm text-gray-600">Abertos</p>
          </OrkutCardContent>
        </OrkutCard>
        
        <OrkutCard>
          <OrkutCardContent className="p-4 text-center">
            <Clock className="w-6 h-6 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.byStatus.in_progress || 0}</p>
            <p className="text-sm text-gray-600">Em Progresso</p>
          </OrkutCardContent>
        </OrkutCard>
        
        <OrkutCard>
          <OrkutCardContent className="p-4 text-center">
            <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.byStatus.resolved || 0}</p>
            <p className="text-sm text-gray-600">Resolvidos</p>
          </OrkutCardContent>
        </OrkutCard>
      </div>

      {/* Filtros */}
      <OrkutCard>
        <OrkutCardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium">Filtros:</span>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="open">Abertos</SelectItem>
                <SelectItem value="in_progress">Em Progresso</SelectItem>
                <SelectItem value="resolved">Resolvidos</SelectItem>
                <SelectItem value="closed">Fechados</SelectItem>
              </SelectContent>
            </Select>

            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Gravidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as gravidades</SelectItem>
                <SelectItem value="critical">🔴 Crítica</SelectItem>
                <SelectItem value="high">🟠 Alta</SelectItem>
                <SelectItem value="medium">🟡 Média</SelectItem>
                <SelectItem value="low">🟢 Baixa</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              onClick={fetchReports}
              variant="outline"
              size="sm"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </OrkutCardContent>
      </OrkutCard>

      {/* Lista de bug reports */}
      <OrkutCard>
        <OrkutCardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bug className="w-5 h-5 text-red-500" />
              <span className="font-semibold">Bug Reports</span>
            </div>
            <span className="text-sm text-gray-500">
              {loading ? 'Carregando...' : `${filteredReports.length} reports`}
            </span>
          </div>
        </OrkutCardHeader>
        
        <OrkutCardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span>Carregando bug reports...</span>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="text-center py-8">
              <Bug className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum bug report encontrado
              </h3>
              <p className="text-gray-600">
                Não há bug reports que correspondam aos filtros selecionados.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredReports.map((report) => (
                <div 
                  key={report.id} 
                  className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start space-x-3 flex-1">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={report.reporter.photo_url} alt={report.reporter.display_name} />
                      <AvatarFallback>
                        {report.reporter.display_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900 truncate pr-2">
                          {report.title}
                        </h4>
                        <div className="flex items-center space-x-2">
                          {getSeverityBadge(report.severity)}
                          {getStatusBadge(report.status)}
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {report.description}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <User className="w-3 h-3" />
                          <span>{report.reporter.display_name}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {formatDistanceToNow(new Date(report.created_at), { 
                              addSuffix: true, 
                              locale: ptBR 
                            })}
                          </span>
                        </div>
                        {report.url && (
                          <div className="flex items-center space-x-1">
                            <ExternalLink className="w-3 h-3" />
                            <span className="truncate max-w-32">
                              {report.url.replace(/^https?:\/\/[^\/]+/, '')}
                            </span>
                          </div>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {report.category}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openDetailsModal(report)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openUpdateModal(report)}>
                          <Play className="w-4 h-4 mr-2" />
                          Atualizar Status
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {report.status !== 'resolved' && (
                          <DropdownMenuItem 
                            onClick={() => {
                              setSelectedReport(report)
                              setUpdateData({
                                status: 'resolved',
                                resolution_notes: 'Problema resolvido'
                              })
                              handleUpdateReport()
                            }}
                          >
                            <CheckCheck className="w-4 h-4 mr-2" />
                            Marcar como Resolvido
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </OrkutCardContent>
      </OrkutCard>

      {/* Modal de detalhes */}
      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bug className="h-5 w-5 text-red-600" />
              Detalhes do Bug Report #{selectedReport?.id}
            </DialogTitle>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-6">
              {/* Header com badges */}
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">{selectedReport.title}</h3>
                  <div className="flex items-center space-x-2">
                    {getSeverityBadge(selectedReport.severity)}
                    {getStatusBadge(selectedReport.status)}
                    <Badge variant="outline">{selectedReport.category}</Badge>
                  </div>
                </div>
                <div className="text-right text-sm text-gray-500">
                  <p>Reportado por {selectedReport.reporter.display_name}</p>
                  <p>{formatDistanceToNow(new Date(selectedReport.created_at), { addSuffix: true, locale: ptBR })}</p>
                </div>
              </div>

              {/* Descrição */}
              <div>
                <h4 className="font-medium mb-2">Descrição</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="whitespace-pre-wrap text-sm">{selectedReport.description}</pre>
                </div>
              </div>

              {/* Informações técnicas */}
              {selectedReport.browser_info && (
                <div>
                  <h4 className="font-medium mb-2">Informações Técnicas</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                      {JSON.stringify(JSON.parse(selectedReport.browser_info), null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* URL */}
              {selectedReport.url && (
                <div>
                  <h4 className="font-medium mb-2">URL</h4>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <a 
                      href={selectedReport.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                    >
                      {selectedReport.url}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de atualização */}
      <Dialog open={updateModalOpen} onOpenChange={setUpdateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atualizar Bug Report</DialogTitle>
            <DialogDescription>
              Atualize o status e adicione notas de resolução.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <Select 
                value={updateData.status} 
                onValueChange={(value) => setUpdateData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Aberto</SelectItem>
                  <SelectItem value="in_progress">Em Progresso</SelectItem>
                  <SelectItem value="resolved">Resolvido</SelectItem>
                  <SelectItem value="closed">Fechado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Notas de Resolução</label>
              <Textarea
                placeholder="Descreva a solução aplicada ou motivo da mudança de status..."
                value={updateData.resolution_notes}
                onChange={(e) => setUpdateData(prev => ({ ...prev, resolution_notes: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <Button
                onClick={handleUpdateReport}
                disabled={updating || !updateData.status}
                className="flex-1"
              >
                {updating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Atualizando...
                  </>
                ) : (
                  'Atualizar'
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setUpdateModalOpen(false)}
                disabled={updating}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
