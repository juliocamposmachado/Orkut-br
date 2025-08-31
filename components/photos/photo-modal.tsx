"use client"

import Image from "next/image"
import React, { useCallback, useEffect, useState } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, ChevronLeft, ChevronRight, Download, Heart, Share2, User } from "lucide-react"
import { Photo } from "@/hooks/use-photos"
import { cn } from "@/lib/utils"

interface PhotoModalProps {
  isOpen: boolean
  onClose: () => void
  photos: Photo[]
  initialIndex: number
  userName?: string
}

export const PhotoModal: React.FC<PhotoModalProps> = ({
  isOpen,
  onClose,
  photos,
  initialIndex,
  userName
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [isLoading, setIsLoading] = useState(false)
  const [isLiked, setIsLiked] = useState(false)

  const currentPhoto = photos[currentIndex]

  // Navegar fotos com teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return
      
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault()
          goToPrevious()
          break
        case 'ArrowRight':
          e.preventDefault()
          goToNext()
          break
        case 'Escape':
          e.preventDefault()
          onClose()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, currentIndex])

  const goToPrevious = useCallback(() => {
    setCurrentIndex(prev => prev > 0 ? prev - 1 : photos.length - 1)
  }, [photos.length])

  const goToNext = useCallback(() => {
    setCurrentIndex(prev => prev < photos.length - 1 ? prev + 1 : 0)
  }, [photos.length])

  const handleDownload = async () => {
    if (!currentPhoto) return
    
    try {
      setIsLoading(true)
      const response = await fetch(currentPhoto.url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      
      const a = document.createElement('a')
      a.href = url
      a.download = `${currentPhoto.title || currentPhoto.id}.jpg`
      document.body.appendChild(a)
      a.click()
      
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Erro ao fazer download:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleShare = async () => {
    if (!currentPhoto) return
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: currentPhoto.title || 'Foto do Orkut',
          text: currentPhoto.description || 'Confira esta foto!',
          url: window.location.href
        })
      } catch (error) {
        console.log('Share cancelado')
      }
    } else {
      // Fallback: copiar URL para clipboard
      try {
        await navigator.clipboard.writeText(window.location.href)
        // Aqui você poderia mostrar um toast de sucesso
      } catch (error) {
        console.error('Erro ao copiar URL:', error)
      }
    }
  }

  if (!currentPhoto) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-full max-h-[95vh] p-0 overflow-hidden bg-black">
        <DialogTitle className="sr-only">
          {currentPhoto.title || 'Visualizador de Fotos'}
        </DialogTitle>
        
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/60 to-transparent p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {userName && (
              <div className="flex items-center space-x-2 text-white">
                <User className="w-4 h-4" />
                <span className="text-sm font-medium">{userName}</span>
              </div>
            )}
            {currentPhoto.category && (
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                {currentPhoto.category}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-white text-sm">
              {currentIndex + 1} / {photos.length}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Imagem Principal */}
        <div className="relative w-full h-[80vh] flex items-center justify-center bg-black">
          <Image
            src={currentPhoto.url}
            alt={currentPhoto.title || currentPhoto.id}
            fill
            sizes="90vw"
            className="object-contain"
            priority
          />
          
          {/* Navegação */}
          {photos.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={goToPrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12 p-0 z-10"
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={goToNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12 p-0 z-10"
              >
                <ChevronRight className="w-6 h-6" />
              </Button>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
          <div className="flex items-center justify-between">
            <div className="text-white">
              {currentPhoto.title && (
                <h3 className="text-lg font-semibold mb-1">{currentPhoto.title}</h3>
              )}
              {currentPhoto.description && (
                <p className="text-sm text-gray-300">{currentPhoto.description}</p>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsLiked(!isLiked)}
                className={cn(
                  "text-white hover:bg-white/20 h-9",
                  isLiked && "text-red-400"
                )}
              >
                <Heart className={cn("w-4 h-4 mr-1", isLiked && "fill-current")} />
                Curtir
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                className="text-white hover:bg-white/20 h-9"
              >
                <Share2 className="w-4 h-4 mr-1" />
                Compartilhar
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownload}
                disabled={isLoading}
                className="text-white hover:bg-white/20 h-9"
              >
                <Download className="w-4 h-4 mr-1" />
                {isLoading ? 'Baixando...' : 'Baixar'}
              </Button>
            </div>
          </div>
        </div>

        {/* Thumbnails */}
        {photos.length > 1 && (
          <div className="absolute bottom-16 left-0 right-0 px-4">
            <div className="flex items-center justify-center space-x-2 overflow-x-auto scrollbar-hide max-w-md mx-auto">
              {photos.map((photo, index) => (
                <button
                  key={photo.id}
                  onClick={() => setCurrentIndex(index)}
                  className={cn(
                    "relative w-12 h-12 rounded border-2 overflow-hidden flex-shrink-0 transition-all",
                    index === currentIndex 
                      ? "border-white" 
                      : "border-white/30 hover:border-white/60"
                  )}
                >
                  <Image
                    src={photo.url}
                    alt={photo.title || photo.id}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
