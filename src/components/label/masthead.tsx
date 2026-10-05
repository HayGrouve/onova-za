import Image from 'next/image'
import { ViewTransition } from 'react'

import { accent } from '@/lib/accent'
import type { Project } from '@/lib/project-schema'

import { Tags } from './label'
import styles from './label.module.css'

// The project's label at full size: the page header and the H1. The cover
// stands on its bottom edge.
export function Masthead({ project: p }: { project: Project }) {
  const phone = p.cover.frame === 'phone'
  return (
    <div className={`${styles.label} ${styles.masthead}`} {...accent(p.hue)}>
      <ViewTransition name={`label-${p.slug}`} share="morph" default="none">
        <div className={styles.face}>
          <div className={styles.inner}>
            <h1 className={styles.heading}>
              <span className={styles.phrase}>онова за</span>{' '}
              <span className={styles.noun}>{p.za}</span>
              <span className="sr-only">: </span>
              <span className={styles.mastName}>{p.name}</span>
            </h1>
            <p className={styles.pitch}>{p.pitch}</p>
            <Tags project={p} />
          </div>
          <div className={styles.mastArt}>
            <div className={styles.mastShot} data-frame={p.cover.frame}>
              <Image
                src={p.cover.src}
                alt={p.cover.alt}
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
        </div>
      </ViewTransition>
    </div>
  )
}
