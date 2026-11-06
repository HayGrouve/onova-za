'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { Suspense, useSyncExternalStore } from 'react'

import { isSignedIn } from '@/lib/akaunt-cookie'
import { paths } from '@/lib/paths'
import { cn } from '@/lib/utils'

// The one Акаунт link, without loading Clerk. The static HTML always says
// "Вход"; once the page runs, Clerk's cookie decides whether it says
// "Акаунт" instead.
export function NavAkaunt() {
  const pathname = usePathname()
  // Reading the query keeps it in redirect_url, but in a static page it only
  // exists in the browser, so the prerendered HTML is this fallback.
  return (
    <Suspense
      fallback={<AkauntLink signedIn={false} pathname={pathname} query="" />}
    >
      <LiveAkauntLink pathname={pathname} />
    </Suspense>
  )
}

function LiveAkauntLink({ pathname }: { pathname: string }) {
  const query = useSearchParams().toString()
  // The header survives client navigation (e.g. coming back from Вход), and
  // a new path re-renders this, which re-reads the cookie.
  const signedIn = useSyncExternalStore(
    subscribe,
    () => isSignedIn(document.cookie),
    () => false,
  )
  return <AkauntLink signedIn={signedIn} pathname={pathname} query={query} />
}

// Nothing announces a cookie change; navigation and focus are enough.
function subscribe(onChange: () => void) {
  window.addEventListener('focus', onChange)
  return () => window.removeEventListener('focus', onChange)
}

const LABELS = ['Вход', 'Акаунт'] as const

function AkauntLink({
  signedIn,
  pathname,
  query,
}: {
  signedIn: boolean
  pathname: string
  query: string
}) {
  const current = [paths.vhod(), paths.akaunt()].some(
    (base) => pathname === base || pathname.startsWith(`${base}/`),
  )
  const here = query ? `${pathname}?${query}` : pathname
  return (
    <Link
      href={signedIn ? paths.akaunt() : paths.vhod(here)}
      aria-current={current ? 'page' : undefined}
      className="link-quiet inline-grid py-2 text-right aria-[current=page]:underline aria-[current=page]:decoration-2"
    >
      {/* Both words sit in one cell and the hidden one keeps the width, so
          the swap never shifts the nav. */}
      {LABELS.map((label) => {
        const shown = (label === 'Акаунт') === signedIn
        return (
          <span
            key={label}
            aria-hidden={shown ? undefined : true}
            className={cn('col-start-1 row-start-1', !shown && 'invisible')}
          >
            {label}
          </span>
        )
      })}
    </Link>
  )
}
