// Scaffold a new project: pnpm new:project <slug> "<за-фраза>"
// Creates src/content/projects/<slug>/index.ts and registers it.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'

const [slug, za = 'нещото'] = process.argv.slice(2)

if (!slug || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
  console.error('Usage: pnpm new:project <slug> "<за-фраза>"')
  console.error('Slug: Latin, lowercase, hyphens (official transliteration).')
  process.exit(1)
}

const dir = `src/content/projects/${slug}`
if (existsSync(dir)) {
  console.error(`${dir} already exists`)
  process.exit(1)
}

const today = new Date().toISOString().slice(0, 10)
const year = today.slice(0, 4)
const ident = slug.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase())

mkdirSync(dir, { recursive: true })
writeFileSync(
  `${dir}/index.ts`,
  `import { defineProject } from '@/lib/project-schema'

// Put a screenshot next to this file (WebP, 1440x900 for a browser shot or
// 780x1688 for a phone shot) and import it here.
import cover from './cover.webp'

export default defineProject({
  slug: '${slug}',
  name: 'TODO: Име',
  za: '${za}',
  pitch: 'TODO: какво прави, в едно изречение.',
  description:
    'TODO: едно или две изречения за търсачките и за споделяне: какво е, за кого е и защо е полезно.',
  owner: 'own',
  type: 'app',
  status: 'building',
  topics: ['kod'],
  years: { from: ${year} },
  updatedAt: '${today}',
  links: {},
  stack: [{ tech: 'next' }],
  hue: 200,
  cover: {
    src: cover,
    frame: 'browser',
    alt: 'TODO: какво се вижда на снимката и защо е важно.',
  },
  body: {
    useCases: ['TODO: ситуация, в която това ти помага.'],
    why: 'TODO: защо съществува. Моментът, който те дразнеше, защо готовите решения не ставаха и какво нарочно остави настрана. Между 25 и 130 думи, с твоите думи.',
    how: ['TODO: **едно решение, което си струва да се разкаже.** И защо.'],
    state: 'TODO: къде е сега.',
  },
})
`,
)

const registryPath = 'src/content/registry.ts'
const registry = readFileSync(registryPath, 'utf8')
  .replace(
    /(\nexport const registry = \[)/,
    `import ${ident} from './projects/${slug}'\n$1`,
  )
  .replace(/\n\]\n?$/, `\n  ${ident},\n]\n`)
writeFileSync(registryPath, registry)

console.log(`Created ${dir}/index.ts and registered it.`)
console.log('Next: add cover.webp, fill in the fields, then run pnpm build.')
console.log(
  'The build fails with a readable message until every field is valid.',
)
