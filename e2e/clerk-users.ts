// Test users on the Clerk dev instance, through the Backend API. Emails with
// `+clerk_test` never get mail, and their code is always 424242.
export const TEST_CODE = '424242'

const API = 'https://api.clerk.com/v1'

export type ClerkUser = {
  id: string
  first_name: string | null
  last_name: string | null
  primary_email_address_id: string | null
  email_addresses: { id: string; email_address: string }[]
}

async function api(path: string, init: RequestInit = {}) {
  const key = process.env.CLERK_SECRET_KEY
  if (!key) throw new Error('CLERK_SECRET_KEY is not set')
  return fetch(`${API}${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${key}`,
      'content-type': 'application/json',
      ...init.headers,
    },
  })
}

export const testEmail = (tag: string) =>
  `akaunt-${tag}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}+clerk_test@example.com`

export async function createUser(tag: string): Promise<ClerkUser> {
  const response = await api('/users', {
    method: 'POST',
    body: JSON.stringify({
      email_address: [testEmail(tag)],
      first_name: 'Тест',
      last_name: 'Тестов',
    }),
  })
  if (!response.ok) {
    throw new Error(`create user: ${response.status} ${await response.text()}`)
  }
  return (await response.json()) as ClerkUser
}

// The user, or null once it is gone.
export async function getUser(id: string): Promise<ClerkUser | null> {
  const response = await api(`/users/${id}`)
  if (response.status === 404) return null
  if (!response.ok) {
    throw new Error(`get user: ${response.status} ${await response.text()}`)
  }
  return (await response.json()) as ClerkUser
}

export async function deleteUser(id: string) {
  const response = await api(`/users/${id}`, { method: 'DELETE' })
  if (!response.ok && response.status !== 404) {
    throw new Error(`delete user: ${response.status} ${await response.text()}`)
  }
}

export const primaryEmail = (user: ClerkUser) =>
  user.email_addresses.find((e) => e.id === user.primary_email_address_id)
    ?.email_address ?? ''
