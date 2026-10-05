# 05 Technical, accessibility, performance

Stack: Next.js 16.3.8, React 19.2, Tailwind v4, pnpm. Written 2026-10-05; app code untouched. **[verified]** = tested in a throwaway copy of the scaffold (`/tmp/onova-lh`: build, Lighthouse, headless Chromium). **[docs]** = bundled docs under `node_modules/next/dist/docs/01-app/` (written `docs/` below). **[unverified]** = reasoned, not run.

## 0. Decisions

1. Content: one TypeScript folder per project, zod-validated at module load, explicit registry. No MDX, no content-collections tool. Body = structured fields with inline-only markup.
2. Rendering: default `next build` (not `output: 'export'`), Server Components only, `generateStaticParams` + `dynamicParams = false`, `typedRoutes: true`. `cacheComponents` stays off.
3. Per-project `opengraph-image.tsx` needs its **own** `generateStaticParams`, else it is built on demand **[verified]**.
4. Fonts: `next/font/google`, `latin` + `cyrillic`. Google's subsetting keeps Bulgarian `locl` forms **[verified]**. Satori (OG images) does not apply them **[verified]**.
5. Theming: `color-scheme` + `light-dark()` tokens, tiny inline script only if a toggle is wanted. No next-themes **[verified]**.
6. Motion: React `<ViewTransition>`, no config flag, no `motion` package.
7. shadcn: `button`, `badge` only. Icons: Phosphor.
8. Filters: URL-synced chips (canonical `/`) as a small client island; static `/tema/[tema]` pages later.
9. Budget: the bare scaffold already ships 142 KB gzipped JS, so home <= 165 KB. Lighthouse CLI runs here **[verified]**.
10. Tests: vitest for content rules, one Playwright + axe smoke, GitHub Actions copied from smetkata.

## 1. Owner conventions to copy

From `/home/tsvetomir/projects/onova-za-smetkata`, `.../marketing-auto`, `.../chef`:

- **Prettier**: `semi: false, singleQuote: true, trailingComma: 'all'`; already in `onova-za/prettier.config.mjs` (+ Tailwind plugin). Scripts `check` = `prettier --check .`, `format` = `prettier --write . && eslint --fix`.
- **ESLint 9 flat**: `eslint-config-next` core-web-vitals + typescript (scaffold has it); marketing-auto adds `--max-warnings=0`. Add `.worktrees/**`, `.claude/worktrees/**`, `.vercel/**` to eslint/prettier/knip/tsconfig ignores (owner uses worktrees in every repo).
- **knip**: `knip.json` with `ignore: ["src/components/ui/**"]`, `ignoreExportsUsedInFile: true`; scripts `knip` and `knip --production --include exports,types`.
- **Scripts/CI**: `typecheck`, `test` (`vitest run`), `test:e2e`, `test:e2e:install`, `ci:preflight` (node script: check, lint, typecheck, knip, test, build), `simple-git-hooks` pre-commit running it, `packageManager: pnpm@10.33.0`. smetkata `ci.yml`: checkout, `pnpm/action-setup@v4`, `setup-node@v4` Node 22 + pnpm cache, `pnpm install --frozen-lockfile`, concurrency cancelling stale PR runs.
- **Tests**: vitest with `@` alias to `src`; Playwright chromium + `webServer`, smoke spec over public paths (marketing-auto `e2e/site-smoke.spec.ts`).
- **Docs**: `AGENTS.md` pointer, `CONTEXT.md` glossary with `_Avoid_` lines, `docs/adr/`. Seed terms: Проект, Онова за фраза, Библиотека, Чие, Вид, Статус, Тема.
- **Commits**: smetkata (newest) uses imperative sentence case, no type prefix ("Keep keyboard focus and close the smaller gaps from QA"), `fix/*` and `feat/*` branches, PR merges. marketing-auto uses `feat:`/`fix:`. Follow smetkata. No AI trailers (global rule).
- **Do not copy**: smetkata `generate-og-image.mjs` (sharp + SVG text relying on a system-installed "Manrope", so Cyrillic output depends on the machine); marketing-auto's `prebuild` sitemap script (replaced by `app/sitemap.ts`). Keep `src/lib/site.ts` as the analogue of `site.defaults.json`.
- **Headers**: reuse marketing-auto `vercel.json` (nosniff, Referrer-Policy, Permissions-Policy, frame-ancestors). A nonce CSP forces dynamic rendering (docs/02-guides/content-security-policy.md), so use `script-src 'self' 'unsafe-inline'` or skip CSP.

