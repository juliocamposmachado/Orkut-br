'use client'

import React, { useState } from 'react';
import { OrkutCard, OrkutCardContent, OrkutCardHeader } from '@/components/ui/orkut-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Plus, 
  Edit3, 
  Trash2, 
  Upload,
  Eye,
  EyeOff,
  Folder,
  Image,
  Save,
  X
} from 'lucide-react';

interface Photo {
  id: number;
  url: string;
  title: string;
  description?: string;
  uploadedAt: string;
  views: number;
  likes: number;
  comments: number;
}

interface Gallery {
  id: number;
  title: string;
  description?: string;
  photos: Photo[];
  coverPhoto?: string;
  createdAt?: string;
  isPrivate?: boolean;
}

interface UpdateGalleriesProps {
  galleries: Gallery[];
  userId: string;
  onUpdateGallery?: (gallery: Gallery) => void;
  onCreateGallery?: (gallery: Partial<Gallery>) => void;
  onDeleteGallery?: (galleryId: number) => void;
  onAddPhotoToGallery?: (galleryId: number, photos: File[]) => void;
}

const UpdateGalleries: React.FC<UpdateGalleriesProps> = ({
  galleries,
  userId,
  onUpdateGallery,
  onCreateGallery,
  onDeleteGallery,
  onAddPhotoToGallery
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingGallery, setEditingGallery] = useState<number | null>(null);
  const [newGallery, setNewGallery] = useState({
    title: '',
    description: '',
    isPrivate: false
  });
  
  // Função para criar nova galeria
  const handleCreateGallery = async () => {
    if (!newGallery.title.trim()) {
      alert('Digite um título para a galeria!');
      return;
    }

    try {
      // Simular criação da galeria
      console.log('🎨 Criando nova galeria:', newGallery);
      
      if (onCreateGallery) {
        await onCreateGallery({
          ...newGallery,
          photos: [],
          createdAt: new Date().toISOString()
        });
      }
      
      // Reset form
      setNewGallery({ title: '', description: '', isPrivate: false });
      setIsCreating(false);
      
      alert('Galeria criada com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao criar galeria:', error);
      alert('Erro ao criar galeria. Tente novamente.');
    }
  };

  // Função para atualizar galeria existente
  const handleUpdateGallery = async (galleryId: number, updates: Partial<Gallery>) => {
    try {
      console.log('📝 Atualizando galeria:', galleryId, updates);
      
      const gallery = galleries.find(g => g.id === galleryId);
      if (!gallery) return;
      
      if (onUpdateGallery) {
        await onUpdateGallery({ ...gallery, ...updates });
      }
      
      setEditingGallery(null);
      alert('Galeria atualizada com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao atualizar galeria:', error);
      alert('Erro ao atualizar galeria. Tente novamente.');
    }
  };

  // Função para deletar galeria
  const handleDeleteGallery = async (galleryId: number) => {
    const gallery = galleries.find(g => g.id === galleryId);
    if (!gallery) return;

    if (gallery.photos.length > 0) {
      const confirmDelete = confirm(
        `Tem certeza que deseja deletar a galeria "${gallery.title}"?\n\nEsta ação removerá ${gallery.photos.length} foto(s) permanentemente.`
      );
      if (!confirmDelete) return;
    }

    try {
      console.log('🗑️ Deletando galeria:', galleryId);
      
      if (onDeleteGallery) {
        await onDeleteGallery(galleryId);
      }
      
      alert('Galeria deletada com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao deletar galeria:', error);
      alert('Erro ao deletar galeria. Tente novamente.');
    }
  };

  // Função para upload de fotos
  const handlePhotoUpload = async (galleryId: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    try {
      console.log('📸 Fazendo upload de fotos:', files.length, 'para galeria:', galleryId);
      
      if (onAddPhotoToGallery) {
        await onAddPhotoToGallery(galleryId, Array.from(files));
      }
      
      alert(`${files.length} foto(s) adicionada(s) com sucesso!`);
    } catch (error) {
      console.error('❌ Erro ao fazer upload:', error);
      alert('Erro ao fazer upload das fotos. Tente novamente.');
    }

    // Reset input
    event.target.value = '';
  };

  if (galleries.length === 0 && !isCreating) {
    return (
      <OrkutCard>
        <OrkutCardHeader>
          <div className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Gerenciar Galerias</span>
          </div>
        </OrkutCardHeader>
        <OrkutCardContent>
          <div className="text-center py-8">
            <Folder className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 mb-4">
              Você ainda não tem galerias criadas.
            </p>
            <Button 
              onClick={() => setIsCreating(true)}
              className="bg-purple-500 hover:bg-purple-600 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeira Galeria
            </Button>
          </div>
        </OrkutCardContent>
      </OrkutCard>
    );
  }

  return (
    <div className="space-y-4">
      <OrkutCard>
        <OrkutCardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Gerenciar Galerias</span>
              <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                {galleries.length} galerias
              </Badge>
            </div>
            <Button 
              size="sm"
              onClick={() => setIsCreating(true)}
              className="bg-purple-500 hover:bg-purple-600 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Galeria
            </Button>
          </div>
        </OrkutCardHeader>
        <OrkutCardContent>
          {/* Form para criar nova galeria */}
          {isCreating && (
            <div className="mb-6 p-4 border border-purple-200 rounded-lg bg-purple-50">
              <h3 className="font-semibold text-gray-800 mb-3">Criar Nova Galeria</h3>
              <div className="space-y-3">
                <Input
                  placeholder="Nome da galeria"
                  value={newGallery.title}
                  onChange={(e) => setNewGallery(prev => ({ ...prev, title: e.target.value }))}
                  className="border-purple-300 focus:border-purple-500"
                />
                <Textarea
                  placeholder="Descrição (opcional)"
                  value={newGallery.description}
                  onChange={(e) => setNewGallery(prev => ({ ...prev, description: e.target.value }))}
                  className="border-purple-300 focus:border-purple-500"
                  rows={2}
                />
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isPrivate"
                    checked={newGallery.isPrivate}
                    onChange={(e) => setNewGallery(prev => ({ ...prev, isPrivate: e.target.checked }))}
                    className="rounded border-purple-300"
                  />
                  <label htmlFor="isPrivate" className="text-sm text-gray-700 flex items-center">
                    <EyeOff className="h-4 w-4 mr-1" />
                    Galeria privada
                  </label>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    onClick={handleCreateGallery}
                    size="sm"
                    className="bg-purple-500 hover:bg-purple-600 text-white"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Criar Galeria
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setIsCreating(false);
                      setNewGallery({ title: '', description: '', isPrivate: false });
                    }}
                    size="sm"
                    className="border-gray-300"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Lista de galerias existentes */}
          <div className="space-y-3">
            {galleries.map((gallery) => (
              <div 
                key={gallery.id} 
                className="p-4 border border-gray-200 rounded-lg hover:border-purple-300 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <Folder className="h-5 w-5 text-purple-500" />
                    <div>
                      <h4 className="font-medium text-gray-800">{gallery.title}</h4>
                      {gallery.description && (
                        <p className="text-sm text-gray-600">{gallery.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                      <Image className="h-3 w-3 mr-1" />
                      {gallery.photos.length}
                    </Badge>
                    {gallery.isPrivate && (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                        <EyeOff className="h-3 w-3 mr-1" />
                        Privada
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Actions da galeria */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {/* Upload de fotos */}
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => handlePhotoUpload(gallery.id, e)}
                        className="hidden"
                      />
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="border-purple-300 text-purple-700 hover:bg-purple-50"
                        asChild
                      >
                        <span>
                          <Upload className="h-3 w-3 mr-2" />
                          Adicionar Fotos
                        </span>
                      </Button>
                    </label>

                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setEditingGallery(gallery.id)}
                      className="border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      <Edit3 className="h-3 w-3 mr-2" />
                      Editar
                    </Button>
                  </div>

                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleDeleteGallery(gallery.id)}
                    className="border-red-300 text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-3 w-3 mr-2" />
                    Deletar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </OrkutCardContent>
      </OrkutCard>
    </div>
  );
};

export default UpdateGalleries;
