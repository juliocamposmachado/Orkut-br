'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/enhanced-auth-context'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { 
  Camera, 
  Plus,
  X,
  ExternalLink,
  Info
} from 'lucide-react'
import Link from 'next/link'

// Importar o novo componente de integração PostImages
import PostImagesIntegration from '@/components/PostImagesIntegration'

// Manter imports antigos como fallback
import PostImageUpload from '@/src/components/PostImageUpload'
import PostImageGallery from '@/src/components/PostImageGallery'

interface Photo {
  id: string
  url: string
  thumbnail_url?: string
  title: string
  description?: string
  user_name: string
  category?: string
  likes_count: number
  comments_count: number
  views_count: number
  created_at: string
  // Campos para PostImage
  external_service?: string
  external_url?: string
  original_filename?: string
}

type ViewMode = 'grid' | 'list'

export default function PhotosPage() {
  const { user } = useAuth()
  const [showLegacyMode, setShowLegacyMode] = useState(false)
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [galleryKey, setGalleryKey] = useState(0)

  // Callback quando uma foto é salva com sucesso
  const handlePhotoSaved = (photo: any) => {
    console.log('✅ Foto salva no banco:', photo)
    setGalleryKey(prev => prev + 1)
    setTimeout(() => {
      setShowUploadForm(false)
    }, 2000)
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <Camera className="w-16 h-16 text-purple-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Faça login para ver as fotos</h2>
          <p className="text-gray-600 mb-4">Conecte-se para explorar a galeria da comunidade</p>
          <Button asChild>
            <Link href="/login">Fazer Login</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <Navbar />
      
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white py-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 rounded-full p-3">
                <Camera className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Orkut Fotos</h1>
                <p className="text-purple-100">
                  Integração direta com PostImages.org
                </p>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Button 
                variant="outline"
                className="bg-white/10 hover:bg-white/20 text-white border-white/30 text-xs"
                onClick={() => setShowLegacyMode(!showLegacyMode)}
              >
                <Info className="w-3 h-3 mr-1" />
                {showLegacyMode ? 'Modo Novo' : 'Modo Legacy'}
              </Button>
              
              <Button 
                className="bg-white/10 hover:bg-white/20 text-white border-white/30"
                onClick={() => window.open('https://postimages.org/', '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                PostImages.org
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        
        {/* Modo Legacy (Upload + Galeria antiga) */}
        {showLegacyMode ? (
          <>
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Info className="w-5 h-5 text-yellow-600" />
                <h3 className="font-semibold text-yellow-800">Modo Legacy</h3>
              </div>
              <p className="text-sm text-yellow-700">
                Sistema antigo de upload para o PostImages + armazenamento no Supabase
              </p>
              <div className="mt-3">
                <Button 
                  size="sm"
                  onClick={() => setShowUploadForm(!showUploadForm)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Foto (Legacy)
                </Button>
              </div>
            </div>

            {/* Upload Legacy */}
            {showUploadForm && (
              <div className="mb-6">
                <div className="flex justify-end mb-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowUploadForm(false)}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Fechar
                  </Button>
                </div>
                <PostImageUpload onPhotoSaved={handlePhotoSaved} />
              </div>
            )}

            {/* Galeria Legacy */}
            <PostImageGallery key={galleryKey} />
          </>
        ) : (
          /* Novo Modo: Integração direta PostImages */
          <>
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Camera className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-blue-800">Nova Integração PostImages</h3>
              </div>
              <p className="text-sm text-blue-700 mb-3">
                Agora você pode usar sua conta PostImages diretamente no Orkut!
              </p>
              <div className="text-xs text-blue-600 space-y-1">
                <p>• Faça login na sua conta PostImages</p>
                <p>• Acesse seus files diretamente</p>
                <p>• Faça upload de novas fotos</p>
                <p>• Tudo integrado no Orkut!</p>
              </div>
            </div>

            {/* Integração PostImages */}
            <PostImagesIntegration className="w-full" />
          </>
        )}
      </div>

      <Footer />
    </div>
  )
}
