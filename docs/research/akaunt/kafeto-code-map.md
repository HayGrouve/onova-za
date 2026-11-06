# What Кафето's code needs for the move from Dial In

Research for [#41](https://github.com/HayGrouve/onova-za/issues/41) on map [#12](https://github.com/HayGrouve/onova-za/issues/12). Feeds [Migration plan for Онова за кафето (#35)](https://github.com/HayGrouve/onova-za/issues/35). Written 2026-11-06.

Builds on, and does not redo:

- [#16 findings](https://github.com/HayGrouve/onova-za/blob/research/dial-in-data-move/docs/research/akaunt/dial-in-data-move.md) (Dial In's storage, backup and service worker at `049eec2`) and the owner's decision there: manual JSON export in Dial In, import in Кафето, then a plain 308.
- [#17](https://github.com/HayGrouve/onova-za/issues/17) as updated 2026-10-19: online only, the log lives in Кафето's own Convex, keeping a log needs the Акаунт; Gemini key and appearance stay on the device; no payments.
- [#21 findings](https://github.com/HayGrouve/onova-za/blob/research/kafeto-sync/docs/research/akaunt/kafeto-sync.md): only its Convex facts (limits, file storage, ids) still apply. The sync design (outbox, tombstones, `seq` cursor, Dexie kept) is out of scope because offline was dropped.
- [#14](https://github.com/HayGrouve/onova-za/issues/14) (key by Clerk `subject`, own `user.deleted` endpoint), [#24](https://github.com/HayGrouve/onova-za/issues/24) (`customJwt` plus `azp` check), [#18](https://github.com/HayGrouve/onova-za/issues/18) and [#19](https://github.com/HayGrouve/onova-za/issues/19) (`/vhod`, avatar menu with only "Акаунт" and "Изход"), [#20](https://github.com/HayGrouve/onova-za/issues/20) (settings → "Данни"), [#26 findings](https://github.com/HayGrouve/onova-za/blob/research/production-checklist/docs/research/akaunt/production-checklist.md) (env names, Convex team), [#29 findings](https://github.com/HayGrouve/onova-za/blob/research/old-domain-redirects/docs/research/akaunt/old-domain-redirects.md) (the `dial-in-three.vercel.app` routing rule).

Read-only. Sources: `~/projects/dial-in` at `9464567` (= `origin/main`, 15 commits after the `049eec2` the earlier findings read; the newer ones add Finish/Restock with undo, the "Welcome back" sheet and a toast, and change no storage), the hub at `ed501fa`, Сметката and Клиентите checkouts for comparison, `vercel project inspect dial-in`, `vercel env ls --project dial-in` (names only), `vercel ls dial-in --prod`, `vercel project ls`, GitHub deployments API, `curl` of the live manifest, the npm registry and the `@clerk/react@6.18.6` tarball, Clerk and Convex docs fetched as Markdown on 2026-11-06. No user data was read (it lives on the owner's devices only). Nothing was deployed or changed.

Tags: **[code]** read in source. **[live]** read from a live system. **[docs]** primary vendor docs (linked). **[source]** vendor package source. **[design]** a proposal for the plan. **[unverified]** reasoned or not checked.

## 0. Answer in short

1. **Data is two Dexie tables plus five localStorage keys.** IndexedDB `dial-in` v3 holds `coffees` (with the one bag photo as a Blob) and `brews`. There is no equipment or settings store: grinder, Opus switch, Opus inner ring, theme and Gemini key are localStorage. In Convex this becomes `coffees`, `brews`, one `equipment` row per person and `processedWebhookEvents`, every row with `ownerSubject`, photos in file storage. About 10 write sites and 8 live reads change from Dexie to Convex; `dexie` and `dexie-react-hooks` go.
2. **The export is `{ app: 'dial-in', version: 1, exportedAt, coffees, brews, grinder }`**, photos as base64 data URLs. Кафето's import reads it in the browser, uploads each photo to Convex storage, then sends batches to one idempotent mutation keyed by the old UUID (`legacyId`). Theme, Opus settings and the Gemini key are re-entered by hand (#16).
3. **Online only, the service worker goes.** Remove `vite-plugin-pwa` and keep a plain manifest (renamed, `lang: 'bg'`) so Кафето still installs to the Home Screen. Chrome's install criteria no longer list a service worker **[docs]**. Never ship a service worker on `kafeto.onovaza.com`, so there is nothing to retire later.
4. **The Gemini key** is localStorage `dial-in-gemini-key` (`src/lib/prefs.ts`), sent straight from the browser to Google. **The Opus switch** is localStorage `dial-in-opus-dial` (same file), read in `BrewForm.tsx`, set in `Settings.tsx`. Neither needs code changes beyond the key names; whether the switch moves to the Акаунт is an owner call (#35).
5. **Stack:** Vite 8 + React 19 SPA, wouter routes, Tailwind 4, own small UI kit (no shadcn), pnpm, no server code. The Clerk SDK that fits is **`@clerk/react`** (v6, Core 3; `@clerk/clerk-react` is deprecated) with `ConvexProviderWithClerk` from `convex/react-clerk`. **Catch:** `@clerk/react` reads only `VITE_CLERK_PUBLISHABLE_KEY` from env **[source]**; `VITE_CLERK_SIGN_IN_URL` from #26 does nothing unless the code passes it as `signInUrl`.
6. **English UI:** about 310 strings, about 1,150 words, in 20 files, no i18n setup, 7 hand-rolled English plurals, one locale-less date formatter, plus stored English values (roast levels, process suggestions) and an English Gemini prompt.
7. **"Dial In" appears** in 7 app files (incl. the IndexedDB name, backup marker, 5 localStorage keys, manifest, `index.html`, Home header), the README and GLOSSARY, the GitHub repo name and description, the Vercel project, and in the hub: the project file (slug `dial-in`, name, SEO title, offline/no-account copy, `uiLanguage: 'en'`, live link), its registry import, 3 `related` lists, 2 screenshots folders, and the slug rule's example in README, strategy and GLOSSARY. The hub's `/proekti/[slug]` has `dynamicParams = false`, so a slug change needs a redirect.
8. **Vercel:** project `dial-in`, Vite preset, Git-connected (production deploys from `main`, last at `9464567`), **no env vars**, only domain `dial-in-three.vercel.app`. **Ordering trap:** merging Кафето to `main` deploys it onto the address the owner's Dial In runs on, so the owner's export comes first.

## 1. Rollout order at a glance

| # | Step | Who | Section |
| --- | --- | --- | --- |
| 0 | Export the JSON in the installed Dial In on the iPhone and keep the file (also tests the iOS download, #16). Before anything merges to `dial-in`'s `main`. | Owner | 9 |
| 1 | Branch in `dial-in`. Create Кафето's Convex dev deployment in the shared team (`npx convex dev --once --configure new`), schema, `customJwt` auth config and a `requireSubject` helper. | Agent | 2, 6 |
| 2 | Clerk (dev instance): `@clerk/react`, `ConvexProviderWithClerk`, signed-out start page, avatar menu. | Agent | 6 |
| 3 | Data layer: Dexie reads and writes to Convex queries and mutations; photos to file storage. | Agent | 2 |
| 4 | Import of Dial In v1, Кафето's own export, settings → "Данни" with Изтрий данните, `user.deleted` endpoint. | Agent | 3 |
| 5 | Drop the service worker, rename manifest and `index.html`. | Agent | 4 |
| 6 | Bulgarian UI, glossary in Bulgarian. | Agent, owner reviews copy | 7 |
| 7 | Vercel env (preview and production split), `kafeto.onovaza.com` on the project. | Agent; owner confirms domain | 10 |
| 8 | Convex prod deploy, Clerk webhook, `vercel --prod`. | Owner confirms | 10, [#26](https://github.com/HayGrouve/onova-za/issues/26) phase 6 |
| 9 | iPhone Home Screen check of `/vhod` ([#18](https://github.com/HayGrouve/onova-za/issues/18)); import the file inside the installed Кафето; check counts. | Owner | 9 |
| 10 | 308 routing rule on `dial-in-three.vercel.app` ([#29](https://github.com/HayGrouve/onova-za/issues/29) 3.4), hub `/kafeto` redirect, hub project data and slug. Remove the old icon. | Agent, owner confirms; owner | 8, 9 |

## 2. The stores and the Convex schema they map to

### 2.1 What exists [code]

`src/lib/db.ts`: Dexie 4.4.6, database `dial-in`, version 3. Ids are `crypto.randomUUID()`.

| Store | Index string | Fields |
| --- | --- | --- |
| `coffees` | `id, name, roaster, finished, updatedAt` | `id`, `name`, `roaster`, `origin?`, `region?`, `producer?`, `varietal?`, `process?`, `altitude?`, `roastLevel?`, `tastingNotes: string[]`, `bagWeight?` (g), `notes?`, `rating?` (1 to 5), `photo?: Blob`, `finished: boolean`, `createdAt`, `updatedAt` (ms) |
| `brews` | `id, coffeeId, method, createdAt, [coffeeId+method]` | `id`, `coffeeId`, `method` (`espresso`, `pourover`, `aeropress`, `frenchpress`, `moka`, `coldbrew`, `other`), `grinder?` (stamped from the setting), `grindSetting: string`, `dose?`, `yield?`, `timeSec?`, `preinfusion: boolean`, `preinfusionSec?`, `temperature?`, `bloomSec?`, `taste?` (`sour`, `balanced`, `bitter`), `notes?`, `dialedIn: boolean`, `createdAt` |

| localStorage key | Value | File |
| --- | --- | --- |
| `dial-in-grinder` | string | `src/lib/prefs.ts:3` |
| `dial-in-gemini-key` | string | `src/lib/prefs.ts:23` |
| `dial-in-opus-dial` | `'1'` or absent | `src/lib/prefs.ts:36` |
| `dial-in-opus-inner` | integer, -6 to +6 | `src/lib/prefs.ts:37` |
| `dial-in-theme` | `light`, `dark` or absent | `src/lib/theme.ts:3`, mirrored in the inline script in `index.html:12` |

Photos: front of the bag only, at most 1280 px, JPEG q0.82 (`compressImage`, `src/lib/image.ts`); the back photo only goes to Gemini. Rendered by `BagPhoto` in `src/components/ui.tsx:192` from a Blob via `URL.createObjectURL`, used in 8 places (Home, CoffeeDetail, WelcomeBackSheet).

### 2.2 Sketch of Кафето's Convex schema [design]

```ts
// convex/schema.ts
const method = v.union(v.literal('espresso'), v.literal('pourover'), v.literal('aeropress'),
  v.literal('frenchpress'), v.literal('moka'), v.literal('coldbrew'), v.literal('other'))

coffees: defineTable({
  ownerSubject: v.string(),            // Clerk user id (#14)
  legacyId: v.optional(v.string()),    // Dial In UUID, only on imported rows; makes import idempotent
  name: v.string(), roaster: v.string(),
  origin: v.optional(v.string()), region: v.optional(v.string()), producer: v.optional(v.string()),
  varietal: v.optional(v.string()), process: v.optional(v.string()), altitude: v.optional(v.string()),
  roastLevel: v.optional(v.string()),  // keep the English key ('Light'...), translate on display
  tastingNotes: v.array(v.string()),
  bagWeight: v.optional(v.number()), notes: v.optional(v.string()), rating: v.optional(v.number()),
  photo: v.optional(v.id('_storage')),
  finished: v.boolean(),
  createdAt: v.number(), updatedAt: v.number(), // kept from the file, not _creationTime
})
  .index('by_owner_updatedAt', ['ownerSubject', 'updatedAt'])
  .index('by_owner_legacyId', ['ownerSubject', 'legacyId']),

brews: defineTable({
  ownerSubject: v.string(),
  coffeeId: v.id('coffees'),
  legacyId: v.optional(v.string()),
  method, grinder: v.optional(v.string()), grindSetting: v.string(),
  dose: v.optional(v.number()), yield: v.optional(v.number()), timeSec: v.optional(v.number()),
  preinfusion: v.boolean(), preinfusionSec: v.optional(v.number()),
  temperature: v.optional(v.number()), bloomSec: v.optional(v.number()),
  taste: v.optional(v.union(v.literal('sour'), v.literal('balanced'), v.literal('bitter'))),
  notes: v.optional(v.string()), dialedIn: v.boolean(), createdAt: v.number(),
})
  .index('by_owner_createdAt', ['ownerSubject', 'createdAt'])
  .index('by_owner_method_createdAt', ['ownerSubject', 'method', 'createdAt']) // BrewForm prefill
  .index('by_coffee_method', ['coffeeId', 'method'])                            // setDialedIn
  .index('by_owner_legacyId', ['ownerSubject', 'legacyId']),

equipment: defineTable({            // one row per person; replaces three localStorage keys
  ownerSubject: v.string(),
  grinder: v.optional(v.string()),
  opusInner: v.optional(v.number()),
  opusDial: v.optional(v.boolean()), // only if the owner says the switch belongs to the Акаунт
}).index('by_owner', ['ownerSubject']),

processedWebhookEvents: defineTable({ svixId: v.string() }).index('by_svix', ['svixId']), // as Сметката
```

- Convex makes its own `_id`; the Dial In UUID cannot be the id ([Document IDs](https://docs.convex.dev/database/document-ids) **[docs]**). Routes become `/coffee/<_id>`. A 308 from the old host keeps `/coffee/<uuid>`, which would 404; acceptable for one user, or resolve `legacyId` in the coffee query **[design]**.
- A `users` table is not needed: there is nothing per person but `equipment`.
- Photos: documents are capped at 1 MiB, so photos never go inline; upload via `generateUploadUrl` (URL valid 1 hour), serve with `ctx.storage.getUrl()` returned by the query (bearer URLs, acceptable for bag photos per #21) **[docs]**. `BagPhoto` takes a URL instead of a Blob. A new photo is still compressed in the browser before upload.
- Cost: the team is on Starter with 1 GiB storage included and about 695 MB used (#26); a few hundred KB per bag is cents at worst **[unverified estimate]**.

### 2.3 Every read and write that changes [code]

| Today | Where | Becomes |
| --- | --- | --- |
| `useLiveQuery` all coffees, all brews | `Home.tsx:16-17` | `coffees.listMine`, `brews.listMine` (Home groups and sorts client-side today; fine at this size) |
| coffee by id, brews of coffee | `CoffeeDetail.tsx:22-23` | `coffees.get`, `brews.byCoffee` |
| coffee by id; brew by id; last brews by coffee and by method | `BrewForm.tsx:21,41,52,56-57` | `coffees.get`, `brews.get`, `brews.prefill` |
| all coffees (matching for "Welcome back"), coffee by id | `CoffeeForm.tsx:26,50` | `coffees.listMine`, `coffees.get` |
| brews of matched coffees | `WelcomeBackSheet.tsx:31` | `brews.byCoffees` |
| counts | `Settings.tsx:28` | `data.counts` |
| `coffees.add` / `update` | `CoffeeForm.tsx:93,97` | `coffees.create` / `coffees.update` (with photo upload first) |
| `brews.put`, `brews.delete` | `BrewForm.tsx:96,103` | `brews.save`, `brews.remove` |
| `setDialedIn` (clears others for coffee + method, bumps the coffee's `updatedAt`) | `db.ts:100`, called from `BrewForm.tsx:97`, `CoffeeDetail.tsx:231,261` | one mutation, same semantics |
| rate | `CoffeeDetail.tsx:33` | `coffees.rate` |
| `deleteCoffee` (brews then coffee) | `db.ts:113`, `CoffeeDetail.tsx:36` | `coffees.remove`, also deletes the photo file |
| `finishCoffee`, `restockCoffee` with undo | `db.ts:127-153`, `src/lib/toast.ts:43,48` | mutations that return the replaced fields; undo calls `coffees.restore` |
| grinder, Opus inner ring | `prefs.ts`, `OpusDial.tsx:126`, `Settings.tsx` | `equipment.get` / `equipment.set` |

Undo has one snag: Restock can replace the photo, and undo puts the old one back. The old storage file must outlive the undo window, so delete replaced files lazily (a daily cron for files no coffee references, as #21 3.6 proposed) rather than in the mutation **[design]**.

## 3. Export format and the import into Convex

### 3.1 The file today [code]

`src/lib/backup.ts`:

```ts
interface BackupFile {
  app: 'dial-in'
  version: 1
  exportedAt: string                                   // ISO
  coffees: (Omit<Coffee, 'photo'> & { photo?: string })[] // photo as a data URL
  brews: Brew[]
  grinder?: string
}
```

Downloaded as `dial-in-backup-YYYY-MM-DD.json` through a synthetic `<a download>`, with the object URL revoked on the next line (the iOS Home Screen question from #16). Import today rejects anything without `app === 'dial-in'`, moves pre-v3 per-brew `rating` onto the coffee (`bestBrewRatings`), ignores `version`, and merges by id. Not in the file: theme, Opus switch and inner ring, Gemini key (on purpose).

### 3.2 How Кафето's import would read it [design]

All in the browser except the writes; no server-side file parsing.

1. Pick the file in settings → "Данни" → "Внеси от Dial In". `JSON.parse`, require `app === 'dial-in'` (and later Кафето's own `app: 'kafeto'`), run `bestBrewRatings` for old files.
2. Ask the server which `legacyId`s already exist (`import.existing`), so a second run skips them and uploads no photo twice.
3. For each new coffee with a photo: data URL to Blob (`dataUrlToBlob` exists), `generateUploadUrl`, POST, keep the `storageId`. Mint one URL per photo, right before use (1-hour expiry; POST has a 2-minute timeout) **[docs]**. Sequential or two at a time, with a progress line.
4. `import.coffees({ coffees })` in batches of about 50: insert with `ownerSubject`, `legacyId`, the file's `createdAt` and `updatedAt`, `photo: storageId`; skip a `legacyId` that exists (and delete the just-uploaded file). Return `legacyId → _id`.
5. `import.brews({ brews })` in batches of about 200: map `coffeeId` through the returned table, skip brews whose coffee is missing, keep `createdAt`, skip existing `legacyId`s.
6. `grinder` → `equipment` only if empty (today's rule).
7. Show "Внесох N кафета и M варения." Re-running is harmless.

Limits are not a concern: arguments up to 16 MiB and 16,000 writes per mutation ([Limits](https://docs.convex.dev/production/state/limits) **[docs]**); the photos never pass through a mutation. The file itself (one string with base64 photos) is the memory-heavy part, as #16 noted.

### 3.3 Кафето's own export (for "Данни", #20) [design]

Same shape, `app: 'kafeto'`, `version: 2`, adding `equipment`; photos fetched from their storage URLs and written as data URLs, so one file still restores everything. Save via `navigator.share({ files })` where `navigator.canShare` allows, else `<a download>` with a delayed revoke (#16's fix). Keep accepting `dial-in` v1 for as long as the old domain lives.

## 4. Service worker and manifest, online only

Today [code, live]: `vite-plugin-pwa` 1.3.0 in `vite.config.ts` (`registerType: 'autoUpdate'`, precache `**/*.{js,css,html,svg,png}`, `navigateFallback: '/index.html'`, fonts CacheFirst) generates `sw.js`, `workbox-*.js`, `registerSW.js` and `manifest.webmanifest`. Live manifest: `name` "Dial In", a dash, "Coffee Grind Journal", `short_name` "Dial In", `lang` "en", `id`/`start_url`/`scope` `/`, `display` standalone, colours `#0e1a15`, three icons. `vercel.json` sets no-cache headers for `/sw.js`, `/workbox-*` and the manifest, immutable caching for `/assets/*`, and the SPA rewrite.

For Кафето:

- **Remove `vite-plugin-pwa` and the service worker.** An online app on Convex gains nothing from a precached shell, and a cached shell is exactly what stranded installed users in #16. With no `sw.js` ever served on `kafeto.onovaza.com`, there is no retirement step later **[design]**.
- **Keep a static `public/manifest.webmanifest`** and link it from `index.html`: `name` "Онова за кафето", `short_name` "Кафето" (or "За кафето"), `lang` "bg", `display` standalone, same icons. Chrome's install criteria list HTTPS, a manifest with name, 192 and 512 px icons, `start_url` and `display`, and engagement; they no longer mention a service worker ([web.dev install criteria](https://web.dev/articles/install-criteria) **[docs]**). iOS 26 opens every Home Screen site as a web app ([Safari 26.0](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/) **[docs]**, cited in #16). The manifest `id: '/'` resolves on the new origin, so Кафето is a new app to every browser, as #16 said.
- **Keep the Apple tags** in `index.html` (`apple-mobile-web-app-capable`, title, `apple-touch-icon`), renamed.
- **`vercel.json`:** drop the `/sw.js` and `/workbox-*` headers; keep the SPA rewrite, `/assets/*` caching and the security headers.
- **What the owner sees offline:** the browser's own offline page. Acceptable per #17's update; an optional "Няма връзка" banner from `navigator.onLine` is cheap **[design]**.
- **The sign-in hop:** `/vhod` is out of the manifest's scope, which is what the iPhone check in #18 tests. On Android an out-of-scope page opens inside the app window with browser UI ([MDN `scope`](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/scope) **[docs]**).

## 5. Gemini key and the Opus switch

- **Gemini key** [code]: `getApiKey`/`setApiKey` in `src/lib/prefs.ts:23-34`, localStorage `dial-in-gemini-key`, doc comment "Stays on this device; never exported in backups". Read in `src/components/BagScanner.tsx:39` (hides scanning without a key) and `:46`; set in `src/pages/Settings.tsx:108-131` ("Label reading", a password field, link to Google AI Studio). `src/lib/scan.ts` sends front and back photos (recompressed to 1600 px, q0.85) straight from the browser to `generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent` with header `x-goog-api-key`. No server involved. Online-only changes nothing here; per #17 it stays on the device.
- **Opus switch** [code]: `getOpusDial`/`setOpusDial`, `src/lib/prefs.ts:36-49`, localStorage `dial-in-opus-dial`. Read once per render in `src/pages/BrewForm.tsx:43`, set by the "Fellow Opus dial" toggle in `Settings.tsx:93`. The inner ring: `getOpusInner`/`setOpusInner`, `prefs.ts:49-58`, set in `src/components/OpusDial.tsx:126` when you confirm a ring move; #17 puts it in the Акаунт.
- **Grinder**: `dial-in-grinder`, `prefs.ts:3-21`, plus a one-time `migrateGrinder` in `src/main.tsx:9` that is dead weight on a new origin (drop it).
- Key names can change freely (`kafeto-gemini-key` and so on): the new origin starts empty and nothing migrates localStorage **[design]**.
- **Изход on a shared device**: `signOut` leaves localStorage alone, so the pasted key stays unless Изход clears it. Owner call (#35).

## 6. Stack facts for adding Clerk and Convex

[code] `package.json`: Vite ^8.3, React ^19.2.8, TypeScript ~6.0, Tailwind 4.3 via `@tailwindcss/vite`, wouter ^3.11 (routes in `src/App.tsx`: `/`, `/settings`, `/coffee/new`, `/coffee/:id/edit`, `/coffee/:id/brew/new`, `/coffee/:id/brew/:brewId`, `/coffee/:id`, catch-all), oxlint, pnpm. No tests, no server, no `convex/`, no `components.json` (own `src/components/ui.tsx`: `Header`, `Section`, `Field`, `Toggle`, rating, tag input, `BagPhoto`, `PhotoViewer`). `main.tsx` renders `<StrictMode><App/></StrictMode>` after `initTheme()`.

- **SDK:** `@clerk/react` (latest 6.18.6). `@clerk/clerk-react` is deprecated: "Please use @clerk/react instead" (npm registry **[source]**). Not `@clerk/tanstack-react-start` (Сметката, Клиентите) or `@clerk/nextjs` (Chef): Кафето has no SSR. Its quickstart wraps `<App/>` in `<ClerkProvider>` in `src/main.tsx` ([Clerk React quickstart](https://clerk.com/docs/react/getting-started/quickstart.md?manual=1) **[docs]**).
- **Convex:** `<ConvexProviderWithClerk client={convex} useAuth={useAuth}>` from `convex/react-clerk` inside `ClerkProvider`; gate on `useConvexAuth()`, not Clerk's `useAuth()` ([Convex: Clerk](https://docs.convex.dev/auth/clerk) **[docs]**). `convex` is at 1.49.0 on npm.
- **Env is props-only beyond the key.** `<ClerkProvider>`: "When omitted, `@clerk/react` reads the key from `VITE_CLERK_PUBLISHABLE_KEY`" ([ClerkProvider reference](https://clerk.com/docs/react/reference/components/clerk-provider.md) **[docs]**); for a pure React app "you should use the props on the components" ([Clerk env vars](https://clerk.com/docs/guides/development/clerk-environment-variables.md?sdk=react) **[docs]**). The 6.18.6 `dist` contains `VITE_CLERK_PUBLISHABLE_KEY` and no other `VITE_CLERK_*` name **[source]**. So: `signInUrl={import.meta.env.VITE_CLERK_SIGN_IN_URL}` and `signUpUrl={...}` explicitly; unset in dev and preview falls back to the dev Account Portal (#18).
- **Convex auth:** `convex/auth.config.ts` with `customJwt` and issuer from `CLERK_JWT_ISSUER_DOMAIN`, plus one `requireSubject(ctx)` helper that checks `azp` against `CLERK_AUTHORIZED_PARTIES` in prod (#24). Every query and mutation goes through it from day one, so Кафето has none of Кухнята's 37-call retrofit.
- **`user.deleted`:** copy Сметката's `convex/http.ts` route `/clerk/webhook` (svix headers, `processedWebhookEvents`) and `convex/lib/clerkWebhook.ts`, with an erase mutation that deletes the person's coffees, brews, equipment and photo files in batches (#14). The same erase backs Изтрий данните (#20).
- **Signed-out start page:** `/` renders the start page when `useConvexAuth()` says signed out; other routes send you to `/`. Today's Home empty state (`Home.tsx:358`, "Your grind memory starts here") is the seed. Button "Влез" calls `redirectToSignIn()` (to `/vhod` with `redirect_url`).
- **Avatar menu:** own small dropdown in the Home header (`Home.tsx:64`, next to the Settings icon): avatar from `useUser().user.imageUrl`, items "Акаунт" (`https://onovaza.com/akaunt`) and "Изход" (`useClerk().signOut()`). Not `<UserButton>`: its menu is English and opens the Account Portal, which #30 turns off **[design]**.
- **Settings → "Данни":** replaces "Your data" (`Settings.tsx:133-147`): export, Изтрий данните with typed ИЗТРИЙ, link to the Акаунт (#20). The Dial In import lives here too.
- **CSP:** Dial In sends none (`vercel.json`, live `curl -I`), so nothing to update for `clerk.onovaza.com` or Convex, unlike Сметката (#26 §4).
- **Size of the swap:** about 3,300 lines of `src` today; the data layer touches 7 components and pages plus `db.ts`, `backup.ts`, `prefs.ts`, `toast.ts` **[code]**. No offline queue, no sync engine.

## 7. The English UI, for a Bulgarian one

[code] Counted with the TypeScript parser over `src/` (JSX text, user-facing attributes such as `label`, `placeholder`, `aria-label`, `title`, `hint`, and sentence-like string literals), minus route paths, key names and internal errors:

- **About 310 strings, about 1,150 words**, in 20 files. Largest: `CoffeeDetail.tsx` 47, `BrewForm.tsx` 40, `WelcomeBackSheet.tsx` 38, `CoffeeForm.tsx` 36, `Settings.tsx` 36, `Home.tsx` 29, `BagScanner.tsx` 22, `methods.ts` 19 (method and taste labels, hints, relative days), `OpusDial.tsx` 13, `db.ts` 12 (roast levels and processes).
- **No i18n setup.** All copy is inline literals. Сметката also uses inline Bulgarian literals; Клиентите uses Paraglide (`@inlang/paraglide-js`) with `bg` as the only locale and `messages/bg.json`. For one language, inline Bulgarian is the smaller change **[design]**.
- **Plurals:** 7 hand-rolled English sites (`Settings.tsx:25` `plural()`, `Home.tsx:170`, `CoffeeDetail.tsx:35,226`, `WelcomeBackSheet.tsx:236`, `ui.tsx:134`). Bulgarian needs count forms ("1 кафе", "2 кафета"; "1 варене", "3 варения").
- **Dates:** `shortDate` in `src/lib/methods.ts:43` calls `toLocaleDateString(undefined, ...)` (device locale); set `'bg'`. Relative times are hand-rolled English in `methods.ts` and `WelcomeBackSheet.tsx:246`.
- **Stored English values:** `ROAST_LEVELS` (`Light` to `Dark`, a select whose value is stored) and `PROCESSES` (datalist suggestions for a free-text field) in `db.ts`, also fed to Gemini as the allowed values. Keep the stored keys and translate labels; existing free-text processes stay as typed.
- **Gemini prompt** (`scan.ts`, about 200 words) asks for "origin: the country, in English" and lowercase tasting notes, so scanned data arrives in English. The prompt can stay English; what language the fields come back in is a product call.
- **Other English:** `index.html` `lang="en"`, title and meta description; manifest; `README.md`; `GLOSSARY.md` (Coffee, Shelf, Finish, Restock) needs Bulgarian terms through domain-modeling; the "Dial-in cheat sheet" in `Settings.tsx:11-17`.
- **Hub:** `uiLanguage: 'en'` in the project file becomes `'bg'`.

## 8. Every "Dial In" occurrence

### 8.1 In `HayGrouve/dial-in` [code]

| Where | What |
| --- | --- |
| `index.html:22,24,26` | `apple-mobile-web-app-title` "Dial In", `og:title` "Dial In", a dash, "Coffee Grind Journal", `<title>Dial In</title>` |
| `index.html:12` | inline theme script reads `dial-in-theme` |
| `vite.config.ts:16-17` | manifest `name`, `short_name` |
| `src/pages/Home.tsx:65` | header "Dial In" (`translate="no"`) |
| `src/lib/db.ts:61` | IndexedDB name `dial-in` (goes with Dexie) |
| `src/lib/backup.ts:6,17,29,37` | `app: 'dial-in'`, file name `dial-in-backup-*.json`, error "This is not a Dial In backup file." (the import must keep accepting `dial-in`) |
| `src/lib/prefs.ts:3,23,36,37`, `src/lib/theme.ts:3` | localStorage keys `dial-in-*` |
| `src/pages/Settings.tsx:149` | "Dial-in cheat sheet" (the coffee term, not the name; translate anyway) |
| `package.json:2` | `"name": "dial-in"` |
| `README.md`, `GLOSSARY.md` | title and prose |
| GitHub repo | name `dial-in`, description "Coffee grind journal: ...", homepage `https://dial-in-three.vercel.app` [live] |
| Vercel | project `dial-in`, alias `dial-in-three.vercel.app` [live] |

"Still dialing", "Dialing in" and `DialingRow` in `Home.tsx` and `CoffeeDetail.tsx` are the coffee term and go with the translation.

### 8.2 In the hub (`~/projects/onova-za`) [code]

| Where | What changes |
| --- | --- |
| `src/content/projects/dial-in/index.ts` | `slug: 'dial-in'`, `name: 'Dial In'`, `seo.title` "Dial In: дневник за мелене на кафе", `description` "... Работи офлайн.", `body.about` "... Dial In пази ... Работи офлайн и без акаунт.", `cover.alt` "Рафтът в Dial In ...", `uiLanguage: 'en'`, `links.live` `https://dial-in-three.vercel.app`, `updatedAt` |
| `src/content/projects/dial-in/shelf.webp` | cover screenshot of the English Dial In |
| `public/projects/dial-in/` | 11 files: inventory screenshots (desktop, mobile, detail, detail-mobile as png and webp), `favicon.svg`, `icon-512` |
| `src/content/registry.ts:6,18` | `import dialIn from './projects/dial-in'` |
| `related` lists | `chef/index.ts:36`, `onova-za-smetkata/index.ts:35`, `dictum/index.ts:27` reference `'dial-in'` |
| `README.md:32`, `docs/strategy.md:55` | slug rule's example "a product's own Latin name wins (`dial-in`)" |
| `GLOSSARY.md:16`, `src/lib/project-schema.ts:42` | "Dial In" as the example product name |
| `docs/research/*`, ADR 0001 | historical; leave |

The page is `/proekti/dial-in`, prerendered with `dynamicParams = false` (`src/app/proekti/[slug]/page.tsx:17`), so a new slug 404s the old URL unless `next.config.ts` (no `redirects()` today) gets `/proekti/dial-in` → `/proekti/<new slug>` (308). The sibling pattern is `onova-za-smetkata` / "Онова за сметката", so `onova-za-kafeto` / "Онова за кафето" fits; keeping "Dial In" as the product's own name (GLOSSARY: "Shown next to the за-фраза") is the alternative. `onovaza.com/kafeto` → `kafeto.onovaza.com` is #29's `LIVE_SUBDOMAINS` entry, added at cutover.

## 9. Moving the owner's data

Per #16, with what this code read adds:

1. **Export first, before any Кафето code reaches `dial-in`'s `main`.** The project is Git-connected and deploys production from `main` (GitHub deployment for `9464567`, production, 2026-10-26 [live]). If Кафето ships in the same project, the next production deploy lands on `dial-in-three.vercel.app`, where the installed Dial In runs. Its old worker will probably keep serving the cached Dial In (the new build has no `sw.js`; the SPA rewrite answers it with HTML, which fails the update) **[unverified]**, but that is not worth relying on. Export on the iPhone, inside the Home Screen app, and keep the file in Files; that is also #16's iOS download test.
2. If the download fails on iOS, the fallback is a small fix in Dial In itself (delayed revoke or `navigator.share({ files })`) shipped before any Кафето merge.
3. After Кафето is live in production and signed in: Import in "Данни", compare counts with Dial In's Settings line ("N coffees · M brews"), open a few photos.
4. Re-enter theme, grinder check, Opus switch and inner ring, Gemini key.
5. Then the #29 routing rule and removing the old icon.

## 10. Vercel project and env

[live]

- Project `dial-in` on `haygrouves-projects`: Vite preset, root `.`, output `dist`, Node 24.x; `vercel.json` sets `buildCommand: pnpm build`. Git-connected to `HayGrouve/dial-in` (previews per branch, production from `main`).
- `vercel env ls --project dial-in`: **no environment variables**.
- Domains: only `dial-in-three.vercel.app`. `onovaza.com` DNS is on Vercel with the `*` ALIAS (#26, #29), so `kafeto.onovaza.com` needs only `vercel domains add`.
- No functions; the iad1 region is irrelevant.

Env to add (from #26 §3, plus the prop catch in section 6):

| Variable | Production | Preview | Read by |
| --- | --- | --- | --- |
| `VITE_CLERK_PUBLISHABLE_KEY` | `pk_live_` | dev `pk_test_` | `@clerk/react` itself |
| `VITE_CLERK_SIGN_IN_URL` | `https://onovaza.com/vhod` (unset if the iPhone check fails, #18) | unset | our code, as `signInUrl` |
| `VITE_CLERK_SIGN_UP_URL` | same | unset | our code, as `signUpUrl` |
| `VITE_CONVEX_URL` | new prod deployment | dev deployment | our code |

No Clerk secret key. Convex prod: `CLERK_JWT_ISSUER_DOMAIN`, `CLERK_WEBHOOK_SIGNING_SECRET`, `CLERK_AUTHORIZED_PARTIES=https://kafeto.onovaza.com`; dev: `CLERK_JWT_ISSUER_DOMAIN` (dev FAPI) and the Convex preview default (#26 6.2). If Vercel should deploy Convex like Клиентите, add `CONVEX_DEPLOY_KEY` and change `buildCommand` to `npx convex deploy --cmd 'pnpm build'`; otherwise `npx convex deploy` by hand. Either way it needs the owner's confirmation.

Same project or a new one: keeping `dial-in` keeps history and the Git link, and the #29 rule for `dial-in-three.vercel.app` lives in the same project. A new `kafeto` project means `dial-in` stays alive only to carry the rule (#29 3.4).

## 11. Open / unverified

- Whether the owner's iPhone export saves a file inside the Home Screen app (#16). Step 0 tests it.
- The iPhone Home Screen sign-in through `/vhod` (#18); needs production.
- That the installed Dial In keeps running its cached build if Кафето deploys to the same host before the export (section 9). Avoid by ordering.
- Real library size and photo count; nothing on the owner's devices was read.
- That renaming the Vercel project (if wanted) keeps the `dial-in-three.vercel.app` alias. Not checked.
- The string count is a parser heuristic (about ±10%), not a manual inventory.
- Whether `azp` reaches Convex under `customJwt` (#24's own open check).

## 12. Questions for the owner (for #35)

1. Same Vercel project `dial-in` (optionally renamed) or a new `kafeto` project?
2. Rename the GitHub repo to `kafeto` (or `onova-za-kafeto`)? Vercel's Git link follows a rename **[unverified]**.
3. Hub slug: `onova-za-kafeto` with name "Онова за кафето" (like Сметката and Клиентите), or keep the product name "Dial In" next to the за-фраза? And the app's short name on the Home Screen: "Кафето" or "За кафето"?
4. Does the Opus switch (`opusDial`) belong to the Акаунт with the inner ring, or stay on the device?
5. Does Изход on a shared device also clear the pasted Gemini key?
6. Bulgarian UI: inline literals (like Сметката) or Paraglide (like Клиентите)? Should scanned origin and tasting notes come back in Bulgarian, and do the stored roast levels get Bulgarian labels only?
7. Should Vercel's build deploy Convex (`CONVEX_DEPLOY_KEY`), or `npx convex deploy` by hand?
8. Convex region for the new deployment (Клиентите is in `eu-west-1`).
9. Keep the "Dial-in cheat sheet" (as "Как да настроиш ново кафе") and the "Welcome back" sheet as they are, just translated?
