'use client'

import { useState, useRef } from 'react'
import { useAuth } from '@/contexts/enhanced-auth-context'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Camera, Upload, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface EditProfileModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditProfileModal({ open, onOpenChange }: EditProfileModalProps) {
  const { user, profile, updateProfile } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [formData, setFormData] = useState({
    display_name: profile?.display_name || '',
    bio: profile?.bio || '',
    location: profile?.location || '',
    relationship: profile?.relationship || '',
    birthday: profile?.birthday || ''
  })
  
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handlePhotoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor, selecione apenas arquivos de imagem.')
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('A imagem deve ter no máximo 5MB.')
        return
      }

      setPhotoFile(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadPhoto = async (): Promise<string | null> => {
    if (!photoFile || !user) return null

    setUploadingPhoto(true)
    try {
      // Create unique filename
      const fileExt = photoFile.name.split('.').pop()
      const fileName = `profile-${user.id}-${Date.now()}.${fileExt}`
      const filePath = `profiles/${fileName}`

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, photoFile, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        
        // Fallback: try to use a placeholder or base64
        return photoPreview
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      return urlData.publicUrl
    } catch (error) {
      console.error('Error uploading photo:', error)
      // Return preview as fallback
      return photoPreview
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleSave = async () => {
    if (!user) return

    setLoading(true)
    try {
      let photoUrl = profile?.photo_url

      // Upload photo if selected
      if (photoFile) {
        const uploadedUrl = await uploadPhoto()
        if (uploadedUrl) {
          photoUrl = uploadedUrl
        }
      }

      // Prepare update data
      const updateData = {
        display_name: formData.display_name.trim(),
        bio: formData.bio.trim() || null,
        location: formData.location.trim() || null,
        relationship: formData.relationship || null,
        birthday: formData.birthday || null,
        photo_url: photoUrl
      }

      // Try to update via Supabase first
      try {
        const { error } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('id', user.id)

        if (error) {
          console.error('Supabase update error:', error)
          // Continue with fallback update
        } else {
          toast.success('Perfil atualizado com sucesso!')
        }
      } catch (dbError) {
        console.error('Database error:', dbError)
      }

      // Update local context (fallback)
      if (updateProfile) {
        await updateProfile(updateData)
      }

      // Reset form
      setPhotoFile(null)
      setPhotoPreview(null)
      onOpenChange(false)
      
      toast.success('Perfil atualizado!')
      
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Erro ao atualizar perfil. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const relationshipOptions = [
    { value: 'solteiro', label: 'Solteiro(a)' },
    { value: 'namorando', label: 'Namorando' },
    { value: 'casado', label: 'Casado(a)' },
    { value: 'divorciado', label: 'Divorciado(a)' },
    { value: 'viuvo', label: 'Viúvo(a)' },
    { value: 'complicado', label: 'É complicado' },
    { value: 'procurando', label: 'Procurando alguém' }
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Editar Perfil
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Photo Upload */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <Avatar className="h-24 w-24 border-4 border-purple-200">
                <AvatarImage 
                  src={photoPreview || profile?.photo_url || undefined} 
                  alt="Foto do perfil" 
                />
                <AvatarFallback className="text-2xl">
                  {formData.display_name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <Button
                type="button"
                size="sm"
                className="absolute -bottom-2 -right-2 rounded-full h-8 w-8 p-0"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
              >
                {uploadingPhoto ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoSelect}
              className="hidden"
            />
            
            <p className="text-sm text-gray-600 text-center">
              Clique no ícone para alterar a foto
              <br />
              <span className="text-xs">Máximo 5MB - JPG, PNG ou GIF</span>
            </p>
          </div>

          {/* Form Fields */}
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="display_name">Nome de exibição *</Label>
              <Input
                id="display_name"
                value={formData.display_name}
                onChange={(e) => handleInputChange('display_name', e.target.value)}
                placeholder="Como você quer ser chamado"
                maxLength={50}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Sobre mim</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="Conte um pouco sobre você..."
                maxLength={500}
                rows={3}
              />
              <p className="text-xs text-gray-500">
                {formData.bio.length}/500 caracteres
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Localização</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="Cidade, Estado"
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthday">Data de nascimento</Label>
              <Input
                id="birthday"
                type="date"
                value={formData.birthday}
                onChange={(e) => handleInputChange('birthday', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="relationship">Status de relacionamento</Label>
              <Select
                value={formData.relationship}
                onValueChange={(value) => handleInputChange('relationship', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione seu status" />
                </SelectTrigger>
                <SelectContent>
                  {relationshipOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || !formData.display_name.trim()}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar Alterações'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
