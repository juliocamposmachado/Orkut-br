import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/contexts/auth-context';
import { VoiceProvider } from '@/contexts/voice-context';
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Orkut Retrô - A rede social que você ama',
  description: 'Reviva os momentos especiais do Orkut com recursos modernos de voz e chamadas.',
  keywords: 'orkut, rede social, nostalgia, amigos, comunidades',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <AuthProvider>
          <VoiceProvider>
            {children}
            <Toaster />
          </VoiceProvider>
        </AuthProvider>
      </body>
    </html>
  );
}