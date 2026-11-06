import 'server-only'

import { registry } from '@/content/registry'

import { type Project, projectSchema } from './project-schema'

// Parsed once at module load. Any invalid project throws here, which fails
// `next build` with the slug and the field that is wrong.
function load(): Project[] {
  const projects = registry.map((input, i) => {
    const result = projectSchema.safeParse(input)
    if (!result.success) {
      const where = (input as { slug?: string }).slug ?? `registry[${i}]`
      const issues = result.error.issues
        .map(
          (issue) => `  ${issue.path.join('.') || 'project'}: ${issue.message}`,
        )
        .join('\n')
      throw new Error(`Invalid project "${where}":\n${issues}`)
    }
    return result.data
  })

  const slugs = new Set<string>()
  for (const p of projects) {
    if (slugs.has(p.slug)) throw new Error(`Duplicate project slug "${p.slug}"`)
    slugs.add(p.slug)
  }
  const subdomains = new Set<string>()
  for (const p of projects) {
    if (!p.akaunt) continue
    if (subdomains.has(p.akaunt.subdomain)) {
      throw new Error(`Duplicate Акаунт subdomain "${p.akaunt.subdomain}"`)
    }
    subdomains.add(p.akaunt.subdomain)
  }
  for (const p of projects) {
    for (const r of p.related ?? []) {
      if (r === p.slug || !slugs.has(r)) {
        throw new Error(`Project "${p.slug}" lists unknown related "${r}"`)
      }
    }
  }
  return projects
}

export const projects: readonly Project[] = load()

export function getProject(slug: string) {
  return projects.find((p) => p.slug === slug)
}

export const ownProjects = projects.filter((p) => p.owner === 'own')
export const clientProjects = projects.filter((p) => p.owner === 'client')

// Explicit `related` wins; otherwise score by shared topics, then same owner
// and type. Always returns up to `limit` projects, never the project itself.
export function relatedTo(project: Project, limit = 3): Project[] {
  const picked = (project.related ?? [])
    .map((slug) => getProject(slug))
    .filter((p): p is Project => Boolean(p))
  if (picked.length >= limit) return picked.slice(0, limit)

  const score = (other: Project) =>
    other.topics.filter((t) => project.topics.includes(t)).length * 3 +
    (other.owner === project.owner ? 2 : 0) +
    (other.type === project.type ? 1 : 0) +
    (other.status === 'archived' ? -2 : 0)

  const rest = projects
    .filter((p) => p.slug !== project.slug && !picked.includes(p))
    .map((p) => ({ p, s: score(p) }))
    .sort((a, b) => b.s - a.s)
    .map(({ p }) => p)

  return [...picked, ...rest].slice(0, limit)
}
