import { expect, test } from '@playwright/test'

import { movedRedirects } from '../next.config'

// Every onovaza.com/<name> redirect answers 308 and keeps the path and query
// (#29). The list comes from next.config.ts, so each project's cutover only
// adds its name there.
for (const { source, destination } of movedRedirects) {
  test(`${source} answers 308 to ${destination}`, async ({ request }) => {
    const path = source.replace('/:path*', '/a/b')
    const response = await request.get(`${path}?c=1&d=2`, { maxRedirects: 0 })
    expect(response.status()).toBe(308)
    // Compared as URLs: a bare origin comes back with its trailing slash.
    expect(new URL(response.headers().location).href).toBe(
      new URL(`${destination.replace('/:path*', '/a/b')}?c=1&d=2`).href,
    )
  })
}
