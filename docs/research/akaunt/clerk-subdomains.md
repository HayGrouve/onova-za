# Clerk production on onovaza.com, shared across subdomains

Research for [#13](https://github.com/HayGrouve/onova-za/issues/13) (map [#12](https://github.com/HayGrouve/onova-za/issues/12), [ADR 0001](../../adr/0001-one-akaunt-on-onovaza-subdomains.md)). Written 2026-10-19. Read-only: no Clerk app, instance, user, DNS or Vercel change was made.

Markers: **[docs]** = Clerk's own docs, pricing page or changelog (fetched as Markdown on 2026-10-19, links in [Sources](#sources)). **[source]** = read in the published npm package. **[verified]** = run here (build, CLI, live DNS or a read-only API call). **[unverified]** = reasoned or not testable without writes.

Versions on npm today: `@clerk/nextjs` 7.9.17 (peer `next ^16.1.0-0`, so the hub's Next 16.3.8 is fine), `@clerk/tanstack-react-start` 1.7.3, `@clerk/react` 6.17.8 (`@clerk/clerk-react` is deprecated), `@clerk/localizations` 4.23.0, Clerk CLI 3.4.1.

## 0. Short answer

1. Set the production instance's domain to the root `onovaza.com`. Every `<name>.onovaza.com` then shares the session with no extra config; satellites are for _different_ root domains and are not needed (and are Pro only). Do turn on **Allowed Subdomains** with the four project subdomains, and set `authorizedParties` to each server's own origin.
2. DNS: five CNAMEs on Vercel DNS (`clerk`, `accounts`, `clkmail`, `clk._domainkey`, `clk2._domainkey`), plus a DMARC TXT Clerk recommends but cannot add. `clerk deploy` creates the instance, prints or exports the records, collects Google credentials and polls verification; adding the records, the Google Cloud client, allowed subdomains, webhooks and paths stay manual.
3. Google needs your own OAuth client in production; email code with passwords off is two `clerk config patch` keys. `bgBG` exists but is experimental, uses formal "Вие" and leaves keys in English, so a custom localization object is needed for "ти". Clerk's emails stay English on the free plan (custom email templates are not in Hobby).
4. Placement: the Account Portal is out (English only, not customizable). Choose between embedded components in each app and one sign-in page on the hub; both return the user to the page they came from via `redirect_url`, and the hub page works with no allowlist config because clerk-js already allows `https://*.onovaza.com`.
5. Free plan: 50,000 monthly retained users per app (all projects share one app, so one pool), custom domain, Google, email codes, webhooks and JWT templates included; session lifetime fixed at 7 days, "Secured by Clerk" stays, no custom email templates, 5 impersonations a month.
6. `ClerkProvider` without `dynamic` keeps every hub page static (built and checked). What breaks it is calling auth on the server in a shared layout, for example `<Show>` in the server-rendered header.

## 1. Session sharing across subdomains

### How it works

- In production the Frontend API (FAPI) lives on `clerk.<root>` via CNAME, so FAPI and every app are same-site **[docs: how-clerk-works]**.
- `__client` (the long-lived client token, the real source of truth) is an `HttpOnly`, `SameSite=Lax` cookie on the FAPI host `clerk.onovaza.com`. Any page on any `*.onovaza.com` that loads clerk-js with the same publishable key talks to the same FAPI and gets the same client, hence the same session **[docs: how-clerk-works]**.
- `__session` (the 60-second session JWT) is set on each app's own host, "scoped strictly so it cannot be shared across subdomains" **[docs: how-clerk-works]**. So the hub's token never reaches `smetkata.onovaza.com` and vice versa.
- `__client_uat` (client "updated at") is written on the registrable domain, found by probing the shortest settable domain, i.e. `.onovaza.com` **[source: clerk-js 6.39.1]**. A server-rendered app that sees `__client_uat` but no `__session` of its own triggers a handshake redirect to FAPI and comes back with a session token (`AuthErrorReason.ClientUATWithoutSessionToken`) **[source: @clerk/backend 3.25.0]**. That is how Сметката, Клиентите and Кухнята pick up a sign-in that happened on another subdomain on their first SSR request. Кафето (client only) just asks FAPI directly.
- "When you set a root domain for your production deployment, Clerk's authentication will work across all subdomains. User sessions will also be shared across the subdomains." **[docs: production]**. The satellite guide says it "is not to be confused with authentication across subdomains with shared sessions, which works by default with Clerk" **[docs: satellite-domains]**. Satellites are "No" on Hobby and $10/mo each on Pro **[docs: pricing]**. **Satellites are not needed.**

### Config it needs

| Setting                                    | Where                                                                                                 | Value for us                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Production domain                          | `clerk deploy` prompt or Dashboard                                                                    | `onovaza.com` (the apex, not `www`)                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Allowed Subdomains (FAPI CORS allowlist)   | Dashboard, Domains > Allowed Subdomains                                                               | Enable; list `smetkata.onovaza.com`, `klientite.onovaza.com`, `kuhnyata.onovaza.com`, `kafeto.onovaza.com`. The primary domain is always allowed. Without it FAPI accepts cross-origin calls from **any** subdomain, which Clerk "strongly recommends" against **[docs: subdomain-allowlist]**. The Backend API exposes it as `subdomain_allowlist_enabled` and `allowed_subdomains` on `GET /v1/instance` **[verified, read on Сметката's prod instance]** |
| `authorizedParties`                        | Each app's server middleware (`clerkMiddleware`, `authenticateRequest`, `verifyToken`)                | The app's own origin only, e.g. `['https://smetkata.onovaza.com']`. It is checked against the token's `azp` claim (the `Origin` of the FAPI call that minted it) and protects against "subdomain cookie leaking" and CSRF **[docs: production, session-tokens]**. Add another origin only if that origin sends Bearer tokens to this server                                                                                                     |
| `allowed_origins` (instance)               | Backend API `PATCH /v1/instance`                                                                      | Leave `null`. It is for browser extensions, Electron and Capacitor, not web subdomains **[docs: backend Instance object]**                                                                                                                                                                                                                                                                                                                               |
| `allowedRedirectOrigins` (ClerkProvider)   | Client                                                                                                | Nothing to set. When omitted clerk-js uses `[location.origin, https://<root>, https://*.<root>]`, the root being the FAPI host minus `clerk.` **[source: clerk-js 6.39.1]**. Set it only to tighten                                                                                                                                                                                                                                                       |
| Preview deployments                        | Vercel env                                                                                            | Use the **development** keys on `*.vercel.app`; production keys do not work on a host's preview domain **[docs: managing-environments, vercel]**                                                                                                                                                                                                                                                                                                         |

Passkeys would also work across these subdomains, but they are not on Hobby **[docs: sign-up-sign-in-options, pricing]**.

## 2. DNS on Vercel, and what `clerk deploy` automates

### Records

Shape **[verified]** from Сметката's live production instance (`clerk api /domains --instance prod`, all five `required: true`), rewritten for onovaza.com. `<id>` is instance specific; read the real values from `clerk deploy` or the Dashboard Domains page.

| Name               | Type  | Value                        | Purpose                 |
| ------------------ | ----- | ---------------------------- | ----------------------- |
| `clerk`            | CNAME | `frontend-api.clerk.services` | Frontend API            |
| `accounts`         | CNAME | `accounts.clerk.services`    | Account Portal          |
| `clkmail`          | CNAME | `mail.<id>.clerk.services`   | Email sending (SPF)     |
| `clk._domainkey`   | CNAME | `dkim1.<id>.clerk.services`  | DKIM                    |
| `clk2._domainkey`  | CNAME | `dkim2.<id>.clerk.services`  | DKIM                    |
| `_dmarc`           | TXT   | `v=DMARC1; p=none; ...`      | Clerk recommends, cannot add itself **[docs: email warm-up]** |

Current onovaza.com zone **[verified, `vercel dns ls` and DNS-over-HTTPS]**: nameservers `ns1/ns2.vercel-dns.com`; Vercel's default CAA records allow `letsencrypt.org`, `pki.goog` and `sectigo.com`, which covers both CAs Clerk uses (Let's Encrypt, Google Trust Services) **[docs: production troubleshooting]**; a default wildcard `*` ALIAS exists, and explicit `clerk`/`accounts`/`clkmail` CNAMEs take precedence over it; no MX, TXT or DMARC yet. Vercel DNS does not proxy, so the Cloudflare "DNS only" caveat does not apply.

Owner commands (not run): `vercel dns add onovaza.com clerk CNAME frontend-api.clerk.services` and so on, or `vercel dns import onovaza.com <zonefile>` with the zone file `clerk deploy` can export.

### `clerk deploy` versus manual

`clerk deploy` needs a linked project and an existing app; it clones the development instance's config into production **[docs: changelog 2026-06-10, `clerk deploy --help`]**. So the order is: create the "онова за" app, `clerk link` it in the hub, configure the dev instance (section 3), then deploy.

| Step                                                                                                       | Who                                                                                                                                                                  |
| ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Create production instance from dev config, ask for the domain                                             | `clerk deploy` (interactive TTY; owner runs it, needs confirmation per CLAUDE.md)                                                                                    |
| Print the CNAMEs, export a zone file                                                                       | `clerk deploy`                                                                                                                                                       |
| Add the records at Vercel, add DMARC                                                                       | Owner, `vercel dns add` or `vercel dns import`                                                                                                                       |
| Production Google client ID and secret (can import the Google Cloud JSON)                                  | `clerk deploy` prompts; or `clerk config patch --instance prod` with `connection_oauth_google.client_id/client_secret` **[docs: google]**                            |
| Create the Google Cloud OAuth client and consent screen, set it "In production"                            | Owner in Google Cloud Console                                                                                                                                       |
| Verify DNS, SSL, email DNS                                                                                 | `clerk deploy` loop; `clerk deploy status [--wait]` is read-only                                                                                                     |
| "Deploy certificates" button the Dashboard shows when everything is green                                  | Dashboard **[docs: production]**; whether the CLI loop covers it is **[unverified]**                                                                                 |
| Paths, SSO connections, Integrations (do not copy to production **[docs: production]**)                    | Paths via `clerk config patch --instance prod` (`paths` key exists in the schema **[verified]**); Integrations (Convex) in the Dashboard                              |
| Allowed Subdomains                                                                                         | Dashboard (Backend API fields exist, patching them untested)                                                                                                         |
| Webhook endpoint for `user.deleted` (production has its own URL and signing secret **[docs: production]**) | Dashboard Webhooks page; the CLI only listens and verifies locally                                                                                                    |
| Keys into each project                                                                                     | `clerk env pull --instance prod` locally, `vercel env add` per project (owner)                                                                                      |

## 3. Sign-in methods and Bulgarian

- **Google, production.** Own credentials are mandatory. Create a Web OAuth client, paste Clerk's **Authorized Redirect URI** (expected `https://clerk.onovaza.com/v1/oauth_callback`, read it from the Dashboard), add `https://onovaza.com` under JavaScript origins, then set the consent screen's publishing status to **In production**; "Testing" caps at 100 test users, and switching involves Google's review of name, logo and scopes **[docs: google]**. "Block email subaddresses" is on by default. Google sign-in does not work in in-app WebViews. Hobby allows up to 3 social connections; we use 1 **[docs: pricing]**.
- **Email code, no passwords.** Schema keys **[verified, `clerk config schema`]**: `auth_email.used_for_sign_in: true`, `auth_email.sign_in_strategies: ["email_code"]`, `auth_email.verification_strategies: ["email_code"]`, `auth_password.enabled: false`. Set them on the dev instance before `clerk deploy` so production inherits them. Codes last 10 minutes, resend after 30 s **[docs: sign-up-sign-in-options]**. Account self-deletion is a User model setting in the Dashboard (not in the CLI schema).
- **`bgBG`.** Listed in `@clerk/localizations` as `bg-BG` / `bgBG` **[docs: localization]**. Caveats:
  - The localization prop is marked **Experimental** and only changes Clerk components; "the hosted Clerk Account Portal will remain in English" **[docs: localization, account-portal]**.
  - It is incomplete and formal **[verified, `@clerk/localizations` 4.23.0]**: 672 translated strings against 1,676 in `en-US`; in the sections we would show, `signIn` has 33 untranslated keys (including `start.titleCombined`/`subtitleCombined`, the title of the default sign-in-or-up flow), `signUp` 15, `userProfile` 65. Copy addresses the user as "Вие" ("Проверете вашия имейл", "Регистрирайте се"). Brand copy is informal "ти", so ship a custom object, `{ ...bgBG, signIn: {...}, ... }`, overriding the strings our flows show.
  - Import it in a Server Component (the root layout) and the strings stay out of client JS **[docs: localization]**; use the `@clerk/localizations/bg-BG` subpath.
- **Emails.** The verification code template's subject is `{{otp_code}} is your verification code` **[verified, read-only `GET /templates/email` on Сметката prod]**. "Custom email templates" is **No** on Hobby **[docs: pricing]**, so code emails will most likely arrive in English. Clerk stores a `locale` on sign-ups "used for localized emails and copy" **[docs: SignUp object]**, but no doc says which languages the default emails ship in **[unverified]**. Sender is `noreply@onovaza.com` by default.

## 4. Sign-in placement

| Option                                                                                                  | How the user lands back                                                                                                                                                                                                                                                                                                                                                                 | Bulgarian "ти"                                         | Cost                                                                                                                                                                                         |
| ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A. Embedded in each app** (`<SignInButton mode="modal">` or a local `/sign-in` with `<SignIn>`)        | Never leaves. A local page gets `?redirect_url=<previous page>` and returns there; fallback `*_FALLBACK_REDIRECT_URL` env, default `/` **[docs: customize-redirect-urls]**                                                                                                                                                                                                        | Yes, via `localization`                                | Five copies of localization, appearance and legal-consent wiring to keep in sync across five repos                                                                                          |
| **B. One page on the hub** (e.g. `onovaza.com/vhod`, `<SignIn routing="hash">`, sign-in-or-up is the default `withSignUp`) | Each app sets `NEXT_PUBLIC_CLERK_SIGN_IN_URL` / `VITE_CLERK_SIGN_IN_URL` (and `SIGN_UP_URL`) to the absolute hub URL. Clerk appends `redirect_url=<current page>`; the hub's `<SignIn>` accepts it because the default allowed origins include `https://*.onovaza.com` **[source]**, and redirects back. The app then reads the session from FAPI (client) or via the handshake (SSR) | Yes, one copy                                          | A page hop; the hub must be up for anyone to sign in; installed PWA caveat below                                                                                                            |
| **C. Account Portal** (`accounts.onovaza.com/sign-in`, the default when no sign-in URL is set)            | `?redirect_url=` must be on the instance domain or its subdomains **[docs: account-portal direct-links]**; Dashboard fallback redirects                                                                                                                                                                                                                                                 | **No.** English only, no customization beyond Dashboard options | Rejected: breaks the Bulgarian-copy rule                                                                                                                                                    |

**Recommendation for the later decision:** B for the web apps, plus the hub's `/akaunt` (`<UserProfile routing="hash">`) as the one account page every app links to via `<UserButton userProfileMode="navigation" userProfileUrl="https://onovaza.com/akaunt">` **[docs: user-button]**. It gives one Bulgarian copy, one consent text and a visible "онова за" moment that matches ADR 0001's single Акаунт. The trade-off is A's zero-hop modal versus B's single copy. Keep A as the fallback for Кафето: an installed PWA in standalone mode opens out-of-scope origins (the hub, Google) in an in-app browser, and on iOS a home-screen web app has its own cookie jar, so a hub round trip may not land back signed in **[unverified, platform behaviour]**. Note that the `accounts` CNAME is still listed as required even if the Portal goes unused; Clerk advises leaving it enabled **[docs: disable-account-portal]**.

## 5. Free (Hobby) plan, 2026-10-19

From **[docs: pricing]**. One Clerk app serves every project, so every per-app number is shared.

| Item                                                        | Hobby                                                                  |
| ----------------------------------------------------------- | ---------------------------------------------------------------------- |
| Monthly retained users                                      | 50,000 per app; counted only if the user returns 24 h+ after sign-up; one-month grace above it, then Pro ($25/mo, or $20 billed yearly) |
| Custom domain                                               | Yes                                                                    |
| Social connections                                          | Up to 3 (Google only needed)                                           |
| Email codes, email links                                    | Yes                                                                    |
| Webhooks, custom session tokens, custom JWT templates      | Yes (deletion via `user.deleted`; Convex)                              |
| Session lifetime                                            | **Fixed at 7 days** (custom duration is Pro)                           |
| Remove "Secured by Clerk"                                   | **No**                                                                 |
| Custom email templates                                      | **No**                                                                 |
| Passkeys, MFA, user bans, allow/blocklists, satellites      | **No**                                                                 |
| Bot protection, brute-force lockout, block subaddresses, block disposable emails | Yes                                              |
| Impersonations                                              | 5 per month                                                            |
| Application logs                                            | 1 day retention                                                        |
| Dashboard seats                                             | 3                                                                      |
| Organizations (not used)                                    | 100 retained orgs, 20 members each                                     |

## 6. `ClerkProvider` on the static hub

Docs: since `@clerk/nextjs` v6 `<ClerkProvider>` "will no longer opt your entire application into dynamic rendering"; the `dynamic` prop opts in; `auth()` "will opt your entire route into dynamic rendering"; `nonce` (strict CSP) requires `dynamic` **[docs: nextjs-v6, rendering-modes, clerk-provider]**. Next's own rule: a route turns dynamic only through Request-time APIs (`cookies()`, `headers()`, `searchParams`, `draftMode()`) **[`node_modules/next/dist/docs/01-app/04-glossary.md`]**. The server `ClerkProvider` in 7.9.17 only reads the request when `dynamic` is true, and keyless mode is development only **[source]**.

Build experiment **[verified]**: a throwaway copy of `origin/main`, `@clerk/nextjs` 7.9.17, a placeholder `pk_live` key, `next build` with Turbopack.

| Variant                                                                                                                                       | Result                                                                                                                |
| --------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Baseline                                                                                                                                      | All ○ / ●                                                                                                             |
| `<ClerkProvider localization={bgBG}>` inside `<body>`, header nav entry as a `'use client'` island (`<Show>`, `<SignInButton mode="modal">`, `<UserButton>`), `proxy.ts` with `clerkMiddleware({ authorizedParties })` | All ○ / ●, plus `ƒ Proxy (Middleware)`                                                                                |
| Same, plus `/akaunt` as a client page with `<UserProfile routing="hash">`                                                                     | `/akaunt` is ○                                                                                                        |
| `<Show when="signed-in">` imported into the **server** header                                                                                 | `/`, `/proekti`, `/proekti/[slug]`, `/za-men`, `/_not-found` all become **ƒ Dynamic** (server `Show` calls `auth()`)  |
| No `proxy.ts`, `next start`                                                                                                                   | All static; pages served with `x-nextjs-cache: HIT`, `s-maxage=31536000`, no runtime errors                           |

Rules for the hub:

1. `<ClerkProvider>` inside `<body>` in the root layout, without `dynamic`, localization imported there.
2. Anything that depends on sign-in state lives in a `'use client'` file. `<Show>` imported from a client file is the client variant; from a Server Component it is the server variant and makes every page using that layout dynamic.
3. Never call `auth()`, `currentUser()` or server `<Show>` from shared layouts or content pages.
4. `/akaunt` (and `/vhod` if option B) are client pages with `routing="hash"`.
5. Skip `proxy.ts` on the hub while no server code needs auth: pages stay static either way, but a proxy runs a function on every matched request. If one is added later, give it `authorizedParties: ['https://onovaza.com']` and a matcher that skips static files.

Cost: first-party JS referenced by `/` grows from 191.4 KB to 263.8 KB gzipped (+72 KB), and clerk-js (about 82 KB gzipped) plus `@clerk/ui` (about 45 KB gzipped entry) load async from `https://clerk.onovaza.com/npm/...` **[verified, rough: gzip -9 of the chunks named in the HTML; CDN files from jsDelivr]**. That is well over the 165 KB home budget in `docs/research/05-technical.md`; how the budget is measured should be agreed before wiring Clerk in.

## 7. Per-project wiring (one publishable key, one secret key for all)

| Project   | Package                        | Server middleware                                                                                                                       | Sign-in URL env (option B)                           |
| --------- | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| hub       | `@clerk/nextjs` 7              | none (see section 6)                                                                                                                    | `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/vhod`                |
| smetkata  | `@clerk/tanstack-react-start` 1 | `src/start.ts`: `requestMiddleware: [csrfMiddleware, clerkMiddleware({ authorizedParties: ['https://smetkata.onovaza.com'] })]` (Start drops its default CSRF middleware once `start.ts` exists **[docs: tanstack clerkMiddleware]**) | `VITE_CLERK_SIGN_IN_URL=https://onovaza.com/vhod`    |
| klientite | `@clerk/tanstack-react-start` 1 | same, `https://klientite.onovaza.com`                                                                                                   | same                                                 |
| kuhnyata  | `@clerk/nextjs` 7              | `proxy.ts`: `clerkMiddleware({ authorizedParties: ['https://kuhnyata.onovaza.com'] })`                                                  | `NEXT_PUBLIC_CLERK_SIGN_IN_URL=https://onovaza.com/vhod` |
| kafeto    | `@clerk/react` 6               | none (no server); embedded sign-in (section 4)                                                                                          | n/a                                                  |

## 8. Open questions and unverified points

- **Allowed Subdomains on Hobby.** The page carries no paid-plan notice, but neither does the email templates page, which pricing marks as paid. Check the toggle in the Dashboard.
- **Bulgarian emails on Hobby.** Does Clerk localize default system emails by the user's `locale`? The Backend API reports `can_edit_body: true` for templates on Сметката's (presumably Hobby) production instance while pricing says custom templates are Pro. A save was not attempted. Owner test: sign up on the dev instance from a `bg` browser and read the email.
- **Certificates step.** Whether `clerk deploy`'s verification loop also does the Dashboard's "Deploy certificates".
- **Convex audience.** One issuer for every project: a token minted on one subdomain is accepted by every project's Convex deployment that trusts the same template audience. Per-project JWT templates (distinct `aud`) would separate them. For the Convex research ticket.
- **Кафето offline.** clerk-js is fetched at runtime from `clerk.onovaza.com/npm/@clerk/clerk-js@6/...` (seen in the built HTML), so an offline start has no Clerk unless the service worker caches it or the app bundles it; how clerk-js behaves offline on web is undocumented (Clerk's offline guide is Expo only).
- **Allowlist and Clerk's own hosts.** Whether `accounts.onovaza.com` must be listed under Allowed Subdomains if the Portal stays enabled.
- **Google brand verification** for a consent screen with only `openid email profile` scopes: Google-side, not checked.
- **Cross-subdomain round trip** (option B) is reasoned from docs and SDK source, not run end to end; it needs a real production instance.

## Sources

- Deploy to production: https://clerk.com/docs/guides/development/deployment/production
- Subdomain allowlist: https://clerk.com/docs/guides/dashboard/dns-domains/subdomain-allowlist
- Satellite domains: https://clerk.com/docs/guides/dashboard/dns-domains/satellite-domains
- How Clerk works (cookies, handshake): https://clerk.com/docs/guides/how-clerk-works/overview and https://clerk.com/docs/guides/how-clerk-works/cookies
- Session token claims (`azp`): https://clerk.com/docs/guides/sessions/session-tokens
- Backend Instance object (`allowedOrigins`): https://clerk.com/docs/reference/backend/types/backend-instance
- Managing environments (previews): https://clerk.com/docs/guides/development/managing-environments ; Vercel: https://clerk.com/docs/guides/development/deployment/vercel
- `clerk deploy` changelog (2026-06-10): https://clerk.com/changelog/2026-06-10-clerk-deploy ; CLI docs: https://clerk.com/docs/cli
- Google social connection: https://clerk.com/docs/guides/configure/auth-strategies/social-connections/google
- Sign-up and sign-in options: https://clerk.com/docs/guides/configure/auth-strategies/sign-up-sign-in-options
- Localization: https://clerk.com/docs/guides/customizing-clerk/localization
- Email and SMS templates: https://clerk.com/docs/guides/customizing-clerk/email-sms-templates ; email warm-up and DMARC: https://clerk.com/docs/guides/development/troubleshooting/email-domain-name-warmup
- SignUp object (`locale`): https://clerk.com/docs/tanstack-react-start/reference/objects/sign-up
- Redirect URLs: https://clerk.com/docs/guides/development/customize-redirect-urls ; env vars: https://clerk.com/docs/guides/development/clerk-environment-variables
- Account Portal: https://clerk.com/docs/guides/account-portal/overview , https://clerk.com/docs/guides/account-portal/getting-started , https://clerk.com/docs/guides/account-portal/direct-links , https://clerk.com/docs/guides/account-portal/disable-account-portal
- `<UserButton>`: https://clerk.com/docs/nextjs/reference/components/user/user-button ; `<SignIn>`: https://clerk.com/docs/nextjs/reference/components/authentication/sign-in
- Pricing: https://clerk.com/pricing
- Next.js rendering modes and Clerk: https://clerk.com/docs/guides/development/rendering-modes ; v6 upgrade: https://clerk.com/docs/guides/development/upgrading/upgrade-guides/nextjs-v6 ; `<ClerkProvider>` (Next.js): https://clerk.com/docs/nextjs/reference/components/clerk-provider ; `clerkMiddleware()` (Next.js): https://clerk.com/docs/reference/nextjs/clerk-middleware
- TanStack Start `clerkMiddleware()`: https://clerk.com/docs/reference/tanstack-react-start/clerk-middleware
- Next.js 16 bundled docs: `node_modules/next/dist/docs/01-app/04-glossary.md`, `.../03-api-reference/03-file-conventions/proxy.md`
- CLI: `clerk --help`, `clerk deploy --help`, `clerk config schema` (3.4.1)
- Packages read: `@clerk/nextjs` 7.9.17 (`dist/esm/app-router/server/ClerkProvider.js`, `controlComponents.js`, `keyless-provider.js`), `@clerk/clerk-js` 6.39.1 (`dist/clerk.mjs`), `@clerk/backend` 3.25.0, `@clerk/localizations` 4.23.0
