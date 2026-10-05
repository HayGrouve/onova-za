# 03 Visual design research: онова за

Date: 2026-10-05. Scope: type, culture references, 3 directions, per-project identity, motion. No app code.
Method for fonts: I did not trust specimen pages. I downloaded the exact woff2 files that Google's CSS API serves (the same ones `next/font/google` self-hosts), parsed their GSUB tables with fontkit, and rendered them in headless Chrome with `lang="bg"` vs `lang="ru"`.

## 1. Bulgarian typography

### 1.1 What "Bulgarian forms" actually are

In Bulgarian upright type, lowercase п и к т (and rounder в г з ц ш щ ю, plus Λ-shaped Л and Δ-shaped Д) take shapes that look like Latin n u k m. This is the vernacular called "Bolgaritsa", and Bulgarian designers push it deliberately. Browsers apply these forms from OpenType `locl` (language system BGR) when the element has `lang="bg"`. Sources: https://type.today/en/journal/bulgarian , https://www.tema.ru/eng/travel/sofia.2009/ , https://cyrillic.bgweb.bg/en/ , https://www.lettersoup.de/category/allgemein/

Brand consequence: "онова за" contains в and з, and both change visibly (в becomes ʙ-like, з becomes a descending 3). The Bulgarian form of "з" is a ready-made monogram and favicon.

### 1.2 Verified results (Google Fonts served files, Oct 2026)

| Group | Fonts |
|---|---|
| Bulgarian forms are the DEFAULT, no locl needed | Sofia Sans, Condensed, Semi Condensed, Extra Condensed (upright and italic). Russian forms exist only as the `locl RUS` alternate. |
| `locl BGR` present and rendering | Manrope, Unbounded, Geologica, Commissioner, Montserrat, Raleway, Wix Madefor Display/Text, Source Sans 3, IBM Plex Sans, Overpass and Overpass Mono, Ysabeau, Tektur; serifs: Source Serif 4, Lora, Merriweather, Vollkorn, Piazzolla, Spectral, Bitter, Cormorant, Roboto Serif |
| Cyrillic, one fixed set, no language switching (glyphs identical under bg, ru, sr; Russian-style in the renders I inspected: Geist, Onest, Golos, Martian Mono, JetBrains Mono, Inter) | Geist and Geist Mono (Cyrillic exists), Inter and Inter Tight (as served by GF), Onest, Golos Text, Rubik, Jost, Literata, Mulish, Roboto family, Noto Sans/Serif, Open Sans, Martian Mono, JetBrains Mono, IBM Plex Mono/Serif, Fira, PT, Playfair Display, Nunito, Oswald |
| No Cyrillic at all | Outfit, Bricolage Grotesque, Mona Sans, Hubot Sans, Space Grotesk, DM Sans, Figtree, Instrument Sans |

Side finding: the coffee app (Outfit) and Chef (Bricolage Grotesque) have no Cyrillic glyphs, so any Bulgarian text there falls back to another font.

### 1.3 Does next/font keep locl? Yes.

- The loader in `node_modules/next/dist/compiled/@next/font/dist/google` fetches Google's CSS with a modern UA and self-hosts the same woff2 files I tested.
- BGR locl survived in every cyrillic subset file, including static instances (Unbounded 700, Manrope 500, Overpass Mono 400) and multi-axis files (Geologica wght+SHRP).
- `subsets` only chooses which files get a preload link. Every subset is still emitted with `unicode-range`, so Cyrillic works even if you list only `latin`. List both `['latin','cyrillic']` to preload.
- Requirement: `<html lang="bg">`. Cyrillic subset range includes U+2116 (№) and U+0301 (stress mark).
- Where it breaks: Satori (`next/og`) reportedly ignores OpenType features such as locl (from its README via search, not tested by me). Sofia Sans is immune because Bulgarian is its default, so OG images stay correct. Fallback for any other font: self-host with `next/font/local` from the google/fonts repo.
- Without `lang="bg"`, every font except Sofia Sans silently shows Russian forms. Verified in render.

