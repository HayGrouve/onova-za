# онова за

Shared language for the project hub. Strategy and reasoning: `docs/strategy.md`.

## Language

**Проект** (project):
One thing the owner made, own or for a client, with its own page at `/proekti/<slug>`.
_Avoid_: product (too narrow), case study, work item, portfolio piece

**За-фраза** (`za`):
The lowercase noun phrase that completes "онова за ___" for a project: "сметката", "кафето", "мебелите". The brand's unit; the biggest text on every card.
_Avoid_: tagline, subtitle, category

**Име** (`name`):
The product's own name ("Dial In", "Iliaora"). Shown next to the за-фраза, never instead of it.

**Pitch**:
What the project does, in one plain sentence. Shown on cards.
_Avoid_: description (that is the meta description, a different field)

**Библиотека** (library):
The homepage: every project, grouped Мои then За клиенти.
_Avoid_: portfolio, dashboard, feed

**Индекс** (index):
`/proekti`, the dense table of every project with status, type, years and domain.

**Чие** (`owner`):
`own` (Мое) or `client` (За клиент). Client work always names the client.

**Статус** (`status`):
`live` (На живо), `building` (В правене), `experiment` (Експеримент), `archived` (Архив). Always shown as a word, never colour alone.

**Вид** (`type`):
`app` (Приложение), `site` (Сайт), `system` (Система, a business back-office), `desktop` (Десктоп).

**Тема** (`topics`):
Internal grouping used for related projects and, once a topic has 3+ projects, topic pages. Never shown on cards.

**Цвят** (`hue`):
The project's OKLCH hue. Lightness and chroma come from the theme, so any hue outside 270 to 320 passes contrast.
_Avoid_: brand colour (the hub does not copy each product's palette)
