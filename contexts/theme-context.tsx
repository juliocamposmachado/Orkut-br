'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
  isDark: boolean
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
  const [theme, setThemeState] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)

  // Evitar hidration mismatch
  useEffect(() => {
    setMounted(true)
    
    // Carregar tema salvo do localStorage
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('orkut_theme') as Theme
      if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
        setThemeState(savedTheme)
        applyTheme(savedTheme)
      } else {
        // Detectar preferência do sistema
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        const defaultTheme: Theme = systemPrefersDark ? 'dark' : 'light'
        setThemeState(defaultTheme)
        applyTheme(defaultTheme)
      }
    }
  }, [])

  // Listener para mudanças na preferência do sistema
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      
      const handleChange = (e: MediaQueryListEvent) => {
        // Só aplicar tema do sistema se o usuário não tiver escolhido manualmente
        const savedTheme = localStorage.getItem('orkut_theme')
        if (!savedTheme) {
          const systemTheme: Theme = e.matches ? 'dark' : 'light'
          setThemeState(systemTheme)
          applyTheme(systemTheme)
        }
      }

      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }
  }, [])

  const applyTheme = (newTheme: Theme) => {
    if (typeof window !== 'undefined') {
      const root = window.document.documentElement
      
      // Remover classe anterior
      root.classList.remove('light', 'dark')
      
      // Adicionar nova classe
      root.classList.add(newTheme)
      
      // Definir atributo data-theme para compatibilidade adicional
      root.setAttribute('data-theme', newTheme)
      
      console.log(`🎨 Tema aplicado: ${newTheme}`)
    }
  }

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    applyTheme(newTheme)
    
    // Salvar no localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('orkut_theme', newTheme)
      console.log(`💾 Tema salvo no localStorage: ${newTheme}`)
    }
  }

  const toggleTheme = () => {
    const newTheme: Theme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
  }

  const value: ThemeContextType = {
    theme: mounted ? theme : 'light', // Evitar hidration issues
    toggleTheme,
    setTheme,
    isDark: mounted ? theme === 'dark' : false
  }

  // Não renderizar até estar montado para evitar hidration mismatch
  if (!mounted) {
    return <>{children}</>
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}
