import { spawnSync } from 'node:child_process'

// Same gate locally and in CI: formatting, lint, types, dead code, unit
// tests, then a production build (which also validates every project).
const steps = ['check', 'lint', 'typecheck', 'knip', 'test', 'build']

for (const step of steps) {
  const result = spawnSync('pnpm', ['run', step], {
    stdio: 'inherit',
    env: process.env,
    shell: process.platform === 'win32',
  })
  if (result.status !== 0) process.exit(result.status ?? 1)
}
