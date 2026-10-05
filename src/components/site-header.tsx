import Link from 'next/link'

import { paths } from '@/lib/paths'

import { NavLink } from './nav-link'
import { NerdSwitch } from './nerd/nerd'

export function SiteHeader() {
  return (
    <header className="border-border border-b">
      <div className="shell flex h-(--header-h) items-center justify-between gap-4">
        <Link
          href={paths.home()}
          className="font-display text-[1.75rem] leading-none font-extrabold tracking-[-0.01em]"
        >
          онова за
        </Link>
        <div className="flex items-center gap-4 sm:gap-8">
          <nav
            aria-label="Основна"
            className="flex gap-4 text-base font-semibold sm:gap-6"
          >
            <NavLink href={paths.projects()}>Проекти</NavLink>
            <NavLink href={paths.about()}>За мен</NavLink>
          </nav>
          <NerdSwitch />
        </div>
      </div>
    </header>
  )
}
