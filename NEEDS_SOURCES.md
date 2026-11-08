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

## The village directory: names, tehsils and halqas

**What is missing.** A citable list of the revenue villages in each district, with
the tehsil and patwar halqa each falls under, in a form that can be shipped in a
static folder. Without it the app can say a district has 394 revenue villages
(Anantnag) but cannot let a farmer find theirs.

**Why it is not there yet.** The counts are published; the *list* is published
per district, in formats that differ by district — NIC district pages, the Census
2011 village directory, and the LGD village directory. None of those was obtained
as a verified, machine-readable file during this pass, and transcribing 6,832
names by hand from page images would produce plausible-looking errors, which is
the exact failure this project exists to avoid. A one-district sample would be
worse than none: it would look like coverage that is not there.

**Who publishes it.**

- Office of the Registrar General & Census Commissioner: Census 2011 Village
  Directory, district tables with village name, tehsil and CD block.
- Ministry of Panchayati Raj: Local Government Directory (LGD), village codes and
  parent tehsil/district.
- J&K Revenue Department: the jamabandi and the village list held by each tehsil.

**What shipping it requires.** Import one district at a time, reconcile the row
count to `LAND.admin(name).villages`, ship only reconciled districts, and show an
explicit "list not held here" state for the rest. Names and parents only: no
crop, soil or irrigation attribute may be attached to a village row, because no
public dataset carries that at village level.

## Tehsil names per district

**What is missing.** The names of the tehsils each district contains, so the land
card can narrow to "the tehsil you picked is in these zones". The counts are
already shown from the official table (207 tehsils in the Union Territory); the
names are not in the app.

**Why it is not there yet.** Each district publishes its tehsil list on its own
NIC page, in a different layout, and several are scanned images. A list stitched
from memory would look authoritative and be wrong in exactly the way this project
refuses: a farmer sent to the wrong tehsil office loses a day.

**Who publishes it.** The district NIC site's "Administration → Tehsils" page, the
Revenue Department's tehsil list, and the Census 2011 district handbook.

**What shipping it requires.** One district at a time, cited in `js/sources.js`
with the date read, and a build check that the number of names equals
`LAND.admin(district).tehsils`. A district whose list does not reconcile ships
without names, not with a guess.
