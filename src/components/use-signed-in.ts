import { useSyncExternalStore } from 'react'

import { isSignedIn } from '@/lib/akaunt-cookie'

// Whether Clerk's cookie says you are signed in, read without loading Clerk.
// The server (and the static HTML) always says no; the browser decides once
// the page runs. Nothing announces a cookie change, so navigation (a
// re-render) and window focus re-read it.
export function useSignedIn() {
  return useSyncExternalStore(
    subscribe,
    () => isSignedIn(document.cookie),
    () => false,
  )
}

function subscribe(onChange: () => void) {
  window.addEventListener('focus', onChange)
  return () => window.removeEventListener('focus', onChange)
}
