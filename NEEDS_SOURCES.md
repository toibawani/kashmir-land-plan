# Fields that still need a source

This file is the honest gap list for the catalogue. Every entry below is a
field the app shows as **"ask the officer"** because no public document in
`js/sources.js` backs it. Nothing here is an invitation to estimate: a rough
figure without a source is exactly the thing this project refuses to print.

When a figure is found, add the document to `js/sources.js`, set the field to
`{ "status": "verified", "value": "...", "sourceId": "...", "checkedOn":
"YYYY-MM-DD" }`, and delete the row from this file. `npm test` fails if a
figure is added without a source, or if a gap listed here disappears from the
file without the field being filled in.

## Startup cost

No public document read for this project gives a cost range that could be
quoted for a J&K plot. All eight entries stay as a question for the officer.

| Activity | Field | Status |
| --- | --- | --- |
| Kitchen garden and mixed vegetables | startup cost | ask the officer |
| Temperate fruit and nut trees | startup cost | ask the officer |
| Sub-tropical fruit trees | startup cost | ask the officer |
| Fodder crop or managed pasture | startup cost | ask the officer |
| Protected cultivation: polyhouse, mushroom or nursery | startup cost | ask the officer |
| Improve what you already grow, or add an intercrop | startup cost | ask the officer |
| Beekeeping as an allied activity | startup cost | ask the officer |
| Saffron on suitable upland | startup cost | ask the officer |

## Time to first income

The catalogue carries a coarse illustrative band (`firstReturns`) that is
labelled as a judgement, not a measurement. A dated, sourced time to first
income is not available for any entry.

| Activity | Field | Status |
| --- | --- | --- |
| Kitchen garden and mixed vegetables | time to first income | ask the officer |
| Temperate fruit and nut trees | time to first income | ask the officer |
| Sub-tropical fruit trees | time to first income | ask the officer |
| Fodder crop or managed pasture | time to first income | ask the officer |
| Protected cultivation: polyhouse, mushroom or nursery | time to first income | ask the officer |
| Improve what you already grow, or add an intercrop | time to first income | ask the officer |
| Beekeeping as an allied activity | time to first income | ask the officer |
| Saffron on suitable upland | time to first income | ask the officer |

## Entries with no source at all

These two have no public document registered for their regional claim yet.
Their text is written as a question to discuss, and the UI says no source has
been checked for them.

| Activity | What is missing |
| --- | --- |
| Protected cultivation: polyhouse, mushroom or nursery | A public document on protected cultivation in J&K that supports the regional text |
| Beekeeping as an allied activity | A public document on beekeeping in J&K that supports the regional text |

## What would close a row

A source has to be a public document someone can open, read, and point at the
sentence it supports. A department page that only names a programme is not
enough for a cost figure. A range from another state is not enough for a J&K
figure. When in doubt, the row stays.
