'use client'

import type { Route } from 'next'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

// The only client code in the header: marks the current section so screen
// readers hear it and the link shows a steady underline.
export function NavLink({ href, children }: { href: Route; children: string }) {
  const pathname = usePathname()
  const current = pathname === href || pathname.startsWith(`${href}/`)
  return (
    <Link
      href={href}
      aria-current={current ? 'page' : undefined}
      className="link-quiet py-2 aria-[current=page]:underline aria-[current=page]:decoration-2"
    >
      {children}
    </Link>
  )
}
