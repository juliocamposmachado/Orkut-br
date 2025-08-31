'use client'

import { useState } from 'react'
import { ImageUpload } from './ImageUpload'
import { useAuth } from '@/contexts/enhanced-auth-context'

interface PostImageUploadProps {
  onImageSelect?: (imageUrl: string) => void
  onImageRemove?: () => void
  className?: string
}

export function PostImageUpload({ 
  onImageSelect, 
  onImageRemove, 
  className 
}: PostImageUploadProps) {
  const { user } = useAuth()
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)

  const handleUploadComplete = (url: string) => {
    setUploadedImage(url)
    onImageSelect?.(url)
  }

  const handleRemoveImage = () => {
    setUploadedImage(null)
    onImageRemove?.()
  }

  if (!user) return null

  return (
    <div className={className}>
      {!uploadedImage ? (
        <ImageUpload
          userId={user.id}
          type="post"
          onUploadComplete={handleUploadComplete}
          className="max-w-md"
        />
      ) : (
        <div className="relative inline-block">
          <img 
            src={uploadedImage} 
            alt="Post preview" 
            className="max-w-md max-h-64 object-cover rounded-lg shadow-md"
          />
          <button
            onClick={handleRemoveImage}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
          >
            ×
          </button>
        </div>
      )}
    </div>
  )
}
