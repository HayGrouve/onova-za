import type { MetadataRoute } from 'next'

import {
  effectiveDate,
  processingChanges,
  privacyChanges,
  termsChanges,
} from '@/lib/legal'
import { paths } from '@/lib/paths'
import { projects } from '@/lib/projects'
import { absolute } from '@/lib/seo'

// lastModified comes from real content dates only; Google ignores
// priority and changefreq, so they are left out.
export default function sitemap(): MetadataRoute.Sitemap {
  const newest = projects
    .map((p) => p.updatedAt)
    .sort()
    .at(-1)

  return [
    { url: absolute(paths.home()), lastModified: newest },
    { url: absolute(paths.projects()), lastModified: newest },
    ...projects
      .filter((p) => !p.seo?.noindex)
      .map((p) => ({
        url: absolute(paths.project(p.slug)),
        lastModified: p.updatedAt,
      })),
    { url: absolute(paths.about()) },
    {
      url: absolute(paths.privacy()),
      lastModified: effectiveDate(privacyChanges),
    },
    { url: absolute(paths.terms()), lastModified: effectiveDate(termsChanges) },
    {
      url: absolute(paths.processing()),
      lastModified: effectiveDate(processingChanges),
    },
  ]
}
