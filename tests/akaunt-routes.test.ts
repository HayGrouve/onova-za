import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import sitemap from '@/app/sitemap'
import { paths } from '@/lib/paths'
import { pageMeta } from '@/lib/seo'

const read = (path: string) =>
  readFileSync(
    fileURLToPath(new URL(`../src/${path}`, import.meta.url)),
    'utf8',
  )

const pages = {
  [paths.vhod()]: 'app/(akaunt)/vhod/page.tsx',
  [paths.akaunt()]: 'app/(akaunt)/akaunt/page.tsx',
}

describe('/vhod and /akaunt', () => {
  it('stay out of the sitemap', () => {
    const urls = sitemap().map((entry) => new URL(entry.url).pathname)
    for (const path of Object.keys(pages)) {
      expect(urls, path).not.toContain(path)
    }
  })

  it('ask pageMeta for noindex', () => {
    // The rendered robots meta is checked in e2e/smoke.spec.ts.
    for (const [path, file] of Object.entries(pages)) {
      expect(read(file), path).toMatch(/noindex: true/)
    }
    expect(
      pageMeta({ path: '/x', title: 'x', description: 'x', noindex: true })
        .robots,
    ).toEqual({ index: false, follow: true })
  })

  it('keep em and en dashes out of the copy', () => {
    const panel = readdirSync(
      fileURLToPath(new URL('../src/components/akaunt', import.meta.url)),
    ).map((name) => `components/akaunt/${name}`)
    for (const file of [
      ...Object.values(pages),
      'app/(akaunt)/layout.tsx',
      ...panel,
    ]) {
      expect(read(file), file).not.toMatch(/[–—]/)
    }
  })
})
