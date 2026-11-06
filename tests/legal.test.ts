import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import sitemap from '@/app/sitemap'
import { formatLegalDate } from '@/lib/legal'

const read = (path: string) =>
  readFileSync(
    fileURLToPath(new URL(`../src/${path}`, import.meta.url)),
    'utf8',
  )

const legalFiles = [
  'app/poveritelnost/page.tsx',
  'app/usloviya/page.tsx',
  'components/legal/legal-page.tsx',
  'components/site-footer.tsx',
  'lib/legal.ts',
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
  })

  it('keep the anchors other pages link to', () => {
    const privacy = read('app/poveritelnost/page.tsx')
    for (const id of ['koy-sam-az', 'danni-ot-google', 'proektite']) {
      expect(privacy).toMatch(new RegExp(`id(: |=)['"]${id}['"]`))
    }
  })

  it('formats the effective date in Bulgarian', () => {
    expect(formatLegalDate('2026-11-06')).toBe('6 ноември 2026 г.')
  })
})