## 2. Content model

**Recommendation**: `src/content/projects/<slug>/index.ts` exporting `defineProject({...})`, screenshots beside it, imported statically. A zod schema parses the registry at module load; any failure throws and fails `next build`.

Why:
- **Static image imports** give width, height and blur placeholder for free; MDX frontmatter, Velite and content-collections need a plugin or manual dimensions.
- No extra codegen pass or watcher; zod is already in smetkata and chef.
- IA research fixes the page anatomy (use cases, "why" in 60 to 80 words, how, state, client block). That is a template, so **structured fields beat free-form MDX**, and sections can be linted.
- Light formatting is inline only (`**bold**`, `` `code` ``, `[text](https://...)`): a ~25-line `<Inline>` server component splits on a regex and emits React nodes. No `dangerouslySetInnerHTML` for body text, and external-link treatment lives in one place. If block markdown is ever needed (`/belezhki` notes), add `marked` then.

**Registry**: `src/content/registry.ts` is an explicit array; array order is editorial order (so no `order` field). Adding a project = new folder + one import line. Guards: `scripts/new-project.mjs <slug>` scaffolds the folder and inserts the line; a vitest test asserts every folder is registered and equals its `slug`. No bundler glob magic (`import.meta.glob` is Vite-only).

```ts
// src/lib/project-schema.ts (shown as plain types; derive with z.infer)
import type { StaticImageData } from 'next/image'

export type Slug = string // /^[a-z0-9]+(-[a-z0-9]+)*$/, Latin transliteration (see 01-makers-and-ia.md)
export type Status = 'na-zhivo' | 'v-pravene' | 'eksperiment' | 'arhiv'
export type Kind = 'own' | 'client'
export type ProjectType = 'app' | 'site' | 'system' | 'desktop'
export type CategoryId = keyof typeof CATEGORIES // content/taxonomy.ts, BG labels
export type TechId = keyof typeof TECHNOLOGIES   // content/technologies.ts: id -> { name, url? }
export interface Shot { src: StaticImageData; alt: string; caption?: string }

export interface Project {
  slug: Slug
  name: string                // "Онова за сметката"
  onovaZa: string             // completes "онова за ...": "делене на ресторантската сметка"
  tagline: string             // <= 60 chars
  description: string         // 70-160 chars; meta description + JSON-LD
  kind: Kind
  client?: { name: string; role: string; maintained: boolean } // required iff kind === 'client'
  type: ProjectType
  category: CategoryId
  status: Status
  yearFrom: number
  yearTo?: number             // omit while active
  updatedAt: string           // YYYY-MM-DD; sitemap lastModified, dateModified
  urls: { live?: string; github?: string; demo?: string; docs?: string } // https only; omit what does not exist
  tech: { id: TechId; why?: string }[]
  featured?: boolean
  accent: string              // 'oklch(0.68 0.14 190)'
  hero: Shot
  thumbnail?: Shot            // defaults to hero
  screens: Shot[]             // 0 to 4
  content: {
    useCases: string[]        // 2 to 3 lines
    why: string               // inline markup, 30 to 140 words
    how?: string[]
    wouldChange?: string
    state?: string
  }
  related?: Slug[]            // override; default scored by category, type, tech overlap (max 3)
  seo?: { title?: string; description?: string; noindex?: boolean }
}
```

Build-time rules (thrown with slug and field path; empty alt and broken related were **[verified]** to fail `next build` with a readable message):
- slug matches regex, is unique, equals folder name.
- every `Shot.alt` >= 8 chars (screenshots are never decorative, so no escape hatch).
- `related` exists, excludes self, no duplicates.
- `client` present iff `kind === 'client'`; URLs are `https:`; non-archived projects have >= 1 URL.
- `yearTo >= yearFrom`; `updatedAt` valid, not future; length caps (tagline 60, description 70 to 160, seo.title 70).
- `import 'server-only'` in `projects.ts` so the registry cannot leak into a client bundle.

