import { Fragment, type ReactNode } from 'react'

import {
  controller,
  effectiveDate,
  formatLegalDate,
  type LegalChange,
  type ProjectAnchor,
} from '@/lib/legal'

export type LegalSection = {
  // Stable anchor: other pages, projects and Google's consent screen link to
  // it, so never rename one that is live.
  id: string
  title: string
  body: ReactNode
}

const h2 =
  'font-display text-[clamp(1.875rem,3vw,2.375rem)] leading-none font-extrabold tracking-[-0.005em]'

// One layout for /poveritelnost and /usloviya: title, effective date, a
// contents list built from the same sections it renders, so the two can
// never disagree.
export function LegalPage({
  title,
  lead,
  changes,
  sections,
  head,
}: {
  title: string
  lead: ReactNode
  changes: readonly LegalChange[]
  sections: readonly LegalSection[]
  head?: ReactNode
}) {
  const since = effectiveDate(changes)
  return (
    <main id="main" className="shell">
      {head}
      <header className="max-w-[42rem] pt-[clamp(2rem,5vw,3.5rem)]">
        <h1 className="font-display text-[clamp(2.5rem,6vw,4.5rem)] leading-[0.95] font-extrabold tracking-[-0.01em]">
          {title}
        </h1>
        <p className="mt-4 text-xl leading-snug text-pretty">{lead}</p>
        <p className="text-muted-foreground mt-4 text-sm">
          В сила от <time dateTime={since}>{formatLegalDate(since)}</time>
        </p>
      </header>

      <div className="mt-[clamp(2rem,5vw,3.5rem)] grid gap-12 lg:grid-cols-[minmax(0,1fr)_19rem] lg:gap-16">
        <nav
          aria-labelledby="sadarzhanie"
          className="lg:col-start-2 lg:row-start-1"
        >
          <div className="border-border border-t pt-4 lg:sticky lg:top-6">
            <h2 id="sadarzhanie" className="text-sm font-semibold">
              Съдържание
            </h2>
            <ol className="mt-3 space-y-2 text-sm">
              {sections.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="link-quiet">
                    {s.title}
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </nav>

        <article className="max-w-[42rem] space-y-[clamp(2.5rem,5vw,3.5rem)] lg:col-start-1 lg:row-start-1">
          {sections.map((s) => (
            <section key={s.id} aria-labelledby={s.id}>
              <h2 id={s.id} className={h2}>
                {s.title}
              </h2>
              <div className="[&_a]:link-prose [&_code]:bg-surface mt-4 space-y-4 text-[1.0625rem] leading-relaxed [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.9em] [&_h3]:pt-2 [&_h3]:text-xl [&_h3]:font-bold [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
                {s.body}
              </div>
            </section>
          ))}
        </article>
      </div>
    </main>
  )
}

// The "Промени" list, newest first.
export function ChangeList({ changes }: { changes: readonly LegalChange[] }) {
  return (
    <ul>
      {changes.map((c) => (
        <li key={`${c.date} ${c.text}`}>
          <time dateTime={c.date}>{formatLegalDate(c.date)}</time>: {c.text}
        </li>
      ))}
    </ul>
  )
}

// Two columns, label and value, that stay readable at phone width.
export function Facts({ rows }: { rows: readonly [string, ReactNode][] }) {
  return (
    <dl className="border-border divide-border divide-y border-y">
      {rows.map(([label, value]) => (
        <div
          key={label}
          className="grid gap-1 py-3 sm:grid-cols-[12rem_minmax(0,1fr)] sm:gap-4"
        >
          <dt className="text-muted-foreground text-base">{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  )
}

// The address every legal page gives for questions about personal data.
export const ControllerEmail = () => (
  <a href={`mailto:${controller.email}`}>{controller.email}</a>
)

// The fixed headings of a project's section on /poveritelnost, in the order
// every project uses them (#31, decision 13), so a reader can compare
// projects point by point. A project fills each one; none can be skipped.
const projectPrivacyHeadings = [
  ['stores', 'Какво пази'],
  ['why', 'Защо'],
  ['where', 'Къде и при кои доставчици'],
  ['howLong', 'Колко време'],
  ['data', 'Изтегляне и Изтрий данните'],
  ['special', 'Специално'],
] as const

export type ProjectPrivacy = {
  id: ProjectAnchor
  // The project's name, like "Онова за сметката".
  title: string
  // One or two lines on what the project is, above the fixed headings.
  lead: ReactNode
} & Record<(typeof projectPrivacyHeadings)[number][0], ReactNode>

export function projectPrivacySection({
  id,
  title,
  lead,
  ...parts
}: ProjectPrivacy): LegalSection {
  return {
    id,
    title,
    body: (
      <>
        {lead}
        {projectPrivacyHeadings.map(([key, heading]) => (
          <Fragment key={key}>
            <h3>{heading}</h3>
            {parts[key]}
          </Fragment>
        ))}
      </>
    ),
  }
}
