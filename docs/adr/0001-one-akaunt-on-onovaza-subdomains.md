# One Акаунт: one Clerk app, every project on a subdomain of onovaza.com

Every own project with sign-in shares one Акаунт: a single Clerk production application ("онова за") on onovaza.com, with each project hosted at `<name>.onovaza.com` and `onovaza.com/<name>` 308-redirecting there so the address you say and print still reads "онова за сметката". One user pool means one sign-up across every project. Subdomains get that without Clerk's paid satellite domains, and without rebuilding each app to live under a path prefix.

## Considered Options

- **Paths** (`onovaza.com/smetkata`, via Vercel Microfrontends or hub rewrites): the address bar reads best, but every app must be rebuilt around a base path (Next.js children do not support `basePath`, the Vite plugin is experimental, TanStack Start is not listed), the hub becomes the routing root for everything, and all apps share one origin, so one app's XSS reaches every app's browser data.
- **Apps keep their own domains as Clerk satellite domains**: paid Clerk feature, more moving parts, and the "онова за" family stays scattered across domains.
- **Hub as an identity provider** ("Влез с онова за" via OIDC, one Clerk instance per app): most decoupled, but duplicate user records per app and the most setup.

## Consequences

- `docs/strategy.md` §5 "product domains stay canonical" is reversed: armyant.app, onova-za-smetkata.com and the `*.vercel.app` addresses 308 to the subdomain. onovaza.com is the only domain going forward.
- The old domains are not renewed (decided 2026-11-09): they redirect until their registration runs out (armyant.app 2027-02-24, onova-za-smetkata.com 2027-07-08) and then lapse. Each project's cutover lands before its old domain expires, and by then nothing that matters points at it: no working share tokens in old links, no contact address on it. The free `*.vercel.app` addresses keep their redirect for at least a year.
- Each project keeps its own Convex deployment, its own data and its own payments; all of them trust the one Clerk issuer. The hub has no database.
- The Акаунт is optional wherever a project works without stored data. Deleting it is global: each project removes its own data on Clerk's `user.deleted`.
- Sign-in is Google plus an email code; no passwords, no Apple.
- Chef becomes Онова за кухнята (`kuhnyata`) and Dial In becomes Онова за кафето (`kafeto`). Dial In's on-device data is tied to its old origin and has to be moved.
- Signing in to the hub adds a nav entry and `/akaunt`, nothing more: no "твоите проекти" list.
