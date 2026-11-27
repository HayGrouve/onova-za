# Hub homepage concepts: evaluation

The homepage became the entry point of a hub once one Акаунт signed you in to every own project. Three prototypes were built from `docs/hub-concepts-brief.md` with the same data and compared at 1440x900 and 390x844, light and dark. The prototype code was removed once the decision was made.

|                 | A. Витрина                                                                                                       | B. Бенто                                                                                      | C. Стартер                                                                                            |
| --------------- | ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Idea            | Landing page: "онова за ___" fills in beside a stage that shows the matching real screenshot, then a scroll tour | Calm product-suite page: plain headline over a mixed-size grid of project tiles and hub tiles | The hub as a launcher: an app-icon grid in the hero, then shelves grouped by how you use each project |
| First 5 seconds | **Best.** The brand mechanic and a real app on screen say what this is                                           | Clear, but the headline could belong to any studio                                            | Clear and hub-like, though the 4-line headline is heavy                                               |
| Акаунт story    | A tidy hub-and-projects diagram in its own strip                                                                 | A tile beside the lead project                                                                | **Best.** Projects are grouped by it: "С един Акаунт", "Без регистрация", "За компютъра"              |
| Browsing        | Weak: the tour is about 8,000 px on desktop with one project per screen                                          | Dense and complete, but the grid leaves empty zones and reorders the registry                 | **Best.** Even cards with two clear actions ("Отвори" and "Повече")                                   |
| Finish          | Good stage and frames                                                                                            | **Best** surfaces, radii and dark mode                                                        | Good; the monogram icons ("См", "Ку") read as toy-like and repeat every project a second time         |
| Scale (15 / 30) | Hero capped at 6; the tour would need a cap                                                                      | Most tiles turn 1x1; needs filters at 30                                                      | Shelves scroll sideways with scroll-snap; a per-shelf limit at 30                                     |
| Score           | 7                                                                                                                | 7.5                                                                                           | 8                                                                                                     |

## Decision

**A's hero on C's shelves**, finished with B's surfaces:

1. **Hero (A):** "онова за ___" with the blank cycling through the за-фрази, and a stage beside it showing that project's real screenshot. The за-фрази under the stage pick a project by hand. One paragraph says what you landed on, then "Разгледай проектите" and Вход (or "Към Акаунта" once the cookie says you are signed in).
2. **Shelves (C):** projects grouped by how you use them, derived from the data. "С един Акаунт" opens with A's three Акаунт facts. A "За клиенти" shelf appears only when client work exists.
3. **Cards (C, with B's finish):** a tinted well with the real screenshot, "онова за {за}", status as a word, the address, the pitch, "Отвори" and "Повече".
4. **Closing (C):** the dictionary definition of "онова за", plus "Всички проекти" and "Пиши ми".

Dropped: the tour (too long), the bento packer (the shelves are simpler and keep the registry order), and the launcher icons (they repeat the cards).
