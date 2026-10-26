# How old addresses redirect to the onovaza.com subdomains

Research for [#29](https://github.com/HayGrouve/onova-za/issues/29) on the [Акаунт map (#12)](https://github.com/HayGrouve/onova-za/issues/12). Architecture: [ADR 0001](https://github.com/HayGrouve/onova-za/blob/main/docs/adr/0001-one-akaunt-on-onovaza-subdomains.md) (old domains 308 to `<name>.onovaza.com` keeping path and query and stay registered a year or more; `onovaza.com/<name>` 308s to the subdomain). Builds on [#13](https://github.com/HayGrouve/onova-za/issues/13) (Clerk on the apex), [#16](https://github.com/HayGrouve/onova-za/issues/16) (Dial In: manual move, then a plain 308) and [#26](https://github.com/HayGrouve/onova-za/issues/26) (production checklist, step 6.1 to 6.6). Сметката's Stripe is [#28](https://github.com/HayGrouve/onova-za/issues/28); only the redirect side of it is here.

Written 2026-10-26. Everything was read-only: `vercel api` `GET` calls on team `haygrouves-projects` (domains, project domains, DNS records, certificates, project routing rules, env var names only), `curl -I` against the live addresses, and the local checkouts of the hub, Сметката, Клиентите, Chef and Dial In (files read, nothing run). No domain, DNS, env, route or deploy was changed. No secrets or personal data here.

Markers: **[verified]** = checked against the live system or code. **[docs]** = stated in a primary source linked in [Sources](#sources). **[inference]** = my reading of the facts. **[unverified]** = not checked.

## Answer in short

- **Custom domains** (`armyant.app`, `onova-za-smetkata.com` and their `www`): a **domain-level redirect** in the project's own domain settings, 308, to the new subdomain added to the **same Vercel project**. Path and query are kept: the existing `www.onova-za-smetkata.com` redirect already does exactly this (`/x?y=1` to `https://onova-za-smetkata.com/x?y=1`, 308) **[verified]**. No code, no deploy, no new project.
- **Production `*.vercel.app` aliases** (`chef-black`, `onova-za-smetkata`, `onova-za-klientite`, `dial-in-three`): a **project-level routing rule** with a `Host` equals condition, 308 to `https://<name>.onovaza.com/:path*`. It runs at the CDN before the deployment's own routes, needs no deploy, is versioned with rollback, and is on Hobby (each project reports `maxRoutes: 100`, `currentRoutes: 0`) **[verified, docs]**. Preview URLs are different hostnames, so an exact host match never touches them; they also sit behind Vercel Authentication today **[verified]**. Vercel's own documented alternative is the same host-scoped rule in `vercel.json`/`vercel.ts` **[docs]**, fine for the Next.js project but unproven for the Nitro-built TanStack Start ones **[unverified]**.
- **`onovaza.com/<name>`**: a path redirect in the hub's `next.config.ts` `redirects()` (`permanent: true` is 308, query passes through) **[docs]**, one entry per project, added only when that subdomain is live. Domain redirects can't do it (they move a whole host).
- **A tiny redirect-only project**: not needed. Every old address already belongs to the project that will serve the new subdomain. The one rule: **never delete an old Vercel project or domain during the window**; it is what serves the redirect, and a freed `*.vercel.app` name or a lapsed domain can be taken by someone else **[inference]**.
- **Clerk**: old cookies are host-scoped to the old domains and never reach `*.onovaza.com`; they go inert and everyone signs in once at `onovaza.com/vhod` **[docs]**. OAuth callbacks live on the Clerk FAPI host (`clerk.<domain>/v1/oauth_callback`, or `*.clerk.accounts.dev` for dev instances), never on the app host, so the app redirects don't touch them **[docs, verified DNS]**.
- **Stripe**: Сметката builds `success_url`, `cancel_url` and the portal `return_url` per session from Convex `APP_ORIGIN` **[verified]**, and its webhook is on Convex, not the domain **[verified]**. A Checkout session opened before the switch (up to 24 h **[docs]**) comes back to the old host, 308s to the subdomain with `?checkout=success&session_id=...` intact, and lands signed out; the webhook still records the payment. Change `APP_ORIGIN` in the same cutover. The rest is #28.
- **Found while checking**: auto-renew is **off** on both old domains. `armyant.app` expires **2027-02-24**, `onova-za-smetkata.com` **2027-07-08** **[verified]**. Without renewing, neither stays registered "a year or more" after its cutover. Owner decision, and a cost.

## 1. What exists today [verified]

All three domains were bought through Vercel, use Vercel nameservers, and have a `*` ALIAS plus an apex ALIAS to Vercel (so any new subdomain resolves to Vercel with no DNS record).

| Address | Vercel project | Framework | Current behaviour | Notes |
| --- | --- | --- | --- | --- |
| `armyant.app` | `chef` | Next.js | 200 | Wildcard cert `*.armyant.app` exists. Auto-renew off, expires 2027-02-24 |
| `www.armyant.app` | none (not a project domain) | | **307** to `https://armyant.app/<path>?<query>` | Vercel's automatic www handling ("we will attempt to redirect automatically" **[docs]**) |
| `chef-black.vercel.app` | `chef` | Next.js | 200 | Production alias |
| `onova-za-smetkata.com` | `onova-za-smetkata` | TanStack Start | 200 | DNS also holds the old Clerk prod instance (`clerk`, `accounts`, `clkmail`, two DKIM CNAMEs), ImprovMX MX and SPF (mail for the `support@` and `privacy@` addresses in the app), Resend `send` and DKIM records, DMARC. Auto-renew off, expires 2027-07-08 |
| `www.onova-za-smetkata.com` | `onova-za-smetkata` | | **308** to the apex, path and query kept | Domain-level redirect, `redirectStatusCode: 308` |
| `onova-za-smetkata.vercel.app` | `onova-za-smetkata` | | 200 | Production alias |
| `onova-za-klientite.vercel.app` | `onova-za-klientite` | Nitro (TanStack Start) | 200 | Only domain |
| `dial-in-three.vercel.app` | `dial-in` | Vite SPA | 200 | Only domain; `vercel.json` has a catch-all SPA rewrite |
| `onovaza.com` | `onova-za` (hub) | Next.js 16.3.8 | 200; `/smetkata`, `/klientite`, `/kuhnyata`, `/kafeto` are 404 | Auto-renew on. Cert for the apex only |
| `www.onovaza.com` | none | | `http` 308 to `https://www`, then **TLS fails** (cert is `CN=onovaza.com`) | Not in this ticket, see section 7 |

- No project has project-level routing rules yet; every project reports `limit.maxRoutes: 100` on Hobby.
- Every project uses Standard Protection (`all_except_custom_domains`): branch and hash URLs such as `chef-git-main-haygrouves-projects.vercel.app` answer 302 to Vercel SSO, while the production aliases above answer 200.
- The hub's project data still links the old addresses (`links.live` in `src/content/projects/{chef,onova-za-smetkata,onova-za-klientite,dial-in}/index.ts`; Сметката's points at the `www` host, already one hop).

## 2. The three Vercel mechanisms, compared

| | Domain-level redirect | Project-level routing rule | `vercel.json` / `vercel.ts` / framework redirect |
| --- | --- | --- | --- |
| Where | Project, Settings, Domains, Edit, "Redirect to"; or `PATCH /v9/projects/{p}/domains/{d}` with `redirect` and `redirectStatusCode` (301, 302, 307, 308) **[docs]** | Project, CDN, Routing Rules; `vercel routes add/publish`; `/v1/projects/{id}/routes` **[docs]** | In the repo, shipped with a deploy **[docs]** |
| Granularity | Whole host | Path pattern plus Host, header, cookie, query conditions **[docs]** | Path pattern plus `has`/`missing` (host, header, cookie, query) **[docs]** |
| Target | A domain chosen from the project's domains (the dropdown lists them **[docs]**); a domain sits on one project only (409 "already assigned to another Vercel project" **[docs]**) | Any URL | Any URL |
| Path and query | Kept **[verified on `www.onova-za-smetkata.com`]** | Path via `:path*`; query pass-through **[unverified for routing rules]**, test with curl | Kept: "any query values provided in the request will be passed through" (Next.js) **[docs]**; for `vercel.json` "Query parameters pass through" **[docs]** |
| Deploy needed | No | No: stage, test, publish, roll back from History **[docs]** | Yes |
| Previews | Not affected (other hosts) | Rules "apply to all deployments and environments" **[docs]**, so an exact Host match is what keeps previews out | Applies to every deployment; host match keeps previews out **[docs]** |
| Order | Before routing **[inference]** | After bulk redirects, before the deployment's own routes **[docs]** | Deployment routes |

Why routing rules for the `*.vercel.app` aliases rather than a domain redirect: Vercel documents the `vercel.app` case only as a host-scoped config redirect or a firewall rule, never as a domain redirect **[docs]**. Whether "Redirect to" is offered on a project's own `*.vercel.app` domain was not tested (it would be a write) **[unverified]**. Routing rules cover the same ground with no deploy, and they sidestep two open doubts: whether a Nitro (TanStack Start) build honours `vercel.json` `redirects` **[unverified]**, and #16's worry about precedence against Dial In's catch-all SPA rewrite (routing rules run before deployment routes **[docs]**). The firewall route is out: the dashboard creates a 307, and Vercel says to use a config rule for a permanent path-keeping redirect **[docs]**.

Why not 308 straight away: a 308 is "Cached by client" **[docs]**, so a wrong target sticks in browsers. Set the domain redirect to 307 first, run the curl checks, then switch to 308 the same day **[inference]**. Routing rules can be staged and tested in the dashboard before publishing **[docs]**.

## 3. Per address: mechanism and steps

"Agent" = an agent session running the CLI; "owner confirms" = the owner approves that production-visible write first (domain, DNS, routing and production deploy changes, per the standing preferences on #12). Every project's steps start only after its subdomain serves production on the new Clerk keys (#26 steps 6.1 to 6.6, which already add `<name>.onovaza.com` to the project with `vercel domains add`).

### 3.0 Before any cutover (once)

| # | Step | Who |
| --- | --- | --- |
| 0.1 | Turn auto-renew on for `armyant.app` and `onova-za-smetkata.com` (Vercel dashboard, Domains), or renew when each cutover date is known. Without it `armyant.app` lapses 2027-02-24. | Owner (paid) |
| 0.2 | Save a curl check script (below) outside the repos, to run after each step. | Agent |

```sh
# check.sh <url>... prints status and Location for each
for u in "$@"; do printf '%s -> ' "$u"; curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' "$u"; done
```

### 3.1 Кухнята: `armyant.app`, `www.armyant.app`, `chef-black.vercel.app` (project `chef`)

| Address | Mechanism | Result |
| --- | --- | --- |
| `armyant.app` | Domain redirect to `kuhnyata.onovaza.com`, 308 | One hop, path and query kept |
| `www.armyant.app` | Add it to `chef` as a domain redirecting to `kuhnyata.onovaza.com`, 308 | One hop instead of Vercel's automatic 307 to the apex plus a 308 **[inference]**; the `*.armyant.app` cert already covers it **[verified]** |
| `chef-black.vercel.app` | Routing rule, Host equals `chef-black.vercel.app`, `/:path*` to `https://kuhnyata.onovaza.com/:path*`, 308 (or Chef's `next.config.ts` with `has: [{ type: 'host', value: 'chef-black.vercel.app' }]`) | One hop |

| # | Step | Who |
| --- | --- | --- |
| 1 | Confirm `https://kuhnyata.onovaza.com/` serves the new build (#26 6.6). | Agent |
| 2 | `vercel api /v9/projects/chef/domains/armyant.app -X PATCH -d '{"redirect":"kuhnyata.onovaza.com","redirectStatusCode":307}'` | Agent, owner confirms |
| 3 | `vercel api /v10/projects/chef/domains -X POST -d '{"name":"www.armyant.app","redirect":"kuhnyata.onovaza.com","redirectStatusCode":307}'` | Agent, owner confirms |
| 4 | Routing rule: `vercel routes add "chef-black to kuhnyata" --src "/:path*" --src-syntax path-to-regexp --action redirect --dest "https://kuhnyata.onovaza.com/:path*" --status 308 --has "host:chef-black.vercel.app"`, then `vercel routes list --diff`, then `vercel routes publish`. The exact `--has` syntax for a host condition is **[unverified]**; the dashboard (CDN, Routing Rules, Host equals) is the fallback. | Agent, owner confirms the publish |
| 5 | `check.sh 'https://armyant.app/recipe/x?a=1' 'https://www.armyant.app/recipe/x?a=1' 'https://chef-black.vercel.app/recipe/x?a=1' https://chef-git-main-haygrouves-projects.vercel.app/`: expect one hop each to `https://kuhnyata.onovaza.com/recipe/x?a=1`, and the branch URL still 302 to SSO (untouched). | Agent |
| 6 | Switch steps 2 and 3 to `308` (same PATCH with `"redirectStatusCode":308`), re-run step 5. | Agent, owner confirms |
| 7 | Update the hub's `src/content/projects/chef/index.ts` `links.live`, Chef's canonical and sitemap host, and its Clerk sign-in env (per #26). | Agent (PR), owner merges |
| 8 | Optional: Google Search Console change of address from `armyant.app` to `kuhnyata.onovaza.com` (owner must own both properties; the tool asks for 301s and checks the homepage; whether it accepts 308 is **[unverified]**; Google indexing treats 308 like 301 **[docs]**). | Owner |

### 3.2 Сметката: `onova-za-smetkata.com`, `www.onova-za-smetkata.com`, `onova-za-smetkata.vercel.app` (project `onova-za-smetkata`)

| Address | Mechanism |
| --- | --- |
| `onova-za-smetkata.com` | Domain redirect to `smetkata.onovaza.com`, 308 |
| `www.onova-za-smetkata.com` | Change its existing redirect target from the apex to `smetkata.onovaza.com`, 308 (otherwise two hops) |
| `onova-za-smetkata.vercel.app` | Routing rule, Host equals, `/:path*` to `https://smetkata.onovaza.com/:path*`, 308 |

Same steps as 3.1 (smoke test, 307, curl, 308), with these extras:

| # | Step | Who |
| --- | --- | --- |
| a | Same cutover: Convex prod `APP_ORIGIN` and Vercel `VITE_APP_ORIGIN` to `https://smetkata.onovaza.com` (Stripe return URLs and the app's own origin), CSP Clerk host (#26). | Agent, owner confirms |
| b | Curl a share link shape: `check.sh 'https://onova-za-smetkata.com/bills/abc/join?t=test'` must land on `https://smetkata.onovaza.com/bills/abc/join?t=test` in one hop. Shared bill links travel in chat apps for months; they keep working only because the query survives. | Agent |
| c | **Do not touch the DNS zone** for the redirect. Keep MX and SPF (mail to the `support@`/`privacy@` addresses), the Resend records and DMARC. Remove the old Clerk CNAMEs only when the old instance is retired (#26 7.1). | Agent, owner confirms 7.1 |
| d | Update the hub's `src/content/projects/onova-za-smetkata/index.ts` `links.live`, plus Сметката's `DEFAULT_SITE_ORIGIN`, `robots.txt`, `sitemap.xml`, landing copy showing `onova-za-smetkata.com/…`. | Agent (PR), owner merges |

The service worker is no obstacle here: Сметката's `/sw.js` does not intercept navigations ("navigations always go to the network"), so installed copies hit the 308 like everyone else **[verified]**. An installed Home Screen copy keeps its old origin as scope and will show the new host as out-of-scope until reinstalled **[inference]**.

### 3.3 Клиентите: `onova-za-klientite.vercel.app` (project `onova-za-klientite`)

Mechanism: routing rule, Host equals `onova-za-klientite.vercel.app`, 308 to `https://klientite.onovaza.com/:path*`.

Caveat, the same trap #16 found for Dial In: Клиентите's service worker "answers every navigation with the cached shell" (ADR 0010 in that repo; live `/sw.js` confirms a precached `/_shell.html`) **[verified]**. An installed copy never sees a 308 on navigation, and a 308 on `/sw.js` makes the update check fail, so it is stuck on its last build **[docs, via #16]**. Two options:

- **Owner is the only installed user**: plain whole-host rule; the owner removes the old Home Screen icon. Same as Dial In.
- **Others have it installed**: exclude `/sw.js` from the rule (source `^/(?!sw\.js$).*`) and, in the release that ships the subdomain, make the worker check `self.location.hostname`: on the old host it unregisters itself and navigates its clients to the same path on `klientite.onovaza.com`. Because the same deployment serves both hosts, the old host fetches the new `/sw.js` on its next update check **[inference]**; the existing "Има нова версия" prompt means it waits for a tap. Who has it installed is for the Клиентите migration ticket.

Also: push notifications use Convex `APP_URL` for the click target (`convex/pushNode.ts`) **[verified]**, so set `APP_URL` in the same cutover (#26 lists it). Existing push subscriptions belong to the old origin's worker; they are re-created after sign-in on the new origin anyway, since the users change with the new Clerk instance **[inference]**.

### 3.4 Кафето: `dial-in-three.vercel.app` (project `dial-in`)

Per #16: the owner exports in Dial In, imports in Кафето, then a plain 308. Mechanism: routing rule, Host equals `dial-in-three.vercel.app`, `/:path*` to `https://kafeto.onovaza.com/:path*`, 308. It runs before `vercel.json`'s catch-all rewrite **[docs]**, so it covers `/sw.js` too; that is fine here, because the only installed copy is the owner's, who removes the old icon after the import. If Кафето ends up in a new Vercel project, the `dial-in` project stays alive (no deploys needed) just to carry this rule; that is the only "redirect-only project" in the plan.

| # | Step | Who |
| --- | --- | --- |
| 1 | Export in Dial In, import in Кафето, check the data. | Owner |
| 2 | Add and publish the rule (as 3.1 step 4). | Agent, owner confirms |
| 3 | `check.sh 'https://dial-in-three.vercel.app/coffee/x?a=1' https://dial-in-three.vercel.app/sw.js` | Agent |
| 4 | Remove the old Home Screen icon. | Owner |

### 3.5 `onovaza.com/<name>` (hub, this repo)

Mechanism: `redirects()` in `next.config.ts`, which Vercel serves at the CDN. `permanent: true` gives 308 and the query is passed through **[docs: `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/redirects.md`]**. A host-free path rule also works on hub preview URLs, so it can be tested before production. `vercel.ts` with `routes.redirect(..., { permanent: true })` would do the same **[docs]**; `next.config.ts` keeps it next to the code and testable with `next dev` and Playwright.

```ts
// next.config.ts: add a name only once https://<name>.onovaza.com is live
const LIVE_SUBDOMAINS = ['smetkata'] as const

async redirects() {
  return LIVE_SUBDOMAINS.flatMap((name) => [
    { source: `/${name}`, destination: `https://${name}.onovaza.com/`, permanent: true },
    { source: `/${name}/:path*`, destination: `https://${name}.onovaza.com/:path*`, permanent: true },
  ])
},
```

- One name per project cutover, in rollout order, so `onovaza.com/kafeto` never 308s (cached) to a host that doesn't exist yet.
- The four names don't collide with hub routes (`/proekti/[slug]`, `/za-men`) **[verified]**. "Content is data" suggests deriving the list from a `subdomain` field in project data later; not needed for four entries **[inference]**.
- Steps: agent opens a PR adding the name plus an e2e check (`/smetkata?x=1` and `/smetkata/a/b` return 308 with the right `Location`); owner merges; agent re-runs `check.sh` on production.

## 4. Old Clerk cookies, Clerk OAuth callbacks, other return URLs

### Cookies

- `__client` lives on the FAPI host, `__session` on the app domain "scoped strictly so it cannot be shared across subdomains"; dev instances carry their client via `__clerk_db_jwt` instead **[docs]**. None of the old ones can be sent to `*.onovaza.com`.
- The 308 comes from Vercel's edge before any page or clerk-js runs, so nothing on the old host refreshes or clears them. They sit in the browser until they expire or the old instance is deleted, and nothing reads them **[inference]**.
- So: every old user arrives signed out and signs in once at `onovaza.com/vhod` (#18, #22). Nothing to migrate, nothing unsafe.

### Clerk OAuth callbacks

- Google and Apple come back to `https://clerk.<instance domain>/v1/oauth_callback` (the hub's checklist builds `https://clerk.onovaza.com/v1/oauth_callback` **[docs, via #26]**). For Chef's development instance that is `good-puma-58.clerk.accounts.dev` (#15). For Сметката's old production instance it is `clerk.onova-za-smetkata.com`, a CNAME to Clerk, not a Vercel project host **[verified DNS]**. A redirect on the app host doesn't reach either **[inference]**.
- A sign-in in flight at the moment of cutover returns to its old `redirect_url`, 308s to the subdomain and lands signed out. Harmless, a few minutes' window.
- Old links like `armyant.app/sign-in?redirect_url=https://armyant.app/x` arrive at the new host with the old `redirect_url`. Clerk-js only accepts the current origin, `https://onovaza.com` and `https://*.onovaza.com` by default (#13, from clerk-js source), and Chef's middleware already drops cross-origin `redirect_url` values **[verified]**. `/vhod` should map a known old host to its new subdomain or fall back to the project's start page (#19 owns that page).

### Stripe and other return URLs

| What | Points at | After the redirect |
| --- | --- | --- |
| Сметката Checkout `success_url`, `cancel_url` | `APP_ORIGIN` + subscription page, fixed when the session is created **[verified]** | Sessions open at cutover (expire within 24 h **[docs]**) return to the old host, 308 with the query intact, land signed out. The webhook records the payment regardless. New sessions use the new `APP_ORIGIN` |
| Сметката billing portal `return_url` | Same, per session **[verified]** | Same |
| Stripe webhook | `<deployment>.convex.site/stripe/webhook` **[verified]** | Unaffected |
| Clerk webhook (Сметката) | `<deployment>.convex.site/clerk/webhook` **[verified]** | Unaffected; replaced by the new instance's endpoint anyway (#14) |
| Stripe Dashboard settings (business website, portal default return URL, terms and privacy links, receipt links) | Not read here **[unverified]** | For #28 |
| Клиентите push click URLs | Convex `APP_URL` **[verified]** | Set at cutover; old notifications already shown still open the old host and 308 |
| Shared bill links (Сметката) | `onova-za-smetkata.com/bills/<id>/join?t=<token>` | Work through the 308 because the query is kept |

## 5. Can a production `*.vercel.app` alias be redirected without breaking previews?

Yes. Previews and branch URLs are separate hostnames (`<project>-<hash>-<team>.vercel.app`, `<project>-git-<branch>-<team>.vercel.app`) and today answer 302 to Vercel SSO **[verified]**. A rule matched on the exact production alias leaves them alone; Vercel's own example says matching the exact host "avoids redirecting the destination back to itself or redirecting every preview URL" **[docs]**. After the rule, test one preview URL as in 3.1 step 5. What does break: anything that fetches the production alias by name, for example code using `VERCEL_PROJECT_PRODUCTION_URL`, which picks "the shortest production custom domain or vercel.app domain" **[docs]**; once `<name>.onovaza.com` is the shortest domain it points there anyway **[inference]**.

## 6. How long, and what ends it

- Google: keep redirects "at least 180 days, longer if you still see any traffic" **[docs]**; ADR 0001 says a year or more.
- `armyant.app` and `onova-za-smetkata.com` need renewal before 2027-02-24 and 2027-07-08 to meet that (step 0.1).
- When a domain finally lapses, anyone can register it and receive whatever old links still carry. For Сметката that includes share tokens in old bill links. Before letting it go, make sure old share tokens no longer grant anything **[inference]**.
- The `*.vercel.app` names stay reserved only while their projects exist: keep `chef`, `onova-za-smetkata`, `onova-za-klientite` and `dial-in` for the window **[inference]**.

## 7. Open questions and unverified points

- Auto-renew is off on `armyant.app` (expires 2027-02-24) and `onova-za-smetkata.com` (2027-07-08). Owner decision.
- Whether "Redirect to" (or the API's `redirect`) is accepted on a project's own `*.vercel.app` domain, and whether a domain redirect may target a domain on another project. Not needed by the plan; not tested because both are writes.
- Exact `vercel routes add --has` syntax for a host condition, and whether routing-rule redirects pass the query through without `:path*` tricks. Check on the first rule, with the dashboard as fallback.
- Whether a Nitro (TanStack Start) build honours `vercel.json` `redirects`. Avoided by using routing rules.
- That `/:path*` in a Next.js `redirects()` source also matches the bare `/smetkata` (the plan lists both forms anyway).
- Who besides the owner has Клиентите installed as an app (decides 3.3's option).
- What the Resend records on `onova-za-smetkata.com` are used for (no Resend code in Сметката) and where `support@`/`privacy@` mail goes after the move. The redirect doesn't touch them; the legal-pages and email tickets may.
- Stripe Dashboard URLs (business site, portal, receipts): #28.
- Surfaced, outside the ticket: `www.onovaza.com` resolves to Vercel but has no certificate (TLS name mismatch), while #26 lists it as a Google OAuth JavaScript origin. One domain redirect fixes it: add `www.onovaza.com` to the hub project redirecting to `onovaza.com`, 308 (agent, owner confirms).

## Sources

Live state (2026-10-26): `vercel api /v5/domains`, `/v9/projects/<p>/domains`, `/v4/domains/<d>/records`, `/v4/certs`, `/v9/projects/<p>`, `/v9/projects/<p>/env` (names and targets only), `/v1/projects/<id>/routes`; `curl -I` on every address in section 1. Code: hub `next.config.ts` and `src/content/projects/*`; Сметката `convex/billingStripe.ts`, `convex/lib/billingEnv.ts`, `convex/http.ts`, `src/lib/site-meta.ts`, `src/lib/contact.ts`, `vercel.json`, live `/sw.js`; Клиентите `vercel.json`, `src/components/service-worker-register.tsx`, `docs/adr/0010-offline-read-cache.md`, `convex/pushNode.ts`, live `/sw.js`; Chef `next.config.ts`, `middleware.ts`; Dial In `vercel.json`.

Vercel (fetched 2026-10-26):

- Redirects (methods table, "Redirect the production vercel.app hostname", firewall 307, status codes, 308 "Cached by client"): https://vercel.com/docs/routing/redirects
- Deploying and redirecting domains ("Redirect to" dropdown, automatic www redirect): https://vercel.com/docs/domains/working-with-domains/deploying-and-redirecting
- Add a domain to a project (`redirect`, `redirectStatusCode`, 409 already assigned): https://vercel.com/docs/rest-api/projects/add-a-domain-to-a-project
- Update a project domain: https://vercel.com/docs/rest-api/projects/update-a-project-domain
- Project-level routing rules (Host condition, staging, order, no deploy): https://vercel.com/docs/routing/project-routing-rules
- `vercel routes` CLI ("apply to all deployments and environments", `--has`): https://vercel.com/docs/cli/routes
- Routing order: https://vercel.com/docs/routing
- Deployment Protection (Standard Protection): https://vercel.com/docs/deployment-protection
- System env `VERCEL_PROJECT_PRODUCTION_URL`: https://vercel.com/docs/environment-variables/system-environment-variables

Next.js 16.3.8 (local): `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/redirects.md` (308, query pass-through, `has` host).

Clerk: How Clerk works, cookies and dev browser: https://clerk.com/docs/guides/how-clerk-works/overview; default `allowedRedirectOrigins` and OAuth callback shape via [#13 findings](https://github.com/HayGrouve/onova-za/blob/research/clerk-subdomains/docs/research/akaunt/clerk-subdomains.md) and [#26 findings](https://github.com/HayGrouve/onova-za/blob/research/production-checklist/docs/research/akaunt/production-checklist.md).

Stripe: Create a Checkout Session (`expires_at` defaults to 24 h; `success_url`, `cancel_url`): https://docs.stripe.com/api/checkout/sessions/create

Google: Change of Address tool (301, both properties, 180 days): https://support.google.com/webmasters/answer/9370220; Redirects and Google Search (308 and 301 both permanent): https://developers.google.com/search/docs/crawling-indexing/301-redirects

Service workers and installed PWAs: [#16 findings](https://github.com/HayGrouve/onova-za/blob/research/dial-in-data-move/docs/research/akaunt/dial-in-data-move.md) (update fetch refuses redirects, cached navigations).
