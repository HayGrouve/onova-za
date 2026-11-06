# What each project stores and who processes it

Research for [#36](https://github.com/HayGrouve/onova-za/issues/36) on the [Акаунт map (#12)](https://github.com/HayGrouve/onova-za/issues/12). Feeds [Legal pages for the Акаунт (#31)](https://github.com/HayGrouve/onova-za/issues/31): the hub's processors list and each project's "what this project stores" section. Architecture: [ADR 0001](https://github.com/HayGrouve/onova-za/blob/main/docs/adr/0001-one-akaunt-on-onovaza-subdomains.md). Builds on [#13](https://github.com/HayGrouve/onova-za/issues/13) (Clerk cookies on the apex), [#17](https://github.com/HayGrouve/onova-za/issues/17) (what Кафето keeps), [#20](https://github.com/HayGrouve/onova-za/issues/20) (the two delete actions), [#23](https://github.com/HayGrouve/onova-za/issues/23) (`__client_uat` on the hub), [#26](https://github.com/HayGrouve/onova-za/issues/26) (legal URLs gate Google brand verification), [#28](https://github.com/HayGrouve/onova-za/issues/28) (Stripe) and [#29](https://github.com/HayGrouve/onova-za/issues/29) (which first listed the ImprovMX and Resend records).

Written 2026-11-06. Everything was read-only: the local clones of the hub (`ed501fa`), Сметката (`f0e5c0a`), Клиентите (`7a1ccd8`), Chef (`c3b87fa`) and Dial In (`9464567`); `vercel api` GET calls (project settings, env var **names** only, DNS records); `curl` of the live pages, headers and JS bundles; DNS over HTTPS (`dns.google`, no `dig` on this machine); `npx convex data <table> --prod | wc -l` for row counts only; vendor docs. No user data, ids, emails or secret values are in this file.

Markers: **[verified]** = checked against code or the live system. **[docs]** = stated in a primary source in [Sources](#sources). **[inference]** = my reading. **[unverified]** = not checked.

## Answer in short

- **Only Сметката has real legal pages** (`/privacy`, `/terms`, Bulgarian, formal "вие", the owner named as controller, `privacy@` and `support@onova-za-smetkata.com`, updated October 2026). Chef has English placeholders ("This is a placeholder page"). Клиентите, Dial In and the hub have none **[verified]**. Сметката's privacy page is the best starting text for the hub, rewritten in "ти".
- **The processors behind the Акаунт and the four projects** are few: **Clerk**, **Convex**, **Vercel**, **Google** (Sign in with Google, and the Gemini API in Сметката and Кухнята), **Stripe** (Сметката only, not live), the **browser push services** (Клиентите only) and **ImprovMX** (mail forwarding for the contact addresses). **Sentry** is wired into Сметката's code and named in its policy, but no DSN is set on Vercel, so it sends nothing **[verified]**. **Resend** is used by nothing: its DNS records on onova-za-smetkata.com are left over from the old magic-link sign-in, removed from code and policy on 2026-08-11 **[verified]**.
- **Mail today:** `support@` and `privacy@onova-za-smetkata.com` go to **ImprovMX** (MX `mx1`/`mx2.improvmx.com`, SPF `include:spf.improvmx.com`, records added 2026-10-08), which forwards to a mailbox that can't be read from DNS **[verified MX; destination unverified]**. **onovaza.com has no MX at all**, so no address on it receives mail yet **[verified]**. The hub's policy needs one (for example `privacy@onovaza.com`) before it goes live: same ImprovMX setup, owner step.
- **Where data sits:** Clerk in the US; Convex for Сметката and Chef in the US (deployment URLs carry no region), Клиентите in the EU (`eu-west-1`); Vercel functions in `fra1` (Сметката), `dub1` (Клиентите), `iad1` (Chef, hub) **[verified]**. Dial In stores nothing off the device.
- **Cookies:** only Clerk's (strictly necessary), in the three Clerk projects. No project sets its own cookie; Vercel Web Analytics is cookieless and only Сметката loads it **[verified, docs]**. The hub sets nothing today. No consent banner is needed for any of it **[inference]**.
- **Two things #31 must decide that this inventory surfaces:** (1) in **Клиентите** a business types in *its own customers'* names, phones, addresses and notes, so for that data the business is the controller and онова за is its **processor**: the terms need a short Art. 28 processing clause, not just a privacy policy; (2) the **Gemini API must be on a paid (billing-enabled) project** for Сметката and Кухнята, because Google allows only Paid Services for apps offered in the EEA, and only then does Google act as a processor under its DPA **[docs]**.

## 1. Per project inventory

Counts are production row counts on 2026-11-06, to show how much real data exists, not who **[verified]**.

### 1.1 Hub (`onovaza.com`, this repo)

| | Today | After the Акаунт |
| --- | --- | --- |
| Stores | Nothing. Static Next.js, no database, no env vars on Vercel, no `localStorage`, no cookie in the response **[verified]** | Still no database (ADR 0001). The Акаунт itself is Clerk's data (section 2.1) |
| Calls | Vercel hosting only. Fonts via `next/font` (self-hosted at build) **[verified]** | Clerk on `/vhod` and `/akaunt` only (#23) |
| Analytics | None in code. Web Analytics and Speed Insights have ids on the project but were never enabled (`enabledAt` absent) **[verified]** | Same |
| Cookies | None | Clerk's, set by `/vhod`; the nav reads `__client_uat` (#23) |
| Legal pages | None. Footer and `/za-men` show the owner's personal Gmail (`src/lib/site.ts`) | `/poveritelnost` and `/usloviya` or similar, per #31 |

### 1.2 Сметката (`onova-za-smetkata.com`, HayGrouve/onova-za-smetkata)

Convex schema `convex/schema.ts`. Production: 2 users, 1 bill, 2 participants, 1 payment setting, 1 friend group, 0 guest sessions, 0 receipt scans.

| Who | Data categories (tables) |
| --- | --- |
| Host (has an Акаунт) | Name, email, profile image, Clerk subject (`users`); Stripe customer and subscription ids, plan and status (`users`, billing not live, #28); Revolut username and IBAN (`paymentSettings`); friend group names and members' first names (`friendGroups`); onboarding progress (`hostOnboarding`) |
| A bill | Restaurant name, date, note, items and prices, tip, receipt photo (`bills`, `items`, `_storage`); share token |
| Guests (no Акаунт) | The seat name the host types (`participants`); who took what (`itemAssignments`); payments marked and payment requests (`payments`, `combinedPaymentRequests`); a random session token and last-seen time (`guestSessions`, `guestSessionPresence`) |
| Receipt reading | Gemini's extracted lines and totals (`receiptScans` kept up to 30 days, `quickScans` deleted after reading); the photo is sent to Gemini |
| Abuse limits | `rateLimitBuckets` keyed by user, session token or bill id, never IP **[verified, `convex/files.ts`, `guestSessions.ts`, `receiptScan.ts`]** |

| Processor | How it's called | Status |
| --- | --- | --- |
| Clerk | `@clerk/tanstack-react-start`; production instance on `clerk.onova-za-smetkata.com`; `user.deleted` webhook at `/clerk/webhook` on Convex | Live (2 test users, retired at the move per #12) |
| Convex | Database, files, functions, crons; US region | Live |
| Vercel | Hosting, functions `fra1` (`vercel.json`); **Web Analytics enabled 2026-07-17** (has data); Speed Insights enabled 2026-07-17, **disabled 2026-09-16**; both components still in `src/routes/__root.tsx` with `beforeSend` scrubbing the share token | Live |
| Google Gemini | `generativelanguage.googleapis.com` from Convex (`convex/lib/geminiReceipt.ts`), env `GEMINI_API_KEY`, `GEMINI_MODEL` | Live |
| Stripe (Managed Payments, Link as seller of record, ADR 0004) | `stripe` SDK in Convex, webhook `/stripe/webhook`; `BILLING_ENABLED` switch | Not live (#28) |
| Sentry | `@sentry/react`, loaded only if `VITE_SENTRY_DSN` is set at build; CSP allows `*.ingest.sentry.io` | **Dormant**: no `VITE_SENTRY_DSN` on Vercel, no Sentry ingest host in the live bundle **[verified]** |
| Resend | None in code since the Clerk migration (`5207243`, 2026-08-11, "Remove Resend from docs and privacy policy") | Unused |

Browser storage **[verified]**: `localStorage` `onova-theme`, `quick-bill` (the whole quick bill, on the phone only), `onova-guest-participant` (guest seat and session token), `tip-preference`, `last-used-friend-group-id`, `bill-advanced-settings-open`, `onova-dock-collapsed`, `pwa-banner-dismissed`, legacy `onova-payment-settings` (read once and removed); `sessionStorage` `onova-guest-device`, `host-onboarding:*`; service worker `public/sw.js` caches static files only. Cookies: Clerk's only.

Legal pages **[verified]**: [`/privacy`](https://onova-za-smetkata.com/privacy) (`src/routes/privacy.tsx`) and [`/terms`](https://onova-za-smetkata.com/terms) (`src/routes/terms.tsx`), contacts in `src/lib/contact.ts` (`PROVIDER_NAME`, `SUPPORT_EMAIL`, `PRIVACY_EMAIL`, with a note to add the address and registration once the freelancer registration is done). The privacy page gives: controller by name; data categories as above; guests and the share link; quick bill; bases (contract Art. 6(1)(b), legitimate interest Art. 6(1)(f)); processors Clerk, Google (sign-in and Gemini), Convex, Vercel, Sentry, Stripe/Link; US transfers on DPF or SCCs; retention per category; cookies (Clerk only); rights, 30-day reply, КЗЛД (cpdp.bg); age 16. Terms: provider, service, all free today, accounts (16+), guests and link, payments between people are outside the app, accuracy, acceptable use, availability, liability, Bulgarian law, КЗП. What goes stale at the move: the two contact addresses and domain, "изтриването на акаунта от „Акаунт“" (now two actions, #20), Sentry (dormant), and the formal "вие".

### 1.3 Клиентите (`onova-za-klientite.vercel.app`, HayGrouve/onova-za-klientite)

Convex schema `convex/schema.ts` (467 lines). Production: 1 user, 1 business, 1 membership, 3 clients, 0 files, 0 push subscriptions (the owner testing). Production still runs on the **Clerk development instance** (AGENTS.md, D50; live CSP names a `*.clerk.accounts.dev` host) and on a Convex deployment in `eu-west-1` **[verified]**.

| Whose data | Categories (tables) |
| --- | --- |
| The account holder and team members | Name, email, image, Clerk ids (`users`); role, notification choices (`memberships`); push endpoint, keys and user agent (`pushSubscriptions`) |
| The business | Name, logo, phone, email, address, settings (`businesses`) |
| **The business's own customers** (third parties) | Person or company name, phones, email, address, note, preferred channel, consent records for service and marketing with timestamps (`clients`, `clientPhones`); their items, jobs with addresses and notes, appointments, reminders, payments, allocations, costs (`items`, `jobs`, `appointments`, `reminders`, `payments`, `allocations`, `costs`); custom fields; photos and files (`files`, `_storage`); a log of messages with recipient and channel (`messages`); share links (`shareLinks`, token stored hashed); an activity log (`activity`) |

| Processor | How | Notes |
| --- | --- | --- |
| Clerk | `@clerk/tanstack-react-start`; `convex/account.ts` also calls `DELETE api.clerk.com/v1/users/{id}` on account deletion | Deleting the Clerk user conflicts with #20 ("no project deletes the Clerk user") |
| Convex | EU (Ireland), ADR 0002; `@convex-dev/workpool`, `@convex-dev/rate-limiter` components | Region verified in the live bundle |
| Vercel | Hosting, functions `dub1` (`vercel.json`); no analytics package | |
| Push services (Google FCM, Apple, Mozilla) | `web-push` from a Convex Node action (ADR 0011); payload (title, body, link) encrypted by the Web Push protocol | Only endpoint and timing visible to them **[docs, inference]** |
| None else | Viber, phone and Google Maps are outgoing links the user taps (`shared/phone-format.ts`, `shared/maps.ts`); import (`papaparse`, `read-excel-file`) and the summary image (`satori`) run in the browser | **[verified]** |

Browser storage **[verified]**: **IndexedDB** (`idb-keyval`, `src/lib/offline-store.ts`) holds a read-only offline snapshot of today's and open jobs and client contacts per user, cleared when another user signs in and on sign-out (ADR 0010); `localStorage` `onova.theme`, `push-off`, `more-open:*`, `settings-preview-open`, timing prefs; `sessionStorage` `setup-draft:*`, `import-outcome`, `onova.startingUp.reloadedAt`; a service worker for push. Cookies: Clerk's (dev instance today, so also the dev-browser token and `clerk-telemetry.com` calls, both gone on a production instance **[docs]**).

Legal pages: **none** (no route in `src/routes`). Docs only note "Clerk's data processing terms need checking before public launch" (ADR 0003). Data export (zip of JSON and CSV), client anonymize and account delete already exist (implementation plan section 9).

### 1.4 Кухнята (today Chef, `armyant.app`, HayGrouve/chef)

Convex schema `convex/schema.ts`. Production: 11 user rows, 15 recipes; 14 Clerk users on a **development** instance (map facts). At cutover everything but the 14 recipes is wiped ([#22](https://github.com/HayGrouve/onova-za/issues/22)).

| Categories | Tables |
| --- | --- |
| Profile: name, email, bio, avatar URL, Clerk token identifier and subject. Name, bio and avatar are **public**; email is never exposed (`convex/users.ts`) | `users` |
| Recipes: title, description, ingredients, steps, image, tags, times, author name, public flag | `recipes`, `_storage` |
| Favourites, shopping list, meal plan | `favorites`, `shoppingList`, `mealPlans` |
| AI rate limits per user | `rateLimits` |

Processors: **Clerk** (`@clerk/nextjs`, dev instance, with passwords and Apple today); **Convex** (US); **Vercel** (`iad1`, no analytics); **Google Gemini** from Convex (`convex/gemini.ts`, env `GEMINI_API_KEY`) for recipe import from a URL, pasted text or a **photo**, meal plan generation, shopping list sorting and ingredient tagging (`convex/importRecipe.ts`, `convex/ai.ts`). URL import fetches the page from Convex (`convex/safeFetch.ts`), so the recipe site sees Convex, not the user. Browser storage: `localStorage` `theme` (next-themes default), `hasSeenInstallPrompt`, `signUpBannerDismissed`, `shoppingListGroupBy`. Cookies: Clerk's. No account deletion and no `user.deleted` handler today. Legal pages: [`/privacy`](https://armyant.app/privacy) and [`/terms`](https://armyant.app/terms), English placeholders naming "CHEF", no controller, no contact **[verified]**.

### 1.5 Кафето (today Dial In, `dial-in-three.vercel.app`, HayGrouve/dial-in)

| | Today | After the Акаунт (#17) |
| --- | --- | --- |
| Stores | Only on the device: **IndexedDB** `dial-in` (Dexie) with `coffees` (name, roaster, origin, notes, rating, **bag photo**) and `brews` (method, grinder, dose, times, taste, notes); `localStorage` `dial-in-theme`, `dial-in-grinder`, `dial-in-gemini-key` (the user's own key), `dial-in-opus-dial`, `dial-in-opus-inner`; Workbox caches for the app shell and fonts | Bags, brews, photos and equipment in Кафето's own Convex; key and appearance stay in `localStorage` |
| Calls | Vercel hosting; the **browser** calls Gemini directly with the user's own pasted key (`src/lib/scan.ts`, header `x-goog-api-key`) for label reading | Clerk, Convex, Vercel; label reading unchanged |
| Cookies | None | Clerk's |
| Legal pages | None | Hub sections |

Because the key is the user's own, Google is not онова за's processor for label reading: the user deals with Google under Google's terms, and the page should say so in one line **[inference]**.

## 2. The shared processors list for the hub's policy

### 2.1 What the Акаунт itself holds (Clerk)

Email, name and picture (from Google or entered), the Google link, sessions with device, browser and IP, sign-in timestamps; Clerk sends the sign-in code emails (English, #30). Clerk's DPA is part of its terms, Clerk is self-certified under the EU-US DPF with SCCs as fallback, sub-processors listed at clerk.com/legal/subprocessors **[docs]**. Bot protection at sign-up loads Cloudflare Turnstile (`challenges.cloudflare.com` in every CSP) **[verified CSP]**.

### 2.2 The list

| Processor | Used by | What for | Where |
| --- | --- | --- | --- |
| Clerk | Акаунт (all) | Sign-in, sessions, sign-in emails | US |
| Google (Sign in with Google) | Акаунт (all) | Optional sign-in; Google is the identity provider for its own account **[inference]** | Global |
| Convex | Сметката, Клиентите, Кухнята, Кафето | Database, files, server functions | US (Сметката, Кухнята), EU Ireland (Клиентите), Кафето to choose |
| Vercel | All five | Hosting; cookieless visit statistics in Сметката only | Functions in Frankfurt, Dublin or US East by project; edge global |
| Google Gemini API | Сметката (receipt photos), Кухнята (recipes, photos, meal plans, shopping lists) | Reading and generating text | Google, "may be stored transiently or cached in any country" for Paid Services **[docs]** |
| Stripe (Link as seller of record) | Сметката, only if a paid plan launches | Payment | Stripe |
| Push services of Google, Apple, Mozilla | Клиентите | Delivering notifications (encrypted) | Their own |
| ImprovMX | Contact addresses | Forwarding mail to `support@`/`privacy@` | ImprovMX **[unverified location]** |
| Sentry | None today | Drop from the policy, or set the DSN and keep it | |

Suggested short form for the hub page (informal "ти", no dashes):

> **Кой ни помага.** Акаунтът е при Clerk (вход и имейлите с кода). Данните на всеки проект са в неговата база в Convex. Сайтовете се хостват от Vercel. Ако влезеш с Google, Google потвърждава кой си. Сметката и Кухнята пращат снимки и текст към Gemini на Google, за да ги разчетат. Клиентите праща известия през услугата за известия на браузъра ти. Някои от тях са в САЩ; там данните минават по Рамката за защита на данните между ЕС и САЩ или по стандартни договорни клаузи.

### 2.3 Per project "what this project stores" blocks

Each block is short, in "ти", and lives on the hub page under the project's name (one set of legal pages, ADR 0001) **[inference]**. Keep each one in the hub repo next to the project's data in `src/content/projects/<slug>/` so adding a project adds its block. Content per block, from section 1: data categories, special processors, browser storage, retention, the Изтрий данните action (#20), and for Сметката the guests and share link, for Клиентите the processor role (section 3), for Кафето the user's own Gemini key.

## 3. Things the legal text has to handle

- **Клиентите as processor [inference, not legal advice].** For the business's customers' data (section 1.3) the business decides why and what, so it is the controller and онова за processes on its behalf. GDPR Art. 28(3) requires a contract with fixed contents (instructions, confidentiality, security, sub-processors, help with rights, deletion or return at the end, audits). The usual small-SaaS form is a "Обработване на данни от твое име" section in the terms, plus the sub-processor list above. The `consent` fields and the anonymize and export features already support the business's own duties.
- **Gemini paid tier [docs].** "You may use only Paid Services when making API Clients available to users in the European Economic Area, Switzerland, or the United Kingdom." Under Paid Services, prompts are not used to improve Google's products, are logged for a limited time for abuse detection, and are processed under Google's Data Processing Addendum. Whether the Сметката and Chef keys sit on billing-enabled projects is unverified (no key access).
- **Cookies [inference].** All cookies are Clerk's session cookies: `__client` (HttpOnly, on `clerk.onovaza.com`), `__session` (60-second token, on each app host) and `__client_uat` (sign-in timestamp, which the hub nav reads, #23) **[docs, #13]**. They are strictly necessary for a service the user asked for, so the ePrivacy consent exemption applies; theme and UI keys in `localStorage` are user-requested preferences. Vercel Web Analytics uses no cookies and identifies visits by a hash discarded after 24 hours **[docs]**. So: one plain "Бисквитки и памет в браузъра" section, no banner.
- **Age.** Сметката says 16+. The Акаунт should state one age for all projects.
- **Controller and contact.** Сметката names the owner as a natural person with no address, pending the freelancer registration (`src/lib/contact.ts`). Art. 13 needs the controller's identity and contact details; an email is enough for contact, the address is added once registered **[inference]**.

## 4. The mail behind the contact addresses

| Name on onova-za-smetkata.com | Records (Vercel DNS, added) | Serves |
| --- | --- | --- |
| apex | MX `mx1.improvmx.com` (10), `mx2.improvmx.com` (20); TXT `v=spf1 include:spf.improvmx.com ~all` (2026-10-08) | **Inbound** mail to any `@onova-za-smetkata.com` address, forwarded by ImprovMX **[verified DNS]** |
| `_dmarc` | TXT `v=DMARC1; p=none` (2026-10-08) | Monitoring only, no `rua` |
| `send` | MX `feedback-smtp.eu-west-1.amazonses.com`; TXT `v=spf1 include:amazonses.com ~all` (2026-07-08) | **Resend's** bounce and return-path domain (Resend sends through Amazon SES, `eu-west-1` here) **[inference from the record values]** |
| `resend._domainkey` | TXT DKIM key (2026-07-08) | **Resend's** DKIM signing |
| `clkmail`, `clk._domainkey`, `clk2._domainkey`, `clerk`, `accounts` | CNAMEs to `*.clerk.services` (2026-08-11) | The old Clerk production instance's sending and FAPI; retired at #26 7.1 |

- **Resend serves nothing.** It was the magic-link sender of `@convex-dev/auth` when the domain was bought (2026-07-08); Clerk replaced it and commit `5207243` (2026-08-11) removed it from docs and the privacy page. No repo of the five references Resend in code **[verified]**. Its records don't affect receiving mail. They can stay until the domain lapses or be removed with the old Clerk CNAMEs; whether the domain is still verified in a Resend account is unverified.
- **Where `support@`/`privacy@` land** is set in the ImprovMX dashboard (an alias or a catch-all forwarding to some mailbox), not visible in DNS **[unverified]**.
- **onovaza.com** has only Vercel's ALIAS and CAA records: no MX, no SPF, no DMARC yet (DMARC is #26 step 0.3) **[verified]**. For a contact address on the hub domain:

| # | Step | Who |
| --- | --- | --- |
| 1 | Add onovaza.com in ImprovMX (same account), create `privacy@` (and `support@` if wanted) forwarding to the owner's mailbox | Owner |
| 2 | `vercel dns add onovaza.com @ MX mx1.improvmx.com 10`, same for `mx2.improvmx.com 20`, and `vercel dns add onovaza.com @ TXT 'v=spf1 include:spf.improvmx.com ~all'`. No clash with Clerk: Clerk sends from `clkmail.onovaza.com` with its own records **[inference from the current zone]** | Agent, owner confirms (DNS write) |
| 3 | Send a test mail to each address, check it arrives | Owner |
| 4 | Use the onovaza.com address in the hub pages, in Google Branding (#26 2.2 "user support email") and in Stripe's portal links (#28) | Agent |

Keep the onova-za-smetkata.com MX until that domain lapses, so old links in Сметката's past pages and emails still reach someone **[inference]**.

## Open / unverified

- ImprovMX: which mailbox `support@`/`privacy@` forward to, whether aliases or a catch-all, and ImprovMX's data location and terms.
- Whether the Gemini keys of Сметката and Chef are on billing-enabled (Paid Services) projects.
- Convex's and Vercel's transfer mechanism (DPF or SCCs) and DPA form: their DPA pages did not render for reading here. Clerk's was read (DPF plus SCCs, DPA incorporated).
- Whether the Resend domain is still verified in a Resend account.
- Whether Speed Insights still collects anything for Сметката (disabled on the project, component still in code; data was received 2026-09-19, after the disable date).
- Clerk's suffixed cookie variants (`__session_<suffix>`, `__client_uat_<suffix>`) on newer SDKs: not checked on a live production instance; list cookie names by prefix in the policy to be safe.
- Кафето's Convex region: not chosen yet (EU would match Клиентите).

## Questions for the owner

1. Which mailbox do the ImprovMX addresses forward to, and do you want `privacy@onovaza.com` (and `support@`) set up the same way?
2. Are the Gemini API keys for Сметката and Chef on a Google Cloud project with billing on?
3. Keep Sentry in Сметката (set the DSN and list it) or remove the code and drop it from the policy?
4. One age limit for the Акаунт: 16 as in Сметката?
5. Should Кафето's new Convex deployment be in the EU like Клиентите?

## Sources

- Code: hub `src/lib/site.ts`, `src/app/layout.tsx`; Сметката `convex/schema.ts`, `convex/http.ts`, `convex/lib/geminiReceipt.ts`, `src/routes/privacy.tsx`, `src/routes/terms.tsx`, `src/lib/contact.ts`, `src/routes/__root.tsx`, `src/components/sentry-init.tsx`, `src/lib/*-storage.ts`, `src/lib/guest-flow-session/local-seat-store.ts`, `public/sw.js`, `vercel.json`, `docs/adr/0002-clerk-auth-billing.md`, `docs/adr/0004-stripe-managed-payments.md`, commit `5207243`; Клиентите `convex/schema.ts`, `convex/convex.config.ts`, `convex/account.ts`, `convex/pushNode.ts`, `src/lib/offline-store.ts`, `docs/adr/0002-convex-in-the-eu.md`, `docs/adr/0003-clerk-sign-in.md`, `docs/adr/0011-web-push-from-convex.md`, `docs/implementation-plan.md`, `vercel.json`; Chef `convex/schema.ts`, `convex/users.ts`, `convex/gemini.ts`, `convex/ai.ts`, `convex/importRecipe.ts`, `app/privacy/page.tsx`, `app/terms/page.tsx`, `app/layout.tsx`; Dial In `src/lib/db.ts`, `src/lib/prefs.ts`, `src/lib/scan.ts`, `vite.config.ts`.
- Live: `vercel api /v9/projects/<p>` (analytics, regions), `/v9/projects/<p>/env` (names), `/v4/domains/<d>/records`; `https://dns.google/resolve`; response headers and JS bundles of the three live Clerk apps.
- Clerk, How Clerk works (cookies): https://clerk.com/docs/guides/how-clerk-works/overview
- Clerk DPA: https://clerk.com/legal/dpa
- Gemini API Additional Terms (Paid vs Unpaid Services, EEA rule, DPA): https://ai.google.dev/gemini-api/terms
- Vercel Web Analytics privacy: https://vercel.com/docs/analytics/privacy-policy
- Convex DPA and subprocessors: https://www.convex.dev/legal/dpa
- Resend domains (verification required to send; subdomain recommended): https://resend.com/docs/dashboard/domains/introduction
- GDPR Art. 13 and Art. 28: https://eur-lex.europa.eu/eli/reg/2016/679/oj
