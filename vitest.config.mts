import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vitest/config'

const stub = (file: string) =>
  fileURLToPath(new URL(`./tests/stubs/${file}`, import.meta.url))

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
  resolve: {
    alias: [
      {
        find: '@',
        replacement: fileURLToPath(new URL('./src', import.meta.url)),
      },
      { find: 'server-only', replacement: stub('empty.ts') },
      // Vite turns images into URL strings; Next turns them into objects.
      { find: /^.+\.(png|jpe?g|webp|avif)$/, replacement: stub('image.ts') },
    ],
  },
})
