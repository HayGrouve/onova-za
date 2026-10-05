# Homepage concepts: evaluation

Three prototypes were built from `docs/concepts-brief.md` with the same data, then compared at 1440x900 and 390x844, light and dark (screenshots were in `/tmp/concepts/`, the prototype code was removed once the decision was made).

|                       | A. Каталог                                                                                                                    | B. Етикети                                                                                                                    | C. Изречение                                                                                                        |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Idea                  | Editorial catalogue: giant wordmark, serif deck, three colour-plate features, then a ruled index                              | A wall of flat labels: "онова за" over a huge noun on the project colour; the H1 is "онова за ___" and fills in on hover      | The page is one sentence that keeps completing itself: "онова за сметката. онова за кухнята." with a sticky preview |
| Brand strength        | Good. The wordmark is strong, but the vermilion accent competes with project hues (12, 38) and the serif adds a fourth family | **Best.** The label is the brand device everywhere (hero, cards, closing, project page, OG image); each project owns a colour | Strong typographic voice, but colour only appears on hover                                                          |
| Usability             | Clear, but about 2,000px of features before the full list                                                                     | Every label reads in 3 seconds: phrase, noun, name, pitch, status, client tag                                                 | Very readable; on mobile the thumbnails are small                                                                   |
| Scalability (20 / 50) | Index scales well; features stay at 3                                                                                         | Works at 20; at 50 needs the planned chips and search (already in the strategy at 15+ and 30+)                                | Rows are about 200px each; at 50 the page is very long                                                              |
| Discoverability       | Index shows status and years                                                                                                  | Groups Мои / За клиенти; status and client tag on every label                                                                 | Groups, status, years                                                                                               |
| SEO                   | Equal: all three are server-rendered with one link per project                                                                | Equal                                                                                                                         | Equal                                                                                                               |
| Mobile                | Fine, long                                                                                                                    | Fine, one label per row, nothing hidden                                                                                       | Good, thumbnails help                                                                                               |
| Uniqueness            | Medium: editorial magazine layouts are a known genre                                                                          | **High**: the fill-in-the-blank mechanic is specific to this name                                                             | High, though big-type hover lists exist                                                                             |
| Complexity            | Medium (three feature layouts, extra font)                                                                                    | Low to medium (one component, CSS-only hero swap)                                                                             | Low (one row component, CSS-only preview)                                                                           |

## Decision

**B, "Етикети"**, with two parts borrowed:

- **From A:** the ruled index becomes `/proekti` (the dense table and owner's dashboard: phrase, name, pitch, type, status, years, address).
- **From C:** the single reading column and the dictionary entry ("Дай ми онова за отваряне на бутилки.") for project pages and About.

Changes on top of the prototype:

1. Client work needs evidence too: Iliaora and the furniture catalogue become featured labels with screenshots, so each group has visuals and an even grid.
2. Project colours drop to enamel chroma (0.12 light, 0.105 dark) across the site and OG images, at the same lightness, so contrast is unchanged and eleven slabs do not shout.
3. `--fill` and `--tint` are recomputed on every `[data-accent]` element (all three prototypes hit the `:root` resolution bug).
4. Коминочистач moves from hue 12 (read as pink) to 50, close to its own orange site.
5. The label morphs into the project page header with a React `<ViewTransition>`.
