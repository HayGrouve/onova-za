<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Agent workflow

1. **`CONTEXT.md`**: glossary (за-фраза, Чие, Статус...). Use these words in code and copy.
2. **`docs/strategy.md`**: brand, IA, SEO, design principles. Research behind it lives in `docs/research/`.
3. Content is data: `src/content/projects/<slug>/index.ts` validated by `src/lib/project-schema.ts`. Never hard-code a project in JSX.
4. Copy is Bulgarian, informal "ти", no em or en dashes (a test enforces it for project data).
5. Verify: `pnpm run ci:preflight`, then look at the page in a browser in light and dark.
