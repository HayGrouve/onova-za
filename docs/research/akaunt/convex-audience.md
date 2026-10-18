# One token audience per project's Convex

Research for [#24](https://github.com/HayGrouve/onova-za/issues/24) on map [#12](https://github.com/HayGrouve/onova-za/issues/12). Builds on [#13](https://github.com/HayGrouve/onova-za/issues/13) (Clerk on onovaza.com subdomains, which raised the question) and [#14](https://github.com/HayGrouve/onova-za/issues/14) (Convex on one Clerk instance, which recommends the native Convex integration with `aud: "convex"`). Architecture from ADR 0001: one Clerk production instance on onovaza.com, projects on `<name>.onovaza.com`, each with its own Convex deployment, Clerk free plan. Written 2026-10-19.

Tags: **[docs]** = current vendor docs (linked), **[source]** = vendor source code or changelog read on 2026-10-19, **[local]** = read in the sibling repos (Сметката, Клиентите, Chef) on 2026-10-19, **[unverified]** = reasoned, or read in source but not run.

## 0. Answer in brief

1. **Can each project get its own audience?** Only with one JWT template per project (`aud: "smetkata"`, ...). The native Convex integration can't do it, because it sets `aud` on the one session token every subdomain shares. Per-project templates also need a small client wrapper, because `ConvexProviderWithClerk` hard-codes the template name `"convex"`.
2. **Does it help?** Almost not at all. Any script running on any allowed subdomain can ask Clerk for any template by name (`getToken({ template: "klientite" })`), so an XSS on Кухнята still gets a token Клиентите's Convex accepts. A distinct `aud` only stops a token captured passively from one project being replayed at another, and in our setup tokens never sit in URLs or logs.
3. **What actually binds a token to one subdomain is `azp`.** Clerk sets it from the browser's `Origin` header on the Frontend API request that minted the token, and page JavaScript can't forge that header. Clerk's own server-side defence against "subdomain cookie leaking" is checking `azp` (`authorizedParties`). Convex never checks `azp`, and with today's `domain`/`applicationID` config it doesn't even pass `azp` through to `getUserIdentity()`. To check it, a project switches its provider to `type: "customJwt"` (same issuer, Clerk's JWKS), which does expose `identity.azp`, then compares it with its own origin in the one auth helper.
4. **Is the `azp` check worth it given the shared session?** It's a modest but real gain, and it's cheap if it lands with each project's migration. It turns "XSS on any one subdomain silently reads and writes your data in every project" into "XSS reaches other projects only by taking over or deleting the Акаунт", which Clerk gates behind reverification (10 minutes after sign-in by default). It does not stop account deletion or takeover inside that window, or phishing.

**Recommendation:** don't create per-project audiences. Keep one `aud: "convex"` from the native integration (as #14 says). In each data-holding project, add an `azp` check, enforced only on the production deployment, as part of that project's migration. Pair it with the controls that matter more: Allowed Subdomains on, `authorizedParties` on every SSR server, and care with untrusted HTML in Кухнята and Кафето. First, check on the dev instance that `identity.azp` really shows up (section 6); if it doesn't, skip the check and record the risk as accepted.

## 1. What each piece does

### Convex checks `iss` and `aud`, nothing else

