/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: { 
    unoptimized: true,
    domains: ['images.pexels.com', 'wjglxlnbizbqwpkvihsy.supabase.co', 'static2.mytuner.mobi']
  },
  // Improve build performance and fix runtime issues
  swcMinify: true,
  experimental: {
    // Fix potential hydration issues
    optimizePackageImports: ['lucide-react', '@radix-ui/react-avatar', '@radix-ui/react-dialog'],
    // Enable server actions
    serverActions: true,
    // Configure server actions body size limit (Next.js 14+)
    serverActionsBodySizeLimit: '10mb'
  },
  webpack: (config, { isServer, webpack }) => {
    // Fix potential browser API issues on server
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }
    
    // Add global polyfill for 'self' to prevent server errors
    config.plugins.push(
      new webpack.DefinePlugin({
        'self': 'globalThis',
      })
    );
    
    return config;
  },
  env: {
    NEXT_PUBLIC_SOCKET_URL: process.env.NODE_ENV === 'production' 
      ? 'https://orkut-br-oficial.vercel.app' 
      : 'http://localhost:3000',
    NEXT_PUBLIC_GEMINI_API_KEY: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://*.vercel.app https://va.vercel-scripts.com https://cdn.jsdelivr.net https://unpkg.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data: https://fonts.gstatic.com",
              "connect-src 'self' https://wjglxlnbizbqwpkvihsy.supabase.co wss://wjglxlnbizbqwpkvihsy.supabase.co https://vercel.live wss://orkut-br-oficial.vercel.app wss://*.vercel.app https://stun.l.google.com:19302 https://stun1.l.google.com:19302 https://vitals.vercel-insights.com https://images.pexels.com https://generativelanguage.googleapis.com",
              "media-src 'self' blob: mediastream:",
              "worker-src 'self' blob:",
              "frame-src 'self' https://vercel.live",
              "object-src 'none'",
              "base-uri 'self'"
            ].join('; ')
          }
        ]
      }
    ];
  },
};

module.exports = nextConfig;
