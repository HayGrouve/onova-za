import type { Project } from './project-schema'
import { projects } from './projects'

// Projects that use the Акаунт live on subdomains of the production domain
// (ADR 0001), whatever NEXT_PUBLIC_SITE_URL says for this deployment.
const DOMAIN = 'onovaza.com'

export type AkauntProject = Project & {
  akaunt: NonNullable<Project['akaunt']>
}

const usesAkaunt = (p: Project): p is AkauntProject => Boolean(p.akaunt)

// Every project that uses the Акаунт, in registry order. `/akaunt` lists these.
export const akauntProjects: readonly AkauntProject[] =
  projects.filter(usesAkaunt)

export const akauntOrigin = (p: AkauntProject) =>
  `https://${p.akaunt.subdomain}.${DOMAIN}`

// The Акаунт project whose origin `url` is on, or undefined. Only an absolute
// https URL on exactly `<subdomain>.onovaza.com`, default port and no
// credentials matches, so `/vhod` can trust it as a `redirect_url`.
export function akauntProjectAt(
  url: string | URL,
  among: readonly Project[] = akauntProjects,
): AkauntProject | undefined {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return undefined
  }
  if (parsed.username || parsed.password) return undefined
  return among.filter(usesAkaunt).find((p) => parsed.origin === akauntOrigin(p))
}
