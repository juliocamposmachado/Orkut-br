'use client'

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { OrkutCard, OrkutCardContent, OrkutCardHeader } from "@/components/ui/orkut-card"
import { Button } from "@/components/ui/button"
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { MessageCircle, ThumbsUp, Star, Share2 } from "lucide-react"

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
  shares_count?: number
}

interface PostCardProps {
  post: Post
}

export function PostCard({ post }: PostCardProps) {
  const timeAgo = formatDistanceToNow(new Date(post.created_at), {
    addSuffix: true,
    locale: ptBR
  })

  // Calcular nível de engajamento (0-100)
  const totalEngagement = (post.likes_count || 0) + (post.comments_count || 0) + (post.shares_count || 0)
  const engagementLevel = Math.min(100, totalEngagement * 2) // Cada interação vale 2 pontos, máximo 100
  
  // Definir cor do termômetro baseado no nível
  const getEngagementColor = (level: number) => {
    if (level < 20) return 'from-gray-300 to-gray-400' // Muito baixo - Cinza
    if (level < 40) return 'from-blue-400 to-blue-500' // Baixo - Azul
    if (level < 60) return 'from-green-400 to-green-500' // Médio - Verde
    if (level < 80) return 'from-yellow-400 to-orange-500' // Alto - Amarelo/Laranja
    return 'from-red-500 to-pink-600' // Muito alto - Vermelho/Rosa
  }
  
  // Definir texto do nível
  const getEngagementLabel = (level: number) => {
    if (level < 20) return 'Baixo'
    if (level < 40) return 'Moderado'
    if (level < 60) return 'Bom'
    if (level < 80) return 'Alto'
    return 'Viral!'
  }

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
        
        {/* Termômetro de Engajamento */}
        <div className="mt-4 mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-600">Engajamento</span>
            <span className={`text-xs font-bold ${
              engagementLevel >= 80 ? 'text-red-600' :
              engagementLevel >= 60 ? 'text-orange-600' :
              engagementLevel >= 40 ? 'text-green-600' :
              engagementLevel >= 20 ? 'text-blue-600' : 'text-gray-500'
            }`}>
              {getEngagementLabel(engagementLevel)}
            </span>
          </div>
          
          {/* Barra do termômetro */}
          <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full bg-gradient-to-r ${getEngagementColor(engagementLevel)} transition-all duration-500 ease-out rounded-full relative`}
              style={{ width: `${engagementLevel}%` }}
            >
              {/* Efeito de brilho quando alto engajamento */}
              {engagementLevel >= 60 && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
              )}
            </div>
            
            {/* Indicador de temperatura */}
            {engagementLevel > 0 && (
              <div 
                className="absolute top-1/2 transform -translate-y-1/2 w-1 h-4 bg-white border border-gray-400 rounded-full shadow-sm transition-all duration-500"
                style={{ left: `${Math.max(2, engagementLevel - 1)}%` }}
              />
            )}
          </div>
          
          {/* Labels das seções */}
          <div className="flex justify-between mt-1 px-1">
            <span className="text-[10px] text-gray-400">❄️</span>
            <span className="text-[10px] text-gray-400">🔥</span>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 text-gray-600">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" className="flex items-center space-x-1 hover:text-blue-600 transition-colors">
              <ThumbsUp className="h-4 w-4" />
              <span>{post.likes_count || 0}</span>
            </Button>
            <Button variant="ghost" size="sm" className="flex items-center space-x-1 hover:text-green-600 transition-colors">
              <MessageCircle className="h-4 w-4" />
              <span>{post.comments_count || 0}</span>
            </Button>
            <Button variant="ghost" size="sm" className="flex items-center space-x-1 hover:text-purple-600 transition-colors">
              <Share2 className="h-4 w-4" />
              <span>{post.shares_count || 0}</span>
            </Button>
          </div>
          
          {/* Badge de engajamento para posts virais */}
          {engagementLevel >= 80 && (
            <div className="flex items-center space-x-1 bg-gradient-to-r from-red-500 to-pink-600 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
              <span>🔥</span>
              <span>VIRAL</span>
            </div>
          )}
        </div>
      </OrkutCardContent>
    </OrkutCard>
  )
}
