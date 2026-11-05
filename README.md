# My Land, My Plan

An offline-first J&K land planning PWA that helps farmers prepare practical
options and office-visit questions without inventing scheme eligibility or crop
guarantees.

**Prepare for the agriculture office visit.**

**Live:** <https://toibawani.github.io/kashmir-land-plan/>

It works with no signal once the page has loaded: the form, the options, the
visit card, the saved plans. Only the weather needs a connection.

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
npm test      # lint, build check, 172 self-tests, 131 logic checks, translation check
npm run build # the pre-flight check on its own
```

`npm start` serves the folder with gzip, the way the host does. There is no
framework, no bundler and no `node_modules`: the whole app is static files, and
`package.json` exists so the checks have one entry point.

Rebuilding the screenshots needs the server and a headless Chrome:

```sh
npm run screenshots   # Chrome on --remote-debugging-port=9333
npm run phone-check    # the same, at 360px, checking width and tap targets
npm run review-sheets  # the printable review sheets for officers
```

## Honest status

Nothing here is signed off by anyone. Specifically:

1. **The catalogue is unreviewed.** Every screen that shows a suggestion says so.
   The review process, the printable per-district sheets and the CSV importer are
   in `REVIEW.md`; the fields stay empty until an officer actually replies.
2. **The Hindi and Urdu strings are unreviewed.** They are marked
   `reviewed: false`, the interface shows a notice while you read them, and
   `TRANSLATION_CHECK.md` lists every string for a native speaker.
3. **No farmer has used it yet.** `FIELD_TEST.md` has a two-minute script and an
   observation checklist for the first session; the three questions after the
   visit card store answers on the device only.
4. **Not tested on a real low-end phone.** It was checked in a browser at 360px
   and in Lighthouse, not in a hand, in the sun.

Numbers per option are `ask the officer` wherever no public document supported a
figure. `NEEDS_SOURCES.md` is the list of what is still missing. There is no
amount, deadline, yield or income claim anywhere in the app, and the build fails
if one appears.

## How it is built

Plain HTML, CSS and JavaScript. No build step, no dependencies, no backend.
`sw.js` precaches the app for offline use and never caches weather. The catalogue
lives in `js/catalogue.js` so an officer can read it on its own; the review
records live in `js/reviews.js` and are validated on load, so a review with no
name or date cannot render as reviewed.

Languages are one keyed object per language in `js/messages.js`. Adding Kashmiri
later is one object, not a code change. The Urdu layout is right to left, chosen
per language rather than per page.

Checks: `tools/verify.js` (references, offline cache, review rules, contrast,
event wiring), `tools/selftest.js` (172 checks), `tools/tests-logic.js` (131
checks), `tools/translation-check.js` (key parity and a review list),
`tools/lint.js` (no console output, no `eval`, no secrets, no insecure links),
`tools/phone-check.js` (360px layout and tap targets). Lighthouse on the local
server: performance 92, accessibility 100, best practices 100, PWA 100; the
details and the one remaining cost are in `LIGHTHOUSE.md`.

Deployment is GitHub Pages through `.github/workflows/pages.yml`, which runs
`npm test` before it publishes anything.

## Sources

Regional background comes from the Farmer's Guide for Jammu and Kashmir, ICAR,
CSIR-IIIM, the National Mission on Saffron and NITI Aayog; the exact documents
and what each supports are listed on the About screen inside the app and in
`js/sources.js`. Weather and place lookup are Open-Meteo (CC BY 4.0). The two
typefaces come from Google Fonts.

## Licence

MIT, in `LICENSE`. A fork is welcome. Keep the disclaimer on screen: this is not
a government service, and nothing in it is approved by anyone.
