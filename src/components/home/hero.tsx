import { accent } from '@/lib/accent'
import type { Project } from '@/lib/project-schema'

import styles from './hero.module.css'

// Hovering or focusing a label writes its noun into the blank. Every
// completion is already in the DOM; the generated rules only change which one
// is visible, and only where there is a real pointer. Slugs are validated by
// the schema (a-z, 0-9, hyphens), so they are safe inside a selector.
const active = (slug?: string) => {
  const label = slug ? `[data-slug="${slug}"]` : '[data-slug]'
  return `main:has(${label}:hover,${label} a:focus-visible)`
}

function swapRules(slugs: readonly string[]) {
  return [
    '@media (hover:hover){',
    `${active()} [data-completion="default"]{opacity:0}`,
    ...slugs.map(
      (slug) => `${active(slug)} [data-completion="${slug}"]{opacity:1}`,
    ),
    '}',
  ].join('\n')
}

export function Hero({ projects }: { projects: readonly Project[] }) {
  return (
    <section className={styles.hero}>
      <style>{swapRules(projects.map((p) => p.slug))}</style>
      <h1 className={styles.title}>
        <span>онова за</span>{' '}
        <span className={styles.slot}>
          <span className={styles.completion} data-completion="default">
            малките полезни неща
          </span>
          {projects.map((p) => (
            <span
              key={p.slug}
              className={styles.completion}
              data-completion={p.slug}
              aria-hidden="true"
              {...accent(p.hue)}
            >
              {p.za}
            </span>
          ))}
        </span>
      </h1>
    </section>
  )
}
