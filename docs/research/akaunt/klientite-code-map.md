# What Клиентите's code needs for the move to the Акаунт

Research for [#39](https://github.com/HayGrouve/onova-za/issues/39) on the [Акаунт map (#12)](https://github.com/HayGrouve/onova-za/issues/12). Feeds [Migration plan for Онова за клиентите (#33)](https://github.com/HayGrouve/onova-za/issues/33). Architecture: [ADR 0001](https://github.com/HayGrouve/onova-za/blob/main/docs/adr/0001-one-akaunt-on-onovaza-subdomains.md). Builds on [#13](https://github.com/HayGrouve/onova-za/issues/13) (Clerk on the apex), [#14](https://github.com/HayGrouve/onova-za/issues/14) (issuer, key by subject, `user.deleted`), [#18](https://github.com/HayGrouve/onova-za/issues/18) (one Вход on the hub), [#20](https://github.com/HayGrouve/onova-za/issues/20) (Изтрий данните), [#24](https://github.com/HayGrouve/onova-za/issues/24) (`customJwt` plus `azp`), [#26](https://github.com/HayGrouve/onova-za/issues/26) (production checklist and env tables), [#29](https://github.com/HayGrouve/onova-za/issues/29) (redirects and the service worker trap), [#30](https://github.com/HayGrouve/onova-za/issues/30) (Account Portal off, relative Paths). Those decisions are not re-argued here; this file maps them onto files.

Written 2026-11-06 against HayGrouve/onova-za-klientite `main` at `7a1ccd8`. Everything was read-only: the local checkout (files read, nothing run), `vercel env ls` (names and targets only), `gh secret list` (names only), `npx convex data --prod` (row counts only, data deleted after counting), `curl` on the live site, and the installed `@clerk/tanstack-react-start` 1.6.5 and `@clerk/shared` 4.39.0 sources. No env, deploy, Clerk or DNS change. No personal data here.

Markers: **[verified]** = read in code or the live system. **[source]** = read in vendor source in `node_modules`. **[via #N]** = established by that ticket. **[inference]** = my reading. **[unverified]** = not checked.

## Answer in short

- **Клиентите is a client-only SPA.** `tanstackStart({ spa: { enabled: true } })` in `vite.config.ts:122`, no `src/start.ts`, no server functions, Clerk only in the browser, Convex does every check **[verified]**. So there is **no `clerkMiddleware`, no `authorizedParties` on a server and no Vercel `CLERK_SECRET_KEY`**, contrary to what #13 (section "per project") and #26 (section 3, step 4.6) assumed. Signing in on another subdomain is picked up the way Кафето does it: clerk-js asks the Frontend API on load **[inference, via #13]**.
- **Who has it installed:** production Convex holds **1 user, the owner** (signed in through the old dev instance), **0 push subscriptions**, 1 business, 3 clients, 2 jobs, 1 payment, 0 files **[verified, counts only]**. Nobody else has data or push. But the service worker registers for every visitor of a production build, signed in or not, and the app has no analytics, so the number of browsers holding the old worker is unknown **[verified code; count unverified]**.
- **Farewell worker:** cheap and recommended (about 20 lines in `build/worker-source.ts`, acting only when `self.location.hostname` is exactly `onova-za-klientite.vercel.app`, plus excluding `/sw.js` from #29's routing rule). Without it, any browser with the old worker keeps opening the cached old shell on the old host. The owner alone could instead remove the icon by hand (#29's option 1). Owner decision.
- **Build-time Convex deploy forces the order:** `scripts/vercel-build.sh` runs `npx convex deploy --cmd 'pnpm build'`, so every Vercel production build first pushes the functions and `auth.config.ts` with whatever `CLERK_JWT_ISSUER_DOMAIN` the Convex prod deployment holds, then builds the app with whatever Clerk key Vercel holds **[verified]**. Convex prod env first, Vercel Production env second, then one production build. A Vercel Instant Rollback afterwards rolls back the frontend only, never the Convex functions or auth config **[inference]**.
- **Deletion:** `convex/account.ts` deletes the Clerk user (`deleteClerkUser`, `api.clerk.com` with `CLERK_SECRET_KEY`); that goes, with the env var and its typed slot. The in-app delete becomes Изтрий данните and must keep you signed in, which today's code doesn't support (it signs you out, and the user row only goes at the end of a batched job). A `user.deleted` endpoint is new (no `convex/http.ts` today) **[verified]**.
- **Identity:** two places read it (`convex/lib/auth.ts:15-34`, `convex/users.ts:19-54`); users are keyed by `tokenIdentifier` (index `by_token`), with `clerkUserId` stored but not indexed **[verified]**. Switch to an index on the subject, `customJwt`, `identity.picture`, and the `azp` check from #24.
- **Sign-in UI:** `signInUrl="/login"` and `afterSignOutUrl="/login"` are hard-coded props in `src/integrations/providers.tsx:52-53`, and props beat the `VITE_CLERK_SIGN_IN_URL` env var **[source]**. There is no signed-out start page (`/` is the signed-in Today screen). On the phone, Settings is reachable only from the avatar menu, so #18's "only Акаунт and Изход" would hide Settings there **[verified]**: owner question.
- **Env per Vercel environment:** Clerk publishable keys are already **separate entries for Preview and Production** (unlike Сметката and Кухнята) **[verified]**, so the split is a value change, not a restructure. No Development entries exist; local dev uses `.env.local`.
- **Hosts:** no canonical, no sitemap, `robots.txt` is `Disallow: /`, manifest uses relative `id`/`scope`/`start_url` **[verified]**. The only host in config is Convex `APP_URL` (push links). Docs and the hub's project data still name `onova-za-klientite.vercel.app`.

## 1. Clerk wiring and routes (#18, #30)

Today: `ClerkProvider` from `@clerk/tanstack-react-start` wraps `ConvexProviderWithClerk` in `src/integrations/providers.tsx`; `/login` embeds Clerk's `<SignIn routing="hash">` with the trimmed `bgBG` localization; `_app.tsx` sends a signed-out visitor to `/login?redirect=<path>`.

| File | Today | Change implied |
| --- | --- | --- |
| `src/integrations/providers.tsx:48-57` | `signInUrl="/login"`, `afterSignOutUrl="/login"`, `localization`, `appearance`, `allowedRedirectOrigins=[window.location.origin]` | `signInUrl`/`signUpUrl` from env (production `https://onovaza.com/vhod`, unset in dev and preview so Clerk falls back to the dev Account Portal, #18). `afterSignOutUrl="/"` (Изход lands on the project's start page, #18). Drop `localization` and `appearance` once no Clerk UI renders here. Props win over env in this SDK (`mergeWithPublicEnvs`: `restInitState.signInUrl \|\| envVars.signInUrl`) **[source: `dist/client/utils.js`]**, so removing the hard-coded prop is required either way. Read the value explicitly in `src/lib/env.ts` like the other `VITE_` vars rather than rely on the SDK's dynamic `import.meta.env[name]` lookup inside a dependency **[unverified that the dynamic lookup survives the Vite build]** |
| `src/lib/env.ts` | `convexUrl`, `clerkPublishableKey`, `vapidPublicKey` | Add `clerkSignInUrl` (`VITE_CLERK_SIGN_IN_URL`) and the Акаунт link (`https://onovaza.com/akaunt`; derive from the sign-in URL's origin or a `VITE_AKAUNT_URL`, so previews can point at the hub preview or hide it) |
| `src/routes/login.tsx` | `<SignIn>` card, `redirect` search param through `safeRedirect` | Becomes a redirect (#18): `useClerk().redirectToSignIn({ redirectUrl: origin + safeRedirect(redirect) })`, which sends `redirect_url` (absolute) to `/vhod` in production and to the dev Account Portal elsewhere. Keep the route so old bookmarks and installed copies don't 404 |
| `src/routes/_app.tsx:37-48` | Signed out: `navigate('/login', { redirect })` | Signed out on `/`: render the new start page (#18: "Клиентите gains one"). Signed out on a deep link: straight to sign-in with that page as `redirect_url` (no detour via `/login`) |
| New: start page component (for example `src/components/start-page.tsx`) | none | App name, one line, a "Вход" button calling `redirectToSignIn`. Copy in `messages/bg.json` (no Cyrillic in `src/`, ADR 0009). Suggested, in "ти": title "Онова за клиентите", line "Клиенти, работа и пари на едно място.", button "Вход". It must also work as the offline cold-start fallback path in `src/routes/__root.tsx` (offline mode never reaches Clerk) |
| `src/components/app-shell.tsx:396-469` (`AccountMenu`) | Label with email, "Настройки" (`/settings`), "Изход" (drops push, wipes snapshots, `signOut()`) | Add "Акаунт" (external link to the hub's `/akaunt`). Keep Изход's push drop and snapshot wipe. Whether "Настройки" stays: on the phone it is the **only** way to Settings (`AppHeader` has the switcher, search and the avatar; the bottom nav is Today, Jobs, Clients, Money); the wide sidebar has its own Settings link at line 269 **[verified]**. Owner question |
| `src/lib/safe-redirect.ts` | Same-origin path check | Keep for the path; add building the absolute `redirect_url` from `window.location.origin` |
| `build/clerk-localization.ts`, `src/integrations/clerk-localization.ts`, `trimClerkBundle()` in `vite.config.ts:121`, `@clerk/localizations` in `package.json` | Trims `bgBG` for `<SignIn>` | Dead once `<SignIn>` goes: remove (knip will flag it). `m.login_title`, `m.login_body` likewise |
| `build/content-security-policy.ts` | Clerk host decoded from the publishable key (D111) | Nothing to edit: a `pk_live_` key for the new instance gives `https://clerk.onovaza.com` automatically **[verified code, via #26]**. Turnstile (`challenges.cloudflare.com`) was for the embedded sign-up; it can go after the switch, optional. `img.clerk.com` stays (avatars) |
| `messages/bg.json:20-21,54` | `account_menu` "Профил", `account_sign_out` "Изход", `account_settings` "Настройки" | "Профил" is an avoided term (#20): rename the menu label, add "Акаунт" |

Proof the wiring works (agent, in a browser, on production after cutover): a signed-out deep link lands on `onovaza.com/vhod` naming онова за клиентите and returns to the same page (#30's check that no Portal URL is built); `/` signed out shows the start page; Изход lands on `/`.

## 2. Identity and `auth.config.ts` (#14, #24)

| File | Today | Change implied |
| --- | --- | --- |
| `convex/auth.config.ts` | `domain: process.env.CLERK_JWT_ISSUER_DOMAIN!`, `applicationID: 'convex'` | `type: 'customJwt'`, `issuer` = the same env, `jwks: <issuer>/.well-known/jwks.json`, `algorithm: 'RS256'`, `applicationID: 'convex'` (#24). Gate on #24's 10-minute dev check that `identity.azp` shows up |
| `convex/lib/auth.ts:15-34` (`findCurrentUser`, `requireUser`) | Looks up `users.by_token` by `identity.tokenIdentifier` | Look up by subject on a new index; when `CLERK_AUTHORIZED_PARTIES` is set, reject a missing or unlisted `identity.azp` (prod only, #24). Every public function already goes through these wrappers (ADR 0006), so this is the one choke point |
| `convex/users.ts:19-54` (`ensureCurrent`) | Direct `ctx.auth.getUserIdentity()`; writes `tokenIdentifier`, `clerkUserId: identity.subject`, `imageUrl: identity.pictureUrl` | Route through `lib/auth.ts` (#24). `identity.pictureUrl` becomes `identity.picture` under `customJwt` (#24). Profile claims `name`, `email`, `picture` must be mapped on the new instance's session token (#14, #26 phase 4) |
| `convex/schema.ts:29-36` (`users`) | `tokenIdentifier` + `clerkUserId`, index `by_token` only | Add `.index('by_clerk_user', ['clerkUserId'])` (the webhook needs it too, #14). `tokenIdentifier` can stay as a column or go; it changes with the issuer either way |
| `convex/convex.config.ts:7-22` (typed env) | `CLERK_JWT_ISSUER_DOMAIN` (required), `ALLOW_SEED`, `CLERK_SECRET_KEY`, VAPID trio, `APP_URL` | Add optional `CLERK_AUTHORIZED_PARTIES` and `CLERK_WEBHOOK_SIGNING_SECRET`; remove `CLERK_SECRET_KEY` (section 3) |
| `src/components/offline/snapshot-keeper.tsx:25`, `snapshot-wiper.tsx` | Key the IndexedDB snapshot by Clerk `userId` from `useAuth()` | No code change. New Clerk ids mean the old snapshot is never matched and is cleared by `saveSnapshot` on first save **[verified code]** |
| `convex/seed.ts:168-169,464` | Seed users `seed\|<key>` / `seed_<key>` | Keep the `seed_` prefix convention on whichever column becomes the key |

**Existing production rows.** The owner's one user row carries a dev-instance `tokenIdentifier` and dev Clerk id **[verified, by category only]**. After the switch the owner has a new Clerk id, so `ensureCurrent` creates a second user with a fresh empty business, and the old business (3 clients, 2 jobs, 1 payment) is orphaned. Either wipe production before the cutover (D50 already says "no user data yet") or re-key the one row to the new subject with a one-off internal mutation. Owner question.

## 3. Deletion: Clerk user deletion goes, Изтрий данните stays signed in (#20)

| File | Today | Change implied |
| --- | --- | --- |
| `convex/account.ts:119-123, 130-146` | After the batched erase, `deleteStep` schedules `deleteClerkUser`, which calls `DELETE https://api.clerk.com/v1/users/{id}` with `env.CLERK_SECRET_KEY` | Delete `deleteClerkUser` and its scheduling (#20). On the shared instance it would delete the Акаунт everywhere |
| `convex/account.ts:17-46` (`deleteAccount`) | Removes memberships in shared businesses, queues sole businesses, keeps the user row until the job ends | Rename to Изтрий данните semantics (for example `deleteMyData`). To "stay signed in and look brand new" (#20), the user row and its push subscriptions must be detached **at once**, not at the end of the job: today `ensureCurrent` would find the half-deleted row (no `activeBusinessId`) and the viewer would show a business still being erased. Simplest: delete the `users` row and `pushSubscriptions` in the mutation, let the job erase businesses only (`scheduleDeletion(ctx, businessIds)` without `userId`, the D124 path), and let the next `ensureCurrent` create a fresh user and business **[inference]** |
| `src/routes/_app/settings.data.tsx:127-169` (`DeleteAccount`) | Typed ИЗТРИЙ, then `deleteAccount`, `wipeSnapshots`, `signOut()` | No `signOut()`; after the mutation, wipe snapshots and drop the push subscription, then reload into setup. Add the line linking to the Акаунт (#20). Export stays owner-only above it, as today |
| `messages/bg.json:809-813` | "Изтрий профила и данните", body and label in "Вие", "Изтрий завинаги" | #20 copy. Suggested in "ти": heading "Изтрий данните си в онова за клиентите"; body "Изтриват се бизнесите, в които си сам, с всички записи, плащания и файлове. От споделените бизнеси излизаш само ти. Акаунтът ти остава. Действието не се отменя."; label "Напиши ИЗТРИЙ, за да потвърдиш"; button "Изтрий данните"; line "Искаш да изтриеш целия си Акаунт? Това става в Акаунт." Note: the rest of Клиентите's copy is formal (about 40 lines of `bg.json` use "Вие" forms such as "Напишете", "можете", "сте"; almost none use "ти" **[verified by grep]**), so this section would be the only "ти" in the app. Owner question |
| `convex/convex.config.ts:13-14` | `CLERK_SECRET_KEY` typed slot | Remove; then Convex needs no Clerk secret at all, in any deployment |
| New `convex/http.ts`, `convex/lib/clerkWebhook.ts` (+ test), a `webhookEvents` table | none (Clerk endpoint URL answers 404 today, via #26) | Copy Сметката's shape (`onova-za-smetkata/convex/http.ts`, `convex/lib/clerkWebhook.ts`, `convex/accountDeletion.ts`, `webhookEvents` cleanup in `convex/cleanup.ts`): verify the Svix signature with `CLERK_WEBHOOK_SIGNING_SECRET`, record `svix-id` once, look up by `clerkUserId`, run the same erase as Изтрий данните, 2xx fast, 503 while unconfigured (#14). Endpoint: `https://ideal-shepherd-123.eu-west-1.convex.site/clerk/webhook` (via #26) |
| `docs/product-design.md:167` | Settings "Data: Import, export, delete account and data" | The design doc wins over code (`AGENTS.md`), so it changes first, by the owner, to Изтрий данните |

## 4. Env per Vercel environment and Convex deployment

Vercel project `onova-za-klientite` today (names only) **[verified]**: `VITE_CLERK_PUBLISHABLE_KEY`, `VITE_VAPID_PUBLIC_KEY`, `CONVEX_DEPLOY_KEY`, each as **separate Preview and Production entries**; no Development entries. GitHub secrets: `E2E_VITE_CONVEX_URL`, `E2E_VITE_CLERK_PUBLISHABLE_KEY`, `E2E_CLERK_SECRET_KEY` **[verified]**.

| Where | Variable | Production | Preview / dev |
| --- | --- | --- | --- |
| Vercel | `VITE_CLERK_PUBLISHABLE_KEY` | new instance `pk_live_` | new app's dev `pk_test_` (today the old Клиентите dev app) |
| Vercel | `VITE_CLERK_SIGN_IN_URL` (and `_SIGN_UP_URL` if read) | `https://onovaza.com/vhod` | unset |
| Vercel | `VITE_AKAUNT_URL` (if not derived) | `https://onovaza.com/akaunt` | unset or the hub's dev URL |
| Vercel | `CLERK_SECRET_KEY` | **none** (no server) | none |
| Vercel | `CONVEX_DEPLOY_KEY`, `VITE_VAPID_PUBLIC_KEY` | unchanged | unchanged |
| Convex `ideal-shepherd-123` (prod) | `CLERK_JWT_ISSUER_DOMAIN` | `https://clerk.onovaza.com` | |
| | `APP_URL` | `https://klientite.onovaza.com` | |
| | `CLERK_WEBHOOK_SIGNING_SECRET` | new `whsec_` from the prod endpoint | |
| | `CLERK_AUTHORIZED_PARTIES` | `https://klientite.onovaza.com` | never set |
| | `CLERK_SECRET_KEY` | remove if present (whether it is set was not read: listing env prints values) | |
| Convex dev `amiable-echidna-14` and **preview defaults** | `CLERK_JWT_ISSUER_DOMAIN` | | new app's dev FAPI URL (by hand in Project Settings, #26 6.2) |
| | `CLERK_SECRET_KEY` | | no longer needed (the `AGENTS.md` note that e2e needs it in Convex env goes) |
| GitHub | `E2E_VITE_CLERK_PUBLISHABLE_KEY`, `E2E_CLERK_SECRET_KEY` | | the new dev instance's keys |
| local | `.env.local` | | `clerk env pull` against the new app |

So #26's per-consumer secret key `klientite` (step 4.6) is **not needed**: no server middleware exists, and the only Convex caller of the Backend API is removed in section 3. The dev and preview switch (Vercel Preview key, Convex preview defaults, GitHub E2E secrets) must happen together, or new previews get one instance's key and the other's issuer **[inference]**.

## 5. Hosts and origins (#29)

| File | Host today | Change implied |
| --- | --- | --- |
| Convex env `APP_URL` (read in `convex/pushNode.ts:13-16`) | the `vercel.app` origin, presumably (value not read) | `https://klientite.onovaza.com` in the same cutover (#26, #29) |
| `public/robots.txt` | `Disallow: /` | Unchanged unless the new start page should be indexed. Owner question (no canonical or sitemap exists to update) |
| `public/manifest.webmanifest` | `id`, `start_url`, `scope` all `/` (relative) | No edit. The installed app's identity is origin plus `id`, so `klientite.onovaza.com` is a new app to the phone; the old icon stays until removed **[inference]** |
| `AGENTS.md:5`, `README.md:7` | `https://onova-za-klientite.vercel.app`, "still on the Clerk development instance" | Update with the move |
| `docs/adr/0003-clerk-sign-in.md` | Own Clerk app, `bgBG`, keyed by `tokenIdentifier`, deletes the Clerk user | Superseded by a new ADR pointing at hub ADR 0001 |
| `docs/implementation-plan.md` D50, Q24, "Next" item 3 (line 746) | Launch plan with own production instance and `CLERK_SECRET_KEY` | Record the decision that replaces it |
| Hub `src/content/projects/onova-za-klientite/index.ts` `links.live`; hub `next.config.ts` `onovaza.com/klientite` 308 | old host | #29 sections 3.3 and 3.5 |
| Vercel routing rule on `onova-za-klientite.vercel.app` | none | #29 3.3; exclude `/sw.js` if the farewell worker ships (section 7) |

`https://klientite.onovaza.com/` fails TLS today (resolves through the `*` ALIAS, no certificate until `vercel domains add`) **[verified]**, as expected before #26 6.1.

## 6. Build-time Convex deploy and the cutover order

`vercel.json` sets `buildCommand: sh scripts/vercel-build.sh`; the script runs `npx convex deploy --cmd 'pnpm build' --preview-run 'seed:preview'` and then, on production, `npx convex run counts:backfill '{"onlyMissing": true}' --prod` **[verified]**. Consequences:

- **Auth config is pushed by the Vercel build.** `auth.config.ts` reads `CLERK_JWT_ISSUER_DOMAIN` at push time (the comment in the file says so). Set the Convex prod env **before** the Vercel production build that carries `pk_live_`. If the build runs first, it pushes the old issuer while the frontend sends new-instance tokens, and nobody can sign in until another build **[inference]**. Whether an env change alone (without a push) changes the accepted issuer: **[unverified]**; the plan shouldn't rely on it either way.
- **`vite.config.ts:78-82` fails a Vercel build whose key gives no Clerk host** **[verified]**, so a missing `pk_live_` aborts the build after Convex has already been pushed. Set Vercel env before triggering the build.
- **Rollback is half.** Vercel Instant Rollback restores the old frontend but not the Convex functions, schema or auth config the failed build already pushed **[inference]**. Rolling back means reverting the commit and building again.
- **`CLERK_AUTHORIZED_PARTIES` is read at runtime** (in `lib/auth.ts`), so set it last, after the new frontend is live on `klientite.onovaza.com`.

Order (owner confirms every production-visible step, per #12):

| # | Step | Who |
| --- | --- | --- |
| 0 | Prerequisites: new Clerk instance live with Allowed Subdomains including `klientite.onovaza.com`, claims mapped, hub `/vhod` and `/akaunt` live (#26 phases 1 to 5) | per #26 |
| 1 | PRs, each safe on the old dev instance and mergeable early: identity (section 2, after #24's dev check); deletion and the webhook (section 3); sign-in wiring and start page (section 1); farewell worker (section 7); docs (ADR, AGENTS, README, design doc row) | Agent (PRs), owner merges |
| 2 | Dev and preview switch together: Vercel Preview `VITE_CLERK_PUBLISHABLE_KEY`, Convex dev env and preview defaults, GitHub E2E secrets, `.env.local`; recreate the `+clerk_test` users and `aud`/claims on the new dev instance | Agent; owner for Convex defaults and secret pastes |
| 3 | Decide the owner's production rows: wipe or re-key (section 2) | Owner |
| 4 | Clerk prod: create the `user.deleted` endpoint at the Convex site URL, copy its secret | Owner |
| 5 | `vercel domains add klientite.onovaza.com onova-za-klientite` | Agent, owner confirms |
| 6 | Convex prod env: `CLERK_JWT_ISSUER_DOMAIN`, `APP_URL`, `CLERK_WEBHOOK_SIGNING_SECRET`; remove `CLERK_SECRET_KEY` | Agent, owner confirms (secret pasted by owner) |
| 7 | Vercel Production env: `VITE_CLERK_PUBLISHABLE_KEY` (`pk_live_`), `VITE_CLERK_SIGN_IN_URL`, Акаунт URL | Agent, owner confirms |
| 8 | One production build (redeploy `main`): it pushes Convex with the new issuer, builds with the new key | Owner confirms |
| 9 | Check: `curl -I https://klientite.onovaza.com/` CSP names `clerk.onovaza.com`; sign in through `/vhod`, land back; Convex has one new user keyed by the new subject; Clerk "send example" `user.deleted` returns 200 | Agent; owner sends the test event |
| 10 | Convex prod `CLERK_AUTHORIZED_PARTIES=https://klientite.onovaza.com`; sign in again | Agent, owner confirms |
| 11 | #29 3.3: routing rule on the old host (307 first, then 308), hub redirect and `links.live` | Agent, owner confirms |
| 12 | Delete the old Clerk dev app "Onova za Klientite" once nothing points at it | Owner |

## 7. Service worker and push (#29)

What `/sw.js` does (`build/worker-source.ts`, emitted by `build/service-worker.ts`) **[verified, live `/sw.js` matches]**:

- Caches `shell-<version>` (`/_shell.html`, manifest, favicon, `icon.svg`, `apple-touch-icon.png`, `icon-192.png`) and a long-lived `assets` cache of hashed `/assets/*`.
- **Answers every navigation with the cached shell** (lines 129-136); cross-origin requests (Clerk, Convex) and `/_serverFn` pass through.
- A new version waits for "Има нова версия" and `SKIP_WAITING` (`src/components/service-worker-register.tsx`).
- Registered in every production build for **every visitor**, signed in or not (`ServiceWorkerRegister` in `__root.tsx`'s shell).
- Push: `push` and `notificationclick` handlers; click targets come from Convex `APP_URL`.
- Separately, the page keeps an IndexedDB snapshot (`idb-keyval`, default database) of today's jobs and **clients with contacts** for offline reading (ADR 0010).

What happens to an old copy after the 308 [inference, via #16 and #29]: navigations never reach the network, so it keeps booting the old shell on the old host with the old dev Clerk key; a 308 on `/sw.js` fails its update check, so it never changes. Once Convex trusts only the new issuer, that old app is signed in at Clerk but rejected by Convex, and `/login` (signed in, so it navigates back) and `_app` (Convex unauthenticated, so it navigates to `/login`) can bounce between each other **[inference, not run]**. The snapshot of client contacts also stays in that origin's IndexedDB.

**Who is affected:** 1 production user (the owner), 0 push subscriptions **[verified]**. Signed-out visitors who ever opened the production URL also hold the worker; there is no analytics to count them **[unverified]**.

**Farewell worker (recommended, small):** in the release that ships the subdomain, add to `workerSource()`:

- if `self.location.hostname === 'onova-za-klientite.vercel.app'` (exact host; previews and `localhost` must not match), `skipWaiting()` on install;
- on activate: delete all caches, `indexedDB.deleteDatabase('keyval-store')` (wipes the snapshot), navigate each window client to the same path on `https://klientite.onovaza.com`, then `self.registration.unregister()`;
- #29's routing rule excludes `/sw.js` on the old host (source `^/(?!sw\.js$).*`), so the old host keeps serving the new worker from the same deployment;
- a test in `build/worker-source.test.ts`.

Every navigation to the old host triggers an update check of `/sw.js` (Soft Update, [spec, via #16]), so the farewell worker reaches a copy the next time it is opened. Without it, the owner removes the old icon and accepts that strangers' cached copies stay broken.

**Push:** nothing to migrate (0 subscriptions). VAPID keys can stay (a subscription belongs to an origin and worker, so the new origin subscribes afresh through Settings, Notifications, and `PushKeeper` keeps it). Only `APP_URL` changes. On iPhone, push needs the Home Screen app, so anyone using push uses an installed copy, which is exactly the case #18's iPhone check covers for Кафето **[inference]**: whether a Home Screen app picks up a `/vhod` sign-in made in Safari applies to Клиентите too.

## 8. Tests that cover auth, and what they need

| File | Covers | Change implied |
| --- | --- | --- |
| `convex/test.setup.ts:31-44, 245-253` | `OWNER`, `STRANGER` identities (`issuer: https://clerk.test`, `tokenIdentifier`), role helpers look up `by_token` | Add `azp`; look up by subject |
| `convex/users.test.ts` | First sign-in creates a user and business; again creates nothing; profile kept in step; signed-out refused | Profile picture from `picture`; add: wrong or missing `azp` refused when `CLERK_AUTHORIZED_PARTIES` is set, allowed when unset |
| `convex/gdpr.test.ts:277-330` | `account.deleteAccount` erases sole businesses, keeps shared ones, removes the owner row | Rename to Изтрий данните; assert the user can call `ensureCurrent` right after and gets a fresh business; no Clerk call scheduled |
| `convex/access.test.ts`, `jobs.test.ts`, `money.test.ts`, `seed.test.ts` | Use the identities and `ensureCurrent` | Follow the fixture change |
| New `convex/lib/clerkWebhook.test.ts`, `convex/http` test | none | Copy Сметката's: bad signature 400, replayed `svix-id` once, unknown subject no-op, 503 without secret, known subject erased |
| `build/content-security-policy.test.ts` | Host from `pk_test_` | Add a `pk_live_` case for `clerk.onovaza.com` |
| `build/clerk-localization.test.ts` | `bgBG` trimming | Delete with the code |
| `build/worker-source.test.ts` | Worker source | Farewell behaviour, only on the exact old host |
| `src/lib/safe-redirect.test.ts` | Same-origin paths | Absolute `redirect_url` building |
| `src/i18n/hardcoded-text.test.ts` | No Cyrillic in `src/` | Keeps new copy in `bg.json` |
| `e2e/support/fixtures.ts:10-17` (`signIn`) | `page.goto('/login')` then `clerk.signIn` from `@clerk/testing` | Go to `/` (any page that loads Clerk); `/login` becomes a redirect |
| `e2e/support/fixtures.ts:21-58` (`deleteAccount` cleanup) | Deletes through Settings, then **polls until the Clerk user is gone** | The poll can't pass any more; delete the Clerk user only via `e2e/support/clerk-api.ts`, and match the new labels |
| `e2e/global-setup.ts`, CI `e2e` job | Testing token for the dev instance | New dev instance secrets (section 4) |

Not covered today and worth one e2e each: signed-out `/` shows the start page; signed-out deep link goes to the configured sign-in URL with an absolute `redirect_url`; the avatar menu's items.

## 9. Questions for the owner (for #33)

1. Production rows from testing (1 user, 1 business, 3 clients, 2 jobs, 1 payment): wipe before the cutover, or re-key your user to the new Clerk id and keep them?
2. Farewell worker (section 7), or a plain 308 and you remove the old icon yourself?
3. Avatar menu: keep "Настройки" next to "Акаунт" and "Изход" (on the phone it is the only way into Settings), or move Settings somewhere else and keep #18's two items?
4. Copy: Клиентите speaks "Вие" everywhere. Should the new Изтрий данните section and start page use "ти" like the hub, "Вие" like the rest of the app, or should the whole app move to "ти"?
5. After Изтрий данните, land on setup (a fresh business) as #20 implies, or on a short "Данните ти са изтрити" screen first?
6. Should the start page be indexed (change `robots.txt`), or stay `Disallow: /`?
7. Update the design doc's Data row and supersede ADR 0003 (you own `docs/product-design.md`).
8. `VAPID_SUBJECT` is a `mailto:` address (value not read here): is its mailbox one that survives the move?

## Open / unverified

- Clerk user count on the old dev instance "Onova za Klientite": the `clerk` CLI isn't authenticated on this machine (`auth_required`). Production Convex shows only the owner, so nothing to carry over either way.
- Number of browsers holding the old service worker (no analytics).
- That `identity.azp` reaches Convex under `customJwt` (#24's dev check).
- Whether a Convex env change alone changes the accepted issuer before a push.
- Whether `@clerk/tanstack-react-start`'s own `VITE_CLERK_SIGN_IN_URL` lookup works in the Vite build; the plan reads it explicitly instead.
- The `/login` and `_app` bounce in a stale copy (reasoned from the code, not run).
- Whether Convex prod currently holds `CLERK_SECRET_KEY` and what `APP_URL` is (reading them prints values).
- That a Home Screen install of Клиентите picks up a `/vhod` sign-in (#18's iPhone check, extended to Клиентите).

## Sources

Code (HayGrouve/onova-za-klientite `7a1ccd8`): `vite.config.ts`, `vercel.json`, `scripts/vercel-build.sh`, `convex/auth.config.ts`, `convex/convex.config.ts`, `convex/lib/auth.ts`, `convex/users.ts`, `convex/account.ts`, `convex/schema.ts`, `convex/pushNode.ts`, `convex/seed.ts`, `convex/test.setup.ts`, `convex/users.test.ts`, `convex/gdpr.test.ts`, `src/integrations/providers.tsx`, `src/lib/env.ts`, `src/lib/safe-redirect.ts`, `src/lib/offline-store.ts`, `src/routes/__root.tsx`, `src/routes/_app.tsx`, `src/routes/login.tsx`, `src/routes/_app/settings.data.tsx`, `src/components/app-shell.tsx`, `src/components/service-worker-register.tsx`, `src/components/push-keeper.tsx`, `src/components/offline/*`, `build/worker-source.ts`, `build/service-worker.ts`, `build/content-security-policy.ts`, `e2e/support/*`, `.github/workflows/ci.yml`, `public/robots.txt`, `public/manifest.webmanifest`, `messages/bg.json`, `AGENTS.md`, `README.md`, `docs/adr/0003`, `0010`, `0011`, `docs/implementation-plan.md` (D50, D108, D111), `docs/product-design.md`. Сметката for the webhook shape: `convex/http.ts`, `convex/lib/clerkWebhook.ts`, `convex/accountDeletion.ts`, `convex/cleanup.ts`.

Vendor source: `@clerk/tanstack-react-start` 1.6.5 `dist/client/utils.js` (`mergeWithPublicEnvs`), `dist/utils/env.js` (`VITE_CLERK_SIGN_IN_URL`); `@clerk/shared` 4.39.0 `dist/getEnvVariable.mjs`.

Live (2026-11-06): `vercel env ls` (names), `gh secret list` (names), `npx convex data <table> --prod` (counts for `users`, `pushSubscriptions`, `businesses`, `memberships`, `clients`, `jobs`, `payments`, `files`, `deletionJobs`), `curl -I https://onova-za-klientite.vercel.app/` (CSP with the dev Clerk host), `curl https://onova-za-klientite.vercel.app/sw.js`, `curl https://klientite.onovaza.com/` (TLS failure).

Earlier findings: [#13](https://github.com/HayGrouve/onova-za/blob/research/clerk-subdomains/docs/research/akaunt/clerk-subdomains.md), [#14](https://github.com/HayGrouve/onova-za/blob/research/convex-webhooks/docs/research/akaunt/convex-webhooks.md), [#24](https://github.com/HayGrouve/onova-za/blob/research/convex-audience/docs/research/akaunt/convex-audience.md), [#26](https://github.com/HayGrouve/onova-za/blob/research/production-checklist/docs/research/akaunt/production-checklist.md), [#29](https://github.com/HayGrouve/onova-za/blob/research/old-domain-redirects/docs/research/akaunt/old-domain-redirects.md), [#16](https://github.com/HayGrouve/onova-za/blob/research/dial-in-data-move/docs/research/akaunt/dial-in-data-move.md).
