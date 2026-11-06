import { akauntProjectIn, usesAkaunt, type WithAkaunt } from './akaunt-origin'
import type { Project } from './project-schema'
import { projects } from './projects'

// Kept here so `@/lib/akaunt` still offers it to server code like /akaunt.
/** @public */
export { akauntOrigin } from './akaunt-origin'

export type AkauntProject = WithAkaunt<Project>

// Every project that uses the Акаунт, in registry order. `/akaunt` lists these.
export const akauntProjects: readonly AkauntProject[] =
  projects.filter(usesAkaunt)

// The Акаунт project whose origin `url` is on, or undefined. Only an absolute
// https URL on exactly `<subdomain>.onovaza.com`, default port and no
// credentials matches, so `/vhod` can trust it as a `redirect_url`.
export function akauntProjectAt(
  url: string | URL,
  among: readonly Project[] = akauntProjects,
): AkauntProject | undefined {
  return akauntProjectIn(url, among)
}
