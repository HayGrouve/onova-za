import AxeBuilder from '@axe-core/playwright'
import { clerk, clerkSetup } from '@clerk/testing/playwright'
import { expect, test, type Page } from '@playwright/test'

import {
  createUser,
  deleteUser,
  getUser,
  primaryEmail,
  testEmail,
  TEST_CODE,
  type ClerkUser,
} from './clerk-users'

// /akaunt against the Clerk dev instance. Each test gets its own test user,
// signed in with a sign-in token (no /vhod UI), and deleted afterwards.
test.skip(!process.env.CLERK_SECRET_KEY, 'needs CLERK_SECRET_KEY')

test.beforeAll(async () => {
  // The setup project's token lives in its own worker; fetch one here when
  // this worker has none.
  if (!process.env.CLERK_TESTING_TOKEN) await clerkSetup({ dotenv: false })
})

// A sensitive action may first ask "Потвърди, че си ти" (Clerk's
// reverification, when the last Вход is too old). Answer it with the test
// code if it shows, then wait for `until`.
async function passReverification(page: Page, until: () => Promise<unknown>) {
  const dialog = page.getByRole('dialog', { name: 'Потвърди, че си ти' })
  const asked = dialog.waitFor().then(
    () => true,
    () => false,
  )
  const outcome = await Promise.race([until().then(() => false), asked])
  if (!outcome) return
  test.info().annotations.push({ type: 'reverification', description: 'asked' })
  await dialog.getByLabel('Код от имейла').fill(TEST_CODE)
  await dialog.getByRole('button', { name: 'Потвърди' }).click()
  await expect(dialog).toBeHidden()
  await until()
}

test('signed out, /akaunt sends you to Вход and back', async ({ page }) => {
  await page.goto('/akaunt')
  await expect(page).toHaveURL(/\/vhod\?redirect_url=%2Fakaunt$/)
})

