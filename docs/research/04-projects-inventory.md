# 04. Projects inventory (evidence-based)

Gathered on 2026-10-05 from the local repos in `/home/tsvetomir/projects/`, `git log`, `gh repo view`, the Vercel CLI, `curl`, RDAP and live browser captures. Unknowns are marked "unknown". No `.env*` file was opened and no secret value is reproduced here.

Notes on method:

- Commit dates are author dates from `git log` on the local clone (wedding: GitHub API, no local clone).
- Quotes from repo docs have had em-dashes normalized to commas or hyphens so this file stays em-dash free. Wording is otherwise verbatim.
- Screenshots: desktop is a 1440x900 viewport (PNG 1440x900). Mobile is a 390x844 viewport captured at device pixel ratio 2, so the PNG is 780x1688. Fonts and images were awaited, no cookie banners appeared on any site. Every PNG has a quality-82 WebP twin next to it (PNGs kept).

## 1. Summary table

| slug | name | own / client | status | live URL ok? | screenshots saved | listing recommendation |
|---|---|---|---|---|---|---|
| `onova-za-smetkata` | Онова за сметката | own (SaaS) | live, actively building | yes, 200 (signed-out users land on `/login`) | desktop, mobile (login page only) | list publicly, with link |
| `chef` | CHEF, Your Personal Cookbook | own | live, actively maintained | yes, 200 (`armyant.app` and `chef-black.vercel.app` are the same app) | desktop, mobile, detail | list publicly, with link (see content caveats) |
| `dial-in` | Dial In | own | live, new (11 days old) | yes, 200 | desktop, mobile (empty state), detail + detail-mobile (seeded demo data) | list publicly, with link |
| `repodeck` | RepoDeck | own | building (MVP merged) | n/a, desktop app, no web URL | desktop (copied from repo, demo data) | list without link (private repo) |
| `camping` | Ceko's Camping Checklist | own | live, lightly maintained | yes, 200 (`palatki.netlify.app`) | desktop, mobile | list publicly, with link |
| `zoo-alisa` | Alisa (vet clinic CRM) | client (veterinary clinic "Алиса") | live, maintenance | yes, 200 but login-gated | desktop, mobile (login page, plain) | list without link (login-only, patient data behind it) |
| `auto` | Car Service CRM | own, derived from zoo; client unknown | experiment, paused | yes, 200 but login-gated | none (login page rejected, see section 7) | hide for now |
| `marketing-auto` | Stefi Auto Gas site | client (Stefi Auto Gas, Lovech) | live, delivered to client | yes, 200 (`stefi-gas.com` redirects to `www.`) | desktop, mobile | list publicly, with link |
| `torta` | Iliaora | client (sweets business, Sofia) | live, delivered | yes, 200 | desktop, mobile | list publicly, with link |
| `a-el-key` | Мебели на Андрей Какрински | client (furniture maker) | live, delivered | yes, 200 | desktop, mobile | list publicly, with link (no GitHub link, repo is private) |
| `chimney` | Коминочистач | client (probable, unconfirmed) | live, maintained | yes, 200 (`komini-sofia.com`, Netlify) | desktop, mobile | list with link only after the owner agrees (face photo, name, phone on the site) |
| `koko` | Wedding photo upload + admin gallery | personal / favour for a couple (unconfirmed) | archived (deployment gone) | no, `DEPLOYMENT_NOT_FOUND` | none (by design) | hide, or list as an anonymous case study without link |
| `paradise-hotel` | Paradise Deluxe Apartments | unknown (client likely, unconfirmed) | archived / abandoned | no deployment found | none | hide |
| `wedding` | Wedding RSVP site | client / personal (couple) | archived (event over, domain expired) | custom domain dead (NXDOMAIN); `wedding-delta-drab.vercel.app` still 200 | desktop, mobile (RSVP form section, taken from the vercel.app alias) | list without link, or hide; names are in the screenshot header |
| `portfolio` | Old portfolio (not a card) | own | superseded | custom domain dead (NXDOMAIN); `portfolio-haygrouves-projects.vercel.app` still 200 | none (not requested) | n/a |

## 2. Blockers and flags (read first)

1. **`tseko.site` / `www.tseko.site` (old portfolio) do not resolve.** Cloudflare DoH and the local resolver both return NXDOMAIN. `vercel domains inspect tseko.site` shows registrar "Third Party", empty "Current Nameservers", created 2025-03-06. Most likely a lapsed registration or removed DNS (inference, not verified; RDAP for `.site` was not reachable). The Vercel project `portfolio` still lists `www.tseko.site` as its production URL. The deployment itself still serves at `https://portfolio-haygrouves-projects.vercel.app` (200).
2. **`anisvatbageorgi.fun` is dead.** NXDOMAIN. RDAP (`rdap.org`) says registered 2025-08-13, expiration 2026-08-13, status includes `redemption period` and `pending delete`. The Vercel domain list shows the nameservers pointing at the registrar, not Vercel. The same app is still served at `https://wedding-delta-drab.vercel.app` (200). Do not link the `.fun` domain from the new hub.
3. **`koko`**: `https://koko-kappa-nine.vercel.app` (the GitHub homepage field) returns 404 with `x-vercel-error: DEPLOYMENT_NOT_FOUND`, and there is no `koko` project in `vercel project ls`. The repo is PUBLIC and contains a couple's first names and a family surname in the page title and success page. Treated as private: no screenshots taken.
4. **`a-el-key` (private repo) has a plaintext admin password committed** in `implmentation_plan.txt` (tracked, touched by 9 commits), next to the client's phone and email. Value not reproduced here. Recommend rotating it and removing the file from history. Also: the landing page testimonials are hardcoded and their names were swapped across commits (`public/profile_images/*`), so verify they are real before reusing any of that text or those photos.
5. **`auto` (PUBLIC repo `HayGrouve/car-auto`) shares full git history with the PRIVATE vet-clinic repo `zoo`** (identical first commit 2025-09-25) and still tracks `public/logo.jpg`, which is the Алиса veterinary clinic logo (byte-identical to `zoo-alisa/public/logo.jpg`). So client code history and a client logo are effectively public. Recommend making `car-auto` private or re-creating it without the vet history.
6. **Personal data on public sites** (not a bug, but decide before putting screenshots on the hub): Chimney shows a sole trader's full name, a portrait photo and a mobile number; Stefi Auto Gas and a-el-key show business phone numbers in the hero/header; Iliaora shows the baker's first name in the page title; the wedding site shows the couple's first names in the header and the date; Chef's public home lists recipes by other real users and photos of unknown provenance (the tiramisu photo shows a third party's face).
7. **Old portfolio assets contain data to avoid reusing**: `portfolio/public/alisa.png` is a dashboard with person names (patient owners, unknown whether test data or real) and `portfolio/public/wedding.png` shows the couple's names and the RSVP date. The new hub captures avoid both.
8. **Auth-gated apps** (`onova-za-smetkata` home, `zoo-alisa`, `auto`) have no public product UI to capture. Smetkata's real product screens exist only as local, git-ignored prototype shots in `onova-za-smetkata/proto-shots.local/out/` and they contain real-looking names and receipt data (a restaurant, people's names). Not copied. A clean set needs a seeded demo bill.
9. **Chef AI/import content**: the home page photos come from imported recipes (unknown rights). Fine for a demo, worth checking before using the Chef screenshots as hero imagery.
10. Minor: Smetkata's OG image (`og-image.png`, teal gradient) predates the "live receipt" redesign (dark ink, vermilion accent) so the share card no longer matches the app. The Clerk card on the login page still says "Onova za Smetkata" in Latin.

