import type { Metadata } from 'next'

import { GroupHeading } from '@/components/group-heading'
import { ProjectIndex } from '@/components/index/project-index'
import { JsonLd } from '@/components/json-ld'
import { OWNERS } from '@/content/taxonomy'
import { paths } from '@/lib/paths'
import { clientProjects, ownProjects, projects, stats } from '@/lib/projects'
import { collectionGraph, pageMeta } from '@/lib/seo'

export const metadata: Metadata = pageMeta({
  path: paths.projects(),
  title: 'Всички проекти',
  description:
    'Всички приложения и сайтове на едно място: какво прави всяко, дали работи и от кога е.',
})

const since = Math.min(...projects.map((p) => p.years.from))

// Bulgarian plural for "проект" after a number.
const count = (n: number) => `${n} ${n === 1 ? 'проект' : 'проекта'}`

const groups = [
  { id: 'moi', title: OWNERS.own.plural, items: ownProjects },
  { id: 'za-klienti', title: OWNERS.client.plural, items: clientProjects },
].filter((g) => g.items.length > 0)

export default function ProjectsPage() {
  return (
    <main id="main" className="shell">
      <JsonLd data={collectionGraph(projects)} />
      <header className="pt-[clamp(2rem,5vw,3.5rem)] pb-[clamp(2rem,4vw,3rem)]">
        <h1 className="font-display text-[clamp(3rem,7vw,5.5rem)] leading-[0.95] font-extrabold tracking-[-0.01em]">
          Всички проекти
        </h1>
        <p className="text-muted-foreground mt-4 max-w-xl text-lg">
          {count(stats.total)} от {since} насам
          {stats.client > 0
            ? `: ${stats.own} мои и ${stats.client} за клиенти.`
            : '.'}
        </p>
      </header>

      {projects.length === 0 ? (
        <p className="text-lg">Още няма проекти. Първият е на път.</p>
      ) : (
        groups.map((g) => (
          <section
            key={g.id}
            aria-labelledby={g.id}
            className="mt-10 first-of-type:mt-0"
          >
            <GroupHeading id={g.id} only={groups.length === 1}>
              {g.title}
            </GroupHeading>
            <ProjectIndex projects={g.items} />
          </section>
        ))
      )}
    </main>
  )
}
