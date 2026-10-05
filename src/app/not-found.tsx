import type { Metadata } from 'next'
import Link from 'next/link'

import { accent } from '@/lib/accent'
import { paths } from '@/lib/paths'
import { projects } from '@/lib/projects'

export const metadata: Metadata = {
  title: 'Няма такава страница',
  robots: { index: false },
}

export default function NotFound() {
  return (
    <main id="main" className="shell pt-[clamp(2rem,5vw,3.5rem)]">
      <h1 className="font-display text-[clamp(3rem,7vw,5.5rem)] leading-[0.95] font-extrabold tracking-[-0.01em]">
        Няма такава страница.
      </h1>
      <p className="mt-4 max-w-xl text-lg">
        Може адресът да е стар или с грешка. Може би търсиш онова за...
      </p>
      <ul className="mt-8 flex max-w-4xl flex-wrap gap-2">
        {projects.map((p) => (
          <li key={p.slug} {...accent(p.hue)}>
            <Link
              href={paths.project(p.slug)}
              className="bg-fill font-display text-fill-ink inline-block px-3 pt-1 pb-1.5 text-2xl leading-none font-extrabold hover:underline"
            >
              {p.za}
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-10">
        <Link href={paths.home()} className="link-prose font-semibold">
          Към началото
        </Link>
      </p>
    </main>
  )
}
