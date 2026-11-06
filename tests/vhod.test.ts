import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { registry } from '@/content/registry'
import { akauntProjects } from '@/lib/akaunt'
import { projectSchema, type ProjectInput } from '@/lib/project-schema'
import { returnTo } from '@/lib/vhod'

const base = registry[0]

const project = (slug: string, akaunt?: ProjectInput['akaunt']) =>
  projectSchema.parse({ ...base, slug, related: undefined, akaunt })

// Marked fixtures, since no real project uses the Акаунт yet. Кафето is left
// unmarked to show that an old host only maps once its project is marked.
const smetkata = project('smetkata', { subdomain: 'smetkata' })
const kuhnyata = project('kuhnyata', { subdomain: 'kuhnyata' })
const klientite = project('klientite')
const among = [smetkata, kuhnyata, klientite]

const HERE = 'https://onovaza.com'
const PREVIEW = 'https://onova-za-git-x-haygrouve.vercel.app'

const to = (raw: string | null, here = HERE) => returnTo(raw, here, among)
const href = (raw: string | null, here = HERE) => to(raw, here).href

describe('returnTo', () => {
  it('falls back to /akaunt with nowhere to return', () => {
    for (const raw of [null, '']) {
      expect(to(raw)).toEqual({ href: '/akaunt', fallback: true })
    }
  })

  it('returns to a path on this host, query and hash kept', () => {
    expect(href('/proekti')).toBe('/proekti')
    expect(href('/proekti/chef?x=1#top')).toBe('/proekti/chef?x=1#top')
    expect(href('/', PREVIEW)).toBe('/')
    expect(to('/proekti')).toEqual({ href: '/proekti', fallback: false })
    expect(to('/akaunt').fallback).toBe(true)
  })

  it('returns to an absolute URL on this host as a path', () => {
    expect(href(`${PREVIEW}/za-men?a=b`, PREVIEW)).toBe('/za-men?a=b')
    expect(href('http://127.0.0.1:3200/proekti', 'http://127.0.0.1:3200')).toBe(
      '/proekti',
    )
  })

  it('never returns to Вход itself', () => {
    for (const raw of ['/vhod', '/vhod?redirect_url=/x', '/vhod/x']) {
      expect(href(raw), raw).toBe('/akaunt')
    }
    expect(href('https://onovaza.com/vhod', PREVIEW)).toBe('/akaunt')
    expect(href('/vhodnik')).toBe('/vhodnik')
  })

  it('returns to the hub from any host', () => {
    expect(href('https://onovaza.com/proekti', PREVIEW)).toBe(
      'https://onovaza.com/proekti',
    )
    expect(to('https://onovaza.com/', PREVIEW).project).toBeUndefined()
  })

  it('returns to a marked project and names it', () => {
    const back = to('https://smetkata.onovaza.com/s/abc?t=1#x')
    expect(back.href).toBe('https://smetkata.onovaza.com/s/abc?t=1#x')
    expect(back.project?.slug).toBe('smetkata')
    expect(back.fallback).toBe(false)
    expect(to('https://kuhnyata.onovaza.com/', PREVIEW).project?.slug).toBe(
      'kuhnyata',
    )
  })

  it('falls back for subdomains of unmarked projects', () => {
    expect(href('https://klientite.onovaza.com/')).toBe('/akaunt')
    expect(href('https://kafeto.onovaza.com/')).toBe('/akaunt')
    expect(href('https://www.onovaza.com/')).toBe('/akaunt')
  })

  it('moves old hosts to their new subdomain, path and query kept', () => {
    const cases = {
      'https://armyant.app/recipes/1?x=1':
        'https://kuhnyata.onovaza.com/recipes/1?x=1',
      'https://www.armyant.app/': 'https://kuhnyata.onovaza.com/',
      'https://chef-black.vercel.app/me': 'https://kuhnyata.onovaza.com/me',
      'https://onova-za-smetkata.com/bills/1/join?t=abc':
        'https://smetkata.onovaza.com/bills/1/join?t=abc',
      'https://www.onova-za-smetkata.com/#top':
        'https://smetkata.onovaza.com/#top',
      'https://onova-za-smetkata.vercel.app/x':
        'https://smetkata.onovaza.com/x',
      'https://ARMYANT.app/': 'https://kuhnyata.onovaza.com/',
    }
    for (const [raw, moved] of Object.entries(cases)) {
      expect(href(raw), raw).toBe(moved)
    }
    expect(to('https://armyant.app/').project?.slug).toBe('kuhnyata')
  })

  it('falls back for old hosts whose project is not marked yet', () => {
    expect(href('https://onova-za-klientite.vercel.app/')).toBe('/akaunt')
    expect(href('https://dial-in-three.vercel.app/')).toBe('/akaunt')
    // Nothing is marked in real data yet, so every old host falls back.
    expect(returnTo('https://armyant.app/', HERE, akauntProjects).href).toBe(
      '/akaunt',
    )
  })

  it('falls back for old hosts over http, on another port or with credentials', () => {
    for (const raw of [
      'http://armyant.app/',
      'https://armyant.app:8443/',
      'https://user:pass@armyant.app/',
      'https://evil.armyant.app/',
      'https://armyant.app.evil.com/',
      'https://constructor.vercel.app/',
      'https://__proto__/',
    ]) {
      expect(href(raw), raw).toBe('/akaunt')
    }
  })

  it('falls back for foreign origins and look-alikes', () => {
    for (const raw of [
      'https://evil.com/',
      'https://evil.com/?r=https://onovaza.com',
      'https://onovaza.com.evil.com/',
      'https://evilonovaza.com/',
      'https://onovaza.com@evil.com/',
      'https://user:pass@onovaza.com/',
      'http://onovaza.com/',
      'https://onovaza.com:8443/',
      'https://smetkata.onovaza.com.evil.com/',
      'https://evil.smetkata.onovaza.com/',
      'http://smetkata.onovaza.com/',
      `${PREVIEW}/`,
    ]) {
      expect(href(raw), raw).toBe('/akaunt')
    }
  })

  it('falls back for protocol relative paths and other schemes', () => {
    for (const raw of [
      '//evil.com',
      '//evil.com/proekti',
      '/\\evil.com',
      '/\t/evil.com',
      '/\n/evil.com',
      '/.//evil.com',
      '/..//evil.com',
      '/x/..//evil.com',
      '/%2e//evil.com',
      'https://onovaza.com//evil.com',
      'https://onovaza.com/.//evil.com',
      '\t//evil.com',
      ' https://evil.com',
      'javascript:alert(1)',
      'javascript://onovaza.com/%0aalert(1)',
      'data:text/html,hi',
      'evil.com',
      'proekti',
      'not a url',
    ]) {
      expect(href(raw), JSON.stringify(raw)).toBe('/akaunt')
    }
  })
})

describe('Вход copy', () => {
  it('has no em or en dashes', () => {
    for (const file of [
      'components/vhod/vhod-form.tsx',
      'app/(akaunt)/vhod/page.tsx',
      'lib/vhod.ts',
    ]) {
      const text = readFileSync(
        fileURLToPath(new URL(`../src/${file}`, import.meta.url)),
        'utf8',
      )
      expect(text, file).not.toMatch(/[–—]/)
    }
  })
})
