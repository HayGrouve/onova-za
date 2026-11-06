import { defineConfig, devices } from '@playwright/test'

const port = Number(process.env.PORT ?? 3200)

// Local runs read the Clerk keys from .env.local, as `next build` does. CI
// passes them as env instead; without them the Clerk specs skip.
try {
  process.loadEnvFile('.env.local')
} catch {
  // No .env.local: keyless, like CI on a fork.
}

// Specs that sign in on the Clerk dev instance. They run once, on desktop,
// after the setup project has fetched a testing token.
const clerkSpecs = /\.clerk\.spec\.ts$/

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: `http://127.0.0.1:${port}` },
  projects: [
    { name: 'clerk setup', testMatch: /clerk\.setup\.ts$/ },
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: clerkSpecs,
    },
    {
      name: 'mobile',
      use: { ...devices['Pixel 7'] },
      testIgnore: clerkSpecs,
    },
    {
      name: 'clerk',
      use: { ...devices['Desktop Chrome'] },
      testMatch: clerkSpecs,
      dependencies: ['clerk setup'],
    },
  ],
  webServer: {
    command: `pnpm start -p ${port}`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: !process.env.CI,
  },
})