```ts
const seen = new Set<string>()
for (const p of parsed) {
  if (seen.has(p.slug)) throw new Error(`Duplicate slug: ${p.slug}`)
  seen.add(p.slug)
}
for (const p of parsed)
  for (const r of p.related ?? [])
    if (!seen.has(r) || r === p.slug) throw new Error(`${p.slug}: bad related "${r}"`)
```

**Accent**: set on the page root via `style={{ '--accent': p.accent }}`; derive a text-safe color in CSS: `--accent-ink: light-dark(oklch(from var(--accent) min(l, 0.5) c h), oklch(from var(--accent) max(l, 0.78) c h))`. A vitest test with `culori` applies the same clamp and asserts >= 4.5:1 on both surfaces for every project **[unverified sketch]**.

**vitest**: env `node`; alias `@` to `src`; alias `server-only` to an empty stub; alias `/^.*\.(png|jpe?g|webp|avif)$/` to a stub exporting `{ src: '/x.png', width: 1, height: 1 }` (Vite otherwise returns a URL string, not `StaticImageData`).

## 3. Rendering

- Server Components only. `'use client'` files: library filter chips, optional theme toggle.
- Default build, **not** `output: 'export'`: export disables default image optimization, redirects, headers and Proxy (docs/02-guides/static-exports.md, Unsupported Features), and IA needs `/proekti` to `/` redirect. The default build already prerenders everything to the CDN.
- `generateStaticParams` + `export const dynamicParams = false`: unknown slug returns 404 **[verified]**. `dynamicParams` is unavailable with Cache Components (docs/03-api-reference/03-file-conventions/02-route-segment-config/dynamicParams.md).
- Cache Components / `use cache`: not relevant. Data is an in-module constant, nothing is fetched, content ships with a deploy. No ISR.
- `typedRoutes: true` (top-level, stable; docs/03-api-reference/05-config/01-next-config-js/typedRoutes.md) **[verified]**; `PageProps<'/proekti/[slug]'>` is a global helper with `params` as a Promise. Typecheck: `next typegen && tsc --noEmit`. One `src/lib/paths.ts` (`paths.project(slug)`) feeds cards, sitemap, canonical, JSON-LD.
- Never read `searchParams` in `/` (makes it dynamic).
- `next build` no longer prints First Load JS (docs/02-guides/upgrading/version-16.md); measure with Lighthouse (section 11).

## 4. SEO plumbing

Verified in the prototype unless noted.
- Root layout: `metadataBase: new URL(SITE_URL)`, `title: { default: 'онова за', template: '%s | онова за' }`, `openGraph: { siteName, locale: 'bg_BG' }`. **No `alternates.canonical` in the root layout** (children would inherit it). Set per page: `alternates: { canonical: paths.project(slug) }`.
- `generateMetadata` per project: title `p.seo?.title ?? \`${p.name}: ${p.tagline}\``, description, `robots: noindex` when flagged.
- `app/sitemap.ts` maps the registry (`lastModified: p.updatedAt`; skip priority/changeFrequency). `app/robots.ts` allows all + sitemap. `app/manifest.ts` minimal (`lang: 'bg'`, colors, icons). Icons: `app/icon.svg`, `favicon.ico`, `apple-icon.png`. `viewport.themeColor` with light and dark media entries.
- **OG per project**: `app/proekti/[slug]/opengraph-image.tsx` exporting `size`, `contentType`, `alt`, default `ImageResponse`, and **`generateStaticParams`**. Without it the route was `ƒ` dynamic; with it `● /proekti/<slug>/opengraph-image` is prerendered.
  - Satori takes TTF, OTF or WOFF, not WOFF2 (docs/03-api-reference/04-functions/image-response.md). The bundled default font rendered Cyrillic **[verified]** but only one regular weight, so embed your own for brand and bold.
  - Get a static TTF: `curl -s "https://fonts.googleapis.com/css2?family=Manrope:wght@700" | grep -o 'https[^)]*\.ttf' | xargs curl -so assets/fonts/Manrope-Bold.ttf` (no User-Agent returns TTF, ~93 KB). Commit it (OFL).
  - Load at build time with `await readFile(join(process.cwd(), 'assets/fonts/Manrope-Bold.ttf'))` (docs pattern, opengraph-image.md); Cyrillic rendered correctly **[verified]**. Wrap in `src/lib/og-font.ts`.
  - `alt` is a static export; use a generic Bulgarian alt. `generateImageMetadata` with a dynamic param failed the build in 16.3.8, both with and without `generateStaticParams` **[verified]**; avoid.
  - Satori ignores `lang`: PNG bytes were identical with and without `lang="bg"`, so Bulgarian `locl` forms do not appear in OG **[verified]**. Workaround (freeze `locl` into a derived TTF with `pyftfeatfreeze`) **[unverified]**.
  - Docs state a 500 KB bundle cap for `ImageResponse`; keep font + images small.
