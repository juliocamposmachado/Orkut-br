'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/contexts/enhanced-auth-context'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { OrkutCard, OrkutCardContent, OrkutCardHeader } from '@/components/ui/orkut-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { 
  ArrowLeft,
  Calendar,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Edit,
  Trash,
  Tag,
  User
} from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

interface BlogPost {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string
  featured_image?: string
  status: string
  tags: string[]
  views_count: number
  likes_count: number
  comments_count: number
  created_at: string
  updated_at: string
  profiles: {
    id: string
    display_name: string
    photo_url: string
    username: string
  }
}

export default function BlogPostPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const slug = params?.slug as string
  
  const [post, setPost] = useState<BlogPost | null>(null)
  const [loadingPost, setLoadingPost] = useState(true)
  const [isLiked, setIsLiked] = useState(false)

  useEffect(() => {
    if (loading) return
    
    if (!user) {
      router.push('/login')
      return
    }

    if (slug) {
      loadPost()
    }
  }, [user, loading, router, slug])

  const loadPost = async () => {
    try {
      setLoadingPost(true)
      
      const response = await fetch(`/api/blog/${slug}`)
      const data = await response.json()
      
      if (response.ok) {
        setPost(data.post)
      } else {
        if (response.status === 404) {
          toast.error('Post não encontrado')
          router.push('/blog')
        } else {
          throw new Error(data.error || 'Erro ao carregar post')
        }
      }
    } catch (error) {
      console.error('Erro ao carregar post:', error)
      toast.error('Erro ao carregar post')
      router.push('/blog')
    } finally {
      setLoadingPost(false)
    }
  }

  const handleLike = async () => {
    if (!post) return
    
    try {
      // TODO: Implementar API de likes
      setIsLiked(!isLiked)
      setPost(prev => prev ? {
        ...prev,
        likes_count: isLiked ? prev.likes_count - 1 : prev.likes_count + 1
      } : null)
      
      toast.success(isLiked ? 'Like removido!' : 'Post curtido!')
    } catch (error) {
      console.error('Erro ao curtir post:', error)
      toast.error('Erro ao curtir post')
    }
  }

  const handleShare = async () => {
    const url = window.location.href
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: post?.title,
          text: post?.excerpt,
          url: url
        })
      } catch (error) {
        console.log('Compartilhamento cancelado')
      }
    } else {
      await navigator.clipboard.writeText(url)
      toast.success('Link copiado para área de transferência!')
    }
  }

  const handleDelete = async () => {
    if (!post) return
    
    const confirmDelete = confirm('Tem certeza que deseja deletar este post? Esta ação não pode ser desfeita.')
    
    if (!confirmDelete) return
    
    try {
      const response = await fetch(`/api/blog/${slug}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (response.ok) {
        toast.success('Post deletado com sucesso!')
        router.push('/blog')
      } else {
        throw new Error(data.error || 'Erro ao deletar post')
      }
    } catch (error) {
      console.error('Erro ao deletar post:', error)
      toast.error('Erro ao deletar post')
    }
  }

  const isAuthor = () => {
    return user?.id === post?.profiles?.id
  }

  if (loading || loadingPost) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-purple-600">Carregando post...</p>
        </div>
      </div>
    )
  }

  if (!user || !profile || !post) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <Navbar />
      
      <div className="w-full max-w-4xl mx-auto px-4 py-8">
        {/* Header de Navegação */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="outline"
            onClick={() => router.push('/blog')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Blog
          </Button>
          
          {/* Ações do Autor */}
          {isAuthor() && (
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => router.push(`/blog/${slug}/editar`)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
              <Button
                variant="outline"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleDelete}
              >
                <Trash className="h-4 w-4 mr-2" />
                Deletar
              </Button>
            </div>
          )}
        </div>

        {/* Post Principal */}
        <article>
          <OrkutCard className="mb-6">
            {/* Imagem Destacada */}
            {post.featured_image && (
              <div className="w-full h-64 lg:h-80 overflow-hidden rounded-t-lg">
                <img
                  src={post.featured_image}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            <OrkutCardContent className="p-8">
              {/* Título */}
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-4">
                {post.title}
              </h1>

              {/* Metadados do Post */}
              <div className="flex flex-wrap items-center gap-4 mb-6 pb-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={post.profiles.photo_url} alt={post.profiles.display_name} />
                    <AvatarFallback>
                      {post.profiles.display_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Link
                      href={`/perfil/${post.profiles.username}`}
                      className="font-medium text-gray-800 hover:text-purple-600 transition-colors"
                    >
                      {post.profiles.display_name}
                    </Link>
                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {formatDistanceToNow(new Date(post.created_at), { 
                          addSuffix: true, 
                          locale: ptBR 
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Eye className="h-4 w-4" />
                    <span>{post.views_count} visualizações</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Heart className="h-4 w-4" />
                    <span>{post.likes_count} curtidas</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MessageCircle className="h-4 w-4" />
                    <span>{post.comments_count} comentários</span>
                  </div>
                </div>
              </div>

              {/* Tags */}
              {post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {post.tags.map((tag) => (
                    <Link
                      key={tag}
                      href={`/blog?tag=${encodeURIComponent(tag)}`}
                    >
                      <Badge variant="outline" className="hover:bg-purple-50 cursor-pointer">
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}

              {/* Conteúdo Markdown */}
              <div className="prose prose-lg max-w-none prose-gray prose-headings:text-gray-800 prose-a:text-purple-600 prose-a:hover:text-purple-700 prose-strong:text-gray-800 prose-code:text-purple-600 prose-code:bg-purple-50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-blockquote:border-purple-300 prose-blockquote:bg-purple-50 prose-blockquote:text-purple-800 prose-table:text-sm">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    // Customizar links para abrir em nova aba
                    a: ({ href, children, ...props }) => (
                      <a
                        href={href}
                        target={href?.startsWith('http') ? '_blank' : undefined}
                        rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                        {...props}
                      >
                        {children}
                      </a>
                    ),
                    // Customizar código inline
                    code: ({ inline, children, ...props }) => (
                      inline ? (
                        <code className="bg-purple-100 text-purple-700 px-1 py-0.5 rounded text-sm" {...props}>
                          {children}
                        </code>
                      ) : (
                        <code className="block bg-gray-100 text-gray-800 p-4 rounded-lg overflow-x-auto" {...props}>
                          {children}
                        </code>
                      )
                    ),
                    // Customizar tabelas
                    table: ({ children, ...props }) => (
                      <div className="overflow-x-auto my-6">
                        <table className="min-w-full border border-gray-200 rounded-lg" {...props}>
                          {children}
                        </table>
                      </div>
                    ),
                    th: ({ children, ...props }) => (
                      <th className="bg-purple-50 border border-gray-200 px-4 py-2 text-left font-semibold text-purple-800" {...props}>
                        {children}
                      </th>
                    ),
                    td: ({ children, ...props }) => (
                      <td className="border border-gray-200 px-4 py-2" {...props}>
                        {children}
                      </td>
                    )
                  }}
                >
                  {post.content}
                </ReactMarkdown>
              </div>
            </OrkutCardContent>
          </OrkutCard>

          {/* Ações de Interação */}
          <OrkutCard className="mb-6">
            <OrkutCardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex space-x-4">
                  <Button
                    variant={isLiked ? "default" : "outline"}
                    onClick={handleLike}
                    className={isLiked ? "bg-red-500 hover:bg-red-600" : ""}
                  >
                    <Heart className={`h-4 w-4 mr-2 ${isLiked ? 'fill-current' : ''}`} />
                    {isLiked ? 'Descurtir' : 'Curtir'} ({post.likes_count})
                  </Button>
                  
                  <Button variant="outline">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Comentar ({post.comments_count})
                  </Button>
                </div>

                <Button variant="outline" onClick={handleShare}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Compartilhar
                </Button>
              </div>
            </OrkutCardContent>
          </OrkutCard>

          {/* Sobre o Autor */}
          <OrkutCard>
            <OrkutCardHeader>
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span>Sobre o Autor</span>
              </div>
            </OrkutCardHeader>
            <OrkutCardContent>
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={post.profiles.photo_url} alt={post.profiles.display_name} />
                  <AvatarFallback className="text-xl">
                    {post.profiles.display_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-gray-800">
                    {post.profiles.display_name}
                  </h3>
                  <p className="text-gray-600 mb-2">
                    @{post.profiles.username}
                  </p>
                  <Link href={`/perfil/${post.profiles.username}`}>
                    <Button size="sm" variant="outline">
                      Ver Perfil
                    </Button>
                  </Link>
                </div>
              </div>
            </OrkutCardContent>
          </OrkutCard>
        </article>
      </div>

      <Footer />
    </div>
  )
}
