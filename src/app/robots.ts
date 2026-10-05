import type { MetadataRoute } from 'next'

import { absolute } from '@/lib/seo'

export default function robots(): MetadataRoute.Robots {
  // Preview and branch deployments must never be indexed.
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production') {
    return { rules: { userAgent: '*', disallow: '/' } }
  }
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: absolute('/sitemap.xml'),
  }
}
