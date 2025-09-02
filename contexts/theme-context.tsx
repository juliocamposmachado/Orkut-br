'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

type Theme = 'light' | 'dark' | 'blue' | 'green' | 'purple' | 'pink' | 'orange' | 'red' | 'teal' | 'indigo' | 'yellow' | 'slate'

type WallpaperType = 'solid' | 'gradient' | 'pattern' | 'image'

interface WallpaperConfig {
  type: WallpaperType
  value: string // CSS value or image URL
  name: string
  preview?: string
}

interface VisualTheme {
  id: string
  name: string
  description: string
  colorTheme: Theme
  wallpaper: WallpaperConfig
  isDark?: boolean
}

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
  isDark: boolean
  // New visual customization
  currentVisualTheme: VisualTheme
  setVisualTheme: (theme: VisualTheme) => void
  wallpaper: WallpaperConfig
  setWallpaper: (wallpaper: WallpaperConfig) => void
  resetToDefault: () => void
}

// Predefined wallpapers similar to Google Chrome
const defaultWallpapers: WallpaperConfig[] = [
  {
    type: 'solid',
    value: '#ffffff',
    name: 'Branco Puro',
    preview: '#ffffff'
  },
  {
    type: 'solid',
    value: '#000000',
    name: 'Preto',
    preview: '#000000'
  },
  {
    type: 'gradient',
    value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    name: 'Roxo Místico',
    preview: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  },
  {
    type: 'gradient',
    value: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    name: 'Rosa Pôr do Sol',
    preview: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
  },
  {
    type: 'gradient',
    value: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    name: 'Azul Oceano',
    preview: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
  },
  {
    type: 'gradient',
    value: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    name: 'Verde Esmeralda',
    preview: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
  },
  {
    type: 'gradient',
    value: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    name: 'Laranja Vibrante',
    preview: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
  },
  {
    type: 'pattern',
    value: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)',
    name: 'Bolinhas',
    preview: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)'
  }
]

