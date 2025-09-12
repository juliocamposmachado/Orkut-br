'use client'

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useIdleDetection } from '@/hooks/use-idle-detection';
import { Play, Pause, RotateCcw, Zap } from 'lucide-react';

interface IdleOverlayProps {
  timeout?: number;
}

export function IdleOverlay({ timeout = 1800000 }: IdleOverlayProps) {
  const { isIdle, resume } = useIdleDetection({ timeout });
  const [showOverlay, setShowOverlay] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    if (isIdle) {
      setShowOverlay(true);
      // Pequeno delay para o fade-in
      setTimeout(() => setFadeIn(true), 100);
    } else {
      setFadeIn(false);
      // Delay para o fade-out antes de remover o overlay
      setTimeout(() => setShowOverlay(false), 300);
    }
  }, [isIdle]);

  const handleResume = () => {
    setFadeIn(false);
    resume();
  };

  if (!showOverlay) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center transition-all duration-500 ${
        fadeIn 
          ? 'bg-white/90 backdrop-blur-sm opacity-100' 
          : 'bg-white/0 backdrop-blur-none opacity-0'
      }`}
      style={{ 
        backdropFilter: fadeIn ? 'blur(8px)' : 'blur(0px)',
        WebkitBackdropFilter: fadeIn ? 'blur(8px)' : 'blur(0px)'
      }}
    >
      <Card className={`max-w-md w-full mx-4 shadow-2xl transition-all duration-500 transform ${
        fadeIn ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
      }`}>
        <CardContent className="p-8 text-center space-y-6">
          {/* Ícone animado */}
          <div className="relative mx-auto w-20 h-20 mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full opacity-20 animate-pulse"></div>
            <div className="relative w-full h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Pause className="h-10 w-10 text-white" />
            </div>
          </div>

          {/* Título */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Site em Pausa ⏸️
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Pausamos nosso site para economizar a memória do seu navegador.
            </p>
          </div>

          {/* Informações */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-center space-x-2 text-purple-700">
              <Zap className="h-5 w-5" />
              <span className="font-medium">Economia de Recursos</span>
            </div>
            <p className="text-sm text-purple-600">
              Esta funcionalidade reduz o uso de memória e processamento quando você não está navegando ativamente.
            </p>
          </div>

          {/* Botão de retomar */}
          <Button
            onClick={handleResume}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium py-4 text-lg shadow-lg transform transition-all duration-200 hover:scale-105"
          >
            <Play className="mr-3 h-5 w-5" />
            Voltar ao Orkut
          </Button>

          {/* Informações técnicas */}
          <div className="pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              💡 <strong>Dica:</strong> O site pausa automaticamente após 30 minutos de inatividade
            </p>
          </div>

          {/* Branding */}
          <div className="flex items-center justify-center space-x-2 text-purple-600">
            <RotateCcw className="h-4 w-4" />
            <span className="text-sm font-medium">Orkut BR - Otimizado para você</span>
          </div>
        </CardContent>
      </Card>

      {/* Efeito de fundo decorativo */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className={`absolute top-10 left-10 w-32 h-32 bg-purple-200 rounded-full opacity-10 transition-transform duration-1000 ${
          fadeIn ? 'scale-100' : 'scale-0'
        }`}></div>
        <div className={`absolute bottom-10 right-10 w-24 h-24 bg-pink-200 rounded-full opacity-10 transition-transform duration-1000 delay-300 ${
          fadeIn ? 'scale-100' : 'scale-0'
        }`}></div>
        <div className={`absolute top-1/2 left-1/4 w-16 h-16 bg-purple-300 rounded-full opacity-5 transition-transform duration-1000 delay-500 ${
          fadeIn ? 'scale-100' : 'scale-0'
        }`}></div>
      </div>
    </div>
  );
}
