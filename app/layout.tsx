import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/contexts/enhanced-auth-context';
import { VoiceProvider } from '@/contexts/voice-context';
import { OnlineStatusProvider } from '@/contexts/OnlineStatusContext';
import { Toaster } from '@/components/ui/sonner';
import { StructuredData } from '@/components/seo/structured-data';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://orkut-864g4zydz-astridnielsen-labs-projects.vercel.app'),
  title: {
    default: 'Orkut Retrô - A rede social que você ama | by Julio Campos Machado',
    template: '%s | Orkut Retrô - Like Look Solutions'
  },
  description: 'Reviva os momentos especiais do Orkut com recursos modernos de voz e chamadas. Desenvolvido por Julio Campos Machado da Like Look Solutions. Conecte-se com amigos, participe de comunidades e viva a nostalgia dos anos 2000.',
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
    url: 'https://orkut-864g4zydz-astridnielsen-labs-projects.vercel.app',
    siteName: 'Orkut Retrô',
    title: 'Orkut Retrô - A rede social que você ama',
    description: 'Reviva os momentos especiais do Orkut com recursos modernos. Desenvolvido por Julio Campos Machado da Like Look Solutions.',
    images: [{
      url: '/redes-sociais.jpg',
      width: 1200,
      height: 630,
      alt: 'Orkut Retrô - A rede social nostálgica'
    }]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Orkut Retrô - A rede social que você ama',
    description: 'Reviva os momentos especiais do Orkut com recursos modernos. Desenvolvido por Julio Campos Machado.',
    images: ['/redes-sociais.jpg'],
    creator: '@orkutretro'
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
        <meta name="apple-mobile-web-app-title" content="Orkut Retrô" />
        
        {/* Developer and Company Info */}
        <meta name="author" content="Julio Campos Machado" />
        <meta name="designer" content="Julio Campos Machado - Like Look Solutions" />
        <meta name="developer" content="Julio Campos Machado" />
        <meta name="company" content="Like Look Solutions" />
        <meta name="contact" content="juliocamposmachado@gmail.com" />
        <meta name="phone" content="+5511992946628" />
        <link rel="canonical" href="https://orkut-864g4zydz-astridnielsen-labs-projects.vercel.app" />
      </head>
      <body className={inter.className}>
        <StructuredData />
        <AuthProvider>
          <OnlineStatusProvider>
            <VoiceProvider>
              {children}
              <Toaster />
            </VoiceProvider>
          </OnlineStatusProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
