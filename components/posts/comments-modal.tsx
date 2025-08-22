'use client'

import { useState, useEffect } from 'react'
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
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MessageCircle, Send, Loader2, Heart, MoreHorizontal, Trash2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Comment {
  id: number
  content: string
  created_at: string
  author: {
    id: string
    display_name: string
    photo_url: string | null
    username: string
  }
}

interface CommentsModalProps {
  postId: number
  commentsCount: number
  onCommentsCountChange?: (count: number) => void
  children: React.ReactNode
}

export function CommentsModal({ 
  postId, 
  commentsCount, 
  onCommentsCountChange, 
  children 
}: CommentsModalProps) {
  const { user, profile } = useAuth()
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingComments, setIsLoadingComments] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const loadComments = async () => {
    setIsLoadingComments(true)
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id,
          content,
          created_at,
          author,
          profiles:author (
            id,
            display_name,
            photo_url,
            username
          )
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true })

      if (error) throw error

      // Transform data to match our interface
      const transformedComments = data?.map(comment => ({
        ...comment,
        author: comment.profiles as any
      })) || []

      setComments(transformedComments)
    } catch (error) {
      console.error('Error loading comments:', error)
      toast.error('Erro ao carregar comentários')
    } finally {
      setIsLoadingComments(false)
    }
  }

  const handleSubmitComment = async () => {
    if (!user || !newComment.trim()) return

    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          author: user.id,
          content: newComment.trim()
        })
        .select(`
          id,
          content,
          created_at,
          author,
          profiles:author (
            id,
            display_name,
            photo_url,
            username
          )
        `)
        .single()

      if (error) throw error

      // Transform and add to comments list
      const newCommentData = {
        ...data,
        author: data.profiles as any
      }

      setComments(prev => [...prev, newCommentData])
      setNewComment('')
      
      // Update comments count in parent
      let newCount = comments.length + 1
      onCommentsCountChange?.(newCount)
      
      // Update comments count in database
      await supabase
        .from('posts')
        .update({ comments_count: newCount })
        .eq('id', postId)

      // Auto-reply do Orky em posts do Orky
      await autoReplyIfOrkyPost(newCommentData)

      toast.success('Comentário adicionado!')
    } catch (error) {
      console.error('Error creating comment:', error)
      toast.error('Erro ao adicionar comentário')
    } finally {
      setIsLoading(false)
    }
  }

  // Gera um texto curto do Orky respondendo ao comentário
  function generateOrkyReplyText(userName: string, original: string) {
    const base = original.slice(0, 120)
    const templates = [
      `Valeu, ${userName}! 🎵 Bora ouvir juntos?`,
      `${userName}, bom demais! Clica pra ouvir ao vivo 🤘`,
      `Boa, ${userName}! A rádio tá rolando agora. 🎧`,
      `Tamo junto, ${userName}! Já deu o play na rádio? 🔊`,
    ]
    return templates[Math.floor(Math.random() * templates.length)] + (base ? `\n\n“${base}${original.length > 120 ? '…' : ''}”` : '')
  }

  async function autoReplyIfOrkyPost(lastUserComment: any) {
    try {
      // Descobrir o autor do post
      const { data: postData, error: postErr } = await supabase
        .from('posts')
        .select('author')
        .eq('id', postId)
        .single()

      if (postErr || !postData) return

      const ORKY_IDS = ['orky-ai-assistant', 'dj-orky-bot']
      const isOrkyPost = ORKY_IDS.includes(postData.author)
      if (!isOrkyPost) return

      // Evitar loop ou resposta ao próprio Orky
      if (ORKY_IDS.includes(lastUserComment.author?.id)) return

      const replyContent = generateOrkyReplyText(lastUserComment.author?.display_name || 'amigo', lastUserComment.content)

      // Tentar salvar o comentário como Orky no banco
      const { data: reply, error: replyErr } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          author: 'orky-ai-assistant',
          content: replyContent,
        })
        .select(`
          id,
          content,
          created_at,
          author,
          profiles:author (
            id,
            display_name,
            photo_url,
            username
          )
        `)
        .single()

      if (replyErr) {
        // Se não der para gravar no banco (permissão), adiciona só no UI como fallback
        setComments(prev => [...prev, {
          id: Date.now(),
          content: replyContent,
          created_at: new Date().toISOString(),
          author: {
            id: 'orky-ai-assistant',
            display_name: 'Orky 🤖',
            photo_url: '/orky-avatar.png',
            username: 'orky'
          }
        } as any])
      } else if (reply) {
        setComments(prev => [...prev, { ...reply, author: reply.profiles as any }])
      }

      // Atualizar contador localmente
      const updatedCount = (onCommentsCountChange ? undefined : undefined) // placeholder to keep types happy
      const newTotal = (comments.length + 2) // usuário + Orky
      onCommentsCountChange?.(newTotal)
      await supabase.from('posts').update({ comments_count: newTotal }).eq('id', postId)
    } catch (e) {
      console.warn('Auto-reply Orky falhou (ignorado):', e)
    }
  }

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm('Tem certeza que deseja excluir este comentário?')) return

    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
        .eq('author', user?.id) // Only allow deleting own comments

      if (error) throw error

      setComments(prev => prev.filter(c => c.id !== commentId))
      
      // Update comments count
      const newCount = comments.length - 1
      onCommentsCountChange?.(newCount)
      
      await supabase
        .from('posts')
        .update({ comments_count: newCount })
        .eq('id', postId)

      toast.success('Comentário excluído!')
    } catch (error) {
      console.error('Error deleting comment:', error)
      toast.error('Erro ao excluir comentário')
    }
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (open && comments.length === 0) {
      loadComments()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <MessageCircle className="h-5 w-5 text-purple-600" />
            <span>Comentários ({comments.length})</span>
          </DialogTitle>
          <DialogDescription>
            Veja o que as pessoas estão falando sobre este post
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Comments List */}
          <ScrollArea className="h-[300px] pr-4">
            {isLoadingComments ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                <span className="ml-2 text-gray-600">Carregando comentários...</span>
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg mb-2">Nenhum comentário ainda</p>
                <p className="text-sm">Seja o primeiro a comentar neste post!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex space-x-3">
                    <Avatar className="h-10 w-10 border-2 border-purple-100">
                      <AvatarImage 
                        src={comment.author?.photo_url || undefined} 
                        alt={comment.author?.display_name || 'User'} 
                      />
                      <AvatarFallback className="bg-purple-500 text-white">
                        {comment.author?.display_name?.charAt(0)?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="bg-purple-50 rounded-lg p-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-800 text-sm">
                              {comment.author?.display_name || 'Usuário'}
                            </h4>
                            <p className="text-xs text-gray-500">
                              @{comment.author?.username || 'unknown'}
                            </p>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(comment.created_at), { 
                                addSuffix: true,
                                locale: ptBR 
                              })}
                            </span>
                            {user?.id === comment.author?.id && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem 
                                    onClick={() => handleDeleteComment(comment.id)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Excluir
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        </div>
                        <p className="text-gray-700 mt-1 text-sm">{comment.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Add Comment Form */}
          {user && profile && (
            <div className="border-t pt-4">
              <div className="flex space-x-3">
                <Avatar className="h-10 w-10 border-2 border-purple-100">
                  <AvatarImage 
                    src={profile.photo_url || undefined} 
                    alt={profile.display_name} 
                  />
                  <AvatarFallback className="bg-purple-500 text-white">
                    {profile.display_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-3">
                  <Textarea
                    placeholder="Escreva um comentário..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="border-purple-200 focus:ring-purple-500 min-h-[80px] resize-none"
                    maxLength={500}
                    disabled={isLoading}
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {newComment.length}/500 caracteres
                    </span>
                    <Button
                      onClick={handleSubmitComment}
                      disabled={!newComment.trim() || isLoading}
                      size="sm"
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Comentar
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
