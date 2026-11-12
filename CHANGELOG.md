# Changelog

What changed, and why. The app has no runtime dependencies, so a release is the
folder itself; each entry is a change a farmer or an officer could notice.

The project follows [Semantic Versioning](https://semver.org/). The patch number
moves for a correction that does not touch the catalogue; the minor number moves
when a screen or the sheet format changes; the major number has not moved and
should not, because the catalogue is still unreviewed.

## [Unreleased]

Nothing yet.

## [1.2.7] - 2026-11-12

### Fixed

- A device that refuses to store a plan no longer gets told the plan was saved.
  `MLMP_PLANS.upsert()` returned the plan whether or not the write landed, so a
  browser in private mode, or a device with no room left, showed "Saved as ..."
  over an empty list. It now returns null on a refused write, and the results
  screen says the plan was not saved and points at Download and at freeing
  space.
- The eight-plan limit is stated before it is reached. The My plans heading
  reads "3 saved plans of 8 this device keeps", and a ninth save is refused
  with a sentence asking which plan to delete, instead of quietly pushing the
  oldest one out of the list.
- A ticked question that could not be written back to a saved plan now says so,
  rather than implying the visit note reached the plan when it only reached the
  draft.

### Build

- New check: every file in `js/` must be loaded by a page and precached by
  `sw.js`. A shipped script that nothing requests is either dead weight or the
  wiring mistake that once left the tehsil names invisible.
- The self-test now covers the storage boundary: a store that throws on write
  must report no plan and list nothing, and the store must hold its stated
  maximum of eight.

## [1.2.6] - 2026-11-12

### Fixed

- The home page's "What you enter" and "What you get" paragraphs now say what
  the English strings say. The markup had kept an older sentence about "a
  typical year for each" and a "comparison", and the script replaced it on
  load, so only a reader with JavaScript off met the stale text.
- The navigation menu closes on Escape and puts focus back on the button that
  opened it. Before this, a keyboard reader who opened the menu by mistake had
  no way to dismiss it.
- The forecast cache is bounded to twenty districts, least recently used first
  out. A tab left open across a long afternoon used to hold every town it had
  ever looked up, and nothing ever removed one.

### Build

- `tools/verify.js` printed its pass message and returned before the last
  sections ran, so a failure in any of them — dead in-page links, the heading
  rule, the tehsil data checks, the new markup and keyboard rules — could never
  fail the build. The report now runs last.
- Two of those sections were also wrong once they finally ran: the link check
  treated the router's `#plan` and `#weather` hashes as missing ids, and the
  heading rule counted one h1 per document when this page carries ten screens.
  Both now test the intent: a hash is either a real id or a known route, and
  every screen carries exactly one h1 with exactly one screen visible.
- Two new checks: the text inside a `data-i18n` element must equal its English
  string, and `js/app.js` must keep closing the menu on Escape.

## [1.2.5] - 2026-11-11

### Security

- The printed review pack now carries its own policy. Every district sheet, the
  cover and the print-all file declare `default-src 'none'` with inline styles
  only, so a sheet opened from a download or an email cannot run script. They
  also send no referrer.
- `npm run build` now cross-checks the app's policy against `js/weather.js`: add
  a weather host to the code without a matching `connect-src` and the build
  fails, instead of the weather being blocked silently on a phone.

### Changed

- `docs/AUDIT.md` ranks the remaining technical debt by risk and effort, so the
  things left undone are a list rather than an impression.

## [1.2.4] - 2026-11-11

### Security

- Both shipped pages now carry a Content Security Policy with `script-src
  'self'`: any injected inline script is inert. GitHub Pages cannot send a
  response header, so the policy lives in the document, and `npm run build`
  refuses a page whose policy is missing, weakened, or written beside an inline
  script that the policy would silently block.
- The only inline event handler (the webfont link's `onload`) and the only
  inline script (the field-test answers page) moved into `js/fonts.js` and
  `js/feedback-page.js`, so no page needs an inline-script exemption. Inline
  *styles* are still allowed, because the field-test page has its own stylesheet
  and the app sets element styles at runtime; styles cannot execute.
- A referrer policy of `strict-origin-when-cross-origin` is now stated in both
  pages rather than left to the browser default.
- `docs/AUDIT.md` records what was checked, what was fixed, and what a static
  host cannot do (HSTS, `frame-ancestors`, `X-Content-Type-Options`).

### Added

- `.github/dependabot.yml`: weekly updates for the workflow actions, the only
  third-party code this repository runs.

### Changed

- `SECURITY.md` and `docs/README.md` point at the audit, so the limits are not
  discoverable only by reading the workflow.

## [1.2.3] - 2026-11-08

### Added

- Tehsil names for Pulwama (8) and Ramban (8), taken from the tehsil column of the
  Revenue Department's patwar halqa tables rather than the district pages, counted
  against the official table and cited. Pulwama's table prints one tehsil as
  "Shahoora Litter", and that is what ships.

### Fixed

- Srinagar's seven tehsils had been lost when the data file was rebuilt for
  1.2.2, while that release's notes claimed thirteen districts; it is restored and
  a test now fails if a district cites a page but holds no names.
- `npm run offline` reused one Chrome profile, so an old service worker stayed
  registered and the check kept passing against `mlmp-v32` while `sw.js` declared
  `mlmp-v34`. It now uses a fresh profile per run and fails if the cache in the
  browser is not the version in `sw.js`. The claim in the 1.2.1 notes that it
  passed on `mlmp-v33` was wrong for the same reason.

## [1.2.2] - 2026-11-08

### Added

- Tehsil names for seven more districts — Anantnag (12), Doda (17), Jammu (21),
  Kishtwar (11), Kulgam (7), Rajouri (13) and Shopian (7) — each counted against
  the official table and cited to the page it came from. Doda and Shopian publish
  tehsildar designations rather than a name column, which is what is used.

### Changed

- Baramulla stays without names even though its page lists eighteen rows: one
  cell is truncated to "Singh" and Rafiabad is missing, so the count matches and
  the names would still be wrong. The tests now assert that exclusion rather than
  naming whichever district happened to be uncovered.

## [1.2.1] - 2026-11-08

### Added

- Tehsil names for six districts — Kupwara (16), Budgam (9), Srinagar (7),
  Reasi (9), Kathua (11) and Poonch (6) — each counted against the official table
  and cited to its own district page. Every other district says its names are not
  held, and the build refuses a list that does not reconcile or carries no
  citation.
- `npm run offline`: drives Chrome over the DevTools protocol, switches the
  browser offline, reloads and checks what rendered. It passes, and it refuses a
  run whose cache version does not match `sw.js`,
  with five step controls, 36 headings, the About counts and the banner present
  with no network.
- `npm run offline -- --throttle`: the same run under 4x CPU and fast 3G, which
  measures 612 ms to largest contentful paint against a 2.0 s target.

### Fixed

- `js/tehsils.js` shipped once without a script tag, so the card silently said no
  names were held. A build check now refuses a data file that is loaded nowhere or
  left out of the offline list.
- The precache check was confirmed to fail when an entry is removed, rather than
  passing against the list it was comparing.

## [1.2.0] - 2026-11-08


### Fixed

- The land card's district heading had no `tabindex`, so the focus move after a
  neighbouring-district jump did nothing and a keyboard user was left at the top
  of the page.
- The language selector and the menu button were announced in English in every
  language; the offline banner and the skip link likewise.

### Added

- The land card's interface in Hindi and Urdu: headings, fact labels, the copy
  button, the same-division heading and the village counts sentence come from the
  shared dictionary and re-render when the language changes. The district prose
  and the caveat stay in English on purpose, and the review sheet lists all 26
  new strings for a native speaker.

- A **Save as text file** button on the land card, and **Share** where the device
  has a share sheet, so the district summary reaches a message or a printer
  without retyping it. Both use the same text as the copy button, caveat and
  sources included.
- The offline banner and the skip link are translated, so the first two things a
  screen reader and a disconnected reader meet are in the chosen language.
- Land-card headings can now take focus, so jumping to a neighbouring district
  announces the new district instead of silently replacing the card.

## [1.1.0] - 2026-11-07

### Added

- The Union Territory's land use on the district card — forest, net area sown and
  irrigated share — labelled as UT figures rather than district ones.
- A **Copy these details** button that puts the visible card, its caveat and its
  source links into plain text for a message to the office.
- A provenance check: every figure the land panel prints must trace to a
  registered source, and the panel must still render it.
- A payload budget (`tools/budget.js`) enforced by `npm test`, with the measured
  sizes recorded in LIGHTHOUSE.md.
- Static accessibility checks: every button must have readable text or a label,
  every control a `<label>` or `aria-label`, every image an `alt`.
- The official 2024-25 district table in the land panel: area, 2011 population,
  blocks, tehsils and revenue villages for each of the twenty districts, with the
  sums checked against the published division and UT totals.
- Same-division districts as tappable chips under the land card, each switching
  the district without leaving the form.
- A district land reference (`js/land.js`): the zones each district spans, height
  and rainfall bands, soils, field crops and fruit, each tied to a registered
  source, shown under the district picker and cited with its documents.
- A plain answer to the village question on the About screen: 6,314 villages in
  the 2011 census, 6,832 revenue villages, 1,646 patwar halqas, and the statement
  that this app holds a record of none of them and the jamabandi is where to look.
- Six new registered sources, from the J&K Directorate of Economics and
  Statistics, the Horticulture Department, ICAR, CGWB and the Forest Survey of India.
- A build check that scans the land copy for money, deadline and eligibility
  claims while allowing measured figures such as altitude bands.
- A build check that every screen has a heading and every `data-i18n` key in the
  page exists in `js/messages.js`.
- A build check that each manifest icon exists and is the size the manifest
  claims, read from the PNG header.
- Lint rules against `document.write` and string-evaluated timers.
- Tests for a CSV saved by Excel (byte-order mark and CRLF endings), duplicate
  rows, unknown columns, an over-long reviewer name, and a correction that is
  only spaces.
- A test that no line on the office visit card states an amount, deadline or
  rule.
- `docs/README.md`, a map of which document answers which question.
- `CHANGELOG.md`, `SECURITY.md`, an editorconfig, issue templates and an index
  of the open issues.

### Changed

- Reduced motion is honoured: the app keeps every word and drops the movement.
- Form controls stay light in a browser set to dark mode.
- The installed app has a stable manifest id, and the service worker cache name
  moves to `mlmp-v20` so this round replaces the last one.
- The local server sends a referrer policy and a permissions policy.

## [1.0.0] - 2026-11-07

The first frozen release. From here, edits come from real feedback: a marked
review sheet or a field test.

### Added

- A footer on every page of every district review sheet: district name,
  `page X of Y`, and the sheet version (`v1.0.0 · catalogue d20337e`).
- A `sheet_version` column in every prefilled review CSV, matching the sheet.
- A refusal in the importer when a file was printed from a different catalogue,
  when a file mixes versions, or when it carries no version at all. It prints the
  version it is importing and asks for a reprint rather than guessing.
- `tools/lib/pack-version.js`, which derives the version from `package.json` and
  a digest of the three catalogue files.
- A status block at the top of the README, naming the version and the three open
  items: no officer review, no field test, no native-speaker check of Hindi or
  Urdu.
- Tests for the version column, the stale-print refusal and the mixed file.

### Changed

- Review sheets are paginated by the generator (fixed-height pages with their
  own footers) instead of leaving page breaks to the browser, because Chromium
  cannot print a page number into a margin box.
- The maintainer-only note on a district sheet is screen-only, so it no longer
  prints as a third page with nothing on it.
- `package.json` is 1.0.0.

### Fixed

- A rendered sheet could say `page 1 of 2` and still print a third page.
- A check of the district altitude defaults was written against three of the four
  offered altitudes and reported six districts as broken. The form offers
  `hills` as well; the data was right and the check was wrong. The finding is
  withdrawn and the check now reads its list from `regions.js`.

[1.0.0]: https://github.com/toibawani/kashmir-land-plan/releases/tag/v1.0.0
