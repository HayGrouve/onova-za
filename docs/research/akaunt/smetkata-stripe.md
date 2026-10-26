# What Сметката's Stripe holds before the move

Research for [#28](https://github.com/HayGrouve/onova-za/issues/28) on the [Акаунт map (#12)](https://github.com/HayGrouve/onova-za/issues/12). Architecture: [ADR 0001](https://github.com/HayGrouve/onova-za/blob/main/docs/adr/0001-one-akaunt-on-onovaza-subdomains.md) (Сметката moves to `smetkata.onovaza.com` on a fresh shared Clerk production instance, keeps its own Convex and its own payments). Related: [#14](https://github.com/HayGrouve/onova-za/issues/14) (key users by Clerk `subject`), [#20](https://github.com/HayGrouve/onova-za/issues/20) (Изтрий данните cancels the subscription at once), [#26](https://github.com/HayGrouve/onova-za/issues/26) (production checklist), [#29](https://github.com/HayGrouve/onova-za/issues/29) (old-domain redirects).

Written 2026-10-26. Everything was read-only: Сметката's code at `~/projects/onova-za-smetkata` (identical to `HayGrouve/onova-za-smetkata` `main` at `f0e5c0a`), `npx convex env list` (names only, values cut off before printing), `npx convex data` piped straight into `jq` aggregates, `vercel env ls` (names only) and `gh secret list` (names only). No personal data or ids in this file: counts and object types only.

Markers: **[verified]** = checked against the live system or code. **[docs]** = stated in a primary source linked in [Sources](#sources). **[inference]** = my reading of the facts. **[unverified]** = not checked.

## Answer in short

- **The Stripe account itself was not read.** No Stripe credential exists anywhere reachable: the `stripe` CLI is not installed or logged in, and no Stripe key is set on Сметката's Vercel project, on either Convex deployment, in GitHub Actions secrets, or in any local `.env*` file **[verified]**. So the counts of customers, subscriptions, products, prices, the Customer Portal configuration and the webhook endpoints are **[unverified]**. A five-minute read-only check for the owner is in [section 6](#6-the-read-only-check-still-to-run).
- **Billing has never run in production.** Convex prod has none of the six billing env vars (`BILLING_ENABLED`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_YEARLY`, `APP_ORIGIN`), and neither of its 2 `users` rows has any Stripe field **[verified]**. The code cannot have created a live customer or subscription from prod **[inference]**.
- **Nothing Сметката writes to Stripe carries a Clerk id or the old domain on a stored object.** Customers, Checkout Sessions and subscriptions are tagged with the Convex `users` `_id` (`convexUserId`, `client_reference_id`), never the Clerk `clerkSubject` **[verified]**. The domain only appears in per-session `success_url`, `cancel_url` and portal `return_url`, built from the Convex env `APP_ORIGIN` at the moment of the call **[verified]**.
- **The webhook does not need repointing.** It goes to the Convex HTTP endpoint `https://<deployment>.convex.site/stripe/webhook`, not to the app's domain, and Сметката keeps its Convex deployment, so the URL and its signing secret stay as they are **[verified]** for the code and runbook, **[unverified]** for what is actually registered in Stripe.
- **"Wipe customers and subscriptions, keep products and prices" is safe**, and in live mode likely a no-op. Deleting a customer cancels its active subscriptions at once and cannot be undone **[docs]**; products and prices hold no user data **[verified]** for the code. The only real changes are `APP_ORIGIN` (to `https://smetkata.onovaza.com`) and whatever dashboard settings name the old domain (portal privacy and terms links, account public details, Managed Payments business details) **[inference]**.

## 1. What Сметката's code puts into Stripe [verified]

All Stripe calls live in `convex/billingStripe.ts` (Node actions), with config in `convex/lib/billingEnv.ts` and the webhook in `convex/http.ts` plus `convex/lib/stripeWebhook.ts`. Design: [Сметката ADR 0004](https://github.com/HayGrouve/onova-za-smetkata/blob/main/docs/adr/0004-stripe-managed-payments.md) (Stripe Managed Payments behind a `BILLING_ENABLED` switch).

| Stripe object | Created by | What it carries |
| --- | --- | --- |
| Customer | `createCheckoutSession`, once per Host | `email` and `name` copied from the Convex `users` row (which come from Clerk claims), `metadata.convexUserId` = Convex `users` `_id`. Idempotency key `host-pro-customer-<convex id>` |
| Checkout Session | `createCheckoutSession` | `mode: subscription`, `managed_payments.enabled`, `client_reference_id` = Convex `_id`, `metadata.convexUserId`, `locale: bg`, one line item from `STRIPE_PRICE_MONTHLY` or `STRIPE_PRICE_YEARLY`, `success_url` = `${APP_ORIGIN}/user-profile/subscription?checkout=success&session_id={CHECKOUT_SESSION_ID}`, `cancel_url` = `${APP_ORIGIN}/user-profile/subscription?checkout=cancelled` |
| Subscription | Stripe, from the Checkout Session | `metadata.convexUserId`, `metadata.withdrawalWaiverAt` (ISO time) |
| Portal session | `createPortalSession` | `customer`, `locale: bg`, `return_url` = `${APP_ORIGIN}/user-profile/subscription`. No `configuration` passed, so the account's default portal configuration is used **[docs]** |
| Product, prices | Not created by code | Made by hand per the runbook: one product "Онова за сметката Pro", tax code `txcd_10103000`, EUR €2.99 monthly and €29 yearly, VAT inclusive (`docs/DEPLOY.md` steps 2 and 3) |
| Webhook endpoint, portal config | Not created by code | Made by hand: endpoint `https://<deployment>.convex.site/stripe/webhook` with 8 events; portal allows cancel at period end, switching the two prices, card updates, invoice history (`docs/DEPLOY.md` steps 4 and 5) |

- **No Clerk id anywhere in Stripe.** `grep` finds no `clerkSubject` in any Stripe call; the link back from Stripe to a Host is the Convex `_id` (metadata) and, in Convex, `users.stripeCustomerId` (indexed `by_stripeCustomerId`) plus `users.stripeSubscriptionId`.
- **Old domain only through `APP_ORIGIN`.** `SUBSCRIPTION_PAGE_PATH = '/user-profile/subscription'` is hard-coded; the origin is the Convex env `APP_ORIGIN`. Checkout Sessions and portal sessions are short-lived, so old URLs on them expire on their own **[inference]**.
- **Webhook handling** verifies `Stripe-Signature` against `STRIPE_WEBHOOK_SECRET` (HMAC, 5-minute tolerance), dedupes by event id in `processedWebhookEvents`, then re-fetches the customer's subscriptions (`syncCustomer`). An event for a customer with no matching `users` row is logged and dropped (`applySubscription`).
- **Deletion paths.** Clerk `user.deleted` (`accountDeletion.deleteHostData`) schedules `cancelCustomerSubscriptions`, which calls `subscriptions.cancel` (immediate, not at period end) on every subscription not already `canceled` or `incomplete_expired`, then deletes the `users` row. The Stripe customer itself is never deleted. This is the behaviour [#20](https://github.com/HayGrouve/onova-za/issues/20) wants for Изтрий данните.

## 2. What the live systems show [verified]

### Convex env (names only)

| Deployment | Stripe or billing vars | Other vars |
| --- | --- | --- |
| prod (`coordinated-warbler-782` per `docs/DEPLOY.md`) | **none** | `CLERK_FRONTEND_API_URL`, `CLERK_JWT_ISSUER_DOMAIN`, `CLERK_WEBHOOK_SIGNING_SECRET`, `GEMINI_API_KEY`, `GEMINI_MODEL` |
| dev (`.env.local`) | **none** | Clerk, Gemini, `DEV_MODE`, plus leftover Convex Auth vars (`AUTH_GOOGLE_*`, `AUTH_RESEND_KEY`, `JWKS`, `JWT_PRIVATE_KEY`, `SITE_URL`) |

Vercel (Preview, Production) holds only `VITE_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `VITE_APP_ORIGIN`, `VITE_CONVEX_URL`; GitHub Actions secrets hold Convex, Clerk E2E and Vercel deploy values. No Stripe key in any of them.

### Convex data

| Deployment | `users` rows | With `stripeCustomerId` | With `subscriptionStatus` | `processedWebhookEvents` |
| --- | --- | --- | --- | --- |
| prod | 2 | 0 | 0 | 2, both Clerk (Svix `msg_` ids), none from Stripe |
| dev | 2 | 1 | 2 | 0 |

- **Prod**: both rows still carry the retired `clerkPlanSlug` (value `free_user`) and no `plan`, so `backfill:planFromClerkPlanSlug` was never run on prod. Harmless if the rows are wiped at cutover **[inference]**.
- **Dev**: the one row with Stripe ids holds **placeholders, not real Stripe ids**: the customer id is 19 characters and the subscription id 13 (real ones are `cus_` plus 14 and `sub_` plus 24), both contain a test-style word, and `currentPeriodEnd` is set to the year 2100. The other row is `plan: pro`, `active` with no Stripe ids at all. Both look hand-seeded for UI screenshots on 2026-10-02, the day billing was written **[inference]**. No webhook from Stripe has ever reached dev.
- Every `clerkSubject` in both deployments is a Clerk `user_...` id, so every row's key changes with the new instance ([#14](https://github.com/HayGrouve/onova-za/issues/14)).

### Where the old domain appears in Сметката (outside Stripe)

`APP_ORIGIN` is unset everywhere, so no Stripe URL has been built from it yet. The old domain is hard-coded in `src/lib/site-meta.ts` (`DEFAULT_SITE_ORIGIN`), `src/lib/contact.ts` (support and privacy emails), `public/robots.txt`, `vite.config.ts` (CSP allows `clerk.onova-za-smetkata.com`), the landing page copy, and Vercel `VITE_APP_ORIGIN`. These belong to the per-project migration plan, not to Stripe; listed so the Stripe-side settings in section 4 get the same new values.

## 3. Is "wipe customers and subscriptions, keep products and prices, repoint webhooks and return URLs" safe?

| Step | Verdict | Why |
| --- | --- | --- |
| Wipe customers | **Safe**, likely nothing to do in live mode | Live: billing never ran in prod, so this code made no live customers **[inference]**. Test mode: any customers come from manual test runs and point at nothing in Convex (dev holds only placeholders) **[verified]** for Convex, **[unverified]** for Stripe. Deleting a customer "immediately cancels any active subscriptions" and "cannot be undone"; deleted customers stay retrievable for history **[docs]** |
| Wipe subscriptions | **Safe**, covered by the customer delete | Same reasoning. Do it before the Convex `users` rows go, never after: a live subscription whose `users` row is gone keeps charging, because its webhooks are dropped as "No Host for Stripe customer" **[verified]** for the code |
| Keep products and prices | **Safe** | They carry no user or Clerk data **[verified]** for the code. The product's optional `url` field and the price `nickname` are hand-set and **[unverified]** |
| Repoint webhooks | **Not needed, and do not** | The endpoint is the Convex site URL, which the domain move does not touch. Updating an endpoint's `url` is possible and keeps the endpoint **[docs]**; the signing secret is only returned at creation **[docs]**, so it does not change on update **[inference]**. Only a new endpoint (for example a new Convex deployment) needs a new `STRIPE_WEBHOOK_SECRET` |
| Repoint return URLs | **Yes, but in Convex, not in Stripe** | Checkout and portal return URLs are per session from `APP_ORIGIN` **[verified]**; set `APP_ORIGIN=https://smetkata.onovaza.com` when billing is turned on. The portal configuration's own `default_return_url` (only used when a session passes none) and `business_profile.privacy_policy_url` / `terms_of_service_url` are dashboard settings **[docs]** and may name the old domain **[unverified]** |

## 4. What else must change

1. **Convex env `APP_ORIGIN`** = `https://smetkata.onovaza.com` on prod (and `http://localhost:3000` on dev) whenever billing is switched on. It is the only source of every Stripe return URL **[verified]**.
2. **Customer Portal default configuration**: privacy and terms links should point to the hub's legal pages (ADR 0001 puts one set of legal pages on the hub), and `default_return_url` to the new origin, if set **[inference]**.
3. **Stripe account public details and Managed Payments business details** (website, support email, support URL): move from `onova-za-smetkata.com` to the new address. Whether changing the website reopens the Managed Payments eligibility review is **[unverified]**; Сметката's ADR 0004 notes the review was not yet passed.
4. **The Абонамент page path.** `SUBSCRIPTION_PAGE_PATH` is `/user-profile/subscription`, a custom page inside Clerk's `UserProfile` in Сметката **[verified]**. The map moves "Акаунт" to the hub's `/akaunt` ([#18](https://github.com/HayGrouve/onova-za/issues/18), [#19](https://github.com/HayGrouve/onova-za/issues/19)) and project data settings to settings → "Данни" ([#20](https://github.com/HayGrouve/onova-za/issues/20)), so this path and its Checkout and portal returns likely move too. New open question, below.
5. **Convex `users` rows and `stripeCustomerId`.** Today no prod row links a Stripe customer, so the re-key or wipe at cutover has nothing to carry **[verified]**. If billing is turned on before the move, the cutover must either re-key `clerkSubject` on rows that hold `stripeCustomerId` (keeps the link, since Stripe only knows the Convex `_id`) or cancel and delete those customers first. A wiped row whose Host signs in again gets a new `_id`, and Checkout would create a second customer **[inference]**.
6. **Webhook signing secret**: no change while the endpoint and the Convex deployment stay. When billing goes live, use a restricted key for `STRIPE_SECRET_KEY` as `docs/DEPLOY.md` recommends.
7. **Housekeeping, not blocking**: drop the 2 placeholder Stripe values on the dev row (or the dev rows entirely), and either run `backfill:planFromClerkPlanSlug` on prod or let the cutover wipe the 2 prod rows.

## 5. Order relative to the move [inference]

Billing is off, so Stripe is not on the critical path of the Clerk cutover. Simplest order: move Сметката to `smetkata.onovaza.com` with billing still off; then, as part of turning billing on, follow `docs/DEPLOY.md` steps 1 to 6 with `APP_ORIGIN` set to the new origin from the start and the portal and account details already on the new domain. The only thing to do before the move is the read-only check below, to confirm the account holds no live customer or subscription.

## 6. The read-only check still to run

With the Stripe CLI logged in (`stripe login`, which creates a restricted key for the CLI), or with a restricted key that has only read permissions, run once per mode (`--live` for live). Each prints a count or a URL, no personal data:

```sh
stripe customers list --limit 100 | jq '.data | length'
stripe subscriptions list --status all --limit 100 | jq '[.data[].status] | group_by(.) | map({(.[0]): length}) | add'
stripe products list --limit 100 | jq '[.data[] | {active, url, tax_code}]'
stripe prices list --limit 100 | jq '[.data[] | {active, currency, unit_amount, interval: .recurring.interval, tax_behavior}]'
stripe webhook_endpoints list | jq '[.data[] | {url, status, events: (.enabled_events | length)}]'
stripe billing_portal configurations list | jq '[.data[] | {is_default, active, default_return_url, business_profile}]'
stripe customers list --limit 100 | jq '[.data[].metadata | keys] | flatten | group_by(.) | map({(.[0]): length}) | add'
```

Expected if this research is right: live mode has 0 customers and 0 subscriptions; test mode metadata keys are only `convexUserId`; the one webhook URL is on `convex.site`; any URL naming `onova-za-smetkata.com` sits only in the portal configuration or on the product.

## Open / unverified

- Every Stripe-side count and setting (customers, subscriptions, products, prices, portal config, webhook endpoints, account public details), in both modes: no credential reachable. Includes whether a Stripe account or sandbox for Сметката exists at all; ADR 0004 says the API calls were verified in Stripe test mode, which implies one does.
- Whether a Stripe webhook endpoint was ever registered, and if so at which URL (runbook says `convex.site`).
- Whether changing the website on the Stripe account reopens the Managed Payments review.
- New question: where the Абонамент page lives after the move (today `/user-profile/subscription` inside Clerk's `UserProfile`; the hub's `/akaunt` and the project's "Данни" settings are the candidates), since Checkout and portal return there.

## Sources

- Сметката code, `HayGrouve/onova-za-smetkata` at `f0e5c0a`: `convex/billingStripe.ts`, `convex/billing.ts`, `convex/lib/billingEnv.ts`, `convex/lib/stripeWebhook.ts`, `convex/http.ts`, `convex/accountDeletion.ts`, `convex/schema.ts`, `shared/host-pro-plans.ts`, `src/routes/user-profile.$.tsx`, `docs/DEPLOY.md`, `docs/adr/0003-stripe-billing-beside-clerk.md`, `docs/adr/0004-stripe-managed-payments.md`.
- Stripe API, delete a customer: https://docs.stripe.com/api/customers/delete
- Stripe API, update a webhook endpoint: https://docs.stripe.com/api/webhook_endpoints/update
- Stripe API, the webhook endpoint object (`secret` "Only returned at creation"): https://docs.stripe.com/api/webhook_endpoints/object
- Stripe API, the Customer Portal configuration object (`default_return_url`, `business_profile`, `is_default`): https://docs.stripe.com/api/customer_portal/configurations/object
- Stripe API, create a portal session (`configuration` defaults to the default configuration, `return_url`): https://docs.stripe.com/api/customer_portal/sessions/create
