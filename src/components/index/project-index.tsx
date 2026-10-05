import { ArrowRight } from '@phosphor-icons/react/dist/ssr'
import Link from 'next/link'

import { accent } from '@/lib/accent'
import { paths } from '@/lib/paths'
import type { Project } from '@/lib/project-schema'

import styles from './project-index.module.css'

const domain = (url: string) => new URL(url).host.replace(/^www\./, '')

// "Онова за сметката" is both the name and the phrase: say it once.
const nameRepeatsPhrase = (p: Project) =>
  p.name.toLocaleLowerCase('bg') === `онова за ${p.za}`

function Row({ project: p }: { project: Project }) {
  return (
    <li className={styles.row} {...accent(p.hue)}>
      <h3 className={styles.za}>
        <Link href={paths.project(p.slug)} className={styles.link}>
          <span className={styles.phrase}>онова за</span>{' '}
          <span className={styles.noun}>{p.za}</span>
        </Link>
      </h3>
      <p className={styles.text}>
        {!nameRepeatsPhrase(p) && (
          <span className={styles.name}>{p.name}. </span>
        )}
        {p.pitch}
      </p>
      <dl className={styles.facts}>
        <div>
          <dt className="sr-only">Адрес</dt>
          <dd>
            {p.links.live ? (
              <a
                href={p.links.live}
                target="_blank"
                rel="noopener"
                className={`${styles.address} link-prose`}
              >
                {domain(p.links.live)}
                <span className="sr-only"> (отваря се в нов раздел)</span>
              </a>
            ) : (
              <span className={styles.muted}>без публичен адрес</span>
            )}
          </dd>
        </div>
      </dl>
      <span className={styles.arrow} aria-hidden="true">
        <ArrowRight size={20} />
      </span>
    </li>
  )
}

export function ProjectIndex({ projects }: { projects: readonly Project[] }) {
  return (
    <ul className={styles.rows}>
      {projects.map((p) => (
        <Row key={p.slug} project={p} />
      ))}
    </ul>
  )
}
