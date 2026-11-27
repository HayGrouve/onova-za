import type { Metadata } from 'next'

import { Closing } from '@/components/home/closing'
import { Hero } from '@/components/home/hero'
import ui from '@/components/home/home.module.css'
import { Shelves } from '@/components/home/shelves'
import { JsonLd } from '@/components/json-ld'
import { clientProjects, projects } from '@/lib/projects'
import { homeGraph, pageMeta } from '@/lib/seo'
import { heroProjects } from '@/lib/shelves'
import { site } from '@/lib/site'

export const metadata: Metadata = pageMeta({
  path: '/',
  title: `${site.name}: малки приложения и сайтове от ${site.author.name}`,
  absoluteTitle: true,
  description:
    'Всичко, което правя, на едно място: приложения за дребни всекидневни проблеми и сайтове за хора с малък бизнес.',
})

const SHELVES_ID = 'proekti'

// The hub: "онова за ___" over a real screen, every project on a Рафт by
// how you use it, then the name explained.
export default function HomePage() {
  return (
    <main id="main" className={ui.home}>
      <JsonLd data={homeGraph()} />
      <Hero items={heroProjects(projects)} shelvesId={SHELVES_ID} />
      <Shelves id={SHELVES_ID} projects={projects} />
      <Closing onlyOwn={clientProjects.length === 0} />
    </main>
  )
}
