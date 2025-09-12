'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/enhanced-auth-context';
import VideoCallOrkut from '@/components/webrtc/VideoCallOrkut';

// Força rendering dinâmico para evitar erros SSR com WebRTC
export const dynamic = 'force-dynamic';

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profile } = useAuth();
  const [userId, setUserId] = useState('');

  // Generate user ID on mount
  useEffect(() => {
    if (user?.id) {
      setUserId(user.id);
    } else {
      // Fallback para usuários não autenticados (demo)
      const id = `guest_${Math.random().toString(36).substring(2, 15)}`;
      setUserId(id);
    }
  }, [user]);

  const handleLeaveRoom = () => {
    router.push('/chamadas');
  };

  const roomId = params?.roomId as string;
  const callType = (searchParams?.get('type') as 'individual' | 'group') || 'individual';

  // Redirect to login if no user (optional, pode permitir guests)
  useEffect(() => {
    if (!user && process.env.NODE_ENV === 'production') {
      // Em produção, redirecionar para login
      router.push('/login?redirect=' + encodeURIComponent(`/chamadas/${roomId}`));
    }
  }, [user, router, roomId]);

  if (!roomId || !userId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-6"></div>
          <p className="text-xl font-medium mb-2">Carregando sala...</p>
          <p className="text-white/60">Preparando sua experiência de chamada</p>
        </div>
      </div>
    );
  }

  return (
    <VideoCallOrkut 
      roomId={roomId} 
      userId={userId} 
      onLeaveRoom={handleLeaveRoom} 
      callType={callType}
    />
  );
}
