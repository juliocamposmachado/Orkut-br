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

// Importar componentes de integração
import PostImagesIntegration from '@/components/PostImagesIntegration'
import ImgurUpload from '@/components/ImgurUpload'
import ImgurUploadWithFeed from '@/components/ImgurUploadWithFeed'

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

type PhotoMode = 'imgur' | 'postimages' | 'legacy'

export default function PhotosPage() {
  const { user } = useAuth()
  const [currentMode, setCurrentMode] = useState<PhotoMode>('imgur')
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
            
            <div className="text-center">
              <div className="inline-flex bg-white/10 rounded-lg p-1 space-x-1">
                <Button
                  size="sm"
                  className={`text-xs h-8 px-4 ${
                    currentMode === 'imgur' 
                      ? 'bg-white text-purple-600 shadow-sm' 
                      : 'text-white hover:bg-white/20'
                  }`}
                  onClick={() => setCurrentMode('imgur')}
                >
                  🎨 Imgur
                </Button>
                <Button
                  size="sm"
                  className={`text-xs h-8 px-4 ${
                    currentMode === 'postimages' 
                      ? 'bg-white text-purple-600 shadow-sm' 
                      : 'text-white hover:bg-white/20'
                  }`}
                  onClick={() => setCurrentMode('postimages')}
                >
                  🖼️ PostImages
                </Button>
                <Button
                  size="sm"
                  className={`text-xs h-8 px-4 ${
                    currentMode === 'legacy' 
                      ? 'bg-white text-purple-600 shadow-sm' 
                      : 'text-white hover:bg-white/20'
                  }`}
                  onClick={() => setCurrentMode('legacy')}
                >
                  ⚙️ Legacy
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        
        {/* Imgur Mode - RECOMENDADO */}
        {currentMode === 'imgur' && (
          <>
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  🎨
                </div>
                <h3 className="font-semibold text-green-800">Upload via Imgur ✨</h3>
                <span className="bg-green-200 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                  RECOMENDADO
                </span>
              </div>
              <p className="text-sm text-green-700 mb-3">
                Upload simples e rápido sem necessidade de login! 🚀
              </p>
              <div className="text-xs text-green-600 space-y-1">
                <p>• 💼 Sem necessidade de conta ou login</p>
                <p>• 📱 Drag & drop + interface responsiva</p>
                <p>• 🔗 Links permanentes e confiáveis</p>
                <p>• ⚡ Upload rápido e estvel</p>
              </div>
            </div>

            {/* Componente Imgur Upload com Feed */}
            <ImgurUploadWithFeed 
              className="w-full" 
              onFeedSave={(feedData) => {
                console.log('🎆 Nova foto adicionada ao feed:', feedData)
                // Aqui podemos atualizar o feed ou fazer outras ações
              }}
            />
          </>
        )}

        {/* PostImages Mode - Iframe Integration */}
        {currentMode === 'postimages' && (
          <>
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  🖼️
                </div>
                <h3 className="font-semibold text-blue-800">Integração PostImages</h3>
                <span className="bg-orange-200 text-orange-800 text-xs px-2 py-1 rounded-full font-medium">
                  EXPERIMENTAL
                </span>
              </div>
              <p className="text-sm text-blue-700 mb-3">
                Acesse sua conta PostImages diretamente no Orkut!
              </p>
              <div className="text-xs text-blue-600 space-y-1">
                <p>• 🔑 Requer login na sua conta PostImages</p>
                <p>• 📁 Acesse seus files diretamente</p>
                <p>• 📷 Faça upload de novas fotos</p>
                <p>• 🖥️ Interface integrada via iframe</p>
              </div>
            </div>

            {/* Integração PostImages */}
            <PostImagesIntegration className="w-full" />
          </>
        )}

        {/* Legacy Mode */}
        {currentMode === 'legacy' && (
          <>
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  ⚙️
                </div>
                <h3 className="font-semibold text-yellow-800">Modo Legacy</h3>
                <span className="bg-yellow-200 text-yellow-800 text-xs px-2 py-1 rounded-full font-medium">
                  ANTIGO
                </span>
              </div>
              <p className="text-sm text-yellow-700 mb-3">
                Sistema antigo: upload PostImages + armazenamento Supabase
              </p>
              <div className="text-xs text-yellow-600 space-y-1 mb-4">
                <p>• 📈 Upload para PostImages via proxy</p>
                <p>• 💾 Armazenamento dos links no Supabase</p>
                <p>• 📃 Galeria persistente no banco de dados</p>
                <p>• ⚠️ Pode apresentar instabilidades</p>
              </div>
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
        )}
      </div>

      <Footer />
    </div>
  )
}