- **JSON-LD**: server `<JsonLd data />` rendering `<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} />` (docs/02-guides/json-ld.md); native `<script>`, not `next/script`. Type with `schema-dts`. `WebSite` on home, `SoftwareApplication`/`WebApplication` for own apps, `CreativeWork` + `creator` for client sites, `BreadcrumbList`, `Person` on About, `inLanguage: 'bg'`.
- Format dates with `Intl.DateTimeFormat('bg-BG')` in Server Components.

## 5. Fonts

- `next/font/google` self-hosts at build and downloads **every** unicode-range subset; `subsets` only chooses what gets `<link rel="preload">` (docs/03-api-reference/02-components/font.md; confirmed in the loader source). Variable by default, `display: 'swap'` default. The scaffold's `Geist({ subsets: ['latin'] })` would not preload Cyrillic. Geist does have a Cyrillic subset in Next's font data.
- **`locl` [verified]**: I fetched Google's Cyrillic woff2 with the same Chrome 104 User-Agent next/font uses, decoded it, and compared GSUB with the full TTF for 20 families.
  - Full font has a Bulgarian (`BGR`) `locl` language system, and the Google subset **kept it** in every case: Manrope, Unbounded, Geologica, Montserrat, Source Serif 4, Lora, IBM Plex Sans, Raleway.
  - No Bulgarian forms even in the full font (nothing to lose): Geist, Inter, Onest, Golos Text, Literata, Fira Sans, PT Serif, Noto Sans, Playfair Display, Martian Mono, JetBrains Mono, Roboto Flex.
  - Browser proof: Google's Manrope Cyrillic woff2 shows Bulgarian forms under `lang="bg"` and Russian forms under `lang="ru"` (Chromium). Manrope's forms are strongly cursive, so preview real copy first. Smetkata uses Unbounded (has `BGR`), so reuse gets the forms for free; `<html lang="bg">` triggers them.
  - Re-check any new font: temp dir with `fontkit` + `wawoff2`, fetch the CSS with the Chrome 104 UA, take the `/* cyrillic */` file, decode, look in `GSUB.scriptList` for `cyrl` with a `BGR ` langsys pointing at a `locl` feature. (`ttx`/`pyftsubset` are not installed here.)
- Local alternative: `next/font/local` (woff2 per subset). Budget: <= 2 families, <= 4 preloaded woff2; use `variable: '--font-sans'` style CSS variables wired in `@theme inline`.
- CLS: Google fonts get a metric-matched fallback by default, computed from Latin metrics. Measure on a Cyrillic-heavy page; if CLS > 0.02, use `display: 'optional'` for the display face.

## 6. Images

- Static imports give dimensions and blur data **[verified]**.
- `priority` is deprecated; use `preload` (docs/03-api-reference/02-components/image.md), reserved for a true LCP image; otherwise `loading="eager"` or `fetchPriority="high"`. Project hero: `preload` (emits `<link rel="preload" as="image" imageSrcSet>` **[verified]**). Home: first-row thumbs `fetchPriority="high"`, rest lazy.
- Always set `sizes`; without it the srcset runs to 3840w (seen in the prototype). Cards: `(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw`.
- Config: `images: { formats: ['image/avif','image/webp'], qualities: [75, 85], deviceSizes: [384, 640, 828, 1080, 1440] }` (default is webp only, `[75]`). Each source x width x format is a Vercel transformation, so trim sizes; plan quotas **[unverified]**.
- `placeholder="blur"` on hero images only; cards use the accent as background (50 inline data URIs add up).

## 7. Motion

