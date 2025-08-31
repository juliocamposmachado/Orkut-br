'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/enhanced-auth-context'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { AlertTriangle, Flag, MessageSquare } from 'lucide-react'

interface ReportModalProps {
  postId: string
  isOpen: boolean
  onClose: () => void
}

const REPORT_CATEGORIES = [
  {
    value: 'spam',
    label: 'Spam ou conteúdo irrelevante',
    description: 'Postagem repetitiva, propaganda não solicitada ou fora de contexto'
  },
  {
    value: 'harassment',
    label: 'Assédio ou bullying',
    description: 'Conteúdo que visa intimidar, ameaçar ou humilhar outros usuários'
  },
  {
    value: 'hate_speech',
    label: 'Discurso de ódio',
    description: 'Conteúdo que promove discriminação por raça, religião, gênero, etc.'
  },
  {
    value: 'violence',
    label: 'Violência ou conteúdo perigoso',
    description: 'Ameaças, incitação à violência ou conteúdo que pode causar danos'
  },
  {
    value: 'nudity',
    label: 'Nudez ou conteúdo sexual',
    description: 'Conteúdo sexual explícito ou imagens de nudez inadequadas'
  },
  {
    value: 'misinformation',
    label: 'Informação falsa',
    description: 'Fake news, desinformação ou conteúdo enganoso'
  },
  {
    value: 'copyright',
    label: 'Violação de direitos autorais',
    description: 'Uso não autorizado de conteúdo protegido por direitos autorais'
  },
  {
    value: 'other',
    label: 'Outro motivo',
    description: 'Outro tipo de violação das regras da comunidade'
  }
]

export default function ReportModal({ postId, isOpen, onClose }: ReportModalProps) {
  const { user } = useAuth()
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      toast.error('Você precisa estar logado para denunciar uma postagem')
      return
    }

    if (!selectedCategory) {
      toast.error('Por favor, selecione uma categoria de denúncia')
      return
    }

    setIsSubmitting(true)

    try {
      // Verificar se o usuário já denunciou esta postagem
      const { data: existingReport } = await supabase
        .from('post_reports')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .single()

      if (existingReport) {
        toast.error('Você já denunciou esta postagem')
        setIsSubmitting(false)
        return
      }

      // Criar a denúncia
      const { error: reportError } = await supabase
        .from('post_reports')
        .insert({
          post_id: postId,
          user_id: user.id,
          category: selectedCategory,
          description: description.trim() || null,
          created_at: new Date().toISOString()
        })

      if (reportError) {
        console.error('Erro ao criar denúncia:', reportError)
        toast.error('Erro ao enviar denúncia. Tente novamente.')
        return
      }

      // Verificar quantas denúncias o post tem agora
      const { data: reportCount } = await supabase
        .from('post_reports')
        .select('id', { count: 'exact' })
        .eq('post_id', postId)

      // Se atingiu 4+ denúncias, ocultar automaticamente o post
      if (reportCount && reportCount.length >= 4) {
        const { error: hideError } = await supabase
          .from('posts')
          .update({
            is_hidden: true,
            hidden_at: new Date().toISOString(),
            hidden_reason: 'Múltiplas denúncias da comunidade'
          })
          .eq('id', postId)

        if (hideError) {
          console.error('Erro ao ocultar post:', hideError)
        } else {
          toast.success('Postagem foi automaticamente removida do feed por múltiplas denúncias')
        }
      } else {
        toast.success('Denúncia enviada com sucesso. Nossa equipe irá analisar.')
      }

      // Resetar form e fechar modal
      setSelectedCategory('')
      setDescription('')
      onClose()

    } catch (error) {
      console.error('Erro inesperado ao denunciar:', error)
      toast.error('Erro inesperado. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedCategory('')
      setDescription('')
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-red-500" />
            Denunciar Postagem
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-sm font-medium mb-3 block">
              Por que você está denunciando esta postagem?
            </Label>
            <RadioGroup
              value={selectedCategory}
              onValueChange={setSelectedCategory}
              className="space-y-3"
            >
              {REPORT_CATEGORIES.map((category) => (
                <div key={category.value} className="flex items-start space-x-3">
                  <RadioGroupItem
                    value={category.value}
                    id={category.value}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor={category.value}
                      className="text-sm font-medium cursor-pointer"
                    >
                      {category.label}
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      {category.description}
                    </p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div>
            <Label htmlFor="description" className="text-sm font-medium">
              Descrição adicional (opcional)
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Forneça mais detalhes sobre sua denúncia..."
              className="mt-1 resize-none"
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {description.length}/500 caracteres
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <div className="flex items-start">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
              <div className="text-xs text-yellow-800">
                <p className="font-medium mb-1">Aviso importante:</p>
                <p>
                  Denúncias falsas podem resultar em penalidades. Use este recurso apenas para 
                  conteúdo que realmente viola as regras da comunidade.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!selectedCategory || isSubmitting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isSubmitting ? (
                <>
                  <MessageSquare className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Flag className="w-4 h-4 mr-2" />
                  Enviar Denúncia
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
