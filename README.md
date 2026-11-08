# My Land, My Plan

An offline-first J&K land planning PWA that helps farmers prepare practical
options and office-visit questions without inventing scheme eligibility or crop
guarantees.

**Prepare for the agriculture office visit.**

**Live:** <https://toibawani.github.io/kashmir-land-plan/>

It works with no signal once the page has loaded: the form, the options, the
visit card, the saved plans. Only the weather needs a connection.

## Status

**Version v1.2.2.** Nothing here is signed off by anyone. Three things are open,
and each line comes out only when the data behind it changes:

1. **No officer has reviewed the catalogue.** Every screen that shows a
   suggestion says so. The review process, the printable sheets and the CSV
   importer are in `REVIEW.md`; the fields stay empty until a real reply
   arrives.
2. **No field test has been run.** `FIELD_TEST.md` holds the script and the
   one-page form. No farmer has used the app with anyone watching yet.
3. **Hindi and Urdu are not checked by a native speaker.** Both are marked
   `reviewed: false`, the language menu says so beside the name, and a notice
   stays on screen while either is selected.

The release is [v1.2.2](https://github.com/toibawani/kashmir-land-plan/releases/tag/v1.2.2);
what changed, and what was deliberately left out, is in `CHANGELOG.md`.

It was also only checked in a browser at 360px and in Lighthouse, not in a
hand, in the sun.

Numbers per option are `ask the officer` wherever no public document supported a
figure. `NEEDS_SOURCES.md` is the list of what is still missing. There is no
amount, deadline, yield or income claim anywhere in the app, and the build fails
if one appears.

## What it does

- Takes a district, an altitude zone and four more answers about a plot.
- Suggests two or three activities to **discuss**, with a reason attached to
  each, and says plainly when it has no honest data for a zone.
- Builds an office visit card: the plot details, the options you marked, the
  questions to ask about each one, what to carry, which soil checks are worth
  asking about. It prints as one page, saves on the phone, and shares as plain
  text for WhatsApp.
- Lists official portals, with no amounts, deadlines, eligibility rules or
  document lists invented anywhere.
- Speaks English, Hindi and Urdu, with the Urdu screen laid out right to left.
- Keeps everything on the device. No accounts, no analytics, no backend.

## Land, district by district

The form shows what the published sources say about the district you pick: the
agro-climatic zones it spans, the height and rainfall bands, the soils, the field
crops and the fruit, each with the document behind it. The About screen answers
the village question plainly: the 2011 census counted 6,314 villages in the
Union Territory, and there are 6,832 revenue villages across 1,646 patwar
halqas. This app holds a record of none of them and will not invent one; what it
does instead is say that the village record is the jamabandi kept by the patwari,
and that the khasra number is what to ask for.

The panel states this above the detail, not under it: published information
about the district, not a record of your village or plot. Each district also carries the
official counts from the 2024-25 district table — area, 2011 population, blocks,
tehsils and revenue villages — and the districts of its own division are one tap
away, so a farmer near a border can read the next district across without
starting over.

Those counts are not trusted on my word: the test suite adds all twenty rows and
fails the build unless they equal the published totals (42,241 sq km,
1,22,67,013 people, 285 blocks, 207 tehsils, 6,832 revenue villages). That check
caught a transposed area while this was being written.

Thirteen districts also list their tehsils — Kupwara, Budgam, Srinagar, Reasi, Kathua
and Poonch — each from the district administration's own page, counted against the
official figure and linked to that page. The other fourteen say plainly that their
tehsil names are not held here rather than guessing at them.

Below the district detail the card carries the Union Territory's own land use —
forest, net area sown, irrigated share — labelled as UT figures so they are
never mistaken for the district's or the field's. Three buttons take the card off the
screen: **Copy these details** puts the visible text, caveat and source links on
the clipboard, **Save as text file** writes the same text to a file with the
district in its name, and **Share** opens the phone's share sheet where the
browser has one. All three carry the caveat, so a forwarded card cannot arrive
looking like a promise.

The download is held to a measured budget: `tools/budget.js` fails the build if
the referenced JavaScript, CSS or HTML grows past the size recorded in
[LIGHTHOUSE.md](LIGHTHOUSE.md), so weight stays a decision rather than a drift.
At the time of writing a first visit is 139 KB gzipped.

The card's labels, headings, buttons and count sentence are translated into Hindi
and Urdu and switch with the language selector. The district sentences themselves
— zones, soils, crops and the caveat — remain English until a native speaker
checks them, because a rewritten caveat that weakens the warning would be worse
than an English one. `TRANSLATION_CHECK.md` lists every land string. A district with no
district-specific source says so rather than borrowing the zone description.

## What it does not do

- It does not decide whether a scheme applies to you, or what it pays.
- It does not predict yield, cost or income, or promise a crop will suit a plot.
- It does not verify land records, ownership, or the size you typed.
- It does not give a field-level forecast. The weather is for a nearby town.
- It does not answer the questions it writes. Those are for an officer.

## Screens

Captured from the running app at a phone viewport on the sample journey.

| Home | Options |
| --- | --- |
| ![Home screen](docs/screenshots/01-home.png) | ![Options list with review status](docs/screenshots/02-options.png) |

| Summary | Office visit card |
| --- | --- |
| ![Plan summary](docs/screenshots/03-summary.png) | ![Office visit card](docs/screenshots/04-visit-card.png) |

## Run it

```sh
npm start     # http://127.0.0.1:8080, no install, no dependencies
npm test      # lint, build check, self-tests, logic checks, translation and pack checks
npm run build # the pre-flight check on its own
```

`npm start` serves the folder with gzip, the way the host does. There is no
framework, no bundler and no `node_modules`: the whole app is static files, and
`package.json` exists so the checks have one entry point.

Rebuilding the screenshots needs the server and a headless Chrome:

```sh
npm run screenshots   # Chrome on --remote-debugging-port=9333
npm run phone-check    # the same, at 360px, checking width and tap targets
npm run review-sheets  # the printable sheets and prefilled CSVs, with the version in both
```

After a visit, or after a field test:

```sh
node tools/import-review.js review-sheets/Baramulla.csv --dry-run  # print, write nothing
node tools/import-review.js review-sheets/Baramulla.csv            # record it
npm run feedback-summary field-test-answers.csv                   # counts, write nothing
```

## How it is built

Plain HTML, CSS and JavaScript. No build step, no dependencies, no backend.
`sw.js` precaches the app for offline use and never caches weather. The catalogue
lives in `js/catalogue.js` so an officer can read it on its own; the review
records live in `js/reviews.js` and are validated on load, so a review with no
name or date cannot render as reviewed. Each printed sheet and each prefilled
CSV carries the sheet version (release plus a digest of the catalogue files),
and the importer refuses a sheet printed from a different one.

Languages are one keyed object per language in `js/messages.js`. Adding Kashmiri
later is one object, not a code change. The Urdu layout is right to left, chosen
per language rather than per page.

Checks: `tools/verify.js` (references, offline cache, review rules, contrast,
event wiring), `tools/selftest.js` (172 checks), `tools/tests-logic.js` (197
checks, including the review CSV formats, the sheet version and the field-test
summary),
`tools/translation-check.js` (key parity and a review list),
`tools/lint.js` (no console output, no `eval`, no secrets, no insecure links),
`tools/phone-check.js` (360px layout and tap targets). Lighthouse on the local
server: performance 92, accessibility 100, best practices 100, PWA 100; the
details and the one remaining cost are in `LIGHTHOUSE.md`.

Deployment is GitHub Pages through `.github/workflows/pages.yml`, which runs
`npm test` before it publishes anything.

Which document answers which question is mapped in [`docs/README.md`](docs/README.md).

There is no backend and no key in this repository; what is still worth
reporting, and how, is in `SECURITY.md`.

## Sources

Regional background comes from the Farmer's Guide for Jammu and Kashmir, ICAR,
CSIR-IIIM, the National Mission on Saffron and NITI Aayog; the exact documents
and what each supports are listed on the About screen inside the app and in
`js/sources.js`. Weather and place lookup are Open-Meteo (CC BY 4.0). The two
typefaces come from Google Fonts.

## Licence

MIT, in `LICENSE`. A fork is welcome. Keep the disclaimer on screen: this is not
a government service, and nothing in it is approved by anyone.
