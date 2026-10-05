# Homepage concept prototypes: shared brief

Three homepage concepts are built in parallel, then compared. They must be **genuinely different** (composition, typography use, card anatomy, interaction), not recolours. Prototype quality: real data, real images, correct structure and responsive behaviour, honest a11y. Not polished to production; no SEO plumbing needed.

Read first: `docs/strategy.md` (brand, IA, taxonomy, principles) and `docs/research/03-visual.md` (type, palette, directions). Skim `docs/research/01-makers-and-ia.md` sections 3 to 6.

## Where you work (strict)

- Your route: `src/app/(kontseptsii)/kontseptsia-<x>/page.tsx` (`x` = `a`, `b` or `c`). Served at `http://localhost:3100/kontseptsia-<x>`.
- Your components and CSS: `src/concepts/<x>/` only. Use CSS Modules (`*.module.css`) or Tailwind classes. Do not edit `src/app/globals.css`, `src/app/layout.tsx`, `src/lib/*`, `src/content/*` or anything another concept owns.
- Concept-specific fonts: call `next/font/google` inside `src/concepts/<x>/fonts.ts` (module scope) and apply the `.variable`/`.className` on your page root. The root layout already loads Sofia Sans (`--font-text`, Tailwind `font-sans`), Sofia Sans Extra Condensed 700/800 (`--font-display`, `font-display`) and Overpass Mono (`--font-mono`, `font-mono`).
- A dev server is ALREADY running on port 3100 (HMR picks up your files). **Never** start another dev server and never run `pnpm build` (it would clash with the other agents). Typecheck with `npx tsc --noEmit` (safe to run).
- No new dependencies. Icons: `@phosphor-icons/react/dist/ssr` in Server Components (e.g. `import { ArrowUpRight } from '@phosphor-icons/react/dist/ssr'`), weight `regular` or `bold`, consistent size.

## Data API (server-only)

```ts
import {
  projects,
  ownProjects,
  clientProjects,
  stats,
  yearsLabel,
} from '@/lib/projects'
import { STATUSES, OWNERS, TYPES } from '@/content/taxonomy'
import { Inline } from '@/components/inline' // renders **bold**, `code`, [links](...)
// Project fields: slug, name, za, pitch, description, owner ('own'|'client'), client?, type,
// status ('live'|'building'|'experiment'|'archived'), years {from,to?}, uiLanguage, links {live?,github?},
// stack, featured, hue (OKLCH hue), cover {src: StaticImageData, alt, frame: 'phone'|'browser'|'bare', caption?}, screens[], body {...}
```

- Project accent: set `style={{ '--h': p.hue } as React.CSSProperties}` on an element, then use the global tokens `var(--fill)` (background that always carries `var(--fill-ink)` text, at least 7:1) and `var(--tint)` (accent text on the page background). Tailwind: `bg-fill text-fill-ink`, `text-tint`. Never put `--tint` text on `--fill`.
- Neutrals: `bg-background`, `bg-surface`, `text-foreground`, `text-muted-foreground`, `border-border`, `border-line-strong`. Light and dark both follow the system; check both (agent-browser can emulate `prefers-color-scheme`).
- Images: `next/image` with the static import (`<Image src={p.cover.src} alt={p.cover.alt} sizes="..." />`). Always set `sizes`. Phone shots are 780x1688, browser shots 1440x900 (wedding 1440x804, RepoDeck 1440x860).
- Links to project pages: `/proekti/<slug>` (page does not exist yet, that is fine). Cards: ONE link per card (stretched-link pattern: link on the name, `after:absolute after:inset-0`), no nested links.
- Server Components only. If one interaction truly needs JS, isolate it in a tiny `'use client'` leaf. CSS-first motion (`:hover`, `:focus-visible`, `:has()`), gated by `@media (prefers-reduced-motion: no-preference)`. Animate only transform and opacity, 120 to 340 ms.

## Content of the homepage (all concepts)

1. Header: wordmark "онова за" (link home), nav "Проекти" (`/proekti`) and "За мен" (`/za-men`). One line, at most 72 px tall, never a hamburger.
2. Hero: the brand. Max 4 text elements, headline max 2 lines on desktop, subtext max 20 words, fits the first viewport. It must explain the name in a few words (what "онова за" means) and say whose site this is (Цветомир Цеков, web developer, Sofia). Suggested line: "Малки приложения и сайтове. Всяко е за нещо." Improve it if you can, keep it true.
3. The projects (the main content): all 11, grouped **Мои** (5) then **За клиенти** (6). Each project communicates in about 3 seconds: "онова за {za}", name, pitch, status label, client tag where relevant, and a visual (real screenshot or project colour).
4. A short closing block: what to do next (see all projects at `/proekti`, or contact at `/za-men`), one CTA label per intent.
5. Footer: minimal (name, GitHub `https://github.com/HayGrouve`, LinkedIn `https://www.linkedin.com/in/tsvetomir-tsekov-a9317b1b3/`, email `tsvetomir.kr.tsekov@gmail.com`).

## Hard rules (fail the concept if broken)

- Zero em-dashes and en-dashes in any visible text or alt text. Use hyphens, commas, colons, periods.
- No eyebrow labels above every section (max 1 per 3 sections). No section numbering ("01 /", "№ 001"). No scroll cues. No decorative status dots (a status may use a coloured swatch only if the word is also shown). No locale/weather strips. No version labels. No fake numbers. No "Trusted by". No div-built fake screenshots.
- No purple/violet AI gradients, no glassmorphism, no glows, no gradient text, no pure #000 or #fff.
- One radius system for the whole page (the global token `--radius` is 2px; sharp is fine). One page theme (no section flipping light/dark).
- Inter, Fraunces and Instrument Serif are banned. Any extra font must support Cyrillic with Bulgarian forms (see 03-visual.md section 1.2). Keep total fonts to the root set plus at most one extra family.
- `min-h-[100dvh]` never `h-screen`. Hero top padding at most `pt-24` on desktop.
- Copy: Bulgarian, informal "ти" where addressing the visitor, no hype words, no cute-but-wrong phrases. Re-read every string.
- Mobile (< 768px) collapses explicitly to a single column, nothing overflows at 360px.
- Visible `:focus-visible` on every link. Text contrast at least 4.5:1 in both themes.

## Verification (required) and deliverable

1. `agent-browser skills get core` once, then use your own session: `agent-browser --session concept-<x> ...`.
2. Screenshot your page at 1440x900 (above the fold) and full-page, and at 390x844 (above the fold and full-page), in light AND dark. Save to `/tmp/concepts/<x>-{desktop,desktop-full,mobile,mobile-full}-{light,dark}.png`. Look at them and fix what is broken before you finish.
3. Tab through once and confirm focus is visible and order is logical.
4. `npx tsc --noEmit` passes for your files.
5. Final message (max 250 words): concept name and one-line idea, what makes it different, the 3 strongest and 3 weakest points honestly, how it scales to 20 and 50 projects, and the screenshot paths.
