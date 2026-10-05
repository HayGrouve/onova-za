import { ogSize, projectOgImage } from '@/lib/og'
import { getProject, projects } from '@/lib/projects'
import { SITE_URL } from '@/lib/site'

// `generateImageMetadata` with dynamic params fails the build in 16.3.8, so
// the alt text is generic; the page itself carries the specifics.
export const alt = 'Проект от онова за'
export const size = ogSize
export const contentType = 'image/png'
export const dynamicParams = false

// Needed here as well as on the page, or the image renders on demand.
export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }))
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const project = getProject(slug)
  if (!project) throw new Error(`Unknown project "${slug}"`)
  return projectOgImage(project, new URL(SITE_URL).host)
}
