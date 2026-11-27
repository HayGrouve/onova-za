# Hub homepage concepts: shared brief

The homepage is becoming the **entry point of a hub**: one Акаунт signs you in to every онова за project, and the home page is where people land. Today it reads as one page with a wall of loud colour slabs and no explanation of what you landed on. Three concepts are prototyped in parallel, then compared, and the best one (or a combination) gets built properly.

The goal is **polish and a pleasant first visit**: a visitor understands in 5 seconds what this is, why there is one Акаунт, and can browse the projects with pleasure. Quality bar: a well-made product-suite homepage, not a portfolio grid.

Read first: `GLOSSARY.md`, `docs/strategy.md`, `docs/adr/0001-one-akaunt-on-onovaza-subdomains.md`, `src/app/page.tsx` and `src/components/label/*` (the current page, to know what you are replacing). Load the `frontend-design:frontend-design` skill before designing.

## Facts you may use in copy (nothing else; no invented numbers or claims)

- 7 projects, all own work (`ownProjects`; `clientProjects` is empty today but keep the code able to show a "За клиенти" group if it is non-empty).
- 4 of them use the Акаунт (`p.akaunt` is set): Сметката, Кухнята, Кафето, Клиентите. Each lives at `https://<subdomain>.onovaza.com` (`p.links.live`).
- Вход happens once, on the hub at `/vhod`: Google or a code by email, no passwords. A new email creates the Акаунт in the same step (no separate sign-up). Изход signs you out of every project at once.
- Each project keeps its own data and its own payments. "Изтрий данните" removes one project's data; the Акаунт itself is deleted only on the hub, at `/akaunt`.
- The other 3 work without an Акаунт: Имотите and Къмпинга (web), Dictum (desktop app, Windows).
- Made by Цветомир Цеков, web developer, Sofia (`/za-men`). The name: "онова за" is what a Bulgarian says when they forget a thing's name but know what it is for. Brand line: "Малки приложения и сайтове. Всяко е за нещо." You may improve it if it stays true.

## Where you work (strict)

- Your route: `src/app/(hub-proto)/hub-<x>/page.tsx` (`x` = `a`, `b` or `c`), served at `http://localhost:3100/hub-<x>`. It renders inside the real root layout (site header + footer); do not change those.
- Your components and CSS: `src/prototypes/hub-<x>/` only. CSS Modules or Tailwind. Do **not** edit `src/app/globals.css`, `src/app/layout.tsx`, `src/lib/*`, `src/content/*`, `src/components/*`, or another concept's folder. You may import from `src/components/*` and `src/lib/*`.
- A dev server is ALREADY running on port 3100 (HMR picks up your files). **Never** start another one and never run `pnpm build`. Typecheck with `npx tsc --noEmit`.
- No new dependencies. Icons: `@phosphor-icons/react/dist/ssr` in Server Components. shadcn components already in `src/components/ui` may be used.

## Data API (server-only)

```ts
import { projects, ownProjects, clientProjects } from '@/lib/projects'
import { STATUSES, OWNERS, TYPES } from '@/content/taxonomy'
import { accent } from '@/lib/accent' // <div {...accent(p.hue)}> sets --h and recomputes --fill / --tint
import { paths } from '@/lib/paths' // paths.project(slug), paths.vhod(), paths.akaunt(), paths.projects(), paths.about()
import { isSignedIn } from '@/lib/akaunt-cookie' // client-side cookie check; see src/components/nav-akaunt.tsx
```

Project fields: `slug, name, za, pitch, description, owner, type, status, years, links {live?, github?, download?}, featured, akaunt? {subdomain}, hue, cover? {src, alt, frame: 'phone'|'browser'|'bare'}, screens?, body`. Covers: phone shots 780x1688, browser shots 1440x900. Check which projects have a `cover`.

- Accent tokens: `var(--fill)` (background, always carries `var(--fill-ink)` text), `var(--tint)` (accent text on the page background). Never `--tint` text on `--fill`. You may derive your own softer tints from `--h` in your CSS module (e.g. `oklch(0.95 0.03 var(--h))` / dark equivalent) as long as text contrast stays at least 4.5:1 in both themes.
- Neutrals: `bg-background`, `bg-surface`, `text-foreground`, `text-muted-foreground`, `border-border`, `border-line-strong`.
- Images: `next/image` with the static import, always `sizes`. Lazy images can render blank in full-page screenshots; scroll the page first or mark above-the-fold images eager.
- The home page must stay static and must **not** load Clerk. Signed-in awareness, if you want it, comes only from the cookie check in a tiny `'use client'` leaf (like `NavAkaunt`), with the signed-out version as the server HTML.
- Server Components first. JS only in tiny client leaves where an interaction truly needs it. CSS-first motion gated by `prefers-reduced-motion: no-preference`; animate transform and opacity. CSS scroll-driven animations are fine as progressive enhancement.

## Hard rules

- Copy: Bulgarian, informal "ти", glossary words (Акаунт, Вход, Изход, Проект, за-фраза), no hype words. **Zero em or en dashes** anywhere (visible text, alt, aria).
- The за-фраза stays the brand's unit: "онова за {za}" is how every project is named on the page.
- No fake numbers, no fake UI built from divs pretending to be screenshots, no "Trusted by", no purple AI gradients, no glassmorphism, no gradient text, no pure #000/#fff, no section numbering ("01 /"), no scroll cues, no eyebrow above every section.
- Status is always a word, never colour alone. Every link has a visible `:focus-visible`. Text contrast at least 4.5:1 in both themes. One theme for the whole page (no light/dark section flipping).
- Loosened on purpose (the old page felt flat): you may choose your own radius scale and use soft shadows or layered surfaces, as long as it is one consistent system. Large full-saturation colour slabs are discouraged; use colour as an accent.
- Fonts: the root set (Sofia Sans `font-sans`, Sofia Sans Extra Condensed `font-display`, Overpass Mono `font-mono`). At most one extra family, only if it has proper Bulgarian Cyrillic forms; Inter, Fraunces, Instrument Serif are banned.
- Mobile (< 768px) collapses deliberately; nothing overflows at 360px. `min-h-dvh`, never `h-screen`.

## Verification and deliverable

1. `agent-browser skills get core` once, then always `export AGENT_BROWSER_SESSION=hub-<x>` (your own session; never the default one).
2. Screenshots at 1440x900 (first viewport and full page) and 390x844 (first viewport and full page), light AND dark (`agent-browser set media dark|light`), saved to `/tmp/claude-1000/-home-tsvetomir-projects-onova-za/bf7c5805-1ffc-4ecc-a1ab-4de273e0a763/scratchpad/hub/<x>-{desktop,desktop-full,mobile,mobile-full}-{light,dark}.png`. Look at every one and fix what is broken before finishing. Iterate on the design at least twice after first seeing it.
3. Tab through once: focus visible, order logical.
4. `npx tsc --noEmit` and `pnpm exec eslint src/prototypes/hub-<x> 'src/app/(hub-proto)/hub-<x>'` pass.
5. Final message (max 300 words): concept name and one-line idea, what makes it different, 3 strongest and 3 weakest points (honestly), how it scales to 15 and 30 projects, which parts would combine well with another approach, and the screenshot paths.
