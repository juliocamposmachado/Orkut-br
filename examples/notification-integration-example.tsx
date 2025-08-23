// Este é um arquivo de exemplo mostrando como integrar o sistema de notificações
// com seus componentes existentes de posts, curtidas, comentários, etc.

'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/enhanced-auth-context'
import { supabase } from '@/lib/supabase'
import { notificationService } from '@/lib/notification-service'
import { Heart, MessageCircle, Share } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface Post {
  id: number
  author: string
  author_name: string
  author_photo: string | null
  content: string
  likes_count: number
  comments_count: number
}

interface PostActionsProps {
  post: Post
  onUpdate?: (updatedPost: Post) => void
}

// Exemplo de componente de ações do post integrado com notificações
export function PostActionsExample({ post, onUpdate }: PostActionsProps) {
  const { user, profile } = useAuth()
  const [isLiking, setIsLiking] = useState(false)
  const [isSharing, setIsSharing] = useState(false)

  // Função para curtir um post
  const handleLike = async () => {
    if (!user || !profile || isLiking) return
    
    try {
      setIsLiking(true)

      // 1. Atualizar o post no banco
      const newLikesCount = post.likes_count + 1
      const { error: updateError } = await supabase
        .from('posts')
        .update({ likes_count: newLikesCount })
        .eq('id', post.id)

      if (updateError) {
        toast.error('Erro ao curtir post')
        return
      }

      // 2. Se não é o próprio autor, enviar notificação
      if (post.author !== user.id) {
        // 2a. Inserir notificação no banco (para tempo real)
        const { error: notificationError } = await supabase
          .from('notifications')
          .insert({
            profile_id: post.author, // ID do autor do post
            type: 'like',
            payload: {
              from_user: {
                id: user.id,
                display_name: profile.display_name,
                photo_url: profile.photo_url,
                username: profile.username
              },
              post: {
                id: post.id,
                content: post.content
              },
              action_url: `/post/${post.id}`
            },
            read: false
          })

        if (notificationError) {
          console.error('Error creating notification:', notificationError)
        }

        // 2b. Enviar notificação push imediata (se o usuário estiver online)
        await notificationService.sendLikeNotification(
          {
            id: user.id,
            name: profile.display_name,
            photo: profile.photo_url,
            username: profile.username
          },
          {
            id: post.id,
            content: post.content
          }
        )
      }

      // 3. Atualizar UI local
      const updatedPost = { ...post, likes_count: newLikesCount }
      onUpdate?.(updatedPost)
      
      toast.success('Post curtido! ❤️')

    } catch (error) {
      console.error('Error liking post:', error)
      toast.error('Erro ao curtir post')
    } finally {
      setIsLiking(false)
    }
  }

  // Função para compartilhar um post
  const handleShare = async () => {
    if (!user || !profile || isSharing) return
    
    try {
      setIsSharing(true)

      // 1. Lógica para compartilhar (exemplo: criar novo post ou adicionar à timeline)
      // ... sua lógica de compartilhamento aqui ...

      // 2. Se não é o próprio autor, enviar notificação
      if (post.author !== user.id) {
        // 2a. Inserir notificação no banco
        const { error: notificationError } = await supabase
          .from('notifications')
          .insert({
            profile_id: post.author,
            type: 'share',
            payload: {
              from_user: {
                id: user.id,
                display_name: profile.display_name,
                photo_url: profile.photo_url,
                username: profile.username
              },
              post: {
                id: post.id,
                content: post.content
              },
              action_url: `/perfil/${profile.username}`
            },
            read: false
          })

        if (notificationError) {
          console.error('Error creating share notification:', notificationError)
        }

        // 2b. Enviar notificação push
        await notificationService.sendShareNotification(
          {
            id: user.id,
            name: profile.display_name,
            photo: profile.photo_url,
            username: profile.username
          },
          {
            id: post.id,
            content: post.content
          }
        )
      }

      toast.success('Post compartilhado! 🔄')

    } catch (error) {
      console.error('Error sharing post:', error)
      toast.error('Erro ao compartilhar post')
    } finally {
      setIsSharing(false)
    }
  }

  // Função para comentar (exemplo simplificado)
  const handleComment = async (commentText: string) => {
    if (!user || !profile || !commentText.trim()) return
    
    try {
      // 1. Adicionar comentário ao banco
      // ... sua lógica de comentário aqui ...

      // 2. Se não é o próprio autor, enviar notificação
      if (post.author !== user.id) {
        // 2a. Inserir notificação no banco
        const { error: notificationError } = await supabase
          .from('notifications')
          .insert({
            profile_id: post.author,
            type: 'comment',
            payload: {
              from_user: {
                id: user.id,
                display_name: profile.display_name,
                photo_url: profile.photo_url,
                username: profile.username
              },
              post: {
                id: post.id,
                content: post.content
              },
              comment: commentText,
              action_url: `/post/${post.id}#comments`
            },
            read: false
          })

        if (notificationError) {
          console.error('Error creating comment notification:', notificationError)
        }

        // 2b. Enviar notificação push
        await notificationService.sendCommentNotification(
          {
            id: user.id,
            name: profile.display_name,
            photo: profile.photo_url,
            username: profile.username
          },
          {
            id: post.id,
            content: post.content
          },
          commentText
        )
      }

      toast.success('Comentário adicionado! 💬')

    } catch (error) {
      console.error('Error adding comment:', error)
      toast.error('Erro ao adicionar comentário')
    }
  }

  return (
    <div className="flex items-center space-x-4 p-4 border-t">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleLike}
        disabled={isLiking}
        className="flex items-center space-x-2"
      >
        <Heart className="h-4 w-4" />
        <span>{post.likes_count}</span>
      </Button>

      <Button
        variant="ghost"
        size="sm"
        className="flex items-center space-x-2"
      >
        <MessageCircle className="h-4 w-4" />
        <span>{post.comments_count}</span>
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={handleShare}
        disabled={isSharing}
        className="flex items-center space-x-2"
      >
        <Share className="h-4 w-4" />
        <span>Compartilhar</span>
      </Button>
    </div>
  )
}

