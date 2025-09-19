'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/enhanced-auth-context'
import { supabase } from '@/lib/supabase'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Share, 
  Copy, 
  MessageCircle, 
  Mail, 
  Facebook, 
  Twitter,
  Linkedin,
  Link2,
  Check,
  RefreshCw,
  Loader2,
  Users
} from 'lucide-react'
import { toast } from 'sonner'

interface ShareModalProps {
  postId: number
  postContent: string
  postAuthor: {
    id: string
    display_name: string
    photo_url: string | null
    username: string
  }
  onPostShared?: () => void
  children: React.ReactNode
}

export function ShareModal({ 
  postId, 
  postContent, 
  postAuthor,
  onPostShared,
  children 
}: ShareModalProps) {
  const { user, profile } = useAuth()
  const [copied, setCopied] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [shareComment, setShareComment] = useState('')
  const [isReposting, setIsReposting] = useState(false)

  const postUrl = `${window.location.origin}/posts/${postId}`
  const shareText = `Confira este post do ${postAuthor.display_name}: "${postContent.slice(0, 100)}${postContent.length > 100 ? '...' : ''}"`

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(postUrl)
      setCopied(true)
      toast.success('Link copiado para a área de transferência!')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Erro ao copiar link')
    }
  }

  const shareOptions = [
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      color: 'bg-green-500 hover:bg-green-600',
      url: `https://wa.me/?text=${encodeURIComponent(`${shareText}\n\n${postUrl}`)}`
    },
    {
      name: 'Facebook',
      icon: Facebook,
      color: 'bg-blue-600 hover:bg-blue-700',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`
    },
    {
      name: 'Twitter',
      icon: Twitter,
      color: 'bg-sky-500 hover:bg-sky-600',
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(postUrl)}`
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      color: 'bg-blue-700 hover:bg-blue-800',
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl)}`
    },
    {
      name: 'Email',
      icon: Mail,
      color: 'bg-gray-600 hover:bg-gray-700',
      url: `mailto:?subject=${encodeURIComponent(`Post do ${postAuthor.display_name}`)}&body=${encodeURIComponent(`${shareText}\n\n${postUrl}`)}`
    }
  ]

  const handleRepost = async () => {
    if (!user || !profile) return

    setIsReposting(true)
    try {
      const repostData = {
        author: user.id,
        content: shareComment.trim() || `${profile.display_name} compartilhou o post de ${postAuthor.display_name}:`,
        original_post_id: postId,
        post_type: 'repost',
        likes_count: 0,
        comments_count: 0,
        created_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('posts')
        .insert(repostData)
        .select()
        .single()

      if (error) {
        console.warn('Supabase repost error:', error)
        // Continue with fallback
      }

      // Fallback: save to localStorage
      const existingPosts = JSON.parse(localStorage.getItem('offline_posts') || '[]')
      const newRepost = {
        id: Date.now(),
        ...repostData,
        author: {
          id: user.id,
          display_name: profile.display_name,
          photo_url: profile.photo_url,
          username: profile.username
        },
        original_post: {
          id: postId,
          content: postContent,
          author: postAuthor
        }
      }
      
      existingPosts.unshift(newRepost)
      localStorage.setItem('offline_posts', JSON.stringify(existingPosts.slice(0, 50)))

      toast.success('Post compartilhado no seu feed!')
      setIsOpen(false)
      setShareComment('')
      
      if (onPostShared) {
        onPostShared()
      }
      
    } catch (error) {
      console.error('Error reposting:', error)
      toast.error('Erro ao compartilhar post')
    } finally {
      setIsReposting(false)
    }
  }

  const handleShareClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer')
    toast.success('Abrindo opção de compartilhamento...')
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Share className="h-5 w-5 text-purple-600" />
            <span>Compartilhar Post</span>
          </DialogTitle>
          <DialogDescription>
            Escolha como você quer compartilhar este post
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="repost" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="repost" className="flex items-center space-x-2">
              <RefreshCw className="h-4 w-4" />
              <span>Repostar</span>
            </TabsTrigger>
            <TabsTrigger value="external" className="flex items-center space-x-2">
              <Share className="h-4 w-4" />
              <span>Redes Sociais</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="repost" className="space-y-4">
            {/* Original Post Preview */}
            <Card className="border-2 border-purple-100 bg-purple-50/30">
              <CardContent className="p-4">
                <div className="flex space-x-3">
                  <Avatar className="h-10 w-10 border-2 border-purple-200">
                    <AvatarImage src={postAuthor.photo_url || undefined} alt={postAuthor.display_name} />
                    <AvatarFallback className="bg-purple-500 text-white">
                      {postAuthor.display_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-semibold text-gray-800">
                        {postAuthor.display_name}
                      </h4>
                      <span className="text-xs text-gray-500">@{postAuthor.username}</span>
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {postContent.length > 200 
                        ? `${postContent.substring(0, 200)}...` 
                        : postContent
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Repost Comment */}
            {user && profile && (
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Avatar className="h-8 w-8 border border-purple-200">
                    <AvatarImage src={profile.photo_url || undefined} alt={profile.display_name} />
                    <AvatarFallback className="bg-purple-500 text-white text-sm">
                      {profile.display_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-gray-600">
                    Adicione um comentário ao compartilhar (opcional)
                  </span>
                </div>
                <Textarea
                  placeholder="O que você pensa sobre este post?"
                  value={shareComment}
                  onChange={(e) => setShareComment(e.target.value)}
                  className="border-purple-200 focus:ring-purple-500 min-h-[80px] resize-none"
                  maxLength={500}
                  disabled={isReposting}
                />
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>{shareComment.length}/500 caracteres</span>
                </div>
              </div>
            )}

            {/* Repost Button */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => setIsOpen(false)}
                disabled={isReposting}
              >
                Cancelar
              </Button>
              
              <Button
                onClick={handleRepost}
                disabled={isReposting || !user}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isReposting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Compartilhando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Compartilhar no Feed
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="external" className="space-y-6">
            {/* Post Preview */}
            <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-400">
              <p className="text-sm text-gray-700 mb-2">
                <strong>{postAuthor.display_name}:</strong>
              </p>
              <p className="text-sm text-gray-600 italic">
                "{postContent.slice(0, 150)}{postContent.length > 150 ? '...' : ''}"
              </p>
            </div>

          {/* Copy Link */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-800 flex items-center">
              <Link2 className="h-4 w-4 mr-2" />
              Link do Post
            </h3>
            <div className="flex space-x-2">
              <Input
                value={postUrl}
                readOnly
                className="flex-1 text-sm bg-gray-50"
              />
              <Button
                onClick={handleCopyLink}
                size="sm"
                variant="outline"
                className="flex items-center space-x-1"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    <span>Copiar</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Share Options */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-800">
              Compartilhar em:
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {shareOptions.map((option) => (
                <Button
                  key={option.name}
                  onClick={() => handleShareClick(option.url)}
                  className={`${option.color} text-white flex items-center space-x-2 justify-start`}
                  size="sm"
                >
                  <option.icon className="h-4 w-4" />
                  <span>{option.name}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Native Share (if available) */}
            {typeof navigator !== 'undefined' && navigator.share && (
            <div className="pt-4 border-t">
              <Button
                onClick={async () => {
                  try {
                    await navigator.share({
                      title: `Post do ${postAuthor.display_name}`,
                      text: shareText,
                      url: postUrl,
                    })
                    toast.success('Post compartilhado!')
                  } catch (error) {
                    if ((error as Error).name !== 'AbortError') {
                      toast.error('Erro ao compartilhar')
                    }
                  }
                }}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                size="sm"
              >
                <Share className="h-4 w-4 mr-2" />
                Usar Compartilhamento do Sistema
              </Button>
            </div>
          )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
