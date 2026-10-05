# 02 SEO research: "онова за" hub (Bulgarian-first, Next.js 16)

Researched 2026-10-05. Evidence tags: **[F]** fetched and verified, **[S]** search-snippet only (page blocked by Cloudflare/403 from my environment), **[A]** Google bg/bg autocomplete (a demand proxy, not volume), **[J]** my judgement. I have no keyword-volume tool, so every "demand" statement is directional. Treat Search Console data after 4 to 8 weeks as the real source.

## 0. Decisions at a glance

| Topic | Decision |
|---|---|
| Slug convention | Latin, official Streamlined System (Закон за транслитерацията), lowercase, hyphens, max 5 words. A product's own Latin brand spelling wins (`repodeck`, `dial-in`, `stefi-gas`, `iliaora`). Never шльокавица (`kuhnqta` becomes `kuhnyata`). |
| Path prefix | `/proekti/<slug>` for own products, `/klientski-proekti/<slug>` for client work, `/blog`, `/za-men`, `/kontakt`. Bulgarian (transliterated) section words, no `/bg` prefix. Future English: `/en/projects/<same-slug>`. |
| Host | One canonical host (apex), the other 308s. Domain: `onova-za.com` (matches the products on .com), plus `onovaza.bg` as a 308 alias. |
| Schema | Home: WebSite + Person + Brand. About: ProfilePage. Index: CollectionPage + ItemList. Own app: WebPage + WebApplication (RepoDeck: SoftwareApplication). Client site: WebPage + CreativeWork. All: BreadcrumbList. No Organization until a legal entity exists. No ratings. |
| Role of hub | Wins brand, author and story queries. Product domains win tool-intent queries. Hub is the landing page only where a product has no domain (camping checklist, probably Dial In, RepoDeck). |

## 1. Realistic ranking strategy

**Can rank (weeks, once indexed):**
- Exact brand queries: "онова за сметката", "onova za smetkata", "RepoDeck", "Цветомир Цеков". Nobody else owns these strings. Autocomplete for "repodeck" returns nothing; "Цветомир Цеков" exists but has near-collisions (ценков, цветков) **[A]**.
- The long, specific, low-volume phrases a real person types when the generic one fails (see section 3).
- Entity pairing "онова за" + a product name. The bare phrase "онова за" is ordinary Bulgarian ("онова за което не искам да мисля", "онова нещо") **[A]**, so never optimise for it alone. Always pair it with the product.

**Cannot rank (do not plan on it):**
- "уеб разработчик София", "изработка на уебсайт" (agencies dominate **[A]**). The client sites themselves should rank for "торти по поръчка София" or "коминочистач Ловеч"; the hub is only proof of work.
- "приложение за рецепти" (autocomplete is polluted by medical e-prescriptions **[A]**), "какво да сготвя днес" (gotvach, kulinarno, supichka, bgmamma own it), "кафемелачка" (retail), "git клиент" (GitKraken, GitHub Desktop).
- Any Bulgarian query where the SERP is classifieds or large retailers. A new domain has no authority; expect 1 to 4 weeks to index, months before non-brand impressions **[J]**.

**Therefore:** treat Google as a brand-verification and long-tail channel. Distribution comes from LinkedIn, dev.bg-style communities, Bulgarian tech press (technews.bg is live **[F]**), GitHub, and direct sharing. Do not spend effort on keyword pages that need authority the site lacks.

## 2. Audit of existing properties (fix before the hub links to them)

