'use client'

import { useState } from 'react'
import { OrkutCard, OrkutCardContent, OrkutCardHeader } from '@/components/ui/orkut-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  Mail, 
  Send, 
  UserPlus, 
  Copy, 
  ExternalLink, 
  Check, 
  Loader2,
  X,
  Gift,
  Heart,
  Users
} from 'lucide-react'
import { useAuth } from '@/contexts/enhanced-auth-context'
import { toast } from 'sonner'

interface InviteFriendsCardProps {
  className?: string
}

interface Invitation {
  id: string
  email: string
  token: string
  verificationCode: string
  inviteUrl: string
  gmailUrl: string
  emailSubject: string
  emailBody: string
}

export function InviteFriendsCard({ className = '' }: InviteFriendsCardProps) {
  const { user, profile } = useAuth()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [recentInvites, setRecentInvites] = useState<Invitation[]>([])
  const [showSuccess, setShowSuccess] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState('')

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email.trim()) {
      toast.error('Digite um email válido')
      return
    }

    setIsLoading(true)
    
    try {
      const response = await fetch('/api/invitations/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar convite')
      }

      // Adicionar convite à lista de recentes
      setRecentInvites(prev => [data.invitation, ...prev.slice(0, 4)])
      setEmail('')
      setShowSuccess(true)
      
      // Abrir Gmail automaticamente
      window.open(data.invitation.gmailUrl, '_blank')
      
      toast.success('Convite criado com sucesso! Gmail foi aberto para enviar.')
      
      // Ocultar mensagem de sucesso após 5 segundos
      setTimeout(() => setShowSuccess(false), 5000)

    } catch (error: any) {
      console.error('Erro ao criar convite:', error)
      toast.error(error.message || 'Erro ao criar convite')
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedUrl(text)
      toast.success(`${type} copiado para a área de transferência!`)
      
      setTimeout(() => setCopiedUrl(''), 2000)
    } catch (error) {
      toast.error('Erro ao copiar para a área de transferência')
    }
  }

  const removeInvite = (index: number) => {
    setRecentInvites(prev => prev.filter((_, i) => i !== index))
  }

  if (!user || !profile) return null

  return (
    <OrkutCard className={`${className} border-purple-200 shadow-lg`}>
      <OrkutCardHeader>
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
            <UserPlus className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800">Convidar Amigos</h3>
            <p className="text-xs text-gray-500">Convide por email e ganhe pontos!</p>
          </div>
        </div>
      </OrkutCardHeader>
      
      <OrkutCardContent className="space-y-4">
        {/* Mensagem de Sucesso */}
        {showSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center space-x-2">
            <Check className="h-4 w-4 text-green-600" />
            <div className="text-sm">
              <p className="text-green-800 font-medium">Convite enviado com sucesso! 🎉</p>
              <p className="text-green-600 text-xs">Gmail foi aberto para enviar o email</p>
            </div>
          </div>
        )}

        {/* Formulário de Convite */}
        <form onSubmit={handleInvite} className="space-y-3">
          <div>
            <Input
              type="email"
              placeholder="Digite o email do seu amigo"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border-purple-200 focus:border-purple-500 focus:ring-purple-500"
              disabled={isLoading}
            />
          </div>
          
          <Button 
            type="submit"
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-md"
            disabled={isLoading || !email.trim()}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Criando convite...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Enviar Convite
              </>
            )}
          </Button>
        </form>

        {/* Stats de Convites */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 bg-purple-50 rounded-lg">
            <Gift className="h-4 w-4 text-purple-600 mx-auto mb-1" />
            <p className="text-xs text-purple-700 font-medium">{recentInvites.length}</p>
            <p className="text-xs text-purple-500">Enviados</p>
          </div>
          <div className="p-2 bg-pink-50 rounded-lg">
            <Heart className="h-4 w-4 text-pink-600 mx-auto mb-1" />
            <p className="text-xs text-pink-700 font-medium">0</p>
            <p className="text-xs text-pink-500">Aceitos</p>
          </div>
          <div className="p-2 bg-blue-50 rounded-lg">
            <Users className="h-4 w-4 text-blue-600 mx-auto mb-1" />
            <p className="text-xs text-blue-700 font-medium">+50</p>
            <p className="text-xs text-blue-500">Pontos</p>
          </div>
        </div>

        {/* Lista de Convites Recentes */}
        {recentInvites.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700 flex items-center">
              <Mail className="h-3 w-3 mr-1" />
              Convites Recentes
            </h4>
            
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {recentInvites.map((invite, index) => (
                <div key={invite.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {invite.email}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline" className="text-xs border-purple-300 text-purple-700">
                          Pendente
                        </Badge>
                        <span className="text-xs text-gray-500">
                          Código: {invite.verificationCode}
                        </span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="p-1 h-6 w-6 text-gray-400 hover:text-gray-600"
                      onClick={() => removeInvite(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <div className="flex space-x-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-xs h-7 border-purple-300 text-purple-700 hover:bg-purple-50"
                      onClick={() => copyToClipboard(invite.inviteUrl, 'Link')}
                    >
                      {copiedUrl === invite.inviteUrl ? (
                        <Check className="h-3 w-3 mr-1" />
                      ) : (
                        <Copy className="h-3 w-3 mr-1" />
                      )}
                      Link
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-xs h-7 border-green-300 text-green-700 hover:bg-green-50"
                      onClick={() => window.open(invite.gmailUrl, '_blank')}
                    >
                      <Mail className="h-3 w-3 mr-1" />
                      Gmail
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dica */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <div className="text-blue-600 text-lg">💡</div>
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Dica:</p>
              <p className="text-xs text-blue-700">
                Seus amigos receberão um link especial com código de verificação para se cadastrar facilmente!
              </p>
            </div>
          </div>
        </div>
      </OrkutCardContent>
    </OrkutCard>
  )
}
