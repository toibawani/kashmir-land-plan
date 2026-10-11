# My Land, My Plan

**A mobile-friendly prototype for farmers in Jammu and Kashmir.**

My Land, My Plan helps a farmer turn basic details about an underused plot into practical options and clear next steps for checking local support.

> This is a **hackathon prototype**, not an official government service.

## What it does

- Collects only the basic plot details needed (district, village, size, water, terrain, main constraint)
- Shows 2 to 3 illustrative activity options, each with the reasons it was suggested
- Puts each option in context for the district, using published background on J&K farming
- Shows a typical year for each option, month by month
- Lets you compare options side by side, and mark the ones you want to follow up
- Gives a practical next-step checklist, and lists the official portals to check
- Shows general weather for a nearby town, from Open-Meteo
- Saves a draft on the device and lets you print, save as PDF, download or copy the plan
- Keeps working with no connection once it has been opened, and can be added to a home screen
- States plainly whether the suggestions have been checked by an agriculture officer

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

**Right now, none of the suggestions have been reviewed.** The interface says so on the results screen, the comparison, the summary and the About page, in these words: "These suggestions have not yet been checked by an agriculture officer."

The catalogue lives in `js/catalogue.js`, kept apart from the scoring and rendering code so an officer can read the data without reading any JavaScript logic. To record a review, either fill in `CATALOGUE_REVIEW` at the top of that file for the whole list, or fill in `reviewStatus`, `reviewedBy`, `designation` and `reviewedOn` on a single entry if only that one has been checked. Leave the fields empty rather than guessing a name or a date.

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

No build step needed.

1. Open `index.html` in any modern browser, **or**
2. Serve the folder locally:

```bash
npx serve .
# or
python3 -m http.server 8080
```

Opening the file directly from disk works. The weather screen will show its "not available right now" message in that case, because it is the only part that needs a connection.

Opened from disk (`file://`) the app also skips installing its service worker, because browsers only allow one over `http`. Served from a local server or a real host, it precaches the plan on the first visit and works offline from then on. To see that, load it once, stop the server, and reload.

## Screens

1. Home
2. Plot details, a five step form with a progress bar
3. Possible activities to explore, with regional background and the sample logic made visible
4. Compare options
5. Next steps and local support, with the checklist and the official portals
6. Plan summary (print, save as PDF, download, copy, or save as a draft)
7. Weather near your district
8. About, sources and limitations

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
js/weather.js         Open-Meteo geocoding and forecast
js/app.js             state, validation, sample scoring, rendering
icons/                the app mark, as SVG and as PNG
tools/make-icons.py   draws the PNG icons, with no image library involved
```

`css/styles.css` starts with the design tokens: a soil, leaf and daylight palette, one accent colour (deep olive), a 4/8px spacing scale, a small radius scale, and a type pairing of Source Sans 3 for text with Source Serif 4 for headings.

The JavaScript is plain browser scripts in one namespace, no framework and no bundler, so the page still works when opened straight from disk. The parts worth knowing:

- `js/regions.js` groups the 20 districts into three coarse zones and records the source for each statement.
- `js/catalogue.js` holds the activity data. Each entry carries a zone note, a twelve month calendar, five approximate ratings, a short water note, and the review fields an officer fills in. `js/activities.js` only reads it and works out the review wording, which keeps the data readable on its own.
- `sw.js` precaches the plan for offline use. It serves the app's own files network first, so an edited file appears on the next load rather than one load later, and it deliberately never caches a weather response.
- `computeOptions()` in `js/app.js` scores the catalogue against the answers, and records a plain language reason for every point it awards. Activities that do not belong in a zone are excluded outright rather than ranked low.
- `COMPARE_ROWS` defines the comparison. Under 700px it renders as stacked blocks instead of a table, because a seven column table on a phone is unreadable.
- `js/weather.js` treats an Open-Meteo `200` response with an `error` body as a failure. The service returns that shape when it is overloaded, so checking `res.ok` alone is not enough.

To extend it, replace the catalogue and the scoring with real advisory data, and add portal links only after someone has verified them.

## Accessibility

Labelled form controls, a fieldset per step, a progress bar that reports its value, error text tied to its field with `aria-describedby`, `aria-invalid` on anything that failed, focus moved to the first problem, focus moved to the new heading when a screen or step changes, `aria-pressed` on the interested toggles, a live region for status messages, visible focus rings, and a skip link.

I checked contrast, horizontal overflow and target size on every screen at 320px: no contrast failures, no horizontal overflow, and no control under 24px (the WCAG 2.2 minimum). Buttons and selects are at least 44px tall, and the scheme and footer links were given padding so they clear that too. Each calendar phase uses a light ground with dark text on it, so the colour coding never drops below AA. Motion is a progress bar and short button transitions, and it is switched off under `prefers-reduced-motion`.

## What works today

- The full journey from welcome to saved summary, with working back, continue, edit, reset, save, print, download and copy.
- Validation with a message per problem, and focus moved to the first one.
- Draft saving in local storage, restored with a visible notice. Stopping on step 3 and coming back later resumes on step 3. Finishing the plan resets the position so it does not reopen on the last step.
- The sample journey button fills a sample plot (Pulwama, 3 kanal, seasonal water) and jumps to the results. Every screen it reaches is labelled as sample.
- Marking options as interested, and those marks being carried into the summary and into how the support entries are grouped and ordered.
- The weather screen, including the failure paths: a network error, an error body returned with status 200, a place name that cannot be found, and an offline device. Each one explains itself and offers a retry. The plan keeps working meanwhile.
- Deep links (`#results`, `#summary`, `#weather`) rebuild the plan from the saved draft, and fall back home when there is nothing to rebuild.
- Offline use. With the connection off, and with the server stopped entirely, the form, options, comparison, calendars, checklist, schemes and summary all still work, and the plan still downloads.
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
- Any crop or variety suitability claim needs local advice. The app cannot tell whether a particular piece of ground suits saffron or anything else.
- The scheme list needs the current official position for each district, checked at the time it is shown.
- The unit conversions used for the size bands (kanal, acre, hectare, marla) are approximate, and local usage varies.
- The text is English only. Real use would need Kashmiri, Dogri, Urdu and Hindi, checked by fluent speakers.
- Any use with real farmer data would need a privacy review first.
- An installed copy holds its own cached files. The service worker deletes caches from earlier versions when it updates, but a release habit of bumping `CACHE_VERSION` in `sw.js` is what keeps that honest.

## New sources used for this round

None. No new crop, scheme or suitability claim was added, so no new source was needed. Everything in `js/catalogue.js` was already in the list above; the work was to separate it, label it, and let someone check it.

## Licence

Prototype code, free to use and modify for the My Land, My Plan concept and related educational work. Do not present it as an official service.
