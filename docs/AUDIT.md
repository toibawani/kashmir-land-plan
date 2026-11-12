# Production-readiness audit

A review of this repository against a standard application-security, reliability
and operations checklist. It records what is present, what was fixed, what does
not apply and why, and what a static host cannot do. It does not claim the app
is secure or production-ready: most of it is still waiting on an officer, a
native speaker and a real device.

## Stack, in five lines

1. Plain HTML, CSS and ES5 JavaScript. No framework, no bundler, no build step.
2. No backend, no database, no accounts, no auth provider. State is
   `localStorage` on the device, and the review importer is a local Node command.
3. Hosted on GitHub Pages by `.github/workflows/pages.yml`, which runs `npm test`
   before it publishes an allowlisted folder. `ci.yml` runs the same suite on
   every push and pull request.
4. A service worker (`sw.js`) precaches the shell: network-first for app files,
   cache-first for immutable font files, and weather is never cached.
5. Third parties, both HTTPS and both keyless: Google Fonts (CSS and font files)
   and Open-Meteo (place lookup and forecast).

Because there is no server, most of Phase 1–4 is genuinely not applicable rather
than skipped. Each such row says why, so the absence is a decision on record.

## Checklist

Status values: **Present & correct**, **Present but flawed**, **Missing**,
**Not applicable**.

### Phase 1: security

| Item | Status | Evidence or action |
| --- | --- | --- |
| Environment variables and secrets | Present & correct | No environment variable is read anywhere; no key exists. `.gitignore` blocks `.env*` as a guard. `tools/lint.js` fails the build on private-key blocks, AWS key shapes, `sk-…` strings and literal `api_key`/`password`/`token` assignments. |
| API keys in client code | Not applicable | There is no privileged API. Open-Meteo needs no key, so none can leak into the bundle. |
| Secret rotation | Not applicable | Nothing to rotate. Stated in `SECURITY.md` so a future contributor does not assume one exists. |
| Authentication | Not applicable | No accounts and no protected route. Every screen is the device owner's own. |
| Password handling (hashing, salting) | Not applicable | No password is accepted or stored. |
| Session management | Not applicable | No sessions. A plan is a `localStorage` row on one device. |
| Token expiry and refresh | Not applicable | No tokens are issued or held. |
| Cookie flags | Not applicable | The app sets no cookies, so `HttpOnly`/`Secure`/`SameSite` have nothing to apply to. |
| Brute-force protection | Not applicable | No login, OTP or reset endpoint to rate limit. |
| Password reset and magic links | Not applicable | No accounts. |
| 2FA, passkeys, SSO | Not applicable | No accounts. Adding them would require a backend and would collect identities this app deliberately does not hold. |
| Authorization and least privilege | Not applicable | No server resource exists to authorise against. |
| Role-based access control | Not applicable | No roles. The officer is a person with paper, not a user account. |
| IDOR | Not applicable | Nothing is addressed by a user-supplied id over the network. Saved plans are read from the same device that wrote them. |
| Mass assignment | Not applicable | No request body is accepted. Stored feedback rows are field-allowlisted in `js/feedback.js`. |
| Row-level security | Not applicable | No database. |
| Server-side input validation | Present & correct (client boundary) | The equivalent trust boundary is untrusted storage and an imported CSV. `js/feedback.js` re-validates every stored row on read: closed questions are matched against exact option lists, free text is length-limited and stripped of control characters and leading formula characters. `tools/import-review.js` treats a sheet as untrusted input and records nothing if any row fails. |
| SQL injection | Not applicable | No SQL, no ORM, no database. |
| XSS | Present but flawed, mitigated | Templates are assembled with `innerHTML`, and every value that comes from a person or from storage passes an escape helper (`js/app.js` has 179 escape uses; `js/landpanel.js` and `js/feedback-page.js` have their own). That was reviewed by reading the helpers, not by fuzzing. `script-src 'self'` now makes an injected inline script inert. Residual risk is a mistake in an attribute or URL context, which could render but not execute script. |
| CSRF | Not applicable | No state-changing request leaves the device. The only outbound calls are GETs to Open-Meteo. |
| Command injection | Not applicable | Nothing server-side. The local tools pass no user text to a shell. |
| Path traversal | Not applicable | The app reads no user-supplied path. The importer opens a file the maintainer names on their own machine, on purpose. |
| SSRF | Not applicable | No server-side fetch and no URL that a user can point anywhere. |
| Open redirects | Not applicable | There is no redirect parameter. Every external link is a fixed official URL, opened with `rel="noopener noreferrer"`, which `tools/lint.js` enforces. |
| File upload security | Not applicable | The app accepts no uploads. |
| HTTPS / TLS | Present & correct (host) | Pages serves HTTPS only and every resource is `https://`. No mixed content; lint refuses an `http://` resource. HSTS is a host setting, not visible from this repository. |
| Security headers | Missing (host limit), partly mitigated | Pages sends no configurable headers, so HSTS, `X-Content-Type-Options`, `Permissions-Policy` and `X-Frame-Options` cannot be set here. The policy that *can* travel in the document was added. This is a host limit recorded, not a fix claimed. |
| Content Security Policy | Present & correct | `<meta http-equiv="Content-Security-Policy">` on `index.html` and `feedback.html`: `default-src 'self'`, `script-src 'self'`, `object-src 'none'`, `base-uri 'none'`, `connect-src` limited to the two Open-Meteo hosts (and `'none'` on the local answers page). Enforced by `tools/verify.js`, which also refuses an inline `<script>` that the policy would block. |
| Clickjacking | Missing (host limit) | `frame-ancestors` is ignored in a meta tag and Pages cannot send `X-Frame-Options`. Closing it needs a custom domain behind a proxy that sets headers. |
| CORS | Not applicable | No API of our own and no credentialed cross-origin request. |
| Rate limiting | Not applicable | No endpoint of ours. The weather lookup is one GET per district on request and is cached in memory for the life of the tab; Open-Meteo applies its own limits. |
| Encryption at rest | Present & correct (device) | Data is in the browser's `localStorage`, covered by the device and browser profile. No server copy exists. |
| Audit logs | Not applicable (server) | No server events to log. The review importer prints exactly what it would record, and git history is the audit trail for catalogue and source changes. |
| Dependency vulnerabilities | Present & correct | No npm dependencies and no lockfile, so there is no dependency tree to audit. The only third-party code is the workflow actions, now watched by Dependabot. |
| Penetration testing | Missing | No formal test. The CSP was exercised in a real browser (see Verification); the manual checklist at the end of this file is the starting point for an actual attempt. |