// Exemplo de como usar em um componente de post
export function ExamplePostComponent({ post }: { post: Post }) {
  const [currentPost, setCurrentPost] = useState(post)

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-4">
        <h3 className="font-semibold">{post.author_name}</h3>
        <p className="text-gray-600 mt-2">{post.content}</p>
      </div>
      
      <PostActionsExample 
        post={currentPost} 
        onUpdate={setCurrentPost}
      />
    </div>
  )
}

// Exemplo de função helper para solicitações de amizade
export const sendFriendRequestNotification = async (
  targetUserId: string,
  fromUser: { id: string; display_name: string; photo_url: string | null; username: string }
) => {
  try {
    // 1. Inserir notificação no banco
    const { error } = await supabase
      .from('notifications')
      .insert({
        profile_id: targetUserId,
        type: 'friend_request',
        payload: {
          from_user: fromUser,
          action_url: `/perfil/${fromUser.username}`
        },
        read: false
      })

    if (error) {
      console.error('Error creating friend request notification:', error)
      return
    }

    // 2. Enviar notificação push imediata
    await notificationService.sendFriendRequestNotification({
      id: fromUser.id,
      name: fromUser.display_name,
      photo: fromUser.photo_url,
      username: fromUser.username
    })

  } catch (error) {
    console.error('Error sending friend request notification:', error)
  }
}

/*
  INSTRUÇÕES DE INTEGRAÇÃO:
  
  1. Importe estes exemplos nos seus componentes reais de posts
  2. Adapte as funções para sua estrutura de dados específica
  3. Certifique-se de que o NotificationProvider está no seu layout raiz
  4. Configure as variáveis do Supabase se ainda não fez
  5. Teste as notificações na página /configuracoes
  
  EXEMPLO DE USO COMPLETO:
  
  // No seu componente de feed
  import { PostActionsExample, sendFriendRequestNotification } from '@/examples/notification-integration-example'
  
  // Use as funções helper quando ações acontecem
  const onFriendRequest = () => {
    sendFriendRequestNotification(targetUser.id, currentUser)
  }
*/
