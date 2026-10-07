import type { Route } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { type ReactNode, ViewTransition } from 'react'

import { accent } from '@/lib/accent'
import { paths } from '@/lib/paths'
import type { Project, Shot } from '@/lib/project-schema'

import styles from './label.module.css'

// Sizes follow the label, not the viewport: a featured label is about 600px
// wide on desktop and the full column on a phone.
const SHOT_SIZES: Record<Shot['frame'], string> = {
  phone: '(min-width: 1280px) 256px, 168px',
  browser: '(min-width: 1280px) 440px, (min-width: 768px) 36vw, 72vw',
  bare: '(min-width: 1280px) 440px, (min-width: 768px) 36vw, 72vw',
}

export function Tags({ project: p }: { project: Project }) {
  if (p.owner !== 'client') return null
  return (
    <div className={styles.tags}>
      <span className={`${styles.chip} ${styles.chipInk}`}>За клиент</span>
    </div>
  )
}

export function Label({
  project: p,
  size = p.featured ? 'featured' : 'regular',
  side,
  wide,
  eager,
  morph = true,
  headingLevel: Heading = 'h3',
}: {
  project: Project
  size?: 'featured' | 'regular'
  side?: 'start' | 'end'
  wide?: boolean
  // Above-the-fold screenshots load at once; 'high' marks the likely LCP.
  eager?: boolean | 'high'
  // Only one label per page may share a name with the page it opens.
  morph?: boolean
  headingLevel?: 'h2' | 'h3'
}) {
  const face = (
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
      {size === 'featured' && p.cover && (
        <div className={styles.art}>
          <div className={styles.shot} data-frame={p.cover.frame}>
            <Image
              src={p.cover.src}
              alt={p.cover.alt}
              sizes={SHOT_SIZES[p.cover.frame]}
              loading={eager ? 'eager' : 'lazy'}
              fetchPriority={eager === 'high' ? 'high' : undefined}
            />
          </div>
        </div>
      )}
    </div>
  )

  return (
    <li
      className={styles.label}
      data-slug={p.slug}
      data-size={size}
      data-side={side}
      data-wide={wide || undefined}
      {...accent(p.hue)}
    >
      {morph ? (
        // The project page header carries the same name, so the label grows
        // into it when the project opens.
        <ViewTransition name={`label-${p.slug}`} share="morph" default="none">
          {face}
        </ViewTransition>
      ) : (
        face
      )}
    </li>
  )
}

// The same anatomy in ink, for links that are not projects.
export function NeutralLabel({
  href,
  noun,
  name,
  pitch,
}: {
  href: Route
  noun: string
  name: string
  pitch: string
}) {
  return (
    <li className={`${styles.label} ${styles.neutral}`} data-size="regular">
      <div className={styles.face}>
        <div className={styles.inner}>
          <h3 className={styles.heading}>
            <span className={styles.phrase}>онова за</span>{' '}
            <span className={styles.noun}>{noun}</span>
          </h3>
          <div className={styles.info}>
            <p className={styles.name}>
              <Link href={href} className={styles.link}>
                <span className={styles.nameText}>{name}</span>
              </Link>
            </p>
            <p className={styles.pitch}>{pitch}</p>
          </div>
        </div>
      </div>
    </li>
  )
}

export function Wall({
  children,
  columns,
}: {
  children: ReactNode
  columns?: 3
}) {
  return (
    <ul className={styles.wall} data-columns={columns}>
      {children}
    </ul>
  )
}

// Featured labels take two rows and alternate sides, so a group never
// stacks two big labels in the same column.
export function ProjectWall({
  projects,
  aboveFold = false,
}: {
  projects: readonly Project[]
  aboveFold?: boolean
}) {
  // Two columns: featured labels pair up side by side, regular ones fill one
  // cell. A featured or regular label left without a partner runs full width,
  // so the wall never ends on a hole.
  const lastOdd = (isFeatured: boolean) => {
    const group = projects.filter((p) => p.featured === isFeatured)
    return group.length % 2 ? group.at(-1)?.slug : undefined
  }
  const wide = [lastOdd(true), lastOdd(false)]

  let featured = 0
  return (
    <Wall>
      {projects.map((p) => {
        const n = p.featured ? featured++ : -1
        const side = n < 0 ? undefined : n % 2 ? 'end' : 'start'
        const eager =
          aboveFold && n >= 0 && n < 2 ? (n === 0 ? 'high' : true) : undefined
        return (
          <Label
            key={p.slug}
            project={p}
            side={side}
            wide={wide.includes(p.slug)}
            eager={eager}
          />
        )
      })}
    </Wall>
  )
}
