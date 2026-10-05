import { readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { clampChroma, wcagContrast } from 'culori'
import { describe, expect, it } from 'vitest'

import { registry } from '@/content/registry'
import { projectSchema } from '@/lib/project-schema'
import { projects, relatedTo } from '@/lib/projects'
import { projectTitle } from '@/lib/seo'
import sitemap from '@/app/sitemap'

const folder = fileURLToPath(
  new URL('../src/content/projects', import.meta.url),
)

describe('project registry', () => {
  it('registers every project folder, under its own slug', () => {
    const folders = readdirSync(folder, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort()
    expect(registry.map((p) => p.slug).sort()).toEqual(folders)
  })

  it('keeps em and en dashes out of every visible string', () => {
    const text = JSON.stringify(registry)
    expect(text).not.toMatch(/[–—]/)
  })

  it('suggests related projects that exist and are never the project itself', () => {
    for (const p of projects) {
      const related = relatedTo(p)
      expect(related).toHaveLength(3)
      expect(related.map((r) => r.slug)).not.toContain(p.slug)
    }
  })

  it('keeps every page title short enough for a search result', () => {
    const tooLong = projects
      .map((p) => `${projectTitle(p)} | онова за`)
      .filter((title) => title.length > 62)
    expect(tooLong).toEqual([])
  })

  it('lists every project in the sitemap', () => {
    const urls = sitemap().map((entry) => entry.url)
    for (const p of projects) {
      expect(urls.some((u) => u.endsWith(`/proekti/${p.slug}`))).toBe(true)
    }
  })
})

// The same lightness and chroma as globals.css, so every hue stays readable.
const color = (l: number, c: number, h: number) =>
  clampChroma({ mode: 'oklch' as const, l, c, h }, 'oklch')

// Every hue the schema accepts, not only the ones in use today, so a new
// project can pick any allowed hue without a contrast check of its own.
const allowedHues = Array.from({ length: 360 }, (_, h) => h).filter(
  (h) => h < 270 || h > 320,
)

const passes = (h: number) => ({
  fillLight: wcagContrast(color(0.78, 0.12, h), '#101419'),
  fillDark: wcagContrast(color(0.72, 0.105, h), '#0d1013'),
  tintLight: wcagContrast(color(0.5, 0.17, h), '#f5f7f9'),
  tintDark: wcagContrast(color(0.76, 0.14, h), '#0d1013'),
})

describe('project colours', () => {
  it('every allowed hue passes contrast in both themes', () => {
    const failing = allowedHues.filter((h) => {
      const c = passes(h)
      return (
        c.fillLight < 7 ||
        c.fillDark < 7 ||
        c.tintLight < 4.5 ||
        c.tintDark < 4.5
      )
    })
    expect(failing).toEqual([])
  })
})

describe('project schema', () => {
  const valid = registry[0]

  it('accepts a real project', () => {
    expect(projectSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects empty alt text', () => {
    const broken = { ...valid, cover: { ...valid.cover, alt: '' } }
    expect(projectSchema.safeParse(broken).success).toBe(false)
  })

  it('rejects client details on own work', () => {
    const broken = { ...valid, client: { name: 'X' } }
    expect(projectSchema.safeParse(broken).success).toBe(false)
  })

  it('rejects hues in the purple band', () => {
    expect(projectSchema.safeParse({ ...valid, hue: 290 }).success).toBe(false)
  })

  it('rejects a za-phrase with capitals', () => {
    expect(projectSchema.safeParse({ ...valid, za: 'Сметката' }).success).toBe(
      false,
    )
  })
})
