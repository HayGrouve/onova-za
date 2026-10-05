import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'

import { Inline } from '@/components/inline'
import { JsonLd } from '@/components/json-ld'
import { Label, Wall } from '@/components/label/label'
import { Masthead } from '@/components/label/masthead'
import { Actions } from '@/components/project/actions'
import { Facts } from '@/components/project/facts'
import { ShotFigure } from '@/components/project/shot'
import { accent } from '@/lib/accent'
import { paths } from '@/lib/paths'
import { getProject, projects, relatedTo } from '@/lib/projects'
import { pageMeta, projectGraph, projectTitle } from '@/lib/seo'

export const dynamicParams = false

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({
  params,
}: PageProps<'/proekti/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const p = getProject(slug)
  if (!p) return {}
  return pageMeta({
    path: paths.project(p.slug),
    title: projectTitle(p),
    description: p.description,
    noindex: p.seo?.noindex,
  })
}

function Section({
  id,
  title,
  children,
}: {
  id: string
  title: string
  children: ReactNode
}) {
  return (
    <section aria-labelledby={id} className="scroll-mt-6">
      <h2
        id={id}
        className="font-display text-[clamp(1.875rem,3vw,2.375rem)] leading-none font-extrabold tracking-[-0.005em]"
      >
        {title}
      </h2>
      <div className="mt-4 space-y-4 text-[1.0625rem] leading-relaxed">
        {children}
      </div>
    </section>
  )
}

function List({ items }: { items: readonly string[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li
          key={item}
          className="before:bg-tint relative pl-5 before:absolute before:top-[0.7em] before:left-0 before:h-0.5 before:w-2.5"
        >
          <Inline text={item} />
        </li>
      ))}
    </ul>
  )
}

export default async function ProjectPage({
  params,
}: PageProps<'/proekti/[slug]'>) {
  const { slug } = await params
  const p = getProject(slug)
  if (!p) notFound()

  const own = p.owner === 'own'
  const related = relatedTo(p)

  return (
    <main id="main" className="shell" {...accent(p.hue)}>
      <JsonLd data={projectGraph(p)} />

      <nav aria-label="Трохи" className="text-muted-foreground py-4 text-sm">
        <ol className="flex flex-wrap gap-x-2">
          <li>
            <Link href={paths.home()} className="link-quiet">
              Начало
            </Link>
            <span aria-hidden="true"> /</span>
          </li>
          <li>
            <Link href={paths.projects()} className="link-quiet">
              Проекти
            </Link>
            <span aria-hidden="true"> /</span>
          </li>
          <li aria-current="page" className="text-foreground">
            {p.name}
          </li>
        </ol>
      </nav>

      <Masthead project={p} />
      {p.cover.caption && (
        <p className="text-muted-foreground mt-2 text-right text-sm">
          {p.cover.caption}
        </p>
      )}

      <div className="mt-[clamp(2rem,5vw,3.5rem)] grid gap-12 lg:grid-cols-[minmax(0,1fr)_19rem] lg:gap-16">
        <aside
          aria-label="Връзки и факти"
          className="lg:col-start-2 lg:row-start-1"
        >
          <div className="space-y-6 lg:sticky lg:top-6">
            <Actions project={p} />
            <Facts project={p} />
          </div>
        </aside>

        <article className="max-w-[42rem] space-y-[clamp(2.5rem,5vw,3.5rem)] lg:col-start-1 lg:row-start-1">
          <Section id="za-kakvo" title={own ? 'За какво ти е' : 'За какво е'}>
            <List items={p.body.useCases} />
          </Section>

          <Section id="zashto" title={own ? 'Защо го направих' : 'Задачата'}>
            <p>
              <Inline text={p.body.why} />
            </p>
            {p.body.limits && (
              <p>
                <strong className="font-semibold">Какво не прави.</strong>{' '}
                <Inline text={p.body.limits} />
              </p>
            )}
          </Section>

          {p.screens.length > 0 && (
            <div
              className={
                p.screens.length > 1 ? 'grid gap-6 sm:grid-cols-2' : undefined
              }
            >
              {p.screens.map((shot) => (
                <ShotFigure key={shot.alt} shot={shot} />
              ))}
            </div>
          )}

          <Section id="sega" title="Къде е сега">
            <p>
              <Inline text={p.body.state} />
            </p>
          </Section>
        </article>
      </div>

      {related.length > 0 && (
        <section
          aria-labelledby="oshte"
          className="mt-[clamp(3.5rem,8vw,6rem)]"
        >
          <h2
            id="oshte"
            className="font-display mb-4 text-[clamp(1.875rem,3vw,2.375rem)] leading-none font-extrabold"
          >
            Още онова за...
          </h2>
          <Wall columns={3}>
            {related.map((r) => (
              <Label key={r.slug} project={r} size="regular" morph={false} />
            ))}
          </Wall>
        </section>
      )}
    </main>
  )
}