- `domain` "must exactly match the `iss` field" and `applicationID` "must exactly match the `aud` field". With several providers, "the first one fulfilling the above criteria will be used" **[docs]** [custom-auth](https://docs.convex.dev/auth/advanced/custom-auth).
- The `customJwt` provider takes `issuer`, `jwks`, `algorithm` (RS256 or ES256) and `applicationID`, which Convex checks against `aud`. "Omitting `applicationID` is often insecure" because "a JWT intended for another service can be used to impersonate them in your service" **[docs]** [custom-jwt](https://docs.convex.dev/auth/advanced/custom-jwt). That warning describes services run by different parties on one identity provider. Our projects all share one owner and one `aud`, so the warning's scenario does not apply.
- No `azp` check. In Convex's OIDC path, the `azp` verification step is commented out in its OpenID Connect library ("we defer any verification of it here until a use case becomes apparent") **[source]** [convex/openidconnect-rs `src/verification/mod.rs` @ `15a9c55`](https://github.com/get-convex/openidconnect-rs/blob/15a9c551eafcf3b60d307feb94332352ac56c099/src/verification/mod.rs). The `customJwt` path checks the signature, `iss`, `aud` and expiry only **[source]** [`crates/authentication/src/lib.rs`](https://github.com/get-convex/convex-backend/blob/main/crates/authentication/src/lib.rs). The Convex docs don't mention `azp` at all.
- **`azp` does not reach `getUserIdentity()` with today's config.** With `domain` + `applicationID` (OIDC), custom claims are built from `claims.additional_claims()` **[source]** [`crates/keybroker/src/broker.rs`](https://github.com/get-convex/convex-backend/blob/main/crates/keybroker/src/broker.rs) (`UserIdentity::from_token`). In the OIDC library, `azp` (like `aud` and `iat`) is a named field of `IdTokenClaims`, so serde takes it before the flattened `additional_claims` sees the rest **[source]** [`src/id_token/mod.rs` @ `15a9c55`](https://github.com/get-convex/openidconnect-rs/blob/15a9c551eafcf3b60d307feb94332352ac56c099/src/id_token/mod.rs). Read in source, not run: **[unverified]** until checked (section 6).
- **With `customJwt` it does.** `UserIdentity::from_custom_jwt` turns every claim outside the RFC 7519 registered set (`iss sub aud exp nbf iat jti`) into a custom claim, dropping only `fva` **[source]** (`broker.rs`; `ClaimsSet { registered, private }` in [biscuit](https://github.com/lawliet89/biscuit/blob/master/src/lib.rs), which Convex uses via a fork). Custom claims are flattened onto the identity object in JS **[source]** [`crates/convex/sync_types/src/types/json.rs`](https://github.com/get-convex/convex-backend/blob/main/crates/convex/sync_types/src/types/json.rs), and the TS type has `[key: string]: JSONValue | undefined` for "Any custom claims" **[local]** (`convex/dist/esm-types/server/authentication.d.ts`, convex 1.46.0). So `identity.azp` would be the minting origin. Read in source, not run: **[unverified]**.
- **What `customJwt` costs.** It fills only `subject`, `issuer` and `tokenIdentifier` as typed fields; everything else arrives under the claim's own name **[source]** (`from_custom_jwt`). `identity.name` and `identity.email` keep working (same key), while `identity.pictureUrl` becomes `identity.picture`. `tokenIdentifier` keeps the same `iss|sub` format, so stored ids don't change. Clerk signs with RS256 and serves its JWKS at `<Frontend API>/.well-known/jwks.json` **[verified]** (public discovery document of Chef's dev instance, read with `curl`).
- The convex-js changelog through 1.48.0 (unreleased) has no entry about `azp` or authorized parties **[source]** [CHANGELOG](https://github.com/get-convex/convex-js/blob/main/CHANGELOG.md).

### Clerk: one session token per instance, `azp` per origin

- **`azp`** is "The `Origin` header that was included in the original Frontend API request made from the user. Most commonly, it will be the URL of the application." It "could be omitted if, for privacy-related reasons, `Origin` is empty or null" **[docs]** [session tokens](https://clerk.com/docs/guides/sessions/session-tokens). Browsers set `Origin` on cross-origin `fetch`, and page scripts can't change it, so a token minted from `kuhnyata.onovaza.com` carries that origin. The Frontend API is on `clerk.onovaza.com`, which is cross-origin for every app.
- **JWT templates carry `azp` too.** Default claims on every template token: `azp exp iat iss jti nbf sub`, which "cannot be overridden by templates"; lifetime defaults to 60 s **[docs]** [JWT templates](https://clerk.com/docs/guides/sessions/jwt-templates). So `azp` binds a template token to its origin just like a session token, whatever its `aud`.
- **Any signed-in page can mint any template.** `session.getToken({ template })` takes "The name of the JWT template from the Clerk Dashboard" **[docs]** [Session object](https://clerk.com/docs/js-frontend/reference/objects/session.md). clerk-js calls `POST /client/sessions/{id}/tokens/{template}` on the Frontend API **[source]** [`clerk-js/src/core/resources/Session.ts`](https://github.com/clerk/javascript/blob/main/packages/clerk-js/src/core/resources/Session.ts). Templates have no per-origin restriction in the docs. The only gate on which origins may call the Frontend API at all is **Allowed Subdomains**: "only your primary domain and explicitly allowlisted subdomains can make cross-origin requests to FAPI" **[docs]** [subdomain allowlist](https://clerk.com/docs/guides/dashboard/dns-domains/subdomain-allowlist).
- **The native integration gives one audience.** Activating it pre-maps "the default audience (`aud`) claim required by Convex" on the Sessions page **[docs]** [Clerk: Integrate Convex](https://clerk.com/docs/guides/development/integrations/databases/convex). The session token's claims are a property of the instance, so every subdomain's token gets the same `aud`. There is no per-project setting.
- **Clerk's subdomain defence is `azp`.** `authorizedParties` "acts as an allowlist of origins to verify against, protecting your application from subdomain cookie leaking attacks" **[docs]** [production deployment](https://clerk.com/docs/guides/development/deployment/production). Manual verification: "Validate that the `azp` (authorized parties) claim equals any of your known origins permitted to generate those tokens" **[docs]** [manual JWT verification](https://clerk.com/docs/guides/sessions/manual-jwt-verification). Since `@clerk/backend` 3.11.1 (merged 2026-07-07), a token "with a missing or empty `azp` claim is rejected" once `authorizedParties` is set **[source]** [backend CHANGELOG](https://github.com/clerk/javascript/blob/main/packages/backend/CHANGELOG.md), [PR #8877](https://github.com/clerk/javascript/pull/8877), [`assertAuthorizedPartiesClaim`](https://github.com/clerk/javascript/blob/main/packages/backend/src/jwt/assertions.ts). The docs page still says a missing `azp` may be skipped; the SDK is now stricter.
- **Server-side template tokens.** `auth().getToken({ template })` on a server calls the Backend API (`POST /sessions/{id}/tokens/{template}`), while `getToken()` with no template returns the request's own session token **[source]** [`authObjects.ts` `createGetToken`](https://github.com/clerk/javascript/blob/main/packages/backend/src/tokens/authObjects.ts), [`SessionApi.ts`](https://github.com/clerk/javascript/blob/main/packages/backend/src/api/endpoints/SessionApi.ts). A token minted by the Backend API has no browser `Origin`, so it probably has no `azp` **[unverified]**.
- **Free plan.** Hobby includes JWT templates ("Completely custom token claims designed for external service integration") and custom session token claims; no limit on the number of templates is published **[docs]** [pricing](https://clerk.com/pricing). Reverification is not mentioned on the pricing page.

### How Convex's Clerk wiring fetches tokens

`ConvexProviderWithClerk` calls Clerk's `useAuth().getToken`. If `sessionClaims?.aud === "convex"` it sends the session token (`getToken({ skipCache })`), otherwise `getToken({ template: "convex", skipCache })`. Both the `aud` value and the template name are hard-coded **[local]** (`convex/dist/esm/react-clerk/ConvexProviderWithClerk.js`, convex 1.46.0 in Клиентите; 1.42.1 in Сметката). Per-project audiences therefore mean either a wrapped `useAuth` whose `getToken` swaps in the project's template, or a custom adapter on `ConvexProviderWithAuth`.

In the projects today **[local]**:

| Project   | Convex token path                                                                                   | Where `getUserIdentity()` is called                     | Identity fields read                                  |
| --------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------- | ----------------------------------------------------- |
| Сметката  | Client only, `ConvexProviderWithClerk`                                                              | `convex/lib/auth.ts` (2 calls)                          | `subject`, `name`, `email`, `pictureUrl`              |
| Клиентите | Client only, `ConvexProviderWithClerk`                                                              | `convex/lib/auth.ts` (2), `convex/users.ts` (1)         | `subject`, `tokenIdentifier`, `name`, `email`, `pictureUrl` |
| Chef      | Client `ConvexProviderWithClerk` (template), plus one RSC `auth().getToken({ template: "convex" })` in `app/recipe/[id]/page.tsx` | 37 direct calls across `convex/*.ts`, no shared helper  | `subject`, `tokenIdentifier`, `name`, `email`, `pictureUrl` |

### What an attacker on one subdomain can do through Clerk itself

- Reverification gates these actions: changing username or password; adding or removing email addresses, phone numbers or passkeys; setting the primary identifier; connecting or removing OAuth accounts; MFA changes; revoking sessions; deleting the account. "By default, users can perform Clerk-protected sensitive actions for 10 minutes after a successful sign-in or reverification", adjustable to 1 to 10 minutes on the Sessions page **[docs]** [reverification](https://clerk.com/docs/guides/secure/reverification).
- The Frontend API enforces it: Clerk's own `<UserProfile>` wraps `user.delete()` and `user.createEmailAddress()` in `useReverification`, which reacts to the Frontend API error `session_reverification_required` **[source]** [`DeleteUserForm.tsx`](https://github.com/clerk/javascript/blob/main/packages/ui/src/components/UserProfile/DeleteUserForm.tsx), [`EmailForm.tsx`](https://github.com/clerk/javascript/blob/main/packages/ui/src/components/UserProfile/EmailForm.tsx), [`useReverification.ts`](https://github.com/clerk/javascript/blob/main/packages/shared/src/react/hooks/useReverification.ts).
- So a script on a compromised subdomain can always mint tokens (bound to that origin) and sign the user out. Inside the reverification window it can also add its own email and make it primary (account takeover) or delete the Акаунт (every project erases its data via `user.deleted`). Outside the window it needs the user to complete a reverification, i.e. phishing. Whether reverification is on the free plan is **[unverified]** (not on the pricing page).

## 2. The options and what each costs

| | A. One `aud: "convex"` (today's plan, #14) | B. One JWT template per project (`aud` = project) | C. A plus an `azp` check in each Convex |
| --- | --- | --- | --- |
| Clerk, per instance (dev and prod) | Activate native integration, map `name`, `email`, `picture` | One template per data-holding project (Сметката, Клиентите, Кухнята, later Кафето): 4 templates × 2 instances, each with `aud` and the three profile claims | Same as A |
| Convex `auth.config.ts` | `domain` + `applicationID: "convex"` | `applicationID` = project name | `type: "customJwt"`, `issuer` + `jwks` + `algorithm: "RS256"` + `applicationID: "convex"` |
| Client | Stock `ConvexProviderWithClerk` | Wrapped `useAuth` (or own adapter) asking for the project's template, since the provider hard-codes `"convex"` and prefers the session token when the integration is on | Stock |
| Server (Chef RSC) | `getToken()` returns the cookie session token | `getToken({ template })`, a Backend API round trip per render | `getToken()` |
| Function code | none | none | One check in the project's auth helper; `pictureUrl` → `picture`; Chef first needs a helper in front of its 37 call sites |
| Env | `CLERK_JWT_ISSUER_DOMAIN` | plus the audience name | plus `CLERK_AUTHORIZED_PARTIES` on prod only |
| Runtime cost | none | An extra Frontend API request per tab per token lifetime (template tokens are not the session token clerk-js already refreshes) | none |
| Stops a script on subdomain X using project Y's Convex | No | **No** (X can mint Y's template) | **Yes**, unless the script takes over the Акаунт (section 3) |

## 3. Threat scenarios

The realistic XSS candidates are the apps that ingest untrusted content: Кухнята imports recipes from arbitrary URLs and runs AI over them, and Кафето renders AI output. No `dangerouslySetInnerHTML` or `innerHTML` turned up in the TS/TSX sources of Chef, Сметката, Клиентите or Dial In, and Сметката's and Клиентите's CSPs allow `'unsafe-inline'` scripts, so CSP is not a backstop **[local]**. The most sensitive data is Клиентите's client list (third-party personal data), then Сметката's bills.

| Scenario | A (one `aud`) | B (per-project `aud`) | C (`azp` check) |
| --- | --- | --- | --- |
| 1. XSS or a malicious dependency on `kuhnyata.onovaza.com` reads the victim's Клиентите data. Convex deployment URLs are public in each app's bundle. | Works silently, any time the victim has the page open. Token from `getToken()`, sent to Клиентите's Convex from the page or from the attacker's server within 60 s | Works: `getToken({ template: "klientite" })` | **Blocked**: `azp` is `https://kuhnyata.onovaza.com`. The attacker must take over the Акаунт instead: only inside the reverification window, or by phishing a reverification |
| 2. Same XSS deletes the Акаунт or adds its own email | Inside the reverification window only | Same | Same: `azp` doesn't help |
| 3. XSS on the hub (`onovaza.com`), where everyone signs in under #13's option B | As 1, and users there are usually inside the window | As 1 | Hub tokens rejected by every Convex, but fresh sign-ins are inside the window, so takeover remains. Hub is static with no user content, so XSS is unlikely |
| 4. Compromise of a subdomain without Clerk (a later project, client work) | Can call the Frontend API unless Allowed Subdomains is on | Same | Same: **Allowed Subdomains** is the control |
| 5. A token leaks passively (logs, error reports, a Referer) and is replayed at another project | Accepted for up to 60 s | Blocked | Blocked |
| 6. One project's backend replays tokens it received at another project | Possible | Blocked | Blocked. Not a real threat: one owner, and Convex functions never see the raw token |

Scenarios 5 and 6 are what a per-project audience is for, and neither is realistic here: Convex receives tokens over its WebSocket auth message, not in URLs. Scenario 1 is the real gap #13 spotted, and only `azp` closes it.

## 4. Recommendation

1. **No per-project audiences.** Keep the native integration and `applicationID: "convex"` everywhere, as #14 recommends. No templates beyond the optional `convex` fallback #14 mentions.
2. **Add an `azp` check to each data-holding project's Convex, during that project's migration**, not as a separate project. It costs about an hour in Сметката and Клиентите, where identity already goes through `convex/lib/auth.ts`, and it is built in from the start for Кафето's backend. In Кухнята it rides on the migration that already rewrites Chef's identity handling (re-keying by subject, moving the issuer into env); add a single helper there and route the 37 calls through it.
3. **Enforce only where `CLERK_AUTHORIZED_PARTIES` is set**, i.e. the production deployment. Dev, preview (`*.vercel.app` URLs vary per deployment) and `localhost` stay unchecked, mirroring Clerk's own "no `authorizedParties`, no check". When it is set, a missing or empty `azp` fails, as in `@clerk/backend` 3.11.1+.
4. **The controls that matter more**, already in #13: Allowed Subdomains with only the Clerk-using subdomains, and `authorizedParties` on every SSR server. Optionally shorten the reverification window (Sessions page, 1 to 10 minutes) to shrink scenarios 2 and 3; the cost is a reverification prompt when someone edits their Акаунт more than that long after signing in.
5. **Gate on section 6.** If `identity.azp` does not appear with `customJwt`, or a page ever holds a token whose `azp` is another subdomain, drop the check, keep A, and record the cross-project XSS risk as accepted in the plan.

## 5. Per-project setup this implies

Shape of the change, for the migration plans (not tested):

```ts
// convex/auth.config.ts
export default {
  providers: [
    {
      type: 'customJwt',
      issuer: process.env.CLERK_JWT_ISSUER_DOMAIN!,
      jwks: `${process.env.CLERK_JWT_ISSUER_DOMAIN}/.well-known/jwks.json`,
      algorithm: 'RS256',
      applicationID: 'convex',
    },
  ],
} satisfies AuthConfig
```

```ts
// in the project's one auth helper, right after ctx.auth.getUserIdentity()
const parties = process.env.CLERK_AUTHORIZED_PARTIES?.split(',').filter(Boolean) ?? []
if (parties.length > 0 && (typeof identity.azp !== 'string' || !parties.includes(identity.azp))) {
  throw new ConvexError('Изисква се вход') // same as signed out
}
```

| Project | Clerk | Convex env (prod) | Code |
| --- | --- | --- | --- |
| Сметката | nothing beyond #14 | `CLERK_AUTHORIZED_PARTIES=https://smetkata.onovaza.com` | `auth.config.ts` as above; check in `requireAuth` and `getOptionalAuthUserId`; `identity.pictureUrl` → `identity.picture`; a test with and without `azp` |
| Клиентите | same | `https://klientite.onovaza.com` | Same, plus route `convex/users.ts`'s direct call through `lib/auth.ts` |
| Кухнята | same; drop the `convex` template once on convex ≥ 1.33.1 (#14) | `https://kuhnyata.onovaza.com` | One identity helper in front of all 37 calls; RSC `getToken()` without a template, so the server forwards the browser-minted session token (template tokens minted by the Backend API probably carry no `azp`) |
| Кафето | same | `https://kafeto.onovaza.com` | Build the check into its first auth helper |
| Hub | none | none (no Convex) | none |

Side effects to plan for: the Convex dashboard's "run as user" on prod needs `"azp": "<origin>"` in the identity JSON; `convex-test` identities need `azp` only if a test sets the env var.

## 6. Check before relying on it (owner, dev instance, about 10 minutes)

1. On a dev deployment, switch `auth.config.ts` to `customJwt` and add a throwaway query returning `await ctx.auth.getUserIdentity()`. Confirm `azp` is present and equals the page origin, that `name` and `email` still come through, and that `picture` replaces `pictureUrl`. Optionally confirm the reverse: with the old `domain` config, `azp` is absent.
2. On production, once two subdomains are live: sign in on one, open the other, and in its console decode both `Clerk.session.lastActiveToken.jwt.claims.azp` and the token from `await Clerk.session.getToken({ skipCache: true })`. Both must be that subdomain's own origin. This rules out the Frontend API handing one origin a token minted for another (`/v1/client`'s `last_active_token`) **[unverified]**.
3. On an SSR app (Сметката or Кухнята), after a cross-subdomain sign-in, decode the `__session` cookie the handshake set and check its `azp`. With `@clerk/backend` ≥ 3.11.1 and `authorizedParties` set, a missing `azp` would already break SSR, so this mostly confirms what Clerk enforces.

## 7. Open or unverified

- `azp` not reaching `getUserIdentity()` under `domain` config, and reaching it under `customJwt`: read in Convex's Rust source (serde field handling), not run. Section 6 step 1.
- Whether every token a page can obtain carries that page's own origin as `azp`, including `last_active_token` from `/v1/client` and handshake-issued cookies. The Frontend API is closed source; Clerk's docs and `authorizedParties` design imply yes. Section 6 steps 2 and 3.
- Whether Backend-API-minted template tokens (Chef's RSC path today) carry `azp`: probably not. Moot once Chef uses `getToken()`.
- Whether reverification, and the reverification window setting, are available on the free plan.
- Whether Allowed Subdomains is on the free plan (open since #13).
- Convex could add `azp` to the OIDC identity or an `authorizedParties` option upstream; a feature request is cheap and would let projects keep the `domain` config. Not filed.

## Sources

- Convex: [custom auth](https://docs.convex.dev/auth/advanced/custom-auth), [custom JWT](https://docs.convex.dev/auth/advanced/custom-jwt), [auth in functions](https://docs.convex.dev/auth/functions-auth), [Clerk](https://docs.convex.dev/auth/clerk)
- Convex source: [`crates/keybroker/src/broker.rs`](https://github.com/get-convex/convex-backend/blob/main/crates/keybroker/src/broker.rs), [`crates/authentication/src/lib.rs`](https://github.com/get-convex/convex-backend/blob/main/crates/authentication/src/lib.rs), [`crates/convex/sync_types/src/types/json.rs`](https://github.com/get-convex/convex-backend/blob/main/crates/convex/sync_types/src/types/json.rs), [openidconnect-rs fork @ `15a9c55`](https://github.com/get-convex/openidconnect-rs/tree/15a9c551eafcf3b60d307feb94332352ac56c099), [convex-js CHANGELOG](https://github.com/get-convex/convex-js/blob/main/CHANGELOG.md)
- Clerk: [session tokens](https://clerk.com/docs/guides/sessions/session-tokens), [JWT templates](https://clerk.com/docs/guides/sessions/jwt-templates), [Session object `getToken`](https://clerk.com/docs/js-frontend/reference/objects/session.md), [Integrate Convex](https://clerk.com/docs/guides/development/integrations/databases/convex), [production deployment](https://clerk.com/docs/guides/development/deployment/production), [manual JWT verification](https://clerk.com/docs/guides/sessions/manual-jwt-verification), [subdomain allowlist](https://clerk.com/docs/guides/dashboard/dns-domains/subdomain-allowlist), [reverification](https://clerk.com/docs/guides/secure/reverification), [pricing](https://clerk.com/pricing)
- Clerk source: [backend CHANGELOG](https://github.com/clerk/javascript/blob/main/packages/backend/CHANGELOG.md) (3.11.1), [PR #8877](https://github.com/clerk/javascript/pull/8877), [`jwt/assertions.ts`](https://github.com/clerk/javascript/blob/main/packages/backend/src/jwt/assertions.ts), [`tokens/authObjects.ts`](https://github.com/clerk/javascript/blob/main/packages/backend/src/tokens/authObjects.ts), [`api/endpoints/SessionApi.ts`](https://github.com/clerk/javascript/blob/main/packages/backend/src/api/endpoints/SessionApi.ts), [`clerk-js` `Session.ts`](https://github.com/clerk/javascript/blob/main/packages/clerk-js/src/core/resources/Session.ts), [`DeleteUserForm.tsx`](https://github.com/clerk/javascript/blob/main/packages/ui/src/components/UserProfile/DeleteUserForm.tsx), [`EmailForm.tsx`](https://github.com/clerk/javascript/blob/main/packages/ui/src/components/UserProfile/EmailForm.tsx)
- Prior research: [#13 findings](https://github.com/HayGrouve/onova-za/blob/research/clerk-subdomains/docs/research/akaunt/clerk-subdomains.md), [#14 findings](https://github.com/HayGrouve/onova-za/blob/research/convex-webhooks/docs/research/akaunt/convex-webhooks.md)
