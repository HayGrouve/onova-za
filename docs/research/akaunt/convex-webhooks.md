# Many Convex deployments and webhooks on one Clerk instance

Research for [#14](https://github.com/HayGrouve/onova-za/issues/14) on map [#12](https://github.com/HayGrouve/onova-za/issues/12). Architecture from ADR 0001: one Clerk production app "онова за" on onovaza.com, each project on `<name>.onovaza.com` with its own Convex deployment, deletion global via `user.deleted`, Clerk free plan. Written 2026-10-19.

Tags: **[docs]** = current vendor docs (linked), **[source]** = vendor source code or OpenAPI spec, **[local]** = read in the sibling repos on 2026-10-19 (Сметката `main`, Клиентите `main` at `7a1ccd8`, Chef `main` at `c3b87fa`), **[unverified]** = reasoned or not checked against a primary source.

## 0. Answer in brief

1. **Trust.** Every Convex deployment trusts the one issuer independently: `convex/auth.config.ts` lists `{ domain: <Clerk Frontend API URL>, applicationID: "convex" }`, and Convex checks `iss` and `aud` on each token. Nothing is registered per deployment on the Clerk side, so any number of deployments share one integration (or one template). Use Clerk's native Convex integration (the session token itself carries `aud: "convex"`); the `convex` JWT template is the older path and still works.
2. **Ids.** `tokenIdentifier` is literally `` `${iss}|${sub}` ``. One instance means one `iss` (its Frontend API URL) and one `sub` per person (the Clerk user id), so both are identical in every project. Key users by `subject` (Clerk user id), because `user.deleted` carries only that id.
3. **Webhooks.** One endpoint per project on the one instance, each subscribed to `user.deleted` only, each with its own `whsec_` signing secret stored in that project's Convex deployment. Clerk sends via Svix; no endpoint or message limit is published for the free plan. Retries run about 27.5 hours, failed messages can be replayed from the Dashboard, and an endpoint failing for 5 days can be disabled.
4. **Сметката today.** Clerk's `<UserProfile>` "delete account" deletes the Clerk user; Clerk posts `user.deleted` to `https://<prod-deployment>.convex.site/clerk/webhook`; `convex/http.ts` verifies the Svix signature with Web Crypto, records the `svix-id` once, and schedules a batched, self-rescheduling erase (`accountDeletion.deleteHostData`). This is the pattern to copy.

## 1. How each Convex deployment trusts the one Clerk issuer

### What Convex checks

- `auth.config.ts` `domain` "must exactly match the `iss` field of the JWT", `applicationID` "must exactly match the `aud` field", and several providers may be listed ("the first one fulfilling the above criteria will be used") **[docs]** [custom-auth](https://docs.convex.dev/auth/advanced/custom-auth). Omitting `applicationID` "is often insecure" **[docs]** [custom-jwt](https://docs.convex.dev/auth/advanced/custom-jwt).
- The identity's `issuer` is the token's `iss` claim, read straight from the verified JWT **[source]** [`crates/keybroker/src/broker.rs`](https://github.com/get-convex/convex-backend/blob/main/crates/keybroker/src/broker.rs) (`let issuer = claims.issuer().to_string()`).
- Environment variables are per deployment ("you can use different values for the same key in dev and prod deployments"), and Project Settings can hold defaults per deployment type for newly created deployments **[docs]** [environment-variables](https://docs.convex.dev/production/environment-variables).

Consequence: trust is configured entirely on the Convex side, per deployment. A second, third or fourth deployment pointing at the same `domain` with `applicationID: "convex"` needs nothing new in Clerk. **[docs + reasoning]**

### Native Convex integration versus the `convex` JWT template

- **Native integration (current docs).** Clerk Dashboard, Convex integration page, "Activate Convex integration", which "will reveal the Frontend API URL". On the Sessions page "the default audience (`aud`) claim required by Convex is pre-mapped"; more claims can be added there. Convex then uses `domain: process.env.CLERK_FRONTEND_API_URL!`, `applicationID: 'convex'` **[docs]** [Clerk: Integrate Convex](https://clerk.com/docs/guides/development/integrations/databases/convex). Convex's own Clerk page uses the same shape with the env var named `CLERK_JWT_ISSUER_DOMAIN` **[docs]** [Convex: Clerk](https://docs.convex.dev/auth/clerk).
- **JWT template (older).** A template named `convex` with `aud: convex`, minted with `getToken({ template: 'convex' })`. Templates are per instance and default to a 60 s lifetime **[docs]** [JWT templates](https://clerk.com/docs/guides/sessions/jwt-templates). Neither page calls templates deprecated.
- **What the client does.** `ConvexProviderWithClerk` sends the plain session token when `sessionClaims?.aud === "convex"`, otherwise `getToken({ template: "convex" })` **[local]** (`node_modules/convex/dist/esm/react-clerk/ConvexProviderWithClerk.js` in Сметката, convex 1.42.1). convex 1.33.1 changelog: "It is safe to both set the JWT template and enable the integration. In 1.33.0 it broke if you only had the JWT template specified." **[source]** [convex-js CHANGELOG](https://github.com/get-convex/convex-js/blob/main/CHANGELOG.md). Convex's Next.js server-rendering guide calls `getToken()` with no template **[docs]** [server-rendering](https://docs.convex.dev/client/nextjs/app-router/server-rendering).
- **Claims.** "If you're using Clerk, the fields returned by getUserIdentity are determined by your JWT template's Claims config" **[docs]** [functions-auth](https://docs.convex.dev/auth/functions-auth). With the native integration, that config is the session token's claims on the Sessions page. Keep custom session claims under 1.2 KB (cookie limit) **[docs]** [session tokens](https://clerk.com/docs/guides/sessions/session-tokens). All three projects read `identity.name`, `identity.email` and `identity.pictureUrl` **[local]**, so the new instance must map `name`, `email` and `picture` into the session token. Which claims the integration pre-maps beyond `aud` is **[unverified]**; check the Sessions page after activating.

### Can several deployments share one template or integration?

Yes. The integration is a property of the Clerk instance (it shapes that instance's session token); the template is a named object on the instance. Either produces tokens with `iss = <instance Frontend API URL>` and `aud = "convex"`, which every deployment configured as above accepts. **[docs + reasoning]**

Side effect: a token minted on `smetkata.onovaza.com` is also accepted by Клиентите's deployment. That is the same person acting as themselves, and per-project templates (`aud: smetkata`, ...) would not isolate anything, because any page signed in to the instance can ask Clerk for any template by name. Not worth the extra moving parts. **[unverified reasoning]**

### What the three projects have today

| Project   | `auth.config.ts`                                                        | Token path                                                                                                                  | Users keyed by                                                                                        |
| --------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Сметката  | `domain: process.env.CLERK_JWT_ISSUER_DOMAIN!`, `applicationID: 'convex'` | `ConvexProviderWithClerk`, convex 1.42.1; prod uses a `convex` JWT template (`docs/clerk-production-setup.md` §1.4)          | `users.clerkSubject` = `identity.subject`, index `by_clerkSubject`                                    |
| Клиентите | same, env typed in `convex.config.ts`                                   | `ConvexProviderWithClerk`, convex 1.46.0                                                                                    | `users.tokenIdentifier` (index `by_token`); `clerkUserId` = subject stored but **not indexed**         |
| Chef      | `domain` **hard-coded** to its dev instance, `applicationID: "convex"`  | `ConvexProviderWithClerk`, convex 1.30.0 (template only); server `getToken({ template: "convex" })` in `app/recipe/[id]/page.tsx` | `users.tokenIdentifier` (index `by_token`) plus `users.userId` = subject (index `by_userId`); all data rows keyed by subject |

All **[local]**.

## 2. Are user ids and `tokenIdentifier` stable across projects?

- Convex: "`tokenIdentifier` is a combination of `subject` and `issuer` to ensure uniqueness even when multiple providers are used" **[docs]** [functions-auth](https://docs.convex.dev/auth/functions-auth). The exact format is `format!("{issuer_name}|{subject}")` **[source]** [`crates/convex/sync_types/src/types/mod.rs`](https://github.com/get-convex/convex-backend/blob/main/crates/convex/sync_types/src/types/mod.rs) (`UserIdentifier::construct`). Клиентите's tests already assume `https://clerk.test|user_owner` **[local]**.
- Clerk session token: `iss` is "The Frontend API URL of your instance", `sub` is "The ID of the current user of the session" **[docs]** [session tokens](https://clerk.com/docs/guides/sessions/session-tokens).

So with one production instance, every project sees the same `subject` (`user_…`) and the same `tokenIdentifier` (`https://clerk.onovaza.com|user_…`, assuming the Frontend API lands on `clerk.onovaza.com`). **[docs + source]**

They are not stable across instances: the dev instance has its own `iss` and its own user ids, and moving Сметката and Chef to the new instance gives every person a new `sub` (Chef's 14 users included). If Chef's users are imported with `external_id` set to the old id, `user.deleted` carries it back as `data.external_id` **[source]** (`UserDeletedJSON` in `@clerk/backend` 3.14.0 `dist/api/resources/JSON.d.ts`). During a cutover, `auth.config.ts` can list both issuers **[docs]** [custom-auth](https://docs.convex.dev/auth/advanced/custom-auth).

**Key by `subject`.** It is what `user.deleted` delivers (`data.id`), it survives a change of Frontend API URL, and it is what Convex's own Clerk webhook example keys on ("use the `subject` ... which should be set to the Clerk user ID", `externalId` + `byExternalId` index) **[docs]** [database-auth](https://docs.convex.dev/auth/database-auth). Projects keyed by `tokenIdentifier` need at least an index on the subject for the webhook lookup (Клиентите lacks it; Chef has `by_userId`).

## 3. Delivering `user.deleted` to several projects

### Facts

- Clerk sends webhooks through Svix; endpoints are created in the Dashboard (Webhooks, Add Endpoint, URL, "Subscribe to events", Create) and the signing secret is on the endpoint's page **[docs]** [overview](https://clerk.com/docs/guides/development/webhooks/overview), [syncing](https://clerk.com/docs/guides/development/webhooks/syncing).
- **Several endpoints, each with its own events and secret.** Clerk's docs do not state it outright. Svix's API (which backs Clerk's endpoint UI) has "List the application's endpoints", per-endpoint `eventTypes`, "Get the endpoint's signing secret" at `/app/{app_id}/endpoint/{endpoint_id}/secret`, and rotation where "The previous secret will remain valid for the specified grace period (default 24 hours)" **[source]** [Svix OpenAPI](https://api.svix.com/api/v1/openapi.json) (v1.960.0). That the Clerk Dashboard exposes every one of these is **[unverified]** until the first two endpoints exist.
- **Free plan.** Hobby includes webhooks ("Synchronize Clerk user data with external systems") and JWT templates, 50,000 MRU per app, unlimited applications, custom domain; no endpoint or message limit is published **[docs]** [pricing](https://clerk.com/pricing). A hidden cap is **[unverified]**.
- **Retries.** Svix retries after: immediately, 5 s, 5 min, 30 min, 2 h, 5 h, 10 h, 10 h (about 27.5 h in total). Only 2xx within about 30 s is success; 3xx counts as failure. After the last attempt the message is "Failed" for that endpoint. An endpoint whose deliveries all fail for 5 days can be disabled (sender-side setting) **[docs]** [Svix retries](https://docs.svix.com/retries). Clerk: 4xx, 5xx or no response retries; 2xx stops **[docs]** [syncing](https://clerk.com/docs/guides/development/webhooks/syncing). Whether Clerk's Svix environment has auto-disable on is **[unverified]**.
- **Recovery.** Dashboard can resend one message, all failed since a date, or all missing **[docs]** [overview](https://clerk.com/docs/guides/development/webhooks/overview).
- **Ordering and duplicates.** "Events aren't guaranteed to arrive in the order they occurred", and can arrive more than once; webhooks are not for synchronous flows **[docs]** [overview](https://clerk.com/docs/guides/development/webhooks/overview).
- **Signature.** HMAC-SHA256 over `${svix_id}.${svix_timestamp}.${body}` with the base64 part of `whsec_…`; `svix-signature` may hold several space-separated `v1,` signatures; tolerance is up to the receiver **[docs]** [Svix manual verification](https://docs.svix.com/receiving/verifying-payloads/how-manual).
- **Payload.** `user.deleted` data is `UserDeletedJSON`: `object`, `id`, `deleted: true`, optional `external_id`; no email, no issuer **[source]** (`@clerk/backend` 3.14.0 `Webhooks.d.ts`, `JSON.d.ts`).

### What that means for us

- Each Clerk instance (dev and prod) has its own endpoints. On the production instance: one endpoint per project that stores data, `https://<that project's prod deployment>.convex.site/clerk/webhook`, subscribed to `user.deleted` only (profile fields are refreshed from token claims on sign-in, so `user.updated` is not needed). Each endpoint's `whsec_` goes into that deployment's `CLERK_WEBHOOK_SIGNING_SECRET`. On the dev instance: optionally one endpoint per project pointing at a shared dev deployment.
- Hub: no database, no endpoint. Кафето: no endpoint while its data stays in IndexedDB.
- Every project dedupes by `svix-id` in its own database, so the same message id arriving at four deployments does not collide. **[reasoning]**
- One project's endpoint failing does not affect the others (attempts are per endpoint). A project that was down for more than about a day needs a manual "recover failed" in the Dashboard. An optional nightly reconciliation (look up each stored subject with the Backend API, erase on 404) would close that gap; Backend API allows 1000 requests per 10 s on production instances **[docs]** [system limits](https://clerk.com/docs/guides/how-clerk-works/system-limits). **[optional, not designed]**
- Every project that holds the instance's Secret Key can delete any user of every project. Clerk "supports multiple active Secret Keys on the same instance" and suggests "a separate key for each place one is used ... naming each after its consumer" **[docs]** [rotate API keys](https://clerk.com/docs/guides/secure/rotate-api-keys). Use one key per project.

## 4. How Сметката's account deletion is triggered today

All **[local]**, HayGrouve/onova-za-smetkata, introduced in commit `8910f6d` ("Erase a Host's data when they delete their Clerk account", 2026-10-08).

1. The Host opens `/user-profile` (`src/routes/user-profile.$.tsx`, Clerk's `<UserProfile>`) and deletes the account. Clerk deletes the user and emits `user.deleted`.
2. Clerk (Svix) POSTs to `https://<prod-deployment>.convex.site/clerk/webhook`. The endpoint is set up by hand per `docs/DEPLOY.md` (Clerk Webhooks, event `user.deleted` only, secret into Convex `CLERK_WEBHOOK_SIGNING_SECRET`). `docs/clerk-production-setup.md` Phase 3 still says the webhook was removed; that is stale (it predates `8910f6d`).
3. `convex/http.ts` route `/clerk/webhook`: 503 if the secret is unset (so Clerk retries), reads the raw body, verifies with `convex/lib/clerkWebhook.ts` (Web Crypto HMAC, 5 min tolerance, accepts any of several `v1,` signatures, no `svix` dependency), 400 on bad signature, then for `user.deleted` calls `internal.accountDeletion.recordUserDeleted({ eventId: svix-id, clerkSubject: data.id })` and returns 200.
4. `recordUserDeleted` (internalMutation): returns early if `svix-id` is already in `processedWebhookEvents` (shared with Stripe events, pruned after 30 days by `cleanup.run`), records it, looks the user up by `by_clerkSubject`, and schedules `deleteHostData`. An unknown subject is a no-op.
5. `deleteHostData` deletes one bill with its relations per run and reschedules itself, then the Host's own rows (payment settings, groups, onboarding, rate-limit counters, recent quick scans and photos), schedules cancellation of a live Stripe subscription, and deletes the user. Covered by `convex/accountDeletion.test.ts` and `convex/lib/clerkWebhook.test.ts`.

Whether the endpoint is actually configured on Сметката's current production Clerk instance is **[unverified]** (no Dashboard access used); it does not matter, since that instance is retired.

### Клиентите is the opposite direction

Клиентите's in-app `account.deleteAccount` erases its own data in batches and then calls `DELETE https://api.clerk.com/v1/users/{id}` with `CLERK_SECRET_KEY` from Convex (`convex/account.ts`) **[local]**. On the shared instance that deletes the Акаунт everywhere, and the resulting `user.deleted` reaches every other project, which is correct under ADR 0001 but changes what the button means. It also has no `user.deleted` handler yet, so a deletion started elsewhere leaves its data behind.

## 5. Recommendation for the per-project plans

1. **Clerk, once per instance (dev and prod):** activate the native Convex integration; on the Sessions page map `name`, `email`, `picture` next to the pre-mapped `aud`. Optionally also create a `convex` JWT template so clients older than convex 1.33.1 keep working during the rollout (safe per the 1.33.1 changelog). Create one Secret Key per project.
2. **Every project's Convex:** keep `auth.config.ts` as `{ domain: process.env.CLERK_JWT_ISSUER_DOMAIN!, applicationID: 'convex' }` (Сметката and Клиентите already do; one name everywhere, matching Convex's docs). Set it per deployment: prod = the new instance's Frontend API URL, exactly; dev and preview = the dev instance's, via Project Settings defaults so preview deployments get it.
3. **Key users by Clerk user id** (`identity.subject`) with an index. Keeping `tokenIdentifier` as an extra column is harmless.
4. **One webhook endpoint per data-holding project** (Сметката, Клиентите, Кухнята; later Кафето if it gains a backend), `user.deleted` only, its own secret in `CLERK_WEBHOOK_SIGNING_SECRET`.
5. **Copy Сметката's handler shape:** `http.ts` route, `lib/clerkWebhook.ts` verifier (or the `svix` package as in Convex's docs), record `svix-id` once, look up by subject, schedule a batched self-rescheduling erase, answer 2xx fast, 503 while unconfigured.
6. **Per project:**
   - Сметката: new endpoint and secret on the new instance; move the dev/prod issuer env; nothing else in the deletion code.
   - Клиентите: add an index on `clerkUserId`, add the `user.deleted` handler, and decide whether its "delete account" button now means "delete the Акаунт everywhere" (copy must say so) or only "delete my Клиентите data" (then drop the Clerk call; the hub's `/akaunt` owns global deletion).
   - Кухнята (Chef): read the issuer from env instead of the hard-coded dev domain; upgrade convex to at least 1.33.1 (1.42.2 or later also fixes a `ConvexProviderWithClerk` session-change bug, per the changelog) and switch the server `getToken({ template: "convex" })` to `getToken()`, or keep a `convex` template; add the `user.deleted` handler and erase code (it has none today).
7. **Monitor:** after any outage longer than a day, check the endpoint in the Clerk Dashboard and "recover failed".

## 6. Open questions and unverified points

- Webhook endpoint count limit on the free plan: none published; not tested.
- Exactly which claims the native Convex integration pre-maps beyond `aud`, and whether activating it also creates a `convex` JWT template: check in the Dashboard.
- Whether Clerk's Svix environment auto-disables endpoints after 5 days of failure.
- A session token issued just before deletion stays valid until it expires (about a minute), so a mutation that creates the user on first call (Сметката's `requireAuth`, Клиентите's `ensureCurrent`) could recreate an empty user row right after the erase. Low impact; a tombstone of deleted subjects would prevent it. **[unverified reasoning]**
- The Frontend API hostname (`clerk.onovaza.com` assumed) is settled by the domain research, not here.
- Product decision for Клиентите's delete button (section 4).
