// Clerk sets __client_uat on the apex domain: the time you last signed in,
// or 0 once you sign out. Newer SDKs also write a suffixed copy
// (__client_uat_<hash>), so any cookie with that prefix and a non-zero value
// counts. Reading it lets the nav say "Акаунт" without loading Clerk.
const CLIENT_UAT = '__client_uat'

export function isSignedIn(cookie: string): boolean {
  return cookie.split(';').some((pair) => {
    const eq = pair.indexOf('=')
    if (eq === -1) return false
    const name = pair.slice(0, eq).trim()
    const value = Number(pair.slice(eq + 1).trim())
    return name.startsWith(CLIENT_UAT) && value > 0
  })
}
