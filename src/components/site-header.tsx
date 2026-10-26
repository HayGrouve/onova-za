import Link from 'next/link'

import { paths } from '@/lib/paths'

import { NavLink } from './nav-link'
import { NavAkaunt } from './prototype/nav-akaunt'

export function SiteHeader() {
  return (
    <header className="border-border border-b">
      <div className="shell flex h-(--header-h) items-center justify-between gap-6">
        <Link
          href={paths.home()}
          className="font-display text-[1.75rem] leading-none font-extrabold tracking-[-0.01em]"
        >
          онова за
        </Link>
        <nav
          aria-label="Основна"
          className="flex gap-6 text-base font-semibold"
        >
          <NavLink href={paths.projects()}>Проекти</NavLink>
          <NavLink href={paths.about()}>За мен</NavLink>
          <NavAkaunt />
        </nav>
      </div>
    </header>
  )
}
