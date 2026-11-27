import { describe, expect, it } from 'vitest'

import type { Project } from '@/lib/project-schema'
import { projects } from '@/lib/projects'
import { heroProjects, shelfRows, shelves } from '@/lib/shelves'

// Only the fields the grouping reads; the rest of a Project does not matter.
function make(
  slug: string,
  extra: Partial<Pick<Project, 'owner' | 'type' | 'status'>> & {
    akaunt?: boolean
    cover?: boolean
  } = {},
): Project {
  return {
    slug,
    owner: extra.owner ?? 'own',
    type: extra.type ?? 'app',
    status: extra.status ?? 'live',
    akaunt: extra.akaunt ? { subdomain: slug } : undefined,
    cover: extra.cover === false ? undefined : { frame: 'phone' },
  } as unknown as Project
}

const slugs = (list: readonly Project[]) => list.map((p) => p.slug)

describe('shelves', () => {
  it('groups by Акаунт, no sign-in, desktop and client, in registry order', () => {
    const list = [
      make('a'),
      make('b', { akaunt: true }),
      make('c', { type: 'desktop' }),
      make('d', { owner: 'client' }),
      make('e', { akaunt: true }),
      make('f', { type: 'site' }),
    ]
    expect(
      shelves(list).map((s) => [s.id, s.title, slugs(s.projects)]),
    ).toEqual([
      ['akaunt', 'С един Акаунт', ['b', 'e']],
      ['bez-vhod', 'Без Вход', ['a', 'f']],
      ['za-kompyutara', 'За компютъра', ['c']],
      ['za-klienti', 'За клиенти', ['d']],
    ])
  })

  it('leaves empty shelves out, so За клиенти shows only with client work', () => {
    const ids = shelves([make('a'), make('b', { akaunt: true })]).map(
      (s) => s.id,
    )
    expect(ids).toEqual(['akaunt', 'bez-vhod'])
  })

  it('puts client work on its own shelf even with an Акаунт or for desktop', () => {
    const list = [
      make('a', { owner: 'client', akaunt: true }),
      make('b', { owner: 'client', type: 'desktop' }),
    ]
    expect(shelves(list).map((s) => [s.id, slugs(s.projects)])).toEqual([
      ['za-klienti', ['a', 'b']],
    ])
  })

  it('a desktop app with an Акаунт sits with the Акаунт', () => {
    const [shelf] = shelves([make('a', { type: 'desktop', akaunt: true })])
    expect(shelf.id).toBe('akaunt')
  })

  it('places every real project exactly once', () => {
    const placed = shelves(projects).flatMap((s) => slugs(s.projects))
    expect(placed.toSorted()).toEqual(slugs(projects).toSorted())
  })
})

describe('shelfRows', () => {
  // [shelf id, span, units of each card]
  const rowsOf = (list: Project[]) =>
    shelfRows(shelves(list)).map((r) =>
      r.shelves.map((s) => [s.shelf.id, s.span, s.cards.map((c) => c.units)]),
    )
  const akaunt = (n: number) =>
    Array.from({ length: n }, (_, i) => make(`a${i}`, { akaunt: true }))

  it('keeps the Акаунт shelf alone and pairs small shelves, the last widening its card without a screenshot', () => {
    const list = [
      ...akaunt(4),
      make('c'),
      make('d'),
      make('e', { type: 'desktop', cover: false }),
    ]
    expect(rowsOf(list)).toEqual([
      [['akaunt', 4, [3, 3, 3, 3]]],
      [
        ['bez-vhod', 2, [3, 3]],
        ['za-kompyutara', 2, [6]],
      ],
    ])
  })

  it('widens a card without a screenshot before the last one', () => {
    const list = [
      make('a'),
      make('b', { type: 'desktop', cover: false }),
      make('c', { type: 'desktop' }),
    ]
    expect(rowsOf(list)).toEqual([
      [
        ['bez-vhod', 1, [3]],
        ['za-kompyutara', 3, [6, 3]],
      ],
    ])
  })

  it('lets a shelf alone in its row share the full width, never leaving a hole', () => {
    expect(rowsOf(akaunt(3))).toEqual([[['akaunt', 4, [4, 4, 4]]]])
    expect(rowsOf(akaunt(2))).toEqual([[['akaunt', 4, [6, 6]]]])
    // 5 cards: 3 on the first line, 2 on the second.
    expect(rowsOf(akaunt(5))).toEqual([[['akaunt', 4, [4, 4, 4, 6, 6]]]])
    // 8 cards: two full lines of 4.
    expect(rowsOf(akaunt(8))).toEqual([[['akaunt', 4, Array(8).fill(3)]]])
  })

  it('gives a shelf its own row once the cards would not fit', () => {
    const list = [
      make('a'),
      make('b'),
      make('c'),
      make('d', { type: 'desktop' }),
      make('e', { type: 'desktop' }),
    ]
    expect(rowsOf(list)).toEqual([
      [['bez-vhod', 4, [4, 4, 4]]],
      [['za-kompyutara', 4, [6, 6]]],
    ])
  })

  it('every line of every row fills the columns exactly', () => {
    for (let n = 1; n <= 12; n++) {
      for (const row of shelfRows(shelves(akaunt(n)))) {
        const total = row.shelves[0].cards.reduce((t, c) => t + c.units, 0)
        expect(total % 12, `n=${n}`).toBe(0)
      }
    }
  })
})

describe('heroProjects', () => {
  it('takes covered, unarchived projects, Акаунт first, at most six', () => {
    const list = [
      make('a'),
      make('b', { akaunt: true }),
      make('c', { cover: false }),
      make('d', { status: 'archived' }),
      make('e', { akaunt: true }),
      make('f'),
      make('g'),
      make('h'),
      make('i'),
    ]
    expect(slugs(heroProjects(list))).toEqual(['b', 'e', 'a', 'f', 'g', 'h'])
  })
})
