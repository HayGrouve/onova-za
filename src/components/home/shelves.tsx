import { SignIn, SignOut, Vault } from '@phosphor-icons/react/dist/ssr'
import type { CSSProperties } from 'react'

import type { Project } from '@/lib/project-schema'
import { type Shelf, UNITS, shelfRows, shelves } from '@/lib/shelves'

import { AkauntCta } from './akaunt-cta'
import ui from './home.module.css'
import { ProjectCard } from './project-card'
import styles from './shelves.module.css'

// The three Акаунт facts, beside the shelf they explain.
const AKAUNT_FACTS = [
  {
    Icon: SignIn,
    title: 'Влизаш веднъж, тук.',
    text: 'С Google или с код по имейл, без пароли.',
  },
  {
    Icon: Vault,
    title: 'Всеки проект пази своето.',
    text: 'Данните и плащанията са отделни за всеки.',
  },
  {
    Icon: SignOut,
    title: 'Един Изход стига.',
    text: 'Излизаш от всички наведнъж.',
  },
] as const

function ShelfHead({ shelf }: { shelf: Shelf }) {
  const title = (
    <h2 id={shelf.id} className={styles.shelfTitle}>
      {shelf.title}
    </h2>
  )
  if (shelf.id !== 'akaunt') {
    return (
      <header className={styles.head}>
        {title}
        {shelf.lead && <p className={styles.lead}>{shelf.lead}</p>}
      </header>
    )
  }
  // The facts sit on the same columns as the cards below, and the Вход
  // button closes the row as the thing to do about them.
  return (
    <header className={`${styles.head} ${styles.akauntHead}`}>
      {title}
      <div className={styles.factsPanel}>
        <ul className={styles.facts}>
          {AKAUNT_FACTS.map(({ Icon, title, text }) => (
            <li key={title} className={styles.fact}>
              <Icon className={styles.factIcon} aria-hidden="true" />
              <p>
                <strong className={styles.factTitle}>{title}</strong> {text}
              </p>
            </li>
          ))}
        </ul>
        <div className={styles.factsAction}>
          <AkauntCta className={`${ui.btn} ${ui.btnLine}`} />
        </div>
      </div>
    </header>
  )
}

// Every project, on shelves by how you use it (src/lib/shelves.ts). On a
// wide screen small shelves share a row; below that each shelf stacks and
// its cards wrap, so nothing hides in a sideways scroller.
export function Shelves({
  id,
  projects,
}: {
  id: string
  projects: readonly Project[]
}) {
  const rows = shelfRows(shelves(projects))
  return (
    <div id={id} className={`shell ${styles.shelves}`}>
      {rows.map((row) => (
        <div key={row.shelves[0].shelf.id} className={styles.row}>
          {row.shelves.map(({ shelf, span, cards }) => (
            <section
              key={shelf.id}
              aria-labelledby={shelf.id}
              className={styles.shelf}
              style={
                {
                  '--span': span,
                  '--shelf-units': span * UNITS,
                } as CSSProperties
              }
            >
              <ShelfHead shelf={shelf} />
              <ul className={styles.cards}>
                {cards.map(({ project, units }) => (
                  <ProjectCard
                    key={project.slug}
                    project={project}
                    units={units}
                  />
                ))}
              </ul>
            </section>
          ))}
        </div>
      ))}
    </div>
  )
}
