'use client'

import { useState, useEffect, useRef } from 'react';

interface UseIdleDetectionOptions {
  timeout?: number; // em milissegundos
  events?: string[];
}

export function useIdleDetection(options: UseIdleDetectionOptions = {}) {
  const {
    timeout = 60000, // 1 minuto por padrão
    events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
      'keydown',
      'wheel'
    ]
  } = options;

  const [isIdle, setIsIdle] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const eventListenersRef = useRef<(() => void)[]>([]);

  const resetTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    setIsIdle(false);
    
    timeoutRef.current = setTimeout(() => {
      setIsIdle(true);
    }, timeout);
  };

  const handleActivity = () => {
    resetTimer();
  };

  const resume = () => {
    setIsIdle(false);
    resetTimer();
  };

  useEffect(() => {
    // Adicionar event listeners
    const cleanupFunctions = events.map(event => {
      const handler = handleActivity;
      document.addEventListener(event, handler, true);
      
      return () => {
        document.removeEventListener(event, handler, true);
      };
    });

    eventListenersRef.current = cleanupFunctions;

    // Iniciar o timer
    resetTimer();

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      cleanupFunctions.forEach(cleanup => cleanup());
    };
  }, [timeout]);

  // Cleanup quando o componente for desmontado
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      eventListenersRef.current.forEach(cleanup => cleanup());
    };
  }, []);

  return {
    isIdle,
    resume
  };
}
