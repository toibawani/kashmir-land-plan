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

**What is missing.** A citable list of revenue villages per district, with the
tehsil and patwar halqa each falls under, in a form a static folder can ship.

**What the sources actually publish, checked 8 November 2026.**

- **Census 2011 location code directory**, one XLSX for all of India:
  `https://censusindia.gov.in/nada/index.php/catalog/42648/download/46323/PC11_TV_DIR.xlsx`.
  State, district, sub-district and village codes with names. Tehsils appear as
  codes, not names; there is no block and no halqa.
- **Census 2011 district handbooks (DCHB Part A)**, one PDF per district, e.g.
  `.../catalog/512/download/1696/DH_2011_0101_PART_A_DCHB_KUPWARA.pdf`. These are
  the village directories with amenities, organised by CD block. Text, not scans,
  but PDF only: no CSV or XLSX of Part A exists.
- **Local Government Directory** (`lgdirectory.gov.in`): current villages with
  village, sub-district and district names, exported one entity at a time behind
  a CAPTCHA. Its own report gives J&K **6,857** villages against the 6,832
  revenue villages in the state table.
- **data.gov.in** mirrors the LGD village fields but requires a login to download
  and an API key for the API.
- **District NIC pages** are the only place with tehsil **and** patwar halqa
  together, and only for some districts: Anantnag publishes a village directory
  with Tehsil, Niabat, GQ Circle, Patwar Halqa, Village and area in kanals;
  Srinagar publishes patwar halqas. Kupwara publishes only its 16 tehsils.
- **J&K Revenue Department** SRO notifications (PDF) list Sub Division → Tehsil →
  Niabat → Patwar Halqa → villages, one notification per district.

**Why the counts do not reconcile — and this matters.**

| Series | J&K total | Kupwara | Anantnag |
| --- | --- | --- | --- |
| Census 2011 villages in the directory | 6,553 | 362 | 342 |
| State "total villages, Census 2011" | 6,314 | — | — |
| Revenue villages, UT at a Glance 2024-25 (the table in `js/land.js`) | 6,832 | 380 | — |
| LGD, current | 6,857 | — | — |
| District administration pages | — | 363 / 367 | 395 |

So a Census list **cannot** be reconciled to the revenue-village column this app
shows: they are different series with different years and definitions. The app's
counts come from the official 2024-25 table and are pinned by tests; the village
names would have to come from a source that publishes revenue villages, and the
only such sources are per-district SRO PDFs and a few NIC HTML pages.

**What shipping it requires.** One district at a time, keyed on Census or LGD
**codes**, never on names, with the series named on screen ("Census 2011
villages" or "revenue villages, 2024-25"). A list whose row count does not match
the series it claims is a build failure. Districts without a list show "list not
held here". No crop, soil or irrigation attribute may be attached to a village
row.

**Who could close it.** The Revenue Department, by publishing the SRO annexures
as data rather than PDFs; or the district NIC pages, which already hold the
halqa-level table for at least two districts.

## Tehsil names per district

**What is missing.** The names of the tehsils each district contains, so the land
card can show a farmer which tehsil office holds their record. The counts are
already shown from the official table (207 tehsils in the Union Territory).

**Why it is slow.** Each district publishes its list on its own NIC page, in a
different layout, and several are scanned images. A list stitched from memory
would look authoritative and be wrong in exactly the way this project refuses.

**Progress, 8 November 2026.** Six districts ship: Kupwara (16), Budgam (9),
Srinagar (7), Reasi (9), Kathua (11) and Poonch (6). Each page's list was counted
against the official table and each district carries its own citation in
`js/sources.js`. The other five show the count and say their tehsil names are
not held here; none is filled in from memory. A build check refuses a list whose
length does not equal the official count, and another refuses a list with no
registered source.
