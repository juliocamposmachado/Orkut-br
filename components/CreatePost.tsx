'use client'

import { useState, useRef } from 'react'
import { useAuth } from '@/contexts/local-auth-context';
import { OrkutCard, OrkutCardContent, OrkutCardHeader } from '@/components/ui/orkut-card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { supabase } from '@/lib/supabase'
import { 
  Camera, 
  Image as ImageIcon, 
  Smile, 
  Send, 
  Globe, 
  Users, 
  ChevronDown, 
  CheckCircle, 
  MapPin, 
  Calendar,
  X,
  Upload,
  Loader2,
  Hash,
  Heart,
  Frown,
  Meh,
  Angry,
  Laugh
} from 'lucide-react'
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

// Types for new features
interface AttachedImage {
  id: string
  url: string
  direct_url: string
  thumbnail_url: string
  original_filename: string
  file_size: number
}

interface TaggedFriend {
  id: string
  name: string
  avatar?: string
}

interface LocationData {
  name: string
  coordinates?: { lat: number; lng: number }
}

interface EventData {
  title: string
  date: string
  location?: string
}

type Feeling = 'happy' | 'sad' | 'angry' | 'excited' | 'love' | 'meh'

export function CreatePost({ onPostCreated }: CreatePostProps) {
  const { user, profile } = useAuth()
  const [content, setContent] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [visibility, setVisibility] = useState<'public' | 'friends'>('public')
  
  // New features states
  const [attachedImages, setAttachedImages] = useState<AttachedImage[]>([])
  const [taggedFriends, setTaggedFriends] = useState<TaggedFriend[]>([])
  const [selectedFeeling, setSelectedFeeling] = useState<Feeling | null>(null)
  const [location, setLocation] = useState<LocationData | null>(null)
  const [event, setEvent] = useState<EventData | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  
  // UI states
  const [showFeelingPicker, setShowFeelingPicker] = useState(false)
  const [showLocationInput, setShowLocationInput] = useState(false)
  const [showEventInput, setShowEventInput] = useState(false)
  const [showFriendsPicker, setShowFriendsPicker] = useState(false)
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Link preview hook
  const { linkPreview, isLoading: isLinkLoading, clearPreview } = useLinkPreview(content)

  // Check if we have valid Supabase configuration
  const hasSupabaseConfig = process.env.NEXT_PUBLIC_SUPABASE_URL && 
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co'

  // Handler functions for new features
  const handleImageUpload = async (files: File[]) => {
    if (files.length === 0) return
    
    setIsUploadingImage(true)
    
    try {
      for (const file of files) {
        // Validações
        if (file.size > 10 * 1024 * 1024) {
          toast.error('Arquivo muito grande', {
            description: `${file.name} excede o limite de 10MB`
          })
          continue
        }

        if (!file.type.startsWith('image/')) {
          toast.error('Formato inválido', {
            description: `${file.name} não é uma imagem válida`
          })
          continue
        }

        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/photos/imgur-upload', {
          method: 'POST',
          body: formData
        })

        const result = await response.json()

        if (!result.success) {
          throw new Error(result.error || 'Erro no upload')
        }

        const newImage: AttachedImage = {
          id: result.data.id,
          url: result.data.url,
          direct_url: result.data.direct_url,
          thumbnail_url: result.data.thumbnail_url,
          original_filename: result.data.original_filename,
          file_size: result.data.file_size
        }

        setAttachedImages(prev => [...prev, newImage])
        toast.success('Imagem adicionada!', {
          description: `${file.name} foi anexada ao post`
        })
      }
    } catch (error: any) {
      toast.error('Erro no upload', {
        description: error.message || 'Não foi possível fazer upload da imagem'
      })
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length > 0) {
      handleImageUpload(files)
    }
    // Reset input
    event.target.value = ''
  }

  const removeImage = (imageId: string) => {
    setAttachedImages(prev => prev.filter(img => img.id !== imageId))
  }

  const toggleFriendTag = (friend: TaggedFriend) => {
    setTaggedFriends(prev => {
      const isAlreadyTagged = prev.some(f => f.id === friend.id)
      if (isAlreadyTagged) {
        return prev.filter(f => f.id !== friend.id)
      } else {
        return [...prev, friend]
      }
    })
  }

  const getFeelingIcon = (feeling: Feeling) => {
    switch (feeling) {
      case 'happy': return <Smile className="h-4 w-4" />
      case 'sad': return <Frown className="h-4 w-4" />
      case 'angry': return <Angry className="h-4 w-4" />
      case 'excited': return <Laugh className="h-4 w-4" />
      case 'love': return <Heart className="h-4 w-4" />
      case 'meh': return <Meh className="h-4 w-4" />
      default: return <Smile className="h-4 w-4" />
    }
  }

  const getFeelingLabel = (feeling: Feeling) => {
    const labels = {
      happy: 'feliz',
      sad: 'triste', 
      angry: 'irritado',
      excited: 'animado',
      love: 'apaixonado',
      meh: 'neutro'
    }
    return labels[feeling]
  }

  const clearAllAttachments = () => {
    setAttachedImages([])
    setTaggedFriends([])
    setSelectedFeeling(null)
    setLocation(null)
    setEvent(null)
    setShowFeelingPicker(false)
    setShowLocationInput(false)
    setShowEventInput(false)
    setShowFriendsPicker(false)
  }

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
          is_dj_post: false,
          link_preview: linkPreview,
          // New features data
          attached_images: attachedImages,
          tagged_friends: taggedFriends,
          feeling: selectedFeeling,
          location: location,
          event: event
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
      clearAllAttachments() // Limpar todas as funcionalidades anexadas
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
    <OrkutCard className="w-full max-w-full overflow-hidden">
      <OrkutCardHeader>
        <div className="flex items-center space-x-2 xs:space-x-3">
          <Avatar className="h-8 w-8 xs:h-10 xs:w-10 flex-shrink-0">
            <AvatarImage src={profile.photo_url || undefined} alt={profile.display_name} />
            <AvatarFallback className="text-xs xs:text-sm">
              {profile.display_name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h3 className="font-medium text-gray-800 text-sm xs:text-base truncate">{profile.display_name}</h3>
            <p className="text-xs xs:text-sm text-gray-600 truncate">O que você está pensando?</p>
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
          
          <div className="flex flex-col gap-3">
            {/* Action buttons row */}
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-thin">
              {/* Input de arquivo oculto */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />
              
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={`p-1.5 flex-shrink-0 ${
                  attachedImages.length > 0 
                    ? 'text-purple-600 bg-purple-50 hover:bg-purple-100'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
                title="Adicionar foto"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingImage}
              >
                {isUploadingImage ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
                {attachedImages.length > 0 && (
                  <span className="ml-1 text-xs">{attachedImages.length}</span>
                )}
              </Button>
              
              <DropdownMenu open={showFriendsPicker} onOpenChange={setShowFriendsPicker}>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className={`p-1.5 flex-shrink-0 ${
                      taggedFriends.length > 0 
                        ? 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                        : 'text-blue-600 hover:bg-blue-50'
                    }`}
                    title="Marcar pessoas"
                  >
                    <Users className="h-4 w-4" />
                    {taggedFriends.length > 0 && (
                      <span className="ml-1 text-xs">{taggedFriends.length}</span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64">
                  <div className="p-2">
                    <p className="text-sm font-medium mb-2">Marcar amigos</p>
                    <p className="text-xs text-gray-500 mb-3">Feature em breve! Por enquanto funciona como visual.</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        // Simular marcação de um amigo
                        const mockFriend: TaggedFriend = {
                          id: '1',
                          name: 'Amigo Exemplo',
                          avatar: undefined
                        }
                        toggleFriendTag(mockFriend)
                        setShowFriendsPicker(false)
                      }}
                      className="w-full text-xs"
                    >
                      + Exemplo: Marcar Amigo
                    </Button>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <DropdownMenu open={showFeelingPicker} onOpenChange={setShowFeelingPicker}>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className={`p-1.5 flex-shrink-0 ${
                      selectedFeeling 
                        ? 'text-yellow-600 bg-yellow-50 hover:bg-yellow-100'
                        : 'text-yellow-600 hover:bg-yellow-50'
                    }`}
                    title="Adicionar sentimento"
                  >
                    {selectedFeeling ? getFeelingIcon(selectedFeeling) : <Smile className="h-4 w-4" />}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <div className="p-2">
                    <p className="text-sm font-medium mb-2">Como você está se sentindo?</p>
                    <div className="grid grid-cols-2 gap-1">
                      {(['happy', 'sad', 'angry', 'excited', 'love', 'meh'] as Feeling[]).map((feeling) => (
                        <DropdownMenuItem
                          key={feeling}
                          onClick={() => {
                            setSelectedFeeling(feeling)
                            setShowFeelingPicker(false)
                          }}
                          className="flex items-center space-x-2"
                        >
                          {getFeelingIcon(feeling)}
                          <span className="text-sm capitalize">{getFeelingLabel(feeling)}</span>
                        </DropdownMenuItem>
                      ))}
                    </div>
                    {selectedFeeling && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedFeeling(null)
                          setShowFeelingPicker(false)
                        }}
                        className="w-full mt-2 text-xs"
                      >
                        Remover sentimento
                      </Button>
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={`p-1.5 flex-shrink-0 hidden sm:flex ${
                  location 
                    ? 'text-red-600 bg-red-50 hover:bg-red-100'
                    : 'text-red-600 hover:bg-red-50'
                }`}
                title="Adicionar localização"
                onClick={() => setShowLocationInput(!showLocationInput)}
              >
                <MapPin className="h-4 w-4" />
              </Button>
              
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={`p-1.5 flex-shrink-0 hidden sm:flex ${
                  event 
                    ? 'text-green-600 bg-green-50 hover:bg-green-100'
                    : 'text-green-600 hover:bg-green-50'
                }`}
                title="Adicionar evento"
                onClick={() => setShowEventInput(!showEventInput)}
              >
                <Calendar className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Bottom row - Privacy, counter and publish button */}
            <div className="flex items-center justify-between gap-2 min-w-0">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {/* Seletor de Privacidade */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border-purple-300 text-purple-700 hover:bg-purple-50 text-xs flex-shrink-0 px-2"
                    >
                      {visibility === 'public' ? (
                        <>
                          <Globe className="h-3 w-3 mr-1" />
                          <span className="hidden xs:inline">Público</span>
                          <span className="xs:hidden">Pub</span>
                        </>
                      ) : (
                        <>
                          <Users className="h-3 w-3 mr-1" />
                          <span className="hidden xs:inline">Amigos</span>
                          <span className="xs:hidden">Ami</span>
                        </>
                      )}
                      <ChevronDown className="h-2.5 w-2.5 ml-1" />
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
                
                <span className="text-xs text-gray-500 flex-shrink-0">
                  {content.length}/500
                </span>
              </div>
              
              <Button
                type="submit"
                disabled={isButtonDisabled}
                className="bg-purple-500 hover:bg-purple-600 text-xs px-3 py-2 flex-shrink-0"
                onClick={() => console.log('🔍 [Button] Clique detectado!')}
              >
                {isLoading ? (
                  <span className="text-xs">...</span>
                ) : (
                  <div className="flex items-center space-x-1">
                    <Send className="h-3 w-3 flex-shrink-0" />
                    <span className="hidden xs:inline text-xs">Publicar</span>
                  </div>
                )}
              </Button>
            </div>
          </div>
        </form>
      </OrkutCardContent>
    </OrkutCard>
  )
}
