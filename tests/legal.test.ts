import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import sitemap from '@/app/sitemap'
import { formatLegalDate, legalNotices } from '@/lib/legal'

const read = (path: string) =>
  readFileSync(
    fileURLToPath(new URL(`../src/${path}`, import.meta.url)),
    'utf8',
  )

const legalFiles = [
  'app/poveritelnost/page.tsx',
  'app/usloviya/page.tsx',
  'app/obrabotvane-na-danni/page.tsx',
  'components/legal/legal-page.tsx',
  'components/site-footer.tsx',
  'lib/legal.ts',
  // Every project's sections.
  ...readdirSync(
    fileURLToPath(new URL('../src/content/legal', import.meta.url)),
  ).map((name) => `content/legal/${name}`),
]

describe('legal pages', () => {
  it('keep em and en dashes out of the copy', () => {
    for (const file of legalFiles) {
      expect(read(file), file).not.toMatch(/[–—]/)
    }
  })

  it('are in the sitemap', () => {
    const urls = sitemap().map((entry) => entry.url)
    expect(urls.some((u) => u.endsWith('/poveritelnost'))).toBe(true)
    expect(urls.some((u) => u.endsWith('/usloviya'))).toBe(true)
    expect(urls.some((u) => u.endsWith('/obrabotvane-na-danni'))).toBe(true)
  })

  it('keep the anchors other pages link to', () => {
    const privacy = read('app/poveritelnost/page.tsx')
    for (const id of ['koy-sam-az', 'danni-ot-google', 'proektite']) {
      expect(privacy).toMatch(new RegExp(`id(: |=)['"]${id}['"]`))
    }
  })

  it('give each project with a section the same anchor on both pages', () => {
    const privacy = read('app/poveritelnost/page.tsx')
    const terms = read('app/usloviya/page.tsx')
    for (const anchor of ['smetkata', 'klientite']) {
      const content = read(`content/legal/${anchor}.tsx`)
      expect(content.match(new RegExp(`id: '${anchor}'`, 'g'))).toHaveLength(2)
      expect(privacy).toContain(`${anchor}Privacy,`)
      expect(terms).toContain(`${anchor}Terms,`)
    }
  })

  it('formats the effective date in Bulgarian', () => {
    expect(formatLegalDate('2026-11-06')).toBe('6 ноември 2026 г.')
  })

  it('shows a material change on /akaunt for 30 days', () => {
    const changes = {
      privacy: [
        {
          date: '2027-03-01',
          text: 'Нов обработващ.',
          material: true as const,
        },
        { date: '2027-02-01', text: 'Поправена печатна грешка.' },
        { date: '2026-11-06', text: 'Публикувана.' },
      ],
      terms: [{ date: '2026-11-06', text: 'Публикувани.' }],
    }
    const on = (iso: string) =>
      legalNotices(new Date(`${iso}T12:00:00Z`), changes).map((n) => n.date)
    expect(on('2027-03-01')).toEqual(['2027-03-01'])
    expect(on('2027-03-30')).toEqual(['2027-03-01'])
    expect(on('2027-03-31')).toEqual([])
    expect(legalNotices(new Date('2027-03-02T00:00:00Z'), changes)).toEqual([
      { ...changes.privacy[0], page: 'privacy' },
    ])
  })

  it('has no notice at launch', () => {
    expect(legalNotices(new Date('2026-11-06T12:00:00Z'))).toEqual([])
  })
})
