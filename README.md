# My Land, My Plan (Kashmir)

**Hackathon prototype** for farmers in Jammu and Kashmir.

> My Land, My Plan helps a farmer turn basic details about an underused plot into practical options and clear next steps for checking local support.

## Important disclaimer

This is **not** an official government service. It does **not**:

- Verify land ownership
- Guarantee crop suitability or yields
- Approve subsidies or determine scheme eligibility
- Invent subsidy amounts, deadlines, or required documents

All activity options use **sample / illustrative logic**. Confirm crop choices, costs, water needs, and current scheme rules with your local agriculture office or Kisan Khidmat Ghar.

## How to run

No build step required.

1. Open `index.html` in a modern browser, or
2. Serve the folder with any static server, e.g.:

```bash
npx serve .
# or
python3 -m http.server 8080
```

Then open the URL shown (typically http://localhost:3000 or http://localhost:8080).

## Features

- Mobile-friendly multi-step form (district, village, size, land use, water, terrain, soil, constraint)
- Progress indicator and validation with clear errors
- Illustrative activity recommendations (2–3 options)
- Side-by-side comparison table
- Practical next-step checklist
- Scheme / support pathway with explicit “confirm with official sources” wording
- Save draft in browser localStorage
- Printable / copyable plan summary
- Demo sample journey for judges
- No login, no personal or land-ID data collected beyond form fields
- Accessible labels, focus states, WCAG-oriented contrast

## Tech

- Plain HTML, CSS, vanilla JavaScript
- Local storage for drafts
- Source Sans 3 + Source Serif 4 (Google Fonts)
- No backend, no analytics, no external APIs for recommendations

## Sample data

Recommendations are driven by simple heuristic scoring (water, terrain, land use, constraint, approximate size). They are **not** agronomic models. Labels such as “Sample / demo data” appear on results.

## Extending

- Replace the `ACTIVITIES` object and `computeOptions()` in `js/app.js` with real advisory data when available
- Add official portal links only after verification
- Connect a backend only if you have consent, privacy policy, and legal clearance

## Author / repo

Prototype prepared for hackathon use.  
GitHub username: **toibawani**  
Contact email on record: toibawani14@gmail.com

## Licence

Prototype code may be used and modified for the hackathon and related educational purposes. Do not present it as an official service.
