'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/enhanced-auth-context'
import { OrkutCard, OrkutCardContent, OrkutCardHeader } from '@/components/ui/orkut-card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { supabase } from '@/lib/supabase'
import { Camera, Image, Smile, Send, Globe, Users, ChevronDown, CheckCircle, MapPin, Calendar } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { useLinkPreview } from '@/hooks/use-link-preview'
import { LinkPreviewCard, LinkPreviewSkeleton } from '@/components/ui/link-preview-card'

interface CreatePostProps {
  onPostCreated?: () => void
}

export function CreatePost({ onPostCreated }: CreatePostProps) {
  const { user, profile } = useAuth()
  const [content, setContent] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [visibility, setVisibility] = useState<'public' | 'friends'>('public')
  
  // Link preview hook
  const { linkPreview, isLoading: isLinkLoading, clearPreview } = useLinkPreview(content)

  // Check if we have valid Supabase configuration
  const hasSupabaseConfig = process.env.NEXT_PUBLIC_SUPABASE_URL && 
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co'

  console.log('🔍 [CreatePost] Renderizando com:', {
    user: !!user,
    profile: !!profile,
    user_id: user?.id,
    profile_display_name: profile?.display_name,
    hasSupabaseConfig
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Debug logs detalhados
    console.log('🔍 [DEBUG] handleSubmit iniciado');
    console.log('🔍 [DEBUG] Event:', e.type);
    console.log('🔍 [DEBUG] content:', content);
    console.log('🔍 [DEBUG] content.trim():', content.trim());
    console.log('🔍 [DEBUG] user existe:', !!user);
    console.log('🔍 [DEBUG] user.id:', user?.id);
    console.log('🔍 [DEBUG] profile existe:', !!profile);
    console.log('🔍 [DEBUG] isLoading:', isLoading);
    
    if (!content.trim()) {
      console.log('❌ [DEBUG] Falha: content está vazio');
      return;
    }
    
    if (!user) {
      console.log('❌ [DEBUG] Falha: user não existe');
      return;
    }
    
    console.log('✅ [DEBUG] Validações passaram, prosseguindo...');

    setIsLoading(true)
    try {
      // Criar post permanente no banco de dados
      console.log('🚀 Criando post permanente:', {
        content: content.trim(),
        author: user.id,
        author_name: profile?.display_name
      })
      
      // Obter sessão atual do Supabase para enviar token JWT
      const { data: { session } } = await supabase.auth.getSession()
      const authToken = session?.access_token
      
      console.log('🔑 Token de autenticação:', authToken ? 'Encontrado' : 'Não encontrado')
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      
      // Adicionar token de autorização se disponível
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`
      }
      
      console.log('📤 Enviando request para /api/posts-db...')
      
      const response = await fetch('/api/posts-db', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          content: content.trim(),
          author: user.id,
          author_name: profile?.display_name || 'Usuário',
          author_photo: profile?.photo_url || null,
          visibility: visibility,
          is_dj_post: false
        })
      })
      
      console.log('📥 Response status:', response.status)
      console.log('📥 Response ok:', response.ok)
      
      if (!response.ok) {
        const errorData = await response.json()
        console.log('❌ Error response:', errorData)
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
      console.log('📡 Disparando evento new-post-created...')
      window.dispatchEvent(new CustomEvent('new-post-created', { detail: result.post }))
      
      console.log('🔄 Limpando form...')
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
      console.log('🏁 Finalizando handleSubmit...')
      setIsLoading(false)
    }
  }

  // Debug do botão
  const isButtonDisabled = !content.trim() || isLoading
  console.log('🔍 [Button Debug]:', {
    content_length: content.length,
    content_trimmed_length: content.trim().length,
    isLoading,
    isButtonDisabled,
    user: !!user,
    profile: !!profile
  })

  if (!user || !profile) {
    console.log('⚠️ [CreatePost] Não renderizando: user ou profile não existe')
    return null
  }

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
            onChange={(e) => {
              console.log('🔍 [Input] Valor alterado para:', e.target.value)
              setContent(e.target.value)
            }}
            className="border-purple-300 focus:ring-purple-500 min-h-[100px] resize-none"
            maxLength={500}
          />
          
          {/* Link Preview Section */}
          {isLinkLoading && (
            <div className="mt-4">
              <LinkPreviewSkeleton />
            </div>
          )}
          
          {linkPreview && (
            <div className="mt-4">
              <LinkPreviewCard 
                preview={linkPreview} 
                onRemove={clearPreview}
                isLoading={isLinkLoading}
              />
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:bg-gray-50 p-2"
                title="Adicionar foto"
              >
                <Camera className="h-5 w-5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-blue-600 hover:bg-blue-50 p-2"
                title="Marcar pessoas"
              >
                <Users className="h-5 w-5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-yellow-600 hover:bg-yellow-50 p-2"
                title="Adicionar emoji"
              >
                <Smile className="h-5 w-5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-red-600 hover:bg-red-50 p-2"
                title="Adicionar localização"
              >
                <MapPin className="h-5 w-5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-green-600 hover:bg-green-50 p-2"
                title="Adicionar evento"
              >
                <Calendar className="h-5 w-5" />
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
                disabled={isButtonDisabled}
                className="bg-purple-500 hover:bg-purple-600"
                onClick={() => console.log('🔍 [Button] Clique detectado!')}
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
