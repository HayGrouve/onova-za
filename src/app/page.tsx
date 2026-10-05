import type { Metadata } from 'next'

import { GroupHeading } from '@/components/group-heading'
import { Hero } from '@/components/home/hero'
import { JsonLd } from '@/components/json-ld'
import { NeutralLabel, ProjectWall, Wall } from '@/components/label/label'
import { OWNERS } from '@/content/taxonomy'
import { paths } from '@/lib/paths'
import { clientProjects, ownProjects, projects } from '@/lib/projects'
import { homeGraph, pageMeta } from '@/lib/seo'
import { site } from '@/lib/site'

export const metadata: Metadata = pageMeta({
  path: '/',
  title: `${site.name}: малки приложения и сайтове от ${site.author.name}`,
  absoluteTitle: true,
  description:
    'Всичко, което правя, на едно място: приложения за дребни всекидневни проблеми и сайтове за хора с малък бизнес.',
})

const groups = [
  { id: 'moi', title: OWNERS.own.plural, items: ownProjects },
  { id: 'za-klienti', title: OWNERS.client.plural, items: clientProjects },
].filter((g) => g.items.length > 0)

export default function HomePage() {
  return (
    <main id="main" className="shell">
      <JsonLd data={homeGraph()} />
      <Hero projects={projects} />

      {groups.map((g, i) => (
        <section
          key={g.id}
          aria-labelledby={g.id}
          className="mt-[clamp(2.25rem,4vw,3.25rem)]"
        >
          <GroupHeading id={g.id} only={groups.length === 1}>
            {g.title}
          </GroupHeading>
          <ProjectWall projects={g.items} aboveFold={i === 0} />
        </section>
      ))}

      <section
        aria-labelledby="oshte"
        className="mt-[clamp(2.25rem,4vw,3.25rem)]"
      >
        <h2 id="oshte" className="sr-only">
          Още
        </h2>
        <Wall>
          <NeutralLabel
            href={paths.projects()}
            noun="всичко"
            name="Всички проекти"
            pitch="Целият списък на едно място."
          />
          <NeutralLabel
            href={paths.contact()}
            noun="твоето нещо"
            name="Пиши ми"
            pitch="Имаш идея или поръчка?"
          />
        </Wall>
      </section>
    </main>
  )
}
