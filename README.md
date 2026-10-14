# My Land, My Plan

**A mobile-friendly prototype for farmers in Jammu and Kashmir.**

My Land, My Plan helps a farmer turn basic details about an underused plot into practical options and clear next steps for checking local support.

> This is a **hackathon prototype**, not an official government service.

## How this ships (architecture, honestly)

This is a **no-build, dependency-free static PWA**. `npm start` only
serves the folder; `npm run build` only checks that the scripts parse,
references resolve and the offline cache is consistent. There is no
framework, no bundler, no server, no database and no authenticated
account. A visitor opens a single folder (`index.html`, `css`,
`js`, `sw.js`) and gets a working app.

**Nothing on this page is a secret and nothing is hidden.** It has no
keys, no tokens, no API routes and no real-user IDs. Two things a
visitor's browser touches do reach the internet, and both are public:

1. The two typefaces load from Google Fonts (browser-provided).
2. The weather screen asks Open-Meteo for the current conditions of a
   town the farmer names. Nothing about the field, the plot or the plan
   ever leaves the device.

Because there is no server, this app has no login, no tenant, no shell
and no service that can return a 403 or respond to an unauthenticated
user. The honest risks here are the ones a front-end app owns:

- **The weather is live and is never stored.** An old value is never
  shown as if it were current, and the app explicitly says so rather
  than inventing an offline reading.
- **Everything else is local and stays local** once the page has loaded,
  including the plans, the questions, the ticked boxes and the review
  status. This is a privacy feature, and it is the reason there is no
  backend.
- **The service worker only ever caches the app itself.** It never
  caches a weather response, and it will not be told to.

If this prototype is ever moved onto a server that holds real farmer
data, the following must be added before any live data is served:
per-user data separation (Row Level Security on every table), a
real session and a tenant boundary, strict CORS, a Content Security
Policy, security headers, and an explicit authentication check before
every database read or write. None of that will live in a static folder,
and none of it should be invented here.

## Tech stack

| Piece | What it is |
| --- | --- |
| UI | Plain HTML + CSS + vanilla JavaScript (no framework, no bundler) |
| Build / test | `node tools/verify.js` (npm run build), `node tools/selftest.js` (npm test) |
| Assets | Icons as inline SVG + PNG, fonts from Google Fonts (System Family fallback) |
| Deployment | Static folder served on 127.0.0.1:8080; installable as a PWA |

## Quick start

```sh
npm install   # no dependencies, but the command is retained for a clean slate
npm start     # serves the folder at http://127.0.0.1:8080
npm run build # pre-flight check: scripts parse, references resolve, offline cache consistent
npm test      # build check plus 140 behavioural checks
```

Open `index.html` directly from disk — it works, and the weather screen
shows its not-available message because it is the only part that needs a
connection.

No account is required. No personal, financial, or land-identification data is sent to any server. Two honest caveats: the typefaces load from Google Fonts, and the weather screen sends the district you select to Open-Meteo. Everything else stays on the device.

The whole plan works offline after the first visit. Weather is the one part that needs a connection, and the app says so instead of showing an old reading as if it were current.

## The four kinds of information in this app

They are labelled in the interface, and the same labels are used in the plan you print or download.

| Label | What it covers | Where it comes from |
| --- | --- | --- |
| **Your answers** | District, size, water, terrain, main constraint | What you type |
| **Illustrative** | The options, the five ratings, the reasons for each suggestion, the calendars, the checklist | Hand-written rules in this repo |
| **Regional background** | District grouping, elevation bands, crop patterns | The published sources listed below |
| **Live weather** | Current conditions and a short forecast | Open-Meteo, fetched when you ask. Never stored |

## Officer review: what is checked and what is not

**Right now, none of the suggestions have been reviewed.** The interface says so on the results screen, the comparison, the summary, the office visit card and the About page, in these words: "Not yet reviewed by an agriculture officer. Treat every suggestion as a question to discuss, not as advice to act on. Always confirm locally before acting." The visit card carries it too, because that is the page that leaves the phone and reaches the office.

The suggestion data lives in `js/catalogue.js`, kept apart from the scoring and rendering code so it stays readable on its own. Officers never edit it. The review process for them is written up in `REVIEW.md` at the repo root: they check the list and reply by message, on paper, in person or by email, and the maintainer records the review afterwards by updating the review fields (`reviewStatus`, `reviewedBy`, `designation`, `reviewedOn`, following the steps in that file). Never mark anything reviewed on an officer's behalf, and never guess a name or a date.

Once a review is recorded, every screen changes to say "Reviewed by [name], [designation] on [date]. Still confirm locally before acting." A partly reviewed list says so too. The confirmation line that every option and every scheme entry already carries does not go away when a review is added: a reviewed catalogue still has to be checked locally, because the officer reviewed the catalogue, not your plot.