- View Transitions work in the App Router with no configuration (docs/02-guides/view-transitions.md). There is no `experimental.viewTransition` key in 16.3.8's config types (grepped). `import { ViewTransition } from 'react'` resolves to Next's bundled React canary; `@types/react@19.3.0` types it; build passed and SSR emitted `vt-name="shot-<slug>"` **[verified]**.
- Card thumbnail and project hero: `<ViewTransition name={\`shot-${slug}\`} share="morph" default="none">`. Names must be unique, so exclude the current project from its own related cards. Static routes are prefetched whole in production, so the morph pairs; in `next dev` (no prefetch) you get the enter animation instead. The visual morph is **[unverified]** here.
- Reduced motion: docs snippet (`animation-duration: 0s !important` on `::view-transition-old/new/group(*)` in `@media (prefers-reduced-motion: reduce)`), and gate every CSS `transition`/`@starting-style` reveal the same way.
- No `motion` package: hover/focus/reveal are CSS; it would add client JS to a page whose floor is 142 KB.

## 8. Theming

No library:
```css
:root { color-scheme: light dark; }
:root[data-theme='light'] { color-scheme: light; }
:root[data-theme='dark']  { color-scheme: dark; }
@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *));
@theme inline {
  --color-surface: light-dark(oklch(0.99 0.005 95), oklch(0.18 0.01 190));
  --color-fg:      light-dark(oklch(0.22 0.02 190), oklch(0.96 0.01 95));
}
```
**[verified]** in Chromium: tokens follow system dark, `data-theme` overrides in both directions, Tailwind utilities work. Caveat: `dark:` matches only when `data-theme="dark"` is set, not on bare system dark. Either avoid `dark:` (tokens do the work) or have the inline script always write the resolved theme.
- v1 can ship with zero JS (system preference). For a toggle: inline `<script>` in `<head>` reading `localStorage` and setting `data-theme`, `suppressHydrationWarning` on `<html>` (docs/02-guides/preventing-flash-before-hydration.md, Themes). A Server Component script avoids the React 19 script-in-client-component warning that next-themes triggers. 3-state button (system, light, dark).
- No server-read theme cookie (opts the layout out of static prerendering, per the same guide).
- `light-dark()`: Chrome 123, Safari 17.5, Firefox 120. Fine for 2026.

## 9. shadcn/ui and icons

