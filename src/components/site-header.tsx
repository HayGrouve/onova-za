import Link from 'next/link'

import { paths } from '@/lib/paths'

import { NavAkaunt } from './nav-akaunt'
import { NavLink } from './nav-link'

export function SiteHeader() {
  return (
    <header className="border-border border-b">
      <div className="shell flex h-(--header-h) items-center justify-between gap-4 sm:gap-6">
        <Link
          href={paths.home()}
          className="font-display text-[1.75rem] leading-none font-extrabold tracking-[-0.01em]"
        >
          онова за
        </Link>
        {/* Three links and the wordmark fill a 360px phone, so the gaps
            tighten on phones and the text steps down below 360px. */}
        <nav
          aria-label="Основна"
          className="flex gap-4 text-base font-semibold max-[22.5rem]:gap-3 max-[22.5rem]:text-[0.9375rem] sm:gap-6"
        >
          <NavLink href={paths.projects()}>Проекти</NavLink>
          <NavLink href={paths.about()}>За мен</NavLink>
          <NavAkaunt />
        </nav>
      </div>
    </header>
  )
}
