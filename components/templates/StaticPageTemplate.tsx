'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { OrkutCard, OrkutCardContent, OrkutCardHeader } from '@/components/ui/orkut-card'
import { Button } from '@/components/ui/button'
import { Loader2, AlertCircle, Home, Users, MessageSquare } from 'lucide-react'

interface StaticPageTemplateProps {
  title: string
  description?: string
  children?: React.ReactNode
  showAuthGuard?: boolean
  requireAuth?: boolean
  fallbackContent?: React.ReactNode
}

export function StaticPageTemplate({ 
  title, 
  description, 
  children, 
  showAuthGuard = true,
  requireAuth = true,
  fallbackContent 
}: StaticPageTemplateProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Loading state durante hydration
  if (!isClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  // Loading state durante autenticação
  if (loading && requireAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-purple-600" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">Verificando autenticação</h2>
            <p className="text-gray-600">Aguarde um momento...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  // Redirect para login se necessário
  if (requireAuth && !loading && !user) {
    if (isClient) {
      router.push('/login')
    }
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <OrkutCard className="max-w-md">
            <OrkutCardContent>
              <div className="text-center">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-orange-500" />
                <h2 className="text-xl font-bold text-gray-800 mb-2">Acesso Restrito</h2>
                <p className="text-gray-600 mb-4">
                  Você precisa estar logado para acessar esta página.
                </p>
                <Button onClick={() => router.push('/login')} className="w-full">
                  Fazer Login
                </Button>
              </div>
            </OrkutCardContent>
          </OrkutCard>
        </div>
        <Footer />
      </div>
    )
  }

  // Template principal com fallback
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {showAuthGuard && <Navbar />}
      
      <div className="container mx-auto px-4 py-8">
        {/* Header da página */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{title}</h1>
          {description && (
            <p className="text-gray-600">{description}</p>
          )}
        </div>

        {/* Conteúdo principal */}
        <div className="space-y-6">
          {children ? (
            children
          ) : fallbackContent ? (
            fallbackContent
          ) : (
            <DefaultFallbackContent />
          )}
        </div>

        {/* Navegação rápida se não há conteúdo */}
        {!children && !fallbackContent && (
          <QuickNavigation />
        )}
      </div>

      {showAuthGuard && <Footer />}
    </div>
  )
}

function DefaultFallbackContent() {
  return (
    <OrkutCard>
      <OrkutCardHeader>
        <h2 className="text-xl font-bold">Conteúdo em Carregamento</h2>
      </OrkutCardHeader>
      <OrkutCardContent>
        <div className="text-center py-8">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-gray-600 mb-4">
            Estamos carregando o conteúdo desta página...
          </p>
          <p className="text-sm text-gray-500">
            Se o problema persistir, tente recarregar a página.
          </p>
        </div>
      </OrkutCardContent>
    </OrkutCard>
  )
}

function QuickNavigation() {
  const router = useRouter()
  
  const quickLinks = [
    { 
      icon: Home, 
      title: 'Página Inicial', 
      description: 'Voltar para o feed principal',
      href: '/' 
    },
    { 
      icon: Users, 
      title: 'Amigos', 
      description: 'Ver seus amigos online',
      href: '/amigos' 
    },
    { 
      icon: MessageSquare, 
      title: 'Mensagens', 
      description: 'Suas conversas recentes',
      href: '/mensagens' 
    }
  ]

  return (
    <div className="mt-12">
      <OrkutCard>
        <OrkutCardHeader>
          <h3 className="text-lg font-bold">Navegação Rápida</h3>
        </OrkutCardHeader>
        <OrkutCardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickLinks.map((link, index) => (
              <Button
                key={index}
                variant="outline"
                className="h-auto p-4 flex-col items-center space-y-2"
                onClick={() => router.push(link.href)}
              >
                <link.icon className="h-6 w-6" />
                <div className="text-center">
                  <div className="font-medium">{link.title}</div>
                  <div className="text-xs text-gray-500">{link.description}</div>
                </div>
              </Button>
            ))}
          </div>
        </OrkutCardContent>
      </OrkutCard>
    </div>
  )
}
