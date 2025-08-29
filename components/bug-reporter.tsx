'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Bug, Send, AlertTriangle, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface BugReporterProps {
  className?: string
  variant?: 'icon' | 'button' | 'floating'
  size?: 'sm' | 'md' | 'lg'
  context?: {
    url?: string
    component?: string
    action?: string
  }
}

export default function BugReporter({ 
  className = '', 
  variant = 'icon',
  size = 'md',
  context
}: BugReporterProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    severity: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    category: 'general',
    stepsToReproduce: ''
  })

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error('Por favor, preencha título e descrição')
      return
    }

    setLoading(true)
    
    try {
      // Obter token de autenticação
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        toast.error('Você precisa estar logado para reportar bugs')
        return
      }

      // Coletar informações do browser/sistema
      const browserInfo = {
        userAgent: navigator.userAgent,
        screenResolution: `${screen.width}x${screen.height}`,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        language: navigator.language,
        platform: navigator.platform,
        cookiesEnabled: navigator.cookieEnabled,
        url: context?.url || window.location.href,
        timestamp: new Date().toISOString()
      }

      // Construir descrição completa
      let fullDescription = formData.description
      
      if (formData.stepsToReproduce) {
        fullDescription += '\n\n**Passos para reproduzir:**\n' + formData.stepsToReproduce
      }
      
      if (context?.component || context?.action) {
        fullDescription += '\n\n**Contexto:**'
        if (context.component) fullDescription += `\n- Componente: ${context.component}`
        if (context.action) fullDescription += `\n- Ação: ${context.action}`
      }

      const response = await fetch('/api/bug-reports', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: fullDescription,
          severity: formData.severity,
          category: formData.category,
          url: browserInfo.url,
          browserInfo: JSON.stringify(browserInfo),
          screenResolution: browserInfo.screenResolution,
          userAgent: browserInfo.userAgent
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        toast.success('🐛 Bug reportado com sucesso! Nossa equipe foi notificada.')
        setOpen(false)
        resetForm()
      } else {
        toast.error(data.error || 'Erro ao reportar bug')
      }
    } catch (error) {
      console.error('Erro ao reportar bug:', error)
      toast.error('Erro interno. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      severity: 'medium',
      category: 'general',
      stepsToReproduce: ''
    })
  }

  const getButtonClass = () => {
    const baseClass = 'flex items-center gap-1 transition-colors'
    
    switch (variant) {
      case 'icon':
        return `${baseClass} p-2 rounded-full hover:bg-red-50 text-red-600 hover:text-red-700`
      case 'button':
        return `${baseClass} bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1.5 rounded-lg`
      case 'floating':
        return `${baseClass} fixed bottom-4 right-4 z-50 bg-red-600 hover:bg-red-700 text-white p-3 rounded-full shadow-lg`
      default:
        return baseClass
    }
  }

  const getButtonSize = () => {
    switch (size) {
      case 'sm': return 'h-4 w-4'
      case 'lg': return 'h-6 w-6'
      default: return 'h-5 w-5'
    }
  }

  const TriggerComponent = () => (
    <Button 
      variant="ghost"
      size="sm"
      className={`${getButtonClass()} ${className}`}
      title="Reportar Bug"
    >
      <Bug className={getButtonSize()} />
      {variant === 'button' && <span className="text-sm">Reportar Bug</span>}
      {variant === 'floating' && <span className="sr-only">Reportar Bug</span>}
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <TriggerComponent />
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5 text-red-600" />
            Reportar Bug
          </DialogTitle>
          <DialogDescription>
            Encontrou um problema? Nos ajude a melhorar reportando o bug. 
            Todas as informações serão enviadas para nossa equipe de desenvolvimento.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Título do Bug *
            </label>
            <Input
              placeholder="Ex: Botão de curtir não funciona"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>

          {/* Gravidade e Categoria */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gravidade
              </label>
              <Select 
                value={formData.severity} 
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, severity: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">🟢 Baixa</SelectItem>
                  <SelectItem value="medium">🟡 Média</SelectItem>
                  <SelectItem value="high">🟠 Alta</SelectItem>
                  <SelectItem value="critical">🔴 Crítica</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoria
              </label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">Geral</SelectItem>
                  <SelectItem value="ui">Interface</SelectItem>
                  <SelectItem value="performance">Performance</SelectItem>
                  <SelectItem value="functionality">Funcionalidade</SelectItem>
                  <SelectItem value="login">Login/Auth</SelectItem>
                  <SelectItem value="mobile">Mobile</SelectItem>
                  <SelectItem value="api">API</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrição do Problema *
            </label>
            <Textarea
              placeholder="Descreva o que aconteceu, o que você esperava que acontecesse e qualquer informação adicional que possa ser útil..."
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          {/* Passos para reproduzir */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Passos para Reproduzir (opcional)
            </label>
            <Textarea
              placeholder="1. Faça isso...&#10;2. Depois faça aquilo...&#10;3. O erro acontece..."
              rows={3}
              value={formData.stepsToReproduce}
              onChange={(e) => setFormData(prev => ({ ...prev, stepsToReproduce: e.target.value }))}
            />
          </div>

          {/* Info adicional */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Informações coletadas automaticamente:</p>
                <ul className="text-xs space-y-1">
                  <li>• URL atual: {context?.url || window.location.pathname}</li>
                  <li>• Navegador e versão</li>
                  <li>• Resolução da tela</li>
                  <li>• Data e hora do report</li>
                  {context?.component && <li>• Componente: {context.component}</li>}
                  {context?.action && <li>• Ação: {context.action}</li>}
                </ul>
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className="flex space-x-3 pt-4">
            <Button
              onClick={handleSubmit}
              disabled={loading || !formData.title.trim() || !formData.description.trim()}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar Bug Report
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => {
                setOpen(false)
                resetForm()
              }}
              disabled={loading}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
