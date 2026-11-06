import { ArrowUpRight } from '@phosphor-icons/react/dist/ssr'

import { accent } from '@/lib/accent'

import type { PanelProject } from './types'

// A plain list of what the Акаунт reaches, not a personal dashboard (#19).
export function ProjectsTab({ projects }: { projects: PanelProject[] }) {
  if (projects.length === 0) {
    return (
      <p className="text-pretty">
        Още нито един проект не ползва Акаунта. Когато някой започне, ще го
        видиш тук.
      </p>
    )
  }
  return (
    <div className="flex flex-col gap-4">
      <p className="text-pretty">Същият Акаунт работи във всеки от тях.</p>
      <ul className="divide-border border-border divide-y border-y">
        {projects.map((p) => (
          <li
            key={p.slug}
            {...accent(p.hue)}
            className="flex items-center gap-4 py-3"
          >
            <span aria-hidden="true" className="size-3 shrink-0 bg-(--fill)" />
            <span className="flex-1 font-semibold">онова за {p.za}</span>
            <a
              href={p.origin}
              className="link-quiet inline-flex items-center gap-1 py-2 font-semibold"
            >
              Отвори<span className="sr-only"> онова за {p.za}</span>
              <ArrowUpRight size={14} weight="bold" aria-hidden="true" />
            </a>
          </li>
        ))}
      </ul>
      <p className="text-muted-foreground text-sm text-pretty">
        Данните си в един проект изтриваш от неговите настройки, в „Данни“.
        Акаунтът ти остава.
      </p>
    </div>
  )
}
