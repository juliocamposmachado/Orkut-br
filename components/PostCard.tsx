'use client'

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { OrkutCard, OrkutCardContent, OrkutCardHeader } from "@/components/ui/orkut-card"
import { Button } from "@/components/ui/button"
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { MessageCircle, ThumbsUp, Star } from "lucide-react"

export interface Post {
  id: number | string
  content: string
  author: string
  author_name: string
  author_photo: string | null
  visibility: 'public' | 'friends'
  likes_count: number
  comments_count: number
  created_at: string
  is_dj_post?: boolean
}

interface PostCardProps {
  post: Post
}

export function PostCard({ post }: PostCardProps) {
  const timeAgo = formatDistanceToNow(new Date(post.created_at), {
    addSuffix: true,
    locale: ptBR
  })

  return (
    <OrkutCard className={`mb-4 ${post.is_dj_post ? 'border-2 border-purple-300 shadow-[0_0_0_3px_rgba(168,85,247,0.15)]' : ''}`}>
      <OrkutCardHeader>
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={post.author_photo || undefined} alt={post.author_name} />
            <AvatarFallback>{post.author_name.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
               <h3 className="font-medium text-gray-800">{post.author_name}</h3>
               {post.is_dj_post && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                    <Star className="h-3 w-3 text-purple-700" /> DJ Orky Oficial
                  </span>
               )}
            </div>
            <p className="text-sm text-gray-600">{timeAgo}</p>
          </div>
        </div>
      </OrkutCardHeader>
      <OrkutCardContent>
        <p className="text-gray-800 whitespace-pre-wrap">{post.content}</p>
        {post.is_dj_post && (
          <div className="mt-3">
            <button
              onClick={() => window.open('https://radiotatuapefm.radiostream321.com/', '_blank', 'noopener,noreferrer')}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-sm font-semibold py-2 px-3 rounded-lg transition-all shadow"
            >
              Ouvir a rádio ao vivo
            </button>
          </div>
        )}
        <div className="flex items-center justify-between mt-4 text-gray-600">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" className="flex items-center space-x-1">
              <ThumbsUp className="h-4 w-4" />
              <span>{post.likes_count}</span>
            </Button>
            <Button variant="ghost" size="sm" className="flex items-center space-x-1">
              <MessageCircle className="h-4 w-4" />
              <span>{post.comments_count}</span>
            </Button>
          </div>
        </div>
      </OrkutCardContent>
    </OrkutCard>
  )
}
