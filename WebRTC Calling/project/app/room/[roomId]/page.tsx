'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import VideoCall from '@/components/VideoCall';

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const [userId, setUserId] = useState('');

  // Generate user ID on mount
  useEffect(() => {
    const id = `user_${Math.random().toString(36).substring(2, 15)}`;
    setUserId(id);
  }, []);

  const handleLeaveRoom = () => {
    router.push('/');
  };

  const roomId = params?.roomId as string;

  if (!roomId || !userId) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading room...</p>
        </div>
      </div>
    );
  }

  return (
    <VideoCall 
      roomId={roomId} 
      userId={userId} 
      onLeaveRoom={handleLeaveRoom} 
    />
  );
}