### Phase 2: reliability and data integrity

| Item | Status | Evidence or action |
| --- | --- | --- |
| Error handling | Present & correct | Weather failures are classified (`offline`, `not_found`, `unreachable`) and shown as sentences. `fetchJson` rejects on HTTP errors *and* on Open-Meteo's 200-with-error body. No stack trace reaches a farmer. |
| HTTP status codes | Not applicable | No server routes. The worker answers 503 or 504 with an explanation when the network is gone and nothing is stored. |
| Timeouts | Present & correct | The only outbound calls are weather, with a 12s `AbortController` timeout. |
| Exponential backoff | Missing | A failed weather lookup is not retried automatically; the person can ask again. Deliberate: a silent retry against a free service on a weak link mostly delays the honest failure message. |
| Idempotency | Not applicable | No write leaves the device. Saving a plan and recording a review are local and repeatable. |
| Circuit breakers | Not applicable | One third-party dependency, called only on request, with a single attempt. |
| Race conditions | Present & correct | No shared server state. Two tabs are the only overlap, and last-write-wins on a per-device draft is acceptable. |
| Async handling | Present & correct | Promise chains with a `.catch` on every path; no unhandled rejection surfaced in the suite. |
| Memory leaks | Present but flawed | The in-memory forecast cache is unbounded, keyed by district name. Bounded in practice to 20 districts; not proven by a test. |
| Database migrations, normalisation, indexing, soft deletes | Not applicable | No database. |
| Time zones | Present but flawed | Forecast days use the API's `timezone=auto` and are formatted on the device; stored timestamps are ISO UTC. Not tested on a device with an unusual clock. |
| Character encoding | Present & correct | UTF-8 declared on every page; the CSV export is `text/csv;charset=utf-8`; Hindi and Urdu live in the same files. |
| Webhooks | Not applicable | None. |
| Background jobs, cron, queues | Not applicable | None. Recording a review is a manual command run by the maintainer. |
| Backups and disaster recovery | Not applicable, with a caveat | No server data to back up; git is the recovery path for the app. A farmer's saved plans exist only on their phone and are lost if browser data is cleared, which the About page states plainly. |
| Health checks and graceful shutdown | Not applicable | No long-running process. |