### 1.4 Recommended pairings (weights from measured woff2 sizes)

| | Display | Text | Mono (Latin only) | Weight budget |
|---|---|---|---|---|
| **P1 Sofia (recommended)** | Sofia Sans Extra Condensed 800, static: 25 KB (latin 15.4 + cyr 9.5) | Sofia Sans, statics 400 + 600: ~50 KB; variable 1..1000: 64 KB | Martian Mono 400 static: latin 10 KB (cyr 4.6 KB loads only if used) | ~85 KB total |
| **P2 Wide and friendly** | Unbounded 700 static: 33 KB | Manrope variable 200..800: 38.5 KB | Martian Mono 400 | ~82 KB. BGR via locl, needs `lang`. Matches sibling projects (smetkata) but wide-round type risks a "web3" read. |
| **P3 Reading (only if the library holds long Bulgarian prose)** | Sofia Sans Condensed 700 static: 25 KB | Source Serif 4 static 400: 33 KB (do NOT use the opsz variable: 211 KB) | system mono | Load only in the library layout. Serif justified only for long-form reading. |

Notes:
- Restricting the wght range does not shrink variable files (tested). Static weights do: a single static is about 40% of the variable size. Use statics for display, variable only when 3+ weights are needed.
- Mono rule: Martian, JetBrains, Geist and Plex Mono have Russian-style Cyrillic only, so keep Cyrillic out of mono (slugs, years, numbers, URLs). Overpass Mono is the only mono verified with real BGR forms.
- Sofia Sans details: designers Lettersoup, Botio Nikoltchev, Ani Petrova; OFL; inspired by early-20th-century technical sans serifs (https://github.com/google/fonts/blob/main/ofl/sofiasans/DESCRIPTION.en_us.html). It reads as signage when condensed, which suits this brand.

```ts
// sketch only
Sofia_Sans_Extra_Condensed({ subsets:['latin','cyrillic'], weight:'800', variable:'--font-display' })
Sofia_Sans({ subsets:['latin','cyrillic'], weight:['400','600'], variable:'--font-text' })
Martian_Mono({ subsets:['latin'], weight:'400', variable:'--font-mono', preload:false })
```

## 2. Bulgarian visual culture references (12)

| # | Reference | What to take | URL |
|---|---|---|---|
| 1 | Bolgaritsa lettering (n/u/k/m forms) | The letterforms themselves are the brand signature | https://type.today/en/journal/bulgarian |
| 2 | Stefan Kanchev, trademarks (~1,600 logos) | Geometric rigor: one idea, one mark, no ornament | https://en.wikipedia.org/wiki/Stefan_Kanchev |
| 3 | ABVA, Archive of Bulgarian Visual Arts | Vintage logos, covers, typography: flat color, strong type, tiny budgets | https://archive.abva.bg/en |
| 4 | SOCMUS virtual museum | Posters, matchboxes (https://socmus.com/en/kibriti/), Sofia metro logo (https://socmus.com/en/logo_metro/): small objects given full design care | https://socmus.com/en/the/blog/ |
| 5 | Balkantourist-era travel ads (c. 1960 to 1984) | Tight caps, flat fills, one confident color per piece | https://fontsinuse.com/uses/17924/sonniges-bulgarien-ihr-urlaubsland-ad-vienna |
| 6 | 1970s enamel signs ("ВЛИЗАЙ ОТТУК", "МЪЖЕ") | Label logic: a short imperative, big plain lettering, one color field. Marketplace listings, may expire | https://bazar.bg/obiava-46216386/riadka-emaylirana-tabela-wlizay-ottuk-ot-70te-whod-ukazatelna-tabela |
| 7 | "Bulgarian Letters" benches, Read Sofia | Cyrillic letters as physical objects (Б Д Ж З И Й Ц Ч Ш Щ Ъ Ю Я) | https://mfa.bg/en/culture/news/2362 |
| 8 | Vasil Stanev's street-sign and handwriting corpus | How Bulgarians really write and paint Cyrillic: label, not specimen | https://typedrawers.com/discussion/comment/50946/ |
| 9 | Lettersoup / Sofia Sans | A contemporary Bulgarian foundry's take on technical sans | https://www.lettersoup.de/category/allgemein/ |
| 10 | Fontfabric (Sofia, since 2008, Svet Simov; Nexa) | Proof that Bulgarian type exports globally | https://type-01.com/how-fontfabric-transformed-nexa-pro-from-a-best-seller-to-a-global-powerhouse/ |
| 11 | Letter Collective (Grafema LC) and Kiril Zlatkov (Kometa) | Brush-written Cyrillic and a geometric sans with a humanist soul, both Bulgarian | https://localfonts.eu/shop/decorative-fonts/grafema-lc/ , https://myfonts.com/fonts/kiril-zlatkov-type-foundry/kometa |
| 12 | Bulgarian wine and packaging labels (Varna set) | Contemporary label systems: name, year, one color | https://fontsinuse.com/locations/180262/varna |

Not verified: "Studio8" (no matching Sofia studio found). The idea that a hand-labelled зимнина jar or kitchen drawer inspired the name is a cultural hunch with no source; treat it as a concept, not a citation. Avoid folk-embroidery (шевица) patterns and tricolor stripes: that is the kitsch zone.

## 3. Three homepage directions

All three set `lang="bg"`, use one radius token, and show Bulgarian letterforms as the main "this is from here" cue. Contrast figures are WCAG 2.x ratios computed from the hex values.

### A. Каталог (editorial index)
- **Idea:** a printed catalogue of small useful things. Numbered entries, 2 to 3 big features, then a compact index.
- **Palette:** light bg #F5F7F9, surface #EBEDEF, ink #101419 (17.2:1), muted #54585F (6.7:1 on bg, 6.1 on surface), line #D2D4D7. Dark bg #0D1013, surface #171A1D, ink #ECEFF1 (16.5:1), muted #A0A5AC (7.7:1), line #2E3134. Single hub accent, vermilion: text #B61E00 (6.2:1 on bg), large type or graphics only #DE3F25 (4.0:1), dark #FF8068 (7.8:1 on bg, 7.1 on surface), white on #CC2B0E button 5.4:1.
- **Type:** P1. Names in Extra Condensed 800, capped at about 96 px.
- **Grid:** 12 columns, sticky left rail with wordmark, hairline rules, radius 0 or 2 px.
- **Cards:** none. Features are cover-left, text-right rows; the index is a table (`№ | онова за X | one line | year | arrow`).
- **Per-project accents:** a 3 px left rule and the "за X" tinted with the project text accent. Keep project hues out of 20 to 45 degrees (the hub vermilion).
- **Motion:** almost none: number to arrow swap, cover morph to project page.
- **Risk:** the most common "designed portfolio" trope. Depends on good screenshots and loses the playful voice.

### B. Етикети (the phrase is the UI)
- **Idea:** every project is a flat label reading "онова за" over a big noun. The home page is a wall of labels, like a drawer front or a shelf of jars. The H1 "онова за" is completed by the hovered or focused label's one-line pitch ("онова за разделяне на сметката"), default "онова за малките полезни неща".
- **Palette:** neutrals as in A, but no hub accent. Color comes only from labels, a "paint chart" of 7 hues at fixed lightness and chroma (see table in section 4). Ink text on every fill, at least 7.1:1.
- **Type:** P1. Noun in Extra Condensed 800 lowercase at clamp(2rem, 4vw, 3.5rem); "онова за" in Sofia Sans 600 at 14 to 16 px; slug and year in Martian Mono.
- **Composition:** tight 8 px-gap wall in two sizes only (feature spans 6 columns, regular spans 3). Flat color, no shadow, 2 px radius. Bevel the top-right corner on a background pseudo-element only, so focus rings stay rectangular.
- **Cards:** the label. Top-left "онова за", noun bottom-left, glyph top-right, mono slug and year under the noun.
- **Per-project accents:** the label fill is the accent; the project page inherits it.
- **Motion:** completion swap on hover, label morph to the project header.
- **Risk:** drifts into a toy sticker wall; 7 saturated tiles are a deliberate use of the project-accent exception. Real screenshots are not on the home labels, so the cover must live on the project page or in a hover/focus preview. Needs a list view once there are 15+ projects.

### C. Списък (minimal maker)
- **Idea:** one column of sentences: "онова за сметката. онова за кафето. онова за комина." Each is a link with a one-line description and Latin mono slug. No images on the home page.
- **Palette:** light bg #FCFCFC, ink #121212, muted #5D5D5D (6.4:1), link accent green #007835 (5.6:1). Dark bg #0B0B0B, ink #EEEEEE, muted #A4A4A4 (7.9:1), accent #6ED889 (11.1:1).
- **Type:** Sofia Sans only (2 statics, ~50 KB) plus the system mono stack. Zero JS on the home page.
- **Grid:** single 62 ch column, left aligned. Project names at 28 to 32 px weight 600.
- **Cards:** none. Rows only.
- **Per-project accents:** the project's text accent on hover, focus, and `::selection`; nothing at rest.
- **Motion:** link underline only.
- **Risk:** reads as a template dev portfolio, the exact thing to avoid. Projects are not the visual hero, and social cards and SEO pages look thin.

### Recommendation
Build **B**, with A's discipline and C's performance rules:
- the home page is the label wall (B);
- `/projekti` (or `/all`) is A's compact index table, to scale past 15 projects;
- library and SEO text pages use C's single column.

Fonts P1; neutrals from A; label fills from the paint chart. Why B: the brand IS a phrase with a blank, so the phrase should be the UI device, and a label is the cheapest per-project asset (hue, noun, glyph).

## 4. Per-project identity system

Five fields per project: `noun`, `hue` (0 to 360), `glyph` (one character, usually the noun's first letter set in Extra Condensed), `year`, `cover` (screenshot). Everything else derives from one CSS variable.

```css
.project { --h: 32;
  --fill:   oklch(0.78 0.17 var(--h));   /* labels, heroes; always carries ink text */
  --accent: oklch(0.50 0.17 var(--h));   /* text and strokes on the page bg */ }
.dark .project { --fill: oklch(0.72 0.16 var(--h)); --accent: oklch(0.76 0.14 var(--h)); }
```

Rules (checked by sweeping hue 0 to 355 in 5 degree steps against #F5F7F9 and #0D1013):
- `--accent` as text: light L 0.50 gives at least 5.2:1 for every hue (L 0.52 is the 4.5:1 floor, 4.76). Dark L 0.76 gives at least 8.3:1.
- `--fill` always carries ink (#101419 light, #0D1013 dark). Ink on fill is 8.6:1 or better in light (L 0.78) and 7.1:1 or better in dark (L 0.72).
- Never set `--accent` text on `--fill`, never use `--fill` as text.
- Hues at least 25 degrees apart; skip 270 to 320 (AI-purple territory).
- Cover treatment: real screenshot on a 16 px "mat" of `--fill`, 1 px line, same radius token. Use a dark-mode screenshot in dark mode if the project has one.
- The project's own fonts do not load on the hub. If it has a wordmark, ship it as an outlined SVG.
- OG image from the same fields: Sofia Sans default means correct Bulgarian forms even in Satori.

Paint chart (L 0.78/0.72 fills; accent text L 0.50/0.76):

| Hue | Fill light (ink ratio) | Fill dark (ink ratio) | Text light (vs #F5F7F9) | Text dark (vs #0D1013) |
|---|---|---|---|---|
| vermilion 32 | #FF9782 (8.8) | #F87962 (7.2) | #AF2D18 (6.1) | #FD8D78 (8.4) |
| saffron 75 | #F4A500 (9.0) | #DB9400 (7.5) | #865900 (5.7) | #E4A339 (8.7) |
| lime 125 | #9FC93E (9.6) | #8EB533 (8.0) | #536F00 (5.4) | #9DC056 (9.2) |
| green 155 | #41D686 (9.9) | #35C177 (8.2) | #007742 (5.3) | #5CCB89 (9.4) |
| teal 195 | #00D1D2 (9.7) | #00BCBC (8.1) | #007272 (5.4) | #00CACA (9.4) |
| blue 245 | #71BFFF (9.3) | #3BACFF (7.8) | #0068A5 (5.6) | #61B9FF (9.0) |
| raspberry 355 | #FF8DBC (8.6) | #F075AA (7.1) | #A72A68 (6.2) | #F589B6 (8.3) |

Browsers gamut-map out-of-range chroma while keeping lightness, so contrast holds (I modelled this with chroma clamping).

## 5. Motion principles

Contract: nothing over 400 ms; all of it gated by `prefers-reduced-motion: no-preference` (reduced shows end states and zeroes view-transition durations, using the snippet in the Next guide `node_modules/next/dist/docs/01-app/02-guides/view-transitions.md`). Never animate opacity from 0 on the LCP element.

1. **Completion swap (CSS only):** the H1's completions all sit in one grid cell; `:has(.label:is(:hover,:focus-visible))` fades the active one in over 120 ms ease-out `cubic-bezier(0.2, 0.8, 0.2, 1)`. Only under `@media (hover: hover)`. Text always in the DOM; no layout shift.
2. **Label to project morph:** React `<ViewTransition name={`label-${slug}`} share="morph" default="none">` on the label fill and the project header fill. 350 ms, `cubic-bezier(0.4, 0, 0.2, 1)`. Works in the App Router without config, uses React canary, and degrades to no animation in unsupported browsers (Next docs, same file). It plays only when the destination is in the same commit (prefetched), so keep project pages static.
3. **Link and row hover:** underline grows via `background-size` 0 to 100% in 160 ms; index arrow translates 4 px in 120 ms.
4. **Press:** `:active` translates 1 px in 60 ms. Focus ring appears instantly (no transition), 2 px in `--accent`.
5. **Drawer facts:** `<details name>` with `::details-content` fading opacity and `content-visibility` with `allow-discrete` in 200 ms ease-out. Baseline 2025 per MDN. Name it "ящик" in the UI.
6. **First-load entrance:** label wall rises 8 px with a 40 ms stagger, capped at 8 items, 280 ms, transform only (no opacity), so LCP is not delayed.
7. **Theme switch:** instant. `transition: none` on color properties during the switch, to avoid a flash.
8. **Optional, progressive enhancement:** scroll-progress bar on long library pages via `animation-timeline: scroll()` inside `@supports`. MDN lists scroll-driven animations and cross-document `@view-transition` as not Baseline, so do not depend on either.

## 6. Caveats

- Bulgarian forms in running body copy are a taste call. I did not test with native readers beyond screenshots; the owner should judge the paragraph texture. Untested opt-outs: `font-feature-settings: "locl" 0` for locl-based fonts (Manrope etc.), or `lang="ru"` on a span for Sofia Sans (also affects spellcheck, so avoid).
- Geologica SHRP and Commissioner FLAR/VOLM axes produced no visible change in my Chrome test, so per-project axis tuning is dropped from the system.
- Satori's lack of locl support is from its README via search, not tested.
- Inter v4 was checked only as the Google-served build.
- Test artifacts (specimen pages, fontkit scripts) live in `/tmp/fontcheck` and are not part of the repo.
