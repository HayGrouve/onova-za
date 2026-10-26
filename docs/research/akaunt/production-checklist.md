# Production checklist for the Акаунт on onovaza.com

Research for [#26](https://github.com/HayGrouve/onova-za/issues/26) on map [#12](https://github.com/HayGrouve/onova-za/issues/12). Assembled from [#13](https://github.com/HayGrouve/onova-za/issues/13) ([findings](https://github.com/HayGrouve/onova-za/blob/research/clerk-subdomains/docs/research/akaunt/clerk-subdomains.md)), [#14](https://github.com/HayGrouve/onova-za/issues/14) ([findings](https://github.com/HayGrouve/onova-za/blob/research/convex-webhooks/docs/research/akaunt/convex-webhooks.md)), [#24](https://github.com/HayGrouve/onova-za/issues/24) ([findings](https://github.com/HayGrouve/onova-za/blob/research/convex-audience/docs/research/akaunt/convex-audience.md)) and [#18](https://github.com/HayGrouve/onova-za/issues/18), with the Chef prerequisites from [#15](https://github.com/HayGrouve/onova-za/issues/15) ([findings](https://github.com/HayGrouve/onova-za/blob/research/chef-migration/docs/research/akaunt/chef-migration.md)) and the Кафето storage estimate from [#21](https://github.com/HayGrouve/onova-za/issues/21) ([findings](https://github.com/HayGrouve/onova-za/blob/research/kafeto-sync/docs/research/akaunt/kafeto-sync.md)). Architecture: [ADR 0001](../../adr/0001-one-akaunt-on-onovaza-subdomains.md). Written 2026-10-26.

Read-only: no Clerk app, instance, config, DNS record, Vercel env var or Convex env var was changed. One unsigned `POST` to Сметката's prod webhook route was sent to confirm the route exists; it was rejected with 400 and changed nothing. No key, secret or user email appears below.

Markers: **[docs]** = vendor docs or pricing page fetched 2026-10-26 (links in [Sources](#sources)). **[source]** = vendor source code or OpenAPI spec. **[verified]** = read here today from a live system (CLI, API, DNS). **[prior]** = carried over from an earlier ticket's findings. **[unverified]** = reasoned, or not checkable without a write.

Who: **Agent** = an agent by CLI. **Owner** = you, by hand (Dashboard, Google Cloud, or a terminal the agent can't drive). **Owner confirms** = the agent can run it, but it writes to production, so you say yes first (as `clerk deploy`, `vercel --prod` and `npx convex deploy` already require).

## 0. Short answer

1. **Allowed Subdomains on the free plan: still not provable without a production instance, but now testable in one command.** Clerk's pricing page doesn't list it (nor reverification), the docs page has no plan notice, and the Backend API's `PATCH /v1/instance` accepts `subdomain_allowlist_enabled` and `allowed_subdomains` ("Production instances only") with no plan gate in the spec. So the agent sets it by `clerk api` right after deploy; if Hobby blocks it, that call fails and tells us.
2. **"Deploy certificates": nothing to press.** `clerk deploy` (3.4.1 and 4.0.0) only creates the instance, lists domains, triggers DNS checks and reads domain status. It has no certificate call, and its own copy says "The SSL certificate is still pending; Clerk issues it automatically." After DNS, SSL and email all pass, it reports a `finalizing` state that Clerk finishes on its side. The Dashboard button is the manual path for the same thing; check it only if `clerk deploy status` stays incomplete.
3. **Convex: one team holds everything, and it is on Starter, not Free.** All 7 Convex projects (Сметката, Клиентите, Chef and four others) are on the owner's only team, plan "Convex Starter" (pay as you go). The 1 GB of file storage and 1 GB a month of egress are included amounts, not hard caps. Today: **695 MB of 1 GiB file storage used** (mostly the `zoo` project, which is growing), **247 MB of egress** so far this billing period. Кафето's photos (about 240 MB at #21's estimate) push the team past 1 GiB within months, costing cents. The real limit is the team's **spending limit: disable at $20 a month**, which would switch off every project at once; current spend this period is $3.33.
4. **Order:** DMARC first, then the app and its dev config, Google Cloud, `clerk deploy` (owner), DNS and verification (agent), prod-only settings (Paths, Allowed Subdomains, Convex integration, per-project secret keys), then the hub ships `/vhod` and `/akaunt`, then each project switches in rollout order, each with its own `user.deleted` endpoint.
5. **The Google consent screen and real users wait on the hub's legal pages.** Brand verification (Google showing "онова за" on its screen) needs a public home page and a privacy policy on onovaza.com.

## 1. The three open items

### 1.1 Allowed Subdomains (and reverification) on the free plan

- **Pricing page [docs]:** neither "Allowed subdomains", "subdomain allowlist" nor "reverification" appears anywhere on [clerk.com/pricing](https://clerk.com/pricing) (full text searched). Paid-only items there are marked "Not included" on Hobby (custom email templates, MFA, passkeys, satellite domains, custom session duration). So the page neither gates nor lists them.
- **Docs [docs]:** [Subdomain allowlist](https://clerk.com/docs/guides/dashboard/dns-domains/subdomain-allowlist) and [Reverification](https://clerk.com/docs/guides/secure/reverification) carry no plan notice. Allowlist: Domains page, "Allowed subdomains" tab, toggle on, list subdomains; "Your primary domain is always allowed." Reverification window: Sessions page, 1 to 10 minutes, default 10.
- **Backend API [source]:** [BAPI spec 2026-08-20](https://github.com/clerk/openapi-specs/blob/main/bapi/2026-08-20.yml), `PATCH /instance` (`UpdateInstance`) takes `subdomain_allowlist_enabled` (boolean) and `allowed_subdomains` (array; exact hosts or anchored wildcards like `*.preview.example.com`), both "Production instances only". Responses: `204` or `422`; no plan error is documented. `GET /instance` returns both fields.
- **Clerk CLI [source]:** the deploy code knows a `plan_insufficient` error code, so plan-gated settings do surface as errors through the CLI.
- **Live check not possible today [verified]:** the Clerk CLI on this machine is logged out (`clerk whoami`: `auth_required`), and logging in opens a browser.
- **Conclusion:** not provable before deploy. Step 4.2 sets it by API; success there answers the question, a `422`/`plan_insufficient` answers it the other way (then fall back to `authorizedParties` plus the `azp` check from #24, which don't depend on the plan). Reverification gets the same treatment: the owner glances at the Sessions page for the "Reverification window" field in step 4.7. Nothing in the plan depends on changing that window.

### 1.2 Does `clerk deploy` cover "Deploy certificates"?

- **The docs [docs]:** "[Deploy to production](https://clerk.com/docs/guides/development/deployment/production)", section "Deploy certificates": "Once you have completed all of the necessary steps, a **Deploy certificates** button will appear. Selecting this button will deploy your production instance." The same page now opens with "For AI agents: Run `npx clerk@latest deploy` ... instead of the Dashboard".
- **What the CLI actually calls [source, Clerk CLI 3.4.1 binary]:** Platform API only: `POST /v1/platform/applications/{app}/instances` (create production instance), `GET .../domains`, `POST .../domains/{id}/dns_check`, `GET .../domains/{id}/status`, and `.../instances/{id}/config` (OAuth credentials). No certificate or "deploy" endpoint. It treats the domain as done when `status === "complete"`.
- **What the CLI tells the user [source]:** when DNS passes but SSL doesn't: "Your DNS records for {domain} are verified. The SSL certificate is still pending; Clerk issues it automatically." When DNS, SSL and email all pass: "Clerk is still finalizing production setup ... If it hasn't, run `clerk deploy` again in a few minutes."
- **CLI version:** npm has `clerk` 4.0.0 (published 2026-10-26); this machine has 3.4.1. `clerk deploy --help` is word for word the same in both **[verified]**.
- **Conclusion:** with `clerk deploy`, certificates are issued and the instance finalized by Clerk without a button. The Dashboard's button belongs to the Dashboard flow. Keep one fallback: if `clerk deploy status --mode agent --wait` stays in `domain_pending` with `dns`, `ssl` and `mail` all `complete` for more than about an hour, the owner opens the Dashboard home page and presses **Deploy certificates** if it shows.

### 1.3 Convex team and usage

All **[verified]** via the Convex CLI's stored login (Management API and the dashboard's own read endpoints, read-only), 2026-10-26.

- **Team:** one team, the owner's personal team (its slug is the owner's email, so it isn't repeated here). Every Convex project lives there: `onova-za-smetkata`, `onova-za-klientite`, `chef`, plus `zoo`, `a-el-key`, `car-auto`, `imot-browser`. Кафето's new project would land there too.
- **Plan:** **Convex Starter** (pay as you go), not Free. [Convex limits](https://docs.convex.dev/production/state/limits): "Free has hard resource caps, while Starter can exceed its included resource amounts with usage-based pricing." File storage: 1 GB included, $0.033 per extra GB-month; data egress: 1 GB a month included, $0.132 per extra GB ("Includes serving user files, accessing user files inside functions, and generating and restoring backups").
- **Spending limit:** warn at $15, **disable at $20** per billing period. The dashboard's wording: "all of your team's projects will be disabled until you raise this threshold" ([dashboard source](https://github.com/get-convex/convex-backend/blob/main/npm-packages/dashboard/src/components/billing/SpendingLimits.tsx)). Current spend this period: **$3.33**. Usage state: `Default`.
- **Billing period:** 2026-10-11 to 2026-11-11.
- **Deployments in scope:**

| Project | Convex project | Prod deployment | Dev deployment | Region |
| --- | --- | --- | --- | --- |
| Сметката | `onova-za-smetkata` | `coordinated-warbler-782` | `striped-shepherd-984` | aws-us-east-1 |
| Клиентите | `onova-za-klientite` | `ideal-shepherd-123` | `amiable-echidna-14` | aws-eu-west-1 |
| Кухнята (Chef) | `chef` | `descriptive-snail-667` | `hearty-kookabura-538` | aws-us-east-1 |
| Кафето | none yet | | | |

- **File storage on 2026-10-26: 694.9 MB of 1 GiB (65%).**

| Project | File storage | Trend |
| --- | --- | --- |
| zoo | 545.6 MB | 373 MB on 2026-09-11, 488 MB on 10-21; about +57 MB in the last 5 days |
| a-el-key | 114.3 MB | flat |
| Сметката | 30.1 MB | flat to falling |
| Кухнята (Chef) | 4.9 MB | flat |
| Клиентите | 70 bytes | |
| car-auto, imot-browser | 0 | |

- **Data egress, 2026-10-11 to 2026-10-26: 246.8 MB of 1 GB.** zoo 124.2 MB (file serving), imot-browser 78.8 MB (outbound `fetch`), Chef 25.7 MB (25.1 MB file serving), a-el-key 18.1 MB, Сметката and Клиентите 0.
- **Not asked, but it is the bill:** database I/O is about 9.0 GB this period against 1 GB included (zoo 6.7 GB, Chef 1.1 GB, imot-browser 1.1 GB). At $0.22 per extra GB that is most of the $3.33 so far. Function calls: about 122,000 of 1,000,000.
- **What Кафето adds:** #21 estimated 200 KB a photo, 240 MB for 20 people with 60 bags each, and tens of MB of egress a month. On Starter that never blocks; the team passes 1 GiB at some point either way (zoo alone grows), and the overage is cents. The thing to watch is the $20 disable threshold, which takes down Сметката, Клиентите, Кухнята and Кафето together if any project on the team runs away.
- **Where the owner reads it by hand:** [dashboard.convex.dev](https://dashboard.convex.dev), team, **Settings > Usage** (by project and by day), and **Settings > Billing** for the spending limits. No `npx convex` command reports usage (`insights` covers only OCC conflicts and resource-limit events), and the public Management API has no usage endpoint.

## 2. The checklist

Values in angle brackets are read at that step: `<app_id>`, `<dev FAPI URL>` (format `https://<words>.clerk.accounts.dev`), `<id>` in the email CNAMEs. Legal URLs are named placeholders: `<PRIVACY_URL>` and `<TERMS_URL>`, the hub's privacy policy and terms once written.

### Phase 0. Before anything

| # | Step | Who |
| --- | --- | --- |
| 0.1 | `clerk update` (3.4.1 to 4.0.0), then `clerk --version`. | Agent |
| 0.2 | `clerk auth login` (opens a browser). | Owner |
| 0.3 | Add DMARC now; Clerk: "Setting up your DMARC record before creating your production instance on Clerk is ideal" **[docs]**. `vercel dns add onovaza.com _dmarc TXT 'v=DMARC1; p=none'`. No `rua` for now: onovaza.com has no mailbox (no MX), and reports to another domain need that domain's consent record. Tighten to `p=reject` in step 5.5. | Agent, owner confirms (DNS write) |
| 0.4 | `dig onovaza.com CAA +short`: must allow `letsencrypt.org` and `pki.goog`. Today it lists `pki.goog`, `sectigo.com`, `letsencrypt.org` (Vercel defaults) **[verified]**, so nothing to do. | Agent |

### Phase 1. The app and its development instance

`clerk deploy` clones the dev instance's config into production **[docs]**, so everything that can be set on dev is set here. Paths, SSO connections and Integrations do not copy **[docs]** and are redone in Phase 4.

| # | Step | Who |
| --- | --- | --- |
| 1.1 | `clerk apps create "онова за" --json`, keep `<app_id>`. | Agent |
| 1.2 | In the hub repo: `clerk link --app <app_id>`. | Agent |
| 1.3 | `clerk config pull --output /tmp/dev-before.json` (not in the repo) and note every `connection_oauth_*` that is enabled. | Agent |
| 1.4 | Sign-in methods, dev: `clerk config patch --dry-run --json '{"auth_email":{"used_for_sign_in":true,"sign_in_strategies":["email_code"],"verification_strategies":["email_code"]},"auth_password":{"enabled":false},"connection_oauth_google":{"enabled":true}}'`, then without `--dry-run`. Add `{"enabled":false}` for any other `connection_oauth_*` found in 1.3 (no Apple), so the deploy wizard asks only for Google. Keys from #13's `clerk config schema` read **[prior]**; re-check with `clerk config schema --keys auth_email auth_password` once logged in. | Agent |
| 1.5 | Dashboard, dev, **User & authentication**: first and last name on, not required (Chef's import in #15 needs the fields enabled); users may delete their own account (on, `<UserProfile>` on `/akaunt` uses it); email address required. If `clerk config schema` shows keys for these, the agent can set them instead. | Owner |
| 1.6 | Dashboard, dev, **Integrations > Convex**: Activate. Then **Sessions > Claims**: keep the pre-mapped `aud`, add `{"name":"{{user.full_name}}","email":"{{user.primary_email_address}}","email_verified":"{{user.email_verified}}","picture":"{{user.image_url}}"}`. Shortcodes per [JWT templates](https://clerk.com/docs/guides/sessions/jwt-templates) **[docs]**. No `convex` JWT template: every project will be on convex 1.33.1 or later when it switches (#14). | Owner |
| 1.7 | `clerk config pull --output /tmp/dev-after.json` and diff against 1.3; delete both files after. | Agent |

### Phase 2. Google Cloud (can run in parallel with Phase 1)

The redirect URI is fixed in advance: the CLI builds it as `https://clerk.<domain>/v1/oauth_callback` and the JavaScript origins as `https://<domain>` and `https://www.<domain>` **[source]**, so the client can exist before `clerk deploy` asks for it.

| # | Step | Who |
| --- | --- | --- |
| 2.1 | Google Cloud Console: new project "онова за". | Owner |
| 2.2 | **Google Auth Platform > Branding:** app name `онова за` (the CLI's own tip: "The consent screen's app name is what users see when they sign in with Google"); user support email; logo optional; home page `https://onovaza.com`; privacy policy `<PRIVACY_URL>`; terms `<TERMS_URL>`; authorized domain `onovaza.com`; developer contact. | Owner |
| 2.3 | Verify `onovaza.com` in Google Search Console (authorized domains must be verified there **[docs, Google]**). Search Console gives a TXT value. | Owner gets the value; agent adds it with `vercel dns add onovaza.com @ TXT '<value>'`, owner confirms |
| 2.4 | **Audience:** External. **Data access:** only `openid`, `email`, `profile` (non-sensitive, pre-filled for Sign in with Google). | Owner |
| 2.5 | **Clients > Create client:** Web application, name `Clerk production`. Authorized JavaScript origins `https://onovaza.com`, `https://www.onovaza.com`. Authorized redirect URI `https://clerk.onovaza.com/v1/oauth_callback`. Download the client JSON to a folder outside every repo. | Owner |
| 2.6 | **Publish to "In production"** and submit **brand verification**. Needs `<PRIVACY_URL>` live on onovaza.com, linked from the public home page, matching the consent screen link **[docs, Google]**. Automated check "typically takes a few minutes", manual review 2 to 3 business days. While the app stays in "Testing", only up to 100 listed test users can sign in with Google **[docs, Clerk]**, which is enough for the owner's own tests. | Owner, after the legal pages ship |

### Phase 3. Production instance

| # | Step | Who |
| --- | --- | --- |
| 3.1 | `clerk deploy --mode agent` (read-only handoff), expect `state: "not_started"`. | Agent |
| 3.2 | In your own terminal, in the hub repo: `clerk deploy`. Domain: `onovaza.com` (the apex). Export the zone file: yes (writes `clerk-onovaza.com.zone` in the current directory). Google: import the JSON from 2.5. | Owner |
| 3.3 | Add the five records, values exactly as printed: `vercel dns import onovaza.com ./clerk-onovaza.com.zone`, or one by one: `clerk` CNAME `frontend-api.clerk.services`; `accounts` CNAME `accounts.clerk.services`; `clkmail` CNAME `mail.<id>.clerk.services`; `clk._domainkey` CNAME `dkim1.<id>.clerk.services`; `clk2._domainkey` CNAME `dkim2.<id>.clerk.services` (shape from #13 **[prior]**). Vercel DNS doesn't proxy, and explicit records override the `*` ALIAS. Delete the zone file afterwards. | Agent, owner confirms (DNS write) |
| 3.4 | `clerk deploy status --mode agent --wait` until `complete: true` (DNS, SSL, email, and OAuth all done). If it sits in `domain_pending` with all three parts complete for over an hour: Dashboard home, **Deploy certificates** (section 1.2). | Agent; owner only for the fallback |
| 3.5 | `curl -s https://clerk.onovaza.com/.well-known/openid-configuration` shows `issuer: "https://clerk.onovaza.com"` and a `jwks_uri`. This is the value every Convex prod deployment trusts. | Agent |

### Phase 4. Production settings that don't copy or are prod-only

| # | Step | Who |
| --- | --- | --- |
| 4.1 | **Paths:** `clerk config schema --instance prod --keys paths` first (the key exists **[prior]**, its shape wasn't recorded), then `clerk config patch --instance prod --dry-run` with sign-in `https://onovaza.com/vhod`, sign-up `https://onovaza.com/vhod` (one Вход, #18), after sign-out `https://onovaza.com/`; then for real. | Agent, owner confirms |
| 4.2 | **Allowed Subdomains:** `clerk api /instance -X PATCH --instance prod --dry-run -d '{"subdomain_allowlist_enabled":true,"allowed_subdomains":["smetkata.onovaza.com","klientite.onovaza.com","kuhnyata.onovaza.com","kafeto.onovaza.com"]}'`, then without `--dry-run`. Read back: `clerk api /instance --instance prod \| jq '{subdomain_allowlist_enabled, allowed_subdomains}'`. A plan error here answers section 1.1. Fallback: Dashboard, Domains, Allowed subdomains. | Agent, owner confirms |
| 4.3 | Check the allowlist from outside: `curl -s -o /dev/null -w '%{http_code}' -H 'Origin: https://test.onovaza.com' https://clerk.onovaza.com/v1/environment` should be 403 (`subdomain_not_allowed`), and the same with `Origin: https://smetkata.onovaza.com` should not be 403. Repeat with `Origin: https://accounts.onovaza.com`: if 403, add `accounts.onovaza.com` to the list so the Account Portal keeps working for dev-style testing. Which FAPI path enforces the check first is **[unverified]**. | Agent |
| 4.4 | Dashboard, prod, **Integrations > Convex:** Activate (Integrations don't copy). **Sessions > Claims:** confirm `aud` plus the four claims from 1.6; re-add them if they didn't copy. | Owner |
| 4.5 | `clerk config pull --instance prod` and diff against the dev pull: email code only, password off, Google on with custom credentials, block email subaddresses on, bot protection on. | Agent |
| 4.6 | Dashboard, prod, **API keys:** one Secret Key per consumer, named after it ([rotate keys](https://clerk.com/docs/guides/secure/rotate-api-keys) **[docs]**): `smetkata`, `kuhnyata`, and `klientite` (its server middleware, plus its Convex while the in-app delete still calls Clerk, #20). The hub and Кафето need none. | Owner |
| 4.7 | Dashboard, prod, **Sessions:** is the "Reverification window" field there on Hobby? Leave it at 10 minutes. | Owner (just look) |
| 4.8 | No webhook endpoints yet: each is created at its project's switch (Phase 6), once the handler is deployed. | |

### Phase 5. The hub goes first

Every project's production sign-in points at `/vhod`, so the hub ships before any project switches.

| # | Step | Who |
| --- | --- | --- |
| 5.1 | Hub code (its own implementation issue, #19): `<ClerkProvider>` without `dynamic`, `/vhod`, `/akaunt`, client-only sign-in UI, no `proxy.ts` (#13). | Agent |
| 5.2 | Hub env in Vercel (section 3). Publishable keys aren't secret, so the agent adds them with `vercel env add`. | Agent |
| 5.3 | `vercel --prod` (or merge to `main`). | Owner confirms |
| 5.4 | On `https://onovaza.com/vhod`: sign in with Google, sign out, sign in with an email code, light and dark (agent-browser). Decode the session token: `iss` `https://clerk.onovaza.com`, `aud` `convex`, `azp` `https://onovaza.com`, plus `name`, `email`, `email_verified`, `picture`. Read the code email: subject language, sender `noreply@onovaza.com`, and in Gmail's "Show original": SPF, DKIM, DMARC all pass. | Owner signs in; agent checks the page and token |
| 5.5 | DKIM and DMARC pass: `vercel dns` update `_dmarc` to `v=DMARC1; p=reject` (Clerk uses `p=reject` itself and recommends working towards it **[docs]**). | Agent, owner confirms |

### Phase 6. Each project switches (Сметката, Клиентите, Кухнята, Кафето)

Repeat per project, in rollout order. The code changes (sign-in URL, signed-out start page, avatar menu, `customJwt` and `azp` check, `user.deleted` handler, subject keys, CSP) belong to each project's migration plan; this is only the production wiring and its order.

| # | Step | Who |
| --- | --- | --- |
| 6.1 | `vercel domains add <name>.onovaza.com <vercel project>` (the `*` ALIAS already points at Vercel). Production keys only work on onovaza.com and its subdomains, so the key switch and the domain move ship in the same release. | Agent, owner confirms |
| 6.2 | Convex dev: `npx convex env set CLERK_JWT_ISSUER_DOMAIN '<dev FAPI URL>'`. Convex **Project Settings > default environment variables** for preview: the same value (and Клиентите's preview `CLERK_SECRET_KEY`). The Management API can't do the defaults on this team (`managementApiEnabled: false`), so this is by hand. | Agent (dev); owner (defaults) |
| 6.3 | Convex prod: `npx convex env set --prod CLERK_JWT_ISSUER_DOMAIN 'https://clerk.onovaza.com'`. During the switch `auth.config.ts` may list the old and new issuer together (#15). | Agent, owner confirms |
| 6.4 | Clerk Dashboard, prod, **Webhooks > Add Endpoint:** URL `https://<prod deployment>.convex.site/clerk/webhook` (EU deployments carry the region: `https://ideal-shepherd-123.eu-west-1.convex.site/clerk/webhook`; read the exact "HTTP Actions URL" in the Convex dashboard), events `user.deleted` only. Copy the signing secret straight into `npx convex env set --prod CLERK_WEBHOOK_SIGNING_SECRET` in your own terminal. | Owner |
| 6.5 | Vercel env for the project (section 3). Secret keys: the owner pastes them at the `vercel env add CLERK_SECRET_KEY production --sensitive` prompt. | Agent adds public values; owner pastes secrets |
| 6.6 | `npx convex deploy` (where the Vercel build doesn't already do it), then `vercel --prod`, then the old domain's 308. Клиентите's Vercel build deploys Convex itself (`CONVEX_DEPLOY_KEY` is set in Vercel), so its Convex env must be in place before its Vercel production deploy. | Owner confirms |
| 6.7 | Clerk Dashboard, the new endpoint, **Testing:** send a `user.deleted` example; expect 200 (an unknown subject is a no-op in Сметката's handler). Then sign in from the project: `/vhod` names the project and returns to the same page; Изход signs out everywhere. | Owner sends; agent checks |
| 6.8 | After the project's `azp` check is deployed (#24): `npx convex env set --prod CLERK_AUTHORIZED_PARTIES 'https://<name>.onovaza.com'`. | Agent, owner confirms |

Per-project values for 6.4:

| Project | Endpoint URL |
| --- | --- |
| Сметката | `https://coordinated-warbler-782.convex.site/clerk/webhook` (the route exists today: an unsigned POST returns 400 **[verified]**) |
| Клиентите | `https://ideal-shepherd-123.eu-west-1.convex.site/clerk/webhook` (route not built yet, 404 **[verified]**) |
| Кухнята | `https://descriptive-snail-667.convex.site/clerk/webhook` (route not built yet, 404 **[verified]**) |
| Кафето | its new prod deployment, created in the same team with `npx convex dev --once --configure new` |

The hub needs no endpoint (no database).

### Phase 7. Afterwards

| # | Step | Who |
| --- | --- | --- |
| 7.1 | Once Сметката is on the new instance and its 308s hold: remove `CLERK_FRONTEND_API_URL` from its Convex prod (the code reads only `CLERK_JWT_ISSUER_DOMAIN` **[verified]**), remove the old `clerk.onova-za-smetkata.com` style records at its DNS host, and retire its old Clerk instance (2 test users, #12). | Agent for env and DNS, owner confirms; owner retires the instance |
| 7.2 | Consider raising the Convex disable threshold above $20, or capping the side projects, so a runaway hobby project can't switch off the Акаунт projects (section 1.3). | Owner decides |

## 3. Env vars per project and environment

"Dev keys" means the new app's development instance (`pk_test_`, `sk_test_`), shared by every project in development and preview. "Unset" means the variable is absent in that environment, so Clerk falls back to the dev instance's Account Portal (#18). Secret keys are stored as Vercel **Sensitive**.

### Hub (`onova-za`; no env vars today)

| Variable | Production | Preview, Development |
| --- | --- | --- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_live_` | dev `pk_test_` |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/vhod` | `/vhod` (the page is the hub's own) |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/vhod` | `/vhod` |
| `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` | `/akaunt` | `/akaunt` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` | `/akaunt` | `/akaunt` |
| `CLERK_SECRET_KEY` | none (no server auth, no `proxy.ts`) | none |

The fallback is where `/vhod` goes when nothing asks it to return anywhere (#18). Clerk recommends setting the sign-up variant next to the sign-in one **[docs]**.

### Сметката (`onova-za-smetkata`; today the Clerk keys are one value shared by Preview and Production)

| Variable | Production | Preview |
| --- | --- | --- |
| `VITE_CLERK_PUBLISHABLE_KEY` | `pk_live_` | dev `pk_test_` |
| `CLERK_SECRET_KEY` | `sk_live_` key `smetkata` | dev `sk_test_` |
| `VITE_CLERK_SIGN_IN_URL` | `https://onovaza.com/vhod` | unset |
| `VITE_CLERK_SIGN_UP_URL` | `https://onovaza.com/vhod` | unset |
| `VITE_APP_ORIGIN` | `https://smetkata.onovaza.com` | as today |
| `VITE_CONVEX_URL` | unchanged | unchanged |

Convex `coordinated-warbler-782` (prod): `CLERK_JWT_ISSUER_DOMAIN=https://clerk.onovaza.com`, `CLERK_WEBHOOK_SIGNING_SECRET=<new whsec>`, later `CLERK_AUTHORIZED_PARTIES=https://smetkata.onovaza.com`; drop `CLERK_FRONTEND_API_URL`. Convex `striped-shepherd-984` (dev): `CLERK_JWT_ISSUER_DOMAIN=<dev FAPI URL>`.

### Клиентите (`onova-za-klientite`)

| Variable | Production | Preview |
| --- | --- | --- |
| `VITE_CLERK_PUBLISHABLE_KEY` | `pk_live_` | dev `pk_test_` |
| `VITE_CLERK_SIGN_IN_URL` | `https://onovaza.com/vhod` | unset |
| `VITE_CLERK_SIGN_UP_URL` | `https://onovaza.com/vhod` | unset |
| `CLERK_SECRET_KEY` | `sk_live_` key `klientite`, once `clerkMiddleware` with `authorizedParties` is added (none today) | dev `sk_test_` |
| `CONVEX_DEPLOY_KEY`, `VITE_VAPID_PUBLIC_KEY` | unchanged | unchanged |

The code hard-codes `signInUrl="/login"` in `src/integrations/providers.tsx` today, so it must read the env var instead **[verified]**. Convex `ideal-shepherd-123` (prod): `CLERK_JWT_ISSUER_DOMAIN=https://clerk.onovaza.com`, `CLERK_WEBHOOK_SIGNING_SECRET=<new whsec>`, `CLERK_SECRET_KEY=` key `klientite` (only while the in-app delete calls Clerk, #20), `APP_URL=https://klientite.onovaza.com`, later `CLERK_AUTHORIZED_PARTIES`. Convex dev and the project's dev/preview defaults: `CLERK_JWT_ISSUER_DOMAIN=<dev FAPI URL>`, preview `CLERK_SECRET_KEY=` dev `sk_test_`.

### Кухнята (`chef`; today every Clerk variable is one value across Development, Preview and Production, and `CLERK_SECRET_KEY` is stored as a plain encrypted variable, not Sensitive)

| Variable | Production | Preview, Development |
| --- | --- | --- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_live_` | dev `pk_test_` |
| `CLERK_SECRET_KEY` | `sk_live_` key `kuhnyata`, Sensitive | dev `sk_test_` |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `https://onovaza.com/vhod` | unset (remove) |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `https://onovaza.com/vhod` | unset (remove) |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL`, `..._AFTER_SIGN_UP_URL` | remove (deprecated **[docs]**) | remove |
| `NEXT_PUBLIC_CONVEX_URL` | unchanged | unchanged |

Convex `descriptive-snail-667` (prod): `CLERK_JWT_ISSUER_DOMAIN=https://clerk.onovaza.com` (the code hard-codes its dev issuer today), `CLERK_WEBHOOK_SIGNING_SECRET=<new whsec>`, later `CLERK_AUTHORIZED_PARTIES=https://kuhnyata.onovaza.com`. Convex `hearty-kookabura-538` (dev): `CLERK_JWT_ISSUER_DOMAIN=<dev FAPI URL>`.

### Кафето (`dial-in`; no env vars today, no Convex project yet)

| Variable | Production | Preview |
| --- | --- | --- |
| `VITE_CLERK_PUBLISHABLE_KEY` | `pk_live_` | dev `pk_test_` |
| `VITE_CLERK_SIGN_IN_URL` | `https://onovaza.com/vhod` (unset if the iPhone check fails and Кафето embeds `<SignIn>`, #18) | unset |
| `VITE_CLERK_SIGN_UP_URL` | same as sign-in | unset |
| `VITE_CONVEX_URL` | new prod deployment | dev deployment |

No secret key. Its new Convex prod: `CLERK_JWT_ISSUER_DOMAIN=https://clerk.onovaza.com`, `CLERK_WEBHOOK_SIGNING_SECRET=<new whsec>`, `CLERK_AUTHORIZED_PARTIES=https://kafeto.onovaza.com`.

## 4. Noticed along the way

- **Сметката's CSP hard-codes the old Clerk host** (`https://clerk.onova-za-smetkata.com` in `vite.config.ts`). It needs `https://clerk.onovaza.com`. Клиентите derives its Clerk host from the publishable key, so it follows automatically **[verified]**.
- **Сметката and Кухнята share one set of Clerk keys across environments** in Vercel today. Production keys don't work on `*.vercel.app` previews **[docs]**, so the split in section 3 is required, not tidy-up.
- **Chef's `CLERK_SECRET_KEY` is not a Sensitive variable** in Vercel. The new one should be.
- **Сметката's prod Convex already has `CLERK_WEBHOOK_SIGNING_SECRET` set and the route answers**, which settles #14's open question: the old endpoint was configured.
- **Convex database I/O**, not storage, is what the team pays for today (section 1.3).

## 5. Open uncertainties

- Allowed Subdomains and reverification on Hobby: answered by step 4.2 and 4.7, not before.
- Whether the session claims set on dev copy to production with `clerk deploy`, or need re-adding with the integration (step 4.4 checks).
- The exact `clerk config` keys for Paths, name fields and self-deletion: `clerk config schema` needs a login; read them in 1.4, 1.5 and 4.1.
- Whether `accounts.onovaza.com` must be on the allowlist (step 4.3 tests it).
- How Google shows the consent screen for an unverified, published app, and whether brand verification passes before the legal pages are live: Google's docs require a public home page linking the privacy policy.
- Whether Clerk's code email arrives in Bulgarian for a `bg` browser (#13); step 5.4 shows it.
- Whether the hub builds and runs with only a publishable key, no `CLERK_SECRET_KEY` (#13's build used only a placeholder `pk_live_`; reasonable, not run with a real key).
- The `.convex.site` form for EU deployments: both `ideal-shepherd-123.convex.site` and `ideal-shepherd-123.eu-west-1.convex.site` answered (404, no route yet); use the one the Convex dashboard shows.

## Sources

- Clerk: [Deploy to production](https://clerk.com/docs/guides/development/deployment/production) (Deploy certificates, CAA, subdomains, `authorizedParties`), [Subdomain allowlist](https://clerk.com/docs/guides/dashboard/dns-domains/subdomain-allowlist), [Reverification](https://clerk.com/docs/guides/secure/reverification), [Pricing](https://clerk.com/pricing), [Integrate Convex](https://clerk.com/docs/guides/development/integrations/databases/convex), [JWT templates](https://clerk.com/docs/guides/sessions/jwt-templates), [Google](https://clerk.com/docs/guides/configure/auth-strategies/social-connections/google), [Environment variables](https://clerk.com/docs/guides/development/clerk-environment-variables), [Vercel](https://clerk.com/docs/guides/development/deployment/vercel), [Syncing webhooks](https://clerk.com/docs/guides/development/webhooks/syncing), [Rotate API keys](https://clerk.com/docs/guides/secure/rotate-api-keys), [Email warm-up and DMARC](https://clerk.com/docs/guides/development/troubleshooting/email-domain-name-warmup), [`clerk deploy` changelog](https://clerk.com/changelog/2026-06-10-clerk-deploy)
- Clerk source: [Backend API spec 2026-08-20](https://github.com/clerk/openapi-specs/blob/main/bapi/2026-08-20.yml) (`PATCH /instance`); Clerk CLI 3.4.1 binary (`@clerk/cli-linux-x64`, deploy flow strings and Platform API calls); `clerk deploy --help` in 3.4.1 and 4.0.0; the `clerk-cli` skill's `references/agent-mode.md`
- Google: [Brand verification](https://developers.google.com/identity/protocols/oauth2/production-readiness/brand-verification), [OAuth app verification requirements](https://support.google.com/cloud/answer/13464321)
- Convex: [Limits](https://docs.convex.dev/production/state/limits), [Auth in functions](https://docs.convex.dev/auth/functions-auth), [dashboard source](https://github.com/get-convex/convex-backend/tree/main/npm-packages/dashboard/src) (`api/usage.ts`, `hooks/usageMetrics.ts`, `components/billing/SpendingLimits.tsx`), [Management API OpenAPI](https://api.convex.dev/v1/openapi.json)
- Live reads (2026-10-26): `vercel dns ls onovaza.com`, `vercel project ls`, `vercel env ls` (names only) for `onova-za`, `onova-za-smetkata`, `onova-za-klientite`, `chef`, `dial-in`; `npx convex env list` (names only) per deployment; Convex Management API projects and deployments; Convex dashboard API usage, entitlements, current spend and spending limits for the team; `clerk whoami`
