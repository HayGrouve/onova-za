import AxeBuilder from '@axe-core/playwright'
import {
  clerk,
  clerkSetup,
  setupClerkTestingToken,
} from '@clerk/testing/playwright'
import { expect, test, type Page } from '@playwright/test'

// Вход against the Clerk dev instance. `+clerk_test` emails get no real
// mail and always take the code 424242. Every user made here is deleted.

const secretKey = process.env.CLERK_SECRET_KEY
const CODE = '424242'

test.skip(!secretKey, 'CLERK_SECRET_KEY is not set')

const created = new Set<string>()

const newEmail = () =>
  `vhod-${Date.now()}-${Math.random().toString(36).slice(2, 8)}+clerk_test@example.com`

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`https://api.clerk.com/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    },
  })
  if (!response.ok) {
    throw new Error(`${init.method ?? 'GET'} ${path}: ${response.status}`)
  }
  return (await response.json()) as T
}

const usersWith = (email: string) =>
  api<{ id: string }[]>(`/users?email_address=${encodeURIComponent(email)}`)

async function createUser(email: string) {
  created.add(email)
  await api('/users', {
    method: 'POST',
    body: JSON.stringify({ email_address: [email] }),
  })
}

test.beforeAll(async () => {
  // The setup project's token lives in its own worker; fetch one here when
  // this worker has none.
  if (!process.env.CLERK_TESTING_TOKEN) await clerkSetup({ dotenv: false })
})

test.beforeEach(async ({ page }) => {
  await setupClerkTestingToken({ page })
})

test.afterAll(async () => {
  for (const email of created) {
    for (const user of await usersWith(email)) {
      await api(`/users/${user.id}`, { method: 'DELETE' })
    }
  }
})

async function open(page: Page, path: string) {
  await page.goto(path)
  await clerk.loaded({ page })
}

async function sendCode(page: Page, email: string) {
  await page.getByLabel('Имейл').fill(email)
  await page.getByRole('button', { name: 'Изпрати ми код' }).click()
  await expect(page.getByLabel('Код')).toBeFocused()
}

async function enterCode(page: Page, code: string) {
  await page.getByLabel('Код').fill(code)
  await page.getByRole('button', { name: 'Влез' }).click()
}

test('a new email creates an Акаунт and lands on /akaunt', async ({ page }) => {
  const email = newEmail()
  created.add(email)
  expect(await usersWith(email)).toHaveLength(0)

  await open(page, '/vhod')
  await expect(
    page.locator('main').getByText('онова за', { exact: true }),
  ).toBeVisible()
  await sendCode(page, email)
  await expect(page.getByText(email)).toBeVisible()
  await expect(page.getByText(/Писмото е на английски/)).toBeVisible()
  await enterCode(page, CODE)

  await expect(page).toHaveURL(/\/akaunt$/)
  expect(await usersWith(email)).toHaveLength(1)
})

test('an existing email signs in and returns to redirect_url', async ({
  page,
}) => {
  const email = newEmail()
  await createUser(email)

  await open(page, '/vhod?redirect_url=%2Fproekti%3Fx%3D1')
  await sendCode(page, email)
  await enterCode(page, CODE)

  await expect(page).toHaveURL(/\/proekti\?x=1$/)
  expect(await usersWith(email)).toHaveLength(1)

  // Signed in already: Вход sends you straight on, no form.
  await page.goto('/vhod?redirect_url=%2Fza-men')
  await expect(page).toHaveURL(/\/za-men$/)
})

test('a wrong code shows an error and keeps you on Вход', async ({ page }) => {
  const email = newEmail()
  await createUser(email)

  await open(page, '/vhod')
  await sendCode(page, email)

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze()
  expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([])

  await enterCode(page, '000000')
  await expect(page.locator('main').getByRole('alert')).toHaveText(
    /Кодът не е верен/,
  )
  await expect(page.getByLabel('Код')).toHaveAttribute('aria-invalid', 'true')
  await expect(page).toHaveURL(/\/vhod$/)

  // The right code still works afterwards.
  await enterCode(page, CODE)
  await expect(page).toHaveURL(/\/akaunt$/)
})

test('a redirect_url to a foreign origin falls back to /akaunt', async ({
  page,
}) => {
  const email = newEmail()
  await createUser(email)

  await open(
    page,
    `/vhod?redirect_url=${encodeURIComponent('https://evil.example/x')}`,
  )
  await expect(
    page.locator('main').getByText('онова за', { exact: true }),
  ).toBeVisible()
  await sendCode(page, email)
  await enterCode(page, CODE)

  await expect(page).toHaveURL(/127\.0\.0\.1:\d+\/akaunt$/)
})

test('Друг имейл goes back to the email field', async ({ page }) => {
  const email = newEmail()
  created.add(email)

  await open(page, '/vhod')
  await sendCode(page, email)
  await page.getByRole('button', { name: 'Друг имейл' }).click()
  await expect(page.getByLabel('Имейл')).toHaveValue(email)
  await expect(
    page.getByRole('button', { name: 'Изпрати ми код' }),
  ).toBeVisible()
})
