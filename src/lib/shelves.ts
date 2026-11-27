import type { Project, Shot } from './project-schema'

// The home page groups projects by how you use them, read from the data:
// with the Акаунт, in the browser without one, on your computer, and client
// work last. Each project lands on exactly one Рафт, in registry order.

export type ShelfId = 'akaunt' | 'bez-vhod' | 'za-kompyutara' | 'za-klienti'

export type Shelf = {
  id: ShelfId
  title: string
  // The Акаунт shelf has none: its head carries the Акаунт facts instead.
  lead?: string
  projects: Project[]
}

const SHELVES: readonly Omit<Shelf, 'projects'>[] = [
  { id: 'akaunt', title: 'С един Акаунт' },
  {
    id: 'bez-vhod',
    title: 'Без Вход',
    lead: 'Отваряш и ползваш веднага.',
  },
  {
    id: 'za-kompyutara',
    title: 'За компютъра',
    lead: 'Сваляш на компютъра си и ползваш без Вход.',
  },
  {
    id: 'za-klienti',
    title: 'За клиенти',
    lead: 'Правени по поръчка, за хора с малък бизнес.',
  },
]

function shelfOf(p: Project): ShelfId {
  if (p.owner === 'client') return 'za-klienti'
  if (p.akaunt) return 'akaunt'
  if (p.type === 'desktop') return 'za-kompyutara'
  return 'bez-vhod'
}

// Empty shelves are left out.
export function shelves(projects: readonly Project[]): Shelf[] {
  return SHELVES.map((s) => ({
    ...s,
    projects: projects.filter((p) => shelfOf(p) === s.id),
  })).filter((s) => s.projects.length > 0)
}

// A page column is three units wide, so a card can take a third, a half or
// all of a shelf without leaving the column grid.
export const UNITS = 3

export type PlacedShelf = {
  shelf: Shelf
  // Page columns the shelf takes on a wide screen.
  span: number
  // Units each card takes, in the shelf's order.
  cards: { project: Project; units: number }[]
}

export type ShelfRow = { shelves: PlacedShelf[] }

// On a wide screen the page has `columns` card columns, and no row may end
// on a hole. The Акаунт shelf always takes a row of its own (its head
// carries the Акаунт facts); the smaller shelves after it share a row while
// their cards fit.
//
// - A shelf alone in its row takes the full width. Its cards split into as
//   few lines as the columns allow, as even as possible (5 cards: 3 then 2),
//   and the cards of each line share the width.
// - A shared row gives its spare columns to its last shelf, whose card
//   without a screenshot (or else its last card) spans the extra.
export function shelfRows(list: readonly Shelf[], columns = 4): ShelfRow[] {
  const rows: Shelf[][] = []
  for (const shelf of list) {
    const last = rows.at(-1)
    const used = last?.reduce((n, s) => n + s.projects.length, 0) ?? 0
    const fits =
      last &&
      shelf.id !== 'akaunt' &&
      last[0].id !== 'akaunt' &&
      used + shelf.projects.length <= columns
    if (fits) last.push(shelf)
    else rows.push([shelf])
  }

  return rows.map((row) => {
    if (row.length === 1) return { shelves: [alone(row[0], columns)] }
    const used = row.reduce((n, s) => n + s.projects.length, 0)
    return {
      shelves: row.map((shelf, i) => {
        const spare = i === row.length - 1 ? columns - used : 0
        const wide =
          spare > 0
            ? (shelf.projects.find((p) => !p.cover) ?? shelf.projects.at(-1))
            : undefined
        return {
          shelf,
          span: shelf.projects.length + spare,
          cards: shelf.projects.map((project) => ({
            project,
            units: UNITS * (project === wide ? spare + 1 : 1),
          })),
        }
      }),
    }
  })
}

function alone(shelf: Shelf, columns: number): PlacedShelf {
  const n = shelf.projects.length
  const lines = Math.ceil(n / columns)
  const width = columns * UNITS
  const units: number[] = []
  for (let line = 0; line < lines; line++) {
    // Earlier lines take the extra card: 5 over 2 lines is 3 then 2.
    const count = Math.floor(n / lines) + (line < n % lines ? 1 : 0)
    const each = Math.floor(width / count)
    for (let i = 0; i < count; i++) {
      // Any rounding left over goes to the line's last card.
      units.push(i === count - 1 ? width - each * (count - 1) : each)
    }
  }
  return {
    shelf,
    span: columns,
    cards: shelf.projects.map((project, i) => ({ project, units: units[i] })),
  }
}

export type CoveredProject = Project & { cover: Shot }

// The hero turns through projects that have a screenshot: the ones with an
// Акаунт first, then the rest, at most `limit` so one turn stays short.
export function heroProjects(
  projects: readonly Project[],
  limit = 6,
): CoveredProject[] {
  const shown = projects.filter(
    (p): p is CoveredProject => Boolean(p.cover) && p.status !== 'archived',
  )
  return [
    ...shown.filter((p) => p.akaunt),
    ...shown.filter((p) => !p.akaunt),
  ].slice(0, limit)
}
