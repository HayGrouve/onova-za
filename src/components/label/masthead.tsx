import Image from 'next/image'
import { ViewTransition } from 'react'

import { accent } from '@/lib/accent'
import type { Project } from '@/lib/project-schema'

import { Tags } from './label'
import styles from './label.module.css'

// The project's label at full size: the page header and the H1. The cover,
// when there is one, stands on its bottom edge. When the project is online, the whole label
// opens it in a new tab.
export function Masthead({ project: p }: { project: Project }) {
  const { cover } = p
  const phone = cover?.frame === 'phone'
  const { live } = p.links
  return (
    <div className={`${styles.label} ${styles.masthead}`} {...accent(p.hue)}>
      <ViewTransition name={`label-${p.slug}`} share="morph" default="none">
        <div className={styles.face}>
          <div className={styles.inner}>
            <h1 className={styles.heading}>
              <span className={styles.phrase}>онова за</span>{' '}
              <span className={styles.noun}>{p.za}</span>
              <span className="sr-only">: </span>
              {live ? (
                <a
                  href={live}
                  target="_blank"
                  rel="noopener"
                  className={`${styles.link} ${styles.mastName}`}
                >
                  <span className={styles.nameText}>{p.name}</span>
                  <span className="sr-only"> (отваря се в нов раздел)</span>
                </a>
              ) : (
                <span className={styles.mastName}>{p.name}</span>
              )}
            </h1>
            <p className={styles.pitch}>{p.pitch}</p>
            <Tags project={p} />
          </div>
          {cover && (
            <div className={styles.mastArt}>
              <div className={styles.mastShot} data-frame={cover.frame}>
                <Image
                  src={cover.src}
                  alt={cover.alt}
                  loading="eager"
                  fetchPriority="high"
                  sizes={
                    phone
                      ? '(min-width: 768px) 272px, 240px'
                      : '(min-width: 1280px) 640px, (min-width: 768px) 52vw, 92vw'
                  }
                />
              </div>
            </div>
          )}
        </div>
      </ViewTransition>
    </div>
  )
}
