import { describe, expect, it } from 'vitest'

import { movedRedirects } from '../next.config'
import { akauntOrigin, akauntProjects } from '@/lib/akaunt'
import { returnTo } from '@/lib/vhod'

// The real projects marked with `akaunt`, not fixtures: what production does
// once a project's cutover marks it.

const HUB = 'https://onovaza.com'

// Where each project lived before onovaza.com (#29), by its subdomain.
const OLD_HOSTS: Record<string, string[]> = {
  smetkata: [
    'onova-za-smetkata.com',
    'www.onova-za-smetkata.com',
    'onova-za-smetkata.vercel.app',
  ],
  klientite: ['onova-za-klientite.vercel.app'],
  kuhnyata: ['armyant.app', 'www.armyant.app', 'chef-black.vercel.app'],
  kafeto: ['dial-in-three.vercel.app'],
}

describe('marked projects', () => {
  it('get Вход back to their subdomain, named', () => {
    for (const p of akauntProjects) {
      const url = `${akauntOrigin(p)}/s/abc?t=1#x`
      const back = returnTo(url, HUB, akauntProjects)
      expect(back.href, p.slug).toBe(url)
      expect(back.project?.slug, p.slug).toBe(p.slug)
    }
  })

  it('move their old hosts to the subdomain, path and query kept', () => {
    for (const p of akauntProjects) {
      for (const host of OLD_HOSTS[p.akaunt.subdomain] ?? []) {
        const back = returnTo(`https://${host}/a/b?c=1`, HUB, akauntProjects)
        expect(back.href, host).toBe(`${akauntOrigin(p)}/a/b?c=1`)
        expect(back.project?.slug, host).toBe(p.slug)
      }
    }
  })

  it('live where their project page links', () => {
    for (const p of akauntProjects) {
      expect(p.links.live, p.slug).toBe(akauntOrigin(p))
    }
  })

  it('and only they get an onovaza.com/<name> redirect', () => {
    const expected = akauntProjects.flatMap((p) => {
      const name = p.akaunt.subdomain
      return [
        {
          source: `/${name}`,
          destination: akauntOrigin(p),
          permanent: true,
        },
        {
          source: `/${name}/:path*`,
          destination: `${akauntOrigin(p)}/:path*`,
          permanent: true,
        },
      ]
    })
    const bySource = (a: { source: string }, b: { source: string }) =>
      a.source.localeCompare(b.source)
    expect([...movedRedirects].sort(bySource)).toEqual(expected.sort(bySource))
  })
})
