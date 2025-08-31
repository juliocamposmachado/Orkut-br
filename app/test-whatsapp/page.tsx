'use client';

import { WhatsAppTestPage } from '@/components/WhatsAppTestPage';
import { Toaster } from 'sonner';

export default function TestWhatsAppPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <WhatsAppTestPage />
      <Toaster position="top-right" richColors />
    </div>
  );
}
