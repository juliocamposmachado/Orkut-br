import React, { useState, useEffect, useCallback } from 'react';
import { 
  Image as ImageIcon, 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  Download, 
  ExternalLink,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  Copy,
  CheckCircle,
  Heart,
  Share2,
  Calendar,
  User,
  Tag
} from 'lucide-react';

const PostImageGallery = ({ userId = null, className = "" }) => {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [copiedLink, setCopiedLink] = useState(null);
  const [editingPhoto, setEditingPhoto] = useState(null);
  
  // Filtros
  const [filters, setFilters] = useState({
    search: '',
    tags: '',
    publicOnly: false
  });

  // Paginação
  const [pagination, setPagination] = useState({
    limit: 20,
    offset: 0,
    total: 0
  });

  const [stats, setStats] = useState({
    total_photos: 0,
    public_photos: 0,
    private_photos: 0
  });

  // Carregar fotos
  const loadPhotos = useCallback(async (resetOffset = false) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        limit: pagination.limit.toString(),
        offset: resetOffset ? '0' : pagination.offset.toString()
      });

      if (userId) params.set('user_id', userId);
      if (filters.search) params.set('search', filters.search);
      if (filters.tags) params.set('tags', filters.tags);
      if (filters.publicOnly) params.set('public_only', 'true');

      const response = await fetch(`/api/photos/list-postimage?${params}`);
      
      if (!response.ok) {
        throw new Error('Erro ao carregar fotos');
      }

      const data = await response.json();
      
      if (resetOffset) {
        setPhotos(data.photos);
        setPagination(prev => ({ ...prev, offset: 0, total: data.pagination.total }));
      } else {
        setPhotos(prev => [...prev, ...data.photos]);
        setPagination(prev => ({ ...prev, total: data.pagination.total }));
      }

      setStats(data.stats);

    } catch (err) {
      console.error('Erro ao carregar fotos:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId, filters, pagination.limit, pagination.offset]);

  // Carregar mais fotos
  const loadMore = () => {
    setPagination(prev => ({ ...prev, offset: prev.offset + prev.limit }));
  };

  // Aplicar filtros
  const applyFilters = () => {
    setPagination(prev => ({ ...prev, offset: 0 }));
    loadPhotos(true);
  };

  // Resetar filtros
  const resetFilters = () => {
    setFilters({
      search: '',
      tags: '',
      publicOnly: false
    });
    setPagination(prev => ({ ...prev, offset: 0 }));
  };

  // Copiar link
  const copyToClipboard = async (text, linkType) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedLink(linkType);
      setTimeout(() => setCopiedLink(null), 2000);
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  };

  // Atualizar foto
  const updatePhoto = async (photoId, updates) => {
    try {
      const response = await fetch('/api/photos/list-postimage', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: photoId, ...updates })
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar foto');
      }

      const data = await response.json();
      
      // Atualizar foto na lista
      setPhotos(prev => prev.map(photo => 
        photo.id === photoId ? { ...photo, ...data.photo } : photo
      ));

      setEditingPhoto(null);
    } catch (err) {
      console.error('Erro ao atualizar foto:', err);
      setError(err.message);
    }
  };

  // Deletar foto
  const deletePhoto = async (photoId) => {
    if (!confirm('Tem certeza que deseja deletar esta foto?')) return;

    try {
      const response = await fetch(`/api/photos/list-postimage?id=${photoId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Erro ao deletar foto');
      }

      // Remover foto da lista
      setPhotos(prev => prev.filter(photo => photo.id !== photoId));

    } catch (err) {
      console.error('Erro ao deletar foto:', err);
      setError(err.message);
    }
  };

  // Effect para carregar fotos inicialmente
  useEffect(() => {
    loadPhotos(true);
  }, []);

  // Effect para carregar mais fotos quando offset muda
  useEffect(() => {
    if (pagination.offset > 0) {
      loadPhotos(false);
    }
  }, [pagination.offset]);

  const PhotoCard = ({ photo }) => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {/* Imagem */}
      <div className="aspect-square relative group">
        <img
          src={photo.direct_link}
          alt={photo.title || photo.filename}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.src = '/placeholder-image.jpg'; // Placeholder se a imagem falhar
          }}
        />
        
        {/* Overlay com ações */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="flex gap-2">
            <button
              onClick={() => window.open(photo.postimage_page_url, '_blank')}
              className="p-2 bg-white bg-opacity-90 rounded-full hover:bg-white transition-colors"
              title="Ver no PostImage.org"
            >
              <ExternalLink className="w-4 h-4 text-gray-700" />
            </button>
            <button
              onClick={() => copyToClipboard(photo.direct_link, `${photo.id}_direct`)}
              className="p-2 bg-white bg-opacity-90 rounded-full hover:bg-white transition-colors"
              title="Copiar link direto"
            >
              {copiedLink === `${photo.id}_direct` ? 
                <CheckCircle className="w-4 h-4 text-green-600" /> :
                <Copy className="w-4 h-4 text-gray-700" />
              }
            </button>
            {!userId && (
              <>
                <button
                  onClick={() => setEditingPhoto(photo)}
                  className="p-2 bg-white bg-opacity-90 rounded-full hover:bg-white transition-colors"
                  title="Editar"
                >
                  <Edit2 className="w-4 h-4 text-gray-700" />
                </button>
                <button
                  onClick={() => deletePhoto(photo.id)}
                  className="p-2 bg-white bg-opacity-90 rounded-full hover:bg-white transition-colors"
                  title="Deletar"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Status de visibilidade */}
        <div className="absolute top-2 right-2">
          {photo.is_public ? (
            <div className="p-1 bg-green-100 rounded-full" title="Público">
              <Eye className="w-3 h-3 text-green-600" />
            </div>
          ) : (
            <div className="p-1 bg-gray-100 rounded-full" title="Privado">
              <EyeOff className="w-3 h-3 text-gray-600" />
            </div>
          )}
        </div>
      </div>

      {/* Informações */}
      <div className="p-4">
        <h3 className="font-medium text-gray-900 mb-1 line-clamp-2">
          {photo.title || photo.filename}
        </h3>
        
        {photo.description && (
          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
            {photo.description}
          </p>
        )}

        {/* Tags */}
        {photo.tags && photo.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {photo.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full"
              >
                {tag}
              </span>
            ))}
            {photo.tags.length > 3 && (
              <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                +{photo.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Metadados */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {new Date(photo.upload_date).toLocaleDateString('pt-BR')}
          </div>
          {photo.original_size && (
            <div>
              {(photo.original_size / 1024 / 1024).toFixed(1)} MB
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className={`max-w-7xl mx-auto ${className}`}>
      {/* Header com estatísticas */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ImageIcon className="w-8 h-8 text-blue-600" />
              Galeria PostImage
            </h2>
            <p className="text-gray-600 mt-1">
              Fotos hospedadas no PostImage.org
            </p>
          </div>

          {/* Controles de visualização */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Grid3X3 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.total_photos}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.public_photos}</div>
            <div className="text-sm text-gray-600">Públicas</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">{stats.private_photos}</div>
            <div className="text-sm text-gray-600">Privadas</div>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar fotos..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    applyFilters();
                  }
                }}
              />
            </div>
          </div>
          
          <input
            type="text"
            placeholder="Tags (separadas por vírgula)"
            value={filters.tags}
            onChange={(e) => setFilters(prev => ({ ...prev, tags: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          <label className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md">
            <input
              type="checkbox"
              checked={filters.publicOnly}
              onChange={(e) => setFilters(prev => ({ ...prev, publicOnly: e.target.checked }))}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm">Apenas públicas</span>
          </label>

          <button
            onClick={applyFilters}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filtrar
          </button>

          <button
            onClick={resetFilters}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Limpar
          </button>
        </div>
      </div>

      {/* Lista de fotos */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {loading && photos.length === 0 ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando fotos...</p>
        </div>
      ) : photos.length === 0 ? (
        <div className="text-center py-12">
          <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma foto encontrada</h3>
          <p className="text-gray-600">
            {filters.search || filters.tags ? 
              'Tente ajustar os filtros para encontrar fotos.' :
              'Faça upload de algumas fotos para começar!'
            }
          </p>
        </div>
      ) : (
        <>
          {/* Grid de fotos */}
          <div className={`${
            viewMode === 'grid' 
              ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4' 
              : 'space-y-4'
          }`}>
            {photos.map((photo) => (
              <PhotoCard key={photo.id} photo={photo} />
            ))}
          </div>

          {/* Botão carregar mais */}
          {pagination.offset + pagination.limit < pagination.total && (
            <div className="text-center mt-8">
              <button
                onClick={loadMore}
                disabled={loading}
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Carregando...' : 'Carregar Mais'}
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal de edição */}
      {editingPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-4">Editar Foto</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título
                </label>
                <input
                  type="text"
                  value={editingPhoto.title || ''}
                  onChange={(e) => setEditingPhoto(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <textarea
                  value={editingPhoto.description || ''}
                  onChange={(e) => setEditingPhoto(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="editIsPublic"
                  checked={editingPhoto.is_public || false}
                  onChange={(e) => setEditingPhoto(prev => ({ ...prev, is_public: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="editIsPublic" className="text-sm font-medium text-gray-700">
                  Foto pública
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => updatePhoto(editingPhoto.id, {
                  title: editingPhoto.title,
                  description: editingPhoto.description,
                  is_public: editingPhoto.is_public
                })}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Salvar
              </button>
              <button
                onClick={() => setEditingPhoto(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostImageGallery;