### Phase 3: performance and scale

| Item | Status | Evidence or action |
| --- | --- | --- |
| Connection pooling | Not applicable | No database connections. |
| Caching and invalidation | Present & correct | Network-first for app files so an edit cannot be shown stale, cache-first for versioned font files, weather never cached, and `CACHE_VERSION` drops everything else on activate. `npm run offline` fails if the browser's cache name is not the one in `sw.js`. |
| CDN | Present & correct (host) | Pages serves through a CDN. Filenames are not content-hashed, so correctness rests on the network-first worker and `no-store` on navigations. |
| Reverse proxy, gateway, load balancing | Not applicable | Static host. |
| Horizontal scaling, stateless services | Present & correct | Nothing is kept server-side, so any number of copies is identical. |
| Read replicas | Not applicable | No database. |
| Profiling and load testing | Missing | No load test, because there is no endpoint to load. Lighthouse covers the page; see `LIGHTHOUSE.md`. |
| Performance budgets | Present & correct | `tools/budget.js` fails the build above 119.9 KB JS, 16.1 KB CSS, 12.0 KB HTML, 143.6 KB total (gzipped). |
| Cost monitoring | Present & correct | No metered service and no paid API. The only cost is hosting, which is free at this size. |

### Phase 4: observability and operations

| Item | Status | Evidence or action |
| --- | --- | --- |
| Structured logging | Not applicable | No server. Shipped code is required by lint to write nothing to the console, which also keeps a typed village name out of a log. |
| Monitoring, alerting, uptime | Missing | No external uptime check on the Pages URL. Recommended and listed under manual steps. |
| Error tracking | Missing (deliberate) | No Sentry or equivalent. Adding one would create a data flow the privacy text does not describe, from devices that may be shared. Not added. |
| Distributed tracing | Not applicable | One static origin. |
| Docker | Not applicable | No container is built or run. |
| CI/CD | Present & correct | `ci.yml` runs `npm test` on pushes and pull requests plus a 360px phone audit in headless Chrome; `pages.yml` re-runs the suite before publishing an allowlisted folder. No separate secret-scanning action, because `tools/lint.js` does that check and fails the build. |
| Staging environment | Missing | Only `main` and the live Pages site. A pull request's CI run is the gate; there is no second URL. |
| Infrastructure as code | Not applicable | Hosting configuration is repository settings. |
| Feature flags | Not applicable | One build, no gradual rollout, no kill switch to pull. |

### Phase 5: engineering practice, UX, compliance

| Item | Status | Evidence or action |
| --- | --- | --- |
| Automated testing | Present & correct | 359 checks: lint, reference and offline reconciliation, self-tests, logic tests, budget, translation parity, and the review-pack check, plus the 360px phone audit in CI. There is no authorization test to write because there are no accounts. |
| Code review, branching | Present but flawed | A pull request template and CI exist. Branch protection is a repository setting and cannot be verified from here; see manual steps. |
| Semantic versioning | Present & correct | Tagged releases `v1.2.x` with notes, and a `CHANGELOG.md` entry per release. |
| API documentation | Not applicable | No API. `docs/README.md` maps the documents instead. |
| Technical debt | Present but flawed | Listed below, ranked, and not refactored as part of this audit. |
| Data privacy | Present & correct | No accounts, no analytics, no tracking, no server copy. The About page names what is stored, where, and how to remove it. The CSV export is created on the device with a revoked blob URL. |
| Accessibility | Present but flawed | Landmarks, labels, `aria-live`, visible focus, contrast checked by `verify.js`, tap targets by `phone-check.js`, Lighthouse accessibility 100. Not tested with a screen reader or with a keyboard-only user on a real device. |
| Mobile responsiveness | Present & correct | A 360px audit runs in CI, and the tehsil and land cards were checked at 320px. Not tested on low-end hardware. |

