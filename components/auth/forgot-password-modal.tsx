'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { useAuth } from '@/contexts/local-auth-context'
import { Mail, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'

interface ForgotPasswordModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ForgotPasswordModal({ open, onOpenChange }: ForgotPasswordModalProps) {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const { sendPasswordReset } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setIsLoading(true)
    try {
      await sendPasswordReset(email.trim())
      setEmailSent(true)
    } catch (error: any) {
      toast.error(error.message || 'Erro ao enviar email de redefinição')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setEmail('')
    setEmailSent(false)
    onOpenChange(false)
  }

  const handleBack = () => {
    setEmailSent(false)
    setEmail('')
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-purple-600" />
            {emailSent ? 'Email Enviado!' : 'Redefinir Senha'}
          </DialogTitle>
          <DialogDescription>
            {emailSent 
              ? 'Instruções de redefinição foram enviadas para seu email'
              : 'Digite seu email para receber instruções de redefinição de senha'
            }
          </DialogDescription>
        </DialogHeader>

        {!emailSent ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-purple-300 focus:ring-purple-500"
                autoFocus
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={!email.trim() || isLoading}
                className="bg-purple-500 hover:bg-purple-600"
              >
                {isLoading ? 'Enviando...' : 'Enviar Email'}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="text-center py-6">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Mail className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Email enviado com sucesso!
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                Enviamos instruções para redefinir sua senha para:
              </p>
              <p className="font-medium text-purple-600 text-sm mb-4">
                {email}
              </p>
              <p className="text-xs text-gray-500">
                💡 Verifique também sua pasta de spam/lixo eletrônico
              </p>
            </div>
            
            <div className="flex justify-between gap-2">
              <Button 
                variant="outline" 
                onClick={handleBack}
                className="border-purple-300 text-purple-700"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Voltar
              </Button>
              <Button
                onClick={handleClose}
                className="bg-purple-500 hover:bg-purple-600"
              >
                Entendido
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
