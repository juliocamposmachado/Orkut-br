'use client'

import { useState, useRef, useEffect } from 'react'
import { useTheme } from '@/contexts/theme-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Palette, 
  Upload, 
  RotateCcw, 
  Check, 
  Eye, 
  Sparkles,
  Image as ImageIcon,
  Layers,
  Circle
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Wallpapers adicionais estilo Google Chrome
const chromeWallpapers = [
  {
    type: 'gradient' as const,
    value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    name: 'Roxo Místico',
    category: 'Gradientes'
  },
  {
    type: 'gradient' as const,
    value: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    name: 'Rosa Pôr do Sol',
    category: 'Gradientes'
  },
  {
    type: 'gradient' as const,
    value: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    name: 'Azul Oceano',
    category: 'Gradientes'
  },
  {
    type: 'gradient' as const,
    value: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    name: 'Verde Esmeralda',
    category: 'Gradientes'
  },
  {
    type: 'gradient' as const,
    value: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    name: 'Laranja Vibrante',
    category: 'Gradientes'
  },
  {
    type: 'gradient' as const,
    value: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    name: 'Rosa Suave',
    category: 'Gradientes'
  },
  {
    type: 'solid' as const,
    value: '#ffffff',
    name: 'Branco Puro',
    category: 'Cores Sólidas'
  },
  {
    type: 'solid' as const,
    value: '#000000',
    name: 'Preto',
    category: 'Cores Sólidas'
  },
  {
    type: 'solid' as const,
    value: '#f8fafc',
    name: 'Cinza Claro',
    category: 'Cores Sólidas'
  },
  {
    type: 'solid' as const,
    value: '#1e293b',
    name: 'Cinza Escuro',
    category: 'Cores Sólidas'
  },
  {
    type: 'pattern' as const,
    value: `
      radial-gradient(circle at 25px 25px, rgba(255,255,255,0.2) 2%, transparent 3%),
      linear-gradient(135deg, #667eea 0%, #764ba2 100%)
    `,
    name: 'Pontos Roxo',
    category: 'Padrões'
  },
  {
    type: 'pattern' as const,
    value: `
      linear-gradient(90deg, rgba(255,255,255,0.1) 50%, transparent 51%),
      linear-gradient(rgba(255,255,255,0.1) 50%, transparent 51%),
      linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)
    `,
    name: 'Grid Azul',
    category: 'Padrões'
  }
]

// Temas visuais pré-definidos
const visualThemes = [
  {
    id: 'orkut-classic',
    name: 'Orkut Clássico',
    description: 'O visual nostálgico do Orkut original',
    colorTheme: 'purple' as const,
    wallpaper: {
      type: 'gradient' as const,
      value: 'linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%)',
      name: 'Gradiente Orkut'
    },
    preview: 'linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%)'
  },
  {
    id: 'dark-modern',
    name: 'Escuro Moderno',
    description: 'Visual escuro e elegante',
    colorTheme: 'dark' as const,
    wallpaper: {
      type: 'gradient' as const,
      value: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
      name: 'Gradiente Escuro'
    },
    isDark: true,
    preview: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)'
  },
  {
    id: 'ocean-blue',
    name: 'Azul Oceano',
    description: 'Inspirado nas profundezas do mar',
    colorTheme: 'blue' as const,
    wallpaper: {
      type: 'gradient' as const,
      value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      name: 'Oceano Profundo'
    },
    preview: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  },
  {
    id: 'sunset-pink',
    name: 'Pôr do Sol Rosa',
    description: 'Cores quentes do entardecer',
    colorTheme: 'pink' as const,
    wallpaper: {
      type: 'gradient' as const,
      value: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      name: 'Rosa Pôr do Sol'
    },
    preview: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
  },
  {
    id: 'forest-green',
    name: 'Verde Floresta',
    description: 'A tranquilidade da natureza',
    colorTheme: 'green' as const,
    wallpaper: {
      type: 'gradient' as const,
      value: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      name: 'Verde Esmeralda'
    },
    preview: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
  }
]

interface AppearanceCustomizerProps {
  className?: string
}

