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
        const buttons = document.querySelectorAll('button, [role="button"]')
        buttons.forEach((button) => {
          const element = button as HTMLElement
          
          // Ensure pointer events work
          element.style.pointerEvents = 'auto'
          element.style.position = 'relative'
          element.style.zIndex = '1'
          
          // Add explicit touch-action
          element.style.touchAction = 'manipulation'
          
          // For Edge Legacy, add onclick attribute if missing
          if (isEdgeLegacy && !element.onclick && !element.getAttribute('onclick')) {
            element.setAttribute('onclick', 'void(0);')
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
