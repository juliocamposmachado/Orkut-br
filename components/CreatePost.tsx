'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context-fallback'
import { OrkutCard, OrkutCardContent, OrkutCardHeader } from '@/components/ui/orkut-card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { supabase } from '@/lib/supabase'
import { Camera, Image, Smile, Send } from 'lucide-react'

interface CreatePostProps {
  onPostCreated?: () => void
}

export function CreatePost({ onPostCreated }: CreatePostProps) {
  const { user, profile } = useAuth()
  const [content, setContent] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Check if we have valid Supabase configuration
  const hasSupabaseConfig = process.env.NEXT_PUBLIC_SUPABASE_URL && 
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || !user) return

    setIsLoading(true)
    try {
      if (hasSupabaseConfig) {
        // Use real Supabase if configured
        const { data, error } = await supabase
          .from('posts')
          .insert({
            content: content.trim(),
            author: user.id
          })
          .select()

        if (error) {
          throw error
        }
      } else {
        // Use global API endpoint for posts
        console.log('Creating post via global API:', {
          content: content.trim(),
          author: user.id,
          author_name: profile?.display_name
        })
        
        const response = await fetch('/api/posts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: content.trim(),
            author: user.id,
            author_name: profile?.display_name || 'Unknown',
            author_photo: profile?.photo_url,
            visibility: 'public'
          })
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Erro ao criar post')
        }
        
        const result = await response.json()
        console.log('✅ Post criado com sucesso via API global:', result.post)
        
        // Também manter no localStorage para compatibilidade com DJ Orky
        const existingPosts = JSON.parse(localStorage.getItem('orkut_posts') || '[]')
        existingPosts.unshift(result.post)
        localStorage.setItem('orkut_posts', JSON.stringify(existingPosts))
        
        // Dispara evento para o Feed atualizar
        window.dispatchEvent(new CustomEvent('new-post-created', { detail: result.post }))
      }

      setContent('')
      onPostCreated?.()
      alert('Post publicado com sucesso!')
    } catch (error: any) {
      console.error('Error creating post:', error)
      alert(`Erro ao criar post: ${error.message || 'Erro desconhecido'}`)
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
