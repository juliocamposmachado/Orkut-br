import { X, ExternalLink, Edit2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface LinkPreview {
  url: string
  title: string
  description: string
  image: string | null
  siteName: string
  favicon: string | null
  domain: string
  error?: string
}

interface LinkPreviewCardProps {
  preview: LinkPreview
  onRemove?: () => void
  onEdit?: () => void
  className?: string
  isLoading?: boolean
}

export function LinkPreviewCard({ 
  preview, 
  onRemove, 
  onEdit, 
  className = '',
  isLoading = false 
}: LinkPreviewCardProps) {
  if (!preview) return null

  return (
    <div className={`relative bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow ${className}`}>
      {/* Action Buttons */}
      <div className="absolute top-2 right-2 z-10 flex space-x-1">
        {onEdit && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 bg-black/60 hover:bg-black/80 text-white rounded-full backdrop-blur-sm"
            onClick={onEdit}
            title="Editar preview"
          >
            <Edit2 className="h-3 w-3" />
          </Button>
        )}
        {onRemove && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 bg-black/60 hover:bg-black/80 text-white rounded-full backdrop-blur-sm"
            onClick={onRemove}
            title="Remover preview"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-20">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
        </div>
      )}

      <div className="flex">
        {/* Image Section */}
        {preview.image && (
          <div className="w-32 h-24 flex-shrink-0">
            <img 
              src={preview.image} 
              alt={preview.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Hide image if it fails to load
                e.currentTarget.style.display = 'none'
              }}
            />
          </div>
        )}

        {/* Content Section */}
        <div className="flex-1 p-3 min-w-0">
          {/* Site Info */}
          <div className="flex items-center space-x-2 mb-2">
            {preview.favicon && (
              <img 
                src={preview.favicon} 
                alt={`${preview.domain} favicon`}
                className="w-4 h-4 rounded-sm"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            )}
            <span className="text-xs text-gray-500 uppercase tracking-wide font-medium truncate">
              {preview.siteName || preview.domain}
            </span>
            <ExternalLink className="h-3 w-3 text-gray-400 flex-shrink-0" />
          </div>

          {/* Title */}
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-1 leading-tight">
            {preview.title}
          </h3>

          {/* Description */}
          {preview.description && (
            <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed mb-2">
              {preview.description}
            </p>
          )}

          {/* URL */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 truncate pr-2">
              {preview.domain}
            </span>
            
            {/* Error indicator */}
            {preview.error && (
              <span className="text-xs text-orange-500 bg-orange-50 px-2 py-1 rounded-full flex-shrink-0">
                Preview limitado
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Click overlay for opening link */}
      <button
        type="button"
        className="absolute inset-0 w-full h-full bg-transparent hover:bg-black/5 transition-colors z-0"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          window.open(preview.url, '_blank', 'noopener,noreferrer')
        }}
        title={`Abrir ${preview.title}`}
      />
    </div>
  )
}

// Skeleton component for loading state
export function LinkPreviewSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="flex">
        <div className="w-32 h-24 bg-gray-200 animate-pulse flex-shrink-0" />
        <div className="flex-1 p-3">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-4 h-4 bg-gray-200 rounded-sm animate-pulse" />
            <div className="w-20 h-3 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="w-full h-4 bg-gray-200 rounded animate-pulse mb-1" />
          <div className="w-3/4 h-4 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="w-2/3 h-3 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="w-1/2 h-3 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    </div>
  )
}
