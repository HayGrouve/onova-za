import type { Metadata } from 'next'
import Link from 'next/link'

import { paths } from '@/lib/paths'
import { pageMeta } from '@/lib/seo'

export const metadata: Metadata = pageMeta({
  path: paths.akaunt(),
  title: 'Акаунт',
  description: 'Профилът ти, проектите ти и Изход.',
  noindex: true,
})

// Placeholder until the Акаунт page lands (#48): profile, the projects that
// use the Акаунт, Изход and Изтрий Акаунта go here.
export default function AkauntPage() {
  return (
    <main id="main" className="shell pt-[clamp(2rem,5vw,3.5rem)]">
      <h1 className="font-display text-[clamp(3rem,7vw,5.5rem)] leading-[0.95] font-extrabold tracking-[-0.01em]">
        Акаунт
      </h1>
      <p className="mt-4 max-w-xl text-lg">
        Тук скоро ще виждаш профила си и проектите, които ползваш, и ще излизаш
        от Акаунта.
      </p>
      <p className="mt-10">
        <Link href={paths.home()} className="link-prose font-semibold">
          Към началото
        </Link>
      </p>
    </main>
  )
}
