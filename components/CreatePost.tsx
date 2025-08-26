'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/enhanced-auth-context'
import { OrkutCard, OrkutCardContent, OrkutCardHeader } from '@/components/ui/orkut-card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { supabase } from '@/lib/supabase'
import { Camera, Image, Smile, Send, Globe, Users, ChevronDown, CheckCircle } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'

interface CreatePostProps {
  onPostCreated?: () => void
}

export function CreatePost({ onPostCreated }: CreatePostProps) {
  const { user, profile } = useAuth()
  const [content, setContent] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [visibility, setVisibility] = useState<'public' | 'friends'>('public')

  // Check if we have valid Supabase configuration
  const hasSupabaseConfig = process.env.NEXT_PUBLIC_SUPABASE_URL && 
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || !user) return

    setIsLoading(true)
    try {
      // Debug: Verificar dados do usuário e perfil
      console.log('🔍 [DEBUG] Dados do usuário:', {
        user_id: user?.id,
        user_email: user?.email,
        user_exists: !!user
      })
      console.log('🔍 [DEBUG] Dados do perfil:', {
        profile_id: profile?.id,
        display_name: profile?.display_name,
        photo_url: profile?.photo_url,
        username: profile?.username,
        profile_exists: !!profile
      })
      
      // Criar post permanente no banco de dados
      console.log('🚀 Criando post permanente:', {
        content: content.trim(),
        author: user.id,
        author_name: profile?.display_name || profile?.username || 'Usuário',
        author_photo: profile?.photo_url
      })
      
      // Obter sessão atual do Supabase para enviar token JWT
      const { data: { session } } = await supabase.auth.getSession()
      const authToken = session?.access_token
      
      console.log('🔑 Token de autenticação:', authToken ? 'Encontrado' : 'Não encontrado')
      console.log('🔍 Session user:', session?.user?.id)
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      
      // Adicionar token de autorização se disponível
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`
      }
      
      const response = await fetch('/api/posts-db', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          content: content.trim(),
          author: profile?.id || user.id, // Usar profile.id que referencia a tabela profiles
          author_name: profile?.display_name || profile?.username || 'Usuário',
          author_photo: profile?.photo_url || null,
          visibility: visibility,
          is_dj_post: false
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao criar post')
      }
      
      const result = await response.json()
      console.log('✅ Post salvo permanentemente:', result.post)
      
      // Mostrar notificação de sucesso
      toast.success('Post publicado com sucesso!', {
        description: 'Sua postagem foi salva permanentemente e aparecerá no seu perfil.',
        icon: <CheckCircle className="h-4 w-4" />,
        duration: 4000,
        position: 'top-right',
        style: {
          background: '#10B981',
          border: '1px solid #059669',
          color: 'white',
        },
      })
      
      // Dispara evento para o Feed atualizar
      window.dispatchEvent(new CustomEvent('new-post-created', { detail: result.post }))
      
      setContent('')
      onPostCreated?.()
      
      console.log('🎉 Post publicado e salvo permanentemente no seu perfil!')
      
    } catch (error: any) {
      console.error('❌ Erro ao criar post:', error)
      
      // Mostrar notificação de erro
      toast.error('Erro ao publicar post', {
        description: error.message || 'Ocorreu um erro inesperado. Tente novamente.',
        duration: 5000,
        position: 'top-right',
        style: {
          background: '#EF4444',
          border: '1px solid #DC2626',
          color: 'white',
        },
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!user || !profile) return null

  return (
    <OrkutCard>
      <OrkutCardHeader>
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={profile.photo_url || undefined} alt={profile.display_name} />
            <AvatarFallback>
              {profile.display_name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-medium text-gray-800">{profile.display_name}</h3>
            <p className="text-sm text-gray-600">O que você está pensando?</p>
          </div>
        </div>
      </OrkutCardHeader>
      <OrkutCardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            placeholder="Compartilhe algo interessante..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="border-purple-300 focus:ring-purple-500 min-h-[100px] resize-none"
            maxLength={500}
          />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-purple-600 hover:bg-purple-50"
              >
                <Camera className="h-4 w-4 mr-1" />
                Foto
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-purple-600 hover:bg-purple-50"
              >
                <Image className="h-4 w-4 mr-1" />
                Imagem
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-purple-600 hover:bg-purple-50"
              >
                <Smile className="h-4 w-4 mr-1" />
                Emoji
              </Button>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Seletor de Privacidade */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-purple-300 text-purple-700 hover:bg-purple-50"
                  >
                    {visibility === 'public' ? (
                      <>
                        <Globe className="h-4 w-4 mr-2" />
                        Público
                      </>
                    ) : (
                      <>
                        <Users className="h-4 w-4 mr-2" />
                        Amigos
                      </>
                    )}
                    <ChevronDown className="h-3 w-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem 
                    onClick={() => setVisibility('public')}
                    className={visibility === 'public' ? 'bg-purple-50' : ''}
                  >
                    <Globe className="h-4 w-4 mr-2" />
                    <div>
                      <p className="font-medium">Público</p>
                      <p className="text-xs text-gray-500">Todos os usuários do site podem ver</p>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setVisibility('friends')}
                    className={visibility === 'friends' ? 'bg-purple-50' : ''}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    <div>
                      <p className="font-medium">Amigos</p>
                      <p className="text-xs text-gray-500">Apenas seus amigos podem ver</p>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <span className="text-xs text-gray-500">
                {content.length}/500
              </span>
              
              <Button
                type="submit"
                disabled={!content.trim() || isLoading}
                className="bg-purple-500 hover:bg-purple-600"
              >
                {isLoading ? (
                  'Publicando...'
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-1" />
                    Publicar
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </OrkutCardContent>
    </OrkutCard>
  )
}
