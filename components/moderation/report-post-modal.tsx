'use client'

import { useState } from 'react'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { AlertTriangle, Shield, Flag, X } from 'lucide-react'
import { toast } from 'sonner'

interface ReportPostModalProps {
  isOpen: boolean
  onClose: () => void
  postId: number
  postAuthor: string
  onReportSuccess?: () => void
}

const REPORT_CATEGORIES = [
  {
    id: 'inappropriate',
    label: 'Conteúdo Inapropriado',
    description: 'Conteúdo ofensivo, vulgar ou inadequado',
    icon: '🚫'
  },
  {
    id: 'spam',
    label: 'Spam ou Publicidade',
    description: 'Promoções não solicitadas, links suspeitos',
    icon: '📢'
  },
  {
    id: 'harassment',
    label: 'Assédio ou Bullying',
    description: 'Ataques pessoais, intimidação, discriminação',
    icon: '🛡️'
  },
  {
    id: 'fake',
    label: 'Informação Falsa',
    description: 'Notícias falsas, desinformação',
    icon: '❌'
  },
  {
    id: 'violence',
    label: 'Violência ou Ameaças',
    description: 'Incitação à violência, ameaças',
    icon: '⚠️'
  },
  {
    id: 'copyright',
    label: 'Violação de Direitos Autorais',
    description: 'Conteúdo protegido por direitos autorais',
    icon: '©️'
  },
  {
    id: 'other',
    label: 'Outros Motivos',
    description: 'Descreva o motivo nos detalhes',
    icon: '❓'
  }
]

export function ReportPostModal({
  isOpen,
  onClose,
  postId,
  postAuthor,
  onReportSuccess
}: ReportPostModalProps) {
  const [selectedCategory, setSelectedCategory] = useState('')
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!selectedCategory) {
      toast.error('Por favor, selecione uma categoria')
      return
    }

    if (selectedCategory === 'other' && !reason.trim()) {
      toast.error('Por favor, descreva o motivo da denúncia')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/posts/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId,
          category: selectedCategory,
          reason: reason.trim() || null
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message)
        
        if (data.autoHidden) {
          toast.info(
            `⚡ Post foi automaticamente ocultado após ${data.reportCount} denúncias`,
            { duration: 5000 }
          )
        }

        onReportSuccess?.()
        onClose()
        
        // Reset form
        setSelectedCategory('')
        setReason('')
      } else {
        toast.error(data.error || 'Erro ao processar denúncia')
      }
    } catch (error) {
      console.error('Erro ao denunciar post:', error)
      toast.error('Erro interno. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      onClose()
      setSelectedCategory('')
      setReason('')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[90vw] max-h-[90vh] w-full sm:max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Flag className="h-5 w-5 text-red-500" />
            <span>Denunciar Postagem</span>
          </DialogTitle>
          <DialogDescription>
            Ajude a manter nossa comunidade segura. Sua denúncia será analisada pela equipe de moderação.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informações da postagem */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>Denunciando postagem de:</strong> {postAuthor}
            </p>
          </div>

          {/* Categorias */}
          <div>
            <Label className="text-sm font-medium">
              Selecione o motivo da denúncia *
            </Label>
            <RadioGroup 
              value={selectedCategory} 
              onValueChange={setSelectedCategory}
              className="mt-2"
            >
              {REPORT_CATEGORIES.map((category) => (
                <div key={category.id} className="flex items-start space-x-2 p-2 rounded-lg hover:bg-gray-50">
                  <RadioGroupItem value={category.id} id={category.id} className="mt-0.5" />
                  <Label htmlFor={category.id} className="flex-1 cursor-pointer">
                    <div className="flex items-start space-x-2">
                      <span className="text-lg">{category.icon}</span>
                      <div>
                        <div className="font-medium text-gray-900">{category.label}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{category.description}</div>
                      </div>
                    </div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Detalhes adicionais */}
          <div>
            <Label htmlFor="reason" className="text-sm font-medium">
              Detalhes adicionais {selectedCategory === 'other' && '*'}
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={selectedCategory === 'other' 
                ? "Descreva o motivo da denúncia..." 
                : "Forneça detalhes adicionais (opcional)"
              }
              className="mt-1 resize-none"
              rows={3}
              maxLength={500}
              disabled={isSubmitting}
            />
            <div className="text-xs text-gray-500 mt-1 text-right">
              {reason.length}/500 caracteres
            </div>
          </div>

          {/* Aviso importante */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <Shield className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-yellow-800">
                <strong>Importante:</strong> Denúncias falsas podem resultar em penalidades. 
                Use este recurso apenas para conteúdos que realmente violam nossas diretrizes.
              </div>
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="flex space-x-2 pt-4">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedCategory || isSubmitting}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
          >
            {isSubmitting ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Denunciando...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Flag className="h-4 w-4" />
                <span>Enviar Denúncia</span>
              </div>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
