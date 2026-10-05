# онова за

Everything Цветомир Цеков makes, in one place: small apps for everyday problems and websites for people with a small business. Each project is named by what it is for: онова за сметката, онова за кафето, онова за мебелите.

Next.js 16 (App Router, all static), Tailwind v4, shadcn/ui, Sofia Sans. No backend.

## Develop

```bash
pnpm install
pnpm dev            # http://localhost:3000
pnpm ci:preflight   # format, lint, types, knip, tests, production build
pnpm test:e2e       # Playwright smoke + axe (run pnpm test:e2e:install once)
```

`NEXT_PUBLIC_SITE_URL` sets the canonical origin (defaults to `https://onova-za.com`).

## Add a project

```bash
pnpm new:project onova-za-kuhnyata "кухнята"
```

1. Drop a screenshot next to the new `index.ts` as `cover.webp` (browser shots 1440x900, phone shots 780x1688).
2. Replace every `TODO` and fill in the fields. The schema explains each one; `pnpm build` fails with the slug and field until everything is valid (alt text, word counts, hue band, client block, no `TODO` left).
3. Pick a `hue` (OKLCH degrees, anything outside 270 to 320). A test checks that every allowed hue keeps contrast in both themes, so any value is safe; pick one far from its neighbours on the wall.
4. Set `seo.title` (about 50 characters, what people would search for) if the default `{name}: {pitch}` is longer.
5. That's it: the project appears on the homepage, the index, related projects, the sitemap, structured data and gets its own OG image.

The order in `src/content/registry.ts` is the order on the wall. `featured: true` gives a label two rows and its screenshot; featured labels alternate sides, and if a group ends on an odd cell the last regular label runs full width.

Slugs use the official Bulgarian transliteration (`kuhnyata`, not `kuhnqta`); a product's own Latin name wins (`dial-in`).

## Нърд режим

A header switch, off by default. Off shows the plain library; on adds the stack, how each project is made, code links, my part in client work and work history. It is a client preference on static pages (no cookies, no dynamic rendering): both versions are in the HTML, `data-mode="nerd"` / `data-mode="plain"` mark them, and an inline script in `<head>` sets `<html data-nerd>` from localStorage before the first paint. Share `https://onova-za.com/?nerd=1` to open the site with it on.

## Docs

- `CONTEXT.md`: glossary
- `docs/strategy.md`: brand, IA, SEO and design decisions
- `docs/concepts-evaluation.md`: the three homepage concepts and why "Етикети" won
- `docs/research/`: the research behind them
