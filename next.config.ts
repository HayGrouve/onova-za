import type { NextConfig } from 'next'

// Projects that moved to `<name>.onovaza.com` (ADR 0001). `onovaza.com/<name>`
// still works: it 308s there with the path and query kept (#29). Each
// project's cutover adds its name; tests/akaunt-projects.test.ts checks the
// list matches the projects marked with `akaunt`.
const moved: string[] = ['kuhnyata']

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

// Project pages whose slug changed: old slug to new. `/proekti/[slug]` only
// builds today's slugs (`dynamicParams = false`), so the old address 308s to
// the new page, with the rest of the path (its OG image) and the query kept.
// tests/content.test.ts checks every new slug is a project and no old one is.
export const renamedSlugs: Record<string, string> = {
  chef: 'onova-za-kuhnyata',
}

export const renamedRedirects = Object.entries(renamedSlugs).flatMap(
  ([from, to]) => [
    {
      source: `/proekti/${from}`,
      destination: `/proekti/${to}`,
      permanent: true,
    },
    {
      source: `/proekti/${from}/:path*`,
      destination: `/proekti/${to}/:path*`,
      permanent: true,
    },
  ],
)

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
  redirects: async () => [...renamedRedirects, ...movedRedirects],
}

export default nextConfig
