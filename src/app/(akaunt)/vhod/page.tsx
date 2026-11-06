import type { Metadata } from 'next'
import Link from 'next/link'

import { paths } from '@/lib/paths'
import { pageMeta } from '@/lib/seo'

export const metadata: Metadata = pageMeta({
  path: paths.vhod(),
  title: 'Вход',
  description: 'Влез в Акаунта си на онова за.',
  noindex: true,
})

// Placeholder until Вход lands (#47): the sign-in form goes here.
export default function VhodPage() {
  return (
    <main id="main" className="shell pt-[clamp(2rem,5vw,3.5rem)]">
      <h1 className="font-display text-[clamp(3rem,7vw,5.5rem)] leading-[0.95] font-extrabold tracking-[-0.01em]">
        Вход
      </h1>
      <p className="mt-4 max-w-xl text-lg">
        Входът в Акаунта идва скоро. Дотогава можеш да разгледаш проектите.
      </p>
      <p className="mt-10">
        <Link href={paths.home()} className="link-prose font-semibold">
          Към началото
        </Link>
      </p>
    </main>
  )
}
