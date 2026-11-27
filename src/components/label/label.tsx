import Link from 'next/link'
import type { ReactNode } from 'react'

import { accent } from '@/lib/accent'
import { paths } from '@/lib/paths'
import type { Project } from '@/lib/project-schema'

import styles from './label.module.css'

export function Tags({ project: p }: { project: Project }) {
  if (p.owner !== 'client') return null
  return (
    <div className={styles.tags}>
      <span className={`${styles.chip} ${styles.chipInk}`}>За клиент</span>
    </div>
  )
}

// A project's label in "Още онова за...", three across under a project page.
export function Label({
  project: p,
  headingLevel: Heading = 'h3',
}: {
  project: Project
  headingLevel?: 'h2' | 'h3'
}) {
  return (
    <li className={styles.label} data-slug={p.slug} {...accent(p.hue)}>
      <div className={styles.face}>
        <div className={styles.inner}>
          <Heading className={styles.heading}>
            <span className={styles.phrase}>онова за</span>{' '}
            <span className={styles.noun}>{p.za}</span>
          </Heading>
          <Tags project={p} />
          <div className={styles.info}>
            <p className={styles.name}>
              <Link href={paths.project(p.slug)} className={styles.link}>
                <span className={styles.nameText}>{p.name}</span>
              </Link>
            </p>
            <p className={styles.pitch}>{p.pitch}</p>
          </div>
        </div>
      </div>
    </li>
  )
}

export function Wall({ children }: { children: ReactNode }) {
  return <ul className={styles.wall}>{children}</ul>
}
