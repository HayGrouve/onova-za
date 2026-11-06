import type { Metadata } from 'next'

import { VhodForm } from '@/components/vhod/vhod-form'
import { akauntProjects } from '@/lib/akaunt'
import { paths } from '@/lib/paths'
import { pageMeta } from '@/lib/seo'
import { vhodProject } from '@/lib/vhod'

export const metadata: Metadata = pageMeta({
  path: paths.vhod(),
  title: 'Вход',
  description: 'Влез в Акаунта си на онова за с имейл или с Google.',
  noindex: true,
})

// Вход for every онова за project (#18, #47). Static: the form runs in the
// browser, reads redirect_url there and sends you back once you are in.
export default function VhodPage() {
  return (
    <main id="main" className="shell pb-24">
      <VhodForm projects={akauntProjects.map(vhodProject)} />
    </main>
  )
}
