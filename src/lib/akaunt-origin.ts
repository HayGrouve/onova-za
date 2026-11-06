// The pure half of the Акаунт helpers: no project registry, so client code
// (Вход) can use it with a project list handed down from the server.

// Projects that use the Акаунт live on subdomains of the production domain
// (ADR 0001), whatever NEXT_PUBLIC_SITE_URL says for this deployment.
const DOMAIN = 'onovaza.com'

// Anything carrying the Акаунт marker of the project schema.
type Marked = { akaunt?: { subdomain: string } }
export type WithAkaunt<P extends Marked> = P & {
  akaunt: NonNullable<P['akaunt']>
}

export const usesAkaunt = <P extends Marked>(p: P): p is WithAkaunt<P> =>
  Boolean(p.akaunt)

export const akauntOrigin = (p: WithAkaunt<Marked>) =>
  `https://${p.akaunt.subdomain}.${DOMAIN}`

// The Акаунт project whose origin `url` is on, or undefined. Only an absolute
// https URL on exactly `<subdomain>.onovaza.com`, default port and no
// credentials matches, so `/vhod` can trust it as a `redirect_url`.
export function akauntProjectIn<P extends Marked>(
  url: string | URL,
  among: readonly P[],
): WithAkaunt<P> | undefined {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return undefined
  }
  if (parsed.username || parsed.password) return undefined
  return among.filter(usesAkaunt).find((p) => parsed.origin === akauntOrigin(p))
}
