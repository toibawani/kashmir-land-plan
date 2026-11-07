# Master brief: make this the best honest land-planning app in J&K

Paste this whole file as the task. It is written to be handed to an agent with
the repository already open. It assumes the reader has run `npm test` once.

---

## The project

A static, offline-first PWA at `/Users/apple/Desktop/kashmir-land-plan` that
helps a farmer in Jammu & Kashmir work out what to do about their land and which
office to visit. No backend, no tracking, no accounts. Twenty districts, a
catalogue of government schemes, a one-page printable review sheet, and a
district-level land reference.

Current state, which you should verify rather than trust: 207 logic checks,
42 review-sheet files, 22 shipped scripts, 30 precached assets, `sw.js` at
`mlmp-v22`.

**Read before touching anything:** `README.md`, `docs/DECISIONS.md`,
`docs/README.md`, `NEEDS_SOURCES.md`, `TRANSLATION_CHECK.md`, `FIELD_TEST.md`,
`tools/claims.js`, `tools/verify.js`, `tools/tests-logic.js`, `js/sources.js`,
`js/catalogue.js`, `js/land.js`, `js/regions.js`.

## The one rule that outranks every other goal

**Nothing on a screen may be a fact this repository cannot cite.** Not a yield,
not an amount, not a deadline, not an eligibility line, not a village's soil, not
a sentence attributed to an officer. If a source does not say it, the app says it
does not know, and says where the answer actually lives.

This is not caution for its own sake. A farmer who reads an invented number and
acts on it loses a season, or a claim. The app's credibility *is* its product.

Corollary: a feature that requires inventing data is not a feature. Replace it
with the nearest true thing plus a pointer to the office that holds the rest.

## What "best" means, measurably

Ten outcomes. Each one is either true at the end or the work is not done.

1. **A village name can be found.** Type "Kulgam" or "Tral" and the app finds the
   village, its tehsil, its block, and the patwar halqa that holds its record —
   with the count of villages per district reconciling to the official totals.
2. **No village claims agronomy.** The village result states plainly that crop,
   soil and irrigation detail for that village is in the jamabandi and the
   agriculture office, and names what to ask for. No exceptions, no "typical".
3. **Every number is traceable.** Every figure on every screen resolves to an
   entry in `js/sources.js` with a URL and the date it was read. A build check
   fails if any screen shows a figure with no source behind it.
4. **The land card survives the 360px screen.** Readable at 320px, tap targets
   ≥44px, no horizontal scroll, no clipped table, print still one page.
5. **Offline is indistinguishable from online** for everything except live
   lookups: installed app opens, all screens render, the review sheet prints,
   with the radio off.
6. **Accessibility is not an afterthought.** Keyboard-only completion of the
   whole form, visible focus, correct headings, labels, error announcements,
   `prefers-reduced-motion` respected, contrast ≥4.5:1, axe clean on every screen.
7. **The sheet is the artefact a farmer carries.** One page, correct at 100%,
   no orphaned headings, footer with version and digest, and a test that fails if
   a new catalogue entry pushes it to two pages.
8. **Three languages, one honest label.** English, Hindi and Urdu complete; each
   marked as awaiting native review until a named reviewer signs off.
9. **CI is the referee.** Every rule above is a test, not a convention. The suite
   runs on a clean clone with no network and fails loudly with a message that
   says what to fix.
10. **A stranger can contribute.** `CONTRIBUTING.md` gets them from clone to a
    passing suite to a merged PR without asking anyone a question.

## Workstreams, in the order they pay off

### 1. Village directory (the biggest honest win)

Build `js/villages.js` from a citable village directory — the Census 2011
village directory or the LGD village list — not from memory and not generated.
Ship **names and administrative parents only**: village, tehsil, block, district,
and the patwar halqa where the source gives it.

- Search: accent- and case-insensitive, token-prefix matching, ranked, keyboard
  navigable, works offline, no server.
- Budget: keep the payload under ~350KB gzipped by storing compact tuples and
  decoding at runtime; lazy-load per district if needed.
- Reconcile: per-district village counts must equal the official table already in
  `js/land.js` (`admin().villages`); a mismatch is a build failure, not a warning.
- If a district's list cannot be sourced, ship the other districts and show an
  explicit "list not held for this district" state. Never fill the gap with
  plausible names.

### 2. Tehsil-level narrowing

Add the tehsil names each district publishes on its own NIC site, cited per
district. The land card narrows to "the tehsil you picked is in these zones"
without asserting anything about a specific field. Keep the count check: tehsils
per district must match `admin().tehsils`.

### 3. Scheme catalogue depth

For each scheme: the official document, the office that decides, what the farmer
must bring, and the date the status was last confirmed. Remove or flag anything
whose status cannot be re-confirmed within the last year. Do not add schemes that
exist only in news articles.

### 4. Frontend craft

Perf: measure first (`LIGHTHOUSE.md`), then cut. Targets: LCP <2.0s on a Moto G4
profile, JS ≤150KB gzipped total, CLS <0.05, no render-blocking third party.
Then polish: consistent spacing scale, one accent colour, focus states, empty
states, error states, and a real loading state for anything slow. No new
dependency without a paragraph in `docs/DECISIONS.md` explaining what it replaces.

### 5. Translation, done properly

