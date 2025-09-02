import { useState, useEffect, useCallback } from 'react'

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

interface UseLinkPreviewReturn {
  linkPreview: LinkPreview | null
  isLoading: boolean
  error: string | null
  clearPreview: () => void
}

// URL regex pattern to detect links
const URL_REGEX = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g

export function useLinkPreview(text: string): UseLinkPreviewReturn {
  const [linkPreview, setLinkPreview] = useState<LinkPreview | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastProcessedUrl, setLastProcessedUrl] = useState<string | null>(null)

  const fetchLinkPreview = useCallback(async (url: string) => {
    if (url === lastProcessedUrl) return // Avoid refetching the same URL

    setIsLoading(true)
    setError(null)
    setLastProcessedUrl(url)

    try {
      const response = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch link preview')
      }

      const data = await response.json()
      
      if (data.error) {
        setError(data.error)
        // Still show basic preview even with error
        setLinkPreview(data)
      } else {
        setLinkPreview(data)
      }
    } catch (err: any) {
      console.error('Link preview error:', err)
      setError(err.message || 'Failed to fetch link preview')
      setLinkPreview(null)
    } finally {
      setIsLoading(false)
    }
  }, [lastProcessedUrl])

  const clearPreview = useCallback(() => {
    setLinkPreview(null)
    setError(null)
    setIsLoading(false)
    setLastProcessedUrl(null)
  }, [])

  useEffect(() => {
    if (!text.trim()) {
      if (linkPreview) clearPreview()
      return
    }

    // Extract URLs from text
    const urls = text.match(URL_REGEX)
    
    if (!urls || urls.length === 0) {
      if (linkPreview) clearPreview()
      return
    }

    // Use the first URL found
    const firstUrl = urls[0]
    
    // Only fetch if URL is different from current
    if (firstUrl !== lastProcessedUrl) {
      const timeoutId = setTimeout(() => {
        fetchLinkPreview(firstUrl)
      }, 500) // Debounce for 500ms

      return () => clearTimeout(timeoutId)
    }
  }, [text, linkPreview, lastProcessedUrl, fetchLinkPreview, clearPreview])

  return {
    linkPreview,
    isLoading,
    error,
    clearPreview
  }
}

// Utility function to extract URLs from text
export function extractUrls(text: string): string[] {
  const matches = text.match(URL_REGEX)
  return matches || []
}

// Utility function to check if text contains URLs
export function hasUrls(text: string): boolean {
  return URL_REGEX.test(text)
}
