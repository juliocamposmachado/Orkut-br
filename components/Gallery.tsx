'use client'

import React, { useState } from 'react';
import { OrkutCard, OrkutCardContent, OrkutCardHeader } from '@/components/ui/orkut-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Camera, 
  Grid3X3, 
  Image, 
  Plus,
  Eye,
  Heart,
  MessageCircle 
} from 'lucide-react';
import { GalleryItem, GalleryProps } from '@/types/gallery';

const Gallery: React.FC<GalleryProps> = ({ 
  galleries, 
  isOwner, 
  onAddPhoto, 
  onCreateGallery 
}) => {
  const [selectedGallery, setSelectedGallery] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Galeria selecionada ou primeira galeria
  const activeGallery = selectedGallery 
    ? galleries.find(g => g.id === selectedGallery)
    : galleries[0];

  const totalPhotos = galleries.reduce((total, gallery) => total + gallery.photos.length, 0);

  return (
    <div className="space-y-6">
      {/* Header da seção de galerias */}
      <OrkutCard>
        <OrkutCardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Camera className="h-4 w-4" />
              <span>Galerias de Fotos ({galleries.length})</span>
              <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                {totalPhotos} fotos
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="border-purple-300 text-purple-700 hover:bg-purple-50"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              {isOwner && onCreateGallery && (
                <Button
                  size="sm"
                  onClick={onCreateGallery}
                  className="bg-purple-500 hover:bg-purple-600 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Galeria
                </Button>
              )}
            </div>
          </div>
        </OrkutCardHeader>
        <OrkutCardContent>
          {/* Lista de galerias disponíveis */}
          <div className="flex flex-wrap gap-2 mb-4">
            {galleries.map((gallery) => (
              <Button
                key={gallery.id}
                variant={selectedGallery === gallery.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedGallery(gallery.id)}
                className={`transition-all ${
                  selectedGallery === gallery.id 
                    ? 'bg-purple-500 hover:bg-purple-600 text-white' 
                    : 'border-purple-300 text-purple-700 hover:bg-purple-50'
                }`}
              >
                {gallery.title}
                <Badge 
                  variant="secondary" 
                  className="ml-2 bg-white/20 text-current"
                >
                  {gallery.photos.length}
                </Badge>
              </Button>
            ))}
          </div>

          {/* Galeria selecionada */}
          {activeGallery ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg text-gray-800">
                    {activeGallery.title}
                  </h3>
                  {activeGallery.description && (
                    <p className="text-sm text-gray-600 mt-1">
                      {activeGallery.description}
                    </p>
                  )}
                </div>
                {isOwner && onAddPhoto && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onAddPhoto(activeGallery.id)}
                    className="border-purple-300 text-purple-700 hover:bg-purple-50"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Foto
                  </Button>
                )}
              </div>

              {/* Grid de fotos */}
              {activeGallery.photos.length > 0 ? (
                <div className={`grid gap-3 ${
                  viewMode === 'grid' 
                    ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' 
                    : 'grid-cols-1'
                }`}>
                  {activeGallery.photos.map((photo) => (
                    <div 
                      key={photo.id} 
                      className={`group relative bg-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer ${
                        viewMode === 'grid' ? 'aspect-square' : 'aspect-video'
                      }`}
                    >
                      <img
                        src={photo.url}
                        alt={photo.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      
                      {/* Overlay com informações */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-200">
                        <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                          <h4 className="font-medium text-sm mb-1 truncate">
                            {photo.title}
                          </h4>
                          {photo.description && (
                            <p className="text-xs text-gray-300 mb-2 truncate">
                              {photo.description}
                            </p>
                          )}
                          
                          {/* Stats da foto */}
                          <div className="flex items-center space-x-3 text-xs">
                            <div className="flex items-center space-x-1">
                              <Eye className="h-3 w-3" />
                              <span>{photo.views}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Heart className="h-3 w-3" />
                              <span>{photo.likes}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <MessageCircle className="h-3 w-3" />
                              <span>{photo.comments}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Image className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium mb-2">Nenhuma foto nesta galeria</p>
                  <p className="text-sm">
                    {isOwner 
                      ? 'Adicione algumas fotos para começar!' 
                      : 'Esta galeria ainda não tem fotos.'}
                  </p>
                  {isOwner && onAddPhoto && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onAddPhoto(activeGallery.id)}
                      className="mt-4 border-purple-300 text-purple-700 hover:bg-purple-50"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Primeira Foto
                    </Button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium mb-2">Nenhuma galeria criada</p>
              <p className="text-sm mb-4">
                {isOwner 
                  ? 'Crie sua primeira galeria para organizar suas fotos!' 
                  : 'Este usuário ainda não criou galerias.'}
              </p>
              {isOwner && onCreateGallery && (
                <Button
                  onClick={onCreateGallery}
                  className="bg-purple-500 hover:bg-purple-600 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeira Galeria
                </Button>
              )}
            </div>
          )}
        </OrkutCardContent>
      </OrkutCard>
    </div>
  );
};

export default Gallery;
