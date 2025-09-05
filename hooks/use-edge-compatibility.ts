'use client'

import { useEffect, useState } from 'react'

interface EdgeCompatibilityInfo {
  isEdge: boolean
  isEdgeLegacy: boolean
  isChromiumEdge: boolean
  needsPolyfills: boolean
  version?: string
}

export function useEdgeCompatibility(): EdgeCompatibilityInfo {
  const [edgeInfo, setEdgeInfo] = useState<EdgeCompatibilityInfo>({
    isEdge: false,
    isEdgeLegacy: false,
    isChromiumEdge: false,
    needsPolyfills: false,
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const userAgent = window.navigator.userAgent
    const isEdge = /Edge\/|Edg\//.test(userAgent)
    const isEdgeLegacy = /Edge\//.test(userAgent)
    const isChromiumEdge = /Edg\//.test(userAgent)
    
    // Extract version
    let version: string | undefined
    const versionMatch = userAgent.match(/Edge?\/(\d+)/)
    if (versionMatch) {
      version = versionMatch[1]
    }

    const needsPolyfills = isEdgeLegacy || (isEdge && parseInt(version || '0') < 79)

    setEdgeInfo({
      isEdge,
      isEdgeLegacy,
      isChromiumEdge,
      needsPolyfills,
      version,
    })

    // Apply Edge-specific fixes if needed
    if (isEdge) {
      console.log('🔧 Edge browser detected, applying compatibility fixes...')
      
      // Add Edge-specific class to body
      document.body.classList.add('is-edge')
      
      if (isEdgeLegacy) {
        document.body.classList.add('is-edge-legacy')
        console.log('⚠️ Edge Legacy detected - applying additional fixes')
      }
      
      if (isChromiumEdge) {
        document.body.classList.add('is-edge-chromium')
        console.log('✅ Chromium Edge detected')
      }

      // Fix button interaction issues
      const fixButtonInteractions = () => {
        const buttons = document.querySelectorAll('button, [role="button"], .cursor-pointer, [onclick]')
        buttons.forEach((button) => {
          const element = button as HTMLElement
          
          // Ensure pointer events work
          element.style.pointerEvents = 'auto'
          element.style.position = 'relative'
          element.style.zIndex = '1'
          element.style.cursor = 'pointer'
          
          // Add explicit touch-action
          element.style.touchAction = 'manipulation'
          
          // Edge specific properties
          ;(element.style as any).msUserSelect = 'none'
          ;(element.style as any).msTouchAction = 'manipulation'
          
          // For Edge Legacy, add onclick attribute if missing
          if (isEdgeLegacy && !element.onclick && !element.getAttribute('onclick')) {
            element.setAttribute('onclick', 'void(0);')
          }
          
          // Fix for Radix UI and shadcn components
          if (element.classList.contains('inline-flex') || element.closest('[data-radix-collection-item]')) {
            element.style.pointerEvents = 'auto'
            element.style.display = element.style.display || 'inline-flex'
          }
        })
        
        // Fix avatar images that might not load
        const avatarImages = document.querySelectorAll('img[alt*="Avatar"], img[src*="avatar"], .avatar img, [class*="avatar"] img')
        avatarImages.forEach((img) => {
          const imgElement = img as HTMLImageElement
          
          // Add error handler for failed image loads
          imgElement.onerror = function() {
            console.warn('🖼️ Avatar image failed to load:', imgElement.src)
            
            // Try to find fallback element
            const fallback = imgElement.nextElementSibling || imgElement.parentElement?.querySelector('[class*="fallback"]')
            if (fallback) {
              imgElement.style.display = 'none'
              ;(fallback as HTMLElement).style.display = 'flex'
            }
          }
          
          // Ensure proper loading attributes
          if (!imgElement.loading) {
            imgElement.loading = 'lazy'
          }
          
          // Add crossOrigin for external images if not set
          if (imgElement.src.includes('http') && !imgElement.crossOrigin) {
            imgElement.crossOrigin = 'anonymous'
          }
        })
        
        // Fix backdrop-filter elements
        const backdropElements = document.querySelectorAll('[class*="backdrop-"], .memorial-backdrop, .orkut-glass, .orkut-modal')
        backdropElements.forEach((element) => {
          const htmlElement = element as HTMLElement
          const computedStyle = window.getComputedStyle(htmlElement)
          
          // If backdrop-filter is not supported, apply fallback background
          if (!CSS.supports || (!CSS.supports('backdrop-filter', 'blur(10px)') && !CSS.supports('-webkit-backdrop-filter', 'blur(10px)'))) {
            const isDark = document.documentElement.classList.contains('dark') || document.body.classList.contains('dark')
            htmlElement.style.backgroundColor = isDark ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)'
            htmlElement.style.backdropFilter = 'none'
          }
        })
      }

      // Apply fixes immediately
      fixButtonInteractions()
      
      // Reapply fixes when DOM changes
      const observer = new MutationObserver(() => {
        fixButtonInteractions()
      })
      
      observer.observe(document.body, {
        childList: true,
        subtree: true,
      })

      // Cleanup function
      return () => {
        observer.disconnect()
        document.body.classList.remove('is-edge', 'is-edge-legacy', 'is-edge-chromium')
      }
    }
  }, [])

  return edgeInfo
}

// Utility function to check if current browser is Edge
export function isEdgeBrowser(): boolean {
  if (typeof window === 'undefined') return false
  return /Edge\/|Edg\//.test(window.navigator.userAgent)
}

// Utility function to apply Edge-specific fixes to an element
export function applyEdgeFixes(element: HTMLElement): void {
  if (!isEdgeBrowser()) return
  
  element.style.pointerEvents = 'auto'
  element.style.position = 'relative'
  element.style.zIndex = '1'
  element.style.touchAction = 'manipulation'
  
  // Ensure element has proper cursor
  if (element.tagName === 'BUTTON' || element.getAttribute('role') === 'button') {
    element.style.cursor = 'pointer'
    
    // For Edge Legacy, ensure onclick handler exists
    if (/Edge\//.test(navigator.userAgent) && !element.onclick) {
      element.setAttribute('onclick', 'void(0);')
    }
  }
}