## Findings by severity

**High — no Content Security Policy on a page that renders stored, typed text.**
`index.html` built its output with `innerHTML`, and the page had no policy, so
any injection that reached the DOM would run with full privileges. Fixed: a meta
CSP with `script-src 'self'` on both pages, the one inline handler and the one
inline script moved into `js/fonts.js` and `js/feedback-page.js`, and a build
check that refuses a weakened policy or a new inline script.

**Medium — no response headers are possible on GitHub Pages.**
HSTS, `X-Content-Type-Options`, `Permissions-Policy`, `X-Frame-Options` and
`frame-ancestors` are unavailable. Not fixable in this repository. Documented in
`SECURITY.md` and here, with the proxy/custom-domain route named as the fix.

**Medium — the service worker keeps serving if a deploy is later found bad.**
The worker is network-first, so a corrected deploy reaches a device on the next
online load, but a device that stays offline keeps the copy it has. Accepted for
an offline-first app; the alternative (no offline shell) defeats its purpose.

**Low — Google Fonts is a third party on first load.**
The CSS request reveals the visitor's IP and, until the referrer policy was
stated, the page URL, to Google. SRI is not possible for the user-agent-specific
CSS. Fixed in part by `strict-origin-when-cross-origin`; self-hosting the two
typefaces would remove the dependency, at the cost of repository weight and a
licence note.

**Low — typed plot details sit unencrypted in `localStorage`.**
Anyone with the unlocked phone and the browser profile can read them. The app
says so, and offers Start over. Encrypting at rest with a key stored beside the
data would add ceremony without a real boundary.

**Low — the in-memory forecast cache never evicts.** Fixed in 1.2.6: the cache
holds at most twenty districts, least recently used first out, and the self-test
loads twenty-two to prove that one is dropped and that a town still cached is
served without a second request.

## Technical debt, ranked

None of this was refactored as part of the audit. Risk is about what a farmer or
an officer could be misled by; effort is the size of the change, not its value.

| Debt | Risk | Effort | Why it is still open |
| --- | --- | --- | --- |
| The catalogue has no officer review | High | One visit | Cannot be closed in code. Every screen says so, and `REVIEW.md` is the pack |
| Hindi and Urdu are unchecked, 142 keys | High | One fluent reviewer | Machine text next to advice reads as approval; `reviewed: false` is shown |
| `innerHTML` templates depend on hand-written escaping | Medium | Days, plus fuzzing | Correct by reading today; `script-src 'self'` is the backstop, not a proof |
| No village-level data | Medium | Weeks of sourcing | Three official series disagree; recorded in `issues/004-village-directory.md` |
| Google Fonts is a third party on first load | Low | An afternoon | Self-hosting adds weight and a licence note to the repo |
| The verifier reported before its last four sections ran | High, because every check added after it was decorative | An hour | Fixed in 1.2.6: the report is now the last statement in `tools/verify.js`, and the link and heading rules it exposed were corrected to test their intent |
| The review pack changes on every version bump | Low | Minutes | Churn, not risk; the `--check` keeps it from going stale |
| No staging URL | Low | An hour | A pull request's CI run is the gate; Pages serves `main` only |

## Files changed by this audit

- `index.html`, `feedback.html`: CSP and referrer meta; inline handler and inline
  script removed.
- `js/fonts.js`, `js/feedback-page.js`: the extracted behaviour.
- `sw.js`: both new files precached, `CACHE_VERSION` to `mlmp-v39`.
- `tools/verify.js`: the policy check, and a reference/precache check for
  `feedback.html`.
