'use client'

// PROTOTYPE, throwaway: the floating bar for /prototype/vhod and
// /prototype/akaunt (ticket #19). Never merge to main.

import type { Route } from 'next'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export const SIGNED_IN_COOKIE = 'proto_client_uat'

export function readSignedIn() {
  return document.cookie
    .split('; ')
    .some((c) => c.startsWith(`${SIGNED_IN_COOKIE}=`) && !c.endsWith('=0'))
}

export function setSignedIn(on: boolean) {
  document.cookie = `${SIGNED_IN_COOKIE}=${on ? Date.now() : 0}; path=/`
}

type Theme = 'system' | 'light' | 'dark'

export function PrototypeBar({
  variants,
  extra,
}: {
  variants: { key: string; name: string }[]
  extra?: { param: string; label: string; options: { value: string; label: string }[] }
}) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const current = params.get('variant') ?? variants[0].key
  const index = Math.max(
    0,
    variants.findIndex((v) => v.key === current),
  )
  const [theme, setTheme] = useState<Theme>('system')
  const [signedIn, setSignedInState] = useState(false)

  useEffect(() => setSignedInState(readSignedIn()), [])

  const go = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params)
    for (const [k, v] of Object.entries(patch)) {
      if (v === null) next.delete(k)
      else next.set(k, v)
    }
    router.replace(`${pathname}?${next}` as Route, { scroll: false })
  }
  const cycle = (step: number) =>
    go({
      variant: variants[(index + step + variants.length) % variants.length].key,
    })

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t.closest('input, textarea, [contenteditable]')) return
      if (e.key === 'ArrowLeft') cycle(-1)
      if (e.key === 'ArrowRight') cycle(1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'system') delete root.dataset.theme
    else root.dataset.theme = theme
  }, [theme])

  if (process.env.NODE_ENV === 'production') return null

  const pill =
    'rounded-full px-3 py-1.5 hover:bg-white/15 aria-pressed:bg-white aria-pressed:text-black'
  return (
    <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 flex-wrap items-center justify-center gap-1 rounded-full bg-black px-2 py-1.5 font-mono text-xs text-white shadow-2xl ring-2 ring-fuchsia-500">
      <button className={pill} onClick={() => cycle(-1)} aria-label="Previous">
        ←
      </button>
      <span className="px-2">
        {variants[index].key} ({variants[index].name})
      </span>
      <button className={pill} onClick={() => cycle(1)} aria-label="Next">
        →
      </button>
      <span className="mx-1 h-4 w-px bg-white/30" />
      {(['system', 'light', 'dark'] as const).map((t) => (
        <button
          key={t}
          className={pill}
          aria-pressed={theme === t}
          onClick={() => setTheme(t)}
        >
          {t}
        </button>
      ))}
      <span className="mx-1 h-4 w-px bg-white/30" />
      <button
        className={pill}
        aria-pressed={signedIn}
        onClick={() => {
          setSignedIn(!signedIn)
          // Reload so the nav reads the cookie from scratch, like a real visit.
          window.location.reload()
        }}
      >
        signed in
      </button>
      {extra && (
        <>
          <span className="mx-1 h-4 w-px bg-white/30" />
          <span className="pl-1 text-white/60">{extra.label}</span>
          {extra.options.map((o) => (
            <button
              key={o.value}
              className={pill}
              aria-pressed={(params.get(extra.param) ?? '') === o.value}
              onClick={() => go({ [extra.param]: o.value || null })}
            >
              {o.label}
            </button>
          ))}
        </>
      )}
    </div>
  )
}