## 3. Per-project sections

### onova-za-smetkata (Онова за сметката)

- **What it does:** Bulgarian mobile PWA where one person (the Host) scans a restaurant receipt, assigns items to people, and everyone at the table claims their own items from a share link and pays the Host via Revolut or IBAN. Source: `README.md` ("Mobile web PWA for splitting restaurant bills in Bulgarian. Create bills, assign items to participants, scan receipts with OCR, track payments, and share totals.").
- **For whom:** groups eating out in Bulgaria. Hosts sign in (Clerk), guests do not need an account (`README.md`: "Guests do not use Clerk or Stripe: they join via share link and pay the Host (Revolut/IBAN).").
- **Own or client:** own product. `docs/adr/0004-stripe-managed-payments.md`: "The owner sells as a Bulgarian freelancer, not a company." Planned paid tier "Host Pro" at 2.99 EUR/month or 29 EUR/year, but billing is off by default.
- **Git:** 316 commits, first 2026-07-07 ("Add bill splitter design spec and implementation plan."), last 2026-10-05 ("Keep keyboard focus and close the smaller gaps from QA"). Activity by month: 234 (Jul), 15 (Aug), 23 (Sep), 44 (Oct, so far). Current local branch `qa/fixes-from-audit`.
- **Live:** `https://www.onova-za-smetkata.com` returns 200; the SPA redirects signed-out visitors client-side to `/login?redirect=%2F`. Browser title: "Вход · Онова за сметката". Vercel project `onova-za-smetkata`, production deploy today; domain registered through Vercel (expires 2027-07-08).
- **GitHub:** PUBLIC, `https://github.com/HayGrouve/onova-za-smetkata` (no description set).
- **Stack (package.json):** TanStack Start 1.168 + TanStack Router, React 19.2, Vite 8, TypeScript 6, Tailwind 4, shadcn/Radix UI, Convex 1.32, Clerk (`@clerk/tanstack-react-start`, `@clerk/localizations`), Stripe 22, Sentry, `motion`, `qrcode`, `heic2any`, Vitest + Playwright + fast-check + convex-test, Knip. Fonts: Unbounded (display), Martian Mono (body), self-hosted with Cyrillic.
- **Language:** Bulgarian UI.
- **Interesting decisions:**
  1. Clerk Billing rejected for 3DS and currency reasons. `docs/adr/0003-stripe-billing-beside-clerk.md`: "Clerk Billing cannot prompt for 3DS and is USD-only, so Bulgarian/EU cards would fail."
  2. Merchant-of-record plus a kill switch. `docs/adr/0004-stripe-managed-payments.md`: "Billing switch. Convex env `BILLING_ENABLED=true` turns Host Pro on. Off (the default): `getEntitledTier` treats every Host as Pro, no quota error is thrown, and no paywall ... is rendered." Reasoning: selling as a freelancer would mean VAT and fiscal-document duties, so Stripe Managed Payments ("Sold through Link") is used at 3.5% extra.
  3. Webhook design: "Sync, not event replay ... verifies `Stripe-Signature` with Web Crypto (5-minute tolerance), records the event id once ..., and schedules `billingStripe.syncCustomer`, which lists the customer's subscriptions from Stripe ... Ordering and retries therefore cannot leave stale state." (ADR 0004).
  4. Concurrency by construction. `CONTEXT.md`, "Take a Unit": "the server picks the Unit, so two phones pressing „+“ at once never land on the same Unit." Cent remainders in splits go to earlier seats by `sortOrder` so previews and final totals agree.
  5. Presentation-only redesign. `docs/design/live-receipt.md`: "The ticker ... is derived on the client by diffing successive reactive snapshots ... There is no server-side activity log. You see what happens while you are watching."
- **Status guess:** live and still hardening (the last ~12 commits are QA-audit fixes; billing is off; ADR 0002 says "Pre-public: fresh Convex deployment acceptable"). Treat as "live, early".
- **Visual assets in repo (`public/`):** `og-image.png` 1200x630, `logo.png` 500x500, `icon-512.png` 512x512, `icon-192.png` 192x192, `apple-touch-icon.png` 180x180, `logo192.png`, `logo512.png`, `favicon.ico`. Copied here: `og-image.png`, `logo.png`. Local only, not copied: `proto-shots.local/out/*.png` (see flag 8).
- **Screenshots:** `desktop`, `mobile` show the branded login page (dark, Clerk card). No `detail`, because no public app UI exists.

### chef (CHEF, Your Personal Cookbook)

