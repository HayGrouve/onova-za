import Image from 'next/image'

import { accent } from '@/lib/accent'
import { domain } from '@/lib/domain'
import type { Shot } from '@/lib/project-schema'
import type { CoveredProject } from '@/lib/shelves'

import styles from './stage.module.css'

// The stage is about 640px wide on desktop and the column on a phone. A
// phone frame is under half of that.
const WIDE = '(min-width: 1024px) 640px, 92vw'
const SIZES: Record<Shot['frame'], string> = {
  phone: '(min-width: 1024px) 300px, 52vw',
  browser: WIDE,
  bare: WIDE,
}

// A soft wash of the project's hue with its real cover in a frame. A slide
// only renders once it is about to show, so its image always loads at once;
// the first one is the likely LCP.
export function Stage({
  project: p,
  high,
}: {
  project: CoveredProject
  high?: boolean
}) {
  const shot = p.cover
  const image = (
    <Image
      src={shot.src}
      alt={shot.alt}
      sizes={SIZES[shot.frame]}
      quality={85}
      loading="eager"
      fetchPriority={high ? 'high' : undefined}
      className={styles.image}
    />
  )

  return (
    <div className={styles.panel} data-frame={shot.frame} {...accent(p.hue)}>
      {shot.frame === 'phone' ? (
        <div className={styles.phone}>
          <div className={styles.screen}>{image}</div>
        </div>
      ) : (
        <div className={styles.browser}>
          {shot.frame === 'browser' && (
            <div className={styles.bar} aria-hidden="true">
              <span className={styles.dots}>
                <span />
                <span />
                <span />
              </span>
              {p.links.live && (
                <span className={styles.url}>{domain(p.links.live)}</span>
              )}
            </div>
          )}
          {image}
        </div>
      )}
    </div>
  )
}
