'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/enhanced-auth-context'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
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
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Plus, 
  Upload, 
  Image as ImageIcon,
  Users,
  Settings,
  Globe,
  Lock,
  UserCheck
} from 'lucide-react'

interface CreateCommunityModalProps {
  onCommunityCreated?: () => void
}

const categories = [
  'Música',
  'Tecnologia', 
  'Jogos',
  'Entretenimento',
  'Esportes',
  'Culinária',
  'Cinema',
  'Turismo',
  'Nostalgia',
  'Arte',
  'Literatura',
  'Ciência',
  'Negócios',
  'Educação',
  'Saúde',
  'Moda',
  'Fotografia',
  'Animais',
  'Viagem',
  'Outros'
]

const privacyOptions = [
  { value: 'public', label: 'Pública', description: 'Qualquer pessoa pode ver e participar', icon: Globe },
  { value: 'private', label: 'Privada', description: 'Apenas membros aprovados podem ver', icon: Lock },
  { value: 'restricted', label: 'Restrita', description: 'Qualquer um vê, mas precisa aprovação para entrar', icon: UserCheck }
]

export function CreateCommunityModal({ onCommunityCreated }: CreateCommunityModalProps) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    privacy: 'public',
    rules: '',
    photo_url: ''
  })

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setImagePreview(result)
        setFormData(prev => ({ ...prev, photo_url: result }))
      }
      reader.readAsDataURL(file)
    }
  }

  const generateDefaultImage = () => {
    // Gerar uma imagem padrão baseada na categoria
    const colors = [
      'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1515169067868-5387ec356754?w=400&h=300&fit=crop'
    ]
    
    const randomImage = colors[Math.floor(Math.random() * colors.length)]
    setFormData(prev => ({ ...prev, photo_url: randomImage }))
    setImagePreview(randomImage)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.description.trim() || !formData.category) {
      toast.error('Por favor, preencha todos os campos obrigatórios')
      return
    }

    setLoading(true)
    
    try {
      const { data, error } = await supabase
        .from('communities')
        .insert({
          name: formData.name.trim(),
          description: formData.description.trim(),
          category: formData.category,
          photo_url: formData.photo_url || `https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=300&fit=crop&q=80&auto=format`,
          owner: user?.id,
          members_count: 1, // O criador é o primeiro membro
          privacy: formData.privacy,
          rules: formData.rules.trim() || 'Seja respeitoso e mantenha as discussões relevantes ao tema da comunidade.',
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      // Adicionar o criador como membro da comunidade
      await supabase
        .from('community_members')
        .insert({
          community_id: data.id,
          profile_id: user?.id,
          role: 'owner',
          joined_at: new Date().toISOString()
        })

      toast.success(`🎉 Comunidade "${formData.name}" criada com sucesso!`)
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        category: '',
        privacy: 'public',
        rules: '',
        photo_url: ''
      })
      setImagePreview(null)
      setOpen(false)
      
      // Callback para recarregar as comunidades
      onCommunityCreated?.()
      
    } catch (error) {
      console.error('Error creating community:', error)
      toast.error('Erro ao criar comunidade. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-purple-500 hover:bg-purple-600">
          <Plus className="h-4 w-4 mr-2" />
          Criar Comunidade
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-purple-600" />
            <span>Criar Nova Comunidade</span>
          </DialogTitle>
          <DialogDescription>
            Crie uma comunidade para reunir pessoas com interesses similares!
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nome da Comunidade */}
          <div>
            <Label htmlFor="name" className="text-sm font-medium text-gray-700">
              Nome da Comunidade *
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Fãs do Orkut Original"
              className="mt-1"
              maxLength={50}
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.name.length}/50 caracteres
            </p>
          </div>

          {/* Descrição */}
          <div>
            <Label htmlFor="description" className="text-sm font-medium text-gray-700">
              Descrição *
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descreva do que se trata sua comunidade..."
              className="mt-1 min-h-[80px]"
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.description.length}/500 caracteres
            </p>
          </div>

          {/* Categoria */}
          <div>
            <Label className="text-sm font-medium text-gray-700">
              Categoria *
            </Label>
            <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Imagem */}
          <div>
            <Label className="text-sm font-medium text-gray-700">
              Imagem da Comunidade
            </Label>
            
            <div className="mt-2 space-y-3">
              {imagePreview ? (
                <div className="relative">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="w-full h-32 object-cover rounded-lg border"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setImagePreview(null)
                      setFormData(prev => ({ ...prev, photo_url: '' }))
                    }}
                    className="absolute top-2 right-2 bg-white/90"
                  >
                    Remover
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <ImageIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-3">
                    Adicione uma imagem para sua comunidade
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('image-upload')?.click()}
                    >
                      <Upload className="h-4 w-4 mr-1" />
                      Upload
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={generateDefaultImage}
                    >
                      Usar Padrão
                    </Button>
                  </div>
                </div>
              )}
              
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Privacidade */}
          <div>
            <Label className="text-sm font-medium text-gray-700">
              Privacidade
            </Label>
            <div className="mt-2 space-y-2">
              {privacyOptions.map(option => {
                const Icon = option.icon
                return (
                  <label 
                    key={option.value}
                    className={`flex items-start space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                      formData.privacy === option.value 
                        ? 'border-purple-500 bg-purple-50' 
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="privacy"
                      value={option.value}
                      checked={formData.privacy === option.value}
                      onChange={(e) => setFormData(prev => ({ ...prev, privacy: e.target.value }))}
                      className="mt-1"
                    />
                    <Icon className="h-5 w-5 text-gray-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-800">{option.label}</p>
                      <p className="text-sm text-gray-600">{option.description}</p>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Regras */}
          <div>
            <Label htmlFor="rules" className="text-sm font-medium text-gray-700">
              Regras da Comunidade (opcional)
            </Label>
            <Textarea
              id="rules"
              value={formData.rules}
              onChange={(e) => setFormData(prev => ({ ...prev, rules: e.target.value }))}
              placeholder="Defina as regras para manter um ambiente saudável..."
              className="mt-1 min-h-[60px]"
              maxLength={1000}
            />
          </div>

          {/* Botões */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.name.trim() || !formData.description.trim() || !formData.category}
              className="bg-purple-500 hover:bg-purple-600"
            >
              {loading ? 'Criando...' : 'Criar Comunidade'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
