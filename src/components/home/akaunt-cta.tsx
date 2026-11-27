'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

import { paths } from '@/lib/paths'

import { useSignedIn } from '../use-signed-in'

// The home page's Вход button, without loading Clerk. The static HTML says
// "Вход"; once the page runs, Clerk's cookie may turn it into "Към Акаунта".
// Like the nav, Вход comes back here, query included.
export function AkauntCta({ className }: { className?: string }) {
  return (
    <Suspense
      fallback={<CtaLink signedIn={false} query="" className={className} />}
    >
      <LiveCtaLink className={className} />
    </Suspense>
  )
}

function LiveCtaLink({ className }: { className?: string }) {
  const query = useSearchParams().toString()
  const signedIn = useSignedIn()
  return <CtaLink signedIn={signedIn} query={query} className={className} />
}

function CtaLink({
  signedIn,
  query,
  className,
}: {
  signedIn: boolean
  query: string
  className?: string
}) {
  const home = paths.home()
  return (
    <Link
      href={
        signedIn
          ? paths.akaunt()
          : paths.vhod(query ? `${home}?${query}` : home)
      }
      // Prefetching /vhod or /akaunt would download their Clerk chunk here.
      prefetch={false}
      className={className}
    >
      {signedIn ? 'Към Акаунта' : 'Вход'}
    </Link>
  )
}
