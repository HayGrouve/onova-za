# What Сметката's code needs for the move to the Акаунт

Research for [#38](https://github.com/HayGrouve/onova-za/issues/38) on the [Акаунт map (#12)](https://github.com/HayGrouve/onova-za/issues/12), feeding [Migration plan for Онова за сметката (#32)](https://github.com/HayGrouve/onova-za/issues/32). It maps every file, env var and outside setting in HayGrouve/onova-za-smetkata that the map's decisions touch, grouped by decision and ordered roughly as a rollout. It does not redo the decisions: sign-in placement is [#18](https://github.com/HayGrouve/onova-za/issues/18), the Portal and Paths [#30](https://github.com/HayGrouve/onova-za/issues/30), identity and webhooks [#14](https://github.com/HayGrouve/onova-za/issues/14) and [#24](https://github.com/HayGrouve/onova-za/issues/24), deletion [#20](https://github.com/HayGrouve/onova-za/issues/20), production wiring [#26](https://github.com/HayGrouve/onova-za/issues/26), Stripe [#28](https://github.com/HayGrouve/onova-za/issues/28), redirects [#29](https://github.com/HayGrouve/onova-za/issues/29).

Written 2026-11-06 against Сметката `main` at `f0e5c0a`. Read-only throughout: code read in the local clone; `@clerk/tanstack-react-start` 1.4.25 source read in `node_modules`; `vercel env ls` (names and targets only) and `vercel dns ls` on the old domain and onovaza.com; `gh secret list` (names only); `npx convex data` piped to a row count, nothing printed. The `clerk` CLI is not logged in on this machine and the `stripe` CLI is not installed, so neither account was read. Nothing was changed anywhere. No user data, ids, emails or secrets appear here.

Markers: **[verified]** = read in code or a live system today. **[source]** = vendor SDK source in `node_modules`. **[docs]** = a primary source in [Sources](#sources) or a linked ticket's findings. **[inference]** = my reading. **[unverified]** = not checked.

## Answer in short

- **Clerk UI almost disappears from Сметката.** Three prebuilt pieces exist today: `<SignIn>` on `/login`, `<UserButton>` in the header and `<UserProfile>` (with the Абонамент page inside it) on `/user-profile/*`. After the move `/login` becomes a one-line bounce to Clerk's sign-in URL (`onovaza.com/vhod` in production), `/user-profile` goes, and the avatar menu holds only "Акаунт" and "Изход". If the avatar menu is our own small dropdown, Сметката no longer renders any Clerk component, so the 78 KB `bgBG` loader, `CLERK_APPEARANCE` and `@clerk/localizations` can all be deleted **[verified]** for what uses them.
- **Identity needs about an hour.** Two `getUserIdentity()` calls, both in `convex/lib/auth.ts`; users are already keyed by `subject` (`users.clerkSubject`), so no schema change and no re-key **[verified]**. `auth.config.ts` switches to `customJwt` with the `azp` check from #24; `identity.pictureUrl` becomes `identity.picture`.
- **Deletion is mostly built.** `/clerk/webhook` plus `accountDeletion.deleteHostData` already do #14's `user.deleted` job and cancel a live subscription at once **[verified]**. The endpoint URL stays; only its signing secret changes. Изтрий данните is one new public mutation reusing `deleteHostData` plus a "Данни" sheet with typed ИЗТРИЙ (no typed confirmation exists in the app yet).
- **Env: the Preview split is required, and wider than Clerk.** All four Vercel variables are one value shared by Preview and Production today **[verified]**, so previews build with live Clerk keys (which don't work on `*.vercel.app`), the production Convex URL and the production `VITE_APP_ORIGIN`. Previews need dev Clerk keys **and** the dev Convex URL, or the production Convex (trusting only `clerk.onovaza.com`) rejects them.
- **Merging to `main` is the production deploy.** CI deploys Convex prod then Vercel prod on every push to `main` (`.github/workflows/ci.yml`) **[verified]**, so the cutover PR is merged only after the production env, the domain and the webhook secret are in place.
- **Hosts:** eight hard-coded places (CSP Clerk host, `DEFAULT_SITE_ORIGIN`, robots, sitemap, landing copy, two support addresses, test fixtures) plus `VITE_APP_ORIGIN` and Convex `APP_ORIGIN`. New share links and QR codes take `VITE_APP_ORIGIN` first, so a missed update keeps minting links on the old domain **[verified]**.
- **Абонамент:** Stripe Checkout and the Portal return to `SUBSCRIPTION_PAGE_PATH = '/user-profile/subscription'` **[verified]**. The hub has no database, so the page stays in Сметката as its own route. Recommended: `/abonament`, reached from the kebab menu, with `/user-profile/*` kept as a redirect to it.
- **Bill-link tokens:** a token today opens the bill and the Host's IBAN and Revolut name, on draft and final bills, forever (no expiry, no retention) **[verified]**. Production holds 1 bill **[verified]**. Deleting the 2 old production users in the old Clerk instance *before* the cutover lets the existing `user.deleted` handler wipe that bill, so every old link is dead long before the old domain could lapse. Only if data were kept would a rotate-all backfill be needed.
- **Retiring the old instance:** the old Clerk app (production on onova-za-smetkata.com, plus the dev instance that e2e and local dev use today), its five CNAMEs **[verified]**, its webhook endpoint, its Google OAuth client, three Convex env vars, two Vercel vars, three GitHub secrets and `.env.local`. Retire the app only after e2e runs on the new app's dev instance.
- **Tests:** unit tests barely move (one route-context test, new tests for the `azp` check and Изтрий данните). E2E needs new GitHub secrets for the new dev instance and a rewrite of `e2e/host-account-route.spec.ts`, which asserts `UserButton`, `/user-profile` and Clerk's "Управление на акаунта" label.

## 0. What Сметката has today [verified]

| Piece | Where | Note |
| --- | --- | --- |
| Clerk SDK | `@clerk/tanstack-react-start` 1.4.25, `@clerk/backend` 3.14.0 (pulled in) | 3.14.0 is past 3.11.1, so a token without `azp` is rejected once `authorizedParties` is set (#24) |
| Server auth | `src/start.ts:5` `clerkMiddleware()` with no options | SSR reads the session so `/` renders landing or Home on the server (`src/routes/index.tsx:87-100`) |
| Client provider | `src/integrations/convex/provider.tsx`: `ClerkProvider` (172-176) with `bgBG` localization loaded lazily (69-110) and `CLERK_APPEARANCE` (28-62); `ConvexProviderWithClerk` (178); `EnsureConvexUser` (206-261) | Clerk is not mounted on Guest share pages (`useClerkNeeded`, 118-126; `isGuestPage` in `shared/app-header-route-context.ts:42-47`) |
| Sign-in | `src/routes/login.tsx`: `<SignIn routing="hash">` (45-49), `?redirect=` cleaned by `src/lib/safe-redirect-path.ts` | Every protected page bounces here through `src/hooks/use-require-host-auth.ts:17-28` (bill editor, summary, quick bill, user profile) |
| Start page | `src/components/landing/landing-page.tsx`, signed-out `/` | Already the "project's own start page" #18 asks for; its button links `/login?redirect=/` (65) |
| Avatar | `src/components/layout/app-header.tsx:296-302` `<UserButton userProfileMode="navigation" userProfileUrl="/user-profile">` | Kebab menu (`app-header-menu.tsx`) has no account items |
| Account page | `src/routes/user-profile.$.tsx`: `<UserProfile routing="path">` with a custom `UserProfile.Page` "Абонамент" when billing is on | `.host-account-clerk` in `src/styles.css:551-552` |
| Convex auth | `convex/auth.config.ts`: `domain: CLERK_JWT_ISSUER_DOMAIN`, `applicationID: 'convex'` | Old instance uses a JWT template named `convex` (`docs/clerk-production-setup.md` §1.4) |
| Identity reads | `convex/lib/auth.ts:49` and `:72`, the only `getUserIdentity()` calls in the repo | Reads `subject`, `email`, `name`, `pictureUrl` |
| Webhook | `convex/http.ts:55-91` `/clerk/webhook`, Svix check in `convex/lib/clerkWebhook.ts`, handler `convex/accountDeletion.ts` | Only `user.deleted` |
| Data | Production: 2 `users`, 1 `bills`, 1 `paymentSettings`, 0 `guestSessions`. Dev: 2 `users`, 923 `bills` | Counts only |

## 1. Clerk wiring and routes (#18, #30)

What #18 and #30 ask of a project: production sign-in URL `https://onovaza.com/vhod`, the project's own sign-in page becomes a redirect, a signed-out start page with a Вход button, an avatar menu with only "Акаунт" and "Изход", no `<UserProfile>`, and every project sets its own sign-in URL env so nothing falls back to `accounts.<domain>`.

How the sign-in URL reaches Сметката **[source]**: the server middleware reads `VITE_CLERK_SIGN_IN_URL`, else `CLERK_SIGN_IN_URL` (same for `SIGN_UP`), from `process.env` at request time (`dist/utils/env.js`, `dist/server/loadOptions.js`), puts it in `clerkInitialState`, and the client `ClerkProvider` picks it up from there (`dist/client/utils.js` `pickFromClerkInitState`, `mergeWithPublicEnvs`). So no provider prop is needed; #26's `VITE_CLERK_SIGN_IN_URL` name works.

| File | Today | Change |
| --- | --- | --- |
| `src/routes/login.tsx` | Embedded `<SignIn>`, copy "Влезте, за да разделите сметката" and the Guest note (36-43), legal links | Keep the route and its `validateSearch` (old links and `use-require-host-auth` still land here). Signed in: navigate to `redirect` as today. Signed out: `useClerk().redirectToSignIn({ redirectUrl: new URL(redirect, location.origin).href })`, which builds `https://onovaza.com/vhod?redirect_url=<full URL>` in production and the dev Account Portal where the env is unset (#18). The page shows only the loading receipt. The `redirectUrl` option is in Clerk's `SignInRedirectOptions` **[source]** |
| `src/hooks/use-require-host-auth.ts` | Navigates to `/login?redirect=<path>` | No change if `/login` bounces. It already keeps the exact path and query (#18 "back on the exact page") |
| `src/components/landing/landing-page.tsx` | `StartButton` to `/login?redirect=/` (65) | Keep the link. Move the "only the Host signs in" note here, next to the button (#18: project-only notes stay in the project) |
| `src/components/layout/app-header.tsx` | `UserButton` (1, 296-302); `/login` special cases (38, 70-80, 195, 201) | Replace with an avatar dropdown: "Акаунт" (link to `https://onovaza.com/akaunt`) and "Изход" (`useClerk().signOut({ redirectUrl: '/' })`, lands on the start page per #18). Two ways: our own shadcn `DropdownMenu` with `useUser().user.imageUrl` (recommended: same look as the kebab, no Clerk UI left), or keep `UserButton` with `userProfileUrl="https://onovaza.com/akaunt"` and two localization overrides for the labels. The `/login` cases stay |
| `src/routes/user-profile.$.tsx` | `<UserProfile>` plus Абонамент | Delete; replace with a redirect route to the Абонамент page (section 6) keeping `?checkout` and `session_id` |
| `shared/app-header-route-context.ts:10-12` | `hostAccount` for `/user-profile*` | Rename to the Абонамент route's context; header title "Акаунт" (`app-header.tsx:82-92`) becomes "Абонамент", so the word Акаунт means only the hub |
| `src/integrations/convex/provider.tsx` | `bgBG` loader, `CLERK_APPEARANCE`, `ClerkProvider` | If no Clerk component remains: drop the loader (69-110, the `Suspense` in `ClerkTree`), `CLERK_APPEARANCE` and the `localization`/`appearance` props. `ClerkProvider`, `ConvexProviderWithClerk`, `EnsureConvexUser` and the Guest-page gating stay |
| `src/lib/clerk-bg-localization.ts`, `package.json` `@clerk/localizations` | Bulgarian strings for Clerk screens | Delete both (only if no Clerk component remains; `knip` will flag leftovers) |
| `src/styles.css:551-552` | `.host-account-clerk` | Delete |
| `src/start.ts` | `clerkMiddleware()` | `clerkMiddleware({ authorizedParties })` from a server env var, passed only when set (production). The option exists in this SDK version **[source]** (`dist/server/types.d.ts`, `loadOptions.d.ts`); #13 asks for `authorizedParties` on every SSR server |
| `GLOSSARY.md` "Host account", "Auth name" | "Managed in Clerk's UserButton / UserProfile" | Point both at the hub's `/akaunt` (name edited on its Профил tab, #19); add Изтрий данните |
| `docs/adr/0002-clerk-auth-billing.md` | Clerk for Host sign-in UI and profile | A new Сметката ADR: Host sign-in and the Акаунт live on the hub (ADR 0001 in the hub); 0002 partly superseded |

Tone: Сметката's UI speaks "Вие" today ("Влезте", "Опитайте"), while the map's standing preference is "ти"; see the owner questions.

## 2. Identity and `auth.config.ts` (#14, #24)

| File | Change |
| --- | --- |
| `convex/auth.config.ts` | `{ type: 'customJwt', issuer: process.env.CLERK_JWT_ISSUER_DOMAIN!, jwks: \`${process.env.CLERK_JWT_ISSUER_DOMAIN}/.well-known/jwks.json\`, algorithm: 'RS256', applicationID: 'convex' }` (#24 section 5). Works on the old instance too (same issuer, its template sets `aud: convex`), so it can ship before the cutover **[inference]** |
| `convex/lib/auth.ts` | One helper in front of both `getUserIdentity()` calls (49, 72) that rejects when `CLERK_AUTHORIZED_PARTIES` is set and `identity.azp` is missing or not in it. `newUserFields` (14-22): `image: identity.picture` (typed as a custom claim under `customJwt`), with `pictureUrl` as a fallback during the switch |
| `convex/schema.ts:13,40` | `users.clerkSubject` and `by_clerkSubject` already hold Clerk's `subject` (#14 asks exactly this). No change. Renaming the field is cosmetic and not needed |
| `convex/schema.ts:29`, `convex/backfill.ts:96-110` | `clerkPlanSlug` and `planFromClerkPlanSlug` exist only for old rows (the 2 production rows still carry it, #28). Delete both once production is wiped |
| `src/integrations/convex/provider.tsx:178` | `ConvexProviderWithClerk` unchanged: with the native integration the session token carries `aud: convex`, so it sends that token and never asks for the `convex` template (#24, from convex-js source) |
| `shared/host-profile.ts` | Name sync from `identity.name`, unchanged (same claim under `customJwt`) |

Gate: #24's 10-minute dev check that `identity.azp` really appears under `customJwt`. Clerk side (session token claims `name`, `email`, `picture`) is #26 step 4.4.

## 3. Deletion (#14, #20)

| File | Today | Change |
| --- | --- | --- |
| `convex/http.ts:55-91` | `/clerk/webhook`, `user.deleted` only, secret `CLERK_WEBHOOK_SIGNING_SECRET` | No code change. Same URL, new endpoint on the new instance, new secret (#26 6.4) |
| `convex/accountDeletion.ts` | `recordUserDeleted` (dedupes by Svix id) and `deleteHostData` (one bill per run, then payment settings, groups, onboarding, usage and rate-limit rows, recent quick scans, cancels a live subscription immediately, deletes the `users` row) | Add a public `deleteMyData` mutation: `requireAuth`, then schedule `deleteHostData`. Because the `users` row goes last, the next mutation recreates a fresh row and the Host sees a brand-new start, as #20 wants **[inference from code]**. A bill created while the loop runs is swept too (it loops by owner until none), so the sheet should block until done |
| New "Данни" sheet | No delete or export UI exists **[verified]** | Entry in the kebab's host settings (`src/components/layout/app-header-menu.tsx:111-136`, next to "Настройки за плащане"). Danger zone per #20 with a typed ИЗТРИЙ field; `confirm-action-provider.tsx` has no typed confirmation yet. No export section: Сметката has none |
| `src/lib/destructive-action-copy.ts` | Copy for bill and group deletes | Add the Изтрий данните copy |

Suggested copy (ти, per the map; the owner decides the tone question first): title "Изтрий данните си в онова за сметката"; body "Изтриваме всичките ти сметки, групи и настройки за плащане. Акаунтът ти остава. Ако имаш абонамент, той спира веднага, без връщане на пари за оставащия период."; field label "Напиши ИЗТРИЙ"; button "Изтрий данните"; footer "Искаш да изтриеш целия си Акаунт? Това става в Акаунт." (link to `https://onovaza.com/akaunt`, wording from #20).

## 4. Env per environment (#26 section 3)

Today **[verified]**: Vercel has `VITE_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `VITE_APP_ORIGIN`, `VITE_CONVEX_URL`, each a single entry for Preview and Production, none for Development. `vercel.json` disables Git deploys of `main`; production is built by GitHub Actions with `vercel pull --environment=production`. Previews are built by Vercel's Git integration from the Preview values, so today they get the production Convex URL (per `docs/DEPLOY.md:97`, and one shared value), live Clerk keys, and a share-link origin of the production domain.

| Variable | Production | Preview | Why |
| --- | --- | --- | --- |
| `VITE_CLERK_PUBLISHABLE_KEY` | new `pk_live_` | new dev `pk_test_` | Live keys only work on onovaza.com and its subdomains (#26) |
| `CLERK_SECRET_KEY` | new `sk_live_` named `smetkata`, Sensitive | new dev `sk_test_` | `clerkMiddleware` throws without one **[source]** |
| `VITE_CLERK_SIGN_IN_URL`, `VITE_CLERK_SIGN_UP_URL` | `https://onovaza.com/vhod` | unset (dev Account Portal, #18) | Read by the server per request **[source]** |
| `CLERK_AUTHORIZED_PARTIES` (new, server only, if `start.ts` reads it) | `https://smetkata.onovaza.com` | unset | `authorizedParties` for SSR |
| `VITE_APP_ORIGIN` | `https://smetkata.onovaza.com` | **unset** | Unset, share links and canonical fall back to the page's own origin (`resolveAppOrigin`, `resolveSiteOrigin`); today previews mint production links |
| `VITE_CONVEX_URL` | unchanged (`coordinated-warbler-782`) | **dev deployment** (`striped-shepherd-984`) | Production Convex will trust only `clerk.onovaza.com`; a dev-instance token from a preview would be rejected |

`VITE_` values are inlined into the client at build time, so any change needs a rebuild.

| Place | Change |
| --- | --- |
| Convex prod `coordinated-warbler-782` | `CLERK_JWT_ISSUER_DOMAIN=https://clerk.onovaza.com`; `CLERK_WEBHOOK_SIGNING_SECRET` new; later `CLERK_AUTHORIZED_PARTIES=https://smetkata.onovaza.com`; remove `CLERK_FRONTEND_API_URL` (unread by code, #26 7.1); `APP_ORIGIN=https://smetkata.onovaza.com` only when billing is switched on (#28) |
| Convex dev `striped-shepherd-984` | `CLERK_JWT_ISSUER_DOMAIN` = new dev Frontend API URL |
| GitHub Actions secrets | `E2E_VITE_CLERK_PUBLISHABLE_KEY`, `E2E_CLERK_SECRET_KEY`, `E2E_CLERK_USER_EMAIL` to the new dev instance and a `+clerk_test` user there; `E2E_VITE_CONVEX_URL`, `CONVEX_DEPLOY_KEY`, `VERCEL_*` unchanged |
| `.env.local` (owner's machine) | New dev keys |
| `.env.example`, `docs/DEPLOY.md` (env tables, lines 7-35, 76, 97-100, 248-266), `docs/clerk-production-setup.md` | Rewrite for the shared Акаунт; the last becomes a pointer to the hub's checklist |

## 5. Hosts and origins (#29)

| File | Today | Change |
| --- | --- | --- |
| `vite.config.ts:19-20` | CSP `CLERK_API = 'https://clerk.onova-za-smetkata.com https://*.clerk.accounts.dev'` | `https://clerk.onovaza.com https://*.clerk.accounts.dev`. Report-only today, so a miss shows as reports, not breakage. `TURNSTILE` (22, 66, 71) can go once no sign-in form is rendered here (bot protection runs on `/vhod`) |
| `src/lib/site-meta.ts:11` | `DEFAULT_SITE_ORIGIN = 'https://onova-za-smetkata.com'` | `https://smetkata.onovaza.com` (canonical, `og:url`, `og:image` when the env is unset) |
| `src/lib/bill-join-url.ts:7-12` | `resolveAppOrigin`: `VITE_APP_ORIGIN` first, then `window.location.origin` | No code change; it is why the env must change in the same release. Used by `host-bill-view.tsx:249`, `link-stub.tsx:55`, `debtors-list.tsx:137`, `use-bill-header-menu-actions.tsx:110` |
| `public/robots.txt:7` | Sitemap on the old host | New host; keep `Disallow: /login` and `/bills/` |
| `public/sitemap.xml` | `/`, `/privacy`, `/terms` on the old host | New host; drop `/privacy` and `/terms` if they move to the hub (#31) |
| `src/components/landing/landing-page.tsx:257` | Illustration text `onova-za-smetkata.com/…` | `smetkata.onovaza.com/…` |
| `src/lib/contact.ts:7,9` | `support@` and `privacy@onova-za-smetkata.com` (mail via ImprovMX on the old domain **[verified DNS]**) | Owner question: onovaza.com has no MX record today **[verified]** |
| `src/routes/privacy.tsx:107,161` | Names Clerk and its cookies | Legal pages, #31 |
| `src/lib/scrub-share-token.test.ts`, `src/lib/site-meta.test.ts` | Old host in fixtures | Cosmetic |
| Hub `src/content/projects/onova-za-smetkata/index.ts` | `links.live` on `www.` old host | Hub PR (#29 3.2 d) |

Service worker and manifest need nothing: `public/sw.js` never serves navigations and checks `self.location.origin`; `manifest.json` uses relative `id`, `scope`, `start_url` **[verified]**.

## 6. Stripe return paths and the Абонамент page (#28)

| File | Today | Change |
| --- | --- | --- |
| `convex/billingStripe.ts:23` | `SUBSCRIPTION_PAGE_PATH = '/user-profile/subscription'`, used for `success_url`, `cancel_url` (90-91) and the Portal `return_url` (116) | The new route, e.g. `'/abonament'` |
| `src/routes/user-profile.$.tsx` | Hosts `HostProSubscriptionPanel` inside `UserProfile.Page` | New route `src/routes/abonament.tsx`: `useRequireHostAuth('/abonament')`, renders `HostProSubscriptionPanel` when `hostPro.enabled`, otherwise redirects home (GLOSSARY: no Абонамент page while billing is off) |
| `src/components/subscription/host-pro-subscription-panel.tsx:34-70` | Reads `?checkout=success&session_id=` and syncs | Unchanged; it only needs to be mounted on the return route |
| `src/components/subscription/quota-paywall-sheet.tsx` | Starts Checkout from anywhere (plan picker) | Unchanged; Checkout returns to the new route |
| `src/components/layout/app-header-menu.tsx` | No subscription entry (it was in the Clerk profile) | Add "Абонамент" to the host settings items when billing is on |
| Convex `APP_ORIGIN` | Unset everywhere (#28) | `https://smetkata.onovaza.com` when billing is switched on |

Why a Сметката route and not the hub: the hub has no database and Stripe objects live in Сметката's Convex (ADR 0001, #28). Why a route and not a sheet: Stripe returns to a URL. `/user-profile/*` as a redirect costs one small route and catches any Portal or Checkout session made before the switch; billing never ran in production, so none exist today (#28).

Stripe account checks (customers, subscriptions, portal configuration, webhook URL, business details naming the old domain) stay with the owner: #28 section 6 has the seven read-only `stripe` commands.

## 7. Bill-link tokens (#29, #32)

What a token grants **[verified]**: `convex/lib/guestAccess.ts:22-35` only compares `bills.shareToken` with the link's `?t=`. With it, anyone can read the bill (`bills.ts:139-144`), the Host's IBAN and Revolut name (`paymentSettings.ts:22-40`), and on drafts join a seat and claim lines (`guestSessions.ts:118-160`). Tokens never expire; `rotateShareToken` (`bills.ts:308-322`) works on drafts only; no cron deletes old bills (`convex/crons.ts`, `cleanup.ts`). So a link in an old chat stays live for as long as the bill exists, whatever domain it names.

How to make the old ones worthless:

1. **Wipe production before the cutover (recommended).** Production holds 2 users and 1 bill. The owner deletes the 2 users in the **old** Clerk production instance while the old webhook and secret are still live; the existing handler erases each Host's bills, payment settings and the rest. Then `npx convex data` counts must read 0 for `users`, `bills`, `paymentSettings`. Every old link then answers "Сметката не е намерена". This also settles #28's "wipe the 2 prod rows" and needs no new code. Fallback without Clerk: `npx convex run --prod accountDeletion:deleteHostData` per user.
2. **New links on the new host only.** `VITE_APP_ORIGIN` in the same release (section 5). After that no new link names the old domain, so its eventual lapse exposes nothing.
3. **Only if production data were kept** (contrary to #12): a one-off internal mutation that gives every bill a new `createShareToken()` and ends its Guest sessions (the existing `backfill.ts:70-80` pattern). `rotateShareToken` can't be reused for final bills (`assertBillDraft`).

Token expiry for final bills would be a product change, not part of the move.

## 8. Retiring the old Clerk instance (#26 7.1)

What the old Clerk app touches:

| Item | Where | Retire |
| --- | --- | --- |
| Old app, production instance | Clerk, on onova-za-smetkata.com; 2 test users (#12) | Delete the users first (section 7), then the app |
| Old app, development instance | Used today by local dev, Convex dev's issuer and CI e2e secrets | Only after e2e and local dev run on the new app's dev instance |
| Five CNAMEs on onova-za-smetkata.com **[verified]** | `clerk` (Frontend API), `accounts` (Portal), `clkmail`, `clk._domainkey`, `clk2._domainkey` | Remove after the app is deleted. Keep MX, SPF, `_dmarc`, Resend records, CAA and the ALIAS records (#29 3.2 c) |
| Webhook endpoint on the old instance | `https://coordinated-warbler-782.convex.site/clerk/webhook` (#26) | Goes with the app. Once Convex holds the new secret, its deliveries fail the signature check (400) and change nothing **[inference from `http.ts`]** |
| Google OAuth client | GCP project with brand "Онова за сметката", redirect URI `https://clerk.onova-za-smetkata.com/v1/oauth_callback` (`docs/clerk-production-setup.md` §1.8) | Remove the URI or the client after the app goes (owner question on reuse) |
| JWT template `convex` | Old instance | Goes with the app |
| Vercel | `VITE_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` | Replaced in section 4 |
| Convex | `CLERK_JWT_ISSUER_DOMAIN`, `CLERK_WEBHOOK_SIGNING_SECRET` (replaced), `CLERK_FRONTEND_API_URL` (removed) | Section 4 |
| GitHub, local | `E2E_*` Clerk secrets, `.env.local` | Section 4 |
| Docs | `docs/clerk-production-setup.md`, `docs/google-oauth-setup.md`, ADR 0001 and 0002 | Mark superseded |

The `clerk` CLI has no user delete command (`clerk users` offers create, list, open); `clerk api /users/<id> -X DELETE --instance prod` or the Dashboard does it **[verified CLI help]**. Owner step.

## 9. Tests

| Test | Change |
| --- | --- |
| `convex/lib/clerkWebhook.test.ts`, `convex/accountDeletion.test.ts`, `convex/billing.test.ts` | Unchanged; add a `deleteMyData` test (signed-in Host loses bills and settings, stays able to create a new bill) |
| New `convex/lib/auth` test | `t.withIdentity({ subject, azp })` with `CLERK_AUTHORIZED_PARTIES` set and unset; missing `azp` rejected when set; `picture` stored |
| `convex/test.setup.ts` | `HOST_IDENTITY` needs `azp` only in tests that set the env var (#24) |
| `shared/app-header-route-context.test.ts:9-17` | `/user-profile` cases become the Абонамент route |
| `src/lib/safe-redirect-path.test.ts` | Unchanged (`/login` still uses it) |
| `e2e/host-account-route.spec.ts` | Rewrite: `.cl-userButtonTrigger` (9-11) and "Управление на акаунта" (101) become the new avatar menu ("Акаунт" link to the hub, "Изход"); `/user-profile` tests (52-87) become `/abonament` and the redirect; the Guest-page "no avatar" test (110 on) stays with the new selector |
| `e2e/not-found.spec.ts:16` | `/login` no longer renders a page; drop it from the list or assert the bounce |
| New e2e | Signed-out `/bills/x?step=3` lands on Clerk's sign-in URL carrying `redirect_url` with the full original URL (dev: the Account Portal host); Данни: typed ИЗТРИЙ, bills gone, still signed in |
| `e2e/helpers/host-auth.ts`, `e2e/global-setup.ts` | Unchanged: `clerk.signIn` and Testing Tokens work on any dev instance; only the secrets change |
| Production checks after cutover (agent-browser) | Cold `/` shows the landing page; Вход goes to `onovaza.com/vhod?redirect_url=...` naming Сметката and returns to the same page; avatar menu; Изход lands on `/`; share link host is `smetkata.onovaza.com`; no CSP reports for Clerk; `azp` decode (#24 section 6) |

## 10. Rollout order

Owner confirms = the owner approves first. Merging to `main` deploys production (section 0).

| # | Step | Who |
| --- | --- | --- |
| 1 | Hub `/vhod` and `/akaunt` live in production (#26 phase 5) | Per #26 |
| 2 | PR A, safe on the old instance: `customJwt` plus the `azp` helper (dormant without `CLERK_AUTHORIZED_PARTIES`), `picture` fallback, after #24's dev check | Agent; owner merges |
| 3 | PR B, safe on the old instance: `deleteMyData`, the Данни sheet, the `/abonament` route and `SUBSCRIPTION_PAGE_PATH` (Clerk's profile still exists until step 7) | Agent; owner merges |
| 4 | New dev instance wired for dev and CI: Convex dev issuer, `.env.local`, GitHub `E2E_*` secrets, e2e green | Agent for Convex dev; owner pastes secrets |
| 5 | Delete the 2 users in the old production instance; confirm Convex prod counts are 0 (section 7) | Owner deletes; agent counts |
| 6 | Production wiring: `smetkata.onovaza.com` on the Vercel project, Vercel Production and Preview split (section 4), Convex prod issuer, new webhook endpoint and secret (#26 6.1 to 6.5) | Agent for public values; owner for secrets; owner confirms |
| 7 | PR C, the cutover release: `/login` bounce, avatar menu, `/user-profile` redirect, Clerk UI and `bgBG` removed, `authorizedParties`, CSP host, origins, robots, sitemap, landing copy, e2e rewrite, docs. Merge = production deploy | Agent; owner confirms the merge |
| 8 | Webhook test from the Clerk Dashboard (200), production checks (section 9), then the old domain's 307 then 308 (#29 3.2) | Owner sends the test; agent checks; owner confirms redirects |
| 9 | `CLERK_AUTHORIZED_PARTIES` on Convex prod (#26 6.8) | Agent, owner confirms |
| 10 | Retire: old app, five CNAMEs, `CLERK_FRONTEND_API_URL`, Google OAuth client, `clerkPlanSlug` cleanup PR (section 8) | Owner deletes the app; agent DNS and env, owner confirms |

## Questions for the owner (for #32)

1. Avatar menu: our own two-item dropdown (no Clerk component left, `bgBG` and `@clerk/localizations` deleted) or `UserButton` relabelled?
2. Абонамент: its own `/abonament` route from the kebab menu (recommended), or one settings page holding both Абонамент and Данни? And Данни as a kebab sheet or a route?
3. `/login` where no sign-in URL is set (dev, previews): bounce to the dev Account Portal as #18 says, or keep the embedded `<SignIn>` there?
4. Confirm the production wipe before cutover by deleting the 2 old users (kills the 1 bill and its link).
5. Dev deployment (2 users, 923 bills, keyed to the old dev instance): wipe, or leave orphaned?
6. Previews on the shared dev Convex deployment (the one e2e uses): fine?
7. Tone: Сметката's UI says "Вие" throughout; the map prefers "ти". New Данни and Абонамент copy in "ти" alone, or a separate pass moving Сметката to "ти"?
8. `support@` and `privacy@onova-za-smetkata.com`: keep on the old domain (needs renewal, auto-renew is off) or move to onovaza.com (no mail set up there)? Touches #31.
9. Old Google OAuth client: delete, or reuse its GCP project for onovaza.com (#26 phase 2)?
10. Keep `/user-profile/*` as a redirect, or let it 404?

## Open / unverified

- Old Clerk instance not re-read (CLI not logged in): user count (2 per #12), webhook endpoints, whether the `convex` template emits `picture` or another name. The `pictureUrl` fallback covers either.
- Whether Clerk can delete only a production instance or only the whole app, and whether deleting an app sends `user.deleted` (assumed not; hence deleting users first).
- Stripe account: not read (no CLI); #28 section 6 commands for the owner.
- Preview `VITE_CONVEX_URL` value: Vercel shows one shared encrypted entry for Preview and Production, so it is the production value; that this is the production URL rests on `docs/DEPLOY.md:97`.
- `identity.azp` under `customJwt`: #24's dev check.
- That `redirectToSignIn` with an absolute production sign-in URL passes an absolute `redirect_url` the hub accepts (`*.onovaza.com` is in Clerk's default allowed origins per #13): checkable only on production.
- That the hub's `/vhod` reads `redirect_url` and names Сметката from the host (#19's build).

## Sources

- Сметката at `f0e5c0a`: `src/start.ts`, `src/integrations/convex/provider.tsx`, `src/routes/{login,user-profile.$,index,privacy}.tsx`, `src/hooks/{use-require-host-auth,use-host-auth,use-home-view}.ts`, `src/components/layout/{app-header,app-header-menu}.tsx`, `src/components/landing/landing-page.tsx`, `src/components/subscription/*`, `src/lib/{clerk-env,clerk-bg-localization,site-meta,bill-join-url,contact,safe-redirect-path,destructive-action-copy}.ts`, `shared/app-header-route-context.ts`, `convex/{auth.config,http,accountDeletion,users,schema,billingStripe,bills,paymentSettings,guestSessions,crons,cleanup,backfill}.ts`, `convex/lib/{auth,clerkWebhook,billingEnv,guestAccess,shareToken}.ts`, `convex/test.setup.ts`, `e2e/*`, `vite.config.ts`, `vercel.json`, `.github/workflows/ci.yml`, `.env.example`, `public/{robots.txt,sitemap.xml,manifest.json,sw.js}`, `GLOSSARY.md`, `docs/{DEPLOY,clerk-production-setup,google-oauth-setup}.md`, `docs/adr/0001` to `0004`.
- `@clerk/tanstack-react-start` 1.4.25 in `node_modules`: `dist/utils/env.js`, `dist/server/{loadOptions,clerkMiddleware,types}.js/.d.ts`, `dist/client/{ClerkProvider,utils}.js`; `@clerk/shared` `dist/getEnvVariable.mjs`, `dist/types/clerk.d.ts` (`SignInRedirectOptions`).
- Live reads 2026-11-06: `vercel env ls` (onova-za-smetkata, names and targets), `vercel dns ls onova-za-smetkata.com` and `onovaza.com` (record names and types), `gh secret list` (names), `npx convex data <table> [--prod]` piped to a row count, `clerk users --help`.
- Hub tickets and findings: [#13](https://github.com/HayGrouve/onova-za/blob/research/clerk-subdomains/docs/research/akaunt/clerk-subdomains.md), [#14](https://github.com/HayGrouve/onova-za/blob/research/convex-webhooks/docs/research/akaunt/convex-webhooks.md), [#24](https://github.com/HayGrouve/onova-za/blob/research/convex-audience/docs/research/akaunt/convex-audience.md), [#26](https://github.com/HayGrouve/onova-za/blob/research/production-checklist/docs/research/akaunt/production-checklist.md), [#28](https://github.com/HayGrouve/onova-za/blob/research/smetkata-stripe/docs/research/akaunt/smetkata-stripe.md), [#29](https://github.com/HayGrouve/onova-za/blob/research/old-domain-redirects/docs/research/akaunt/old-domain-redirects.md); resolutions on [#18](https://github.com/HayGrouve/onova-za/issues/18), [#20](https://github.com/HayGrouve/onova-za/issues/20), [#30](https://github.com/HayGrouve/onova-za/issues/30).