- Init (ran non-interactively, Tailwind v4 + Next detected): `npx shadcn@latest init -y -t next -b radix -p nova`. `-b` is `base|radix|aria`; `-p` presets: nova, vega, maia, lyra, mira, luma, sera, rhea (use the design agent's pick). Then `npx shadcn@latest add button badge`.
- Add only `button` (CTA, `asChild` over `<Link>`) and `badge` (status chip: color plus word). At 30+ items, `command` + `dialog` lazily for search. Skip tooltip, hover-card, carousel, tabs; use native `<details>`.
- **Init side effects [verified]**: adds `shadcn`, `radix-ui`, `class-variance-authority`, `cn`, `tw-animate-css`, `lucide-react`; unused sidebar/chart tokens; `--font-sans: var(--font-sans)` (self-reference, silently drops the font) until the layout sets `variable: '--font-sans'`; a `.dark` block and `@custom-variant dark (&:is(.dark *))` that conflict with section 8. Replace with the `light-dark()` tokens. `src/lib/utils.ts` is now `export { cn } from "cn"`.
- Icons: `pnpm add @phosphor-icons/react`; in Server Components import from `@phosphor-icons/react/dist/ssr` or per icon `.../dist/ssr/ArrowUpRight` (both exports exist in 2.1.10). It is **not** in Next's default `optimizePackageImports` list (only lucide-react), so add it. Set `"iconLibrary": "phosphor"` in `components.json` before `add`, then check the imports **[unverified]**; remove `lucide-react` if unused.

## 10. Filters and search later

Aligned with `01-makers-and-ia.md`: query-synced filters (`/?status=na-zhivo&za=klient`), canonical `/`, controls at 15+ items, search at 30+.
- `/` stays static: the server renders **all** cards (crawler and no-JS safe) with `data-status`, `data-kind`, `data-type`. A client island with `useSearchParams` inside `<Suspense>` renders only the chips (`<Link replace scroll={false}>`, `aria-current`) and writes active values onto the list's `data-*`; a few CSS rules hide non-matching items. Counts computed on the server. Missing `Suspense` fails the production build (docs/04-functions/use-search-params.md). **[unverified sketch]**
- Indexable pages: static `/tema/[tema]` (`generateStaticParams`, topics with 3+ projects, in sitemap, `CollectionPage` JSON-LD). Filtered URLs stay out of the sitemap.
- Search at 30+: static `search-index.json` Route Handler (name, tagline, topics); load it and `cmdk` on first open via dynamic import.

## 11. Accessibility checklist (WCAG 2.2 AA)

- **Skip link** first in DOM (`Към съдържанието` to `#main`), visible on focus (2.4.1).
- **Landmarks**: `header` > `nav aria-label="Основна навигация"`, `main id="main" tabIndex={-1}`, `footer`. One `h1`; body sections `h2`, items `h3`, no skips (1.3.1, 2.4.6).
- **Language**: `lang="bg"` on `<html>` (3.1.1), which also drives `locl`. Language-of-parts (3.1.2) exempts proper names and technical terms, so Convex or Next.js need no wrapper; wrap only whole English phrases in `<span lang="en">`.
- **Titles**: unique per page; Next's built-in route announcer (`next/dist/client/route-announcer.js`) reads it on client navigation (2.4.2).
- **Focus**: visible `:focus-visible` ring, 2px, offset 2px, 3:1 against neighbours (1.4.11, 2.4.7). `scroll-padding-top` = sticky header height (2.4.11). Never `outline: none` without replacement.
- **Card links**: one link per card: `<article class="relative"><h3><a class="after:absolute after:inset-0">`. No nested `<a>`; any extra link needs `relative z-10`. Ring on the card via `has-[a:focus-visible]:outline`. Link text is the project name (2.4.4).
- **Current state**: `aria-current="page"` on nav; `aria-current="true"` on the active filter chip.
- **Contrast**: text 4.5:1, large text and UI borders 3:1 in both modes. Raw accent is decorative; text uses `--accent-ink` (section 2). Status = color plus word.
- **Motion**: section 7; no autoplay media (2.2.2).
- **Alt policy**: one Bulgarian sentence, 8 to 125 chars, what the screenshot shows and why; no "снимка на". `<figcaption>` carries captions and does not repeat alt. The schema blocks empty alt.
- **External links**: no forced `target="_blank"`. If used: `rel="noopener"`, arrow icon, hidden "(отваря се в нов раздел)" text, centralised in `<Inline>` and the CTA.
- **Target size** >= 24x24 CSS px (2.5.8); aim 44px for primary controls and chips, 8px spacing.
- **Reflow**: no horizontal scroll at 320px / 400% zoom (1.4.10); never block zoom; text spacing overrides must not clip (1.4.12).
- **Gate**: `@axe-core/playwright` (tags `wcag2a, wcag2aa, wcag22aa`) on home, a project page, About and 404. `eslint-config-next` already includes `jsx-a11y`.

## 12. Performance budget and measurement

Baseline **[verified]**: the untouched scaffold (Server Components only) scores Lighthouse 100/100/100/100 with scripts 141,847 B transferred, LCP 1.8 s, TBT 50 ms, CLS 0 (mobile sim). **142 KB is the floor** (React + Next runtime).

| Route | JS transferred | LCP | CLS | TBT | Notes |
|---|---|---|---|---|---|
| `/` | <= 165 KB | <= 2.0 s | <= 0.02 | <= 100 ms | HTML <= 60 KB at 50 projects; thumbs <= 30 KB AVIF |
| `/proekti/[slug]` | <= 155 KB | <= 2.0 s | <= 0.02 | <= 100 ms | hero <= 120 KB |

All routes: <= 2 font families, <= 4 preloaded woff2, Lighthouse a11y/best-practices/SEO = 100. INP: only chips and a theme button run JS; keep handlers under 50 ms, never render the full list client-side.

Run (**[verified]** in this WSL setup; Chrome from Playwright's cache):
```bash
pnpm build && pnpm start -p 3000 &
CHROME_PATH=$HOME/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome \
  npx -y lighthouse http://localhost:3000/ --chrome-flags="--headless=new --no-sandbox" \
  --only-categories=performance,accessibility,best-practices,seo \
  --output=json --output-path=/tmp/lh.json --quiet
jq '{perf:.categories.performance.score, a11y:.categories.accessibility.score, lcp:.audits["largest-contentful-paint"].displayValue, cls:.audits["cumulative-layout-shift"].displayValue, tbt:.audits["total-blocking-time"].displayValue}' /tmp/lh.json
```
`--preset=desktop` for desktop. Bundle drill-down: `next experimental-analyze` (Turbopack, no build artifacts). The chromium build number (`1228`) changes with Playwright upgrades; glob it in a `pnpm perf` script. Field data later: `@vercel/speed-insights` (in smetkata already).

## 13. Testing and CI

- **vitest** (required): valid fixture parses; rejects missing alt, duplicate slug, broken related, client-block mismatch; registry covers every folder; accents pass contrast; sitemap lists every slug; related never returns self.
- **Playwright smoke** (3 to 4 tests): home has N cards and one `h1`; project page has `h1`, canonical, parseable JSON-LD, `og:image`; unknown slug is 404; axe clean on each page type. `webServer: { command: 'pnpm start', url: 'http://127.0.0.1:3000', reuseExistingServer: !process.env.CI }`.
- **CI** `.github/workflows/ci.yml` from smetkata: install, `pnpm run ci:preflight`, then a job running `pnpm exec playwright install --with-deps chromium && pnpm test:e2e`. Check the Vercel preview and CI before asking to merge.

## 14. Recommended `src/` tree

```
src/
  app/
    layout.tsx                  fonts, <html lang="bg">, theme script, skip link, header, footer
    page.tsx                    Library (home), static
    globals.css                 tokens, @theme, view-transition CSS, reduced motion
    not-found.tsx  za-mene/page.tsx
    proekti/[slug]/page.tsx     generateStaticParams, dynamicParams=false, generateMetadata, JSON-LD
    proekti/[slug]/opengraph-image.tsx
    opengraph-image.tsx         site default
    sitemap.ts  robots.ts  manifest.ts  icon.svg  favicon.ico  apple-icon.png
  components/
    ui/                         button.tsx, badge.tsx (shadcn)
    project-card.tsx  library.tsx  library-filters.tsx ('use client')  inline.tsx
    json-ld.tsx  skip-link.tsx  theme-script.tsx  theme-toggle.tsx
  content/
    projects/<slug>/index.ts    defineProject({...}) + hero.png, screen-1.png ...
    registry.ts  taxonomy.ts  technologies.ts
  lib/
    project-schema.ts  define-project.ts  projects.ts ('server-only')
    paths.ts  site.ts  seo.ts  og-font.ts  utils.ts
assets/fonts/                   OG-only TTF
scripts/new-project.mjs
e2e/smoke.spec.ts
CONTEXT.md  knip.json  vitest.config.ts  playwright.config.ts  vercel.json  .github/workflows/ci.yml
```

## 15. Install commands

```bash
cd /home/tsvetomir/projects/onova-za
pnpm add zod server-only @phosphor-icons/react
npx shadcn@latest init -y -t next -b radix -p nova      # then clean up per section 9
npx shadcn@latest add button badge
pnpm add -D vitest culori @types/culori schema-dts knip simple-git-hooks \
  @playwright/test @axe-core/playwright
pnpm exec playwright install chromium
# already added by another agent: prettier, prettier-plugin-tailwindcss
```
```ts
// next.config.ts
const nextConfig: NextConfig = {
  typedRoutes: true,
  images: { formats: ['image/avif', 'image/webp'], qualities: [75, 85], deviceSizes: [384, 640, 828, 1080, 1440] },
  experimental: { optimizePackageImports: ['@phosphor-icons/react'] },
}
```
Scripts: `typecheck` (`next typegen && tsc --noEmit`), `test`, `test:e2e`, `test:e2e:install`, `check`, `format`, `knip`, `ci:preflight`, `new:project`.

## 16. Verification log and risks

Verified items are tagged inline above. Not verified: the visual morph, CSS relative-color accent and its contrast test, the filter island, shadcn rewriting icons to Phosphor, Vercel image quotas, `pyftfeatfreeze`.

Risks: (1) `generateImageMetadata` with dynamic params is broken in 16.3.8; (2) `shadcn init` rewrites `globals.css` and the font variable, review the diff; (3) Bulgarian forms are an aesthetic call, preview before choosing; (4) OG images show non-Bulgarian forms for fonts that have them.
