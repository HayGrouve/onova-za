# 01 - Makers, project libraries and IA for "onova za"

Researched 2026-10-05. Every site below was fetched live; where noted I also checked raw HTML (titles, JSON-LD). Not verifiable, so excluded: Little Big Details (403 bot wall), Read.cv (HTTP 402), Product Hunt collections (blocked), Tony Dinh (tonydinh.com only redirects to a Substack newsletter), mmm.page (landing page only).

## 1. Decisions in one screen

1. One collection, three facets (status, whose, kind). Not separate Products/Tools/Experiments pages.
2. Nav of 2 to 3 visible links: Проекти (the homepage itself), Бележки (only once it has 3+ posts), За мен. Plus one text CTA.
3. Every project gets an owned, indexable page. Out-linking lists are the biggest missed opportunity in the examples below.
4. Controls appear by item count: none under 15, chips at 15+, visible search plus "/" and Cmd+K at 30+. Same data model from day one, so no redesign.
5. Client work lives in the same library, labelled "За клиент", with a fixed honest block (role, year, what I did not do).

## 2. Competitive analysis

| Website | What works | What doesn't | What we can learn |
|---|---|---|---|
| levels.io/projects (https://levels.io/projects/) | 116 projects on one page by year. Status chips carry outcome shares and filter on click, shift-click combines. Status shown as "Active", year range for dead, "(sold)". Title: "List of all my projects ever" | Entries link out to the product site, no owned detail page. "N/A 61%" is a vague bucket. 600 KB page, no JSON-LD | Status as the primary facet, shown honestly. Stats row doubles as filter legend |
| Marc Lou (https://marclou.com) | Logo, name, revenue, one-liner. Badges only for exceptions ("Acquired", "Discontinued"). Active list first | Canonical points to indiepa.ge/marclou, so SEO equity goes to the host platform. No filter, no detail pages | Badge exceptions, not the norm. Never canonicalise to a platform |
| Sindre Sorhus apps (https://sindresorhus.com/apps) | Hero stat line (63 apps, 11 years, 6M users). Card = icon, name, one-liner, platform, price. Archived section. Each app page has SoftwareApplication JSON-LD and title "Mailway: Route mailto links to any email app or webmail" | One long grid of 63. Facets are Apple-specific | Best SEO model here: one URL per project, title = name + plain-language job |
| Anthony Fu (https://antfu.me/projects) | 15 named groups, sidebar anchors, "Current Focus" first, one-liners of about 15 words | Title is just "Anthony Fu". Links go to GitHub. No status | Meaningful groups scale to 100+ without filters. Pin "now" first |
| Brittany Chiang (https://brittanychiang.com, /archive) | 4 featured cards, then archive table of about 60 rows: Year, Project, Made at, Built with, Link | Experience section sits above projects (résumé-first). Archive has no filter. Title is just her name | Featured plus archive. The "Made at" column is honest client/employer attribution |
| Hakim El Hattab (https://hakim.se) | Few flagship products, then groups by feel: tools, experiments, games, simulations. States its scope up front ("personal work", past-job projects excluded) | No status, no detail pages | Group by what it feels like, not by tech. Say what the page covers |
| Maggie Appleton garden (https://maggieappleton.com/garden) | Filter by growth stage (Seedling, Budding, Evergreen), topic (30+), type. Cards show type and relative age. Person/WebSite JSON-LD | Stage meaning is explained elsewhere. Many topics | A shared WIP vocabulary people accept |
| Simon Willison tools (https://tools.simonwillison.net) | Many tiny tools. "Recently added", "Recently updated", /by-month. Almost no ceremony per entry | No search or filter, near-zero description | Make publishing a small thing cheap. Recency lists keep it alive |
| Paco Coursey (https://paco.me) | Name plus one line per project, a "Now" section, author of the cmdk palette | No status, no pages, breaks past about 10 items | Voice and restraint. Source of the Cmd+K pattern |
| Rauno Freiberg (https://rauno.me/projects) | Text list: name and year only, fast | No context, all links out | The floor: our compact list view should be this lean |
| Lee Robinson (https://leerob.com) | Notes as a topic hub, Person/Organization JSON-LD | No projects section at all, 800 KB HTML | Topic hubs suit Бележки later. Not a project model |
| Josh Comeau (https://www.joshwcomeau.com) | Only 8 categories, a ranked "popular" top 10, paid products kept apart from free content | Generic title, no JSON-LD | A "start here" pick list for first-time visitors |
| Iconfactory (https://iconfactory.com) | One page, separated blocks: client portfolio (platform, client, 2 to 3 sentences, link), services, own apps. Descriptive title and meta, JSON-LD | Client-first, own apps get only 3 cards | Closest precedent for honest client-versus-own on one front door |
| Panic (https://panic.com) | Category headers (apps, games, hardware). Card = name, one-sentence value, platform, CTA. Brand in one line: "We code apps, publish games, and make Playdate". hreflang present | No filtering, only works at about 15 items | Grouped headers plus one-line brand promise |
| 37signals (https://37signals.com) | Flagship first, others equal weight, products sit beside essays | No cards, little differentiation | Clear flagship versus small-product hierarchy |
| Teenage Engineering (https://teenage.engineering) | Image-led square cards, playful colloquial names and copy | Store, not a library | Playfulness works when the structure stays plain |
| Uneed (https://uneed.best), There's An AI For That (https://theresanaiforthat.com) | Product page has a metadata sidebar (launch date, category, pricing), tags and related tools | Leaderboards, upvotes, ads. TAAFT homepage HTML is 6 MB. Launch-platform framing | Borrow the metadata sidebar and related items, not the ranking |

## 3. IA for our site

**Verdict on each candidate section**

| Candidate | Verdict | Reason |
|---|---|---|
| Projects | Keep, and make it the homepage | The brand unit is "онова за X", which is a project. Projects are the hero |
| Products / Tools / Experiments / Playground | Drop as destinations, keep as filter values | They overlap (is a bill splitter a product or a tool? is a WIP Tauri app a product or an experiment?). NN/G advises mutually exclusive, user-language terms and facets rather than overlapping buckets (https://www.nngroup.com/articles/taxonomy-101/). At 14 items, an Experiments page with 2 entries looks abandoned |
| Notes (Бележки) | Add later, hide until 3+ posts | Build logs and "why" posts feed SEO and give each project a story. Empty nav items cost trust |
| About (За мен) | Keep, includes contact and "hire me" | Single destination for the hiring manager or client |

NN/G found hidden navigation was used 27 percent of the time on desktop versus 48 to 50 percent when visible, and was at least 39 percent slower (https://www.nngroup.com/articles/hamburger-menus/). Keep 2 to 3 links visible on every breakpoint.

**URLs (Latin, transliterated slugs)**

- `/` library, filter state in query (`/?status=na-zhivo&za=klient`) with canonical to `/`
- `/proekti/onova-za-smetkata` project page. `/proekti` redirects to `/`
- `/belezhki`, `/belezhki/[slug]`
- `/za-mene`
- later: `/tema/kafe` topic landing pages, only when a topic has 3+ projects

Reasoning: Google recommends hyphens and "words in your audience's language (and, if applicable, transliterated words)", and says non-ASCII must be percent-encoded (https://developers.google.com/search/docs/crawling-indexing/url-structure). Latin slugs avoid ugly `%D0%...` strings when shared in chats, and match existing domains such as onova-za-smetkata.com. Use Bulgaria's official Streamlined System (Transliteration Act, 2009; https://en.wikipedia.org/wiki/Romanization_of_Bulgarian). Titles, H1s and copy stay in Cyrillic, `<html lang="bg">`. If English comes later, use `/en/` with bidirectional hreflang and x-default (https://developers.google.com/search/docs/specialty/international/localized-versions).

**Client work vs own products: one collection.** One front door is the brief, and the examples agree: Iconfactory separates the two on one page, Brittany Chiang tags every archive row with "Made at". Signal it three ways:
1. Facet "За клиент" and a small tag on the card.
2. Default view (while under about 20 items) shows two headed groups: "Мои" first, then "За клиенти". Own products lead because they are the hero.
3. A fixed block on every client page: Клиент, Моята роля (exactly what I did and did not do), Година, Състояние ("вече не го поддържам" if true). No testimonials or numbers unless real and approved by the client.

## 4. Discovery scaling: 5 to 20 to 50+

Evidence is thin for portfolios, so thresholds below are my heuristics, anchored in what exists:
- NN/G's old rule: sites over about 200 pages should offer search (1997, https://www.nngroup.com/articles/search-and-you-may-find/). More than half of users are search-dominant, about a fifth link-dominant. It is about pages, so a 30-item portfolio needs search later than most sites.
- Navigation teaches the structure of the space, search needs recall and typing, so search must not replace browsing (https://www.nngroup.com/articles/search-not-enough/).
- Baymard: promote filters "only when the product list is so large that the vast majority of users are better off applying a filter before devoting any attention to the list" (their example is 217 hotels; https://baymard.com/research-articles/promoting-product-filters).
- Replacing a search link with an input box raised search use 91 percent (https://www.nngroup.com/articles/search-visible-and-simple/). So at 30+ show a small visible field, not only a shortcut.
- Choice overload is not reliable: a 63-condition meta-analysis found a mean effect near zero, mainly bites visitors with no preferences (https://ideas.repec.org/a/oup/jconrs/v37y2010i3p409-425.html). Grouping helps those browsers more than hiding things.

| Items | Show | Why |
|---|---|---|
| 1 to 14 (today) | No controls. Two headed groups, editorial order, live first | Fits in about 3 mobile screens. Every control is a cost |
| 15 to 29 | One row of chips: статус, чие, вид. Counts on chips, zero-count disabled, URL-synced, one clear button | A visitor can now skip most of the page |
| 30 to 49 | Add visible search field plus `/` and Cmd+K (client-side over name, tagline, topics). Compact list toggle. Sort: recent | Palette also jumps to pages |
| 50+ | Add topic chips, "Започни оттук" pick list, topic landing pages | Still one page, no pagination needed at this size |

Mechanism: one `Library` component reads the item count and turns controls on. The data model never changes: `{slug, name, tagline, status, whose, kind, topics[], updatedAt}`.

## 5. Taxonomy (Bulgarian labels)

Native review needed, the owner has the last word on tone.

| Facet | Values | Notes |
|---|---|---|
| Статус | На живо, В правене, Експеримент, Архив | Compressed from repostatus.org's 8 states (https://www.repostatus.org). "В правене" is colloquial and fits the brand. Fallback: "В процес". Always colour plus word |
| Чие е | Мои, За клиенти | Chip wording. Card tag reads "За клиент" |
| Вид | Приложение, Сайт, Система, Десктоп | Система = business back-office (the CRMs). Bill splitter, cookbook, grind journal, checklist = Приложение. Marketing and brochure sites = Сайт |
| Тема (only at 30+) | пари, храна, кафе, път, код, сватба, авто | 12 max, never shown on cards. Feeds related items and topic pages |

Example: онова за сметката = Мои / Приложение / На живо. Vet clinic CRM = За клиент / Система / На живо. Tauri Git client = Мои / Десктоп / В правене.

NN/G criteria apply: concrete, jargon-free, predictable labels (https://www.nngroup.com/articles/filter-categories-values/).

## 6. Card anatomy

Readable in 3 seconds, in this order:
1. Fixed-ratio thumbnail or icon.
2. Name.
3. One line, at most about 60 characters, finishing the "онова за ..." sentence in plain Bulgarian.
4. Status chip.
5. Small "За клиент" tag, only when it applies. Kind as icon plus word.

Drop: tech stack, dates (except "обновено" on В правене), multi-line descriptions, metrics, hover-only info, secondary CTAs. Rule from Baymard: anything shown on a list item should have a matching filter, 38 percent of sites fail this (https://baymard.com/research-articles/have-filters-for-list-item-info). So the card shows only filterable facets. Whole card is one link. NN/G: cards give a summary plus a link and suit browsing, lists suit scanning and density (https://www.nngroup.com/articles/cards-component/), hence the list toggle at 30+.

## 7. Project page anatomy

Order serves the Bulgarian end user first, then the hiring manager:
1. Header: name, "онова за ..." line, status, kind, whose, one primary CTA (Отвори / Инсталирай / Виж сайта). Archive pages show why instead of a CTA.
2. One hero screenshot (phone frame for PWAs).
3. "За какво ти е": 2 to 3 plain-language use cases.
4. 3 to 4 screens with captions.
5. "Защо го направих": 60 to 80 words, three beats: the real annoying moment, why existing options did not fit, what I chose to build and leave out. Add one honest limit ("не може ..."). Ban "страстен", "революционен". For client work rename to "Задачата".
6. "Как е направено": stack as a plain list, 1 or 2 notable decisions, repo link if public, one "какво бих сменил".
7. Състояние: last updated, what is next. This is the honest WIP section.
8. Client block (client work only), as in section 3.
9. "Още онова за ...": 3 related cards, plus "Нещо подобно за теб? Пиши ми".

SEO per page (Sindre Sorhus's page is the model):
- Unique title: "Онова за сметката: делене на сметки с приятели | онова за". Google wants distinct, descriptive titles with brand at one end (https://developers.google.com/search/docs/appearance/title-link).
- JSON-LD: SoftwareApplication or WebApplication for own apps, CreativeWork with `creator` for client sites, BreadcrumbList, Person on За мен.
- Honesty: Google's SoftwareApplication rich result requires `offers.price` and a rating or review (https://developers.google.com/search/docs/appearance/structured-data/software-app). Reviews you control are barred from star features and fake reviews are prohibited (https://developers.google.com/search/docs/appearance/structured-data/review-snippet). Expect no rich result, mark up for entity clarity only.
- Product domains such as onova-za-smetkata.com stay canonical for themselves. The library page links to them and does not copy their text.

## 8. Patterns worth borrowing

1. Status chips that show counts and multi-select with shift-click: https://levels.io/projects/
2. Hero stat line ("14 проекта, 6 на живо"): https://sindresorhus.com/apps
3. Grouped list with a pinned "now" group: https://antfu.me/projects
4. Featured cards plus full archive with a "Made at" column: https://brittanychiang.com/archive
5. "Recently added" and "recently updated" strips: https://tools.simonwillison.net
6. A WIP vocabulary as a filter: https://maggieappleton.com/garden
7. Command palette that searches projects and jumps to pages: https://github.com/dip/cmdk (Paco Coursey's library)
8. Per-project FAQ, "You might also like" and JSON-LD: https://sindresorhus.com/mailway
9. A /now strip on the homepage (what I'm building this week): https://nownownow.com/about
10. Client portfolio and own apps as labelled blocks on one page: https://iconfactory.com

## 9. Anti-patterns

1. Out-linking entries with no owned page (levels.io, Rauno, Marc Lou): no SEO surface, no story.
2. Name-only titles and platform canonicals (antfu.me, Brittany Chiang, Josh Comeau; Marc Lou canonical to indiepa.ge).
3. Hidden navigation on desktop (NN/G figures above).
4. Leaderboards, upvotes, ads, multi-MB pages (Uneed, TAAFT): wrong frame for a personal brand.
5. Résumé-first order and tech-tag soup on cards (Experience above Projects), plus vague status buckets such as "N/A 61%".
