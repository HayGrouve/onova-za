import { expect, test } from '@playwright/test'

import { movedRedirects, renamedRedirects } from '../next.config'

// Every redirect in next.config.ts answers 308 and keeps the path and query:
// onovaza.com/<name> for projects that moved to their subdomain (#29), and
// the old slugs of renamed project pages. Both lists come from
// next.config.ts, so a cutover or a rename only adds an entry there.
for (const { source, destination } of [
  ...movedRedirects,
  ...renamedRedirects,
]) {
  test(`${source} answers 308 to ${destination}`, async ({
    request,
    baseURL,
  }) => {
    const path = source.replace('/:path*', '/a/b')
    const response = await request.get(`${path}?c=1&d=2`, { maxRedirects: 0 })
    expect(response.status()).toBe(308)
    // Compared as URLs: a bare origin comes back with its trailing slash, and
    // a page on this site comes back as a path.
    expect(new URL(response.headers().location, baseURL).href).toBe(
      new URL(`${destination.replace('/:path*', '/a/b')}?c=1&d=2`, baseURL)
        .href,
    )
  })
}

// The old address of a renamed project page ends on the new page.
for (const { source } of renamedRedirects.filter(
  (r) => !r.source.includes(':'),
)) {
  test(`${source} ends on its project page`, async ({ page }) => {
    const response = await page.goto(source)
    expect(response?.status()).toBe(200)
    await expect(page.locator('h1')).toHaveCount(1)
  })
}
