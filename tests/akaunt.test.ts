import { describe, expect, it } from 'vitest'

import { isSignedIn } from '@/lib/akaunt'
import { paths } from '@/lib/paths'

describe('isSignedIn', () => {
  it('is false when the cookie is missing', () => {
    expect(isSignedIn('')).toBe(false)
    expect(isSignedIn('theme=dark; _ga=GA1.1.2')).toBe(false)
  })

  it('is false when __client_uat is zero', () => {
    expect(isSignedIn('__client_uat=0')).toBe(false)
    expect(isSignedIn('theme=dark; __client_uat=0; _ga=1')).toBe(false)
    expect(isSignedIn('__client_uat=0; __client_uat_Xy12ab=0')).toBe(false)
  })

  it('is true when __client_uat is non-zero', () => {
    expect(isSignedIn('__client_uat=1700000000')).toBe(true)
    expect(isSignedIn('theme=dark;__client_uat=1700000000 ; _ga=1')).toBe(true)
  })

  it('reads the suffixed copy newer Clerk SDKs write', () => {
    expect(isSignedIn('__client_uat_Xy12ab=1700000000')).toBe(true)
    expect(isSignedIn('__client_uat=0; __client_uat_Xy12ab=1700000000')).toBe(
      true,
    )
  })

  it('ignores empty or malformed values and look-alike names', () => {
    expect(isSignedIn('__client_uat=')).toBe(false)
    expect(isSignedIn('__client_uat')).toBe(false)
    expect(isSignedIn('__client_uat=abc')).toBe(false)
    expect(isSignedIn('x__client_uat=1700000000')).toBe(false)
    expect(isSignedIn('theme=__client_uat=1700000000')).toBe(false)
  })
})

describe('paths.vhod', () => {
  it('encodes the page to return to, query included', () => {
    expect(paths.vhod('/proekti/chef?utm_source=x&a=б')).toBe(
      '/vhod?redirect_url=%2Fproekti%2Fchef%3Futm_source%3Dx%26a%3D%D0%B1',
    )
  })
})
