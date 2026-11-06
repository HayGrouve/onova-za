import type { Metadata } from 'next'

import { AkauntPanel } from '@/components/akaunt/akaunt-panel'
import type { PanelProject } from '@/components/akaunt/types'
import { akauntOrigin, akauntProjects } from '@/lib/akaunt'
import { privacyChanges, termsChanges } from '@/lib/legal'
import { paths } from '@/lib/paths'
import { pageMeta } from '@/lib/seo'

export const metadata: Metadata = pageMeta({
  path: paths.akaunt(),
  title: 'Акаунт',
  description: 'Профилът ти, начините за Вход, проектите и Изход.',
  noindex: true,
})

// Only what the panel shows crosses into the client bundle, not the whole
// project registry.
const projects: PanelProject[] = akauntProjects.map((p) => ({
  slug: p.slug,
  za: p.za,
  hue: p.hue,
  origin: akauntOrigin(p),
}))

const materialChanges = {
  privacy: privacyChanges.filter((c) => c.material),
  terms: termsChanges.filter((c) => c.material),
}

// The page is static: the heading is in the HTML, and everything about the
// person loads in the browser once Clerk does (#13, #46).
export default function AkauntPage() {
  return (
    <main id="main" className="shell pt-[clamp(2rem,5vw,3.5rem)] pb-24">
      <h1 className="font-display text-[clamp(2.5rem,5vw,3.5rem)] leading-none font-extrabold">
        Акаунт
      </h1>
      <AkauntPanel projects={projects} legalChanges={materialChanges} />
    </main>
  )
}
