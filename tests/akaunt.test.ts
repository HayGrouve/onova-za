import { describe, expect, it } from 'vitest'

import { registry } from '@/content/registry'
import { akauntProjectAt } from '@/lib/akaunt'
import { projectSchema, type ProjectInput } from '@/lib/project-schema'

const base = registry[0]

const project = (slug: string, akaunt?: ProjectInput['akaunt']) =>
  projectSchema.parse({ ...base, slug, related: undefined, akaunt })

// Fixtures, so these tests hold whichever real projects are marked.
const smetkata = project('smetkata', { subdomain: 'smetkata' })
const kuhnyata = project('kuhnyata', { subdomain: 'kuhnyata' })
const unmarked = project('bez-akaunt')
const among = [smetkata, kuhnyata, unmarked]

const at = (url: string | URL) => akauntProjectAt(url, among)?.slug

describe('akauntProjectAt', () => {
  it('finds the project on its own subdomain', () => {
    expect(at('https://smetkata.onovaza.com')).toBe('smetkata')
    expect(at('https://kuhnyata.onovaza.com/')).toBe('kuhnyata')
    expect(at('https://smetkata.onovaza.com/s/abc?x=1#top')).toBe('smetkata')
    expect(at(new URL('https://smetkata.onovaza.com/s/abc'))).toBe('smetkata')
  })

  it('ignores case in the host and the default https port', () => {
    expect(at('https://SmetKata.OnovaZa.com/')).toBe('smetkata')
    expect(at('https://smetkata.onovaza.com:443/')).toBe('smetkata')
  })

  it('rejects look-alike hosts', () => {
    for (const url of [
      'https://smetkata.onovaza.com.evil.com/',
      'https://evilonovaza.com/',
      'https://smetkataonovaza.com/',
      'https://evil.smetkata.onovaza.com/',
      'https://smetkata.onovaza.co/',
      'https://smetkata.onovaza.com./',
      'https://evil.com/smetkata.onovaza.com',
      'https://evil.com/?r=https://smetkata.onovaza.com',
      'https://smetkata.onovaza.com@evil.com/',
    ]) {
      expect(at(url), url).toBeUndefined()
    }
  })

  it('rejects other schemes, ports and credentials', () => {
    for (const url of [
      'http://smetkata.onovaza.com/',
      'https://smetkata.onovaza.com:8443/',
      'https://user:pass@smetkata.onovaza.com/',
      'wss://smetkata.onovaza.com/',
      'javascript:alert(1)//smetkata.onovaza.com',
    ]) {
      expect(at(url), url).toBeUndefined()
    }
  })

  it('rejects relative and unparsable URLs', () => {
    for (const url of [
      '',
      '/akaunt',
      '//smetkata.onovaza.com/',
      'smetkata.onovaza.com',
      'not a url',
    ]) {
      expect(at(url), url).toBeUndefined()
    }
  })

  it('finds nothing on the hub or for unmarked projects', () => {
    expect(at('https://onovaza.com/')).toBeUndefined()
    expect(at('https://www.onovaza.com/')).toBeUndefined()
    expect(at('https://bez-akaunt.onovaza.com/')).toBeUndefined()
  })
})

describe('akaunt marker in the project schema', () => {
  it('accepts a subdomain', () => {
    expect(smetkata.akaunt).toEqual({ subdomain: 'smetkata' })
  })

  it('rejects a subdomain that is not one lowercase DNS label', () => {
    for (const subdomain of ['Smetkata', 'smetkata.evil', '-smetkata', '']) {
      const input = { ...base, akaunt: { subdomain } }
      expect(projectSchema.safeParse(input).success, subdomain).toBe(false)
    }
  })

  it('rejects the marker on client work', () => {
    const input = {
      ...base,
      owner: 'client',
      client: { name: 'X' },
      akaunt: { subdomain: 'smetkata' },
    }
    expect(projectSchema.safeParse(input).success).toBe(false)
  })
})
