import { STATUSES, TYPES } from '@/content/taxonomy'
import type { Project } from '@/lib/project-schema'
import { yearsLabel } from '@/lib/projects'

import { domain } from '../index/project-index'

const date = new Intl.DateTimeFormat('bg', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

function Fact({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div className="border-border grid grid-cols-[6.5rem_minmax(0,1fr)] gap-3 border-t py-2.5">
      <dt className="text-muted-foreground">{term}</dt>
      <dd>{children}</dd>
    </div>
  )
}

export function Facts({ project: p }: { project: Project }) {
  return (
    <dl className="text-[0.9375rem] leading-snug">
      <Fact term="Вид">{TYPES[p.type].label}</Fact>
      <Fact term="Чие">{p.client ? `За клиент: ${p.client.name}` : 'Мое'}</Fact>
      <Fact term="Статус">
        <span className="font-semibold">{STATUSES[p.status].label}</span>
        <span className="text-muted-foreground block">
          {STATUSES[p.status].hint}
        </span>
      </Fact>
      <Fact term="Години">{yearsLabel(p)}</Fact>
      {p.uiLanguage === 'en' && (
        <Fact term="Език">Интерфейсът е на английски.</Fact>
      )}
      {p.links.live && (
        <Fact term="Адрес">
          <a href={p.links.live} className="link-prose break-words">
            {domain(p.links.live)}
          </a>
        </Fact>
      )}
      <Fact term="Обновено">
        <time dateTime={p.updatedAt}>{date.format(new Date(p.updatedAt))}</time>
      </Fact>
    </dl>
  )
}
