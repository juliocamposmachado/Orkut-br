'use client'

import { useState, useRef } from 'react'
import { useAuth } from '@/contexts/local-auth-context'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { ImageIcon, MapPin, Smile, Loader2, UserCircle } from 'lucide-react'
import { toast } from 'sonner'
import { MoodSelector } from '@/components/status/mood-selector'
import { AvatarSelector } from '@/components/posts/avatar-selector'
import { type OrkutAvatar } from '@/data/orkut-avatars'

interface CreatePostProps {
  onPostCreated?: () => void
}

export function CreatePost({ onPostCreated }: CreatePostProps) {
  const { user, profile } = useAuth()
  const [content, setContent] = useState('')
  const [isPublishing, setIsPublishing] = useState(false)
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [selectedAvatar, setSelectedAvatar] = useState<OrkutAvatar | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    
    if (files.length === 0) return
    
    // Validate maximum number of images (max 4)
    if (imageFiles.length + files.length > 4) {
      toast.error('Você pode enviar no máximo 4 imagens por post.')
      return
    }
    
    const validFiles: File[] = []
    const newPreviews: string[] = []
    
    files.forEach((file) => {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} não é um arquivo de imagem válido.`)
        return
      }
      
      // Validate file size (max 10MB each)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} deve ter no máximo 10MB.`)
        return
      }
      
      validFiles.push(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        newPreviews.push(e.target?.result as string)
        
        // Update state when all previews are ready
        if (newPreviews.length === validFiles.length) {
          setImageFiles(prev => [...prev, ...validFiles])
          setImagePreviews(prev => [...prev, ...newPreviews])
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const uploadPostImages = async (): Promise<string[]> => {
    if (imageFiles.length === 0 || !user) return []

    const uploadPromises = imageFiles.map(async (imageFile, index) => {
      try {
        // Create unique filename
        const fileExt = imageFile.name.split('.').pop()
        const fileName = `post-${user.id}-${Date.now()}-${index}.${fileExt}`
        const filePath = `posts/${fileName}`

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('post-images')
          .upload(filePath, imageFile, {
            cacheControl: '3600',
            upsert: true
          })

        if (uploadError) {
          console.error('Upload error:', uploadError)
          // Return preview as fallback
          return imagePreviews[index]
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('post-images')
          .getPublicUrl(filePath)

        return urlData.publicUrl
      } catch (error) {
        console.error('Error uploading image:', error)
        // Return preview as fallback
        return imagePreviews[index]
      }
    })

    try {
      return await Promise.all(uploadPromises)
    } catch (error) {
      console.error('Error uploading images:', error)
      return imagePreviews
    }
  }

  const handlePublish = async () => {
    if (!user || !profile || !content.trim()) return

    setIsPublishing(true)
    try {
      let imageUrls: string[] = []

      // Upload images if selected
      if (imageFiles.length > 0) {
        imageUrls = await uploadPostImages()
      }

      // Prepare post data
      const postData = {
        author: user.id,
        content: content.trim(),
        image_urls: imageUrls.length > 0 ? imageUrls : null,
        likes_count: 0,
        comments_count: 0,
        created_at: new Date().toISOString()
      }

      // Use the posts-db API for proper data handling
      try {
        const apiData = {
          content: content.trim(),
          author: profile.id, // SEMPRE usar profile.id (que referencia a tabela profiles)
          author_name: profile.display_name || profile.username || 'Usuário',
          author_photo: profile.photo_url,
          visibility: 'public',
          image_urls: imageUrls.length > 0 ? imageUrls : null,
          is_dj_post: false,
          // Incluir dados do avatar selecionado
          avatar_id: selectedAvatar?.id || null,
          avatar_emoji: selectedAvatar?.emoji || null,
          avatar_name: selectedAvatar?.name || null
        }
        
        // Validação crítica: garantir que temos um profile.id válido
        if (!profile.id) {
          console.error('❌ Profile ID não encontrado!', { profile, user })
          toast.error('Erro: Perfil de usuário não encontrado')
          return
        }
        
        console.log('🔍 Dados sendo enviados para API:', {
          ...apiData,
          profileId: profile.id,
          userId: user.id
        })

        // Get current session to obtain access token
        const { data: { session } } = await supabase.auth.getSession()
        const authToken = session?.access_token

        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        }
        
        // Add authorization token if available
        if (authToken) {
          headers['Authorization'] = `Bearer ${authToken}`
        }

        const response = await fetch('/api/posts-db', {
          method: 'POST',
          headers,
          body: JSON.stringify(apiData)
        })

        const result = await response.json()

        if (result.success) {
          toast.success('Post publicado com sucesso!')
          console.log('Post saved via API:', result.source)
        } else {
          throw new Error(result.error || 'Erro ao publicar post')
        }
      } catch (apiError) {
        console.error('API error:', apiError)
        
        // Fallback: save to localStorage for offline functionality
        try {
          const existingPosts = JSON.parse(localStorage.getItem('offline_posts') || '[]')
          const newPost = {
            id: Date.now(),
            content: content.trim(),
            author: user.id,
            author_name: profile.display_name || profile.username || 'Usuário',
            author_photo: profile.photo_url,
            image_urls: imageUrls,
            likes_count: 0,
            comments_count: 0,
            created_at: new Date().toISOString(),
            author_profile: {
              id: user.id,
              display_name: profile.display_name,
              photo_url: profile.photo_url,
              username: profile.username
            }
          }
          
          existingPosts.unshift(newPost)
          localStorage.setItem('offline_posts', JSON.stringify(existingPosts.slice(0, 50)))
          
          toast.success('Post salvo localmente (modo offline)')
        } catch (storageError) {
          console.error('LocalStorage error:', storageError)
          toast.error('Erro ao publicar post')
        }
      }

      // Reset form
      setContent('')
      setImageFiles([])
      setImagePreviews([])
      setSelectedAvatar(null) // Resetar avatar selecionado
      
      // Notify parent component
      if (onPostCreated) {
        onPostCreated()
      }

      toast.success('Post publicado!')

    } catch (error) {
      console.error('Error publishing post:', error)
      toast.error('Erro ao publicar. Tente novamente.')
    } finally {
      setIsPublishing(false)
    }
  }

  const removeImage = (indexToRemove: number) => {
    setImageFiles(prev => prev.filter((_, index) => index !== indexToRemove))
    setImagePreviews(prev => prev.filter((_, index) => index !== indexToRemove))
    if (fileInputRef.current && imageFiles.length === 1) {
      fileInputRef.current.value = ''
    }
  }

  const removeAllImages = () => {
    setImageFiles([])
    setImagePreviews([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  if (!user || !profile) return null

  return (
    <Card className="border-purple-200">
      <CardContent className="p-4">
        <div className="flex space-x-3">
          <Avatar className="h-10 w-10 border-2 border-purple-200">
            <AvatarImage src={profile.photo_url || undefined} alt={profile.display_name} />
            <AvatarFallback>
              {profile.display_name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-3">
            <Textarea
              placeholder="O que você está pensando?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="border-purple-200 focus:ring-purple-500 min-h-[100px] resize-none"
              maxLength={2000}
              disabled={isPublishing}
            />

            {/* Character count */}
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>{content.length}/2000 caracteres</span>
            </div>

            {/* Images preview */}
            {imagePreviews.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {imagePreviews.length} imagem{imagePreviews.length > 1 ? 's' : ''} selecionada{imagePreviews.length > 1 ? 's' : ''}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="text-red-600 border-red-300 hover:bg-red-50"
                    onClick={removeAllImages}
                  >
                    Remover todas
                  </Button>
                </div>
                
                <div className={`grid gap-3 ${
                  imagePreviews.length === 1 ? 'grid-cols-1' :
                  imagePreviews.length === 2 ? 'grid-cols-2' :
                  'grid-cols-2 md:grid-cols-3'
                }`}>
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full aspect-square object-cover rounded-lg border border-purple-200"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeImage(index)}
                      >
                        ✕
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center justify-between">
              <div className="flex space-x-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="text-purple-700 border-purple-300 hover:bg-purple-50"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isPublishing || imageFiles.length >= 4}
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Foto
                </Button>
                
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="text-purple-700 border-purple-300 hover:bg-purple-50"
                  disabled={isPublishing}
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Local
                </Button>

                <MoodSelector>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="text-purple-700 border-purple-300 hover:bg-purple-50"
                    disabled={isPublishing}
                  >
                    <Smile className="h-4 w-4 mr-2" />
                    Humor
                  </Button>
                </MoodSelector>
                
                <AvatarSelector
                  selectedAvatar={selectedAvatar}
                  onAvatarSelect={setSelectedAvatar}
                >
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className={`border-purple-300 hover:bg-purple-50 ${
                      selectedAvatar ? 'text-purple-700 bg-purple-50' : 'text-purple-700'
                    }`}
                    disabled={isPublishing}
                  >
                    {selectedAvatar ? (
                      <>
                        <span className="text-base mr-2">{selectedAvatar.emoji}</span>
                        Avatar
                      </>
                    ) : (
                      <>
                        <UserCircle className="h-4 w-4 mr-2" />
                        Avatar
                      </>
                    )}
                  </Button>
                </AvatarSelector>
              </div>

              <Button
                onClick={handlePublish}
                disabled={!content.trim() || isPublishing}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Publicando...
                  </>
                ) : (
                  'Publicar'
                )}
              </Button>
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              className="hidden"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
