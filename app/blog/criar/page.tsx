'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/enhanced-auth-context'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { OrkutCard, OrkutCardContent, OrkutCardHeader } from '@/components/ui/orkut-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { 
  Save,
  Eye,
  ArrowLeft,
  Image as ImageIcon,
  Tag,
  X
} from 'lucide-react'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default function CreatePostPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    featured_image: '',
    status: 'draft' as 'draft' | 'published',
    tags: [] as string[]
  })
  const [newTag, setNewTag] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPreview, setIsPreview] = useState(false)

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addTag = () => {
    const tag = newTag.trim().toLowerCase()
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }))
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const handleSubmit = async (isDraft: boolean = false) => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Título e conteúdo são obrigatórios')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/blog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          status: isDraft ? 'draft' : 'published',
          excerpt: formData.excerpt || formData.content.substring(0, 200) + '...'
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(isDraft ? 'Rascunho salvo com sucesso!' : 'Post publicado com sucesso!')
        router.push(`/blog/${data.post.slug}`)
      } else {
        throw new Error(data.error || 'Erro ao salvar post')
      }
    } catch (error) {
      console.error('Erro ao salvar post:', error)
      toast.error('Erro ao salvar post')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-purple-600">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!user || !profile) {
    router.push('/login')
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <Navbar />
      
      <div className="w-full max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <Button
            variant="outline"
            onClick={() => router.push('/blog')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Blog
          </Button>
          
          <h1 className="text-3xl font-bold text-gray-800">
            Criar Novo Post
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulário Principal */}
          <div className="lg:col-span-2 space-y-6">
            <OrkutCard>
              <OrkutCardHeader>
                <h2 className="text-lg font-semibold">Conteúdo do Post</h2>
              </OrkutCardHeader>
              <OrkutCardContent className="space-y-4">
                {/* Título */}
                <div>
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    placeholder="Digite o título do seu post..."
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="mt-1"
                  />
                </div>

                {/* Resumo/Excerpt */}
                <div>
                  <Label htmlFor="excerpt">Resumo</Label>
                  <Textarea
                    id="excerpt"
                    placeholder="Um resumo curto do seu post (opcional - será gerado automaticamente se não preenchido)"
                    value={formData.excerpt}
                    onChange={(e) => handleInputChange('excerpt', e.target.value)}
                    rows={2}
                    className="mt-1"
                  />
                </div>

                {/* Conteúdo */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="content">Conteúdo *</Label>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsPreview(!isPreview)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      {isPreview ? 'Editar' : 'Preview'}
                    </Button>
                  </div>
                  
                  {isPreview ? (
                    <div className="min-h-[300px] p-4 border rounded-lg bg-white prose max-w-none">
                      <div dangerouslySetInnerHTML={{ 
                        __html: formData.content.replace(/\n/g, '<br>') 
                      }} />
                    </div>
                  ) : (
                    <Textarea
                      id="content"
                      placeholder="Escreva o conteúdo do seu post aqui..."
                      value={formData.content}
                      onChange={(e) => handleInputChange('content', e.target.value)}
                      rows={15}
                      className="mt-1 font-mono"
                    />
                  )}
                </div>
              </OrkutCardContent>
            </OrkutCard>
          </div>

          {/* Sidebar com Configurações */}
          <div className="space-y-6">
            {/* Ações */}
            <OrkutCard>
              <OrkutCardHeader>
                <h3 className="font-semibold">Ações</h3>
              </OrkutCardHeader>
              <OrkutCardContent className="space-y-3">
                <Button
                  onClick={() => handleSubmit(true)}
                  disabled={isSubmitting}
                  variant="outline"
                  className="w-full"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSubmitting ? 'Salvando...' : 'Salvar Rascunho'}
                </Button>
                
                <Button
                  onClick={() => handleSubmit(false)}
                  disabled={isSubmitting}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  {isSubmitting ? 'Publicando...' : 'Publicar Post'}
                </Button>
              </OrkutCardContent>
            </OrkutCard>

            {/* Status */}
            <OrkutCard>
              <OrkutCardHeader>
                <h3 className="font-semibold">Status</h3>
              </OrkutCardHeader>
              <OrkutCardContent>
                <Select
                  value={formData.status}
                  onValueChange={(value: 'draft' | 'published') => 
                    handleInputChange('status', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Rascunho</SelectItem>
                    <SelectItem value="published">Publicado</SelectItem>
                  </SelectContent>
                </Select>
              </OrkutCardContent>
            </OrkutCard>

            {/* Imagem Destacada */}
            <OrkutCard>
              <OrkutCardHeader>
                <div className="flex items-center space-x-2">
                  <ImageIcon className="h-4 w-4" />
                  <h3 className="font-semibold">Imagem Destacada</h3>
                </div>
              </OrkutCardHeader>
              <OrkutCardContent>
                <Input
                  placeholder="URL da imagem destacada"
                  value={formData.featured_image}
                  onChange={(e) => handleInputChange('featured_image', e.target.value)}
                />
                {formData.featured_image && (
                  <div className="mt-3">
                    <img
                      src={formData.featured_image}
                      alt="Preview"
                      className="w-full h-32 object-cover rounded border"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  </div>
                )}
              </OrkutCardContent>
            </OrkutCard>

            {/* Tags */}
            <OrkutCard>
              <OrkutCardHeader>
                <div className="flex items-center space-x-2">
                  <Tag className="h-4 w-4" />
                  <h3 className="font-semibold">Tags</h3>
                </div>
              </OrkutCardHeader>
              <OrkutCardContent className="space-y-3">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Adicionar tag..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    className="flex-1"
                  />
                  <Button size="sm" onClick={addTag}>
                    +
                  </Button>
                </div>
                
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="flex items-center space-x-1">
                        <span>{tag}</span>
                        <button
                          onClick={() => removeTag(tag)}
                          className="ml-1 hover:text-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </OrkutCardContent>
            </OrkutCard>

            {/* Dicas */}
            <OrkutCard>
              <OrkutCardHeader>
                <h3 className="font-semibold">💡 Dicas</h3>
              </OrkutCardHeader>
              <OrkutCardContent className="text-sm text-gray-600 space-y-2">
                <p>• Use um título descritivo e atrativo</p>
                <p>• Adicione tags relevantes para ajudar na busca</p>
                <p>• Uma imagem destacada torna o post mais atrativo</p>
                <p>• Salve como rascunho para editar depois</p>
                <p>• Use quebras de linha para facilitar a leitura</p>
              </OrkutCardContent>
            </OrkutCard>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
