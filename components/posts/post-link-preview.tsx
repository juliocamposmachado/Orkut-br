import { ExternalLink } from 'lucide-react'

interface LinkPreview {
  url: string
  title: string
  description: string
  image: string | null
  siteName: string
  favicon: string | null
  domain: string
}

interface PostLinkPreviewProps {
  preview: LinkPreview
  className?: string
}

export function PostLinkPreview({ preview, className = '' }: PostLinkPreviewProps) {
  if (!preview) return null

  return (
    <div className={`mt-3 ${className}`}>
      <div 
        className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          window.open(preview.url, '_blank', 'noopener,noreferrer')
        }}
      >
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
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
