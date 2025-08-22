'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/contexts/enhanced-auth-context'
import { AlertCircle, Mail, CheckCircle, X, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

export function EmailVerificationBanner() {
  const { user, profile, resendEmailVerification, checkEmailVerified } = useAuth()
  const [isResending, setIsResending] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)
  const [isCheckingVerification, setIsCheckingVerification] = useState(false)

  // Check if email verification is needed
  const needsVerification = user && profile && !profile.email_confirmed

  // Don't show if dismissed or not needed
  if (isDismissed || !needsVerification) {
    return null
  }

  const handleResendVerification = async () => {
    setIsResending(true)
    try {
      await resendEmailVerification()
    } catch (error: any) {
      toast.error(error.message || 'Erro ao reenviar email')
    } finally {
      setIsResending(false)
    }
  }

  const handleCheckVerification = async () => {
    setIsCheckingVerification(true)
    try {
      const isVerified = await checkEmailVerified()
      if (isVerified) {
        toast.success('Email verificado com sucesso!')
        setIsDismissed(true)
      } else {
        toast.info('Email ainda não foi verificado. Verifique sua caixa de entrada.')
      }
    } catch (error: any) {
      toast.error('Erro ao verificar status do email')
    } finally {
      setIsCheckingVerification(false)
    }
  }

  const handleDismiss = () => {
    setIsDismissed(true)
    // Save dismissal state to localStorage
    localStorage.setItem('email_verification_dismissed', 'true')
  }

  // Check localStorage for previous dismissal
  useEffect(() => {
    const wasDismissed = localStorage.getItem('email_verification_dismissed')
    if (wasDismissed === 'true') {
      setIsDismissed(true)
    }
  }, [])

  return (
    <Card className="border-2 border-orange-200 bg-orange-50 mb-6">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-orange-800 mb-1">
                📧 Verificação de Email Necessária
              </h3>
              <p className="text-sm text-orange-700 mb-3">
                Para ter acesso completo à plataforma, você precisa verificar seu email{' '}
                <span className="font-medium">{user?.email}</span>.
                Verifique sua caixa de entrada e clique no link de confirmação.
              </p>
              
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleResendVerification}
                  disabled={isResending}
                  className="border-orange-300 text-orange-700 hover:bg-orange-100"
                >
                  {isResending ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-1" />
                      Reenviar Email
                    </>
                  )}
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCheckVerification}
                  disabled={isCheckingVerification}
                  className="border-green-300 text-green-700 hover:bg-green-100"
                >
                  {isCheckingVerification ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Já Verifiquei
                    </>
                  )}
                </Button>
              </div>
              
              <div className="mt-2 text-xs text-orange-600">
                💡 <strong>Dica:</strong> Verifique também sua pasta de spam/lixo eletrônico
              </div>
            </div>
          </div>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDismiss}
            className="text-orange-600 hover:text-orange-800 hover:bg-orange-100 p-1 h-auto"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
