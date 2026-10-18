# Local-first sync for Кафето: IndexedDB and Convex

Research for [#21](https://github.com/HayGrouve/onova-za/issues/21) on map [#12](https://github.com/HayGrouve/onova-za/issues/12). Written 2026-10-19. Behaviour to build is decided in [#17](https://github.com/HayGrouve/onova-za/issues/17): offline-first on each device, background sync when online, later edit wins per bag or brew, delete beats edit, first sign-in merges the device's log into the Акаунт, sign-out clears the device (warn if unsynced), bags, brews, photos and equipment sync, the Gemini key and theme stay on the device, Clerk free plan, signing in is optional. Architecture from [ADR 0001](https://github.com/HayGrouve/onova-za/blob/main/docs/adr/0001-one-akaunt-on-onovaza-subdomains.md): one Clerk production instance on onovaza.com, each project with its own Convex deployment. Related: [#14](https://github.com/HayGrouve/onova-za/issues/14) (Convex on the shared Clerk instance, key users by `subject`, `user.deleted` per project), [#13](https://github.com/HayGrouve/onova-za/issues/13) (Clerk free plan, 7-day sessions, session shared across `*.onovaza.com`), [#16](https://github.com/HayGrouve/onova-za/issues/16) (the owner's data moves by JSON export and import).

Read-only work: nothing installed, deployed or signed up for. Sources: the Dial In checkout `~/projects/dial-in` at `049eec2` (same as `origin/main` of HayGrouve/dial-in), Convex docs (fetched as Markdown 2026-10-19), convex-js at `322c395` and the installed convex 1.46.0 in Клиентите, Dexie's docs source (`dexie/dexie-web` at `bda611b`), Dexie.js at `f1df3cd`, the npm registry, MDN browser-compat-data.

Tags: **[docs]** current vendor docs (linked), **[source]** vendor source code or registry, **[code]** read in Dial In, **[unverified]** reasoned, estimated, or not checked against a primary source.

## 0. Answer in brief

1. **Recommended: hand-rolled sync between Dexie and a new Convex deployment for Кафето.** Dexie stays the only thing the UI reads. Every local write also writes an outbox entry in the same transaction. When signed in and online, a push mutation sends the outbox, and a reactive Convex query pulls everything after a per-Акаунт change sequence. The server applies later-`updatedAt`-wins per record and keeps tombstones so a delete always wins. Photos go to Convex file storage, uploaded from the outbox when online. This fits ADR 0001 (own Convex, one issuer, `user.deleted` handler as in #14), costs nothing at small scale, and the sync rules are ours. The price is about a few hundred lines of sync code we must own and test **[unverified estimate]**.
2. **Dexie Cloud with Clerk works, but costs more and fits worse.** Clerk can only plug in through `fetchTokens` and a server endpoint of ours that swaps a verified Clerk token for a Dexie Cloud token **[docs]**. It gives the #17 behaviour almost for free (logged-out data is adopted on first sign-in, logout warns about unsynced changes and clears the device, blobs offload to cloud storage) **[docs + source]**. But the free plan has 3 production users and 100 MB of storage; other users get 30 active days of sync, then stop syncing until they are made production users at €0.12 a month each **[docs]**. It adds a vendor and processor (Azure US East), its server is closed unless you buy the €7,995 licence, and synced tables cannot use `Version.upgrade()` **[docs]**.
3. **The Convex client alone is not offline-first.** It keeps pending mutations in memory, replays them on reconnect, and only warns on page close; nothing survives a reload **[source]**. PowerSync's Convex support is experimental (June 2026) and reads through Convex streaming export, which requires Convex Pro **[docs]**.
4. **Data changes:** `updatedAt` on brews (backfilled from `createdAt`); an `outbox` table; equipment moved from localStorage into a synced single-record table; a `syncMeta` table (which Акаунт the device's log belongs to, change cursor, clock offset); a `photoKey` on bags. Server side: soft-deleted rows as tombstones, a per-Акаунт `seq` counter as the change cursor, client UUIDs stored next to Convex's own `_id`.
5. **Photos:** Convex file storage. Uploads need the network (an upload URL is minted by a mutation and expires after 1 hour), so a photo taken offline waits in the outbox as the Blob it already is. The free plan's 1 GB of file storage and 1 GB a month of file egress are **per team**, shared with every other Convex project on the owner's team; Starter lifts the cap at $0.033 per GB-month stored and $0.132 per GB served **[docs]**. At about 200 KB a bag photo, 1 GB holds about 5,000 bags **[unverified estimate]**.

## 1. What Dial In has today

All **[code]**, `049eec2`.

| Data | Where | Shape | In the JSON backup |
| --- | --- | --- | --- |
| Bags (`Coffee`) | IndexedDB `dial-in`, store `coffees` | UUID `id`, label fields, `rating`, `finished`, `photo?: Blob`, `createdAt`, **`updatedAt`** | yes, photo as a data URL |
| Brews (`Brew`) | store `brews` | UUID `id`, `coffeeId`, method and recipe fields, `dialedIn`, `createdAt`, **no `updatedAt`** | yes |
| Grinder | localStorage `dial-in-grinder` | string | yes |
| Opus dial on/off | localStorage `dial-in-opus-dial` | `'1'` or absent | no |
| Opus inner ring | localStorage `dial-in-opus-inner` | integer, -6 to +6 | no |
| Gemini key | localStorage `dial-in-gemini-key` | string | no, on purpose |
| Theme | localStorage `dial-in-theme` | `light`, `dark` or absent | no |

- **Schema** ([`src/lib/db.ts`](https://github.com/HayGrouve/dial-in/blob/049eec2/src/lib/db.ts)): Dexie 4.4.6, version 3. `coffees: 'id, name, roaster, finished, updatedAt'`, `brews: 'id, coffeeId, method, createdAt, [coffeeId+method]'`. `newId = () => crypto.randomUUID()`, so records from two devices never collide.
- **Every write site** (all must go through the sync layer):
  - [`CoffeeForm.tsx`](https://github.com/HayGrouve/dial-in/blob/049eec2/src/pages/CoffeeForm.tsx) lines 63 and 67: `db.coffees.update(id, { ...draft, updatedAt: now })`, `db.coffees.add(coffee)`.
  - [`BrewForm.tsx`](https://github.com/HayGrouve/dial-in/blob/049eec2/src/pages/BrewForm.tsx) lines 96, 97, 103: `db.brews.put(brew)` (whole record), `setDialedIn`, `db.brews.delete(brewId)`.
  - [`CoffeeDetail.tsx`](https://github.com/HayGrouve/dial-in/blob/049eec2/src/pages/CoffeeDetail.tsx) lines 28, 29, 32: `finished` toggle and `rating`, both stamping `updatedAt`; `deleteCoffee`.
  - `db.ts`: `setDialedIn` clears `dialedIn` on every other brew of the same bag and method, sets it on one brew, **and bumps the bag's `updatedAt`**; `deleteCoffee` deletes the bag's brews and the bag in one transaction.
  - [`backup.ts`](https://github.com/HayGrouve/dial-in/blob/049eec2/src/lib/backup.ts): `importBackup` `bulkPut`s coffees and brews ("entries with matching ids are overwritten") and sets the grinder only if none is set.
  - [`prefs.ts`](https://github.com/HayGrouve/dial-in/blob/049eec2/src/lib/prefs.ts): `setGrinder`, `setOpusDial`, `setOpusInner` (called from [`OpusDial.tsx`](https://github.com/HayGrouve/dial-in/blob/049eec2/src/components/OpusDial.tsx) when you confirm a ring move), `migrateGrinder`.
- **Reads** are all `useLiveQuery` over the two tables (Home, CoffeeDetail, CoffeeForm, BrewForm, Settings). Home sorts bags by `updatedAt`, which is why `setDialedIn` bumps it.
- **Photos:** only the front of the bag is kept, scaled to at most 1280 px, JPEG quality 0.82 (`compressImage` in [`image.ts`](https://github.com/HayGrouve/dial-in/blob/049eec2/src/lib/image.ts)), stored as a Blob on the bag. The back photo only goes to Gemini.

Two consequences for sync:

- `setDialedIn` bumping the bag's `updatedAt` turns a brew action into a bag edit. Under whole-record last-write-wins, marking a brew on the phone would push the phone's copy of the bag and could overwrite a notes edit made on the laptop a minute earlier. The bag's clock should only move when the bag itself changes; Home can sort by the later of `updatedAt` and the bag's newest brew (it already loads every brew). **[reasoned]**
- `BrewForm` saves with `put`, so a brew edit is naturally a whole-record write, which matches #17's "later edit wins per brew".

## 2. The options

| | Hand-rolled: Dexie + Кафето's own Convex | Dexie Cloud, Clerk via `fetchTokens` | Convex client only | PowerSync on Convex |
| --- | --- | --- | --- | --- |
| Cost, small user base | $0 on Convex Free; Starter is pay-as-you-go with no base fee | €0 for 3 production users and 100 MB; then €0.12 per user a month (€3 per 25 seats); a Vercel Function for tokens | $0 | Convex Pro ($25 per developer a month) for streaming export, plus PowerSync |
| Offline across restarts | yes: Dexie is the source of truth, outbox persists | yes, built in; Background Sync through its service worker where supported | **no**: pending mutations live in memory only | yes (SQLite on the client) |
| #17 rules | ours to write: LWW per record, delete wins, merge on first sign-in, clear on sign-out | mostly built in: per-property LWW for `update()`, whole-record for `put()`; adopts logged-out data on login; logout warns and clears | n/a | ours, in Convex mutations |
| Clerk | native (`ConvexProviderWithClerk`, same issuer as every project, #14) | only through our token endpoint (or Clerk as a custom OIDC provider, a second redirect sign-in) | native | not documented |
| ADR 0001 | fits: own Convex, `user.deleted` handler like Сметката | a second backend vendor and processor, deletion through Dexie's REST API | fits | needs Pro |
| Lock-in | low: our protocol; Convex backend is open source (FSL, Apache 2.0 after two years) | medium: hosted server is closed; self-host €3,495 (Business) or €7,995 with source; client code shaped by realms | low | high, experimental |
| Work | most: sync engine, photo queue, tests | least for sync, plus token endpoint and deletion webhook | n/a | rewrite on SQLite |

### 2.1 Convex facts

- **Plans.** "Limits are applied per team unless stated otherwise." Free: 1,000,000 function calls a month total, 0.5 GB database storage, 1 GB database I/O a month, 1 GB file storage ("Includes user files and backups"), 1 GB file egress a month ("Includes serving user files, accessing user files inside functions, and generating and restoring backups"), 40 deployments per team. "Explicit client calls, scheduled executions, subscription updates, and file accesses count as function calls." "After these limits are hit on the Free plan, new mutations that attempt to commit more insertions or updates may fail." Starter shares the limits as included amounts and bills beyond them: $2.20 per extra million calls, $0.22 per GB-month database, $0.033 per GB-month files, $0.132 per GB file egress. **[docs]** [Limits](https://docs.convex.dev/production/state/limits), [pricing](https://www.convex.dev/pricing) ("Free or $0/month and pay as you go").
- **Documents and transactions.** Documents up to 1 MiB; a mutation may write 16,000 documents and 16 MiB; arguments up to 16 MiB. **[docs]** [Limits](https://docs.convex.dev/production/state/limits). So photos never go inside documents.
- **Ids.** Every document's `_id` "is automatically generated by the system" **[docs]** [Document IDs](https://docs.convex.dev/database/document-ids); Dial In's UUIDs must be stored in a field of their own (`clientId`) with an index.
- **Ordering and time.** From the React client, mutations "are executed one at a time in a single, ordered queue" **[docs]** [Mutations](https://docs.convex.dev/functions/mutation-functions). `Date.now()` inside a function is "frozen" when the function begins **[docs]** [Runtimes](https://docs.convex.dev/functions/runtimes), so it is not commit order and is unfit as a change cursor. Transactions are serializable and conflicting ones are retried automatically **[docs]** [OCC](https://docs.convex.dev/database/advanced/occ), which is what makes a per-Акаунт counter gap-free (section 3.5).
- **Offline behaviour of the client.** On reconnect, `RequestManager.restart()` resends in-flight mutations ("This is safe since mutations are idempotent") and fails in-flight actions with "Connection lost while action was in flight"; `unsavedChangesWarning` (default `true` in browsers) prompts "Are you sure you want to leave? Your changes may not be saved." **[source]** [`request_manager.ts`](https://github.com/get-convex/convex-js/blob/322c395/src/browser/sync/request_manager.ts), [`client.ts`](https://github.com/get-convex/convex-js/blob/322c395/src/browser/sync/client.ts). Nothing is persisted; Convex's docs have no offline or local-first guide **[docs]** ([llms.txt](https://docs.convex.dev/llms.txt) index searched).
- **File storage.** Upload is three steps: a mutation calls `ctx.storage.generateUploadUrl()`, the client POSTs the file and gets a `storageId`, a second mutation saves it. "The upload URL expires in 1 hour and so should be fetched shortly before the upload is made." "The file size is not limited, but upload POST request has a 2 minute timeout." **[docs]** [Upload](https://docs.convex.dev/file-storage/upload-files). `ctx.storage.getUrl()` in a query returns a URL, but "anyone with the URL can access the file"; to revoke, delete the file; per-request auth means serving through an HTTP action **[docs]** [Serve](https://docs.convex.dev/file-storage/serve-files). `ctx.storage.delete()` works from mutations **[docs]** [Delete](https://docs.convex.dev/file-storage/delete-files). The `_storage` system table carries `sha256`, `size`, `contentType` and is queryable with `ctx.db.system.query("_storage")` **[docs]** [Metadata](https://docs.convex.dev/file-storage/file-metadata).
- **Clerk.** `ConvexProviderWithClerk` with `@clerk/react` for a Vite React app; use `useConvexAuth()` to know the backend has validated the token **[docs]** [Convex: Clerk](https://docs.convex.dev/auth/clerk). Trust and user keys as decided in #14.
- **Streaming export** "requires a Convex Pro plan" **[docs]** [Streaming import/export](https://docs.convex.dev/production/integrations/streaming-import-export).
- **Self-hosting:** the backend is open source under FSL-1.1-Apache-2.0 **[docs]** [Self hosting](https://docs.convex.dev/self-hosting).

### 2.2 Dexie Cloud facts

- **Pricing** **[docs]** [dexie.org/pricing](https://dexie.org/pricing) (source `src/app/pricing/page.tsx` in `dexie/dexie-web`):
  - Free: €0, "3 production users", "100 MB storage" (25 MB objects, 75 MB blobs, 1,000 blob writes a month), 10 connections, 50 syncs per 5 minutes per user.
  - "Unknown users do not occupy seats but receive an evaluation license for up to 30 active days." "After a user's evaluation period ends (30 active days), they can continue using your application offline, but data syncing will stop unless the user is upgraded to production. Upgrading a user can be done manually or programmatically."
  - Pro: €0.12 per user a month, sold as "€3/mo per 25 seats"; 25 seats include 1 GB objects, 20 GB blobs, 50,000 blob writes a month. "Every time a blob is added or replaced is considered a write operation."
  - Self-hosted: Business €3,495 once (Docker image, 5 years of updates), Enterprise €7,995 once (adds source).
- **Hosting:** "Azure-managed PostgreSQL (DBaaS), US East region"; account deletion via `DELETE /users/<userId>` **[docs]** [GDPR](https://dexie.org/docs/cloud/gdpr-compliance).
- **Auth.** Built in: email OTP, plus social and custom OAuth2/OIDC providers configured per database, with Dexie Cloud as the OAuth proxy. To use your own sign-in, you define `fetchTokens` and so "opt-out from zero-config authentication"; your server endpoint calls `POST <db>/token` with `grant_type: 'client_credentials'`, `client_id`, `client_secret`, the client's `public_key` and `claims: { sub, email, name }`; the client secret "shall never be used from client side" **[docs]** [Authentication](https://dexie.org/docs/cloud/authentication), [`db.cloud.configure()`](<https://dexie.org/docs/cloud/db.cloud.configure()>). For Кафето that endpoint is a Vercel Function that verifies the Clerk session token and sets `sub` to the Clerk user id **[unverified design]**. Dexie Cloud then holds its own long-lived refresh token (months), independent of Clerk's 7-day session (#13), so signing out of Clerk elsewhere does not sign Кафето's sync out **[reasoned]**.
- **Optional sign-in:** `requireAuth: false` "enables unauthorized shopping basket example with possibility to authenticate to get the data become connected to user account" **[docs]** [`configure()`](<https://dexie.org/docs/cloud/db.cloud.configure()>). On the first sync after login, objects without an owner or owned by `unauthorized` get the user's id as `owner` and `realmId` **[source]** [`modifyLocalObjectsWithNewUserId.ts`](https://github.com/dexie/Dexie.js/blob/f1df3cd/addons/dexie-cloud/src/sync/modifyLocalObjectsWithNewUserId.ts). That is #17's "first sign-in merges".
- **Logout:** counts unsynced mutations, asks for confirmation if any, then clears every table **[source]** [`logout.ts`](https://github.com/dexie/Dexie.js/blob/f1df3cd/addons/dexie-cloud/src/authentication/logout.ts). That is #17's "sign-out clears the device, warn if unsynced".
- **Conflicts:** operations, not snapshots, are synced. `update()` changes only the listed properties, so two devices editing different fields both survive; same field: "the latest performed operation will overwrite the previous one", by client timestamp "adjusted to each client's time-diff against the server". `put()` replaces the whole object. **[docs]** [Consistency](https://dexie.org/docs/cloud/consistency). Whether an edit synced after a delete is dropped (delete beats edit) is not stated **[unverified]**.
- **Blobs:** "Blob and File objects are always offloaded to blob storage during sync", lazily downloaded on read, with eager download and progress available. The page says it needs `dexie-cloud-addon` 4.4.0 "under the `canary` tag" and Dexie Cloud Server 3.0.0 **[docs]** [Blob offloading](https://dexie.org/docs/cloud/blob-offloading); npm `latest` is now 4.4.15 (2026-09-09) **[source]** (registry). Whether the hosted service runs server 3.x is **[unverified]**.
- **Constraints:** "Don't use Version.upgrade() except for non-synced tables"; "Never change the primary keys of a table"; by default the IndexedDB name gets a suffix from the database URL, so a cloud database does not reuse the plain `dial-in` database **[docs]** [Best practices](https://dexie.org/docs/cloud/best-practices), [`configure()`](<https://dexie.org/docs/cloud/db.cloud.configure()>). Dial In has used `upgrade()` twice already (v2, v3).

### 2.3 Change tracking in plain Dexie

- `dexie-observable` and `dexie-syncable`: "This package has been unmaintained for a looong time and might be retired"; Dexie Cloud "has its own sync system based on middlewares" **[source]** ([Observable README](https://github.com/dexie/Dexie.js/blob/f1df3cd/addons/Dexie.Observable/README.md), [Syncable README](https://github.com/dexie/Dexie.js/blob/f1df3cd/addons/Dexie.Syncable/README.md)); last npm release 4.0.1-beta.13 on 2023-01-17 **[source]**. Do not use.
- Table hooks (`creating`, `updating`, `deleting`) still exist in Dexie 4: "There is NO PLAN for deprecation of this hooks API", DBCore middleware (`db.use({ stack: 'dbcore', ... })`) is the newer API **[docs]** [`hook('updating')`](<https://dexie.org/docs/Table/Table.hook('updating')>), [`Dexie.use()`](<https://dexie.org/docs/Dexie/Dexie.use()>). `put()` fires `creating` or `updating` depending on whether the row exists; `deleting` fires for `delete()`, `clear()` and `Collection.delete()` **[docs]**.
- Hooks can only touch tables already in the transaction's scope, so a hook on `db.brews.put()` cannot write to an `outbox` table **[unverified, reasoned from Dexie's transaction scoping]**. Simpler and explicit: one data module whose write functions open `db.transaction('rw', [table, outbox], ...)` themselves (section 3.2).

### 2.4 Other ready-made paths

- **PowerSync + Convex:** "experimental Convex support", replicating through Convex's Streaming Export endpoints (`list_snapshot`, `document_deltas`), with client writes going "to local SQLite" and up through Convex mutations **[docs]** [PowerSync design notes, 2026-06-17](https://powersync.com/blog/convex-powersync-design-notes). Streaming export needs Convex Pro (2.1). Not for now.
- Convex's `curvilinear` example (a Linear clone with local "sync tables") was mentioned on Convex's Discord as an example, not a package **[unverified, not read]**.

## 3. Recommended design: Dexie and Кафето's own Convex

### 3.1 Shape

- The UI keeps reading Dexie with `useLiveQuery`, exactly as now. Convex is never on the render path.
- Every write goes through one module (today's `db.ts` grows into it) that stamps `updatedAt` and writes an outbox entry in the same Dexie transaction.
- A sync loop runs only when the device's log belongs to the signed-in Акаунт, Convex reports `isAuthenticated`, and the browser is online. It (1) uploads pending photos, (2) pushes the outbox in batches, (3) holds a live `pull` subscription and applies what arrives. Triggers: app start, `online` event, `visibilitychange` to visible, after each local write (debounced), and the subscription itself.
- "Background" means while the app is open. Background Sync (`SyncManager`) exists in Chrome but not in Safari or Firefox **[source]** ([browser-compat-data](https://github.com/mdn/browser-compat-data/blob/main/api/SyncManager.json)), so on iPhone an edit made offline syncs the next time Кафето is opened online. Call `navigator.storage.persist()` (Safari 15.2+, Chrome, Firefox) **[source]**, as #16 already recommends.

### 3.2 Local data model (Dexie version 4)

```ts
db.version(4)
  .stores({
    coffees: 'id, name, roaster, finished, updatedAt', // unchanged; adds photoKey (not indexed)
    brews: 'id, coffeeId, method, createdAt, updatedAt, [coffeeId+method]', // adds updatedAt
    equipment: 'id', // one row, id 'equipment': grinder, opusDial, opusInner, updatedAt
    outbox: 'key', // `${table}:${id}`: { table, id, op: 'put' | 'delete', at }
    syncMeta: 'key', // subject (whose log this is), cursor, clockOffset, lastPushAt, lastPullAt
  })
  .upgrade(async (tx) => {
    await tx.table('brews').toCollection().modify((b) => { b.updatedAt ??= b.createdAt })
    // copy dial-in-grinder, dial-in-opus-dial, dial-in-opus-inner from localStorage into equipment
  })
```

- **`updatedAt` on every synced record** (bags have it, brews get it, equipment gets it). It is the last-write-wins clock: `Date.now() + clockOffset`, where `clockOffset` is server time minus device time, refreshed from every push response. This is the same correction Dexie Cloud applies **[docs]** and keeps a phone with a wrong clock from winning every conflict. **[design]**
- **Outbox entries collapse:** the key is table plus id, so ten edits to one brew are one entry, and the push reads the row's current state. A delete replaces any pending put for the same key. Entries are written only while signed in or before the first sign-in (the merge pushes everything anyway, see 3.8), never while applying pulled changes.
- **Local deletes stay hard deletes.** The UI never sees tombstones; the outbox entry carries the delete until the server has it, and the server keeps the tombstone (3.3).
- **`photoKey`** on a bag: a fresh UUID whenever the photo is set, replaced or removed. It tells devices whether the photo they hold is current without comparing bytes.
- **`syncMeta.subject`:** the Clerk user id the device's log belongs to, or absent for a log that was never signed in. It is what lets the app tell "signed out on purpose" from "session expired" (3.8).
- **Gemini key and theme stay in localStorage** and are never synced, per #17.
- Write sites to route through the module: the list in section 1. `setDialedIn` stops bumping the bag's `updatedAt` and instead stamps each brew it changes.

### 3.3 Convex data model (Кафето's deployment)

```text
users: { subject: string, seq: number }               // index by_subject
coffees: {
  ownerSubject: string, clientId: string, seq: number, updatedAt: number,
  deleted: boolean,                                     // tombstone: fields stripped, photo deleted
  name?, roaster?, ...label fields, tastingNotes?, rating?, finished?, createdAt?,
  photoStorageId?: Id<'_storage'>, photoKey?: string,
}                                                       // indexes by_owner_client [ownerSubject, clientId], by_owner_seq [ownerSubject, seq]
brews: { ownerSubject, clientId, coffeeClientId, seq, updatedAt, deleted, ...recipe fields }
                                                        // indexes by_owner_client, by_owner_seq, by_owner_coffee [ownerSubject, coffeeClientId]
equipment: { ownerSubject, seq, updatedAt, grinder?, opusDial?, opusInner? }
                                                        // indexes by_owner, by_owner_seq
processedWebhookEvents: { svixId }                      // as in Сметката, for user.deleted
```

- Keyed by Clerk `subject`, as #14 decided.
- Tombstones are the row itself with `deleted: true`, payload stripped and the photo file deleted. Kept indefinitely (tiny), so a device that was offline for months still learns about the delete. **[design]**

### 3.4 Push

`sync.push({ changes })`, batches of up to about 100, each `{ table, clientId, updatedAt, deleted?, fields? }`:

1. Look up the `users` row by `subject` (create on first push); every accepted change takes `seq = users.seq + 1` and writes it back. One user doc per Акаунт means all of one person's writes serialize, which is fine for a person's two or three devices.
2. If the stored row is a tombstone, ignore the change: **delete beats edit**, including a later edit from a device that never saw the delete.
3. If the change is a delete, tombstone the row whatever the timestamps; for a bag, also tombstone its brews (`by_owner_coffee`) and delete its photo file.
4. A brew whose bag is tombstoned is tombstoned on arrival (a brew logged offline on a bag deleted elsewhere).
5. Otherwise apply only if there is no stored row or `updatedAt` is greater than the stored one: **later edit wins per record**. Ties keep the stored row.
6. Return the server's `Date.now()` for the clock offset.

The client deletes an outbox entry only if the row's `updatedAt` has not moved since it was read, so an edit made during the push is not lost. Retrying a batch is harmless because every rule above is idempotent. **[design]**

### 3.5 Pull and the change cursor

- `sync.pull({ cursor })` is a query: for each of the three tables, `withIndex('by_owner_seq', q => q.eq('ownerSubject', s).gt('seq', cursor)).take(200)`, merged by `seq`, cut at the lowest "last seq" of any table that hit its limit so nothing is skipped, returning `{ changes, cursor }`. Bags with a photo include `photoKey` and `ctx.storage.getUrl(photoStorageId)`.
- The client subscribes with `useQuery`, applies the batch in one Dexie transaction (put if incoming `updatedAt` is newer than local or the row is missing, delete on tombstones and drop any outbox entry for that key), stores the new cursor, and resubscribes. Being a Convex subscription, a change made on the laptop reaches an open phone within moments: #17's "synced live".
- Why a counter and not a timestamp: `Date.now()` is the function's start time, so a slow mutation could commit a row stamped before a cursor another device has already passed. A counter on the user row is bumped inside the same serializable transaction, so `seq` follows commit order per Акаунт. **[docs + reasoning]**
- A device's own pushes come back through the pull; applying them is a no-op by the same comparison.

### 3.6 Photos

- **Where:** Convex file storage in Кафето's deployment. Local copy stays a Blob on the bag, so the UI and the JSON export do not change.
- **Upload, including offline:** setting a photo writes the Blob and a new `photoKey` locally and puts the bag in the outbox. Before pushing a bag whose `photoKey` the server lacks, the sync loop calls `generateUploadUrl` (a mutation that checks auth), POSTs the Blob, and pushes the bag with `photoStorageId` and `photoKey` in the same change. Offline, the step simply waits: never mint upload URLs ahead of time, they expire in an hour **[docs]**.
- **Replace and delete:** the push mutation deletes the old file when `photoKey` changes or the bag is tombstoned.
- **Orphans:** an upload whose bag push never lands (app closed between the steps) leaves a file nobody references. A daily cron that deletes `_storage` files older than a day and not referenced by any bag closes that. **[design]**
- **Download:** on pull, fetch the URL only when the incoming `photoKey` differs from the local one, then store the Blob. Each device downloads each photo once, which keeps egress (1 GB a month on Free, shared by the team) low.
- **Privacy:** `getUrl` URLs are bearer URLs **[docs]**. For photos of coffee bags that seems acceptable; serving through an authenticated HTTP action is the alternative and costs the same egress plus a function call per image.

### 3.7 Equipment

One `equipment` record per Акаунт: `grinder`, `opusInner`, and (proposed) `opusDial`, the on/off for the Opus helper, since it describes the same grinder. Last write wins on the record, like a bag. Edits are rare and come from one person, so per-field clocks are not worth it **[design]**. The JSON backup should carry all three.

### 3.8 Sign-in, merge, sign-out

- **Signed out, never signed in:** exactly today. The outbox still records changes (cheap), so the first sign-in has nothing special to compute.
- **First sign-in on a device** (`syncMeta.subject` absent): set `subject`, put every local bag, brew and the equipment row into the outbox with their current `updatedAt`, then push and pull. Ids are UUIDs, so nothing clashes; if the same backup was imported on two devices, the copies have equal ids and the later `updatedAt` wins. Nothing is deleted on either side. This is #17's merge.
- **Sign-out from Кафето:** if the outbox is not empty, warn ("N промени още не са синхронизирани") with options to wait, export JSON, or sign out anyway. Then clear `coffees`, `brews`, `equipment`, `outbox`, `syncMeta`, and call Clerk's `signOut`. Theme and Gemini key stay, per #17.
- **Session ends without a Кафето sign-out** (Clerk's 7-day session on the free plan expires, #13, or the person signs out on another `*.onovaza.com` page, since the session is shared): keep the data, pause sync, show a quiet "Влез отново, за да се синхронизира". Do not treat it as a sign-out (that would wipe a log because a week passed) and do not merge into anyone else.
- **A different person signs in** on a device holding someone's log (`syncMeta.subject` set and different): never merge. Ask to export and clear first.
- **Deleting the Акаунт:** Кафето's deployment gets its own `user.deleted` endpoint and erase job, copied from Сметката (#14): tombstones and all, plus every photo file. In-app, #17 offers the JSON export first and then clears the device. A device that finds its `subject` gone on its next sync offers the export and clears.
- **Offline cold start:** the app must render from Dexie without waiting for Clerk. How `@clerk/react` behaves when its script cannot load offline in an installed PWA is **[unverified]**; Clerk documents offline support only for Expo.

### 3.9 `backup.ts`

- Export: add `equipment`, `updatedAt` on brews, and `photoKey`; bump `version` to 2 and keep reading version 1 (brews without `updatedAt` get `createdAt`).
- Import: keep "merge, never replace", but compare `updatedAt` instead of blindly `bulkPut`ting, and put imported rows in the outbox with their own `updatedAt`, not "now". Otherwise importing an old backup on a signed-in device would make stale rows the newest everywhere.

## 4. Free-plan budget for a small user base

All **[unverified estimate]**, to be replaced by real numbers from the owner's Convex dashboard.

- **Photos:** about 100 to 300 KB each (1280 px, quality 0.82; same estimate as #16), say 200 KB. 20 people with 60 bags each is 240 MB of the team's 1 GB. Egress: each extra device downloads each photo once (about 12 MB a person), then a few new bags a month: tens of MB a month against 1 GB.
- **Function calls:** a sync is one push, one or two subscription updates per open device, and an upload-URL mutation per photo. Even 50 calls a person a day is 30,000 a month for 20 people, against 1,000,000 shared.
- **Database:** brews are a few hundred bytes; each index counts as another copy of the table **[docs]**. Megabytes, against 0.5 GB.
- **The real constraint is "per team":** Сметката's erase job already deletes "recent quick scans and photos" (#14's research), so it probably keeps files in Convex too **[unverified]**. If the projects share one Convex team, their files and egress come out of the same 1 GB. Moving the team to Starter keeps the same included amounts and only bills the overage.
- **Dexie Cloud for comparison:** 75 MB of blob storage on Free is about 375 photos for everyone together, and 1,000 blob writes a month; more than 3 people need paid seats.

## 5. Open questions and unverified points

- Which Convex team holds Сметката, Клиентите and Кухнята, and its current file storage and egress use (dashboard not checked).
- Real photo sizes from Dial In's own log (#16 asked the same).
- How `@clerk/react` behaves on an offline cold start of the installed PWA, and whether `ConvexProviderWithClerk` waits on it. Test on a phone in airplane mode before building on it.
- Whether Dexie Cloud drops an edit synced after a delete, and whether the hosted service already runs server 3.x for blob offloading (only matters if Dexie Cloud is reconsidered).
- Whether Clerk's OAuth provider feature (Clerk as an OIDC provider for Dexie Cloud's custom OAuth2 option) is on the free plan: not checked, and not needed for the recommendation.
- Product calls for the owner: is `opusDial` (the on/off) equipment that syncs; is the warning copy on sign-out right; should sign-out also clear the Gemini key on a shared device (#17 says it stays).
- Whether hooks can write to a table outside the caller's transaction scope (assumed not; the design avoids relying on it).
- The size of the sync code (a few hundred lines on each side) is a guess.
