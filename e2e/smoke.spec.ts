import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page, type Response } from '@playwright/test'

const pages = [
  '/',
  '/proekti',
  '/proekti/onova-za-smetkata',
  '/proekti/chef',
  '/za-men',
  '/poveritelnost',
  '/usloviya',
]

async function jsonLd(page: Page) {
  const blocks = await page
    .locator('script[type="application/ld+json"]')
    .allTextContents()
  return blocks.map((text) => JSON.parse(text) as Record<string, unknown>)
}

for (const path of pages) {
  test.describe(path, () => {
    test('has one h1, a canonical, an OG image and valid JSON-LD', async ({
      page,
    }) => {
      const response = await page.goto(path)
      expect(response?.status()).toBe(200)

      await expect(page.locator('h1')).toHaveCount(1)
      await expect(page.locator('html')).toHaveAttribute('lang', 'bg')

      const canonical = await page
        .locator('link[rel="canonical"]')
        .getAttribute('href')
      // The home canonical is the bare origin; the others end in their path.
      expect(canonical).toMatch(
        path === '/' ? /^https:\/\/[^/]+\/?$/ : new RegExp(`${path}$`),
      )
      await expect(
        page.locator('meta[property="og:image"]').first(),
      ).toHaveAttribute('content', /opengraph-image/)

      const graphs = await jsonLd(page)
      expect(graphs.length).toBeGreaterThan(0)
    })

    test('passes axe (WCAG 2.2 AA)', async ({ page }) => {
      await page.goto(path)
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze()
      expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([])
    })
  })
}

// Вход and the Акаунт: the only routes that load Clerk, never indexed.
for (const path of ['/vhod', '/akaunt']) {
  test.describe(path, () => {
    test('answers with one h1 and a noindex robots meta', async ({ page }) => {
      const response = await page.goto(path)
      expect(response?.status()).toBe(200)
      await expect(page.locator('h1')).toHaveCount(1)
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
        'content',
        /noindex/,
      )
    })

    test('passes axe (WCAG 2.2 AA)', async ({ page }) => {
      // With a Clerk key, signed-out /akaunt moves on to /vhod once Clerk
      // loads; let that settle before axe reads the page.
      await page.goto(path, { waitUntil: 'networkidle' })
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze()
      expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([])
    })
  })
}

test('the public pages are indexable and load no Clerk code', async ({
  page,
}) => {
  for (const path of pages) {
    const scripts: Promise<string>[] = []
    const onResponse = (response: Response) => {
      if (response.request().resourceType() === 'script') {
        scripts.push(
          response.text().then((body) => `${response.url()}\n${body}`),
        )
      }
    }
    page.on('response', onResponse)
    await page.goto(path, { waitUntil: 'networkidle' })
    page.off('response', onResponse)

    await expect(page.locator('meta[name="robots"]')).toHaveCount(0)
    const bodies = await Promise.all(scripts)
    expect(bodies.length, path).toBeGreaterThan(0)
    for (const body of bodies) {
      expect(body, `${path}: ${body.split('\n')[0]}`).not.toMatch(/clerk/i)
    }
  }
})

test('every project on the home page links to its own page', async ({
  page,
}) => {
  await page.goto('/')
  const links = page.locator('main a[href^="/proekti/"]')
  expect(await links.count()).toBeGreaterThanOrEqual(4)

  const first = links.first()
  const href = await first.getAttribute('href')
  await first.click()
  await expect(page).toHaveURL(new RegExp(`${href}$`))
  await expect(page.locator('h1')).toBeVisible()
})

test('unknown pages answer 404 in Bulgarian', async ({ page }) => {
  const response = await page.goto('/proekti/nyama-takav')
  expect(response?.status()).toBe(404)
  await expect(page.locator('h1')).toContainText(/няма|Няма/)
})

test('the skip link moves focus to the main content', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'keyboard only')
  await page.goto('/')
  await page.keyboard.press('Tab')
  const skip = page.getByRole('link', { name: 'Към съдържанието' })
  await expect(skip).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/#main$/)
})

test('the home page footer links both legal pages', async ({ page }) => {
  await page.goto('/')
  const footer = page.locator('footer')
  await expect(
    footer.getByRole('link', { name: 'Поверителност' }),
  ).toHaveAttribute('href', '/poveritelnost')
  await expect(footer.getByRole('link', { name: 'Условия' })).toHaveAttribute(
    'href',
    '/usloviya',
  )
})
