# онова за: strategy

Synthesis of `docs/research/01` to `05`. This is the brief every page is built against.

**Design read:** a personal project hub and portfolio for Bulgarian visitors (and, second, hiring managers and clients), with a playful but disciplined Bulgarian label and signage language, leaning toward native CSS and Tailwind v4 tokens, Sofia Sans with Bulgarian letterforms, and View Transition motion.

**Dials:** DESIGN_VARIANCE 7, MOTION_INTENSITY 4, VISUAL_DENSITY 4. Distinctive composition, motion that is fast and rare, density that survives 50 projects.

## 1. Brand

"Онова за..." is what a Bulgarian says when the name of a thing escapes them but its purpose does not: "дай ми онова за отваряне на бутилки". The brand takes that literally: **every project is named by what it is for.** The product may have its own name (Dial In, RepoDeck, Iliaora); on this site it is also "онова за кафето", "онова за репотата", "онова за сладкишите".

- The **за-phrase** (`za` in data) is the brand's unit. One lowercase noun phrase per project. It is the biggest text on every card and the first thing on every project page.
- Brand line: "Малки приложения и сайтове. Всяко е за нещо." Short, true, and it puns on "за".
- Definition block (About and footer): "**онова за** *разг.* Каквото казваш, когато не помниш как се казва нещо, но знаеш за какво е."
- Voice: informal "ти", verbs first, concrete nouns, no corporate filler, no hype words (иновативен, революционен, страстен). Plain functional copy beats cute copy.
- Bulgarian letterforms are the "from here" cue: Sofia Sans (Lettersoup, Sofia) draws Bulgarian Cyrillic by default; `lang="bg"` everywhere. No шевици, no tricolour, no folk kitsch.

## 2. Information architecture

| Path | Page | Notes |
|---|---|---|
| `/` | Library | Brand intro + every project. Two headed groups under 15 projects: **Мои**, then **За клиенти**. |
| `/proekti` | Index | Dense table of every project: за-phrase, name, status, type, years, domain. Doubles as the owner's dashboard. `CollectionPage` + `ItemList`. |
| `/proekti/[slug]` | Project | One page per project, own or client. |
| `/za-men` | About | Short. Who, what, why "онова за", profiles, contact. `ProfilePage`. |
| later `/belezhki` | Notes | Only once 3+ notes exist. Never an empty nav item. |
| later `/tema/[tema]` | Topic | Only for topics with 3+ projects. |

Navigation: wordmark (home), **Проекти**, **За мен**. Always visible, never a hamburger.

Discovery scales by count, from the same data: none under 15 projects; status/owner/type chips (URL-synced, canonical `/`) at 15+; visible search plus `/` and Cmd+K at 30+; topic pages at 50+.

## 3. Taxonomy

| Facet | Values (id: label) |
|---|---|
| Status | live: На живо, building: В правене, experiment: Експеримент, archived: Архив |
| Owner | own: Мое / Мои, client: За клиент / За клиенти |
| Type | app: Приложение, site: Сайт, system: Система, desktop: Десктоп |
| Topic | internal only (related projects, later topic pages) |

Cards show only filterable facets: status and the client tag. Never tech stacks or dates.

## 4. Project page anatomy

1. Header: "онова за X" (H1 carries the name too), pitch, status, type, owner, one primary CTA (only links that exist).
2. Cover screenshot in its frame (phone, browser, bare) on the project's colour.
3. **За какво ти е**: 2 to 4 concrete situations.
4. **Защо го направих** (own) or **Задачата** (client): 25 to 130 words, one honest limit.
5. More screens with captions.
6. **Как е направено**: 3 or 4 decisions in plain words, then the stack as a short list with a "why" only where it adds something.
7. **Къде е сега**: honest state.
8. Client block (client work): client, my role, what was not mine.
9. **Още онова за...**: 3 related projects.

## 5. SEO

- Latin slugs, official transliteration (`kuhnyata`, never `kuhnqta`); a product's own Latin spelling wins (`dial-in`, `repodeck`). Old spellings become 308 redirects.
- Titles `{Име}: {какво прави} | онова за`; unique descriptions; per-page canonical (never in the root layout).
- JSON-LD: home `WebSite` + `Person` + `Brand`; `/proekti` `CollectionPage` + `ItemList`; own app `WebPage` + `WebApplication` (RepoDeck `SoftwareApplication`); client work `WebPage` + `CreativeWork` with `creator`; `BreadcrumbList` on inner pages; About `ProfilePage`. No ratings, no Organization, no SearchAction.
- Per-project OG images from the same fields (Sofia Sans keeps Bulgarian forms even in Satori).
- Product domains stay canonical for tool intent; the hub page tells the project story. Links out are normal follow links with descriptive anchors.
- Realistic goal: brand and author queries, plus a few long-tail ones. Distribution is LinkedIn, dev communities and direct sharing.

## 6. Design principles

1. **The phrase is the interface.** "онова за" + noun carries identity; colour and screenshot support it.
2. **One system, many accents.** Neutral cool greys; each project owns one OKLCH hue. Fill lightness and chroma are fixed per theme so every hue passes contrast.
3. **Real work only.** Real screenshots, honest captions for demo data, no fake UI, no invented numbers.
4. **Fast by default.** Server Components, static pages, two font families, no animation library.
5. **Accessible by construction.** One link per card, visible focus, colour never alone, reduced motion honoured, alt text required by the schema.
6. **Adding a project is one folder and one line.** Everything else derives.

## 7. Data model

`src/lib/project-schema.ts` (zod) is the source of truth. Each project lives in `src/content/projects/<slug>/index.ts` with its screenshots beside it and one line in `src/content/registry.ts`. Build fails on missing alt text, duplicate slugs, unknown related slugs, client details on own work, "why" outside 25 to 130 words, or hues in the 270 to 320 band.
