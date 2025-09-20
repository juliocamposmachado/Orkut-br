'use client';

import dynamic from 'next/dynamic';
import { Navbar } from '@/components/layout/navbar';
import { Video } from 'lucide-react';

// Carrega o componente de chamadas apenas no client-side
const ChamadasContent = dynamic(
  () => import('@/components/webrtc/ChamadasContent').then(mod => ({ default: mod.default })),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Video className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Central de Chamadas
          </h1>
          <p className="text-gray-600 text-lg">
            Conecte-se com seus amigos através de chamadas de vídeo e áudio
          </p>
        </div>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-purple-600">Carregando central de chamadas...</p>
        </div>
      </div>
    )
  }
);

export default function ChamadasPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <Navbar />
      <ChamadasContent />
    </div>
  );
}
