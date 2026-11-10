import type { NextConfig } from 'next'

// Projects that moved to `<name>.onovaza.com` (ADR 0001). `onovaza.com/<name>`
// still works: it 308s there with the path and query kept (#29). Each
// project's cutover adds its name; tests/akaunt-projects.test.ts checks the
// list matches the projects marked with `akaunt`.
const moved: string[] = []

export const movedRedirects = moved.flatMap((name) => [
  {
    source: `/${name}`,
    destination: `https://${name}.onovaza.com`,
    permanent: true,
  },
  {
    source: `/${name}/:path*`,
    destination: `https://${name}.onovaza.com/:path*`,
    permanent: true,
  },
])

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
  redirects: async () => movedRedirects,
}

export default nextConfig
