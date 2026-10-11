# My Land, My Plan

**A mobile-friendly prototype for farmers in Jammu and Kashmir.**

My Land, My Plan helps a farmer turn basic details about an underused plot into practical options and clear next steps for checking local support.

> This is a **hackathon prototype**, not an official government service.

## What it does

- Collects only the basic plot details needed (district, village, size, water, terrain, main constraint)
- Shows 2 to 3 illustrative activity options to explore
- Lets you compare options side by side
- Gives a practical next-step checklist
- Points to official support channels without inventing scheme rules or amounts
- Saves a draft on the device and lets you print, download or copy a simple plan summary

No account is required. No personal, financial, or land-identification data is sent to any server. One honest caveat: the two typefaces are loaded from Google Fonts, so the page does make that one external request. Self hosting them would remove it.

## Important disclaimer

This app does **not**:

- Verify land ownership
- Guarantee crop suitability or yield
- Approve subsidies or determine scheme eligibility
- Provide official scheme amounts, deadlines, or required documents

All recommendations use **sample logic** and are labelled as illustrative. Always confirm crop choices, costs, water needs, and current scheme rules with your local agriculture office or Kisan Khidmat Ghar.

Where a detail is missing the app says so rather than guessing: "Confirm current details with the official portal or local agriculture office."

## How to run

No build step needed.

1. Open `index.html` in any modern browser, **or**
2. Serve the folder locally:

```bash
npx serve .
# or
python3 -m http.server 8080
```

## Screens

1. Home
2. Plot details, a five step form with a progress bar
3. Possible activities to explore
4. Compare options
5. Next steps and local support, with the checklist
6. Plan summary (print, download, copy, or save as a draft)
7. About and disclaimer

## Code structure

```
index.html      markup for every screen
css/styles.css  design tokens plus component styles
js/app.js       state, validation, sample scoring, rendering
```

`css/styles.css` starts with the design tokens: a soil, leaf and daylight palette, one accent colour (deep olive), a 4/8px spacing scale, a small radius scale, and a type pairing of Source Sans 3 for text with Source Serif 4 for headings.

`js/app.js` is one IIFE, no framework. The parts worth knowing:

- `ACTIVITIES` holds the sample activity catalogue.
- `computeOptions()` scores those activities against the answers. It is a handful of heuristics, not an agronomic model.
- `renderResults`, `renderCompare`, `renderChecklist` and `renderSummary` build each screen.
- `COMPARE_ROWS` defines the comparison. Under 700px it renders as stacked blocks instead of a table, because a five column table on a phone is unreadable.

To extend it, replace `ACTIVITIES` and `computeOptions()` with real advisory data, and add official portal links only after someone has verified them.

## Accessibility

Labelled form controls, a fieldset per step, a progress bar that reports its value, error text tied to its field with `aria-describedby`, `aria-invalid` on anything that failed, focus moved to the first problem, focus moved to the new heading when a screen or step changes, visible focus rings, and a skip link. Headings are focused only to move the reading position, so they carry no focus ring.

I checked text against WCAG AA at 320px, 390px and desktop: no contrast failures, no horizontal overflow, and no interactive target under 44px. Motion is a progress bar and short button transitions, and it is switched off under `prefers-reduced-motion`.

## What works today

- The full journey from welcome to saved summary, with working back, continue, edit, reset, save, print, download and copy.
- Validation with a message per problem, and focus moved to the first one.
- Draft saving in local storage, restored with a visible notice, and resume at the step you left off.
- The sample journey button fills a sample plot (Pulwama, 3 kanal, seasonal water) and jumps to the results. Every screen it reaches is labelled as sample.
- Deep links (`#results`, `#summary`) rebuild the plan from the saved draft, and fall back home when there is nothing to rebuild.

## What is sample data

- The activity catalogue: descriptions, requirements, risks and missing information are written by hand as illustrations.
- `computeOptions()` scoring, including the water, labour, cost and terrain labels in the comparison.
- The sample plot used by the demo journey.
- The scheme section lists categories of support. It does not name schemes, amounts, deadlines, documents or eligibility rules.

## What would need official data or expert validation

- The activity list and the relative cost, labour and water labels, which currently come from my own judgement, need review by an agriculture or horticulture officer before anyone acts on them.
- Any crop or variety suitability claim needs local, elevation aware advice. Nothing here is elevation aware.
- Schemes and support channels need the current official list, with working links, verified by the relevant department.
- The unit conversions used for the size hint (kanal, acre, hectare, marla) are approximate and should be checked against local practice.
- Anything multilingual, or any use with real farmer data, would need translation by fluent speakers and a privacy review first.

## Licence

Prototype code, free to use and modify for the My Land, My Plan concept and related educational work. Do not present it as an official service.
