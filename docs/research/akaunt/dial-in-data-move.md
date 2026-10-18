# Moving Dial In's on-device data to kafeto.onovaza.com

Research for [#16](https://github.com/HayGrouve/onova-za/issues/16) on map [#12](https://github.com/HayGrouve/onova-za/issues/12). Written 2026-10-19. Context: [ADR 0001](https://github.com/HayGrouve/onova-za/blob/main/docs/adr/0001-one-akaunt-on-onovaza-subdomains.md) (Dial In becomes Онова за кафето at `kafeto.onovaza.com`, `dial-in-three.vercel.app` 308s there).

Read-only work. Sources: the Dial In checkout `~/projects/dial-in` at `049eec2` (same commit as `origin/main` of HayGrouve/dial-in), the live `https://dial-in-three.vercel.app/sw.js`, `registerSW.js` and `manifest.webmanifest` (fetched 2026-10-18, identical to the local `dist/`), and the primary sources linked inline. Nothing was deployed, no Vercel setting was touched.

Tags: **[code]** read in Dial In's source or live build. **[spec]** / **[docs]** quoted from a primary source. **[unverified]** reasoned, or needs a real device or a deploy to confirm.

## 0. Answer in short

1. Nothing moves by itself. IndexedDB and localStorage belong to an origin, and `dial-in-three.vercel.app` and `kafeto.onovaza.com` are not even the same site (`vercel.app` is on the [Public Suffix List](https://publicsuffix.org/list/public_suffix_list.dat)). Chrome's new PWA Origin Migration is same-site only and leaves local data out of scope.
2. A blanket 308 does not reach installed users. Their service worker answers every navigation from cache, and the service worker update fetch treats a redirect as an error. The old app keeps running the last Dial In build forever, with its data, and never hears about Кафето. The data is safe but stranded.
3. Recommended: ship **one last Dial In release** on the old origin that announces the move and moves the data, and in the same deploy **308 only the page routes** (`/`, `/settings`, `/coffee/*`), leaving the service worker files alone. Retire the service worker after the ADR's one-year window.
4. Transfer paths: on Android and desktop Chrome, a direct window-to-window `postMessage` handoff (no file, photos stay Blobs). On iOS a Home Screen web app has its own storage, isolated from Safari and from other web apps, and installing copies only cookies. So on iOS the data must be imported **inside the new Кафето Home Screen app**: the JSON backup file is the only local path. Cloud sync (#17) would replace that step, not the first hop.

## 1. What Dial In stores today [code]

| Data                                 | Where                                                  | In the JSON backup?                                                                                              |
| ------------------------------------ | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| Coffees, each with one bag photo     | IndexedDB `dial-in`, store `coffees` (photo as a Blob) | yes, photo as a base64 data URL                                                                                  |
| Brews                                | IndexedDB `dial-in`, store `brews`                     | yes                                                                                                              |
| Grinder                              | localStorage `dial-in-grinder`                         | yes (`grinder`)                                                                                                  |
| Theme                                | localStorage `dial-in-theme`                           | no                                                                                                               |
| Opus dial on/off, inner ring notch   | localStorage `dial-in-opus-dial`, `dial-in-opus-inner` | no                                                                                                               |
| Gemini API key                       | localStorage `dial-in-gemini-key`                      | no, on purpose ("Stays on this device; never exported in backups", [`prefs.ts`](https://github.com/HayGrouve/dial-in/blob/049eec2/src/lib/prefs.ts)) |

- **Database** ([`src/lib/db.ts`](https://github.com/HayGrouve/dial-in/blob/049eec2/src/lib/db.ts)): Dexie 4.4.6, database `dial-in`, schema version 3. `coffees: 'id, name, roaster, finished, updatedAt'`, `brews: 'id, coffeeId, method, createdAt, [coffeeId+method]'`. Ids are `crypto.randomUUID()`, so records from two devices never collide on merge.
- **Photos**: only the front of the bag is stored, downscaled to at most 1280 px, JPEG quality 0.82 (`compressImage` in [`src/lib/image.ts`](https://github.com/HayGrouve/dial-in/blob/049eec2/src/lib/image.ts), called from [`BagScanner.tsx`](https://github.com/HayGrouve/dial-in/blob/049eec2/src/components/BagScanner.tsx)). The back photo is only sent to Gemini, never stored.
- **Export** (`exportBackup` in [`src/lib/backup.ts`](https://github.com/HayGrouve/dial-in/blob/049eec2/src/lib/backup.ts)): reads every coffee and brew, turns each photo into a data URL, `JSON.stringify`s the lot into one Blob `{ app: 'dial-in', version: 1, exportedAt, coffees, brews, grinder }`, and downloads it with a synthetic `<a download>` click as `dial-in-backup-YYYY-MM-DD.json`. It revokes the object URL on the very next line after `click()`.
- **Import** (`importBackup`): `JSON.parse(await file.text())`, rejects anything without `app === 'dial-in'`, moves pre-v3 per-brew ratings onto coffees, turns data URLs back into Blobs, then `bulkPut`s both tables in one transaction. It merges (same id overwrites, nothing is deleted) and sets the grinder only if none is set, so **running the same import twice is harmless**. It ignores `version`.
- **UI** ([`src/pages/Settings.tsx`](https://github.com/HayGrouve/dial-in/blob/049eec2/src/pages/Settings.tsx), "Your data"): Export backup / Import backup, with "Everything lives only on this device."
- No `navigator.storage.persist()` call anywhere, so Dial In's data is best-effort storage.

## 2. The service worker today [code]

- [`vite.config.ts`](https://github.com/HayGrouve/dial-in/blob/049eec2/vite.config.ts): vite-plugin-pwa 1.3.0 (Workbox 7.4.1), `registerType: 'autoUpdate'`, precache `**/*.{js,css,html,svg,png}`, `navigateFallback: '/index.html'`, fonts CacheFirst. Manifest `id: '/'`, `start_url: '/'`, `scope: '/'`, `display: 'standalone'`.
- Nothing imports `virtual:pwa-register`, so the plugin's default `injectRegister: 'auto'` falls back to a script ([vite-plugin-pwa: register the service worker](https://vite-pwa-org.netlify.app/guide/register-service-worker.html)). The live `/registerSW.js` is one line: on `load`, `navigator.serviceWorker.register('/sw.js', { scope: '/' })`.
- The live `/sw.js`: `self.skipWaiting()`, `clientsClaim()`, `precacheAndRoute([index.html, assets/index-*.js, ...])`, `cleanupOutdatedCaches()`, and `registerRoute(new NavigationRoute(createHandlerBoundToURL('/index.html')))`. **Every in-scope navigation is answered from the precache; the network is never asked.**
- [`vercel.json`](https://github.com/HayGrouve/dial-in/blob/049eec2/vercel.json): SPA rewrite `/(.*)` to `/index.html`; `/sw.js`, `/workbox-*` and `/manifest.webmanifest` served with `max-age=0, must-revalidate`.
- `autoUpdate` without the virtual module does not reload open pages ([vite-plugin-pwa: auto update](https://vite-pwa-org.netlify.app/guide/auto-update.html): without a virtual import "any client tab/window will not be reloaded"). A new release therefore shows on the launch **after** the one that downloaded it.

## 3. What a 308 on the old origin does to an installed copy

1. **Navigations never reach Vercel.** Launching the app and moving around inside it are served by the `NavigationRoute` above [code]. The only browser escape hatch is a shift-reload, which skips the service worker ([Service Workers spec, Handle Fetch](https://w3c.github.io/ServiceWorker/#on-fetch-request-algorithm)), and a Home Screen app has no such gesture.
2. **The update check refuses redirects.** Every navigation triggers a Soft Update ("shouldSoftUpdate" is true for a non-subresource request, [Handle Fetch](https://w3c.github.io/ServiceWorker/#on-fetch-request-algorithm)). The Update algorithm fetches the script with "Set request's redirect mode to "error"" ([Update](https://w3c.github.io/ServiceWorker/#update-algorithm)). A 308 on `/sw.js` becomes a network error, the update job is rejected, and the registration is only removed when there was no worker before ("If newestWorker is null, then remove registration map[...]"). The active worker stays. [spec]
3. **Result:** the installed app keeps running the last Dial In build from cache, with all its data, for as long as the browser keeps the origin's storage. It can never be updated again while `/sw.js` redirects, so it can never be told about Кафето. It ends only when the browser evicts the origin (best-effort data, least-recently-used under storage pressure, all of the origin at once: [MDN storage quotas and eviction](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)), or the user clears site data or uninstalls.
4. **When the service worker is gone** (evicted, self-destroyed, or never installed), a navigation reaches Vercel, gets the 308, and the installed shell shows `kafeto.onovaza.com` as an out-of-scope page with browser UI ([MDN `scope`](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/scope)). The old data still sits on the old origin, but nothing in the UI can reach it.
5. Vercel's two "whole host" tools cover `/sw.js` too: the dashboard domain redirect ([Deploying & redirecting domains](https://vercel.com/docs/domains/working-with-domains/deploying-and-redirecting)) and the documented host-scoped `"source": "/:path*"` rule ([Redirects: redirect the production vercel.app hostname](https://vercel.com/docs/routing/redirects)). **Do not use either while installed copies exist.** [docs; that `/:path*` matches static files such as `/sw.js` is inferred, not tested]
6. **Precache trap** [unverified]: a later service worker that precaches `/index.html` while `/index.html` redirects cross-origin would fetch through the redirect. Vercel's static responses carry `access-control-allow-origin: *` (observed on `/sw.js`), so it could end up caching Кафето's HTML under the old origin. Keep every file a farewell service worker precaches unredirected.

Pre-existing risk, not caused by the move: a user who only ever used Dial In in a Safari **tab** loses all script-writable storage, IndexedDB and service worker included, after 7 days of Safari use without interacting with the site. Home Screen web apps are exempt ([WebKit tracking prevention](https://webkit.org/tracking-prevention/), "Home Screen Web Application Domain Exempt From ITP"; [WebKit, March 2020](https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/)).

## 4. Ways to carry the data across origins

| #   | Option                                    | How                                                                                                                                                                                                                         | Android Chrome                                                                                                                                                   | iOS Home Screen app                                                                                                     | Verdict                         |
| --- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| 1   | JSON backup file (exists)                 | Old app exports, new app imports.                                                                                                                                                                                           | works                                                                                                                                                            | **the only local path into the new app's storage**                                                                     | keep, polish the export         |
| 2   | Push handoff                              | Old app (top level, so first-party storage) calls `window.open('https://kafeto.onovaza.com/prenesi')`, waits for a `ready` message, then posts coffees with their Blobs, brews and prefs with an exact `targetOrigin`; the receiver checks `event.origin`. | works; lands in the Chrome profile the installed Кафето also uses                                                                                                | lands in Safari's (or an in-app browser's) storage, which a Home Screen app does not inherit                            | recommended outside iOS         |
| 3   | Pull handoff                              | Кафето's import screen opens `https://dial-in-three.vercel.app/prenesi` as a popup; that page reads the old IndexedDB and posts to `window.opener`.                                                                          | works; reaches people who never open the old app again                                                                                                            | same container problem as 2                                                                                             | recommended outside iOS         |
| 4   | Hidden iframe of the old origin in Кафето | Read old storage from an embedded frame.                                                                                                                                                                                    | blocked: a cross-site frame sees an empty partition                                                                                                              | blocked                                                                                                                 | reject                          |
| 5   | URL or fragment                           | Encode data in the link.                                                                                                                                                                                                    | 2 MB URL cap, photos do not fit                                                                                                                                  | photos do not fit                                                                                                       | reject (text-only would fit)    |
| 6   | Web Share Target                          | Old app shares the backup file straight into Кафето via its manifest `share_target`.                                                                                                                                       | Chrome Android 76+                                                                                                                                               | not supported in Safari                                                                                                 | optional Android nicety         |
| 7   | Clipboard                                 | Copy JSON in the old app, paste in the new one. System-wide, so it would cross iOS containers.                                                                                                                              | untested for tens of MB                                                                                                                                          | untested for tens of MB                                                                                                 | not recommended [unverified]    |
| 8   | One-time relay                            | Old app uploads an encrypted bundle and gets a short code; Кафето downloads with the code.                                                                                                                                  | works                                                                                                                                                            | works without files                                                                                                     | only if #17 brings Convex       |
| 9   | Chrome PWA Origin Migration               | `migrate_from` / `migrate_to` manifest fields plus `/.well-known/web-app-origin-association`, Chrome 150.                                                                                                                   | moves the installation only, same-site only                                                                                                                       | Chrome only                                                                                                             | not applicable                  |

Evidence per row:

- **2 and 3 on Android**: a WebAPK runs in the user's Chrome profile: "Chrome uses the current profile to store any data", "Cookies are shared and active, any client side storage is accessible and the service worker is installed" ([web.dev: WebAPKs on Android](https://web.dev/articles/webapks), 2017). So a handoff done in a Chrome tab fills exactly the storage the installed Кафето will open. Structured clone carries `Blob` and `File` ([MDN structured clone](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm)); always set `targetOrigin` and verify `event.origin` ([MDN `postMessage`](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage)). The Кафето page must not send `Cross-Origin-Opener-Policy: same-origin`, which puts it in a new browsing context group and severs `window.opener` ([MDN COOP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cross-Origin-Opener-Policy)); the old origin sends no COOP today (observed).
- **3, a catch**: a client still on the old service worker gets the old cached app for its first navigation to `/prenesi` (the `NavigationRoute` answers every path, and the old app renders its "Nothing brewing here" route). That navigation also downloads the new service worker, so the opener should retry once by navigating the popup again. [code + spec]
- **2 and 3 on iOS**: "the website data of home screen web applications is kept isolated from Safari" ([WebKit tracking prevention](https://webkit.org/tracking-prevention/)); "Home Screen apps are created as isolated entities without shared state with the browser" (Brent Fulgham, [WebKit Bugzilla 181849](https://bugs.webkit.org/show_bug.cgi?id=181849), 2022-02-01: "The current behavior (on Apple platforms) is by design."). On Add to Home Screen, iOS 17.2+ copies cookies only: "No other kind of local storage is copied over" ([WebKit features in Safari 17.2](https://webkit.org/blog/14787/webkit-features-in-safari-17-2/)).
- **4**: third-party IndexedDB, localStorage, Cache and service workers are keyed by top-level site in Chrome 115+ ([Chrome storage partitioning](https://privacysandbox.google.com/cookies/storage-partitioning)), Firefox 103+ ([MDN state partitioning](https://developer.mozilla.org/en-US/docs/Web/Privacy/Guides/State_Partitioning)) and Safari ([WebKit tracking prevention](https://webkit.org/tracking-prevention/)). The Storage Access API's `types: { indexedDB: true }` can unlock it, but only in Chrome and Chrome Android 125+, not Safari or Firefox ([browser-compat-data](https://github.com/mdn/browser-compat-data/blob/main/api/Document.json), `requestStorageAccess.types`), and only after a user gesture and browser checks ([MDN `requestStorageAccess`](https://developer.mozilla.org/en-US/docs/Web/API/Document/requestStorageAccess)).
- **5**: "Chrome limits URLs to a maximum length of 2MB" ([Chromium URL display guidelines](https://chromium.googlesource.com/chromium/src/+/main/docs/security/url_display_guidelines/url_display_guidelines.md)).
- **6**: `share_target` is Chrome 89 / Chrome Android 76, Safari none ([browser-compat-data](https://github.com/mdn/browser-compat-data/blob/main/manifests/webapp/share_target.json)).
- **9**: "This feature is currently limited to _same-site_ migrations (sharing the same eTLD+1)" ([Chrome blog, 2026-06-03](https://developer.chrome.com/blog/seamless-pwa-origin-migration)); "User data stored locally (e.g., in IndexedDB, Cache Storage) is not within the scope of this migration" ([WICG explainer](https://github.com/WICG/manifest-incubations/blob/gh-pages/pwa-migration-explainer.md)). `dial-in-three.vercel.app` is its own site because `vercel.app` is a public suffix. Also, Dial In's manifest `id: '/'` resolves against the old origin, so Кафето is a distinct app to every browser ([MDN `id`](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/id)).

### Size limits with photos

- **JSON file**: the whole library is one string in memory, and base64 adds a third to every photo. Maximum string length is about 1 GiB in V8, 2 GiB in Firefox, 4 GiB in Safari ([MDN `String.length`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/length)), so phone memory is the real limit: export and import each hold the data two or three times (string, parsed objects, Blobs). [reasoned]
- **Rough size** [unverified estimate, measure before deciding]: a 1280 px JPEG at quality 0.82 is usually 100 to 300 KB, so 100 coffees come to about 15 to 40 MB of JSON. Brews are a few hundred bytes each.
- **postMessage**: no size limit in the spec, and Blobs travel as Blobs (no base64). Send one message per coffee or per batch to keep memory flat.
- **Quota on the new origin** is not a constraint: Chromium allows up to 60% of disk per origin; on iOS 17+ and macOS 14+ a browser or Home Screen web app gets about 60% ([MDN storage quotas](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria), [WebKit storage policy, 2023](https://webkit.org/blog/14403/updates-to-storage-policy/)). Кафето should call `navigator.storage.persist()`: WebKit "grants a request based on heuristics like whether the website is opened as a Home Screen Web App" (same post).

## 5. Platform differences that matter

**Android Chrome**

- The installed app and Chrome tabs share one profile ([web.dev: WebAPKs](https://web.dev/articles/webapks)), so the push and pull handoffs work end to end.
- The installed Dial In cannot become Кафето (cross-site, see row 9). The user installs Кафето and removes Dial In.
- While `/manifest.webmanifest` stays unredirected, the last release can rename the old icon (for example "Dial In (старо)"): Chrome checks the manifest at launch at most once a day and regenerates the WebAPK "after all PWA windows close and the device is plugged in, and connected to WiFi"; after failed checks it may back off to 30 days ([web.dev: manifest updates](https://web.dev/articles/manifest-updates)).

**iOS and iPadOS**

- Each Home Screen web app has its own website data, isolated from Safari and exempt from the 7-day cap ([WebKit tracking prevention](https://webkit.org/tracking-prevention/)).
- Installing copies cookies only, never IndexedDB or localStorage ([Safari 17.2](https://webkit.org/blog/14787/webkit-features-in-safari-17-2/)). A freshly added Кафето starts empty whatever the user did in Safari.
- There is no install prompt API; the user adds the site from the Share menu. Since iOS 26 every site added to the Home Screen opens as a web app by default ([WebKit features in Safari 26.0](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/)).
- So on iOS the move must end with **Import inside the new Home Screen app**. The smoothest file path is the Web Share API with files (`navigator.share({ files })`, Safari 14+, per [browser-compat-data](https://github.com/mdn/browser-compat-data/blob/main/api/Navigator.json)) to "Save to Files", then Import in Кафето.
- [unverified] Where `window.open` and out-of-scope navigations from a Home Screen app open (Safari, or an in-app sheet) and with which storage. No Apple or WebKit document found; needs an iPhone.
- [unverified] Whether today's `<a download>` export, which revokes the blob URL immediately after `click()`, actually saves a file inside an iOS Home Screen app. `download` itself is iOS 13+ ([browser-compat-data](https://github.com/mdn/browser-compat-data/blob/main/html/elements/a.json)).

**Elsewhere**: macOS Safari "Add to Dock" web apps behave like iOS: cookies copied once, "no other website data is shared" ([WWDC23 WebKit post](https://webkit.org/blog/14205/news-from-wwdc23-webkit-features-in-safari-17-beta/)). Desktop Chrome and Edge installed apps are assumed to share the browser profile like Android [unverified].

## 6. Recommended move (no cloud sync assumed)

Order matters: Кафето has to be able to receive before Dial In starts sending.

1. **Кафето ships ready to receive.**
   - Imports the legacy backup: `app: 'dial-in'`, `version: 1`. Treat that shape as a frozen contract and keep accepting it for the life of the old domain.
   - A `/prenesi` receiver for the push handoff, with exact origin checks both ways and idempotent `bulkPut` by id, plus a "pull" button for row 3.
   - Calls `navigator.storage.persist()`.
   - No `Cross-Origin-Opener-Policy: same-origin` on the receiver page.
2. **One last Dial In release on the old origin** (the `dial-in` Vercel project stays alive). On launch it shows "Dial In вече е Онова за кафето" with:
   - **Пренеси в Кафето**: the push handoff. Hidden inside an iOS Home Screen app, where it would fill the wrong container.
   - **Запази копие**: the JSON via `navigator.share({ files })` when `navigator.canShare` allows it, else a download that revokes the URL later. On iOS this is the main path, with the steps spelled out: add kafeto.onovaza.com to the Home Screen, open it, Import.
   - Carry theme and Opus prefs too (today's backup drops them). Leave the Gemini key behind, as the backup always has, unless the user opts in.
   - Never deletes local data, so the move can be repeated; remembers that it moved, to change the banner.
   - A `/prenesi` page for the pull handoff.
3. **Same deploy: 308 only the page routes.** In the `dial-in` project's `vercel.json`:

   ```json
   {
     "redirects": [
       {
         "source": "/",
         "has": [{ "type": "host", "value": "dial-in-three\\.vercel\\.app" }],
         "destination": "https://kafeto.onovaza.com/",
         "permanent": true
       },
       {
         "source": "/settings",
         "has": [{ "type": "host", "value": "dial-in-three\\.vercel\\.app" }],
         "destination": "https://kafeto.onovaza.com/<settings route>",
         "permanent": true
       },
       {
         "source": "/coffee/:path*",
         "has": [{ "type": "host", "value": "dial-in-three\\.vercel\\.app" }],
         "destination": "https://kafeto.onovaza.com/<coffee route>/:path*",
         "permanent": true
       }
     ]
   }
   ```

   `permanent: true` is a 308 and `has` supports `host` ([vercel.json reference](https://vercel.com/docs/project-configuration/vercel-json#redirects); host-scoped rules keep preview URLs untouched, per [Vercel redirects](https://vercel.com/docs/routing/redirects)). The `<...>` parts depend on Кафето's routes.

   Left unredirected: `/sw.js`, `/registerSW.js`, `/workbox-*.js`, `/index.html`, `/assets/*`, `/manifest.webmanifest`, the icons, and `/prenesi`. New visitors and crawlers get the 308; installed copies and returning tabs get the last release through their service worker, and see it on their second launch. Before shipping, confirm on a preview deployment with `curl -I` that `/` and `/coffee/x` 308 while `/sw.js` and `/index.html` return 200 [unverified: precedence between these redirects, the static `index.html` and the SPA rewrite was not tested]. A 308 is "cached by client" ([Vercel redirects](https://vercel.com/docs/routing/redirects)), so mistakes are sticky: test first.

4. **Retire later**, after the ADR's year and once `/sw.js` traffic on the old host is low. Deploy a self-destroying worker at the same `/sw.js` URL (vite-plugin-pwa `selfDestroying: true`, which warns "DO NOT CHANGE THE SERVICE WORKER NAME", [unregister guide](https://vite-pwa-org.netlify.app/guide/unregister-service-worker.html); or the no-op worker with no `fetch` handler from [Workbox: remove buggy service workers](https://developer.chrome.com/docs/workbox/remove-buggy-service-workers)), then widen the redirect. Unregistering leaves IndexedDB alone (the spec's [Clear Registration](https://w3c.github.io/ServiceWorker/#clear-registration-algorithm) only terminates workers), so the data stays, just unreachable. Keep `/prenesi` unredirected for as long as the domain lives, if it costs nothing.
   - **Never** send `Clear-Site-Data: "storage"` or `"*"` from the old origin: it deletes IndexedDB and localStorage and unregisters service workers ([MDN `Clear-Site-Data`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Clear-Site-Data)).

### Trade-offs

| Approach                                     | For                                                                                         | Against                                                                                                                                                                                                         |
| -------------------------------------------- | ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Whole-host 308 now (the ADR read literally)  | one setting, matches the ADR word for word                                                  | installed users silently stuck on the old build forever; the service worker can never be updated while `/sw.js` redirects; anyone whose worker is gone lands in an empty Кафето with the data out of reach |
| **Route-only 308 + last release** (proposed) | every user is told; data moves in the app; nothing is deleted; reversible until step 4      | the `dial-in` deploy stays alive for a year or more; two transfer paths to build (handoff and file)                                                                                                             |
| File only, no handoff                        | no new protocol                                                                             | two manual steps for everyone, Android too                                                                                                                                                                      |

The proposal still satisfies ADR 0001: every page address on the old host 308s to Кафето. Only the service worker plumbing is exempt.

## 7. Where cloud sync (#17) changes the answer

- The first hop does not change. The old origin cannot sign in (one Clerk production app on onovaza.com; `dial-in-three.vercel.app` is outside it, and satellite domains were rejected in ADR 0001), so getting data from old to new is still a local `postMessage` or file.
- Sync removes the iOS container problem: hand off in Safari or on any device, sign in, sync uploads, then the Кафето Home Screen app signs in and downloads. iOS 17.2+ copies cookies at install, which may even keep the user signed in [unverified for Clerk, whose session spans the app's subdomain and Clerk's own API domain].
- Photos then need blob storage in Convex, so the size estimate in §4 turns into a storage-cost question.
- A one-time relay (row 8) becomes cheap once Convex is there, and is an alternative to sync for the move alone.

## 8. Open uncertainties

- **iOS behaviour inside a Home Screen app**: where `window.open` and out-of-scope navigations land, and whether the current `<a download>` export works. Test on a real iPhone on iOS 26.
- **Vercel routing**: that the route-only redirects 308 `/`, `/settings`, `/coffee/*` and leave `/sw.js` and `/index.html` alone, given the SPA rewrite. Test on a preview deployment.
- **Desktop Chrome and Edge**: that the installed app window shares storage with tabs (assumed, as on Android).
- **Real sizes and real users**: photo and library sizes, and how many people actually have Dial In installed. The app has no analytics; the `dial-in` project's Vercel observability could count `/sw.js` requests. If the only users are the owner and a few friends, a banner plus export and import may be enough.
- **Clipboard** as an iOS channel for large payloads.
- **Chrome PWA Origin Migration** is same-site only today; the explainer says cross-origin migration "may" be explored later.
