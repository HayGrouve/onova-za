import { clerkSetup } from '@clerk/testing/playwright'
import { test as setup } from '@playwright/test'

// Fetches a Clerk testing token once, so the Clerk specs get past bot
// protection on the dev instance. Without the secret key they all skip.
setup('fetch a Clerk testing token', async () => {
  setup.skip(!process.env.CLERK_SECRET_KEY, 'CLERK_SECRET_KEY is not set')
  await clerkSetup({ dotenv: false })
})
