'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

interface AnimatediFoodButtonProps {
  className?: string
  width?: number
  height?: number
}

export function AnimatediFoodButton({ 
  className = "", 
  width = 32, 
  height = 32 
}: AnimatediFoodButtonProps) {
  const [currentState, setCurrentState] = useState<'logo' | 'text'>('logo')
  const [currentTextIndex, setCurrentTextIndex] = useState(0)
  
  const texts = ['Peça Agora', 'Cerveja', 'Whisky', 'Vodka', 'Cachaça', 'Vinho', 'Gin']
  
  useEffect(() => {
    let timeoutId: NodeJS.Timeout
    
    const cycle = () => {
      if (currentState === 'logo') {
        // Mostra logo por 5 segundos, depois muda para texto
        timeoutId = setTimeout(() => {
          setCurrentState('text')
          setCurrentTextIndex(0)
        }, 5000)
      } else {
        // Cicla pelos textos a cada 1.5 segundos
        timeoutId = setTimeout(() => {
          if (currentTextIndex < texts.length - 1) {
            setCurrentTextIndex(currentTextIndex + 1)
          } else {
            // Volta para o logo após o último texto
            setCurrentState('logo')
            setCurrentTextIndex(0)
          }
        }, 1500)
      }
    }
    
    cycle()
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [currentState, currentTextIndex, texts.length])
  
  return (
    <div 
      className={`flex items-center justify-center transition-all duration-500 ${className}`}
      style={{ 
        width: `${width}px`, 
        height: `${height}px`,
        minWidth: `${width}px`,
        minHeight: `${height}px`
      }}
    >
      {currentState === 'logo' ? (
        <Image 
          src="/ifood-logo.svg" 
          alt="iFood - Adega Rádio Tatuapé FM" 
          width={width} 
          height={height} 
          className="transition-all duration-300 rounded-full animate-pulse"
        />
      ) : (
        <span 
          className="text-white font-bold text-xs whitespace-nowrap animate-bounce overflow-hidden text-center leading-tight"
          style={{ 
            fontSize: width > 24 ? '10px' : '8px',
            maxWidth: `${width + 20}px` // Um pouco mais largo para o texto
          }}
        >
          {texts[currentTextIndex]}
        </span>
      )}
    </div>
  )
}