If only some of the suggestions on screen have been checked, the app says that instead of rounding up.

## Important disclaimer

This app does **not**:

- Verify land ownership
- Assess a particular plot, or guarantee that a crop will suit it
- Guarantee yield, cost or income
- Approve subsidies or determine scheme eligibility
- List scheme amounts, deadlines, eligibility rules or required documents
- Provide a field-level forecast, a frost warning or an irrigation schedule

Every option, rating and calendar is labelled as illustrative. The scheme section lists official portals only, and every entry carries the same instruction: confirm current details, eligibility and documents with the official portal or your local agriculture office, or at your Kisan Khidmat Ghar.

## How to run

There is nothing to install and nothing to compile.

1. Open `index.html` in any modern browser, **or**
2. Serve the folder locally:

```bash
npm start
# or
npx serve .
# or
python3 -m http.server 8080
```

There are no dependencies to install and nothing to compile. The `package.json` exists only so `npm start` can serve the folder and `npm run build` can run the pre-flight check; it pulls in no packages and adds no toolchain. Any static file server will do the same job.

`npm run build` runs `tools/verify.js`. There is nothing to bundle in a static site, so "build" does the checks that actually matter here, and it exits non-zero on any problem. It uses only Node built-ins. In order:

- It syntax-checks every JavaScript file the way `node --check` does.
- It confirms every local reference in `index.html` is on disk.
- It reconciles the service worker's precache list against what the page loads, so a file cannot go missing and break the app offline without the build failing first.
- It refuses a half-recorded officer review: a "reviewed" flag with no name or no date would look signed off with no officer behind it.
- It reads the shipped colour palette out of the stylesheet and checks every foreground/background pair that renders against the WCAG AA contrast floors (4.5:1 for body text, 3:1 for large text and control boundaries). A future colour tweak that made the page unreadable outdoors fails here, not in a field.
- It checks that every element `app.js` wires an event listener to actually exists in `index.html`, so a typo in an id cannot leave a button that is drawn on screen but wired to nothing.

Opening the file directly from disk works. The weather screen will show its "not available right now" message in that case, because it is the only part that needs a connection.

Opened from disk (`file://`) the app also skips installing its service worker, because browsers only allow one over `http`. Served from a local server or a real host, it precaches the plan on the first visit and works offline from then on. To see that, load it once, stop the server, and reload.

## Screens

1. Home
2. Plot details, a five step form with a progress bar
3. Possible activities to explore, with regional background and the sample logic made visible
4. Compare options
5. Next steps and local support: the month ahead for your shortlist, the generated questions, the checklist and the official portals
6. Plan summary (print, save as PDF, download, copy, read aloud, or save as a named plan)
7. Office visit card: a one page summary to print and carry, with the reference and a small scannable code, an optional visit mode, and a short "what to expect" panel
8. My saved plans: several named plans, side by side, with one chosen for the office
9. Weather near your district
10. About, sources and limitations

## Code structure

```
index.html            markup for every screen
manifest.webmanifest  name, icons and colours for a home screen install
sw.js                 service worker: precaches the plan, never caches weather
css/styles.css        design tokens plus component styles
js/regions.js         districts, coarse zone grouping, elevation bands
js/catalogue.js       the activity data an officer reviews
js/activities.js      helpers that read the catalogue and report its review state
js/schemes.js         official portal entries and their relevance
js/weather.js         Open-Meteo geocoding and forecast, plus the timing-note facts
js/questions.js       writes the questions to ask from your answers and options
js/plans.js           stores several named plans and which one goes to the office
js/speech.js          reads a plan aloud with the device's own speech voices
js/qr.js              draws a small QR code on the device, with no library and no network
js/offline.js         the one place that says what works offline and what needs a connection
js/visitfit.js        trims the visit card to one page for printing, without touching the answers
js/office.js          the short, honest "what to expect at the office" panel
js/app.js             state, validation, sample scoring, rendering
icons/                the app mark, as SVG and as PNG
tools/make-icons.py   draws the PNG icons, with no image library involved
```

`css/styles.css` starts with the design tokens: a soil, leaf and daylight palette, one accent colour (deep olive), a 4/8px spacing scale, a small radius scale, and a type pairing of Source Sans 3 for text with Source Serif 4 for headings.

The JavaScript is plain browser scripts in one namespace, no framework and no bundler, so the page still works when opened straight from disk. The parts worth knowing:

