import type { CoveredProject } from '@/lib/shelves'

import { AkauntCta } from './akaunt-cta'
import styles from './hero.module.css'
import ui from './home.module.css'
import { PauseOnHover, Rotator, RotatorControls, Slide, Word } from './rotator'
import { Stage } from './stage'

// "онова за ___": the blank turns through the projects and the stage beside
// it shows each one's real screen.
export function Hero({
  items,
  shelvesId,
}: {
  items: readonly CoveredProject[]
  shelvesId: string
}) {
  return (
    <section aria-labelledby="home-title">
      <Rotator
        hues={items.map((p) => p.hue)}
        className={`shell ${styles.grid}`}
      >
        <div className={styles.copy}>
          {/* The turning word is decoration; the heading itself always reads
              the same. */}
          <h1 id="home-title" className={styles.title}>
            <span className={styles.phrase}>онова за</span>{' '}
            <span className={styles.blank} aria-hidden="true">
              {items.map((p, i) => (
                <Word key={p.slug} index={i} className={styles.word}>
                  {p.za}
                </Word>
              ))}
            </span>
            <span className="sr-only">малките полезни неща</span>
          </h1>
          <p className={styles.lede}>
            Малки приложения и сайтове. Всяко е за едно нещо и се казва по това,
            за което е. Тези с Вход ползват един общ Акаунт: влизаш веднъж и си
            вътре във всички.
          </p>
          <div className={styles.actions}>
            <a
              href={`#${shelvesId}`}
              className={`${ui.btn} ${ui.btnLg} ${ui.btnInk}`}
            >
              Разгледай проектите
            </a>
            <AkauntCta className={`${ui.btn} ${ui.btnLg} ${ui.btnLine}`} />
          </div>
        </div>

        {items.length > 0 && (
          <div className={styles.stageColumn}>
            {/* Only the showing slide is visible, so only its screenshot (and
                alt text) is exposed to assistive tech. */}
            <PauseOnHover className={styles.stage}>
              {items.map((p, i) => (
                <Slide key={p.slug} index={i} className={styles.slide}>
                  <Stage project={p} high={i === 0} />
                </Slide>
              ))}
            </PauseOnHover>
            <RotatorControls
              items={items.map((p) => ({ slug: p.slug, za: p.za }))}
            />
          </div>
        )}
      </Rotator>
    </section>
  )
}
