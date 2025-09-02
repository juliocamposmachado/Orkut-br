'use client'

import { useTheme } from '@/contexts/theme-context'
import { Button } from '@/components/ui/button'
import { Sun, Moon, Monitor } from 'lucide-react'
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

  const toggleOptions = [
    {
      value: 'light' as const,
      label: 'Modo Claro',
      icon: Sun,
      description: 'Visual claro e colorido'
    },
    {
      value: 'dark' as const,
      label: 'Modo Escuro',
      icon: Moon,
      description: 'Visual escuro e suave'
    },
  ]

  const currentOption = toggleOptions.find(option => option.value === theme)
  const CurrentIcon = currentOption?.icon || Sun

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
          w-48 p-2 border rounded-lg shadow-lg backdrop-blur-sm
          ${isDark 
            ? 'bg-gray-900/95 border-gray-700 text-gray-100' 
            : 'bg-white/95 border-purple-200'
          }
        `}
      >
        {toggleOptions.map((option) => {
          const Icon = option.icon
          const isActive = theme === option.value
          
          return (
            <DropdownMenuItem
              key={option.value}
              onClick={() => {
                setTheme(option.value)
                setIsOpen(false)
              }}
              className={`
                flex items-center gap-3 p-3 rounded-md transition-all duration-150 cursor-pointer
                ${isActive 
                  ? isDark 
                    ? 'bg-purple-700/50 text-purple-200' 
                    : 'bg-purple-100 text-purple-700'
                  : isDark
                    ? 'hover:bg-gray-800/70 text-gray-300 hover:text-white'
                    : 'hover:bg-purple-50 text-gray-700 hover:text-purple-700'
                }
              `}
            >
              <Icon className={`
                h-4 w-4 transition-colors
                ${isActive 
                  ? 'text-purple-500' 
                  : isDark ? 'text-gray-400' : 'text-gray-600'
                }
              `} />
              <div className="flex-1">
                <div className="text-sm font-medium">{option.label}</div>
                <div className="text-xs opacity-75">{option.description}</div>
              </div>
              {isActive && (
                <div className={`
                  w-2 h-2 rounded-full transition-colors
                  ${isDark ? 'bg-purple-400' : 'bg-purple-500'}
                `} />
              )}
            </DropdownMenuItem>
          )
        })}
        
        <div className={`
          mt-2 pt-2 border-t text-center
          ${isDark ? 'border-gray-700' : 'border-purple-100'}
        `}>
          <p className={`
            text-xs transition-colors
            ${isDark ? 'text-gray-400' : 'text-gray-500'}
          `}>
            🎨 Personalize sua experiência
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
