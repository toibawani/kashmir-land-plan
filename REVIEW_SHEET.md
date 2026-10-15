# Catalogue review sheet

This sheet is a paper copy of the activity list, with space for an
officer's comment beside each one. The app reads its review fields
from this same catalogue, so nothing the officer writes here can
drift from the app.

| No. | Activity | Main local notes |
| --- | --- | --- |
| 1 | Beekeeping as an allied activity |  |
| 2 | Fodder crop or managed pasture |  |
| 3 | Improve what you already grow, or add an intercrop |  |
| 4 | Kitchen garden and mixed vegetables |  |
| 5 | Sub-tropical fruit trees |  |
| 6 | Temperate fruit and nut trees |  |
| 7 | Protected cultivation: polyhouse, mushroom or nursery |  |
| 8 | Saffron on suitable upland |  |

## How to use

- Write the officer's name and designation at the top of the page.
- Tick, cross or write in the remarks by each activity as you go.
- Mark anything you disagree with, and a reason, not just a tick.
- Anything left plain is accepted as-is by the app.

## Fields the maintainer fills in afterwards (8)

For the whole list the maintainer fills in the review record once, or
per entry. These are the fields the app reads back:

| Field | What it holds | Example |
| --- | --- | --- |
| reviewStatus | "not-reviewed" or "reviewed" | not-reviewed |
| reviewedBy | the officer's name | A. Sharma |
| designation | their role | Agriculture Extension Officer |
| reviewedOn | the check date, YYYY-MM-DD | 2026-11-04 |

A half-recorded review is refused by the build: a name or date must
accompany a reviewed status, and anything missing stays not-reviewed.

## Review status wording, for reference

- Not reviewed: "Not yet reviewed by an agriculture officer. Treat
  every suggestion as a question to discuss, not as advice to act on.
  Always confirm locally before acting."
- Reviewed: "Reviewed by [name], [designation] on [date]. Still
  confirm locally before acting."

---

This sheet is generated from the live catalogue. The app builds its
review status from the same fields, so a review recorded on paper
cannot drift from what the app shows.
