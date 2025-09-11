'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/enhanced-auth-context'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { Camera } from 'lucide-react'
import Link from 'next/link'

// Componentes necessários - apenas Imgur
import OptimizedImgurUpload from '@/components/OptimizedImgurUpload'
import GlobalPhotosFeed, { GlobalPhotosFeedRef } from '@/components/GlobalPhotosFeed'
import AlbumPhotos from '@/components/AlbumPhotos'

export default function PhotosPage() {
  const { user } = useAuth()
  const feedRef = useRef<GlobalPhotosFeedRef>(null)

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
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 rounded-full p-3">
                <Camera className="w-8 h-8" />
              </div>
              <div className="text-center">
                <h1 className="text-3xl font-bold">Orkut Fotos</h1>
                <p className="text-purple-100">
                  Upload rápido e salvamento automático no Orkut
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        
        {/* Upload via Imgur - Único modo */}
        <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-8 h-8 bg-gradient-to-r from-green-100 to-blue-100 rounded-full flex items-center justify-center">
              🎨
            </div>
            <h3 className="font-semibold text-green-800">Upload via Imgur</h3>
            <span className="bg-green-200 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
              SALVAMENTO AUTOMÁTICO
            </span>
          </div>
          <p className="text-sm text-green-700 mb-3">
            Upload simples e rápido - salva automaticamente no seu Orkut! 🚀
          </p>
          <div className="text-xs text-green-600 space-y-1">
            <p>• 💼 Sem necessidade de conta no Imgur</p>
            <p>• 📱 Drag & drop + interface responsiva</p>
            <p>• 🔗 Links permanentes e confiáveis</p>
            <p>• 💾 Salvamento automático no feed + álbum pessoal</p>
          </div>
        </div>

        {/* Componente Otimizado Imgur Upload com Feed */}
        <OptimizedImgurUpload 
          className="w-full"
          autoSaveToFeed={true}
          onUploadComplete={(images) => {
            console.log('🚀 Upload completo:', images.length, 'foto(s)')
          }}
          onFeedSave={(feedData) => {
            console.log('💾 Foto salva no feed:', feedData)
            // Atualizar o feed automaticamente
            if (feedRef.current) {
              feedRef.current.refreshToFirst()
            }
          }}
          onFeedUpdate={() => {
            // Refresh manual do feed
            if (feedRef.current) {
              feedRef.current.refresh()
            }
          }}
        />
        
        {/* Separador */}
        <div className="my-12 border-t border-gray-200"></div>
        
        {/* Meu Álbum de Fotos */}
        {user && (
          <>
            <AlbumPhotos 
              className="mb-12"
              showHeader={true}
              itemsPerPage={12}
              viewMode="grid"
            />
            
            {/* Separador */}
            <div className="my-12 border-t border-gray-200"></div>
          </>
        )}
        
        {/* Feed Global de Fotos */}
        <GlobalPhotosFeed 
          ref={feedRef}
          className="mb-8"
          showHeader={true}
          itemsPerPage={16}
          autoRefresh={false}
        />
        
      </div>

      <Footer />
    </div>
  )
}