export function AppearanceCustomizer({ className }: AppearanceCustomizerProps) {
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<'themes' | 'wallpapers' | 'custom'>('themes')
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Aguardar montagem para evitar problemas de SSR
  useEffect(() => {
    setMounted(true)
  }, [])

  // Hook do tema com verificação de segurança
  const themeHookResult = mounted ? (() => {
    try {
      return useTheme()
    } catch (error) {
      console.warn('Theme hook error:', error)
      return null
    }
  })() : null

  // Se não estiver montado ou houver erro no hook, mostrar loading
  if (!mounted || !themeHookResult) {
    return (
      <div className={cn("space-y-6 animate-pulse", className)}>
        <div className="h-20 bg-gray-200 rounded"></div>
        <div className="h-40 bg-gray-200 rounded"></div>
        <div className="h-60 bg-gray-200 rounded"></div>
      </div>
    )
  }

  const { 
    currentVisualTheme, 
    setVisualTheme, 
    wallpaper, 
    setWallpaper, 
    resetToDefault 
  } = themeHookResult

  const categories = ['Todos', 'Gradientes', 'Cores Sólidas', 'Padrões']
  
  const filteredWallpapers = selectedCategory === 'Todos' 
    ? chromeWallpapers 
    : chromeWallpapers.filter(w => w.category === selectedCategory)

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string
        const customWallpaper = {
          type: 'image' as const,
          value: imageUrl,
          name: `Imagem: ${file.name}`,
          preview: imageUrl
        }
        setWallpaper(customWallpaper)
      }
      reader.readAsDataURL(file)
    }
  }

  const TabButton = ({ 
    id, 
    label, 
    icon: Icon, 
    isActive 
  }: { 
    id: string
    label: string
    icon: any
    isActive: boolean 
  }) => (
    <button
      onClick={() => setActiveTab(id as any)}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors",
        isActive 
          ? "bg-purple-100 text-purple-700 border-2 border-purple-200" 
          : "text-gray-600 hover:bg-gray-100"
      )}
    >
      <Icon size={18} />
      {label}
    </button>
  )

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-purple-100 rounded-lg">
          <Palette className="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">Personalizar Aparência</h2>
          <p className="text-gray-600 text-sm">
            Customize o visual do seu Orkut como no Google Chrome
          </p>
        </div>
      </div>

      {/* Preview atual */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Visualização Atual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div 
              className="w-16 h-12 rounded-lg border-2 border-white shadow-md"
              style={{ 
                background: wallpaper.type === 'image' 
                  ? `url(${wallpaper.value}) center/cover`
                  : wallpaper.value 
              }}
            />
            <div>
              <h3 className="font-semibold text-gray-800">{currentVisualTheme.name}</h3>
              <p className="text-sm text-gray-600">{currentVisualTheme.description}</p>
              <Badge variant="outline" className="mt-1">
                {wallpaper.name}
              </Badge>
            </div>
            <div className="ml-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={resetToDefault}
                className="flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Restaurar Padrão
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Tabs */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
        <TabButton
          id="themes"
          label="Temas Completos"
          icon={Sparkles}
          isActive={activeTab === 'themes'}
        />
        <TabButton
          id="wallpapers"
          label="Papéis de Parede"
          icon={ImageIcon}
          isActive={activeTab === 'wallpapers'}
        />
        <TabButton
          id="custom"
          label="Personalizado"
          icon={Upload}
          isActive={activeTab === 'custom'}
        />
      </div>

      {/* Content */}
      <Card>
        <CardContent className="p-6">
          {activeTab === 'themes' && (
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Temas Visuais Completos
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {visualThemes.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => setVisualTheme(theme)}
                    className={cn(
                      "group relative p-4 rounded-lg border-2 transition-all duration-200 text-left",
                      currentVisualTheme.id === theme.id
                        ? "border-purple-500 bg-purple-50 shadow-md"
                        : "border-gray-200 hover:border-purple-300 hover:shadow-sm"
                    )}
                  >
                    <div 
                      className="w-full h-20 rounded-md mb-3 border"
                      style={{ background: theme.preview }}
                    />
                    <h4 className="font-semibold text-gray-800 mb-1">
                      {theme.name}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {theme.description}
                    </p>
                    
                    {currentVisualTheme.id === theme.id && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'wallpapers' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  Papéis de Parede
                </h3>
                
                {/* Category Filter */}
                <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={cn(
                        "px-3 py-1 rounded-md text-sm font-medium transition-colors",
                        selectedCategory === category
                          ? "bg-white text-purple-600 shadow-sm"
                          : "text-gray-600 hover:text-gray-800"
                      )}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {filteredWallpapers.map((wp, index) => (
                  <button
                    key={index}
                    onClick={() => setWallpaper({
                      type: wp.type,
                      value: wp.value,
                      name: wp.name
                    })}
                    className={cn(
                      "group relative aspect-video rounded-lg border-2 transition-all duration-200 overflow-hidden",
                      wallpaper.name === wp.name
                        ? "border-purple-500 shadow-md"
                        : "border-gray-200 hover:border-purple-300 hover:shadow-sm"
                    )}
                    title={wp.name}
                  >
                    <div 
                      className="w-full h-full"
                      style={{ background: wp.value }}
                    />
                    
                    {/* Icon overlay */}
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      {wp.type === 'gradient' && <Layers className="w-6 h-6 text-white" />}
                      {wp.type === 'solid' && <Circle className="w-6 h-6 text-white" />}
                      {wp.type === 'pattern' && <ImageIcon className="w-6 h-6 text-white" />}
                    </div>
                    
                    {wallpaper.name === wp.name && (
                      <div className="absolute top-1 right-1 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'custom' && (
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload Personalizado
              </h3>
              
              <div className="space-y-4">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-400 hover:bg-purple-50 transition-colors cursor-pointer"
                >
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-700 mb-2">
                    Fazer upload de imagem
                  </h4>
                  <p className="text-gray-500 text-sm">
                    Clique para selecionar uma imagem do seu computador
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    Formatos suportados: JPG, PNG, GIF (máx. 5MB)
                  </p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />

                {wallpaper.type === 'image' && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-700 mb-2">Imagem atual:</h4>
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-16 h-12 rounded border bg-cover bg-center"
                        style={{ backgroundImage: `url(${wallpaper.value})` }}
                      />
                      <div>
                        <p className="text-sm font-medium">{wallpaper.name}</p>
                        <p className="text-xs text-gray-500">Imagem personalizada</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
