import './globals.css';
import './globals-responsive.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/contexts/auth-context';
import { PasteDBAuthProvider } from '@/contexts/pastedb-auth-context';
import { VoiceProvider } from '@/contexts/voice-context';
import { OnlineStatusProvider } from '@/contexts/OnlineStatusContext';
import { WebRTCProvider } from '@/contexts/webrtc-context';
import { RadioProvider } from '@/contexts/RadioContext';
import { FriendsProvider } from '@/contexts/FriendsContext';
import { ThemeProvider } from '@/contexts/theme-context';
import { Toaster } from '@/components/ui/sonner';
import { StructuredData } from '@/components/seo/structured-data';
import { IdleOverlay } from '@/components/idle-overlay';
import { CallManager } from '@/components/calls/call-manager';
import { EdgeCompatibility } from '@/components/edge-compatibility';
import { PWAInstaller } from '@/components/PWAInstaller';
import { NotificationProvider } from '@/components/NotificationSystem';
import { CallProviderWrapper } from '@/components/providers/call-provider-wrapper';
// Import polyfills to fix runtime errors
import '@/lib/polyfills';
// WebRTC diagnostics moved to developer dashboard
// import { EventListenerMonitor } from '@/components/debug/event-listener-monitor';

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
  applicationName: 'Orkut BR - Full-Stack Social Network Platform',
  title: {
    default: 'Orkut BR - Modern Social Network | Next.js + Supabase + WebRTC | Julio Campos Machado',
    template: '%s | Orkut BR - Full-Stack Development Portfolio'
  },
  description: 'Orkut BR: Full-stack social network platform built with Next.js 13, React, TypeScript, Supabase, WebRTC, and modern web technologies. Features real-time messaging, video/audio calls, OAuth authentication, and responsive design. Portfolio project demonstrating advanced web development skills by Julio Campos Machado.',
  keywords: [
    // Full-Stack Development
    'full stack developer', 'next.js developer', 'react developer', 'typescript developer',
    'supabase developer', 'vercel deployment', 'web development portfolio',
    
    // Frontend Technologies
    'nextjs 13', 'react 18', 'typescript', 'tailwindcss', 'responsive design',
    'modern web development', 'component architecture', 'server components',
    
    // Backend & Database
    'supabase', 'postgresql', 'real-time database', 'row level security',
    'database design', 'authentication system', 'oauth integration',
    
    // Advanced Features
    'webrtc implementation', 'real-time messaging', 'video calls', 'audio calls',
    'peer-to-peer communication', 'socket connections', 'real-time updates',
    
    // Development Tools & Practices
    'vercel deployment', 'git version control', 'ci/cd pipeline',
    'performance optimization', 'seo optimization', 'web vitals',
    
    // Technical Skills Demonstration
    'social network architecture', 'scalable web applications', 'modern web stack',
    'production ready code', 'best practices', 'clean architecture',
    
    // Developer Identity
    'julio campos machado', 'full stack portfolio', 'brazilian developer',
    'like look solutions', 'web development expert', 'software engineer',
    
    // Project Context (Secondary)
    'orkut clone', 'social media platform', 'community platform',
    'nostalgic social network', 'brazilian social media'
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
    siteName: 'Orkut BR - Full-Stack Development Portfolio',
    title: 'Orkut BR - Modern Social Network | Next.js + Supabase + WebRTC',
    description: 'Full-stack social network platform showcasing advanced web development skills. Built with Next.js 13, React, TypeScript, Supabase, WebRTC. Features real-time messaging, video calls, OAuth authentication. Portfolio project by Julio Campos Machado.',
    images: [{
      url: '/Orkutredes.png',
      width: 1200,
      height: 630,
      alt: 'Orkut BR - Full-Stack Social Network Platform - Next.js + Supabase + WebRTC'
    }]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Orkut BR - Full-Stack Social Network | Next.js + Supabase',
    description: 'Modern social network platform built with Next.js, React, TypeScript, Supabase, WebRTC. Real-time features, video calls, OAuth. Portfolio by Julio Campos Machado.',
    images: ['/Orkutredes.png'],
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
        <meta name="apple-mobile-web-app-title" content="Orkut BR" />
        
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
        <EdgeCompatibility />
        <ThemeProvider>
          <PasteDBAuthProvider>
            <AuthProvider>
              <NotificationProvider>
                <RadioProvider>
                  <OnlineStatusProvider>
                    <WebRTCProvider>
                      <VoiceProvider>
                        <CallProviderWrapper>
                          <FriendsProvider>
                            {children}
                            {/* Sistema de chamadas - notificações, modais e controles */}
                            <CallManager />
                            {/* WebRTC diagnostics moved to developer dashboard */}
                            {/* <EventListenerMonitor /> */}
                            <Toaster />
                          </FriendsProvider>
                        </CallProviderWrapper>
                      </VoiceProvider>
                    </WebRTCProvider>
                  </OnlineStatusProvider>
                </RadioProvider>
              </NotificationProvider>
            </AuthProvider>
          </PasteDBAuthProvider>
        </ThemeProvider>
        {/* Overlay de pausa por inatividade */}
        <IdleOverlay timeout={1800000} />
        {/* PWA Install Prompt */}
        <PWAInstaller />
      </body>
    </html>
  );
}
