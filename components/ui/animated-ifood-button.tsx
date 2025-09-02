'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Crown } from 'lucide-react'

interface AnimatediFoodButtonProps {
  className?: string
}

export function AnimatediFoodButton({ 
  className = "" 
}: AnimatediFoodButtonProps) {
  const [currentState, setCurrentState] = useState<'logo' | 'text'>('logo')
  const [currentTextIndex, setCurrentTextIndex] = useState(0)
  
  const texts = ['iFood', 'Adega', 'Rádio', 'Tatuapé', 'FM', 'Cerveja', 'Whisky', 'Vodka', 'Cachaça', 'Vinho', 'Gin', 'Peça', 'Agora', '24 Horas']
  
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
    <div className={`flex items-center space-x-2 h-10 ${className}`} style={{ width: '100px' }}>
      {currentState === 'logo' ? (
        <>
          <Image 
            src="/ifood-logo.png" 
            alt="iFood - Adega Rádio Tatuapé FM" 
            width={20} 
            height={20} 
            className="transition-all duration-300 animate-pulse flex-shrink-0 rounded"
          />
          <span className="text-sm font-bold whitespace-nowrap truncate flex-1 text-center">Adega</span>
        </>
      ) : (
        <>
          <Crown className="h-4 w-4 flex-shrink-0 animate-bounce text-yellow-300" />
          <span className="text-sm font-bold whitespace-nowrap animate-pulse truncate flex-1 text-center">
            {texts[currentTextIndex]}
          </span>
        </>
      )}
    </div>
  )
}