1. **onova-za-smetkata.com** **[F]**: `https://onova-za-smetkata.com/` 308-redirects to `www`, but canonical, `og:url` and sitemap all point at the apex. Conflicting signals; pick one host and align everything. The server HTML of `/` has no `<title>`, one `<h1>` and a loading skeleton (an app shell); no JSON-LD. It has a good description and OG tags. It needs a crawlable landing section (what it does, 3 steps, FAQ). Until then the hub page is the only descriptive page, which is fine, but plan to move the tool-intent copy to the product.
2. **Chef (armyant.app and chef-black.vercel.app)** **[F]**: both return 200 with identical content, no canonical (duplicate content), `lang="en"`, title "CHEF | Home" (Google's title guidance says avoid "Home"), no robots.txt or sitemap. Make the custom domain canonical and serve `X-Robots-Tag: noindex` on `*.vercel.app` hosts.
3. **stefi-gas.com** **[F]**: same apex-canonical vs www mismatch. Title "Начало | Stefi Auto Gas" is weak; a-el-key.com and iliaora.com are in better shape (iliaora has WebSite and Organization JSON-LD).
4. **tseko.site is gone** **[F]**: NXDOMAIN, and RDAP says "available for registration". Wayback shows it live in March 2025. See section 9.

## 3. Keyword and intent research per product

Terminology evidence: Google autocomplete funnels "поделяне на сметка" to "разделяне на сметка" **[A]**, while "делене на сметка" returns fractions and property division **[A]**. So the natural phrase is **разделяне на сметка**; "делене" is wrong; "поделяне" (Revolut's Bulgarian UI wording **[S]**) is a fine secondary. "Сметка" alone means utility bill or bank account (`сметка ток`, `сметка вода`) **[A]**, so always pair it with "ресторант" or "вечеря". Bulgarians write "чек лист" as two words more often than "чеклист" **[A]**.

### 3.1 Онова за сметката
- **Primary intent:** tool, now. "разделяне на сметка (в ресторант)". SERP is calculators: smetni.bg, omistools.com, mrcalco.com, svcs.bg, kalkulatori.online, plus zen.com and a **direct local competitor, animolab.eu "Scan & Split"** (receipt photo, each guest marks items, link share, free tier with scan limits) **[F, DDG bg results]**. Revolut's built-in split and Tricount/Splitwise are the foreign defaults.
- **Natural secondary terms:** "кой колко дължи" (omistools uses it as H1), "поделяне на сметката", "сметка в ресторант", "ресторантска сметка", "всеки плаща своето", "разделяне по артикули", "касова бележка" (but this also pulls NRA lottery apps **[A]**; say "сметката от ресторанта"), "бакшиш" (tip calculators bundle it), "плащане с Revolut".
- **Long tail (write for people, not volume):** "как да разделим сметката когато всеки е поръчал различно", "разделяне на сметка със снимка на бележката", "разделяне на сметка по артикули", "Splitwise алтернатива на български", "как да върна пари на приятел по IBAN или Revolut".
- **Who targets what:** product domain owns tool intent, comparisons and FAQ. Hub page owns "проектът" (why built, how OCR on Bulgarian receipts works, decisions). Different title, H1 and description; link both ways. Do not cross-domain canonical (content differs by design).
- **Honest note:** a plain "split equally" calculator page would face 6+ established calculators. Only add one if it truly serves your users; the differentiator is "items claimed by each guest + pay host".

### 3.2 Chef
- **Blocker:** UI is English and the name "Chef" collides with Chef Software and appliance brands **[A]**. A rename to "Онова за кухнята" (slug `onova-za-kuhnyata`, which the owner already drafted) is better SEO: unique, Bulgarian, owns the exact phrase.
- **Primary intent (after Bulgarian UI):** "лична готварска книга", "седмично меню и списък за пазаруване".
- **Secondary:** "седмично меню" (mostly kindergarten, diabetic, weight-loss menus **[A]**, so qualify: "седмично меню за семейството", "седмично меню планер", "бланка"), "споделен списък за пазаруване", "списък за пазаруване приложение", "запазване на рецепти от сайт", "какво да сготвя тази седмица". "Рецептурник" is catering jargon; skip it.
- **Who targets:** product domain once localised; hub page is overview and case study. Fix the duplicate-domain and `lang` issues first.

### 3.3 Dial In
- **Demand is English:** "fellow opus grind settings", "...for espresso", "...v60", "fellow opus dial in" all autocomplete richly **[A]**. Bulgarian equivalents are empty or shop-service noise ("мелене на кафе" = grinding in a store) **[A]**; "fellow opus цена" shows Bulgarian shoppers exist.
- **Name risk:** "Dial In" is generic and several iOS apps use "Dial In Espresso" or "Dialed In" **[F search]**. Always brand as "Dial In от онова за".
- **Natural Bulgarian terms:** "кафемелачка", "размер/финост на мелене", "настройка на мелене", "специално кафе", "кафе на зърна", "еспресо", "V60", "дневник на кафето".
- **Who targets:** its own domain if one exists, otherwise the hub page. One optional hand-written English page ("Fellow Opus starting settings by method, from my own log") is legitimate; do not generate pages per grinder-bean-method combination (scaled content abuse).

### 3.4 RepoDeck
- **Audience is English, near-zero Bulgarian demand** ("git на български", "какво е git" only **[A]**). Real demand matching its job: "git pull all repos in a folder", "manage multiple git repositories", "github desktop alternative", "gitkraken alternative" **[A]**. "repodeck" itself is unclaimed, but "repo deck" returns Steam Deck results **[A]**.
- **Plan:** GitHub README + topics + releases are the primary landing page. Hub page is a short Bulgarian page now; add `/en/projects/repodeck` when English exists. One useful English note ("pull every repo in a folder: script vs RepoDeck") matches a real query.

### 3.5 Camping checklist (the most winnable one)
- **Primary intent:** informational template. Autocomplete confirms "какво да вземем на къмпинг", "списък за къмпингуване", "списък за палатка", "какво ни трябва за къмпинг" **[A]**.
- **Secondary:** "къмпинг екипировка списък", "списък с багаж за планина", "какво да вземем на къмпинг с кола/палатка". Avoid "чеклист" in titles; use "списък" with "чек лист" in body.
- **Visible competition:** classifieds and English templates **[S]**, which suggests thin Bulgarian checklist content **[J]**.
- **Who targets:** the hub page `/proekti/kamping-spisak` is the landing. Server-render a real, hand-written checklist by trip type (палатка, кола, с деца), printable, and add the app as the interactive version. Not an app-only page.

## 4. URLs and transliteration

**Google:** hyphens not underscores; non-ASCII "should be percent encoded"; "use words in your audience's language (and, if applicable, transliterated words)" (Search Central, URL structure). John Mueller has said non-English and non-Latin URLs are fine **[S, searchengineland]**. So Google is not the deciding factor.

**Deciding factors:** copied Cyrillic URLs become percent-encoded blobs in many chat apps and wikis; the products already use Latin slugs; domains are Latin.

**What Bulgarian sites do (mixed, no standard):**
- Latin: capital.bg (`/2019/03/15/3404990_razdeli_poravno/` **[S]**), mediapool.bg (`/analizi-i-komentari/lipsvashtata-strategiya-...`), ucha.se (`/videos/matematika/5-klas/`), omistools.com (`/razdelyane-na-smetka`), zen.com/bg.
- Cyrillic: kulinarno.bg (`/recepta/традиционен-български-козунак-...-9318` **[S]**), gotvach.bg (`/r-26512-Основно_тесто_за_палачинки` **[S]**), supichka.com (`/лесни-рецепти/21/супички`), bg.wikipedia.org, nuts.bg category pages.
- Hybrid: dev.bg (`/company/amusnet/` and `/ит-събития/`), softuni.bg (English path words `/apply/...`).
- Pattern: long-title publishers lean Cyrillic; tools and brands lean Latin. The same phrase appears as both `razdelyane` (law) and `razdeliane` (mrcalco), which proves ad hoc spelling is common. Be consistent instead.

**Rules (Streamlined System, mandatory since 2009 for official uses, adopted by UN 2012 and BGN/PCGN 2013 per Wikipedia):** а-a б-b в-v г-g д-d е-e ж-zh з-z и-i й-y к-k л-l м-m н-n о-o п-p р-r с-s т-t у-u ф-f х-h ц-ts ч-ch ш-sh щ-sht ъ-a ь-y ю-yu я-ya; word-final **-ия becomes -ia** (колекция = `kolektsia`, галерия = `galeria`, приложения = `prilozhenia`). Shlyokavitsa (я=q, ш=6, ч=4) is slang with no fixed rules; never use it in URLs.

**Examples:** `onova-za-smetkata`, `onova-za-kuhnyata`, `kamping-spisak`, `alisa-veterinarna-klinika`, `kominochistach`, `svatbena-galeria`, `apartamenti-za-pochivka`, `mebeli-andrey-kakrinski`.

**Aliases:** keep an `aliases` array per project that generates 308 redirects (e.g. the typed `onova-za-kuhnqta`).

**Path prefix reasoning:** `/proekti/` follows Google's "audience's language, transliterated" advice and displays naturally in desktop breadcrumb URLs. Root-level slugs would collide with `za-men` and kill the hierarchy for breadcrumbs. `/projects/` is acceptable (softuni does it) and simpler for i18n, but a Bulgarian section word costs only a one-line map `{bg:'proekti', en:'projects'}`. Slugs are brand names and are identical across languages.

**Domain:** `onova-za.com` is unregistered (Verisign RDAP 404), as is `onovaza.com`; both look available **[F]**. A `.бг` IDN adds nothing now.

## 5. Technical architecture (Next.js 16 App Router)

- **Layout:** `<html lang="bg">`, Cyrillic subset fonts via `next/font/google` (`subsets: ['cyrillic','latin']`). Bulgarian letterforms (д, л, г, ж, и, к, т, ц, ш...) come from the font's `locl`/BGR feature, triggered by `lang="bg"`. Not every font ships it; check visually with "дтпгл жзвфи" in regular and italic **[S]**. Avoid synthetic italics on Cyrillic.
- **Metadata:** root layout sets `metadataBase`, `title: { default: 'онова за - приложения от Цветомир Цеков', template: '%s | онова за' }`, `openGraph.siteName/locale: 'bg_BG'`. **Do not set `alternates.canonical` in the root layout**: Next merges segment metadata shallowly, so a layout-level `alternates` is inherited by every page that does not define its own and points everything at `/` (confirmed in the installed 16.3.8 docs, generate-metadata, "Merging"). The same shallow merge means a page that sets `openGraph` replaces all of the layout's `openGraph` fields, so share a base object. Use a helper `pageMeta({path,title,description})` per page that sets canonical, OG and Twitter.
- **Titles:** keep around 55 characters including the suffix (Cyrillic is wider in pixels, my heuristic **[J]**), brand at the end, no keyword lists. Pattern for own app pages: `{Име}: {какво прави} | онова за`. Google may rewrite titles anyway (title-link docs).
- **Canonical:** self-referencing absolute URLs, no query-string variants indexed (filters use `?vid=` and canonicalise to `/proekti`), `trailingSlash: false`.
- **hreflang readiness:** emit none until `/en` pages exist (Google: single-language sites do not need it). Prepare: all URL building goes through `localizedPath(locale, key, slug)`; content registry has `bg` strings now with an optional `en`; later add `app/[lang]` with `proxy.ts` (Next 16's replacement for middleware) so `/` stays unprefixed Bulgarian. Then output `alternates.languages` = `bg`, `en`, `x-default` (bg), reciprocal with self-references. Only link languages that actually exist.
- **Sitemap:** one `app/sitemap.ts` (about 20 to 40 URLs; split only near 50,000). `lastModified` from real content dates only, omit `priority`/`changefreq` (Google ignores them; lastmod is used only when reliably accurate). `robots.ts`: allow all, point to the sitemap, disallow nothing important. Verify the domain in Search Console and Bing Webmaster.
- **OG images:** `app/proekti/[slug]/opengraph-image.tsx` with `generateStaticParams`, 1200x630, `alt` in Bulgarian, project name plus one line. **Verified on the installed Next 16.3.8:** the bundled default font (`Geist-Regular.ttf`) renders Cyrillic with the network disabled (I rendered "Онова за сметката" offline and online, identical output), so older advice that Cyrillic needs a remote fallback does not apply here. Still pass your own brand font in `fonts` for weight and look: only `ttf`, `otf`, `woff` work (ttf/otf preferred), the whole bundle (JSX, fonts, images) is capped at 500KB, and the font should be read once at module scope. Check that your Cyrillic subset is small enough.
- **Breadcrumbs:** visible UI breadcrumb "Начало / Проекти / Име" plus BreadcrumbList JSON-LD. Google removed breadcrumb trails from mobile snippets in January 2025 but still supports them on desktop, so the UI value matters more than the rich result.
- **Internal linking:** Home links to both collections and the About page; collection links to each project; each project links to its collection, 2 or 3 `related` projects (smetkata with camping checklist as "everyday tools", Chef with Dial In as "kitchen", RepoDeck with notes), the relevant note, and out to the product. Every note links to its project. Footer links to all collections.
- **Outbound links:** hub to your own products and clients: normal follow, descriptive anchor ("Отвори Онова за сметката"). Reserve `nofollow`/`sponsored` for paid or user content. **Footer credit links on client sites ("Изработка: ...") should be `rel="nofollow"`**: Google lists "widely distributed links in the footers or templates of various sites" as link spam unless qualified. Product footers: one branded link "онова за" to the hub project page. `rel="me"` is IndieWeb/Mastodon verification; Google does not use it, so rely on `sameAs` plus reciprocal profile links.
- **Previews:** Vercel preview deployments are noindexed; production `*.vercel.app` aliases are not, so noindex them by host.

## 6. Schema.org

Decision on "онова за": a **Brand** (a label the person puts on products), not an Organization. Google's Organization markup is for businesses (name, logo, address, legalName); a personal label with no legal entity would be a misleading claim and brings no benefit. Revisit if you trade as ЕТ/ЕООД: then add Organization with `legalName` and `founder`. Do not expect a knowledge panel.

Skeletons (replace `SITE` with the configured origin; use `@id` references so entities link up):

```json
// Home (WebSite + Person + Brand)
{"@context":"https://schema.org","@graph":[
 {"@type":"WebSite","@id":"SITE/#website","url":"SITE/","name":"онова за","alternateName":["Onova za"],"inLanguage":"bg","publisher":{"@id":"SITE/#person"}},
 {"@type":"Person","@id":"SITE/#person","name":"Цветомир Цеков","alternateName":["Tsvetomir Tsekov","HayGrouve"],"url":"SITE/za-men","jobTitle":"Full-stack уеб разработчик","address":{"@type":"PostalAddress","addressLocality":"София","addressCountry":"BG"},"image":"SITE/tsvetomir.jpg","sameAs":["https://github.com/HayGrouve","https://www.linkedin.com/in/HANDLE"]},
 {"@type":"Brand","@id":"SITE/#brand","name":"онова за","url":"SITE/","logo":"SITE/logo.png"}]}
```
```json
// /za-men: ProfilePage (repeat the full Person node in the same @graph)
{"@context":"https://schema.org","@type":"ProfilePage","url":"SITE/za-men","inLanguage":"bg","dateModified":"YYYY-MM-DD","mainEntity":{"@id":"SITE/#person"}}
// /proekti: CollectionPage with ItemList of ListItem {position, url, name}
```
```json
// /proekti/onova-za-smetkata (own web app)
{"@context":"https://schema.org","@graph":[
 {"@type":"WebPage","@id":"SITE/proekti/onova-za-smetkata#page","url":"SITE/proekti/onova-za-smetkata","name":"Онова за сметката: проектът","inLanguage":"bg","isPartOf":{"@id":"SITE/#website"},"mainEntity":{"@id":"SITE/proekti/onova-za-smetkata#app"},"breadcrumb":{"@id":"SITE/proekti/onova-za-smetkata#crumbs"}},
 {"@type":"WebApplication","@id":"SITE/proekti/onova-za-smetkata#app","name":"Онова за сметката","url":"https://www.onova-za-smetkata.com/","description":"...","applicationCategory":"FinanceApplication","operatingSystem":"Any","browserRequirements":"Requires JavaScript","inLanguage":"bg","isAccessibleForFree":true,"offers":{"@type":"Offer","price":"0","priceCurrency":"EUR"},"creator":{"@id":"SITE/#person"},"brand":{"@id":"SITE/#brand"}},
 {"@type":"BreadcrumbList","@id":"SITE/proekti/onova-za-smetkata#crumbs","itemListElement":[{"@type":"ListItem","position":1,"name":"Начало","item":"SITE/"},{"@type":"ListItem","position":2,"name":"Проекти","item":"SITE/proekti"},{"@type":"ListItem","position":3,"name":"Онова за сметката"}]}]}
```
- `offers` only if truly free; currency is EUR (Bulgaria is in the euro area since 2026-01-01 **[J]**, verify at launch). `applicationCategory` from Google's list: smetkata Finance, Chef/Dial In/camping Lifestyle, RepoDeck `DeveloperApplication`. **RepoDeck:** `@type: SoftwareApplication`, `operatingSystem` only for builds you ship ("Windows, macOS, Linux"), `downloadUrl` = the GitHub release. PWAs are `WebApplication`, not `MobileApplication` (no store listing).
- **Client sites:** `WebPage` with `mainEntity` a `CreativeWork` (`name`, `url` of the client site, `creator` = Person, `dateCreated`, `genre: "Уебсайт"`, short `about`). Do not model the client as your LocalBusiness or Organization. For private CRMs (Алиса, автосервиз): no `url`, no real-data screenshots, and only publish with the client's consent.
- **Product domains** should add their own WebApplication JSON-LD with `creator: {"@id":"SITE/#person"}` (absolute `@id` across domains) to tie the entities.
- **Do not mark up:** `aggregateRating` or `review` (none exist; Google requires one of them plus `offers` for a software-app rich result, so without genuine reviews you simply get no rich result, and fabricating them risks a manual action); self-serving testimonials; fake address or phone; Organization for yourself; SearchAction (sitelinks search box retired 21 Nov 2024); FAQPage purely for rich results (Google restricted it in 2023 **[J]**); hidden content. Validate with the Rich Results Test and keep markup identical to visible text.

## 7. Bulgarian sites worth studying (all fetched live 2026-10-05 unless noted)

1. **ucha.se**: pun brand ("уча се") with a promise title ("уроците на разбираем и интересен език"), Organization JSON-LD, Latin transliterated paths, custom Cyrillic font (Akrobat). Inner titles are plain and intent-first: "Онлайн видео уроци и тестове по математика за 5. клас | По учебната програма".
2. **supichka.com**: the diminutive "-ичка" gives a warm brand ("Пътеводител на новака в кухнята"); Cyrillic slugs. Do not copy its keyword-dump meta description.
3. **kulinarno.bg** and **gotvach.bg** **[S]**: titles follow "Рецепта за ... - сайт"; this is how Bulgarians search recipes ("рецепта за палачинки"). Relevant for Chef copy.
4. **mediapool.bg**: tagline as description ("Ти си това, което четеш"), WebSite + Organization JSON-LD, `max-snippet` robots directives, Latin section slugs.
5. **dev.bg**: Bulgarian-first with English IT vocabulary; a place to share builds and the natural audience for RepoDeck and "как е направено" notes.
6. **softuni.bg**: Bulgarian copy with English path words; evidence that mixed paths are normal.
7. **nuts.bg**: plain promise title ("Ядки онлайн с бърза доставка в България!"), BreadcrumbList JSON-LD.
8. **animolab.eu**: the same hub-plus-product architecture (hub "Animo Lab" with Scan & Split) and a direct competitor. Copy worth noting: "Снимаш касовата бележка, всеки на масата маркира своето" (informal second person singular, verbs first). Also study how Revolut's Bulgarian help text and Capital's 2024 piece on PossePay ("Раздели ми сметката") **[S]** phrase the problem.

Common thread: plain-language promises, informal "ти" voice, brand name first or last with a consistent separator, no English filler. Typography: Cyrillic needs a full subset (Lato, Montserrat, Akrobat are used), more line height than Latin, and `lang="bg"` for localized forms.

## 8. Content strategy

Short Bulgarian developer notes will earn few queries; Bulgarian dev-blog search demand is thin **[J]**. Their value: E-E-A-T context for the Person entity, link-worthy stories to share in communities, and answers to a few real long-tail needs. Minimal viable plan:
- **At launch (no blog):** home, `/proekti`, 5 product pages (camping page with the full checklist), `/klientski-proekti` with 3 to 5 case studies (problem, what I built, result; one screenshot, no private data), `/za-men`, `/kontakt`.
- **Months 1 to 3, three notes only, each tied to a real product and original knowledge:** (1) "Как разчитам ресторантски сметки на български с OCR и какво се обърка" (hub, links to the app); (2) "Как да разделим сметката в ресторант: 3 начина и кога кой работи" on the **smetkata domain** since it supports that product's intent; (3) RepoDeck decision note in English ("Why Tauri for a multi-repo Git manager"), shared on GitHub.
- **No programmatic pages**: no per-grinder, per-city or per-keyword page sets. Google's scaled-content and doorway policies target many near-identical pages. Add notes only when you have something to say; update old ones with `lastModified` bumped only on real edits.
- **Promotion:** LinkedIn post per launch, a dev.bg/community share, a note to technews.bg for a notable launch, Show HN and awesome-tauri-style lists for RepoDeck, an AlternativeTo-style listing for smetkata (verify each before relying on it).

## 9. Author and entity signals

- **One naming scheme:** "Цветомир Цеков" (primary, Cyrillic), "Tsvetomir Tsekov" and "HayGrouve" as `alternateName`. "HayGrouve" alone autocompletes to "haygrove" (a UK company) **[A]**, so never rely on it as a search handle.
- **Loop closure:** GitHub profile website field and LinkedIn contact website field link to the hub's `/za-men`; GitHub profile README links to the hub; each repo's homepage field points to its hub project page (RepoDeck) or product domain; product footers link to the hub; hub links out to each. Person JSON-LD `sameAs` lists only profiles you control and that link back.
- **Site name:** `WebSite` JSON-LD on the home page with `name: "онова за"` (Google supports site names in all languages), `og:site_name` and the home H1 consistent. Google may still show the domain.
- **tseko.site:** the domain has lapsed and is currently registrable. Recommended: re-register it (your call, it costs money), 308 every path to `SITE/za-men`, and keep the redirect at least 12 months; this prevents squatting or impersonation of your old CV link and preserves any inbound links. If you do not want the domain, update LinkedIn, GitHub and old CVs now. Do not republish the old English résumé as duplicate content; if it is worth keeping, adapt it into `/en/about` later.

## Sources

- Google Search Central: [URL structure](https://developers.google.com/search/docs/crawling-indexing/url-structure), [software app](https://developers.google.com/search/docs/appearance/structured-data/software-app), [profile page](https://developers.google.com/search/docs/appearance/structured-data/profile-page), [breadcrumb](https://developers.google.com/search/docs/appearance/structured-data/breadcrumb), [organization](https://developers.google.com/search/docs/appearance/structured-data/organization), [site names](https://developers.google.com/search/docs/appearance/site-names), [localized versions](https://developers.google.com/search/docs/specialty/international/localized-versions), [spam policies](https://developers.google.com/search/docs/essentials/spam-policies), [sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap), [title links](https://developers.google.com/search/docs/appearance/title-link), [simplifying search results 2025](https://developers.google.com/search/blog/2025/06/simplifying-search-results).
- Next.js docs (via Context7 and the installed 16.3.8 copy in `node_modules/next/dist/docs/01-app`): generate-metadata, sitemap, robots, image-response, JSON-LD guide, internationalization, v16 upgrade (proxy.ts).
- [Romanization of Bulgarian (Wikipedia)](https://en.wikipedia.org/wiki/Romanization_of_Bulgarian); [Mueller on non-English URLs (Search Engine Land)](https://searchengineland.com/google-using-non-english-urls-non-english-websites-fine-294758) (snippet); sitelinks search box retirement [(Koozai)](https://www.koozai.com/blog/search-marketing/farewell-to-the-google-sitelinks-search-box-what-you-need-to-know/).
- Bulgarian sites: [ucha.se](https://ucha.se), [supichka.com](https://supichka.com), [mediapool.bg](https://www.mediapool.bg), [dev.bg](https://dev.bg), [softuni.bg](https://softuni.bg), [nuts.bg](https://nuts.bg), [animolab.eu](https://animolab.eu/), [omistools](https://omistools.com/razdelyane-na-smetka), [capital.bg 2019](https://www.capital.bg/biznes/moiat_kapital/2019/03/15/3404990_razdeli_poravno/), [capital.bg PossePay 2024](https://www.capital.bg/biznes/fintech/2024/01/15/4575756_possepay_razdeli_mi_smetkata/), [Revolut BG help](https://help.revolut.com/bg-BG/help/transfers/internal-transfers/splitting-bill-using-receipts/), [gotvach recipe](https://recepti.gotvach.bg/r-26512-%D0%9E%D1%81%D0%BD%D0%BE%D0%B2%D0%BD%D0%BE_%D1%82%D0%B5%D1%81%D1%82%D0%BE_%D0%B7%D0%B0_%D0%BF%D0%B0%D0%BB%D0%B0%D1%87%D0%B8%D0%BD%D0%BA%D0%B8), kulinarno.bg recipe URLs (search results).
- Raw checks: Google suggest (`suggestqueries.google.com`, `hl=bg&gl=bg`, client=chrome), DuckDuckGo bg HTML results, Google Public DNS, Verisign and Radix RDAP, Wayback CDX, direct `curl` of the owner's sites.
