import Link from 'next/link'

import { paths } from '@/lib/paths'
import { site } from '@/lib/site'

import styles from './closing.module.css'
import ui from './home.module.css'

// The name, explained, and where to go next.
export function Closing({ onlyOwn }: { onlyOwn: boolean }) {
  return (
    <section className={`shell ${styles.closing}`} aria-label="За името">
      <dl className={styles.definition}>
        <dt className={styles.term}>онова за</dt>
        <dd className={styles.meaning}>
          <i>разг.</i> Каквото казваш, когато не помниш как се казва нещо, но
          знаеш за какво е.
        </dd>
      </dl>
      <div className={styles.side}>
        <p className={styles.links}>
          <Link href={paths.projects()} className={`${ui.btn} ${ui.btnInk}`}>
            Всички проекти
          </Link>
          <Link href={paths.contact()} className={`${ui.btn} ${ui.btnLine}`}>
            Пиши ми
          </Link>
        </p>
        <p className={styles.maker}>
          Кой прави това? Аз, {site.author.name}, уеб разработчик от{' '}
          {site.author.city}.{onlyOwn && ' Всичко тук е мое.'}{' '}
          <Link href={paths.about()} className="link-prose">
            Повече за мен
          </Link>
        </p>
      </div>
    </section>
  )
}
