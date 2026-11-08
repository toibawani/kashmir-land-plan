# Changelog

What changed, and why. The app has no runtime dependencies, so a release is the
folder itself; each entry is a change a farmer or an officer could notice.

The project follows [Semantic Versioning](https://semver.org/). The patch number
moves for a correction that does not touch the catalogue; the minor number moves
when a screen or the sheet format changes; the major number has not moved and
should not, because the catalogue is still unreviewed.

## [Unreleased]

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

- Tehsil names for thirteen districts — Kupwara (16), Budgam (9), Srinagar (7),
  Reasi (9), Kathua (11) and Poonch (6) — each counted against the official table
  and cited to its own district page. Every other district says its names are not
  held, and the build refuses a list that does not reconcile or carries no
  citation.
- `npm run offline`: drives Chrome over the DevTools protocol, switches the
  browser offline, reloads and checks what rendered. It passes on `mlmp-v33`,
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