test.describe('signed in', () => {
  let user: ClerkUser

  test.beforeEach(async ({ page }, testInfo) => {
    user = await createUser(testInfo.project.name)
    // Any page under the Clerk layout loads clerk-js; /vhod is one.
    await page.goto('/vhod')
    await clerk.signIn({ page, emailAddress: primaryEmail(user) })
    await page.goto('/akaunt')
    await expect(page.getByRole('tab', { name: 'Профил' })).toBeVisible()
  })

  test.afterEach(async () => {
    if (user) await deleteUser(user.id)
  })

  test('changes the name', async ({ page }) => {
    await expect(page.getByTestId('akaunt-name')).toHaveText('Тест Тестов')
    await page.getByRole('button', { name: 'Промени името' }).click()
    await page.getByLabel('Име', { exact: true }).fill('Мария Петрова')
    await page.getByRole('button', { name: 'Запази' }).click()
    await expect(page.getByTestId('akaunt-name')).toHaveText('Мария Петрова')

    await expect
      .poll(async () => {
        const saved = await getUser(user.id)
        return [saved?.first_name, saved?.last_name]
      })
      .toEqual(['Мария', 'Петрова'])
  })

  test('adds and removes an email', async ({ page }) => {
    const extra = testEmail('extra')
    await page.getByRole('tab', { name: 'Вход' }).click()
    await expect(page).toHaveURL(/#vhod$/)

    await page.getByRole('button', { name: 'Добави имейл' }).click()
    await page.getByLabel('Нов имейл').fill(extra)
    await page.getByRole('button', { name: 'Прати код' }).click()
    const code = page.locator('#add-email-code')
    await passReverification(page, () => code.waitFor())
    await code.fill(TEST_CODE)
    await page.getByRole('button', { name: 'Потвърди' }).click()
    await expect(page.getByText(`Добавихме ${extra}.`)).toBeVisible()

    const emails = async () =>
      (await getUser(user.id))?.email_addresses.map((e) => e.email_address)
    await expect.poll(emails).toContain(extra)

    await page.getByRole('button', { name: `Махни ${extra}` }).click()
    await passReverification(page, () =>
      page.getByText(`Махнахме ${extra}.`).waitFor(),
    )
    await expect(
      page.getByRole('listitem').filter({ hasText: extra }),
    ).toHaveCount(0)
    await expect.poll(emails).not.toContain(extra)
  })

  test('Изход signs you out and lands on the home page', async ({ page }) => {
    await page.getByRole('button', { name: 'Изход' }).click()
    await expect(page).toHaveURL(/\/$/)
    await expect(page.locator('h1')).toBeVisible()

    await page.goto('/akaunt')
    await expect(page).toHaveURL(/\/vhod\?redirect_url=%2Fakaunt$/)
  })

  test('Изтрий Акаунта needs ИЗТРИЙ and deletes the user', async ({ page }) => {
    await page.getByRole('tab', { name: 'Изтриване' }).click()
    const button = page.getByRole('button', { name: 'Изтрий Акаунта завинаги' })
    await expect(button).toBeDisabled()

    const confirm = page.getByLabel('Напиши ИЗТРИЙ, за да потвърдиш')
    await confirm.fill('изтри')
    await expect(button).toBeDisabled()
    // Any case counts: phones capitalise the first letter on their own.
    await confirm.fill('изтрий')
    await expect(button).toBeEnabled()

    await button.click()
    await passReverification(page, () => page.waitForURL(/\/$/))
    await expect.poll(() => getUser(user.id)).toBeNull()
  })

  // A fresh test session never needs reverification, so Clerk's answer is
  // forced for the first two deletes: the dialog then talks to the real
  // Frontend API (start, send the code, check it) before the retry.
  test('a sensitive action asks for a fresh code first', async ({ page }) => {
    let forced = 0
    await page.route(/\/v1\/me(\?|$)/, (route) => {
      // clerk-js sends DELETE as POST with `_method=DELETE`.
      const request = route.request()
      const method =
        new URL(request.url()).searchParams.get('_method') ?? request.method()
      if (method !== 'DELETE' || forced >= 2) {
        return route.fallback()
      }
      forced++
      return route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({
          errors: [
            {
              code: 'session_reverification_required',
              message: 'You need to provide additional verification.',
              long_message: 'You need to provide additional verification.',
            },
          ],
        }),
      })
    })

    await page.getByRole('tab', { name: 'Изтриване' }).click()
    await page.getByLabel('Напиши ИЗТРИЙ, за да потвърдиш').fill('ИЗТРИЙ')
    const button = page.getByRole('button', { name: 'Изтрий Акаунта завинаги' })
    const dialog = page.getByRole('dialog', { name: 'Потвърди, че си ти' })

    // Откажи leaves everything as it was, with no error.
    await button.click()
    await expect(dialog).toContainText('Пратихме го на')
    await dialog.getByRole('button', { name: 'Откажи' }).click()
    await expect(dialog).toBeHidden()
    await expect(page.getByRole('main').getByRole('alert')).toHaveCount(0)
    await expect(button).toBeEnabled()
    expect(await getUser(user.id)).not.toBeNull()

    // A wrong code says so in Bulgarian; the right one retries the delete.
    await button.click()
    await dialog.getByLabel('Код от имейла').fill('000000')
    await dialog.getByRole('button', { name: 'Потвърди' }).click()
    await expect(dialog.getByRole('alert')).toHaveText(
      'Кодът не е верен. Провери го и опитай пак.',
    )
    await dialog.getByLabel('Код от имейла').fill(TEST_CODE)
    await dialog.getByRole('button', { name: 'Потвърди' }).click()
    await page.waitForURL(/\/$/)
    expect(forced).toBe(2)
    await expect.poll(() => getUser(user.id)).toBeNull()
  })

  test('every tab passes axe, light and dark', async ({ page }) => {
    for (const colorScheme of ['light', 'dark'] as const) {
      await page.emulateMedia({ colorScheme })
      for (const name of ['Профил', 'Вход', 'Проекти', 'Изтриване']) {
        await page.getByRole('tab', { name }).click()
        await expect(
          page.getByRole('heading', { level: 2, name }),
        ).toBeVisible()
        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
          .analyze()
        expect(
          results.violations.map(
            (v) => `${colorScheme} ${name} ${v.id}: ${v.help}`,
          ),
        ).toEqual([])
      }
    }
  })

  test('Проекти lists the marked projects, or says there are none', async ({
    page,
  }) => {
    await page.getByRole('tab', { name: 'Проекти' }).click()
    const panel = page.getByRole('tabpanel')
    const links = panel.getByRole('link', { name: /^Отвори онова за / })
    if ((await links.count()) === 0) {
      await expect(
        panel.getByText('Още нито един проект не ползва Акаунта.'),
      ).toBeVisible()
      return
    }
    for (const href of await links.evaluateAll((as) =>
      as.map((a) => a.getAttribute('href')),
    )) {
      expect(href).toMatch(/^https:\/\/[a-z0-9-]+\.onovaza\.com$/)
    }
  })
})
