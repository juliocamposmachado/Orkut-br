/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { 
    unoptimized: true,
    domains: ['images.pexels.com', 'woyyikaztjrhqzgvbhmn.supabase.co']
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
  env: {
    NEXT_PUBLIC_SOCKET_URL: process.env.NODE_ENV === 'production' 
      ? 'https://orkut-br.vercel.app' 
      : 'http://localhost:3000',
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
              "connect-src 'self' https://woyyikaztjrhqzgvbhmn.supabase.co wss://woyyikaztjrhqzgvbhmn.supabase.co https://vercel.live wss://orkut-br.vercel.app wss://*.vercel.app https://stun.l.google.com:19302 https://stun1.l.google.com:19302 https://vitals.vercel-insights.com https://images.pexels.com",
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