Complete `hi` and `ur` for every new string. Keep the unreviewed banner, keep
`TRANSLATION_CHECK.md` honest, and make the test fail when a key exists in one
locale and not another. Do not machine-translate legal or administrative terms
without a gloss.

### 6. Verification as product

- Extend `tools/claims.js` to cover village and tehsil copy.
- Add a provenance test: any numeric literal rendered by a panel must map to a
  registered source id.
- Add a payload budget test for the village data.
- Add an axe/basic-DOM accessibility check for every screen.
- Wire it all into `npm test` and CI, with messages that name the file and fix.

### 7. Release

`v1.1.0`: changelog, screenshots at 360 and 1280, README updated, `sw.js` cache
bumped, CI green, Pages deploy verified in a browser — not just "uploaded".

## How to work

- One concern per commit, Conventional Commits, imperative subject, body explains
  *why*. Push each commit. Never bundle a data change with a styling change.
- Run `npm test` before every push. If it fails, fix the cause, never the
  assertion, and never add a suppression.
- When you cannot source something, write it down in `NEEDS_SOURCES.md` with what
  exactly is missing and which office would publish it.
- Record every judgement call in `docs/DECISIONS.md`: what you gave up, and what
  would change your mind.
- Verify UI in a browser at 360px and 1280px, online and offline. A passing test
  suite is not a rendered screen.
- Stop when the ten outcomes are true. Do not add features to look busy.

## Anti-goals, ranked by how much damage they do

1. Inventing village-level crops, soils, yields or irrigation.
2. Writing officer quotes or reviews that no officer gave.
3. Adding a "typical income" or "expected profit" figure.
4. Adding a dependency to solve a layout problem.
5. Growing the catalogue faster than sources can be re-verified.
6. Making the app louder instead of clearer: more colour, more cards, more steps.
7. Burying the caveat below the claim.

## Definition of done

The ten outcomes hold, `npm test` is green on a clean clone, CI is green, the
Pages deployment was opened in a browser at 360px and 1280px, offline reload
works after install, the print sheet is one page, and every figure on every
screen has a source a sceptical farmer could check.

## Status against this brief

Checked against the tree on 7 November 2026. "Done" means a check enforces it or
a measurement confirms it, not that work was attempted.

| # | Outcome | Status |
| --- | --- | --- |
| 1 | A village name can be found | **Not done.** `js/villages.js` does not exist; no verified list was obtained. Publishers and the reconciliation rule are in NEEDS_SOURCES.md. |
| 2 | No village claims agronomy | Holds only because there are no village rows. |
| 3 | Every number is traceable | **Partial.** Enforced for the land panel (build check 11e). Other screens still rely on the catalogue's own source field, which is not a build check. |
| 4 | Survives 360px | **Holds at 320 and 360.** At 360×740 the card is 112px collapsed, 9 chips of 44px on 4 lines, no page overflow. At 320 the page is 320px wide with no overflow, chips 44px, summary 53px, copy button 44×144px, heading not clipped. |
| 5 | Offline is indistinguishable | **Not re-run.** The cache moved to `mlmp-v28`; no install-and-reload-with-radio-off test after the panel and copy button landed. |
| 6 | Accessibility | **Partial.** Static checks, a keyboard walk (30 controls, 0 unnamed, 0 positive tabindex, 0 duplicates) and an axe-core 4.10.2 run (WCAG 2.0/2.1 A and AA) pass: one serious violation found — an unnamed progress bar — and fixed. Colour contrast was reported as needing manual review. Focus rings exist in CSS for every control but their pixels were not confirmed under automation. |
| 7 | Sheet is the artefact | Holds: 42 files, one page each, checked by `npm test`. |
| 8 | Three languages, one label | **Partial.** Parity is enforced for `js/messages.js`; the land panel's copy has no `land.*` keys and is English only. |
| 9 | CI is the referee | **Holds for the suite.** `npm test` passes from a fresh clone with no dependencies, in about two seconds, and that run caught a real defect: the sheet generator wrote CRLF while git stores LF, so every clone failed the pack check until both sides were LF. Provenance, payload and accessibility checks are enforced. The network-off offline test is still not run; the cache audit is only a proxy. |
| 10 | A stranger can contribute | **Partly proven.** A fresh clone reaches a green suite with `npm test` and serves the app on port 8080. The pull-request and review path was not walked. |

### Workstreams

| Workstream | State |
| --- | --- |
| 1. Village directory | Not started: blocked on a verified data file. |
| 2. Tehsil narrowing | Not started: the counts are shown, the names are not sourced. |
| 3. Catalogue depth | Not started this round. |
| 4. Frontend craft | Partial: payload measured and enforced, 360px measured; LCP was not re-measured. |
| 5. Translation | Partial: parity test predates this work; the land copy is untranslated. |
| 6. Verification as product | Done: checks 11e, 11f and `tools/budget.js` are in `npm test`. |
| 7. Release v1.1.0 | Done: version 1.1.0, changelog section, 20 regenerated sheets (42 pack files current), annotated tag pushed, GitHub release published. |

**Summary: three outcomes hold outright (2 vacuously, 4, 7) and one workstream
(6) is complete; six outcomes remain partial, and the village directory and the
land translation are not started.** The machine-checkable half of the brief is in
place and shipped in v1.1.0; the village-name half is still blocked on a data file.
