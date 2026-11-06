# What the Акаунт's privacy policy and terms must contain

Research for [#37](https://github.com/HayGrouve/onova-za/issues/37) on the [Акаунт map (#12)](https://github.com/HayGrouve/onova-za/issues/12). It feeds [Legal pages for the Акаунт (#31)](https://github.com/HayGrouve/onova-za/issues/31). Architecture: [ADR 0001](https://github.com/HayGrouve/onova-za/blob/main/docs/adr/0001-one-akaunt-on-onovaza-subdomains.md) (one Clerk app on onovaza.com, one set of legal pages on the hub, each project keeps its own Convex, data and payments). Builds on [#18](https://github.com/HayGrouve/onova-za/issues/18) and [#19](https://github.com/HayGrouve/onova-za/issues/19) (`/vhod` on Clerk hooks with the consent line), [#20](https://github.com/HayGrouve/onova-za/issues/20) (Изтрий данните and Изтрий Акаунта), [#26](https://github.com/HayGrouve/onova-za/issues/26) (Google Cloud steps 2.2 to 2.6 use `<PRIVACY_URL>` and `<TERMS_URL>`), [#28](https://github.com/HayGrouve/onova-za/issues/28) (Сметката's Stripe on Managed Payments), [#29](https://github.com/HayGrouve/onova-za/issues/29) (contact address on onovaza.com) and [#30](https://github.com/HayGrouve/onova-za/issues/30) (Account Portal off; the Clerk legal consent question handed here).

Written 2026-11-06. Read-only: legal texts (EUR-Lex, lex.bg and a mirror of the official Bulgarian texts), the КЗЛД site, Google's OAuth verification pages and Gemini API terms, Clerk docs and Backend API spec, the DPAs and privacy policies of Clerk, Convex, Vercel, Stripe and Google, `vercel api /v2/teams` (plan name only), and the local clones of the hub, Сметката, Клиентите, Chef and Dial In. Nothing was written to any service. No personal data or secrets here: the owner is referred to as "the owner" even where the name is already public on Сметката's pages.

**Not legal advice.** Points marked **[lawyer]** are where a Bulgarian lawyer's read changes the outcome.

Markers: **[verified]** = checked against code or a live system. **[docs]** = stated in a primary source in [Sources](#sources). **[inference]** = my reading of the facts. **[unverified]** = not checked.

## Answer in short

- **One controller.** The owner, as a natural person, is the controller for the Акаунт and for every project's own data (same person, same purposes per project). The privacy policy must name the owner and give contact details (GDPR Art. 13(1)(a)) **[docs]**. The heavier identity list comes from the Bulgarian e-commerce law, not GDPR: ЗЕТ чл. 4 asks an information society service provider for name, **permanent address**, activity address, **phone and email**, any register entry (for a registered freelancer, likely the БУЛСТАТ number) and VAT status **[docs]**. Whether a free hub alone triggers ЗЕТ is arguable ("обикновено са възмездни", чл. 1, ал. 3), but Сметката's paid plan makes the family of services count **[inference, lawyer]**. Put this identity block once, on the hub, and link it from every project.
- **Privacy policy: 15 required items** (section 2), all from GDPR Art. 13, plus Art. 14 for data that comes from somewhere else (Google profile, names a host types in Сметката, client records in Клиентите) and the cookie rule in ЗЕТ чл. 4а. Supervisory authority: Комисия за защита на личните данни, София 1592, бул. „Проф. Цветан Лазаров“ № 2, cpdp.bg **[verified on cpdp.bg]**. No consent-based processing is needed for the Акаунт, so no withdrawal-of-consent clause and no ЗЗЛД чл. 25в child-consent rule unless a project adds consent later **[inference]**.
- **Transfers.** Clerk, Vercel, Stripe and Google rely on the EU-US Data Privacy Framework with SCCs as a fallback in their own terms; **Convex relies on SCCs only** (its DPA names Module Two, no DPF claim) **[docs]**. The DPF stands, but its appeal is pending at the Court of Justice (C-703/25 P) **[docs, secondary for the case status]**, so the policy should name both mechanisms per processor.
- **Two gaps found.** (1) The owner's Vercel team is on **Hobby** **[verified]**. Vercel's DPA "applies ... for Customers who are on Enterprise and Pro plans" **[docs]**, so there is no Art. 28 processor contract with Vercel today, and Hobby is "restricted to non-commercial personal use only" **[docs]**, which Сметката's paid plan breaks. (2) Gemini: "You must be 18 years of age or older" and API clients must not be "likely to be accessed by individuals under the age of 18", and EEA users may be served only on **Paid Services** (a billed Cloud project) **[docs]**. Сметката's terms say 16.
- **Google brand verification** checks only: a public home page on a verified domain that describes the app (not just a login page) and links the privacy policy; the privacy policy on the same domain, the same URL as on the consent screen, disclosing how the app "accesses, uses, stores, or shares Google user data"; authorized domains verified in Search Console. Terms are optional **[docs]**.
- **Processors.** Clerk, Convex, Vercel (once on Pro) and Google (owner's Gemini key) are processors. Stripe acts partly as independent controller, and under Managed Payments **Link is the merchant of record** **[docs]**. With a key the user pastes (Кафето), the photo goes from the browser to Google under the user's own Google terms; онова за neither receives it nor instructs Google, so Google is not our processor there **[verified in code, inference]**.
- **Clerk's legal consent setting** with our hooks-based `/vhod`: no Clerk checkbox appears (that is only in `<SignUp />` and the Account Portal); our code must pass `legalAccepted: true` on every sign-up path or the sign-up stops at `missing_requirements` with `legal_accepted`. It stores one `legal_accepted_at` timestamp, no document version, no re-acceptance **[docs]**. No plan gate in docs, changelog or pricing **[unverified on production]**. Because our flow would pass `true` the moment the user presses continue, `legal_accepted_at` equals the sign-up time Clerk already keeps. **Recommendation: leave it off at launch** and rely on the consent line plus dated, versioned pages **[inference]**; owner decision for #31.
- **Paid subscription rules** (ЗЗП чл. 47 pre-contract info, чл. 52а withdrawal function in force since 24.09.2026, чл. 57 waiver, чл. 181н ADR info) belong to **Сметката's** own terms and checkout, not the hub **[docs, inference]**. Клиентите additionally needs **processor terms (Art. 28)**, since each business is the controller of its clients' data (its own product design says so) **[verified]**.

## 1. Who the controller is and what identity to show

| Source | Applies to | What it asks for a natural person | Status |
| --- | --- | --- | --- |
| GDPR Art. 13(1)(a) | Every page that collects data (hub and projects) | "the identity and the contact details of the controller" | **[docs]** Name plus an email on onovaza.com is the minimum; GDPR names no postal address |
| GDPR Art. 13(1)(b), Art. 37 | | DPO contact "where applicable" | Not required for a one-person operator without large-scale monitoring **[inference]**; say nothing or "няма длъжностно лице" |
| GDPR Art. 27 | | EU representative | Not applicable, the owner is in the EU **[docs]** |
| ЗЕТ чл. 4, ал. 1 | "Доставчикът на услуги на информационното общество" | 1. name; 2. "постоянния си адрес"; 3. activity address if different; 4. "данни за кореспонденция, включително телефон и адрес на електронна поща"; 5. register entry; 6. supervising authority if licensed; 8. VAT registration if any | **[docs]** "безпрепятствен, пряк и постоянен достъп": a page linked from every page. Fine 200 to 1000 лв (чл. 23) |
| ЗЕТ чл. 1, ал. 3 | Scope | services "които обикновено са възмездни" | A free hub alone is arguable; a hub that fronts a paid project likely counts **[inference, lawyer]** |
| ЗЗП чл. 47, ал. 1, т. 2 to 4 | Distance contracts with consumers (Сметката Pro) | trader name, seat and address, phone, email, complaints address | **[docs]** With Managed Payments, Link is the merchant of record; whether the owner is also a "търговец" for the service itself is **[lawyer]** |

What this means:

- **Name**: the owner's full name (already Сметката's `PROVIDER_NAME` in `src/lib/contact.ts`, whose comment says "Add the address and registration once the freelancer registration is done") **[verified]**.
- **Address and phone** are the uncomfortable parts. ЗЕТ says permanent address for a natural person. A freelancer registration may give a registered address to use; whether a correspondence address (or a virtual office) satisfies "постоянния си адрес" is **[lawyer]**. A phone number can be a dedicated one.
- **Register entry**: as a freelancer the owner is likely in регистър БУЛСТАТ, which would be the "друг публичен регистър" of т. 5 **[inference, lawyer]**. If the owner later trades as ЕТ or ЕООД, the name, ЕИК and seat replace the personal data and the controller becomes that entity.
- **Email**: on onovaza.com (for example a privacy address). Today's `support@` and `privacy@` live on onova-za-smetkata.com's mail DNS ([#29](https://github.com/HayGrouve/onova-za/issues/29)), so onovaza.com needs MX first.
- **Where**: one "Кой стои зад онова за" block on the hub, in the terms and the privacy policy, linked from every project footer **[inference]**.

## 2. Privacy policy checklist

Every row is mandatory unless marked. "Сметката today" compares with `~/projects/onova-za-smetkata/src/routes/privacy.tsx` **[verified]** (formal "вие"; the hub's copy uses "ти").

| # | Item | Source | Content for the Акаунт | Сметката today |
| --- | --- | --- | --- | --- |
| 1 | Controller identity and contact | Art. 13(1)(a); ЗЕТ чл. 4 | Section 1 block; email on onovaza.com | Name and email only |
| 2 | Purposes and legal basis for each | Art. 13(1)(c) | Section 3 table | Yes, two bullets |
| 3 | The legitimate interests, where Art. 6(1)(f) is used | Art. 13(1)(d) | Security, abuse prevention, error logs, sign-in notices | Named, but not as "interests" |
| 4 | Recipients or categories | Art. 13(1)(e) | Clerk, Convex, Vercel, Google (sign-in, Gemini), Stripe and Link, Sentry (Сметката) | Yes |
| 5 | Transfers outside the EEA and the mechanism; how to get a copy | Art. 13(1)(f), Art. 44 to 49 | Per processor: DPF and/or SCCs (section 4); "пиши ни за копие" | Generic sentence, no copy offer |
| 6 | Retention period or criteria | Art. 13(2)(a) | Акаунт: until Изтрий Акаунта; project data: until Изтрий данните or Изтрий Акаунта; logs: per provider; Clerk after deletion **[unverified]** | Yes |
| 7 | Rights: access, rectification, erasure, restriction, objection, portability | Art. 13(2)(b), Art. 15 to 21 | List them; how (email, or `/akaunt` and each project's "Данни" export) | Yes |
| 8 | Withdrawal of consent | Art. 13(2)(c) | Only if some processing relies on consent. Not for the Акаунт | n/a |
| 9 | Complaint to a supervisory authority | Art. 13(2)(d), Art. 77 | КЗЛД, address above, cpdp.bg | Yes (site only) |
| 10 | Whether data is required and what happens if not | Art. 13(2)(e) | Email is needed for an Акаунт; without one you use projects that don't need it | Missing |
| 11 | Automated decisions and profiling | Art. 13(2)(f), Art. 22 | "Няма автоматизирани решения." | Says "не ви профилираме" |
| 12 | Categories and source of data not from the person | Art. 14(1)(d), 14(2)(f) | Google profile (name, picture) when signing in with Google; names typed by a host (Сметката); clients entered by a business (Клиентите, as processor) | Partly |
| 13 | Cookies and device storage, with Art. 13 information | ЗЕТ чл. 4а | Clerk's session cookies on onovaza.com and subdomains are strictly necessary; the hub's nav reads `__client_uat` ([#23](https://github.com/HayGrouve/onova-za/issues/23)); local storage per project | Yes |
| 14 | Clear, plain language, easy to reach | Art. 12(1) | Bulgarian, "ти", linked in every footer and on `/vhod` | Yes |
| 15 | Reply time | Art. 12(3) | "до един месец" (extendable by two for complex requests) | Says 30 days |

Also worth stating, not strictly required: age limit (section 8); how changes are announced and the date; that the Акаунт itself holds only sign-in data and each project holds its own (the two delete actions from [#20](https://github.com/HayGrouve/onova-za/issues/20)).

Not in the policy but owed elsewhere: a record of processing (Art. 30; the under-250 exemption does not cover regular processing) **[docs, inference]**; a short legitimate-interest assessment for row 3 **[inference]**; a breach procedure (Art. 33, 72 hours to КЗЛД) **[docs]**. КЗЛД takes no registration since 2018 **[inference]**.

## 3. Legal basis and retention per processing

| Processing | Data | Basis | Retention |
| --- | --- | --- | --- |
| Creating and signing in to the Акаунт (Clerk) | Email, name, picture (from Google or typed), Clerk user id, sessions | Art. 6(1)(b) contract | Until Изтрий Акаунта (`user.deleted` fans out to projects, ADR 0001) |
| Sign-in security: device, IP, user agent, the code emails and new-device notices ([#30](https://github.com/HayGrouve/onova-za/issues/30)) | Technical data | Art. 6(1)(f) | Clerk's own retention **[unverified]** |
| Hosting logs (Vercel) | IP, URL, user agent | Art. 6(1)(f) | Vercel's log retention per plan **[unverified]** |
| Project data (Сметката bills, Кухнята recipes, Кафето log, Клиентите businesses) | Per project | Art. 6(1)(b) | Until Изтрий данните or Изтрий Акаунта |
| Names of other people a host types (Сметката) | First names | Art. 6(1)(f); Art. 14(5)(b) "disproportionate effort" for telling them | With the bill |
| A business's client records (Клиентите) | Names, phones, addresses | The business is controller; онова за is processor (Art. 28) | Per the business's instructions |
| Receipt and recipe reading on the owner's Gemini key (Сметката, Кухнята) | Photos, text | Art. 6(1)(b) | Google Paid Services: logged "for a limited period" for abuse detection **[docs]** |
| Paid plan (Сметката) | Payment and tax data | Link and Stripe as controllers; the owner keeps the subscription mirror under 6(1)(b) | Per Stripe/Link; tax records per Bulgarian law **[unverified]** |

No row needs consent (6(1)(a)), so GDPR Art. 8 and ЗЗЛД чл. 25в (consent of a child under 14 needs the parent) do not bite **[docs, inference]**.

## 4. Processors and transfer mechanisms

| Provider | Role | DPA in force on our plan | Transfer mechanism | Notes |
| --- | --- | --- | --- | --- |
| **Clerk** (Clerk, Inc., US) | Processor for the Акаунт; controller for its own account data | Yes: "incorporated into and forms part of the Agreement", no plan limit found **[docs]** | Self-certified under the DPF; SCCs (Modules 1 to 3) incorporated "to the extent and for as long as Clerk cannot rely on the DPF" **[docs]** | Sub-processors at clerk.com/legal/subprocessors, 15 days' notice **[docs]** |
| **Convex** (Convex, Inc., US) | Processor for each project's data | Yes: the Terms incorporate "the Convex Data Processing Addendum" **[docs]** | SCCs, Module Two; **no DPF claim** in the DPA **[docs]**; DPF listing not checked **[unverified]** | Region per deployment: Клиентите's dev deployment is `eu-west-1`, Сметката's and Chef's dev are US **[verified in `.env.local`]**; production regions **[unverified]**. An EU deployment does not remove the transfer (Convex is a US company), but narrows it **[inference]** |
| **Vercel** (Vercel Inc., US) | Processor for hosting; **controller** for "Service-Generated Data" **[docs]** | **No on Hobby**: the DPA "applies ... for Customers who are on Enterprise and Pro plans" **[docs]**; the team `haygrouves-projects` is `hobby` **[verified]** | DPF certified (privacy policy); SCCs in the DPA **[docs]** | Hobby is "non-commercial personal use only" **[docs]**. Moving to Pro fixes both |
| **Stripe** (Stripe Payments Europe for EEA, Stripe LLC) | Processor for some services; joint or independent controller for "Authorised Services" (payments) **[docs]** | Yes (Stripe DPA) | Stripe LLC DPF certified; SCCs via the Data Transfer Addendum **[docs]** | DPA 4.3: the user "must provide all necessary notices (including by making available a Privacy Policy)" **[docs]** |
| **Link** (Managed Payments) | Merchant of record: "The customer sees Link as the merchant of record" **[docs]** | Not a processor of ours | n/a | Sends receipts and invoices, handles refunds; checkout footer shows its standard terms, ours can be added in Checkout settings **[docs]** |
| **Google, owner's Gemini key** (Сметката receipts, Кухнята recipes) | Processor under Paid Services: prompts processed "in accordance with the Data Processing Addendum for Products Where Google is a Data Processor" **[docs]** | Only if the key's Cloud project has billing: "You may use only Paid Services when making API Clients available to users in the European Economic Area" **[docs]**; billing state **[unverified]** | DPF (Google LLC), else SCCs **[docs]** | Age 18 rule (section 8) |
| **Google, user's own key** (Кафето label reading) | The user is Google's customer; the browser calls `generativelanguage.googleapis.com` with the key from device storage (`dial-in/src/lib/scan.ts`; the key stays on the device per [#17](https://github.com/HayGrouve/onova-za/issues/17)) **[verified]** | n/a | n/a | Not our processor and not our recipient **[inference]**. Say so plainly, and that Google's terms apply to the user's key |
| **Google sign-in** | Independent controller for the Google account; we receive name, email, picture | n/a | n/a | Art. 14 source item |
| **Sentry** (Сметката only, `@sentry/react`) | Processor | **[unverified]** | **[unverified]** | Project section only |

Each processor's own demand on our pages: Stripe (privacy policy covering its processing, DPA 4.3) and Vercel ("Customer has provided ... all notices") **[docs]**. Clerk and Convex DPAs put notices on the customer implicitly through Art. 28 and their data subject request clauses **[docs, inference]**.

## 5. What Google's brand verification checks

From [Submit for brand verification](https://developers.google.com/identity/protocols/oauth2/production-readiness/brand-verification) and [OAuth verification requirements](https://support.google.com/cloud/answer/13464321) **[docs]**:

- **Home page** (`https://onovaza.com`): "publicly accessible, and not just accessible to your site's logged-in users"; must "describe your app's functionality"; "can not be only a login page"; must link the privacy policy, and "this link should match the link you added on your OAuth consent screen configuration".
- **Privacy policy**: "hosted within the same domain as your application's home page"; linked from the home page and from the consent screen, the same URL in both; "must disclose the manner in which your application accesses, uses, stores, or shares Google user data". The [User Data Policy](https://developers.google.com/terms/api-services-user-data-policy) adds: use of Google data "must be limited to the practices explicitly disclosed", and a new use needs users to be prompted "to consent to an updated privacy policy" first.
- **Terms**: optional ("the privacy policy and optional terms of service"). If set, on an authorized domain.
- **Authorized domains**: verified in Search Console by an account that is owner or editor on the Cloud project (#26 step 2.3).
- **Branding**: app name and logo must accurately represent the app; the home page's brand should read "онова за" like the consent screen.

For the privacy policy this means one explicit "Данни от Google" paragraph: which fields (name, email, picture, through Clerk), why (to create and show your Акаунт), where stored (Clerk), shared with whom (no one beyond the processors), and how deleted (Изтрий Акаунта). The hub footer link on the home page must use the exact consent-screen URL (no redirect between them) **[inference]**.

## 6. Terms: what the hub carries and what stays in projects

### Hub terms (the Акаунт)

| Item | Why | Source |
| --- | --- | --- |
| Who provides it (section 1 block) | ЗЕТ чл. 4 | **[docs]** |
| What the Акаунт is: one sign-in for the projects; each project has its own data and may have its own terms or paid plan | ADR 0001 | **[verified]** |
| Who may have one (age, section 8) | Gemini terms; ЗЛС capacity rules | **[docs, lawyer]** |
| Your duties: true email, keep access to it, no abuse | Contract | **[inference]** |
| Ending it: Изтрий Акаунта on `/akaunt`; we may suspend for abuse; notice before shutting a project | #20 | **[verified]** |
| Changes to the terms and how you are told | ЗЗП чл. 143 (unfair terms) | **[docs, lawyer]** |
| Liability, within what Bulgarian law allows | ЗЗП чл. 143; ЗЗД | **[lawyer]** |
| Applicable law, КЗП, courts | ЗЗП | **[docs]** |
| Link to the privacy policy | Art. 12 | **[docs]** |

The free Акаунт is not a "distance contract" under the consumer rights directive as long as data is used only to provide the service (Directive 2011/83 Art. 3(1a), as amended by 2019/2161) **[docs, lawyer]**, so no withdrawal or pre-contract block on the hub.

Two clauses in Сметката's current terms to avoid copying: "Продължаващото използване след промяната означава, че приемате новите условия" and the blanket exclusion for "загуба на данни". Unilateral change and liability clauses are classic unfair-term territory under ЗЗП чл. 143 **[docs for the rule, lawyer for these clauses]**.

### Stays in Сметката (paid subscription)

- Pre-contract information on the plan picker or terms: main features, price with taxes, renewal, cancellation, the trader's identity and contact (ЗЗП чл. 47) **[docs]**. Сметката's `HOST_PRO_DISCLOSURES` already covers price, renewal, cancel and seller **[verified]**.
- **Withdrawal function**: ЗЗП чл. 52а (new, ДВ бр. 87 от 2026, in force 24.09.2026): distance contracts concluded through an online interface need a button labelled "откажете се от договора тук" or similar, available for the whole withdrawal period **[docs]**. With Link as merchant of record, whether Link's order page satisfies this or Сметката must show it is **[lawyer]**.
- The waiver checkbox ("губя правото си на отказ"): ЗЗП чл. 57, т. 1 removes the right only once a service is **fully performed** with the consumer's prior express consent and acknowledgement **[docs]**. A monthly subscription is not fully performed in 14 days, so the current wording may overstate the loss **[inference, lawyer]**.
- ADR information: ЗЗП чл. 181н, the ADR body's website "на интернет страницата на търговеца ... и в общите условия" **[docs]**.
- Link's role (receipts, invoices, refunds) and the Stripe Customer Portal's privacy and terms URLs pointing at the hub ([#28](https://github.com/HayGrouve/onova-za/issues/28)).

### Stays in Клиентите

- Processor terms under GDPR Art. 28(3) between онова за and each business: subject, duration, instructions, confidentiality, security, sub-processors (Clerk, Convex, Vercel), help with data subject requests, deletion at the end, audits **[docs]**. Клиентите's `docs/product-design.md` already lists "Data processing agreement" as a GDPR consequence **[verified]**. This can be a hub section that only Клиентите links, or a page in Клиентите **[inference]**.

### Stays in Кафето

- One paragraph in the privacy section: label photos go from your device straight to Google with your own key, under Google's terms; онова за does not see them; the key stays on your device.

## 7. Clerk's legal consent setting versus our consent line

### What the setting does [docs]

- Dashboard, Legal page, "Require express consent to legal documents"; off by default.
- Prebuilt `<SignUp />` and the Account Portal get a checkbox; OAuth sign-ups through prebuilt UI are prompted on return. Our `/vhod` is our own form on hooks ([#19](https://github.com/HayGrouve/onova-za/issues/19)) and the Portal goes off ([#30](https://github.com/HayGrouve/onova-za/issues/30)), so **no Clerk checkbox ever shows**.
- In a custom flow we "pass the `legalAccepted` boolean to whichever method is initializing the sign-up". `SignUpFuture` accepts it in `create()`, `password()`, `sso()`, `ticket()`, `web3()` and `update()`; `SignInFuture` has no such field.
- If it is missing, the sign-up returns `status: "missing_requirements"` with `"legal_accepted"` in `missingFields`; for Google, "When the user returns with legal acceptance among the missing requirements, collect their consent and update the sign-up attempt", that is `signUp.update({ legalAccepted: true })`.
- Clerk stores `legal_accepted_at` on the User (Backend API: "Unix timestamp at which the user accepted the legal requirements"). It is one timestamp: no document version, no re-acceptance when terms change. Backend `POST /users` takes `legal_accepted_at` or `skip_legal_checks` ("not recommended ... unless you are migrating a user"); `PATCH /users/{id}` can set `legal_accepted_at`.
- Plan: the docs page, the 2024-11-11 changelog and the pricing page name no plan **[docs]**; availability on the free production instance **[unverified]** (dev instances unlock everything, #30).

### What it would mean for `/vhod`

| | Setting on | Our consent line alone |
| --- | --- | --- |
| Email code, new person | `signUp.create({ emailAddress, legalAccepted: true })` | `signUp.create({ emailAddress })` |
| Google, new person | `signUp.create({ transfer: true, legalAccepted: true })`, or `signUp.update({ legalAccepted: true })` on `missing_requirements` after the callback | Transfer as usual |
| Forgetting one path | Sign-up stalls at `missing_requirements` (a hard stop) | No effect |
| Record | `legal_accepted_at`, equal to the moment of sign-up because our code passes `true` when the user presses continue | Clerk's `created_at` plus the dated, versioned terms in the hub's git history |
| Terms change later | No help; re-acceptance is our own job either way (Google's User Data Policy asks for it if Google data use changes) | Same |
| Tests and scripts | Any Backend API user creation needs `skip_legal_checks` or a timestamp | Nothing |
| Copy | Ours either way | Ours |

**Recommendation: leave it off at launch** **[inference]**. With no Clerk UI in our flow, the setting adds a hard stop that only our own code can satisfy, and the timestamp it stores carries no more than the sign-up time. What makes acceptance defensible is that the line sits next to the button and the pages it links are dated and kept. Turn it on later if the owner wants Clerk to enforce that no sign-up path skips the line (for example if a project ever builds its own sign-up), at the cost of two code paths and the test note above.

### The consent line itself

- Privacy notices are information, not something you accept (Art. 13 is an obligation to inform; the Акаунт relies on contract, not consent) **[docs, inference]**. "приемаш ... Поверителността" mixes the two. Suggested: "Като продължиш, приемаш [Условията](#). Как пазим данните ти: [Поверителност](#)." **[lawyer for the wording]**.
- Keep it above or next to the two buttons (email code and Google), visible before either is pressed, so it covers both paths **[inference]**.
- Date both pages ("В сила от ...") and keep old versions reachable (the git history is enough for proof; a "Предишни версии" link is a courtesy) **[inference]**.

## 8. Minimum age

- Gemini API terms: "You must be 18 years of age or older to use the APIs. You also will not use the Services as part of a website, application ... that is directed towards or is likely to be accessed by individuals under the age of 18." **[docs]** This binds the owner for Сметката's and Кухнята's hosted reading. Сметката's terms and privacy page say 16 **[verified]**.
- GDPR Art. 8 and ЗЗЛД чл. 25в (14 in Bulgaria) apply only to consent-based processing **[docs]**; not the Акаунт's case.
- Civil capacity: under 14 cannot contract; 14 to 18 need a parent's consent for contracts (Закон за лицата и семейството чл. 3 and 4) **[inference, not fetched, lawyer]**.
- Simplest consistent rule: **18+ for the Акаунт** across every project. The owner may prefer a lower age for projects without Gemini; then the age lives in each project's terms **[inference]**.

## 9. Where a lawyer's read matters

1. Whether ЗЕТ чл. 4 applies to the free hub, and whether a correspondence or registered freelancer address satisfies "постоянния си адрес".
2. Whether the owner, Link, or both count as "търговец" for Сметката Pro (ЗЗП чл. 47, 52а withdrawal function, 181н ADR, conformity of a digital service).
3. The withdrawal waiver wording for a subscription (ЗЗП чл. 57, т. 1).
4. Unfair-term risk of unilateral changes and liability limits (ЗЗП чл. 143).
5. Clickwrap by "Като продължиш, приемаш" without a checkbox, for a free consumer service.
6. Age: 18 everywhere or per project.
7. Running on Vercel Hobby without a DPA until the move to Pro.

## 10. Steps (owner vs agent)

| Step | Who |
| --- | --- |
| Decide: identity data to publish (address, phone, register number), age limit, Clerk setting on or off, page URLs | Owner, in [#31](https://github.com/HayGrouve/onova-za/issues/31) |
| Move the Vercel team to Pro (DPA plus commercial use) before Сметката's billing goes on | Owner (a cost) |
| Check the Gemini key's Cloud project has billing (Сметката, Кухнята) | Owner, in Google Cloud console |
| MX and a privacy address on onovaza.com ([#29](https://github.com/HayGrouve/onova-za/issues/29)) | Agent adds records, owner confirms |
| Write the hub's privacy policy and terms from sections 2, 3, 6 | Agent drafts, owner and a lawyer review |
| Footer links on every hub page (home page link must equal `<PRIVACY_URL>`) | Agent |
| Fill `<PRIVACY_URL>` and `<TERMS_URL>` in #26 steps 2.2 and 2.6 | Owner |
| Per project: link the hub pages; Сметката keeps its subscription terms and fixes the waiver; Клиентите adds processor terms | Agent, in each project's migration plan |

## Open / unverified

- Clerk legal consent on the free production plan, and whether `legalAccepted: true` is recorded when the setting is off. Both need the production instance (#26 phase 4).
- How long Clerk keeps data after a user is deleted, and its log retention.
- Convex's production deployment regions per project, and whether Convex is on the DPF list (its DPA claims only SCCs).
- Vercel log retention on Hobby and Pro; whether any DPA-like terms cover Hobby at all (none found).
- Whether the owner's Gemini key sits on a billed Cloud project.
- Sentry's DPA and transfer mechanism (Сметката only).
- Status of the DPF appeal C-703/25 P after early 2026 (no ruling found; checked through secondary trackers only).
- The Bulgarian text of Закон за лицата и семейството чл. 3 and 4 (not fetched).
- Whether Link's "Sold through Link" consumer terms include a withdrawal function for EU buyers.
- The EDPB transparency guidelines' wording on contact details (WP260 rev.01) could not be read here (no PDF tool).

## Sources

Law:

- GDPR, Regulation (EU) 2016/679, Art. 6, 8, 12 to 15, 22, 27, 28, 30, 33, 37, 44 to 49, 77: https://eur-lex.europa.eu/eli/reg/2016/679/oj (Bulgarian: https://eur-lex.europa.eu/legal-content/BG/TXT/?uri=CELEX:32016R0679)
- EU-US DPF adequacy decision, Commission Implementing Decision (EU) 2023/1795: https://eur-lex.europa.eu/eli/dec_impl/2023/1795/oj ; appeal C-703/25 P status via https://www.wilmerhale.com/en/insights/blogs/wilmerhale-privacy-and-cybersecurity-law/20251201-european-court-of-justice-to-review-challenge-to-eu-us-data-privacy-framework (secondary)
- Directive 2011/83/EU as amended by 2019/2161 (Art. 3(1a)): https://eur-lex.europa.eu/eli/dir/2011/83/oj
- ЗЗЛД чл. 25в, чл. 85: https://lex.bg/laws/ldoc/2135426048
- ЗЕТ чл. 1, 3, 4, 4а, 23 (text via a mirror of Сиела Норма): https://kik-info.com/normativna-baza/zakoni/0X2135530547/
- ЗЗП чл. 47, 52а, 57, 143, 181н (same mirror): https://kik-info.com/normativna-baza/zakoni/zzp/
- КЗЛД, address and complaint page: https://www.cpdp.bg/ (serves an incomplete TLS chain; read with certificate checks off)

Google:

- Brand verification: https://developers.google.com/identity/protocols/oauth2/production-readiness/brand-verification
- OAuth app verification requirements: https://support.google.com/cloud/answer/13464321 ; help center: https://support.google.com/cloud/answer/13463073
- Google API Services User Data Policy: https://developers.google.com/terms/api-services-user-data-policy
- Gemini API Additional Terms (age 18, Paid Services in the EEA, data use): https://ai.google.dev/gemini-api/terms
- Data Processing Addendum for processor products: https://business.safety.google/processorterms/

Clerk:

- Legal compliance: https://clerk.com/docs/guides/secure/legal-compliance.md
- Custom flow for legal acceptance: https://clerk.com/docs/guides/development/custom-flows/authentication/legal-acceptance.md
- OAuth custom flow, missing requirements: https://clerk.com/docs/guides/development/custom-flows/authentication/oauth-connections.md
- `SignUpFuture` (`legalAccepted`, `legalAcceptedAt`, `missingFields`): https://clerk.com/docs/nextjs/reference/objects/sign-up-future.md ; `SignInFuture`: https://clerk.com/docs/nextjs/reference/objects/sign-in-future.md
- Backend API spec (`legal_accepted_at`, `skip_legal_checks` on `CreateUser`, `UpdateUser`): https://clerk.com/docs/reference/spec/bapi/latest.json
- Changelog 2024-11-11 Legal consent: https://clerk.com/changelog/2024-11-11-legal-consent.md ; pricing: https://clerk.com/pricing
- DPA (last updated 2024-11-26): https://clerk.com/legal/dpa

Other processors:

- Convex DPA: https://www.convex.dev/legal/dpa ; Terms of Service (incorporates the DPA): https://www.convex.dev/legal/tos ; regions: https://docs.convex.dev/production/regions
- Vercel DPA (effective 2026-03-31, Pro and Enterprise only): https://vercel.com/legal/dpa ; privacy policy (DPF): https://vercel.com/legal/privacy-policy ; fair use (Hobby non-commercial): https://vercel.com/docs/limits/fair-use-guidelines
- Stripe DPA: https://stripe.com/legal/dpa ; privacy policy (DPF, SCCs): https://stripe.com/privacy ; Managed Payments: https://docs.stripe.com/payments/managed-payments and https://docs.stripe.com/payments/managed-payments/how-it-works

Code (local clones, `main`): Сметката `src/routes/privacy.tsx`, `src/routes/terms.tsx`, `src/lib/contact.ts`, `shared/host-pro-plans.ts`, `convex/lib/readReceiptPhoto.ts`, `docs/adr/0004-stripe-managed-payments.md`; Клиентите `docs/product-design.md`, `convex/gdpr.test.ts`; Chef `convex/gemini.ts`; Dial In `src/lib/scan.ts`, `README.md`; hub `package.json` and the `prototype/akaunt-pages` branch (`src/components/prototype/vhod-variants.tsx`, the consent line). Live: `vercel api /v2/teams` (plan only).