// Predefined visual themes
const defaultVisualThemes: VisualTheme[] = [
  {
    id: 'orkut-classic',
    name: 'Orkut Clássico',
    description: 'O visual nostálgico do Orkut original',
    colorTheme: 'purple',
    wallpaper: {
      type: 'gradient',
      value: 'linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%)',
      name: 'Gradiente Orkut'
    }
  },
  {
    id: 'dark-modern',
    name: 'Escuro Moderno',
    description: 'Visual escuro e elegante',
    colorTheme: 'dark',
    wallpaper: {
      type: 'gradient',
      value: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
      name: 'Gradiente Escuro'
    },
    isDark: true
  },
  {
    id: 'ocean-blue',
    name: 'Azul Oceano',
    description: 'Inspirado nas profundezas do mar',
    colorTheme: 'blue',
    wallpaper: {
      type: 'gradient',
      value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      name: 'Oceano Profundo'
    }
  }
]

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
  const [currentVisualTheme, setCurrentVisualTheme] = useState<VisualTheme>(defaultVisualThemes[0])
  const [wallpaper, setWallpaperState] = useState<WallpaperConfig>(defaultWallpapers[0])

  // Evitar hidration mismatch
  useEffect(() => {
    setMounted(true)
    
    // Carregar configurações salvas do localStorage
    if (typeof window !== 'undefined') {
      // Carregar tema de cores
      const savedTheme = localStorage.getItem('orkut_theme') as Theme
      if (savedTheme) {
        setThemeState(savedTheme)
        applyTheme(savedTheme)
      } else {
        // Detectar preferência do sistema
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        const defaultTheme: Theme = systemPrefersDark ? 'dark' : 'light'
        setThemeState(defaultTheme)
        applyTheme(defaultTheme)
      }

      // Carregar tema visual completo
      const savedVisualTheme = localStorage.getItem('orkut_visual_theme')
      if (savedVisualTheme) {
        try {
          const parsedTheme = JSON.parse(savedVisualTheme) as VisualTheme
          setCurrentVisualTheme(parsedTheme)
          applyVisualTheme(parsedTheme)
        } catch (e) {
          console.warn('Erro ao carregar tema visual salvo:', e)
        }
      }

      // Carregar wallpaper
      const savedWallpaper = localStorage.getItem('orkut_wallpaper')
      if (savedWallpaper) {
        try {
          const parsedWallpaper = JSON.parse(savedWallpaper) as WallpaperConfig
          setWallpaperState(parsedWallpaper)
          applyWallpaper(parsedWallpaper)
        } catch (e) {
          console.warn('Erro ao carregar wallpaper salvo:', e)
        }
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
      
      // Remover classes anteriores
      const allThemes = ['light', 'dark', 'blue', 'green', 'purple', 'pink', 'orange', 'red', 'teal', 'indigo', 'yellow', 'slate']
      root.classList.remove(...allThemes)
      
      // Adicionar nova classe
      root.classList.add(newTheme)
      
      // Definir atributo data-theme para compatibilidade adicional
      root.setAttribute('data-theme', newTheme)
      
      console.log(`🎨 Tema aplicado: ${newTheme}`)
    }
  }

  const applyWallpaper = (wallpaperConfig: WallpaperConfig) => {
    if (typeof window !== 'undefined') {
      // Temporariamente desabilitado para debug
      console.log(`🖼️ Wallpaper aplicado (DEBUG): ${wallpaperConfig.name} (${wallpaperConfig.type})`)
      // const root = window.document.documentElement
      
      // // Aplicar wallpaper como CSS custom property
      // if (wallpaperConfig.type === 'image') {
      //   root.style.setProperty('--orkut-wallpaper', `url(${wallpaperConfig.value})`)
      //   root.style.setProperty('--orkut-wallpaper-type', 'image')
      // } else {
      //   root.style.setProperty('--orkut-wallpaper', wallpaperConfig.value)
      //   root.style.setProperty('--orkut-wallpaper-type', wallpaperConfig.type)
      // }
      
      // // Aplicar data attribute para CSS específico do tipo
      // root.setAttribute('data-wallpaper-type', wallpaperConfig.type)
    }
  }

  const applyVisualTheme = (visualTheme: VisualTheme) => {
    applyTheme(visualTheme.colorTheme)
    applyWallpaper(visualTheme.wallpaper)
    console.log(`🎭 Tema visual aplicado: ${visualTheme.name}`)
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

  const setVisualTheme = (newVisualTheme: VisualTheme) => {
    setCurrentVisualTheme(newVisualTheme)
    setThemeState(newVisualTheme.colorTheme)
    setWallpaperState(newVisualTheme.wallpaper)
    applyVisualTheme(newVisualTheme)
    
    // Salvar no localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('orkut_visual_theme', JSON.stringify(newVisualTheme))
      localStorage.setItem('orkut_theme', newVisualTheme.colorTheme)
      localStorage.setItem('orkut_wallpaper', JSON.stringify(newVisualTheme.wallpaper))
      console.log(`💾 Tema visual salvo: ${newVisualTheme.name}`)
    }
  }

  const setWallpaper = (newWallpaper: WallpaperConfig) => {
    setWallpaperState(newWallpaper)
    applyWallpaper(newWallpaper)
    
    // Salvar no localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('orkut_wallpaper', JSON.stringify(newWallpaper))
      console.log(`💾 Wallpaper salvo: ${newWallpaper.name}`)
    }
  }

  const resetToDefault = () => {
    const defaultVisualTheme = defaultVisualThemes[0]
    setVisualTheme(defaultVisualTheme)
    
    // Limpar localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('orkut_visual_theme')
      localStorage.removeItem('orkut_wallpaper')
      console.log('🔄 Configurações resetadas para o padrão')
    }
  }

  const toggleTheme = () => {
    // Cicla apenas entre light e dark para compatibilidade com toggle simples
    const newTheme: Theme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
  }

  const value: ThemeContextType = {
    theme: mounted ? theme : 'light', // Evitar hidration issues
    toggleTheme,
    setTheme,
    isDark: mounted ? (currentVisualTheme.isDark || theme === 'dark') : false,
    // New visual customization
    currentVisualTheme: mounted ? currentVisualTheme : defaultVisualThemes[0],
    setVisualTheme,
    wallpaper: mounted ? wallpaper : defaultWallpapers[0],
    setWallpaper,
    resetToDefault
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
