# Changelog

What changed, and why. The app has no runtime dependencies, so a release is the
folder itself; each entry is a change a farmer or an officer could notice.

The project follows [Semantic Versioning](https://semver.org/). The patch number
moves for a correction that does not touch the catalogue; the minor number moves
when a screen or the sheet format changes; the major number has not moved and
should not, because the catalogue is still unreviewed.

## [Unreleased]

### Added

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
