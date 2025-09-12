'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import StreamingRoom from '@/components/StreamingRoom';
import { Loader2 } from 'lucide-react';

function StreamingPageContent() {
  const searchParams = useSearchParams();
  
  const roomId = searchParams.get('roomId') || undefined;
  const userId = searchParams.get('userId') || undefined;
  const userName = searchParams.get('userName') || undefined;
  const role = searchParams.get('role') as 'host' | 'viewer' | undefined;

  return (
    <StreamingRoom
      initialRoomId={roomId}
      initialUserId={userId}
      initialUserName={userName}
      initialRole={role}
    />
  );
}

export default function StreamingPage() {
  return (
    <Suspense 
      fallback={
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="flex items-center space-x-3 text-white">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="text-lg">Loading Stream Room...</span>
          </div>
        </div>
      }
    >
      <StreamingPageContent />
    </Suspense>
  );
}
