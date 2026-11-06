import {
  akauntOrigin,
  akauntProjectIn,
  usesAkaunt,
  type WithAkaunt,
} from './akaunt-origin'
import type { Project } from './project-schema'

// What Вход needs to know about a project. The page hands these down from the
// project registry, which stays on the server.
export type VhodProject = Pick<Project, 'slug' | 'za' | 'akaunt'>

export const vhodProject = ({ slug, za, akaunt }: Project): VhodProject => ({
  slug,
  za,
  akaunt,
})

type Marked = WithAkaunt<VhodProject>

// The hub's own production origin. Pages on it are always a safe return,
// whatever host this deployment runs on.
const HUB_ORIGIN = 'https://onovaza.com'

// Where each project lived before onovaza.com (ADR 0001, #29), by the
// subdomain it moves to. These hosts 308 to the subdomain after cutover, so a
// `redirect_url` still pointing at one goes straight there instead. A host
// only maps once its project is marked with that subdomain.
const OLD_HOSTS: Readonly<Record<string, string>> = {
  'armyant.app': 'kuhnyata',
  'www.armyant.app': 'kuhnyata',
  'chef-black.vercel.app': 'kuhnyata',
  'onova-za-smetkata.com': 'smetkata',
  'www.onova-za-smetkata.com': 'smetkata',
  'onova-za-smetkata.vercel.app': 'smetkata',
  'onova-za-klientite.vercel.app': 'klientite',
  'dial-in-three.vercel.app': 'kafeto',
}

export type ReturnTo = {
  // Where Вход sends you: a path on this host, or an absolute URL elsewhere.
  href: string
  // The Акаунт project you return to, when it is one. Вход names it.
  project?: Marked
  // True when `href` is the fallback, the Акаунт page.
  fallback: boolean
}

const FALLBACK = '/akaunt'

const fallback = (): ReturnTo => ({ href: FALLBACK, fallback: true })

// Sending you back to Вход itself would only bounce you on to the fallback.
const isVhod = (pathname: string) =>
  pathname === '/vhod' || pathname.startsWith('/vhod/')

const rest = (url: URL) => `${url.pathname}${url.search}${url.hash}`

// A path on this host, checked as it will be navigated: dot segments like
// `/.//evil.com` resolve to `//evil.com`, which a browser reads as a host.
function local(url: URL): ReturnTo {
  const href = rest(url)
  if (
    !href.startsWith('/') ||
    href.startsWith('//') ||
    href.startsWith('/\\')
  ) {
    return fallback()
  }
  return isVhod(url.pathname)
    ? fallback()
    : { href, fallback: url.pathname === FALLBACK }
}

/**
 * Where Вход sends you once you are in, from its `redirect_url`.
 *
 * Only these are allowed, anything else falls back to `/akaunt`:
 * - a path on this host (`/proekti`), or an absolute URL on `here`;
 * - a page on `https://onovaza.com`;
 * - a page on a marked project's `https://<subdomain>.onovaza.com`;
 * - a page on a project's old host, moved to its subdomain.
 *
 * `here` is the origin Вход runs on (`window.location.origin`), `among` the
 * projects (only the ones marked with the Акаунт count).
 */
export function returnTo(
  raw: string | null | undefined,
  here: string,
  among: readonly VhodProject[],
): ReturnTo {
  if (!raw) return fallback()

  // A path on this host. `//host` and `/\host` are protocol relative in
  // browsers, so they are not paths.
  if (raw.startsWith('/')) {
    if (raw.startsWith('//') || raw.startsWith('/\\')) return fallback()
    let url: URL
    try {
      url = new URL(raw, here)
    } catch {
      return fallback()
    }
    return url.origin === new URL(here).origin ? local(url) : fallback()
  }

  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return fallback()
  }
  if (url.username || url.password) return fallback()

  if (url.origin === new URL(here).origin) return local(url)
  if (url.origin === HUB_ORIGIN) {
    return isVhod(url.pathname)
      ? fallback()
      : { href: url.href, fallback: false }
  }

  const project = akauntProjectIn(url, among)
  if (project) return { href: url.href, project, fallback: false }

  return moved(url, among) ?? fallback()
}

// A URL on an old host, moved to the same path on its project's subdomain.
function moved(url: URL, among: readonly VhodProject[]): ReturnTo | undefined {
  if (url.protocol !== 'https:' || url.port !== '') return undefined
  const subdomain = Object.hasOwn(OLD_HOSTS, url.hostname)
    ? OLD_HOSTS[url.hostname]
    : undefined
  if (!subdomain) return undefined
  const project = among
    .filter(usesAkaunt)
    .find((p) => p.akaunt.subdomain === subdomain)
  if (!project) return undefined
  return {
    href: `${akauntOrigin(project)}${rest(url)}`,
    project,
    fallback: false,
  }
}
