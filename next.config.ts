import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  typedRoutes: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    qualities: [75, 85],
    deviceSizes: [384, 640, 828, 1080, 1440, 1920],
    // Label and masthead screenshots render 168 to 640px wide.
    imageSizes: [96, 168, 256, 320, 480],
  },
  experimental: {
    optimizePackageImports: ['@phosphor-icons/react'],
  },
}

export default nextConfig
