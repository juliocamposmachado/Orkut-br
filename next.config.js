/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { 
    unoptimized: true,
    domains: ['images.pexels.com', 'ksskokjrdzqghhuahjpl.supabase.co']
  },
};

module.exports = nextConfig;
