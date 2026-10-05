import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

const pages = [
  '/',
  '/proekti',
  '/proekti/onova-za-smetkata',
  '/proekti/iliaora',
  '/za-men',
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

test('every project on the home page links to its own page', async ({
  page,
}) => {
  await page.goto('/')
  const links = page.locator('main a[href^="/proekti/"]')
  expect(await links.count()).toBeGreaterThanOrEqual(11)

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

test.describe('нърд режим', () => {
  const how = (page: Page) =>
    page.getByRole('heading', { name: 'Как е направено' })
  const toggle = (page: Page) =>
    page.getByRole('switch', { name: 'Нърд режим' })

  test('is off by default and hides the tech details', async ({ page }) => {
    await page.goto('/proekti/onova-za-smetkata')
    await expect(toggle(page)).not.toBeChecked()
    await expect(how(page)).toBeHidden()
    await expect(
      page.getByRole('link', { name: 'Кодът в GitHub' }),
    ).toBeHidden()
  })

  test('turns on from the header and survives a reload', async ({ page }) => {
    await page.goto('/proekti/onova-za-smetkata')
    await toggle(page).click()
    await expect(how(page)).toBeVisible()
    await expect(
      page.getByRole('link', { name: 'Кодът в GitHub' }),
    ).toBeVisible()

    await page.reload()
    await expect(toggle(page)).toBeChecked()
    await expect(how(page)).toBeVisible()

    await toggle(page).click()
    await expect(how(page)).toBeHidden()
  })

  test('turns on from a link with ?nerd=1', async ({ page }) => {
    await page.goto('/za-men?nerd=1')
    await expect(page.getByRole('heading', { name: 'Работа' })).toBeVisible()
    await page.goto('/za-men')
    await expect(page.getByRole('heading', { name: 'Работа' })).toBeVisible()
  })

  test('passes axe with the details shown', async ({ page }) => {
    await page.goto('/proekti/iliaora?nerd=1')
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze()
    expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([])
  })
})
