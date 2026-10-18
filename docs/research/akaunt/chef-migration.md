# Moving Chef's users and data into the shared Акаунт

Research for [#15](https://github.com/HayGrouve/onova-za/issues/15) on the [Акаунт map (#12)](https://github.com/HayGrouve/onova-za/issues/12). Architecture: [ADR 0001](https://github.com/HayGrouve/onova-za/blob/main/docs/adr/0001-one-akaunt-on-onovaza-subdomains.md) (one Clerk production app "онова за", Chef becomes Онова за кухнята at `kuhnyata.onovaza.com`, Google + email code only).

Written 2026-10-19. Everything was read-only: `GET` calls with `clerk api` against Chef's Clerk app `app_2tH2qiJhzFDx8ctPdabwTuwuqEx` (development instance), `npx convex data` against Chef's Convex deployments piped straight into `jq` aggregates (nothing written to disk), and Chef's code at `~/projects/chef` (identical to `HayGrouve/chef` `main` at `c3b87fa` for the files cited). No personal data in this file: counts only.

Markers: **[verified]** = checked against the live system or code. **[docs]** = stated in a primary source linked in [Sources](#sources). **[inference]** = my reading of the facts. **[unverified]** = not checked.

## Answer in short

- There is no Clerk feature that moves users from a development instance to a production instance ("You cannot migrate users from your Development instance to your Production instance") **[docs]**. You re-create them with the Backend API `CreateUser`, which is what Clerk's own migration tool does, including a "Clerk" source for "migrating from a development instance to production" **[docs]**.
- What carries over: verified email, first and last name (only if those fields are enabled in the new instance), a custom `created_at`, and the old id as `external_id`. What does not: the Clerk user id, the Google and Apple links (they re-link by verified email on first OAuth sign-in), passwords (not wanted anyway), sessions (everyone signs in once more) **[docs]**.
- Chef's data is keyed by the Clerk user id (`identity.subject`) in five tables, and only the `users` table looks up by `tokenIdentifier` **[verified]**. Both change with the new instance, because `sub` and `iss` are default claims no template can override **[docs]**.
- Recommended: **pre-import the users who have something to keep into the new production instance with `external_id` = old id, then run one Convex migration at cutover that rewrites `userId` (and `tokenIdentifier`) from old id to new id across about 110 rows (rate-limit counters can just be dropped)**. Fallback if the owner does not want to create Акаунти on users' behalf: claim old data by verified email on first sign-in.

## 1. What Chef has today

### Clerk (development instance, FAPI `good-puma-58.clerk.accounts.dev`) [verified]

| Group | Users | Email verified by | Active last 30 days | Has a Convex `users` row (prod) | Owns recipes, favorites, lists or meal plans (prod) |
| --- | --- | --- | --- | --- | --- |
| Google | 7 | `from_oauth_google` (all Gmail) | 2 | 7 | 4 |
| Password | 5 | `admin` (3), `email_code` (2) | 3 | 0 | 1 |
| Apple | 2 | `from_oauth_apple` (no private relay addresses) | 0 | 2 | 1 |

- Every user has exactly one email address. For every Google and Apple user the OAuth email equals the primary email.
- The 3 `admin`-verified password users were created from the dashboard or API, all with plus-addressed emails and no prod data: most likely the owner's test accounts **[inference]**.
- No user has `external_id`, public, private or unsafe metadata, phone numbers, passkeys, 2FA or a username.
- `has_image` is true for the 7 Google users only; every `image_url` is on `img.clerk.com`.
- Instance config: email code and password sign-in, Google and Apple enabled, first and last name **disabled** in the user model (OAuth users still have names from their provider).
- One JWT template, `convex`: `aud: "convex"` plus `name`, `email`, `email_verified`, `picture`, `given_name`, `family_name`, `nickname`, `phone_number`, `updated_at`, lifetime 3600 s.

### Convex (prod deployment `descriptive-snail-667`, the one armyant.app's JS bundle points at) [verified]

| Table | Rows | Keyed by |
| --- | --- | --- |
| `users` | 11 | `tokenIdentifier` (index `by_token`) and `userId` (index `by_userId`) |
| `recipes` | 14 (all public, from 3 owners) | `userId` |
| `favorites` | 6 | `userId` |
| `shoppingList` | 34 | `userId` |
| `mealPlans` | 44 | `userId` |
| `rateLimits` | 10 | `userId` (short-lived quota counters) |

- All 11 `users` rows carry issuer `https://good-puma-58.clerk.accounts.dev`; `userId` is a Clerk `user_...` id.
- 9 rows match current Clerk users (7 Google, 2 Apple). **2 `users` rows and 40 content rows (2 favorites, 22 meal plans, 16 list items) belong to ids that no longer exist in Clerk**: deleted Clerk users whose data stayed, because Chef has no `user.deleted` handling.
- 1 password user owns 21 meal plans and 3 list items in prod but has no `users` row. Odd but harmless for a re-key keyed on `userId` **[inference]**.
- All 11 `avatarUrl` values are `img.clerk.com` URLs; 1 user has a bio.
- The local `.env.local` deployment is a separate dev deployment with seed ("ghost") data and the test accounts; it does not matter for the move.

### How Chef's code uses the identity [verified]

- `convex/auth.config.ts:4` hard-codes `domain: "https://good-puma-58.clerk.accounts.dev"`, `applicationID: "convex"`. No Convex env var holds the issuer (prod and dev Convex env contain only `GEMINI_API_KEY`).
- `convex/users.ts`: `getMe`, `update` and `store` look the profile up by `tokenIdentifier` (lines 50, 69, 102). `store` (run by `components/UserSync.tsx` on every signed-in load) inserts a new row when none matches (line 142), and on an existing row re-copies `userId = identity.subject`, the Clerk avatar and `name = identity.name?.trim() || "Cook"` (lines 109 to 131).
- Every other read and write is keyed by `identity.subject`: `recipes.ts`, `favorites` (in `recipes.ts`), `shoppingList.ts`, `mealPlans.ts`, `commandPalette.ts`, `importRecipe.ts`, `ai.ts`, `rateLimit.ts`, `feed.ts`, `access.ts`.
- Public profile URLs contain the Clerk id: `/profile/${recipe.userId}` (`app/recipe/[id]/RecipeDetailClient.tsx:248`, `app/profile/edit/page.tsx:40`, `app/profile/[userId]/layout.tsx`).
- `app/recipe/[id]/page.tsx:23` asks Clerk for `getToken({ template: "convex" })` on the server; the installed `convex@1.30.0` `ConvexProviderWithClerk` always uses the `convex` template.
- No webhooks: no `convex/http.ts`, no `app/api`, no Svix code. No Clerk metadata reads or writes.

## 2. Exporting from the development instance

- **Dashboard CSV**: instance **Settings > User exports > Export users**, "includes their hashed passwords" **[docs]**. Columns, per Clerk's sample export in the migration tool: `id, first_name, last_name, username, primary_email_address, primary_phone_number, verified_email_addresses, unverified_email_addresses, verified_phone_numbers, unverified_phone_numbers, totp_secret, password_digest, password_hasher` **[docs]**. No image, OAuth links, `created_at` or metadata. Clerk's migration tool describes its `clerk` source as being for "migrating from a development instance to production", which implies the export exists on dev instances **[docs]**; I did not open the dashboard to confirm **[unverified]**.
- **Backend API** `GET /users` (or `getUserList()`) works on the dev instance **[verified]** and returns the full user object: ids, emails with verification strategy, names, `image_url`/`has_image`, `external_accounts` (provider, provider email, names, avatar), metadata, `created_at`, `last_sign_in_at`, `last_active_at`, `legal_accepted_at`. It does not return password digests or TOTP secrets **[verified]**. For 14 users this is all the export needed: passwords are off in the new instance, so the CSV adds nothing.
- Dev-instance limits: capped at 100 users, "user data can not be transferred between instances" **[docs]**. Dev `CreateUser` rate limit is 100 requests per 10 s, prod 1000 per 10 s **[docs]**; irrelevant at this size.

## 3. Recreating users in the production instance

`CreateUser` (`POST /users`) accepts: `email_address[]` (created **verified** by default), `first_name`, `last_name`, `external_id` ("the ID of the user as used in your external systems or your previous authentication solution", unique per instance), `created_at`, `legal_accepted_at`, `skip_legal_checks`, metadata, `locale`, `timezone`, `password_digest`/`password_hasher`, `skip_password_requirement`, `totp_secret`, `backup_codes` **[docs]**. "Trying to add a field that isn't enabled will result in an error" **[docs]**.

| Carries over | How |
| --- | --- |
| Email | `email_address`, verified by default, so email code sign-in works at once |
| Name | `first_name`/`last_name`, **only if the new instance enables those fields** (Chef's dev instance has them off) |
| Sign-up date | `created_at` |
| Old id | `external_id`, queryable later with `GET /users?external_id=...` |
| Google link | Not importable: "OAuth connections can not be directly migrated ... rely on Clerk's Account Linking" **[docs]**. Re-links on first Google sign-in (below) |
| Avatar | Not a `CreateUser` field. Either upload with `updateUserProfileImage` or let the first Google sign-in supply it **[unverified]** whether Clerk adopts the Google picture on link |
| Password | Not needed (passwords are off). Dashboard CSV would carry bcrypt digests if ever wanted |
| Clerk user id, sessions | Never. New `user_...` ids; every user signs in again **[docs]** |

**First sign-in per group** (users pre-imported with their verified email):

- **Google (7)**: "Continue with Google". Google returns a verified email equal to the imported one, so "Clerk links the OAuth account to the existing account and signs the user in" **[docs]**. Email code also works. The Google consent screen now shows онова за's own OAuth client, because production needs its own credentials **[docs]**.
- **Password (5)**: passwords are off, so they request an email code to the same address. Works because imported addresses are verified **[docs]**. Nothing to reset. (The 3 likely test accounts can simply be left out.)
- **Apple (2)**: Apple is off, so email code to their real address (neither uses an Apple private relay address **[verified]**). Neither address is Gmail, so "Continue with Google" would only link if their Google account uses that same address **[unverified]**. Neither has signed in during the last 90 days **[verified]**.

Without pre-import, each person signs up fresh with the same method and gets a new Clerk user; Chef then has to find their old data itself (option B below).

## 4. Re-keying Chef's Convex data

`tokenIdentifier` is `iss` + `sub`, and `subject` is `sub` **[docs]**. After the move, `iss` becomes the new production FAPI (`https://clerk.onovaza.com` if the default is kept **[docs]**) and `sub` the new `user_...` id. `sub` is a default claim that templates cannot override **[docs]**. So every Chef user would land on an empty account, and `store` would create a second profile row with the "Cook" fallback name when the new Clerk user has no name.

| Option | How | For | Against |
| --- | --- | --- | --- |
| **A. One-off re-key at cutover** (recommended) | Import users with `external_id` = old id; read back the old to new id map; one `internalMutation` rewrites `userId` in `users`, `recipes`, `favorites`, `shoppingList`, `mealPlans`, sets `users.tokenIdentifier` to the new `iss\|sub`, keeps the old id in a new `users.legacyUserId`, drops `rateLimits` | Deterministic and fully testable before cutover; every group lands on its data whichever allowed method it uses; no permanent code in the sign-in path; about 110 rows fit in one transaction (limit 16,000 writes **[docs]**); Clerk's documented foreign-key approach | Creates Акаунти for people who have not acted yet (see consent note); a short coordinated window where Clerk keys, `auth.config.ts` and data must switch together |
| **B. Claim by verified email on first sign-in** | No Clerk import. A `legacyAccounts` table (email to old id, built from the dev `GET /users`); `store` re-keys the caller's rows when `email_verified` is true and the email matches | No Акаунт is created until the person signs in; inactive users drop out by themselves | Migration code runs in the live sign-in path and needs tests; `email` and `email_verified` must stay in the token; anyone who changed email is lost; unclaimed data needs a deadline and a purge; Convex docs allow email as a key only with verified emails **[docs]** |
| **C. Keep old ids forever** | Import with `external_id`, add a claim `"userId": "{{user.external_id \|\| user.id}}"` (Clerk's documented pattern **[docs]**) and read that claim instead of `subject` | No data rewrite; old profile URLs keep working | Two id shapes forever; the claim lives in the shared Акаунт's token, so every project would see a Chef-specific id; still needs code at ~50 call sites; conflicts with whatever #14 settles for shared ids |
| **D. Fresh start** | Do nothing | Zero work | Loses 14 public recipes, meal plans and lists of the 6 current users who own content |

Consent note **[inference, not legal advice]**: importing creates an онова за Акаунт, valid in every project, for people who signed up to Chef only. It is the same owner and service under a new name, but a short notice email before the move, and the hub's new privacy policy, make that explicit. Importing only people with something to keep (below) also limits it.

## 5. Recommended plan (option A)

Who to import **[inference, owner decides]**: the 9 Google and Apple users (all have profiles; 5 own content) and the 2 self-signed-up password users (1 owns content). Skip the 3 admin-created test accounts. Purge the 2 profiles and 40 rows owned by ids already deleted from Clerk.

1. **New instance prerequisites** (production checklist, not this ticket): first and last name enabled as optional, or Chef's `store` changed to keep an existing name instead of writing "Cook" (`convex/users.ts:109`); a token Convex accepts (see section 6).
2. **Chef branch**: `auth.config.ts` reads `CLERK_JWT_ISSUER_DOMAIN` (Convex's documented pattern **[docs]**); optional `users.legacyUserId` with an index; `migrations.rekeyUsers` internal mutation taking `[{ from, to }]` plus the new issuer; `/profile/<old id>` redirects to the new id via `legacyUserId`. Rehearse the mutation against a copy of the data in a dev deployment.
3. **Import**: `clerk api /users -d '{"email_address":[...],"first_name":...,"last_name":...,"external_id":"<old id>","created_at":"..."}' --app <онова за> --instance prod`, one per user, `--dry-run` first. Production mutation, so the owner confirms. Then `GET /users?limit=100` on prod and keep only the `external_id` to `id` pairs as the map (no emails needed for the migration itself).
4. **Cutover** (minutes, everyone is signed out anyway): set `CLERK_JWT_ISSUER_DOMAIN` on Convex prod, `npx convex deploy` (owner confirms), `npx convex run --prod migrations:rekeyUsers '<map>'`, swap Vercel's Clerk keys to `pk_live`/`sk_live`, deploy, and only then 308 armyant.app to `kuhnyata.onovaza.com`. Convex `auth.config.ts` may list both issuers during the switch ("the first one fulfilling the above criteria will be used" **[docs]**).
5. **After**: add the `user.deleted` handler the ADR requires; drop `legacyUserId` and the migration code after a few months, or keep `legacyUserId` for old profile links.

A possible simplification, depending on #14: once there is a single issuer, look profiles up by `subject` instead of `tokenIdentifier`; then only `userId` needs rewriting.

## 6. Everything else in Chef tied to the old instance [verified]

| Item | Where | What changes |
| --- | --- | --- |
| Issuer | `convex/auth.config.ts:4`, hard-coded | Production FAPI via `CLERK_JWT_ISSUER_DOMAIN` |
| Token for Convex | JWT template `convex` in the dev instance; `getToken({ template: "convex" })` in `app/recipe/[id]/page.tsx:23` and inside `convex@1.30.0`'s provider | Either recreate a `convex` template in the new instance with the same claims (works with Chef's current code), or activate Clerk's Convex integration, which puts `aud: "convex"` in the session token **[docs]**; current `convex-js` then calls `getToken()` without a template when `sessionClaims.aud === "convex"` **[docs]**, but that needs a Convex upgrade, the server-side call changed, and `name`, `email`, `email_verified`, `picture` added to the session claims. Shared by every Convex project on the Акаунт, so coordinate with #14 |
| Vercel env (project `chef`) | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_SIGN_IN_URL`, `NEXT_PUBLIC_CLERK_SIGN_UP_URL`, `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL`, `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL`, `NEXT_PUBLIC_CONVEX_URL` | New `pk_live`/`sk_live`; the two `AFTER_*` names are deprecated in favour of `*_FALLBACK_REDIRECT_URL` **[docs]**; sign-in URLs depend on where sign-in lives (hub or per project) |
| Local `.env` | Same Clerk names, gitignored (`.env*`) | `vercel env pull` after the switch |
| Webhooks | None in code; Clerk dashboard endpoints not checked (the Backend API has no read endpoint for them) **[unverified]** | Add `user.deleted` (ADR 0001) |
| Metadata | Not used by any user or by the code | Nothing |
| Stored Clerk data | `users.avatarUrl` (all `img.clerk.com`), `users.email`, `users.name` | `store` refreshes avatar and name on the next sign-in; watch the "Cook" fallback |
| Ids in URLs | `/profile/<Clerk id>` | Redirect old ids via `legacyUserId` |
| Legal links | Clerk `appearance.layout.termsPageUrl`/`privacyPageUrl` = `/terms`, `/privacy` | Point at the hub's pages (ADR 0001) |
| Sign-in redirect guard | `middleware.ts` allows only same-origin `redirect_url` | Revisit if sign-in moves to another subdomain |
| Dev seeding | `convex/devSeed.ts` takes a Clerk `userId` | Dev only; new test user id |

## 7. Open questions and unverified points

- Whether the dashboard **User exports** button is available on development instances (implied by Clerk's migration tool, not seen).
- Whether Clerk copies the Google profile picture and names onto an imported user when the Google account links on first sign-in.
- Whether `CreateUser` sends the user any email (I found nothing saying it does).
- Whether any webhook endpoint is configured in Chef's Clerk dashboard (code has no receiver, so it would be dead either way).
- Why one password user owns prod data without a `users` row.
- Whether the 3 admin-created password users are really test accounts (the owner knows).
- The token shape (template vs Convex integration) and whether profiles should be looked up by `subject` belong with #14.

## Sources

Clerk (fetched 2026-10-19):

- Migrating overview (dev to prod statement, CreateUser import, `external_id` and `{{user.external_id || user.id}}`, dashboard export): https://clerk.com/docs/guides/development/migrating/overview.md
- Instances / Environments (100-user cap, no transfer between instances): https://clerk.com/docs/guides/development/managing-environments.md
- `createUser()` parameters, verified-by-default emails, disabled-field error, rate limits: https://clerk.com/docs/reference/backend/user/create-user.md
- Backend API `CreateUser`: https://clerk.com/docs/reference/backend-api/tag/users/POST/users
- Account linking for OAuth: https://clerk.com/docs/guides/configure/auth-strategies/social-connections/account-linking.md
- JWT templates (default claims cannot be overridden, shortcodes, `||`): https://clerk.com/docs/guides/sessions/jwt-templates.md
- Integrate Convex with Clerk (Convex integration, `aud` pre-mapped in session claims): https://clerk.com/docs/guides/development/integrations/databases/convex.md
- Deploy to production (own OAuth credentials, webhooks): https://clerk.com/docs/guides/development/deployment/production.md
- Environment variables (deprecated `AFTER_SIGN_*_URL`): https://clerk.com/docs/guides/development/clerk-environment-variables.md
- Clerk migration tool README and `clerk` transformer (dev to prod, `externalId: userData.userId`, OAuth not migratable): https://github.com/clerk/migration-tool (`README.md`, `src/transformers/clerk.ts`, `src/migrate/import-users.ts`, `samples/clerk.csv`), last commit 2026-04-07

Convex (fetched 2026-10-19):

- `UserIdentity` (`tokenIdentifier` = `sub` + `iss`, custom claims): https://docs.convex.dev/api/interfaces/server.UserIdentity
- Convex & Clerk (`CLERK_JWT_ISSUER_DOMAIN`, dev and prod instances): https://docs.convex.dev/auth/clerk
- Storing users in the database (email as a key only if verified; webhook sync): https://docs.convex.dev/auth/database-auth
- Custom auth (multiple providers): https://docs.convex.dev/auth/advanced/custom-auth
- Limits (16,000 documents written per mutation): https://docs.convex.dev/production/state/limits
- `ConvexProviderWithClerk` source (`sessionClaims.aud === "convex"` branch): https://github.com/get-convex/convex-js/blob/main/src/react-clerk/ConvexProviderWithClerk.tsx

Chef (`HayGrouve/chef` `main` at `c3b87fa`): `convex/schema.ts`, `convex/users.ts`, `convex/auth.config.ts`, `convex/access.ts`, `convex/feed.ts`, `convex/rateLimit.ts`, `convex/recipes.ts`, `convex/shoppingList.ts`, `convex/mealPlans.ts`, `convex/commandPalette.ts`, `convex/importRecipe.ts`, `convex/ai.ts`, `convex/devSeed.ts`, `components/UserSync.tsx`, `app/ConvexClientProvider.tsx`, `app/recipe/[id]/page.tsx`, `app/recipe/[id]/RecipeDetailClient.tsx`, `app/profile/[userId]/layout.tsx`, `app/profile/edit/page.tsx`, `middleware.ts`, `node_modules/convex/dist/esm/react-clerk/ConvexProviderWithClerk.js` (1.30.0).

Live reads: Clerk `GET /users`, `GET /jwt_templates`, `clerk config pull` (Chef dev instance); `npx convex data` and `npx convex env list` (Chef prod and dev deployments); `vercel env ls --project chef` (names only); armyant.app's public HTML and JS (Clerk publishable key host, Convex URL).