- `js/regions.js` groups the 20 districts into three coarse zones and records the source for each statement.
- `js/catalogue.js` holds the activity data. Each entry carries a zone note, a twelve month calendar, five approximate ratings, a short water note, and the review record the maintainer updates after an officer has replied (see `REVIEW.md`). `js/activities.js` only reads it and works out the review wording.
- `sw.js` precaches the plan for offline use. It serves the app's own files network first, so an edited file appears on the next load rather than one load later, and it deliberately never caches a weather response.
- `computeOptions()` in `js/app.js` scores the catalogue against the answers, and records a plain language reason for every point it awards. Activities that do not belong in a zone are excluded outright rather than ranked low.
- `COMPARE_ROWS` defines the comparison. Under 700px it renders as stacked blocks instead of a table, because a seven column table on a phone is unreadable.
- `js/weather.js` treats an Open-Meteo `200` response with an `error` body as a failure. The service returns that shape when it is overloaded, so checking `res.ok` alone is not enough.

To extend it, replace the catalogue and the scoring with real advisory data, and add portal links only after someone has verified them.

## Accessibility

Labelled form controls, a fieldset per step, a progress bar that reports its value, error text tied to its field with `aria-describedby`, `aria-invalid` on anything that failed, focus moved to the first problem, focus moved to the new heading when a screen or step changes, `aria-pressed` on the interested toggles, a live region for status messages, visible focus rings, and a skip link. Opening visit mode moves focus onto the card so a screen reader announces it as the new position, and closing it puts focus back on the toggle; the card takes this focus without a visible ring, the way the screen titles do, because nothing reaches it by Tab.

I checked contrast, horizontal overflow and target size on every screen at 320px: no contrast failures, no horizontal overflow, and no control under 24px (the WCAG 2.2 minimum). Buttons and selects are at least 44px tall, and the scheme and footer links were given padding so they clear that too. Each calendar phase uses a light ground with dark text on it, so the colour coding never drops below AA. Motion is a progress bar and short button transitions, and it is switched off under `prefers-reduced-motion`.

## What works today

- The full journey from welcome to saved summary, with working back, continue, edit, reset, save, print, download and copy.
- Validation with a message per problem, and focus moved to the first one.
- Draft saving in local storage, restored with a visible notice. Stopping on step 3 and coming back later resumes on step 3. Finishing the plan resets the position so it does not reopen on the last step.
- The sample journey button fills a sample plot (Pulwama, 3 kanal, seasonal water) and jumps to the results. Every screen it reaches is labelled as sample.
- Marking options as interested, and those marks being carried into the summary and into how the support entries are grouped and ordered.
- The weather screen, including the failure paths: a network error, an error body returned with status 200, a place name that cannot be found, and an offline device. Each one explains itself and offers a retry. The plan keeps working meanwhile.
- The generated questions. They are written from your own answers (district, size in your own unit, water, terrain, constraint) and from the options you marked, so they name your plot instead of speaking in generalities. A weather question is added only when a forecast is actually loaded, and the list always closes on the scheme question.
- The month ahead, for the options on your shortlist. It reads the same calendars the summary already uses, filtered to what you marked.
- The office visit card. It carries your answers, up to three marked options, the questions, the relevant official portals, the review status and the confirmation line. It prints as one page: before printing, the card trims only its note lines and support list if it measured as too tall, and never the answers, options or questions. Beside the printed reference it carries a scannable code drawn on the device, which holds only the reference and nothing else. A calm "what to expect at the office" panel sets expectations from general public knowledge, naming no amounts, deadlines, documents or eligibility, and says plainly that the office decides.
- Visit mode. From the visit card, one button hides everything except the card, the tickable questions and the read-aloud controls, so the phone is usable while standing at the counter, with one clear way back.
- Several saved plans. They are stored on the device only, can be renamed, deleted, opened for editing, and compared side by side, and one can be marked as the one going to the office.
- Reading aloud. The read aloud buttons use the device's own speech voices, and fall back to a written message on a browser with no voice. Nothing depends on it. A long plan is read section by section, and while one is playing a pair of controls appear to step to the part before or after, so a line that was missed can be heard again without starting the whole card over. The status line names the section being read and how many there are.
- Weather timing notes. When a forecast is available, a note surfaces a plain fact (for example that rain is likely) and suggests asking an officer about timing. It never instructs what to plant, spray or harvest.
- Deep links (`#results`, `#summary`, `#weather`) rebuild the plan from the saved draft, and fall back home when there is nothing to rebuild.
- Offline use. With the connection off, and with the server stopped entirely, the form, options, comparison, calendars, checklist, schemes and summary all still work, and the plan still downloads. A guidance panel on the home page lists, side by side, what works with no signal and the one part that does not: the weather forecast, which is fetched live and never cached as current.
- Installability. The app has a manifest and a service worker, so it can be added to a home screen and opened without a browser bar.
- The review state, which is currently "not yet reviewed" everywhere, and which will follow any review recorded in `js/catalogue.js`.

