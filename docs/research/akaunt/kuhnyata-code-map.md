# What Кухнята's code needs for the move to the Акаунт

Research for [#40](https://github.com/HayGrouve/onova-za/issues/40) on the [Акаунт map (#12)](https://github.com/HayGrouve/onova-za/issues/12), feeding [Migration plan for Онова за кухнята (#34)](https://github.com/HayGrouve/onova-za/issues/34). Architecture: [ADR 0001](https://github.com/HayGrouve/onova-za/blob/main/docs/adr/0001-one-akaunt-on-onovaza-subdomains.md). Builds on, and does not redo: [#15 findings](https://github.com/HayGrouve/onova-za/blob/research/chef-migration/docs/research/akaunt/chef-migration.md) (Chef's Clerk and Convex as of 2026-10-19), [#24 findings](https://github.com/HayGrouve/onova-za/blob/research/convex-audience/docs/research/akaunt/convex-audience.md) (`customJwt` and the `azp` check), [#26 findings](https://github.com/HayGrouve/onova-za/blob/research/production-checklist/docs/research/akaunt/production-checklist.md) (production checklist and env per project), [#29 findings](https://github.com/HayGrouve/onova-za/blob/research/old-domain-redirects/docs/research/akaunt/old-domain-redirects.md) (redirects), and the resolutions of [#14](https://github.com/HayGrouve/onova-za/issues/14), [#18](https://github.com/HayGrouve/onova-za/issues/18), [#20](https://github.com/HayGrouve/onova-za/issues/20), [#22](https://github.com/HayGrouve/onova-za/issues/22) and [#30](https://github.com/HayGrouve/onova-za/issues/30).

Written 2026-11-06. Read-only throughout: Chef's code at `~/projects/chef` (`HayGrouve/chef` `main` at `c3b87fa`, identical to origin), the hub at `origin/main` (`ed501fa`) and `origin/prototype/akaunt-pages`, Сметката at `f0e5c0a` for the handler to copy; `npx convex data --prod` piped into `jq` counts (nothing written to disk); Clerk Backend API `GET /users/count`, `GET /users` (aggregated in `jq`, nothing printed) and `GET /jwt_templates` on Chef's development instance; `vercel env ls` (names only), `vercel project inspect` and one deployment's build log; `npm view` for versions. No user details, ids, keys or secrets below.

Markers: **[verified]** = read today in code or a live system. **[docs]** = vendor docs or changelog (links in [Sources](#sources)). **[prior]** = from an earlier ticket's findings. **[inference]** = my reading. **[unverified]** = not checked.

Who: **Agent** = an agent by CLI or PR. **Owner** = by hand. **Owner confirms** = the agent runs it, but it writes to production (`npx convex deploy`, `vercel --prod`, production env, domains).

## 0. Answer in short

- **Most of the work can merge and ship before cutover, against Chef's current Clerk dev instance.** The Convex upgrade, one auth helper, the "Cook" fix, Изтрий данните, the `user.deleted` code, the issuer moved into `CLERK_JWT_ISSUER_DOMAIN`, `customJwt` with an `azp` check that only enforces where its env var is set, the avatar menu, the sign-in redirects and the wipe mutation all work on today's setup. Cutover is then env values, one `npx convex deploy`, one wipe run, one Vercel production deploy with the domain, and the hub's data change **[inference]**.
- **Clerk wiring** is 9 files. `UserButton` (always offers "Manage account" **[docs]**) becomes our own menu with "Акаунт" and "Изход"; `<SignIn>`/`<SignUp>` pages go; their routes become redirects to the configured sign-in URL; 6 hard-coded `/sign-in` or `/sign-up` links keep working through that redirect.
- **Middleware:** keep the matchers and the same-origin `redirect_url` guard; add `authorizedParties` from env; handle `/sign-in` and `/sign-up` with `redirectToSignIn`. Gotcha: `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in` is set in all three Vercel environments today and would loop once `/sign-in` redirects, so it must go from Preview and Development **[verified]**.
- **Token:** Chef's only template use outside the Convex provider is `app/recipe/[id]/page.tsx:23`. After the upgrade it becomes `getToken()`. `convex/auth.config.ts` becomes `customJwt` on `CLERK_JWT_ISSUER_DOMAIN`. Two identity reads change (`pictureUrl` to `picture`, `convex/users.ts:115,144`).
- **37 `getUserIdentity()` calls** in 7 files **[verified]**: 24 require a user, 13 allow signed-out. One `convex/lib/auth.ts` with `getUserId`, `requireUserId` and `getIdentity` covers all of them, including the 4 actions (the existing `requireUserId` in `convex/importRecipe.ts:39` already has the right shape).
- **Convex upgrade:** 1.30.0 to 1.49.0 (latest, 2026-10-30), at least 1.33.1 for the session-token path **[docs]**. 1.49.0 needs Node 22; the Vercel project is on 22.x **[verified]**. `convex-test` 0.0.41 to 0.0.67 (needs convex ^1.43). `convex-helpers` stays pinned at 0.1.113 (peer `^1.25.4`).
- **Deletion:** Chef has none. One batched `deleteUserData(userId)` serves both Изтрий данните and `user.deleted`; it reuses the existing `cleanupReferences` and `deleteImageIfUnused` in `convex/recipes.ts`. The webhook side copies Сметката's `convex/http.ts`, `convex/lib/clerkWebhook.ts` and `processedWebhookEvents`.
- **Env:** Vercel `chef` holds 7 variables, every one shared across Development, Preview and Production, including `NEXT_PUBLIC_CONVEX_URL`, so **previews read and write production Convex today** **[verified]**. After cutover previews would be signed out against it; point Preview and Development at the dev deployment.
- **Hosts and metadata:** `app/layout.tsx` hard-codes `https://chef-black.vercel.app` (not even armyant.app) twice; there is no sitemap, robots or canonical. Convex and `img.clerk.com` image hosts stay.
- **Rename:** about 30 user-facing "CHEF"/"chef" strings in 12 files, plus the OG image, and the whole UI is English (`lang="en"`, hub `uiLanguage: 'en'`). Whether the rename also means a Bulgarian UI is the biggest open owner question. Hub: `src/content/projects/chef/` becomes `onova-za-kuhnyata` (the README's own example), plus 4 references, an `akaunt: true` flag and a 308 for `/proekti/chef`.
- **"Cook":** `users.store` rewrites the stored name on every load to `identity.name` or `"Cook"`, then rewrites `authorName` on all the person's recipes. Fix with Сметката's `nextSyncedAuthName` rule (an empty name never overwrites) and a fallback only on insert.
- **Wipe (prod, today):** `users` 11 (keep 3 as anonymous chefs), `recipes` **15** (keep all; one was added on 2026-10-31, after #22 said 14), `favorites` 6, `shoppingList` 34, `mealPlans` 44, `rateLimits` 11 (drop all), `_storage` 15 files, 5.1 MB, all referenced (keep all). 106 deletes plus 3 patches, one transaction **[verified]**.
- **Tests:** 37 Convex tests in 6 files touch identity; none covers middleware, sign-in, `users.getMe`/`update`, deletion or webhooks. There is no CI and the Vercel build does not run tests **[verified]**.

## 1. Chef today, in one table [verified]

| Area | Fact | Where |
| --- | --- | --- |
| Packages | `next` 16.0.10, `@clerk/nextjs` 6.36.0 (pulls `@clerk/backend` 2.25.1), `@clerk/themes` 2.4.42, `@clerk/clerk-react` 5.58.0 (no direct import), `convex` 1.30.0, `convex-helpers` 0.1.113, `convex-test` 0.0.41, `vitest` 5 | `package.json`, `node_modules/.pnpm` |
| Package manager | pnpm (Vercel log: "Detected `pnpm-lock.yaml`", pnpm 10.28.0). A stale `package-lock.json` (last touched 2026-09-24) sits beside it | repo root |
| Vercel | project `chef`, Node 22.x, build `pnpm run build` = `next build` only, so Convex functions are deployed by hand. Last production deploy 2026-10-11 | `vercel project inspect`, build log |
| Clerk | development instance only; 14 users (4 active in the last 30 days); one JWT template `convex`, lifetime 3600 s, claims `aud email email_verified family_name given_name name nickname phone_number phone_number_verified picture updated_at` | Backend API, today |
| Convex | prod `descriptive-snail-667`, dev `hearty-kookabura-538` (local `.env.local`); issuer hard-coded to the dev instance | `convex/auth.config.ts:4` |
| Identity in data | every table keyed by `identity.subject` (`userId`); only `users` also by `tokenIdentifier` | `convex/schema.ts` |
| Webhooks, deletion | none (`convex/http.ts` does not exist) | |
| Tests | Vitest on `convex/**/*.test.ts` and `lib/**/*.test.ts`, edge-runtime; no `.github/` | `vitest.config.mts` |

## 2. Convex upgrade (first, ships alone)

| Change | Files | Notes |
| --- | --- | --- |
| `convex` 1.30.0 to 1.49.0 | `package.json`, `pnpm-lock.yaml` | 1.33.1: `ConvexProviderWithClerk` sends the session token when `sessionClaims.aud === "convex"`, otherwise the `convex` template; "safe to both set the JWT template and enable the integration" **[docs]**. 1.42.2 fixes the provider ignoring session changes **[docs]**. 1.31.5 drops Node 18, 1.49.0 drops Node 20 **[docs]**; Vercel is on 22.x, local Node is 24 **[verified]**. No other breaking entry between 1.30 and 1.49 that touches Chef's APIs **[docs, read]** |
| `convex-test` 0.0.41 to 0.0.67 | `package.json` | peer `convex ^1.43.0` **[verified]** |
| `convex-helpers` | keep 0.1.113 | peer `convex ^1.25.4`, so 1.49 satisfies it; latest 0.1.134 needs `^1.46.0`. It was pinned on purpose in `bf4ab9d` (the stream-backed feed in `convex/feed.ts`) **[verified]**, so bump only if something breaks |
| Remove `package-lock.json` | repo root | Vercel and local both use pnpm **[verified]**; one lockfile avoids an agent running `npm install` |
| Regenerate | `convex/_generated/*` | `npx convex dev --once` against the dev deployment |

Nothing else changes in this step: the template still exists in Chef's Clerk app, so behaviour is identical. Agent (PR), owner merges; `npx convex deploy` owner confirms.

## 3. One auth helper in front of the 37 `getUserIdentity()` calls

### The calls [verified]

38 grep hits, one of which is a type annotation (`convex/importRecipe.ts:39`), so 37 calls.

| File | Calls | Requires a user (throws) | Allows signed-out (returns empty or reads as anonymous) |
| --- | --- | --- | --- |
| `convex/recipes.ts` | 11 | `generateUploadUrl` :195, `create` :219, `update` :268, `toggleFavorite` :804, `remove` :837 | `list` :372, `listAll` :587, `getPublic` :623, `get` :660, `searchByIngredients` :698, `listPublic` :768 |
| `convex/shoppingList.ts` | 12 | `add` :101, `addBatch` :124, `addPlannedWeek` :158, `toggle` :206, `toggleBatch` :224, `remove` :245, `removeBatch` :261, `clearChecked` :281, `clearAll` :299 | `list` :38, `getBadgeCount` :52, `listWithDetails` :67 |
| `convex/mealPlans.ts` | 6 | `add` :63, `move` :95, `autoGenerate` :112, `remove` :192, `clearAll` :206 | `getWeek` :24 |
| `convex/users.ts` | 3 | `update` :63 | `getMe` :44, `store` :94 |
| `convex/ai.ts` | 3 (2 actions, 1 mutation) | `generateMealPlanWithAI` :180, `restoreShoppingListItems` :366, `organizeShoppingList` :449 | |
| `convex/importRecipe.ts` | 1 (local helper used by the import actions) | `requireUserId` :40 | |
| `convex/commandPalette.ts` | 1 | | `suggestions` :11 |
| **Total** | **37** | **24** | **13** |

Fields read: `subject` everywhere; `tokenIdentifier` only in `users.ts` (:51, :70, :103, :142); `name`, `email`, `pictureUrl` only in `users.store` (:109, :115, :141, :144). `access.ts`, `feed.ts`, `rateLimit.ts` take a `userId` argument and need no change.

### The helper (new `convex/lib/auth.ts`, same path as Сметката and Клиентите)

```ts
// convex/lib/auth.ts
import type { Auth, UserIdentity } from "convex/server";

type Ctx = { auth: Auth }; // queries, mutations and actions alike

// Prod only: "https://kuhnyata.onovaza.com". Unset on dev and previews.
function authorizedParties() {
  return process.env.CLERK_AUTHORIZED_PARTIES?.split(",").filter(Boolean) ?? [];
}

/** The signed-in identity, or null. A token minted on another subdomain reads as signed out. */
export async function getIdentity(ctx: Ctx): Promise<UserIdentity | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  const parties = authorizedParties();
  if (parties.length > 0 && (typeof identity.azp !== "string" || !parties.includes(identity.azp))) {
    return null;
  }
  return identity;
}

export async function getUserId(ctx: Ctx): Promise<string | null> {
  return (await getIdentity(ctx))?.subject ?? null;
}

export async function requireUserId(ctx: Ctx): Promise<string> {
  const userId = await getUserId(ctx);
  if (!userId) throw new Error("Unauthenticated"); // same error the 24 call sites throw today
  return userId;
}
```

- Each of the 24 becomes `const userId = await requireUserId(ctx)`, each of the 13 `const userId = await getUserId(ctx)`; `identity.subject` reads become `userId`. `users.store` uses `getIdentity` for the profile fields. Mechanical, about 37 small hunks **[inference]**.
- **Key users by `subject`** (#14): `getMe`, `update` and `store` switch from index `by_token` to `by_userId` (exists, `convex/schema.ts`; all 11 prod rows have `userId` **[verified]**). `tokenIdentifier` stays in the schema for now (still written on insert); dropping it is a later cleanup. Anonymous chefs stay safe: their `userId` is an old dev-instance id the production instance never issues **[inference]**.
- Optional guard so it stays one helper: an ESLint `no-restricted-syntax` rule on `ctx.auth.getUserIdentity` outside `convex/lib/auth.ts` (`eslint.config.mjs`).
- The `azp` part is inert until `CLERK_AUTHORIZED_PARTIES` is set, so the helper can ship before cutover. It only works under `customJwt` (section 6); #24's 10-minute dev check decides whether to keep it.

## 4. The "Cook" name overwrite

Today **[verified]** (`convex/users.ts:109` to `131`): on every signed-in load, `components/UserSync.tsx` calls `users.store`, which computes `name = identity.name?.trim() || "Cook"` and patches the stored name whenever it differs, then schedules `recipes.refreshAuthorName`, which rewrites `authorName` and `searchText` on all that person's recipes. So any token without a `name` claim (an email-code Акаунт with no name, or a session token whose `name` claim is not mapped) renames the person to "Cook" everywhere. `/profile/edit` shows the name read-only with "Name is managed via your login provider." (`app/profile/edit/page.tsx:95` to `96`); `users.update` changes only bio and avatar.

Change:
- Use Сметката's rule, `nextSyncedAuthName(stored, identityName)` in `shared/host-profile.ts` there: an empty or unchanged name returns undefined and nothing is written. Copy it into Chef (`convex/lib/names.ts` or inline in `store`).
- The fallback applies only on insert, and in Bulgarian if the UI goes Bulgarian (section 9). Suggested: "Готвач". It is public on every recipe.
- Names are edited on the hub's `/akaunt` ("Промени името", #19), which needs first and last name enabled in the instance (#26 step 1.5); the next `store` picks the new `name` claim up. The `/profile/edit` hint becomes a link: "Името си сменяш в Акаунт." to `https://onovaza.com/akaunt`.
- Tests: `convex/recipes.test.ts:325` to `330` asserts `"Cook"` and changes; add "a named profile keeps its name when a token has none".
- Requires the `name` claim in the session token (`{{user.full_name}}`, #26 step 1.6). What Clerk puts in it for a user with no name (empty string or omitted) is **[unverified]**; the rule handles both.

## 5. Deletion: Изтрий данните and `user.deleted`

Chef has no deletion code **[verified]**. #20 wants both.

### One erase routine (new `convex/accountDeletion.ts`, Сметката's file name)

`deleteUserData({ userId, keepRateLimits })`, an `internalMutation` that does one batch and reschedules itself, like Сметката's `deleteHostData`:

| Table | Index (exists) | Action |
| --- | --- | --- |
| `recipes` (theirs) | `by_userId` | per recipe: `deleteImageIfUnused` (already in `convex/recipes.ts:131`), schedule `cleanupReferences` (`convex/recipes.ts:869`: deletes other people's favorites and meal plans of it, unlinks their list items), delete. Small batches (a recipe is up to about 250 KB) |
| `favorites` | `by_user` | delete |
| `shoppingList` | `by_user` | delete |
| `mealPlans` | `by_user_date` (prefix `userId`) | delete |
| `rateLimits` | `by_user_action` (prefix `userId`) | delete on `user.deleted`; **keep** on Изтрий данните, so wiping does not reset the Gemini quotas (`convex/rateLimit.ts`) **[inference]** |
| `users` | `by_userId` | delete last |
| `_storage` | | handled per recipe above; anything missed is swept by the existing daily cron `storageCleanup.deleteOrphanUploads` (`convex/crons.ts`) |

Consequence the plan should state: a public recipe disappears for everyone who favorited or planned it, as `recipes.remove` already does for one recipe.

### Изтрий данните (UI and one public mutation)

- `accountDeletion.deleteMyData`: `requireUserId`, then schedules `deleteUserData({ userId, keepRateLimits: true })`. The typed ИЗТРИЙ check is client-side, as in Клиентите (#20).
- Where: Chef has no settings page. Either a "Данни" section on `/profile/edit` (`app/profile/edit/page.tsx`) or a new settings route. Owner question.
- Copy (#20): heading "Изтрий данните си в онова за кухнята", button "Изтрий данните", type ИЗТРИЙ, then "Искаш да изтриеш целия си Акаунт? Това става в Акаунт." linking `https://onovaza.com/akaunt`.
- Export first "where the project has one": Chef has none. Owner question whether to add a JSON export of your recipes.
- After it runs you stay signed in; `UserSync` re-creates an empty `users` row on the next load, which is the "brand-new person" state #20 asks for.

### `user.deleted` (copy from Сметката)

| New in Chef | Copied from (`onova-za-smetkata` at `f0e5c0a`) |
| --- | --- |
| `convex/http.ts`, route `POST /clerk/webhook`: 503 without secret, Svix verify, dedupe by `svix-id` | `convex/http.ts:56` to `90` |
| `convex/lib/clerkWebhook.ts` (Web Crypto Svix verification, `parseClerkEvent`) and its test | `convex/lib/clerkWebhook.ts`, `clerkWebhook.test.ts` |
| `processedWebhookEvents` table, indexes `by_eventId`, `by_processedAt` | `convex/schema.ts:45` to `50` |
| `recordUserDeleted({ eventId, userId })` schedules `deleteUserData({ userId, keepRateLimits: false })` | `convex/accountDeletion.ts:18` to `45` (looks up by `clerkSubject`; Chef uses `userId`) |
| A cron trimming old `processedWebhookEvents` | `convex/cleanup.ts:148` |

Env: `CLERK_WEBHOOK_SIGNING_SECRET` on `descriptive-snail-667`. Endpoint `https://descriptive-snail-667.convex.site/clerk/webhook`, `user.deleted` only, created at the switch (#26 phase 6; today 404 **[prior]**). Owner creates it in the Dashboard, or the agent with `clerk api`, owner confirms. The race in #14 (a token minted just before deletion re-creates an empty `users` row via `store`) stays accepted.

## 6. JWT template to Clerk's native Convex integration, and `customJwt`

| File | Today | Change |
| --- | --- | --- |
| `convex/auth.config.ts` | `{ domain: "https://good-puma-58.clerk.accounts.dev", applicationID: "convex" }` | `customJwt` with `issuer: process.env.CLERK_JWT_ISSUER_DOMAIN`, `jwks: <issuer>/.well-known/jwks.json`, `algorithm: "RS256"`, `applicationID: "convex"` (shape in #24 section 5). If #24's dev check fails, `{ domain: process.env.CLERK_JWT_ISSUER_DOMAIN, applicationID: "convex" }` instead |
| `app/recipe/[id]/page.tsx:23` | `(await auth()).getToken({ template: "convex" })` | `getToken()`: the cookie session token, which carries `aud: "convex"` once the integration is on and the browser's `azp`; a Backend-API template token probably has no `azp` **[prior]** |
| `app/ConvexClientProvider.tsx` | `ConvexProviderWithClerk` | no change; after the upgrade it picks the session token by itself **[docs]** |
| `convex/users.ts:115`, `:144` | `identity.pictureUrl` | `identity.picture` (under `customJwt` only `subject`, `issuer`, `tokenIdentifier` are typed fields; `name` and `email` keep their keys **[prior]**) |

- **Can ship before cutover**: set `CLERK_JWT_ISSUER_DOMAIN` on both Chef deployments to today's dev Frontend API URL (the value already in the code), deploy, and nothing changes for users. Chef's old app has no integration, so the client keeps using the `convex` template, which also carries `azp` **[docs]**. The RSC call needs the integration's `aud`, so `getToken()` lands with or after cutover, or keeps `template: "convex"` until then **[inference]**.
- At cutover the prod value becomes `https://clerk.onovaza.com`; redeploy so `auth.config.ts` picks it up **[inference]**. No need to list the old issuer too: everyone on it is wiped (#22).
- Clerk side (not code, #26 steps 1.6 and 4.4): integration activated, `name`, `email`, `email_verified`, `picture` mapped into the session token. No `convex` template in the new app.

## 7. Clerk wiring (provider, avatar menu, sign-in links)

| File | Today [verified] | Change |
| --- | --- | --- |
| `app/ConvexClientProvider.tsx` | `ClerkProvider` with `appearance` (`shadcn` theme from `@clerk/themes`, `termsPageUrl: "/terms"`, `privacyPageUrl: "/privacy"`), `ConvexProviderWithClerk`, `<UserSync>` | Keep the providers. Once no Clerk component renders in Chef, drop `appearance` and the `@clerk/themes` dependency; `@clerk/clerk-react` has no import and can go too |
| `components/navbar.tsx:98` to `106` | `<UserButton>` (Clerk's menu: "Manage account" opens the profile modal, plus "Sign out"; the defaults can be reordered, not removed **[docs]**) | Own `DropdownMenu` (already in `components/ui/dropdown-menu.tsx`) on the avatar: "Акаунт" to `https://onovaza.com/akaunt`, "Изход" via `useClerk().signOut({ redirectUrl: "/" })` (#18: in a project you land on its start page) |
| `components/navbar.tsx:108` to `125` | "Sign in" to `/sign-in?redirect_url=<path>` | Keep the link (the route redirects, section 8); label "Вход" |
| `app/sign-in/[[...sign-in]]/page.tsx`, `app/sign-up/[[...sign-up]]/page.tsx` | `<SignIn />`, `<SignUp />` | Delete; the middleware answers these paths |
| `app/page.tsx:542`, `:714`; `app/about/page.tsx:98`; `app/profile/edit/page.tsx:70`; `app/recipe/[id]/RecipeDetailClient.tsx:287` | links to `/sign-in` or `/sign-up` | Point all at `/sign-in` (no "Регистрация", #18); copy to Вход |
| `app/page.tsx:143` to `164` | install prompt fires on `?welcome=true`, set by `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/?welcome=true` | `/vhod` always returns to the exact page and gives a new Акаунт no welcome detour (#18), so this never fires again. Drop it, or trigger it when `users.store` inserts a new row (return a flag to `UserSync`). Owner question |
| `app/page.tsx:689` to `728` | `SignUpBanner`, "Sign up to save favorites..." | Copy to Вход; the localStorage key can stay |
| `components/UserSync.tsx` | `useUser()` then `store` | No change (or the flag above) |

The signed-out start page #18 asks for already exists: `/` is public and shows the public recipe feed with a sign-in button **[verified]**. Only copy changes, unless the owner wants a short intro above the feed.

`@clerk/nextjs` 7 (Core 3) is not needed for any of this. Staying on 6.36 keeps the change small; note that only `@clerk/backend` 3.11.1+ rejects a missing `azp` when `authorizedParties` is set **[prior]**, and Chef has 2.25.1.

## 8. Middleware and routes (`middleware.ts`)

Today **[verified]**: public `/`, `/sign-in(.*)`, `/sign-up(.*)`, `/share(.*)` (no such route exists), `/about`, `/terms`, `/privacy`, `/recipe(.*)`, `/profile/(.*)`; protected `/recipe/(.*)/cook(.*)`, `/profile/edit(.*)` and everything unlisted (`/create`, `/import`, `/meal-planner`, `/shopping-list`, `/pantry`). `isSafeRedirect` drops a `redirect_url` that is not same-origin.

Change:
1. `clerkMiddleware(handler, { authorizedParties })` with `authorizedParties` from `CLERK_AUTHORIZED_PARTIES` (Production only: `https://kuhnyata.onovaza.com`), per #13; unset elsewhere so previews and localhost work **[docs]**.
2. For `/sign-in(.*)` and `/sign-up(.*)`: keep the same-origin check, turn the relative target into an absolute one on the request origin, then `return (await auth()).redirectToSignIn({ returnBackUrl })`. A signed-in visitor goes straight to the target. In production that is `https://onovaza.com/vhod?redirect_url=https://kuhnyata.onovaza.com/...`; in development and previews, with the env unset, the new app's dev Account Portal (#18) **[docs, inference]**.
3. `auth.protect()` stays; with `NEXT_PUBLIC_CLERK_SIGN_IN_URL` set it already redirects to `/vhod` with the full URL. #30 asks each plan to check that a signed-out protected page lands on `/vhod`, because without the env Clerk builds `accounts.onovaza.com/sign-in`, a 404 once the Portal is off.
4. `/terms` and `/privacy` (placeholders today: "This is a placeholder page") become redirects to the hub's legal pages once [Legal pages for the Акаунт (#31)](https://github.com/HayGrouve/onova-za/issues/31) exists; footer links in `components/footer.tsx:8` to `10` follow.
5. Drop `/share(.*)`. Optional: rename `middleware.ts` to `proxy.ts` (Next.js 16 name; Clerk's skill notes the code is identical).

## 9. Rename "Chef" to "Онова за кухнята"

### In the app [verified]

| File | What |
| --- | --- |
| `app/layout.tsx:31` to `59` | `title.default` "CHEF \| Your Personal Cookbook", `template` "%s \| CHEF", description, `openGraph.siteName`, `title`, `alt`, `twitter.title`, `description` (9 strings) |
| `app/manifest.ts:5` to `6` | `name`, `short_name` "CHEF" (Home Screen label) |
| `app/page.tsx:657` to `658` | `<title>CHEF \| Home</title>`, meta description |
| `app/create/page.tsx:1031` to `1032` | page titles and description |
| `app/recipe/[id]/RecipeDetailClient.tsx:210` | share title `CHEF \| <recipe>` |
| `app/recipe/[id]/opengraph-image.tsx:56`, `:68`, `:108` | "CHEF", "CHEF RECIPE" drawn in the OG image |
| `app/about/page.tsx:19`, `:32`, `:44`, `:55`, `:95` | "About CHEF" and body |
| `app/privacy/page.tsx:9`, `app/terms/page.tsx:9` | placeholders (replaced by redirects, section 8) |
| `components/navbar.tsx:51` | wordmark "chef." |
| `components/footer.tsx:20` | "© CHEF" |
| `components/install-dialog.tsx:32`, `:34`, `:60` | install copy |
| `app/opengraph-image.png` | static image reading "CHEF COOKBOOK, Personal cook book website." |
| `app/icon.svg`, `app/apple-icon.png`, `app/favicon.ico`, `public/icons/*` | chef-hat icon, no text; can stay |

Internal names that don't need to change but can, since the origin moves anyway and localStorage does not follow it: `components/command-palette/shared.tsx:7` (`chef:open-command-palette`), `components/cook/CookMode.tsx:80`, `components/import/lib.ts:132`, `package.json` `name`. Dev seed `convex/seed.ts` ("Chef Gordon") and `convex/recipes.test.ts:303` are content, not branding.

**The real question is language.** All UI copy is English: `<html lang="en">`, about 9,000 lines of TSX in 50 app and component files, 37 English `ConvexError` messages in 10 Convex files, English Gemini prompts in `convex/importRecipe.ts` and `convex/ai.ts`, and the hub marks it `uiLanguage: 'en'` **[verified]**. The Акаунт pieces are Bulgarian by decision (Вход, Акаунт, Изход, Изтрий данните, "Анонимен готвач"). A name-only rename leaves a Bulgarian name on an English app with Bulgarian account bits; a full translation is its own project. Owner decides; the migration plan should not silently include translation.

### In the hub (`~/projects/onova-za`) [verified]

| File | Change |
| --- | --- |
| `src/content/projects/chef/` (`index.ts`, `home.webp`) | Move to `src/content/projects/onova-za-kuhnyata/` (slug pattern of `onova-za-smetkata`, `onova-za-klientite`; the README's own example is `pnpm new:project onova-za-kuhnyata "кухнята"`). `slug`, `name: 'Онова за кухнята'`, `seo.title`, `cover.alt` and `body.about` (both say "Chef"), `links.live: 'https://kuhnyata.onovaza.com'` (`/vhod` finds the project by this domain, #18), `links.github` if the repo is renamed, `uiLanguage` per the language decision, `updatedAt`. New screenshot (the current one shows "chef.") |
| `src/content/registry.ts:5`, `:16` | import and entry |
| `src/content/projects/dial-in/index.ts:35`, `src/content/projects/onova-za-smetkata/index.ts:35` | `related: ['chef', ...]` |
| `e2e/smoke.spec.ts:8` | `/proekti/chef` |
| `next.config.ts` | 308 `/proekti/chef` to `/proekti/onova-za-kuhnyata` ("Old spellings become 308 redirects", `docs/strategy.md:55`), next to #29's `/kuhnyata` to `https://kuhnyata.onovaza.com` |
| project schema and data | `akaunt: true` (the field the #19 prototype names in `src/app/prototype/akaunt-projects.ts:2`), so `/akaunt`'s delete copy lists Кухнята from data (#20) |

Ships with the cutover, so the hub never links an address that isn't live. Agent (PR), owner merges.

## 10. Env per Vercel environment, and Convex env

Today in Vercel `chef` **[verified]**: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_SIGN_IN_URL` (`/sign-in`), `NEXT_PUBLIC_CLERK_SIGN_UP_URL` (`/sign-up`), `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` (`/?welcome=true`), `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` (`/`), `NEXT_PUBLIC_CONVEX_URL`, each one value across Development, Preview and Production. The local `.env` is a pull of those (Convex URL is the prod deployment); `.env.local` overrides it with the dev deployment. So **every preview deployment talks to production Convex** today.

| Variable | Production | Preview and Development |
| --- | --- | --- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_live_` (онова за) | `pk_test_` of the онова за **dev** instance |
| `CLERK_SECRET_KEY` | `sk_live_` key named `kuhnyata`, Sensitive | `sk_test_` of the dev instance |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL`, `..._SIGN_UP_URL` | `https://onovaza.com/vhod` | **remove** (otherwise `/sign-in` redirects to itself) |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL`, `..._AFTER_SIGN_UP_URL` | remove (deprecated **[docs]**, and the welcome flow goes) | remove |
| `CLERK_AUTHORIZED_PARTIES` (new) | `https://kuhnyata.onovaza.com` | unset |
| `NEXT_PUBLIC_CONVEX_URL` | `https://descriptive-snail-667.convex.cloud` (unchanged) | `https://hearty-kookabura-538.convex.cloud` (dev), or Convex preview deployments (owner question) |
| `NEXT_PUBLIC_SITE_URL` (new, optional) | `https://kuhnyata.onovaza.com` | unset (falls back) |

| Convex | `descriptive-snail-667` (prod) | `hearty-kookabura-538` (dev) |
| --- | --- | --- |
| `CLERK_JWT_ISSUER_DOMAIN` | Chef's dev FAPI until cutover, then `https://clerk.onovaza.com` | Chef's dev FAPI, then the онова за dev FAPI |
| `CLERK_AUTHORIZED_PARTIES` | `https://kuhnyata.onovaza.com` (after #24's check) | unset |
| `CLERK_WEBHOOK_SIGNING_SECRET` | new `whsec_` | optional, for testing the route |
| `GEMINI_API_KEY` | unchanged **[prior]** | unchanged |

Moving previews to the dev deployment can happen now and closes today's "previews write production data" gap. Splitting preview keys is required, not tidy-up: `pk_live_` does not work on `*.vercel.app` **[prior]**. Locally: delete `.env` (it holds the shared keys and points at prod) and `vercel env pull` Development into `.env.local`, keeping `CONVEX_DEPLOYMENT`. The dev seed (`convex/devSeed.ts`, keyed by a Clerk user id) is rerun for a test user in the new dev instance.

Who: dev and preview values agent; production values agent, owner confirms.

## 11. Hosts and metadata [verified]

| Where | Today | Change |
| --- | --- | --- |
| `app/layout.tsx:31` `metadataBase`, `:41` `openGraph.url` | `https://chef-black.vercel.app` | `https://kuhnyata.onovaza.com`, ideally from `NEXT_PUBLIC_SITE_URL` as the hub does. Also set `openGraph.locale` (`en_US` today) to match the language decision |
| sitemap, robots, canonical | none | Optional; #29's step 7 mentions "Chef's canonical and sitemap host", but neither exists |
| `next.config.ts` `images.remotePatterns` | both Convex hosts, `img.clerk.com` | unchanged (Convex deployments stay, production Clerk images are also `img.clerk.com` **[inference]**) |
| `convex/auth.config.ts:4` | dev FAPI | env (section 6) |
| Clerk appearance legal URLs | `/terms`, `/privacy` | go with the appearance block (section 7) |
| CSP | none in Chef | nothing (unlike Сметката's hard-coded Clerk host) |
| Installed PWAs on armyant.app | `start_url: "/"` on the old origin | after the 308 they open outside the app scope; people reinstall from `kuhnyata.onovaza.com` **[inference]**. localStorage (install prompt seen, banner dismissed, unit system, cook progress) stays behind on the old origin |
| Old-domain redirects | | #29 section 3.1: `armyant.app` and `www` domain redirects, `chef-black.vercel.app` routing rule. Keep the `chef` Vercel project |

## 12. The cutover wipe, table by table (prod `descriptive-snail-667`, read 2026-11-06) [verified]

| Table | Rows | Keep | Drop | Notes |
| --- | --- | --- | --- | --- |
| `users` | 11 | 3 | 8 | The 3 owners of recipes become anonymous chefs: `name: "Анонимен готвач"`, `email`, `avatarUrl`, `bio` removed, `tokenIdentifier` set to a value no sign-in produces (e.g. `anonymous\|1`), `userId` unchanged. The 8 dropped include the 2 whose Clerk user no longer exists. 1 row has a bio; all 11 avatars are `img.clerk.com` |
| `recipes` | **15** | 15 | 0 | All public, 3 owners with 12, 2 and 1 recipes. One recipe is newer than #22 (created 2026-10-31), so the rule is "every recipe", not "14". Then `refreshAuthorName` for each of the 3 rewrites `authorName` and `searchText` on all 15 |
| `favorites` | 6 | 0 | 6 | 3 people |
| `shoppingList` | 34 | 0 | 34 | 3 people |
| `mealPlans` | 44 | 0 | 44 | 3 people |
| `rateLimits` | 11 | 0 | 11 | 7 action kinds |
| `_storage` | 15 files, 5.1 MB | 15 | 0 | Every file is a kept recipe's photo; nothing to delete today. The daily orphan sweep covers any later strays |
| `_scheduled_functions` | 8 | | | All completed (`tagRecipeIngredients`, `deleteOrphanUploads`); check none is pending at cutover, since a queued `refreshAuthorName` could rewrite a name after the wipe |

- Shape: one `internalMutation` `migrations.cutoverWipe({ dryRun })` in `convex/migrations.ts` that returns the counts above when `dryRun` is true. 106 deletes and 3 patches fit one transaction (limit 16,000 writes **[prior]**). The stale `backfillSearchText` there can go.
- Rehearse on a copy in the dev deployment first (Convex dashboard export and import, or `npx convex export` then `import` to dev); counts must match the dry run on prod right before cutover.
- Run order at cutover: Convex deploy with the new issuer, then `npx convex run --prod migrations:cutoverWipe '{"dryRun":false}'` (owner confirms), then the Vercel production deploy. Between the first and the last, armyant.app is signed-out against Convex for a few minutes, which #22 accepts.
- Later, out of scope: `reassignRecipes({ from, to, recipeIds? })` (#22), same file.

## 13. Tests

Today **[verified]**, all Vitest with `convex-test`, every identity built as `withIdentity({ subject, name, tokenIdentifier: "test|..." })`:

| File | Tests | Auth-relevant |
| --- | --- | --- |
| `convex/recipes.test.ts` | 22 | host vs guest access, private recipes, image ownership, rename refreshing `authorName` (:307), "Cook" fallback (:325) |
| `convex/shoppingList.test.ts` | 4 | per-user lists |
| `convex/mealPlans.test.ts` | 3 | other user can't touch your plans (:48) |
| `convex/rateLimit.test.ts` | 4 | quotas per user, an import action as a user |
| `convex/storageCleanup.test.ts` | 2 | upload sweep |
| `convex/importRecipe.test.ts` | 2 | |
| `lib/quantities.test.ts` | 17 | none |

Not covered: `middleware.ts`, the sign-in redirects, `users.getMe`/`update`, deletion, webhooks. No `.github/` workflow; Vercel runs `next build` only, so tests and `tsc` run only when someone runs them.

To add (agent): `convex/lib/auth.test.ts` (no env: any identity passes; env set: matching `azp` passes, missing or other `azp` reads as signed out, via `vi.stubEnv`); `users.store` keeps a name when the token has none; `accountDeletion.test.ts` (every table emptied for the user, another user's favorite of a deleted recipe removed, photo deleted, `rateLimits` kept on Изтрий данните and dropped on `user.deleted`); `clerkWebhook.test.ts` and a dedupe test copied from Сметката; `migrations.test.ts` for `cutoverWipe` (keeps 3 anonymized users and all recipes, drops the rest, `authorName` rewritten). Optional: a small GitHub Actions job (`pnpm test`, `tsc`, `next build`) like the hub's `.github/workflows/ci.yml`. A browser check on the preview (signed-out protected page to the dev Portal, avatar menu, Изтрий данните) and on production after cutover (to `/vhod` and back).

## 14. Rollout order

| # | Step | Who |
| --- | --- | --- |
| **Before cutover, on today's Clerk dev instance** | | |
| 1 | Vercel Preview and Development `NEXT_PUBLIC_CONVEX_URL` to the dev deployment (stops previews writing prod data) | Agent |
| 2 | PR: Convex 1.49.0, `convex-test` 0.0.67, drop `package-lock.json` (section 2) | Agent; owner merges; `npx convex deploy` owner confirms |
| 3 | PR: `convex/lib/auth.ts`, 37 call sites, lookups by `subject`, "Cook" fix, tests (sections 3, 4) | Agent; owner merges |
| 4 | Set `CLERK_JWT_ISSUER_DOMAIN` (today's dev FAPI) on both deployments, then PR: `auth.config.ts` on env with `customJwt`, `picture`; run #24's 10-minute `azp` check on dev | Agent; prod env and deploy owner confirms |
| 5 | PR: `deleteUserData`, Изтрий данните UI, `user.deleted` route and handler, tests (section 5); the route answers 503 until the secret exists | Agent; owner merges |
| 6 | PR: avatar menu, sign-in links, `/sign-in` and `/sign-up` redirects, `authorizedParties` from env, welcome flow (sections 7, 8). Needs step 7's env change in the same release | Agent; owner merges |
| 7 | Remove `NEXT_PUBLIC_CLERK_SIGN_IN_URL`/`SIGN_UP_URL`/`AFTER_*` from Preview and Development | Agent |
| 8 | PR: `migrations.cutoverWipe` with dry run; rehearse on a dev copy (section 12) | Agent |
| 9 | Rename and copy (section 9), per the owner's language decision; may wait for the cutover release | Agent; owner merges |
| **Needs the онова за app (#26 phases 1 to 5 done, hub's `/vhod` live)** | | |
| 10 | Preview and Development Clerk keys to the онова за dev instance; dev Convex `CLERK_JWT_ISSUER_DOMAIN` to its FAPI; rerun the dev seed | Agent |
| 11 | Check the preview end to end: signed-out protected page, avatar menu, Изтрий данните | Agent (browser) |
| **Cutover (one window)** | | |
| 12 | `vercel domains add kuhnyata.onovaza.com chef` (#26 6.1) | Agent, owner confirms |
| 13 | Prod Convex: `CLERK_JWT_ISSUER_DOMAIN=https://clerk.onovaza.com`, `CLERK_WEBHOOK_SIGNING_SECRET`, later `CLERK_AUTHORIZED_PARTIES`; `npx convex deploy` | Agent, owner confirms |
| 14 | `cutoverWipe` dry run, compare counts, then real run | Agent, owner confirms |
| 15 | Vercel Production env (section 10), `RecipePage` on `getToken()`, `vercel --prod` | Agent, owner confirms |
| 16 | Clerk webhook endpoint for `user.deleted` (#26 phase 6) | Owner, or agent with `clerk api`, owner confirms |
| 17 | Verify: `/vhod` round trip, signed-out protected page lands on `/vhod`, anonymous chefs' recipes and profiles render, a test Изтрий данните, a test `user.deleted` | Agent (browser), owner signs in |
| 18 | Redirects per #29 section 3.1; hub PR (section 9) | Agent, owner confirms or merges |
| **Afterwards** | | |
| 19 | Delete Chef's old Clerk application once no env uses its keys (#22) | Owner |
| 20 | Drop `tokenIdentifier`, the `/share` matcher, the `convex` template references | Agent |

## 15. Questions for the owner (for the #34 grilling)

1. **Language:** is the rename name-only, or does Кухнята's UI (and its Gemini output) become Bulgarian? If name-only, should the hub keep `uiLanguage: 'en'` and the Акаунт bits stay Bulgarian inside an English app?
2. **When the name changes:** in the cutover release, or earlier on armyant.app?
3. **Hub slug:** `onova-za-kuhnyata` (matches the other two Онова за projects) with a 308 from `/proekti/chef`?
4. **GitHub repo:** rename `HayGrouve/chef` (GitHub redirects old URLs), or keep it? The Vercel and Convex projects stay `chef` either way.
5. **Where "Данни" lives:** on `/profile/edit`, or a new settings page? And is an export of your recipes wanted before Изтрий данните?
6. **Изтрий данните and public recipes:** confirm they vanish for others too (favorites and plans of them go), as #20's "everything" implies.
7. **Rate limits on Изтрий данните:** keep the counters so wiping doesn't reset Gemini quotas?
8. **Fallback name** for a nameless Акаунт: "Готвач", or something else?
9. **Install prompt:** drop the `?welcome=true` flow, or show it once when a new profile is created?
10. **Previews:** the dev deployment (simple, shared with local dev), or Convex preview deployments (a deploy key and a build command change)?
11. **The 15th recipe** (2026-10-31) is kept under its owner's anonymous chef like the rest: confirm "every recipe" rather than "the 14".

## 16. Open / unverified

- That `azp` reaches `getUserIdentity()` under `customJwt`, and that the RSC cookie token carries it: #24's dev check and its step 3.
- That changing `CLERK_JWT_ISSUER_DOMAIN` needs a redeploy before `auth.config.ts` uses it (assumed; the steps redeploy anyway).
- What Clerk puts in `{{user.full_name}}` for a user with no name.
- `@clerk/nextjs` 6 with `authorizedParties` and a token without `azp`: likely skipped by `@clerk/backend` 2.25.1, rejected by 3.11.1+.
- Whether any Clerk webhook endpoint exists in Chef's dev app (no receiver in code, so it would be dead either way) **[prior]**.
- Whether installed armyant.app PWAs follow the 308 gracefully on iOS and Android.
- The `/sign-in` redirect behaviour in development with the env unset (expected: the dev Account Portal) is from docs, not run.
- Clerk CLI was not logged in today, so Clerk reads used the Backend API with Chef's dev secret key from the local env file (never printed).

## Sources

Clerk (fetched 2026-11-06): [`clerkMiddleware()` options (`authorizedParties`, `signInUrl`)](https://clerk.com/docs/reference/nextjs/clerk-middleware.md), [`auth()` and `redirectToSignIn()`](https://clerk.com/docs/reference/nextjs/app-router/auth.md), [UserButton default items (reorder only)](https://clerk.com/docs/nextjs/guides/customizing-clerk/adding-items/user-button.md); via prior tickets: [Integrate Convex](https://clerk.com/docs/guides/development/integrations/databases/convex), [session tokens](https://clerk.com/docs/guides/sessions/session-tokens), [JWT templates](https://clerk.com/docs/guides/sessions/jwt-templates), [environment variables](https://clerk.com/docs/guides/development/clerk-environment-variables.md).

Convex: [convex-js CHANGELOG](https://github.com/get-convex/convex-js/blob/main/CHANGELOG.md) (1.31.5, 1.33.1, 1.42.2, 1.49.0), [custom JWT](https://docs.convex.dev/auth/advanced/custom-jwt), [Clerk](https://docs.convex.dev/auth/clerk), [limits](https://docs.convex.dev/production/state/limits). npm: `convex` 1.49.0, `convex-test` 0.0.67 (peer `^1.43.0`), `convex-helpers` 0.1.113 (peer `^1.25.4`) and 0.1.134 (peer `^1.46.0`), `@clerk/nextjs` 7.9.25.

Clerk skill: `clerk-nextjs-patterns` (`references/middleware-strategies.md`: `proxy.ts` on Next.js 16).

Chef (`c3b87fa`): `package.json`, `middleware.ts`, `next.config.ts`, `vitest.config.mts`, `app/layout.tsx`, `app/manifest.ts`, `app/ConvexClientProvider.tsx`, `app/page.tsx`, `app/about/page.tsx`, `app/create/page.tsx`, `app/privacy/page.tsx`, `app/terms/page.tsx`, `app/profile/edit/page.tsx`, `app/recipe/[id]/page.tsx`, `app/recipe/[id]/RecipeDetailClient.tsx`, `app/recipe/[id]/opengraph-image.tsx`, `app/sign-in/[[...sign-in]]/page.tsx`, `app/sign-up/[[...sign-up]]/page.tsx`, `app/opengraph-image.png`, `components/navbar.tsx`, `components/footer.tsx`, `components/install-dialog.tsx`, `components/UserSync.tsx`, `convex/auth.config.ts`, `convex/schema.ts`, `convex/users.ts`, `convex/recipes.ts`, `convex/shoppingList.ts`, `convex/mealPlans.ts`, `convex/ai.ts`, `convex/importRecipe.ts`, `convex/commandPalette.ts`, `convex/migrations.ts`, `convex/crons.ts`, `convex/storageCleanup.ts`, `convex/*.test.ts`.

Hub (`ed501fa`, `origin/prototype/akaunt-pages`): `README.md`, `docs/strategy.md`, `next.config.ts`, `src/content/projects/{chef,dial-in,onova-za-smetkata}/index.ts`, `src/content/registry.ts`, `src/lib/project-schema.ts`, `e2e/smoke.spec.ts`, `src/app/prototype/akaunt-projects.ts`. Сметката (`f0e5c0a`): `convex/http.ts`, `convex/lib/clerkWebhook.ts`, `convex/accountDeletion.ts`, `convex/lib/auth.ts`, `convex/schema.ts`, `convex/cleanup.ts`, `shared/host-profile.ts`.

Live (2026-11-06): `npx convex data --prod` on `users`, `recipes`, `favorites`, `shoppingList`, `mealPlans`, `rateLimits`, `_storage`, `_scheduled_functions` (counts and aggregates only); Clerk Backend API `GET /users/count`, `GET /users` (aggregated), `GET /jwt_templates` on Chef's dev instance; `vercel env ls --project chef` (names and targets), `vercel project inspect chef`, `vercel inspect --logs` on the latest production deployment.