- **What it does:** online cookbook where you save or import recipes, plan the week, build a shopping list, search by the ingredients you have, and follow a distraction-free cook mode. Routes in `app/`: home, `create`, `import`, `meal-planner`, `pantry`, `shopping-list`, `recipe/[id]` + `/cook`, `profile/*`. AI (Gemini) is used for ingredient tagging, "Magic Fill" in the planner and "Organize" on the shopping list (`docs/UI_POLISH.md`, `convex/gemini.ts`).
- **For whom:** home cooks; one author and a few other users (public recipes by at least three different names).
- **Own or client:** own.
- **Git:** 81 commits, first 2025-11-19 ("Initial commit from Create Next App"), last 2026-10-05 (merge of PR #17, QA audit).
- **Live:** `https://armyant.app` 200, `https://chef-black.vercel.app` 200. Both serve the same app and the same title, "CHEF | Your Personal Cookbook" (the raw HTML contains two `<title>` tags, "CHEF | Home" then the cookbook one; the browser shows the latter). `armyant.app` is the Vercel production alias (`vercel project ls`) and is a Vercel-registered domain (expires 2027-02-24). `chef-black.vercel.app` is what the old portfolio links to.
- **GitHub:** PUBLIC, `https://github.com/HayGrouve/chef`.
- **Stack:** Next.js 16.0.10, React 19.2, Convex 1.29, Clerk (`@clerk/nextjs` 6), Tailwind 4, shadcn/Radix, `@dnd-kit`, `vaul`, `cmdk`, `canvas-confetti`, Vitest + convex-test. Both `package-lock.json` and `pnpm-lock.yaml` exist (lockfile drift).
- **Language:** English UI (recipes themselves can be Bulgarian).
- **Interesting decisions:**
  1. SSRF-safe recipe import. `docs/QA_REPORT.md`: every import fetch runs in a Node action (`convex/safeFetch.ts`) that "resolves DNS itself, refuses a host if *any* answer is a private or reserved IPv4/IPv6 address ..., and connects only to the address it checked, which defeats DNS rebinding. Redirects are followed by hand and every hop is re-checked."
  2. Object-level authorization bugs found by an agent-run QA pass. `docs/QA_REPORT.md`: "Private recipes leaked through favorites" and "Anyone could delete anyone's recipe photo", both P1 and fixed with `canReadRecipe` and a `by_storageId` index; "The regression suite is `pnpm test` (vitest + convex-test, 20 tests)."
  3. Cost control for AI. `convex/rateLimit.ts`: a fixed-window counter ("Mutations are serializable, so concurrent calls can't overspend"), 30 Gemini tagging calls per user per hour, 20 import fetches per 10 minutes.
  4. Delete cleanup moved to a background batched mutation: "a first, synchronous version could be made to exceed Convex's read limit, which made a recipe undeletable" (`docs/QA_REPORT.md`). Also `docs/UI_POLISH.md`: reversible actions got an Undo toast instead of a confirm dialog.
- **Status guess:** live, actively maintained (production deploy 22 minutes before this inventory; commits daily in the last week).
- **Visual assets:** `app/opengraph-image.png` 1200x800 (dark card, chef hat, "CHEF COOKBOOK, Personal cook book website."), `app/icon.svg` 512x512, `app/apple-icon.png` 180x180, `public/icons/icon-192|512.png` and maskable variants, `public/mission.png` 1024x1024. Copied: `opengraph-image.png`, `icon.svg`.
- **Screenshots:** `desktop`, `mobile` (home, sign-up banner dismissed), `detail` (desktop, the "Dessert" shelf, all recipes by the author).

### dial-in (Dial In)

- **What it does:** coffee grind-size journal. Photograph the bag, log shots per brew method, pin "the one" setting, so when you rebuy that coffee the number is waiting. Source: `README.md`.
- **For whom:** home espresso and filter coffee people (optional dial helper for the original Fellow Opus grinder).
- **Own or client:** own.
- **Git:** 15 commits, first 2026-09-25 ("Initial commit: Dial In coffee grind journal"), last 2026-10-05 ("Apply Web Interface Guidelines fixes").
- **Live:** `https://dial-in-three.vercel.app` 200, title "Dial In". Vercel project `dial-in`.
- **GitHub:** PUBLIC, `https://github.com/HayGrouve/dial-in` (description "Coffee grind journal: remember the grind size for every coffee you buy").
- **Stack:** Vite 8, React 19, TypeScript 6, Tailwind 4, Dexie 4 (IndexedDB), wouter, vite-plugin-pwa, Gemini API (label reading). No backend. Fonts Outfit + JetBrains Mono.
- **Language:** English UI.
- **Interesting decisions:**
  1. No backend at all. `README.md`: "All data stays on-device (IndexedDB); export/import a JSON backup in Settings." and "No environment variables are needed (label reading uses the API key you enter in the app's Settings)."
  2. Exact grinder maths. `src/lib/opus.ts`: "Grind sizes are kept as integer twelfths so the math stays exact." The inner ring shifts the outer scale by 1/6 of a number, reaching every 1/12; `opusPosition` picks the inner-ring setting that moves the least from where you left it.
  3. Label reading is non-destructive: "Only empty fields are filled, so nothing you've typed is overwritten." (`README.md`); Gemini is called with a JSON response schema (`src/lib/scan.ts`).
  4. PWA update path: `vercel.json` "keeps the service worker uncached so updates roll out" and rewrites all routes to the app so deep links survive reload (`README.md`).
- **Status guess:** live, new, active (3 PRs merged in the last 6 days, redesign "Night Shift" on 2026-10-01).
- **Visual assets:** `public/favicon.svg` 512x512, `icon-512.png`, `icon-192.png`, `icon-maskable-512.png`, `apple-touch-icon.png` 180x180. No og-image. Copied: `favicon.svg`, `icon-512.png`.
- **Screenshots:** `desktop`, `mobile` show the genuine first-run empty state of the live app. `detail` and `detail-mobile` show the shelf after importing a fictional backup (4 invented coffees and roasters) into the capture browser only, via the app's own Settings import; nothing was written to any server.

### repodeck (RepoDeck)

- **What it does:** desktop tool for a folder full of Git repositories: see which repos have changes, inspect diffs, stage, commit, switch branches, fetch/pull/push, "Fetch all" and "Pull all". Source: `README.md`.
- **For whom:** developers with many repos in one folder (the author's own workflow).
- **Own or client:** own.
- **Git:** 16 commits, first 2026-10-02 ("Initial commit"), last 2026-10-05 (merge of PR #2, perf audit). MIT licence declared in `Cargo.toml` while the GitHub repo is private.
- **Live:** none. Tauri v2 desktop app targeting Windows and macOS (`README.md`), no web URL. A browser "dev bridge" crate (`crates/repodeck-devbridge`) exists for development only.
- **GitHub:** PRIVATE, `https://github.com/HayGrouve/repodeck` (description "Lightweight source control for a folder full of Git repositories (Tauri v2 + React)").
- **Stack:** Rust workspace (edition 2024; `repodeck-core` with no Tauri dependency, `src-tauri`, `repodeck-devbridge`), Tauri 2, React 19, TypeScript 6, Vite 8, Tailwind 4, shadcn/Radix, TanStack Query, `@pierre/diffs`, `ts-rs` generated types, Vitest.
- **Language:** English UI.
- **Interesting decisions** (all `docs/ARCHITECTURE.md`):
  1. "Decision: Git CLI for all reads and writes." libgit2 "Fails to open" repos with `refStorage=reftable` / `objectFormat=sha256` (verified), ignores hooks, signing and `~/.ssh/config`; precedent cited: VS Code, GitHub Desktop, lazygit, GitKraken (migrated away from libgit2 in 2023).
  2. "Read-only commands add `--no-optional-locks` ... Verified: plain `git status` rewrites `.git/index`, which would retrigger the watcher in a loop."
  3. Rust owns repository status and pushes `repo-state` events; the React side uses TanStack Query only for request/response data. "Why TanStack Query and no Zustand."
  4. Types are generated from Rust (`ts_rs::TS`) into `src/types/generated`, so the IPC contract cannot drift.
- **Status guess:** building. MVP merged on 2026-10-05, then perf work; no installers or releases found.
- **Visual assets:** `docs/screenshot.png` 1440x860 (demo workspace `/tmp/repodeck-demo` built by `scripts/make-demo-workspace.sh`, fake repos named `api-server`, `web-app`, ..., no personal data), `src-tauri/icons/icon.png` 512x512, `icon.svg` 1024x1024, plus the standard Tauri icon set and `public/favicon.png` 32x32. Copied: screenshot as `desktop.png`, `icon.png`, `icon.svg`.
- **Screenshots:** `desktop` only (copied). No mobile (desktop app).

### camping (Ceko's Camping Checklist)

- **What it does:** packing checklist for camping trips (78 items in categories like "В палатката", "На открито", "Хигиена и тоалетни принадлежности"), with progress, jump-to-section and per-section reset; state saved in the browser.
- **For whom:** the author and friends; public tool, no accounts.
- **Own or client:** own.
- **Git:** 35 commits, first 2022-08-15 ("first commit"), last 2026-10-02 (merge of PR #2, "redesign/basecamp"). Two periods: Aug 2022 (8 commits, CRA original with a storage TTL) and Jun 2026 to Oct 2026 (27 commits).
- **Live:** `https://palatki.netlify.app/` 200, `server: Netlify`, title "Ceko's Camping Checklist". The URL comes from `public/index.html` (canonical, `og:url`), `public/sitemap.xml` and `robots.txt`; the repo has no `netlify.toml`, GitHub has no homepage set and no Pages site.
- **GitHub:** PUBLIC, `https://github.com/HayGrouve/camping`.
- **Stack:** Create React App (`react-scripts` 5, React 18, TypeScript 4.7), `motion`, Phosphor icons, Sofia Sans (self-hosted), `uuid`, `sharp` (image script). No package.json `homepage`.
- **Language:** Bulgarian by default with a БГ/EN toggle.
- **Interesting decisions:**
  1. Stable item IDs. `docs/superpowers/specs/2026-06-22-camping-i18n-design.md`: "State (item IDs + isChecked) lives in existing category `localStorage` keys. Text comes from locale maps at render time via merge. Switching language re-renders labels only." Runtime `uuidv4()` was replaced by fixed UUID constants (`src/data/item-ids.ts`) so ticks survive translation and redeploys.
  2. Same spec: "Always Bulgarian on first visit (no browser auto-detect)" and SEO/OG "Stay English-only".
  3. Hero image pipeline. `README.md`: `pnpm generate-hero-images` rebuilds photos from full-size originals into AVIF and JPG at three widths each for landscape and portrait (`public/images/camp-*-landscape-640|960|1440|1920`, `-portrait-720|1080|1440`); both photos are CC0, credited in the README.
  4. Static OG image rendered from `scripts/og-image.html` (1200x630) rather than generated at request time.
- **Status guess:** live, personal utility, lightly maintained but just redesigned.
- **Visual assets:** `public/og-image.png` 1200x630, `android-chrome-512x512.png`, `-192x192.png`, `apple-touch-icon.png` 180x180, favicons, hero JPG/AVIF set. Copied: `og-image.png`, `android-chrome-512x512.png`.
- **Screenshots:** `desktop`, `mobile` (hero card with tent photo plus the first checklist sections).

### zoo-alisa (Alisa, veterinary clinic CRM)

- **What it does:** clinic management: owners, animals, visits with SOAP notes, schedule, invoices, PDF documents (invoice, visit summary, vaccination certificate), dashboard with finance charts, global search (Ctrl/Cmd+Space). Source: `README.md`, `CONTEXT.md`.
- **For whom:** a veterinary clinic. The public login page and logo read "Ветеринарен кабинет Алиса" (logo file `public/logo.jpg`, 2048x1194).
- **Own or client:** client work (the old portfolio marks it `type: "client"`). Client identity beyond the clinic name is unknown.
- **Git:** 110 commits, first 2025-09-25 (T3 stack scaffold), last 2026-08-11. By month: Sep 2025 34, Oct 33, Nov 27, Dec 2, Feb 2026 7, May 2, Aug 5.
- **Live:** `https://alisa-vet.vercel.app` redirects to `/login`, 200, title "Alisa". Vercel project `alisa`; last production deploy 55 days before this inventory.
- **GitHub:** PRIVATE, `HayGrouve/zoo`.
- **Stack:** Next.js 15.2.8, React 19, Convex 1.27, custom JWT auth (`jose`, `bcryptjs`, httpOnly cookies; `README.md`), Tailwind 4, shadcn/Radix, `jspdf`, `recharts`, `react-day-picker`, `@t3-oss/env-nextjs`.
- **Language:** Bulgarian UI.
- **Interesting decisions:**
  1. `CONTEXT.md`: "Visit finalization ... Triggered explicitly by the clinician (`visits.finalize`) or as a side effect of invoice payment (`invoices.markPaid`). Independent events, either can happen first." A shared idempotent `completeVisit` module runs the side effects once.
  2. `CONTEXT.md`: "`invoices.create` recomputes line and invoice totals server-side, client-supplied totals are ignored." (shared `InvoiceDraft` module).
  3. `CONTEXT.md`: "Search normalization: Bulgarian Cyrillic/Latin matching via `shared/search.ts` ... Single source of truth for Convex list queries and frontend highlight." The old portfolio's challenge text: "The main technical challenge was the global search in the project. With one button you can search the entire database." / "Convex came into play; I indexed every table in the DB and based the search results on that."
  4. Commits `2026-02-03 Update currency from BGN to EUR across invoices` (euro changeover) and `2025-12-12 Fix React Server Components CVE vulnerabilities`; owners carry "GDPR consent, legal hold, soft delete" (`CONTEXT.md`).
- **Status guess:** live, in maintenance (bursts of work, last in August 2026).
- **Visual assets:** `public/logo.jpg` 2048x1194 (client logo), `public/favicon.ico` (422 KB). Copied: `logo.jpg` (client asset, confirm permission before showing).
- **Screenshots:** `desktop`, `mobile` of `/login`. It is clean but plain, and the main nav is rendered above the login card for signed-out users. Kept because it is the only public page.

### auto (Car Service CRM)

- **What it does:** CRM and workshop-operations app for car services (customers, vehicles, service visits, scheduling, invoices), refactored from the zoo vet CRM. `README.md`: "This repository is being **refactored** from a veterinary (“zoo”) product: domain names in code and routes still say owners/animals in places".
- **For whom:** car repair shops; no named client found in the repo. Unknown whether a real business uses it.
- **Own or client:** own, derived from client product code; client for the car version unknown.
- **Git:** 127 commits. First commit 2025-09-25 is inherited from `zoo` (same message and date). The car pivot starts 2026-05-12 ("refactor: transition from owner to customer and animal to vehicle management"). Last commit 2026-05-28 ("refactor: remove schedule settings module and related components").
- **Live:** `https://car-auto-murex.vercel.app` redirects to `/login`, 200, title "Car Service CRM". Vercel project `car-auto`, last production deploy 130 days before this inventory.
- **GitHub:** PUBLIC, `https://github.com/HayGrouve/car-auto` (see flag 5).
- **Stack:** Next.js 15.2.8, React 19, Convex 1.27, custom JWT, `motion` 12, `@dnd-kit`, `browser-image-compression`, `jspdf`, `recharts`, Tailwind 4, shadcn/Radix.
- **Language:** Bulgarian-first UI ("Клиенти", "Автомобили", "Посещения", "График", "Фактури").
- **Interesting decisions:**
  1. Auth hardening in the pivot: `feat(auth): migrate to RS256 JWT and production env validation` and `feat(convex): require authentication on all public functions` (both 2026-05-22), `feat(auth): wire httpOnly session to Convex client`; scripts `generate:jwt-keys`, `derive:jwt-public-key`, `export:jwks-data-uri`.
  2. Schedule rebuilt as a day view with calendar kinds and customer/vehicle pickers (`2026-05-14`), then the settings module was removed again on 2026-05-28.
  3. Honest "mid-refactor" state: module names still say animals (README). Not a polished product.
- **Status guess:** experiment, paused (no commits since 2026-05-28, no deploy since ~2026-05-28).
- **Visual assets:** `public/logo.jpg` 2048x1194, which is the Алиса vet logo (identical bytes to zoo), and `favicon.ico`. Not copied, wrong brand. The live login page header shows a broken logo image: the Next image optimizer fetches `/logo.jpg` and gets a 307 redirect to `/login` because the auth middleware also guards static assets for signed-out users.
- **Screenshots:** none kept. The login page was captured and deleted: broken logo and the full nav showing signed-out.

### marketing-auto (Stefi Auto Gas site)

- **What it does:** Bulgarian marketing site for a car service in Lovech: annual technical inspection (ГТП), LPG/CNG gas systems, repairs, contact with call and Viber buttons. Routes `/`, `/gtp`, `/gaz`, `/remonti`, `/kontakti` (`README.md`).
- **For whom:** customers in Lovech; the business is "Stefi Auto Gas" (public on the site, `README.md` and the specs).
- **Own or client:** client work. Handed off: `docs/deploy-vercel.md` ("deploying this repo to the **client's Vercel account** on `stefi-gas.com`"), git remote `client` points at `steffannita/car-workshop` (PUBLIC, client's GitHub account), and the commit "chore: remove developer-only files from client handoff".
- **Git:** 61 commits, first 2026-06-11 ("Add TanStack Start scaffold, agent skills, and Lovech site planning docs."), last 2026-08-04. Remotes: `origin` = `HayGrouve/car-auto-marketing` (PUBLIC), `client` = `steffannita/car-workshop` (PUBLIC).
- **Live:** `https://stefi-gas.com` redirects to `https://www.stefi-gas.com/`, 200, title "Начало | Stefi Auto Gas". Hosted outside the author's Vercel team (not in `vercel project ls`), consistent with the client's account.
- **Stack:** TanStack Start 1.168 + Router, React 19, Vite 8, TypeScript 6, Tailwind 4, shadcn/Radix, Nitro, Vitest + Playwright smoke tests, `sharp` image scripts. Project name in package.json is `marketing-auto`.
- **Language:** Bulgarian UI.
- **Interesting decisions:**
  1. Context-aware phone routing. `docs/superpowers/specs/2026-07-22-stefi-auto-gas-content-swap-design.md`: `contact.lines[]` plus a `resolveContactLine()` helper, three physical lines (service, inspections, gas); "Viber hrefs: Context-aware - matches the active phone on each page"; the gas number appears only on Контакти in the UI "but in JSON-LD for SEO".
  2. `CONTEXT.md`: "`pageRegistry` in `site-content.ts` - single lookup for hero, SEO, contact context, and service layout per path."
  3. SEO files are generated at build: `prebuild` runs `scripts/generate-seo-files.mjs` from `VITE_SITE_URL` (sitemap and robots) (`README.md`). Commit "add catalog split image maps with module-load validation" fails the build if an image mapping is missing.
  4. Hosting moved Netlify to Vercel on 2026-08-04 ("feat: migrate project from Netlify to Vercel"), with a client runbook (`docs/deploy-vercel.md`). The project began as a generic "Lovech car service" site and was later swapped to the client's real content.
- **Status guess:** live and delivered; no work since the 2026-08-04 handoff.
- **Visual assets:** `public/logo.png` 1254x1254 (825 KB), `logo192.png`, `logo512.png`, `favicon.ico` 32x32, section images `public/images/gtp-section.png`, `repairs-section.png`, `trust-section.png` (1024x1024), `hero.jpg` 1247x921 (the hero shows a Bosch Car Service sign, a third-party brand). No og-image file. Copied: `logo.png`.
- **Screenshots:** `desktop`, `mobile` (home hero, which includes the business phone number and the Bosch sign).

### torta (Iliaora)

- **What it does:** single-page Bulgarian marketing site for a made-to-order sweets business in Sofia (cakes, donuts, occasion cakes). Visitors call or message on Viber; photos are linked to Instagram. No shop and no stored orders (`CONTEXT.md`).
- **For whom:** adults in Sofia ordering sweets for themselves or small occasions, and people planning a wedding/large celebration cake.
- **Own or client:** client work. Business name Iliaora (public on the site); the baker appears by first name only ("сладкиши от Илияна" in the page title). `CONTEXT.md` says "Torta (repo only)" is not a public name.
- **Git:** 13 commits, all on 2026-08-18 (first "first commit", last "Remove redundant margin from "За нас" paragraph ...").
- **Live:** `https://iliaora.com` 200, title "Iliaora (em-dash) сладкиши от Илияна". Vercel project `torta`, domain registered through Vercel (expires 2027-08-18), last production deploy 48 days before this inventory.
- **GitHub:** PUBLIC, `https://github.com/HayGrouve/torta`.
- **Stack:** TanStack Start (`latest`) + Router, Nitro, React 19, Vite 8, TypeScript 6, Tailwind 4, shadcn/Radix, Vitest.
- **Language:** Bulgarian UI.
- **Interesting decisions:**
  1. Previews are not indexed: commit "Prove Vercel preview hosts are noindex at the public document seam"; `src/marketing/document-head.ts` has `isPreviewHost()` = `process.env.VERCEL_ENV === "preview"` and `tests/marketing-document.test.ts` asserts it.
  2. Conversion by phone only. `CONTEXT.md`, "Inquiry": "A call or Viber message to the baker ... There is no street address on the marketing site." with `_Avoid_: form, email, WhatsApp, checkout, public address`.
  3. Photo policy. `CONTEXT.md`, "Still": "They show the sweets only, not faces, tables, or a portrait of the baker." (four stills: full-bleed, торти, донъти, торти за повод).
  4. Spec-first: the glossary and a "UX wayfinder map" were committed before the site ("Record the locked marketing-site glossary on main"); JSON-LD `Organization` with `areaServed` Sofia and `inLanguage: bg-BG`.
- **Status guess:** live and delivered (single-day build). `CONTEXT.md` calls the business "The forthcoming offering", so the client may still be launching.
- **Visual assets:** `public/stills/full-bleed.jpg` 1600x1067 (this is the `og:image` / twitter image), `torti.jpg` 1600x1177, `donti.jpg` 1600x2000, `povod.jpg` 1600x2133. No logo file (wordmark is text). Copied: `full-bleed.jpg`.
- **Screenshots:** `desktop`, `mobile`.

### a-el-key (Мебели на Андрей Какрински)

- **What it does:** Bulgarian furniture-maker site with a product catalog (categories, featured products, product pages with gallery), contact dialog and Viber button, an About page, and a password-protected admin to manage products and photos. In the admin, an AI action looks at a product photo and proposes a name, description and category (Google Gemini).
- **For whom:** people in the Sofia area ordering made-to-measure furniture.
- **Own or client:** client work for the furniture maker; his name is public on the site (title "Начало | Андрей Какрински").
- **Git:** 31 commits, first 2025-12-15, last 2026-07-30 ("Update AI model in product info generation: Switch from gemini-2.0-flash to gemini-3.5-flash for improved reliability ...").
- **Live:** `https://www.a-el-key.com` 200, title "Начало | Андрей Какрински". Vercel project `a-el-key`; domain registered at a third party with Vercel nameservers; last production deploy 67 days before this inventory.
- **GitHub:** PRIVATE, `HayGrouve/a-el-key`.
- **Stack:** Next.js 15.2 (the plan file says 16, outdated), React 19, Convex 1.31 (database and file storage), Tailwind 4, shadcn/Radix, `react-hook-form` + Zod, `react-dropzone`, `browser-image-compression`, `@t3-oss/env-nextjs`, Google Gemini via a Convex action.
- **Language:** Bulgarian only.
- **Interesting decisions:**
  1. `convex/ai.ts` gates the Gemini action with a shared secret (`AI_SECRET_TOKEN`) and a rolling daily cap: `usageCount >= 50` -> "Дневният лимит за AI генериране е достигнат (50/ден)". Usage is recorded in an `ai_usage` table (`convex/usage.ts`).
  2. The prompt asks Gemini to answer as "професионален български дърводелец" and to pick the category from a fixed Bulgarian list (Кухни, Спални, Всекидневни, Детски стаи, Антрета, Гардероби, Тоалетки, Масив, Офиси, Други) and return JSON only.
  3. "Simple Password Authentication (no Clerk)" for the admin: cookie session checked in `src/middleware.ts` for `/admin/*` except `/admin/login` (`implmentation_plan.txt`). Images are compressed in the browser before upload to Convex storage; at least one image is required before AI generation is allowed.
  4. Built from a 13-phase written plan, phases flagged DONE in commits ("Mark Phase 10-13 as DONE"). Featured products capped at 6 (was 8).
- **Status guess:** live and delivered; last change 2026-07-30 (model bump).
- **Visual assets:** `public/logo.png` 3067x2477 (company mark), `viber.png` 512x512, `android-chrome-512x512.png`, `-192x192.png`, `apple-touch-icon.png` 180x180, favicons, `profile_images/*.jpg` (andi.jpg, georgi.jpg, kalin.jpg, katerina.jpg, mariana.jpg; testimonial and owner portraits). No og-image file. Copied: `logo.png`.
- **Screenshots:** `desktop`, `mobile` (home hero with the phone number and "Заявете оферта" button).

### chimney (Коминочистач)

- **What it does:** Bulgarian brochure site for a chimney-cleaning and chimney-repair service in Sofia (cleaning, unblocking, repair, chimney caps), with services and photo gallery (lightbox), and a contact page. Routes `/`, `/about`, `/contact` (`public/sitemap.xml`).
- **For whom:** homeowners in Sofia.
- **Own or client:** unknown. Probably client work for the named sole trader shown on the site (his full name and portrait are the brand); the repo has no statement either way.
- **Git:** 8 commits, first 2020-11-21 ("Initialize project using Create React App"), 2021-11-25 "more images", rebuilt 2026-06-23 (CRA + Bootstrap to Vite + React 19 + TypeScript + shadcn/ui), redesigned 2026-09-24 ("ember theme") and simplified 2026-09-25.
- **Live:** `https://komini-sofia.com` 200, `server: Netlify`, title "Коминочистач | Почистване и отпушване на комини". URL from `index.html` canonical, `sitemap.xml`, `robots.txt`; deploy host from the response header and `public/_redirects` (`/*    /index.html   200`). Not in the author's Vercel team.
- **GitHub:** PUBLIC, `https://github.com/HayGrouve/Chimney`.
- **Stack:** Vite 6, React 19, TypeScript 5.7, Tailwind 4, shadcn/ui (Radix + `@base-ui/react`), `react-router-dom`, `react-icons`, Manrope + Unbounded fonts. Node 24 (`.nvmrc`).
- **Language:** Bulgarian UI.
- **Interesting decisions:**
  1. Toolchain migration plan: `docs/superpowers/plans/2026-06-23-chimney-modernization.md`: "Migrate the Kominochistach brochure site from CRA + Bootstrap to Vite + React 19 + TypeScript + shadcn/ui on Node 24 LTS ... remove all CRA/Bootstrap/jQuery artifacts."
  2. SEO in a static SPA: JSON-LD `LocalBusiness`, canonical, OG/Twitter in `index.html`, static `sitemap.xml`/`robots.txt`, Netlify SPA fallback via `_redirects`; commit 2026-09-24 "fix per-page SEO".
  3. Gallery images are centralized in `src/data/gallery-images.ts` (21 image imports with alt text) and shown in a Dialog lightbox.
  4. A 2020 site that was left alone for years and fully modernized in one week in Sep 2026.
- **Status guess:** live, maintained (two redesign commits in the last 2 weeks).
- **Visual assets:** `public/og-image.jpg` 1200x630, `apple-touch-icon.png` 180x180, `favicon.png` 32x32, `src/assets/images/logo.jpg` 300x300, 25 JPGs in `src/assets/images/` (21 gallery images, hero, logo and a selfie of the owner). Copied: `og-image.jpg`, `logo.jpg`.
- **Screenshots:** `desktop`, `mobile`. On desktop the hero is 655 px tall, so the lower 245 px of the 1440x900 shot is the dark page background (next section reveals on scroll).

### koko (wedding photo upload and private gallery)

- **What it does:** guests upload photos from a wedding day (up to 10 per upload, 256 MB each) through a public page; the couple review, remove and download all photos as a zip from a password-gated `/admin` gallery. `CONTEXT.md`: "Guests send photos from the wedding day. The couple review those photos later in a private admin gallery."
- **For whom:** one specific couple and their guests (page title and success page carry their first names and a family surname, in Bulgarian).
- **Own or client:** unknown, most likely a favour or private commission; no business name.
- **Git:** 22 commits, first 2026-04-22 ("Initial commit from Create Next App"), last 2026-09-06 ("Let the browser take the archive attachment instead of loading it in a hidden iframe.").
- **Live:** no. `https://koko-kappa-nine.vercel.app` (GitHub homepage) returns 404 `DEPLOYMENT_NOT_FOUND` and the project is not in the author's Vercel list. The two most recent GitHub Deployment records are from 2026-09-06 (Production, via the Vercel integration).
- **GitHub:** PUBLIC, `https://github.com/HayGrouve/koko` (see flag 3).
- **Stack:** Next.js 16.2.4, React 19.2, UploadThing 7 (storage), Tailwind 4, Vitest. No database. `vercel.json` sets `{"fluid": true}`.
- **Language:** Bulgarian UI.
- **Interesting decisions:**
  1. No accounts. `CONTEXT.md`: "Gate: The password check that admits someone to the admin gallery. There are no accounts." Session is an HMAC-signed cookie `koko_admin`, 7 days, compared with `timingSafeEqual` (`lib/admin-session.ts`).
  2. Hand-written streaming ZIP writer (`lib/zip-store-stream.ts`, store method with data descriptors) so a gallery of large photos can be downloaded without buffering; route has `maxDuration = 300`. Fix commits: "Keep zip CRC unsigned so archive downloads do not abort mid-stream." and the iframe-to-attachment change.
  3. Upload limits tuned in the field: "Raise guest upload limits to 50 photos and 256 MB" (2026-08-25) then "Lower guest photo upload count from 50 to 10" (2026-08-26); limits live in one constants file shared by UI copy and server.
  4. Removal needs an in-app confirmation, not `window.confirm` (`CONTEXT.md`, "Confirmation").
- **Status guess:** archived. Event-driven tool; the Vercel project appears deleted.
- **Visual assets:** none (only default Next.js SVGs and `favicon.ico`).
- **Screenshots:** none, by instruction (private by nature, admin gallery never captured; landing is not live anyway).

### paradise-hotel (Paradise Deluxe Apartments)

- **What it does:** bilingual (English and Bulgarian) website for "Paradise Deluxe Apartments": home, rooms (budget, standard, deluxe, business) and contact page with a Google Maps embed for Nea Peramos, Greece. Tagline: "Your perfect escape where luxury meets comfort."
- **For whom:** holiday guests; the Bulgarian locale suggests Bulgarian visitors.
- **Own or client:** unknown. Real-business details (address area, rooms) suggest client or prospect work; no client named in the repo.
- **Git:** 13 commits, first 2025-04-27, last 2025-05-26 ("Add react-swipeable dependency, update image components to use Next.js Image ...").
- **Live:** no deployment found: not in `vercel project ls`, GitHub homepage is null, README is the untouched T3 boilerplate. Note that `https://paradise-hotel.vercel.app` responds 200 but it is someone else's "Paradise Resort" site (Indonesian copy), not this project. `docs/research/` is an empty directory.
- **GitHub:** PUBLIC, `https://github.com/HayGrouve/paradise-hotel`.
- **Stack:** Next.js 15.2 (T3 app), React 19, Tailwind 4, `framer-motion` 12, `react-swipeable`, shadcn button, `@t3-oss/env-nextjs`, Zod.
- **Language:** English default, Bulgarian via a language switcher.
- **Interesting decisions** (thin evidence):
  1. Locale routing in middleware: `src/lib/i18n/config.ts` has `locales = ["en","bg"]`, `defaultLocale = "en"`; routes live under `src/app/[locale]/` with `generateStaticParams`.
  2. All room imagery is WebP (`public/images/*.webp`, 1974-2073 px wide) and shown through `next/image` with swipeable galleries (`ProductImages.tsx`, last commit).
  3. Hand-rolled i18n dictionaries instead of a library (commit "Implement multi-language support and create core pages").
- **Status guess:** archived or abandoned (one month of work in spring 2025, nothing since, never deployed as far as can be shown).
- **Visual assets:** `public/images/logo.svg` 500x500 (416 KB), `hero.webp` 2070x1380, `about-us-lobby.webp`, `contact-hero.webp`, `bg-footer.webp`, four room WebPs. Copied: `logo.svg`.
- **Screenshots:** none (no live URL).

### wedding (wedding RSVP site, repo `HayGrouve/wedding`, no local folder)

- **What it does:** Bulgarian wedding site with a video hero, program, details, a countdown, a photo gallery and an RSVP form (attendance, +1, children, menu, allergies) plus an admin dashboard to manage RSVPs. Source: GitHub README and `package.json` read through `gh api`.
- **For whom:** a couple and their guests.
- **Own or client:** client/personal work for the couple (old portfolio: `type: "client"`). Their first names are in the site header, the page title, the GitHub README and the domain name.
- **Git (GitHub API):** 60 commits, first 2025-06-06, last 2025-12-12. Repo created 2025-06-06.
- **Live:** custom domain `anisvatbageorgi.fun` is dead (see flag 2). `https://wedding-delta-drab.vercel.app` (repo homepage, Vercel alias of project `wedding`) still returns 200 with the couple's names in the title. The wedding date shown is 13.12.2025 (past) and the RSVP deadline 15.11.2025.
- **GitHub:** PUBLIC, `https://github.com/HayGrouve/wedding`.
- **Stack:** Next.js 15.3, React 19, Tailwind, shadcn/Radix, `react-hook-form` + Zod, Redis (`redis` 5) for RSVPs, `jose` (admin JWT), TanStack Table, `papaparse` + `xlsx` (exports), `plaiceholder` (blur placeholders), SWR, Playfair Display + Inter. Env var names in `DEPLOYMENT.md`: `REDIS_URL`, `ADMIN_PASSWORD`, `JWT_SECRET` (values not seen).
- **Language:** Bulgarian UI.
- **Interesting decisions** (from `package.json` and README only, no ADRs):
  1. Redis as the only store, so no schema or migrations for a short-lived event site.
  2. RSVPs can be exported to CSV and Excel for the caterer (`papaparse`, `xlsx`).
  3. Old portfolio texts (`portfolio/src/lib/data.ts`): description "Wedding invitation and organizational system. You can RSVP and manage your guests from the website.", challenge "The main challenge was getting the bride to be happy with the look of the website.", solution "Solved through patience, iterative design, and clear communication. Also, I used a lot of animations to make the website more engaging."
  4. README inconsistency: it names a groom differently from the live site (README vs title).
- **Status guess:** archived. Event finished, domain expired, only the `*.vercel.app` alias remains.
- **Visual assets in repo (via API):** `public/logo.png` (couple monogram, 154 KB), `android-chrome-*.png`, `hero-placeholder.webp`. No og-image. Not copied.
- **Screenshots:** `desktop`, `mobile` of the RSVP section (empty form, no guest data). The home-page hero was captured first and rejected: it is a YouTube embed with player chrome and a visible face.

### portfolio (old portfolio, not a project card)

- **What it is:** Next.js 15 one-pager for Tsvetomir Tsekov, "Senior Full Stack Developer", with Work, Experience, Skills, Testimonials. Only three projects listed: Alisa, Wedding, Chef.
- **Git:** 27 commits, first 2025-02-18, last 2026-09-24 (merge of PR #2, "redesign"). PUBLIC `https://github.com/HayGrouve/portfolio`. Vercel project `portfolio`.
- **URL:** `https://www.tseko.site` is dead (flag 1); `https://portfolio-haygrouves-projects.vercel.app` and `...-git-main-...` return 200.
- **Existing project copy in `src/lib/data.ts`:**
  - Alisa (client): "Vet clinic CRM. Keep track of animals, owners, visits and medical history, invoice generation/finance dashboard." Challenge: "The main technical challenge was the global search in the project. With one button you can search the entire database." Solution: "Convex came into play; I indexed every table in the DB and based the search results on that." Tech: Next.js, Convex, Shadcn/ui. Link `alisa-vet.vercel.app/login`, GitHub `HayGrouve/zoo` (a private repo, so the link 404s for visitors).
  - Wedding (client): copy above; tech Next.js, TailwindCSS, Redis.
  - Chef (personal): "Online cook book that helps you cook your favorite recipes. Create a weekly meal plan and do your shopping list." Challenge: "Creating a distraction-free UI for cooking." Solution: "Multi-step wizards help a lot when navigating users through a big set of data." Tech list says "Next.js, Home Cook, Clerk" (omits Convex; "Home Cook" looks like a slip). Links to `chef-black.vercel.app`, not `armyant.app`. Note: the Chef create form is now a single scrolling form (the multi-step wizard was collapsed in `docs/UI_POLISH.md` round 2), so that solution text is out of date.
  - Experience listed: ZETTAHOST.bg (Feb 2026 to present), ScaleHub (Mar 2023 to Dec 2025), Devexperts, Nemetschek.
- **Existing images:** `public/og-image.jpg` 1777x1070, `alisa.png` 1023x829, `chef.png` 1513x910, `wedding.png` 1111x908, `logo.png` 205x190, favicons (see flag 7 for the data in `alisa.png` and `wedding.png`).

## 4. Hosting and domain facts (Vercel CLI, 2026-10-05)

| Vercel project | Latest production URL | Last update |
|---|---|---|
| chef | `https://armyant.app` | 22 min |
| onova-za-smetkata | `https://www.onova-za-smetkata.com` | 12 h |
| dial-in | `https://dial-in-three.vercel.app` | 12 h |
| portfolio | `https://www.tseko.site` (dead domain) | 11 d |
| torta | `https://iliaora.com` | 48 d |
| alisa | `https://alisa-vet.vercel.app` | 55 d |
| a-el-key | `https://www.a-el-key.com` | 67 d |
| car-auto | `https://car-auto-murex.vercel.app` | 130 d |
| wedding | `https://www.anisvatbageorgi.fun` (dead domain) | 132 d |

No Vercel project exists for `koko`, `paradise-hotel`, `camping` (Netlify), `chimney` (Netlify), `marketing-auto` (client's account) or `repodeck`. Domains held in the team: `iliaora.com`, `onova-za-smetkata.com`, `armyant.app` (registered via Vercel); `a-el-key.com`, `anisvatbageorgi.fun`, `tseko.site`, `vkusotiiki.pro`, `vkusotiiki.com` (third-party registrars, the last four with unknown purpose).

## 5. Live URL probe results (`curl -sIL`, plus browser title where `<title>` was set client-side)

| URL | final URL | status | title |
|---|---|---|---|
| `https://www.onova-za-smetkata.com` | same (client redirect to `/login?redirect=%2F`) | 200 | Вход · Онова за сметката |
| `https://armyant.app` | same | 200 | CHEF \| Your Personal Cookbook |
| `https://chef-black.vercel.app` | same | 200 | CHEF \| Your Personal Cookbook |
| `https://dial-in-three.vercel.app` | same | 200 | Dial In |
| `https://palatki.netlify.app/` | same | 200 | Ceko's Camping Checklist |
| `https://alisa-vet.vercel.app` | `/login` | 200 | Alisa |
| `https://car-auto-murex.vercel.app` | `/login` | 200 | Car Service CRM |
| `https://stefi-gas.com` | `https://www.stefi-gas.com/` | 200 | Начало \| Stefi Auto Gas |
| `https://iliaora.com` | same | 200 | Iliaora (em-dash) сладкиши от Илияна |
| `https://www.a-el-key.com` | same | 200 | Начало \| Андрей Какрински |
| `https://komini-sofia.com` | same | 200 | Коминочистач \| Почистване и отпушване на комини |
| `https://wedding-delta-drab.vercel.app` | same | 200 | (couple's names) |
| `https://portfolio-haygrouves-projects.vercel.app` | same | 200 | not recorded |
| `https://www.anisvatbageorgi.fun` | n/a | no DNS (NXDOMAIN) | n/a |
| `https://www.tseko.site` | n/a | no DNS (NXDOMAIN) | n/a |
| `https://koko-kappa-nine.vercel.app` | same | 404 `DEPLOYMENT_NOT_FOUND` | n/a |

(Iliaora's real title uses an em-dash between "Iliaora" and the Cyrillic text; it is written out as "(em-dash)" here to keep this file em-dash free.)

## 6. Files saved in `/home/tsvetomir/projects/onova-za/public/projects/`

Every PNG has a `.webp` twin (quality 82). Sizes in KB:

| file | pixels | PNG | WebP |
|---|---|---|---|
| a-el-key/desktop | 1440x900 | 658.3 | 50.2 |
| a-el-key/mobile | 780x1688 | 830.1 | 75.1 |
| a-el-key/logo (copied) | 3067x2477 | 86.6 | 107.7 |
| camping/desktop | 1440x900 | 546.3 | 71.7 |
| camping/mobile | 780x1688 | 563.4 | 67.9 |
| camping/og-image (copied) | 1200x630 | 257.8 | 45.4 |
| camping/android-chrome-512x512 (copied) | 512x512 | 49.6 | 13.2 |
| chef/desktop | 1440x900 | 621.2 | 89.2 |
| chef/mobile | 780x1688 | 525.9 | 88.2 |
| chef/detail | 1440x900 | 1178.3 | 153.9 |
| chef/opengraph-image (copied) | 1200x800 | 1039.3 | 22.4 |
| chimney/desktop | 1440x900 | 957.9 | 54.2 |
| chimney/mobile | 780x1688 | 845.7 | 65.6 |
| dial-in/desktop | 1440x900 | 30.1 | 13.3 |
| dial-in/mobile | 780x1688 | 57.9 | 24.9 |
| dial-in/detail | 1440x900 | 71.8 | 19.7 |
| dial-in/detail-mobile | 780x1688 | 171.0 | 31.9 |
| dial-in/icon-512 (copied) | 512x512 | 23.0 | 9.2 |
| marketing-auto/desktop | 1440x900 | 892.1 | 96.5 |
| marketing-auto/mobile | 780x1688 | 608.4 | 72.2 |
| marketing-auto/logo (copied) | 1254x1254 | 825.2 | 23.6 |
| onova-za-smetkata/desktop | 1440x900 | 80.4 | 35.2 |
| onova-za-smetkata/mobile | 780x1688 | 161.6 | 52.4 |
| onova-za-smetkata/og-image (copied) | 1200x630 | 173.2 | 21.9 |
| onova-za-smetkata/logo (copied) | 500x500 | 240.7 | 23.2 |
| repodeck/desktop (copied from `docs/screenshot.png`) | 1440x860 | 76.6 | 29.3 |
| repodeck/icon (copied) | 512x512 | 28.4 | 8.3 |
| torta/desktop | 1440x900 | 967.5 | 84.2 |
| torta/mobile | 780x1688 | 771.7 | 66.0 |
| wedding/desktop | 1440x900 | 97.7 | 44.6 |
| wedding/mobile | 780x1688 | 105.1 | 49.2 |
| zoo-alisa/desktop | 1440x900 | 29.7 | 11.8 |
| zoo-alisa/mobile | 780x1688 | 37.8 | 12.9 |

Totals: 33 PNGs 13,610 KB, 33 WebPs 1,635 KB. Non-PNG copies (originals kept as is): `chef/icon.svg`, `dial-in/favicon.svg`, `repodeck/icon.svg`, `paradise-hotel/logo.svg` (416 KB), `chimney/og-image.jpg` (1200x630), `chimney/logo.jpg` (300x300), `torta/full-bleed.jpg` (1600x1067), `zoo-alisa/logo.jpg` (2048x1194). The `a-el-key/logo` WebP is larger than its PNG (line-art logo), so use the PNG there.

No files exist for `koko`, `paradise-hotel` (other than the logo), `auto`.

## 7. Judgement calls made during capture

- **smetkata, zoo-alisa:** only a login page is public. Smetkata's is branded and kept. Alisa's is plain but clean and kept (nav links appear above the card for signed-out users, a small UX bug worth fixing).
- **auto:** login page rejected (broken logo, same nav oddity) and the files were deleted.
- **dial-in `detail`:** produced with invented sample data (fictional roasters) imported into the capture browser only. Label it as a demo if used on the hub.
- **chef `detail`:** the recipe-page capture was rejected because the photo contains a third party's face; the "Dessert" shelf was used instead (the tiramisu card still shows a cropped face at the top left of its photo).
- **wedding:** hero rejected (YouTube player chrome, person visible); RSVP section used, same view the old portfolio showed. The header still shows the couple's names.
- **chimney:** captured as the site renders; it shows the owner's portrait and phone number.

## 8. Recommendations for the hub

| slug | recommendation | why |
|---|---|---|
| `onova-za-smetkata` | list publicly, with live link and GitHub link | own flagship, public repo, live. Replace the login screenshots with seeded app screens when available |
| `chef` | list publicly, link to `armyant.app` (not the vercel.app alias) | own, live; mind image provenance |
| `dial-in` | list publicly, with link and GitHub | own, live, public |
| `repodeck` | list without link (or "in development") | private repo, no web URL; demo screenshot is safe |
| `camping` | list publicly, with link | own, live, nice visuals |
| `zoo-alisa` | list without link; show the client name only if she or he agrees | login-only app holding patient and owner data; repo private |
| `auto` | hide for now | paused, mid-refactor, shares history with a private client repo, broken login logo |
| `marketing-auto` | list publicly with link | public client marketing site; business name and phones are already public |
| `torta` | list publicly with link | public client site |
| `a-el-key` | list publicly with link, no GitHub link | public client site, private repo; rotate the committed password |
| `chimney` | list with link after the owner agrees | personal portrait and phone on the site; own-vs-client status unclear |
| `koko` | hide (or anonymous case study without link, name or screenshots) | private event, deployment gone, public repo names the couple |
| `paradise-hotel` | hide | no deployment, no evidence of delivery, 2025 only |
| `wedding` | list without link or hide; if shown, crop out the header names | domain expired, couple's names and date are in the page, event finished |
