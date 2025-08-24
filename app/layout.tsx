import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/contexts/enhanced-auth-context';
import { VoiceProvider } from '@/contexts/voice-context';
import { OnlineStatusProvider } from '@/contexts/OnlineStatusContext';
import { WebRTCProvider } from '@/contexts/webrtc-context';
import { Toaster } from '@/components/ui/sonner';
import { StructuredData } from '@/components/seo/structured-data';
import { CallManager } from '@/components/calls/call-manager';
import { WebRTCDiagnostics } from '@/components/webrtc-diagnostics';
import { WebRTCTest } from '@/components/webrtc-test';
import { EventListenerMonitor } from '@/components/debug/event-listener-monitor';

const inter = Inter({ subsets: ['latin'] });

// Função para determinar a URL base dinamicamente
const getBaseUrl = () => {
  // Em desenvolvimento, usar localhost
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000'
  }
  // Em produção, usar a URL configurada ou padrão
  return process.env.NEXT_PUBLIC_SITE_URL || 'https://orkut-br-oficial.vercel.app'
}

export const metadata: Metadata = {
  metadataBase: new URL(getBaseUrl()),
  applicationName: 'Orkut - Nova Geração',
  title: {
    default: '🚀 ORKUT.BR - Rede Social Completa em 3 Dias! | TRIO MARCIANO',
    template: '%s | Orkut.br - Revolução Nostálgica'
  },
  description: '🔥 FEITO HISTÓRICO: Rede social completa criada em apenas 72 HORAS! Login Google, fotos, amizades, WebRTC - tudo funcionando 100%. Criado pelo TRIO MARCIANO: Julio Cesar + Claude AI + Warp Terminal. Nostalgia dos anos 2000 + tecnologia moderna!',
  keywords: [
    'orkut', 'rede social', 'nostalgia', 'amigos', 'comunidades', 'recados', 'fotos',
    'anos 2000', 'social network', 'brasil', 'orkut retrô', 'orkut clone',
    'julio campos machado', 'like look solutions', 'desenvolvedor', 'programador'
  ],
  authors: [{
    name: 'Julio Campos Machado',
    url: 'https://likelook.wixsite.com/solutions'
  }],
  creator: 'Julio Campos Machado - Like Look Solutions',
  publisher: 'Like Look Solutions',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: 'https://orkut-br-oficial.vercel.app',
    siteName: 'ORKUT.BR - FEITO HISTÓRICO',
    title: '🚀🔥 ORKUT.BR - Rede Social Completa em 3 Dias! TRIO MARCIANO',
    description: 'FEITO HISTÓRICO: Rede social completa criada em 72 HORAS! Login Google, fotos, amizades, WebRTC. Criado pelo TRIO MARCIANO: Julio Cesar + Claude AI + Warp Terminal. 100% funcional!',
    images: [{
      url: '/divulgar-orkut.png',
      width: 1200,
      height: 630,
      alt: 'ORKUT.BR - Rede Social Completa em 3 Dias - TRIO MARCIANO'
    }]
  },
  twitter: {
    card: 'summary_large_image',
    title: '🚀 ORKUT.BR - Rede Social Completa em 3 Dias!',
    description: 'FEITO HISTÓRICO: 72 horas para criar uma rede social completa! TRIO MARCIANO em ação: Julio + Claude + Warp. 100% funcional!',
    images: ['/divulgar-orkut.png'],
    creator: '@juliocamposmachado'
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  category: 'social network',
  classification: 'Rede Social',
  other: {
    'contact:phone_number': '+5511992946628',
    'contact:email': 'juliocamposmachado@gmail.com',
    'business:contact_data:street_address': 'Rua Dante Pellacani, 92',
    'business:contact_data:locality': 'São Paulo',
    'business:contact_data:region': 'SP',
    'business:contact_data:country_name': 'Brasil',
    'developer': 'Julio Campos Machado',
    'company': 'Like Look Solutions',
    'company:website': 'https://likelook.wixsite.com/solutions',
    'whatsapp': '+5511992946628'
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        {/* Favicons */}
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        
        {/* Theme colors */}
        <meta name="theme-color" content="#E91E63" />
        <meta name="msapplication-TileColor" content="#E91E63" />
        
        {/* Additional SEO */}
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Orkut - Nova Geração" />
        
        {/* Developer and Company Info */}
        <meta name="author" content="Julio Campos Machado" />
        <meta name="designer" content="Julio Campos Machado - Like Look Solutions" />
        <meta name="developer" content="Julio Campos Machado" />
        <meta name="company" content="Like Look Solutions" />
        <meta name="contact" content="juliocamposmachado@gmail.com" />
        <meta name="phone" content="+5511992946628" />
        <link rel="canonical" href="https://orkut-br-oficial.vercel.app" />
      </head>
      <body className={inter.className}>
        <StructuredData />
        <AuthProvider>
          <OnlineStatusProvider>
            <WebRTCProvider>
              <VoiceProvider>
                {children}
                <CallManager />
                <WebRTCDiagnostics />
                <WebRTCTest />
                <EventListenerMonitor />
                <Toaster />
              </VoiceProvider>
            </WebRTCProvider>
          </OnlineStatusProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
