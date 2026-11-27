import { ArrowUpRight, DownloadSimple } from '@phosphor-icons/react/dist/ssr'
import Image from 'next/image'
import Link from 'next/link'
import type { CSSProperties } from 'react'

import { STATUSES, TYPES } from '@/content/taxonomy'
import { accent } from '@/lib/accent'
import { domain } from '@/lib/domain'
import { paths } from '@/lib/paths'
import type { Project, Shot } from '@/lib/project-schema'

import ui from './home.module.css'
import styles from './shelves.module.css'

// Cards are about 290px wide on desktop and the column on a phone. A phone
// shot is about half the card; a browser shot runs off its right edge.
const WIDE = '(min-width: 1024px) 460px, (min-width: 768px) 60vw, 130vw'
const SIZES: Record<Shot['frame'], string> = {
  phone: '(min-width: 768px) 170px, 50vw',
  browser: WIDE,
  bare: WIDE,
}

// What you would do with the thing itself: open it where it lives, or
// download it. The project page is always the second action.
function primary(p: Project) {
  if (p.links.live)
    return { href: p.links.live, label: 'Отвори', Icon: ArrowUpRight }
  if (p.links.download) {
    return { href: p.links.download, label: 'Свали', Icon: DownloadSimple }
  }
  return undefined
}

// "Онова за кафето" under "онова за кафето" would say it twice.
const nameAddsSomething = (p: Project) =>
  p.name.toLocaleLowerCase('bg') !== `онова за ${p.za}`

export function ProjectCard({
  project: p,
  units,
}: {
  project: Project
  // Grid units this card takes on a wide screen (see lib/shelves).
  units: number
}) {
  const action = primary(p)
  const { style, ...hue } = accent(p.hue)
  return (
    <li
      className={styles.card}
      data-cover={p.cover?.frame ?? 'none'}
      style={{ ...style, '--units': units } as CSSProperties}
      {...hue}
    >
      <div className={styles.well}>
        {p.cover ? (
          <div className={styles.shot} data-frame={p.cover.frame}>
            {p.cover.frame === 'browser' && (
              <span className={styles.shotBar} aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
            )}
            <Image
              src={p.cover.src}
              alt={p.cover.alt}
              sizes={SIZES[p.cover.frame]}
            />
          </div>
        ) : (
          // Nothing to screenshot: the well carries what it does, in type,
          // and the body below gives the longer description instead.
          <div className={styles.typeWell}>
            <span className={styles.typeLabel}>{TYPES[p.type].label}</span>
            <p className={styles.typePitch}>{p.pitch}</p>
          </div>
        )}
      </div>

      <div className={styles.body}>
        <h3 className={styles.title}>
          <span className={styles.phrase}>онова за</span>{' '}
          <span className={styles.noun}>{p.za}</span>
        </h3>

        <p className={styles.meta}>
          {nameAddsSomething(p) && (
            <span className={styles.name}>{p.name}</span>
          )}
          {p.client && <span className={styles.name}>За {p.client.name}</span>}
          <span className={styles.status} data-status={p.status}>
            {STATUSES[p.status].label}
          </span>
          {p.links.live && (
            <span className={styles.host}>{domain(p.links.live)}</span>
          )}
        </p>

        <p className={styles.pitch}>{p.cover ? p.pitch : p.description}</p>

        <div className={styles.actions}>
          {action && (
            <a href={action.href} className={`${ui.btn} ${ui.btnInk}`}>
              {action.label}
              <span className="sr-only"> онова за {p.za}</span>
              <action.Icon aria-hidden="true" />
            </a>
          )}
          <Link
            href={paths.project(p.slug)}
            className={`${ui.btn} ${ui.btnLine}`}
          >
            Повече
            <span className="sr-only"> за онова за {p.za}</span>
          </Link>
        </div>
      </div>
    </li>
  )
}