## What is sample data

- The activity catalogue: descriptions, requirements, risks and missing information are written by hand as illustrations, and none of it has been reviewed by an officer yet.
- `computeOptions()` and the reasons it prints, including the water, effort, cost, first returns, potential and terrain ratings in the comparison.
- The month by month calendars. They describe usual windows, and they shift with elevation, variety and the year.
- The relevance grouping in the scheme section. It is a pointer for the conversation at the office, not a statement about eligibility.
- The sample plot used by the demo journey.

## Sources for the regional background

Nothing about crops, zones or programmes was invented. The background in `js/regions.js` and `js/activities.js` comes from:

- [Government of India, Department of Agriculture and Cooperation, Farmer's Guide for Jammu and Kashmir](https://farmech.dac.gov.in/Content/FarmerGuide/JK/1J.html): the three agro-climatic zones, the elevation and rainfall gradient, the leading crops of the Kashmir and Jammu zones, and the share of India's temperate fruit grown here.
- [ICAR, Jammu and Kashmir](https://icar.org.in/en/node/17267): the share of cultivated area, the rainfed proportion, the horticulture based farming systems of the valley, and the usual cropping systems in both regions.
- [CSIR Indian Institute of Integrative Medicine, saffron production](https://iiim.res.in/saffron-production/): the four districts where saffron is grown in J&K.
- [Rashtriya Krishi Vikas Yojana, National Mission on Saffron](https://rkvy.da.gov.in/static/download/pdf/Saffron_Mission.pdf): the place of the Pampore belt in Pulwama, and of the karewa uplands.
- [NITI Aayog, Roadmap for Horticulture Development in the UT of Jammu and Kashmir](https://www.niti.gov.in/): the broad zone structure of the Union Territory and the districts in the subtropical and intermediate zones.
- [Open-Meteo](https://open-meteo.com/) for weather and place lookup. The data is CC BY 4.0.

## What would need official data or expert review

- The activity list, the five ratings and the calendars come from published background plus my own judgement, and the catalogue is currently marked not-reviewed. The review fields in `js/catalogue.js` exist so an agriculture or horticulture officer can change that, and the interface will report whatever they record.
- The district grouping into three zones is coarse, and every district spans more than one zone. A real version would use elevation and soil, not a district name. Nothing here is elevation aware in the recommendation logic, though the weather screen does report an approximate model elevation.
- The elevation bands are approximate ranges, not survey figures.
- The weather is for a named town, matched from a district name, on a coarse model grid. A real version needs a proper location picker and would need to be clear about what the grid can and cannot say.
- The place list does not answer to every district name. Baramulla, Bandipora, Budgam and Rajouri need an alternate spelling, which is recorded as `weatherQuery` in `js/regions.js`, and the weather screen shows both the name asked for and the place matched so the substitution is visible rather than hidden. All 20 districts were checked against the live service and resolve to a town inside J&K, but a change at the service's end could break one without notice.
- Any crop or variety suitability claim needs local advice. The app cannot tell whether a particular piece of ground suits saffron or anything else.
- The scheme list needs the current official position for each district, checked at the time it is shown.
- The unit conversions used for the size bands (kanal, acre, hectare, marla) are approximate, and local usage varies.
- The text is English only. Real use would need Kashmiri, Dogri, Urdu and Hindi, checked by fluent speakers.
- Any use with real farmer data would need a privacy review first.
- An installed copy holds its own cached files. The service worker deletes caches from earlier versions when it updates, but a release habit of bumping `CACHE_VERSION` in `sw.js` is what keeps that honest.

## New sources used for this round

None. No new crop, scheme, eligibility, amount or suitability claim was added, so no new source was needed. The visit-card work (the scannable code, the one-page print, the offline panel and the "what to expect at the office" panel) is built only from data already in the app and from general public knowledge about how a public agriculture counter works. The "what to expect" panel names no amounts, deadlines, documents or eligibility rules, and says plainly that the office decides; it is written from common public knowledge, not from any source that states an official position. The self-test harness is now at 140 checks and grew in three directions this round: it reads the finished QR matrix back with an independent decoder, so a mistake in placement, masking or interleaving would show up as garbled text rather than pass unnoticed; it drives the print fitter through a simulated dialog close to prove a trimmed card is put back whole; and it scans the office panel for invented figures or promises the app cannot keep. If a real advisory ever fed the question wording or the timing judgement, that wording would need an agronomist to check it.

## Licence

Prototype code, free to use and modify for the My Land, My Plan concept and related educational work. Do not present it as an official service.