- `.github/dependabot.yml`: weekly action updates.
- `SECURITY.md`, `docs/README.md`, `README.md`, `CHANGELOG.md`: the limits and
  the pointer to this file.

## What I could not verify from here

- Branch protection, Dependabot alerts and secret scanning are repository
  settings; this workspace cannot read them.
- HSTS and the actual response headers on the live site: Pages sets them, not
  this repository.
- Any behaviour on a real low-end Android, a real printer, or with a screen
  reader.
- That the escaped `innerHTML` paths are correct in every attribute context.
  Reading the helpers is not the same as fuzzing them.

## Manual steps for the owner

1. Turn on **Dependabot alerts** and **secret scanning** in repository settings
   (Settings → Code security). Dependabot *version* updates are configured;
   alerts are a dashboard switch.
2. Turn on branch protection for `main`: require the CI check, and require a
   pull request. This is the review gate the audit cannot confirm.
3. Add a free external uptime check on the Pages URL, with an alert to an address
   that is actually read. Nothing currently tells you the site is down.
4. If clickjacking and HSTS matter for this audience, move to a custom domain
   behind Cloudflare (or any proxy that sets headers) and add
   `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`,
   `X-Frame-Options: DENY` and `Permissions-Policy` there.
5. No key needs rotating: there is none in this repository or its history (see
   Verification). If a key is ever added, rotate it before removing it from
   code, since removal does not invalidate it.

## Manual penetration checklist

Try these against a local copy, not the live site, and not with anyone's real
details:

1. Paste `"><img src=x onerror=alert(1)>` into the village field, save a plan,
   reopen it, and press every export button. Nothing should execute; the text
   should appear literally. The CSP must log a refusal if an `onerror` is
   reached at all.
2. Put the same string into the field-test answers page, export the CSV, and open
   it in a spreadsheet. No cell should evaluate as a formula.
3. Hand `tools/import-review.js` a CSV with an extra column, a formula in
   `correction`, and a wrong `sheet_version`. It must refuse the whole file.
4. With DevTools, delete the CSP meta tag and confirm the build check fails.
5. Switch the phone to airplane mode after one load and walk the whole journey:
   form, options, visit card, saved plans. Only weather should fail, with a
   sentence rather than a blank box.

## Verification

Run on this machine on 2026-11-11, before the commit that adds this section.

- `npm test`: 359 checks passed. Lint 29 files; 25 scripts parse, 27 local
  references resolve, 33 assets precached; JS 117.5 KB of 119.9 KB, total
  144.6 KB; translation check 142 keys across 3 languages; review pack 42 files
  current.
- `git log --all -S` for `AKIA`, `PRIVATE KEY` and `sk-`: no commit adds one.
  There is no key in this repository or in its history.
- Browser at `127.0.0.1:8080`: the policy is present in the DOM,
  `script-src 'self'` is in force, the webfont link flips to `all` through
  `js/fonts.js`, both typefaces load from `fonts.gstatic.com`, and the console
  shows no CSP violation. Fifteen districts and 162 tehsil names still render.
- `npm run offline`: passed. The browser's caches are `mlmp-v39-core` and
  `mlmp-v39-fonts`, the worker controls the page, and 5 steps with 36 headings
  render with the network off.

Run again on 2026-11-12 for 1.2.6, after the report was moved to the end of
`tools/verify.js`:

- `npm test`: green. The self-test now runs 175 checks, including three on the
  forecast cache: the newest stays, the oldest is dropped, and a cached town is
  served without a new request. JS 118.1 KB of 119.9 KB; total 145.3 KB.
- The guard was exercised, not assumed: removing the Escape handler, or putting
  the old village wording back into `index.html`, makes `npm run build` exit 1
  with a sentence naming the file. A planted dead in-page link does the same —
  before the move it did not, because the report had already printed.
- The markup check found two real drifts when it was first run: the home page
  still described "a typical year for each" and a "comparison" that the English
  strings had already replaced. Both are fixed in the same release.

Not verified: response headers on the live Pages site, branch protection and
alert settings, any real-device behaviour, the Esc key in a real screen reader,
and the escaped `innerHTML` paths in attribute context.

