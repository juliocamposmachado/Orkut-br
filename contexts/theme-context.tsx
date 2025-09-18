'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

// Simplified theme system - only light theme
type Theme = 'light'

interface ThemeContextType {
  theme: Theme
  isDark: boolean
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

interface ThemeProviderProps {
  children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)

  // Basic mounting to prevent hydration issues
  useEffect(() => {
    setMounted(true)
    
    // Apply light theme to document
    if (typeof window !== 'undefined') {
      const root = window.document.documentElement
      root.classList.add('light')
      root.setAttribute('data-theme', 'light')
      console.log('🎨 Tema aplicado: light')
    }
  }, [])

  const setTheme = () => {
    // Only supports light theme - no operation needed
    console.log('📝 Tema fixo: light')
  }

  const value: ThemeContextType = {
    theme: 'light',
    isDark: false,
    setTheme
  }

  // Prevent hydration mismatch
  if (!mounted) {
    return <>{children}</>
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}
