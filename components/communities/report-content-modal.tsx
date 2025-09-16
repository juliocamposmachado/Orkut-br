'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/local-auth-context'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AlertTriangle, Flag } from 'lucide-react'

interface ReportContentModalProps {
  communityId: number
  targetType: 'post' | 'comment' | 'member' | 'community'
  targetId?: number
  targetUserId?: string
  triggerButton?: React.ReactNode
}

const reportCategories = [
  { value: 'spam', label: 'Spam', description: 'Conteúdo promocional não solicitado ou repetitivo' },
  { value: 'harassment', label: 'Assédio', description: 'Comportamento intimidador ou abusivo' },
  { value: 'hate_speech', label: 'Discurso de Ódio', description: 'Conteúdo que promove discriminação ou violência' },
  { value: 'violence', label: 'Violência', description: 'Ameaças ou conteúdo violento' },
  { value: 'nudity', label: 'Nudez', description: 'Conteúdo sexual ou nudez não apropriada' },
  { value: 'misinformation', label: 'Desinformação', description: 'Informações falsas ou enganosas' },
  { value: 'off_topic', label: 'Fora do Tópico', description: 'Conteúdo que não se relaciona com a comunidade' },
  { value: 'other', label: 'Outro', description: 'Outro tipo de problema não listado' }
]

export function ReportContentModal({ 
  communityId, 
  targetType, 
  targetId, 
  targetUserId, 
  triggerButton 
}: ReportContentModalProps) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!category) {
      toast.error('Por favor, selecione uma categoria para o relatório')
      return
    }

    if (!user) {
      toast.error('Você precisa estar logado para reportar conteúdo')
      return
    }

    setLoading(true)
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        toast.error('Sessão inválida. Faça login novamente.')
        return
      }

      // Criar relatório
      const { data, error } = await supabase
        .from('community_reports')
        .insert({
          community_id: communityId,
          reported_by: user.id,
          target_type: targetType,
          target_id: targetId,
          target_user_id: targetUserId,
          category,
          description: description.trim() || null,
          status: 'pending'
        })
        .select()
        .single()

      if (error) {
        console.error('Erro ao criar relatório:', error)
        toast.error('Erro ao enviar relatório. Tente novamente.')
        return
      }

      toast.success('📋 Relatório enviado com sucesso! Nossa equipe de moderação irá analisar.')
      
      // Reset form
      setCategory('')
      setDescription('')
      setOpen(false)
      
    } catch (error) {
      console.error('Error reporting content:', error)
      toast.error('Erro ao enviar relatório. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const defaultTrigger = (
    <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50">
      <Flag className="h-4 w-4 mr-1" />
      Reportar
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton || defaultTrigger}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <span>Reportar Conteúdo</span>
          </DialogTitle>
          <DialogDescription>
            Ajude-nos a manter a comunidade segura reportando conteúdo inadequado.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Categoria do Relatório */}
          <div>
            <Label className="text-sm font-medium text-gray-700">
              Por que você está reportando este conteúdo? *
            </Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {reportCategories.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>
                    <div>
                      <p className="font-medium">{cat.label}</p>
                      <p className="text-xs text-gray-500">{cat.description}</p>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Descrição Adicional */}
          <div>
            <Label htmlFor="description" className="text-sm font-medium text-gray-700">
              Descrição Adicional (opcional)
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Forneça mais detalhes sobre o problema..."
              className="mt-1 min-h-[80px]"
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">
              {description.length}/500 caracteres
            </p>
          </div>

          {/* Informação sobre o Processo */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Como funciona:</p>
                <ul className="text-xs space-y-1 text-blue-700">
                  <li>• Seu relatório será analisado pelos moderadores</li>
                  <li>• Você receberá uma notificação quando for processado</li>
                  <li>• Relatórios falsos podem resultar em penalidades</li>
                  <li>• Todos os relatórios são mantidos em sigilo</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || !category}
              className="bg-red-500 hover:bg-red-600"
            >
              {loading ? 'Enviando...' : 'Enviar Relatório'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
