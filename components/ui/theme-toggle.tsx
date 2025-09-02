'use client'

import { useTheme } from '@/contexts/theme-context'
import { Button } from '@/components/ui/button'
import { Sun, Moon, Palette, Check } from 'lucide-react'
import { useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function ThemeToggle() {
  const { theme, setTheme, isDark } = useTheme()
  const [isOpen, setIsOpen] = useState(false)

  const themeOptions = [
    {
      value: 'light' as const,
      label: 'Claro',
      description: 'Tema padrão claro',
      colors: ['#ffffff', '#f8f9fa'],
      gradient: 'from-white to-gray-50'
    },
    {
      value: 'dark' as const,
      label: 'Escuro',
      description: 'Tema escuro suave',
      colors: ['#1f2937', '#111827'],
      gradient: 'from-gray-800 to-gray-900'
    },
    {
      value: 'blue' as const,
      label: 'Azul',
      description: 'Tons de azul oceano',
      colors: ['#3b82f6', '#1d4ed8'],
      gradient: 'from-blue-500 to-blue-700'
    },
    {
      value: 'green' as const,
      label: 'Verde',
      description: 'Verde natureza',
      colors: ['#10b981', '#059669'],
      gradient: 'from-emerald-500 to-emerald-600'
    },
    {
      value: 'purple' as const,
      label: 'Roxo',
      description: 'Roxo vibrante',
      colors: ['#8b5cf6', '#7c3aed'],
      gradient: 'from-violet-500 to-violet-600'
    },
    {
      value: 'pink' as const,
      label: 'Rosa',
      description: 'Rosa elegante',
      colors: ['#ec4899', '#db2777'],
      gradient: 'from-pink-500 to-pink-600'
    },
    {
      value: 'orange' as const,
      label: 'Laranja',
      description: 'Laranja energético',
      colors: ['#f97316', '#ea580c'],
      gradient: 'from-orange-500 to-orange-600'
    },
    {
      value: 'red' as const,
      label: 'Vermelho',
      description: 'Vermelho forte',
      colors: ['#ef4444', '#dc2626'],
      gradient: 'from-red-500 to-red-600'
    },
    {
      value: 'teal' as const,
      label: 'Azul-verde',
      description: 'Azul-verde relaxante',
      colors: ['#14b8a6', '#0d9488'],
      gradient: 'from-teal-500 to-teal-600'
    },
    {
      value: 'indigo' as const,
      label: 'Anil',
      description: 'Índigo profundo',
      colors: ['#6366f1', '#4f46e5'],
      gradient: 'from-indigo-500 to-indigo-600'
    },
    {
      value: 'yellow' as const,
      label: 'Amarelo',
      description: 'Amarelo dourado',
      colors: ['#eab308', '#ca8a04'],
      gradient: 'from-yellow-500 to-yellow-600'
    },
    {
      value: 'slate' as const,
      label: 'Cinza',
      description: 'Cinza moderno',
      colors: ['#64748b', '#475569'],
      gradient: 'from-slate-500 to-slate-600'
    },
  ]

  const currentOption = themeOptions.find(option => option.value === theme)
  const CurrentIcon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Palette

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`
            relative h-9 w-9 rounded-full transition-all duration-200
            ${isDark 
              ? 'bg-gray-800/50 hover:bg-gray-700/70 text-gray-300 hover:text-white' 
              : 'bg-white/10 hover:bg-white/20 text-white hover:text-yellow-100'
            }
          `}
          title={currentOption?.description || 'Alternar tema'}
        >
          <CurrentIcon className="h-4 w-4 transition-transform duration-200 hover:scale-110" />
          <span className="sr-only">Alternar tema</span>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        className={`
          w-80 p-4 border rounded-lg shadow-xl backdrop-blur-sm
          ${isDark 
            ? 'bg-gray-900/95 border-gray-700 text-gray-100' 
            : 'bg-white/95 border-purple-200'
          }
        `}
      >
        <div className="mb-3">
          <h3 className="text-sm font-semibold mb-1">Escolher Tema</h3>
          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Personalize a aparência do Orkut BR
          </p>
        </div>
        
        {/* Grid de Temas */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {themeOptions.map((option) => {
            const isActive = theme === option.value
            
            return (
              <button
                key={option.value}
                onClick={() => {
                  setTheme(option.value)
                  setIsOpen(false)
                }}
                className={`
                  relative group flex flex-col items-center p-3 rounded-lg transition-all duration-200
                  ${isActive 
                    ? 'ring-2 ring-purple-500 bg-purple-50' 
                    : 'hover:bg-gray-50 hover:scale-105'
                  }
                `}
                title={option.description}
              >
                {/* Preview do tema */}
                <div className="relative w-12 h-8 rounded-md overflow-hidden border-2 border-white shadow-sm mb-2">
                  <div className={`w-full h-full bg-gradient-to-br ${option.gradient}`} />
                  <div className="absolute inset-0 bg-black/10" />
                </div>
                
                {/* Nome do tema */}
                <span className={`text-xs font-medium transition-colors ${
                  isActive 
                    ? 'text-purple-700' 
                    : isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  {option.label}
                </span>
                
                {/* Indicador de seleção */}
                {isActive && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </button>
            )
          })}
        </div>
        
        {/* Informações do tema atual */}
        <div className={`
          p-3 rounded-lg border-t transition-colors
          ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}
        `}>
          <div className="flex items-center gap-2 mb-1">
            <CurrentIcon className="h-4 w-4 text-purple-500" />
            <span className="text-sm font-medium">
              Tema: {currentOption?.label || 'Personalizado'}
            </span>
          </div>
          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {currentOption?.description || 'Tema personalizado ativo'}
          </p>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Versão simples do toggle (apenas ícone)
export function SimpleThemeToggle() {
  const { toggleTheme, isDark } = useTheme()
  
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className={`
        h-9 w-9 rounded-full transition-all duration-200
        ${isDark 
          ? 'bg-gray-800/50 hover:bg-gray-700/70 text-yellow-400 hover:text-yellow-300' 
          : 'bg-white/10 hover:bg-white/20 text-white hover:text-yellow-100'
        }
      `}
      title={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
    >
      {isDark ? (
        <Sun className="h-4 w-4 transition-transform duration-200 hover:scale-110 hover:rotate-12" />
      ) : (
        <Moon className="h-4 w-4 transition-transform duration-200 hover:scale-110" />
      )}
      <span className="sr-only">
        {isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
      </span>
    </Button>
  )
}
