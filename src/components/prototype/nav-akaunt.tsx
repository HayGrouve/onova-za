'use client'

// PROTOTYPE, throwaway (ticket #19). The real link reads Clerk's
// __client_uat on onovaza.com; this one reads the prototype bar's cookie.
// The static HTML always says "Вход"; signed-in visitors see it swap.

import type { Route } from 'next'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

import { readSignedIn } from './prototype-bar'

export function NavAkaunt() {
  const pathname = usePathname()
  const [signedIn, setSignedIn] = useState(false)
  // The header survives client navigation (e.g. /vhod returning you to the
  // page), so re-read on every path change, not only on mount.
  useEffect(() => setSignedIn(readSignedIn()), [pathname])

  const href = signedIn
    ? '/prototype/akaunt'
    : `/prototype/vhod?redirect_url=${encodeURIComponent(pathname)}`
  const current = pathname.startsWith('/prototype/')
  return (
    <Link
      href={href as Route}
      aria-current={current ? 'page' : undefined}
      // Fixed width: "Вход" and "Акаунт" take the same room, so no shift.
      className="link-quiet inline-block w-[4.25rem] py-2 text-right aria-[current=page]:underline aria-[current=page]:decoration-2"
    >
      {signedIn ? 'Акаунт' : 'Вход'}
    </Link>
  )
}
