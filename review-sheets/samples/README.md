# Fake review samples

Nothing in this folder is a review. Every value is deliberately marked
`TEST ONLY`, the names are invented, and the office does not exist.

The files exist so the importer can be tested end to end without a chance of a
fake verdict reaching `js/reviews.js`:

- `fake-review.csv` is in the prefilled per-district format, with one right,
  one wrong and one not-sure row, so the "not sure" path is exercised too.
- The tests always import with `--dry-run` or `--out <temporary file>`, never
  into the real `js/reviews.js`.
- `tools/verify.js` also refuses a recorded review whose reviewer name starts
  with "test", so if one of these ever did reach the catalogue by accident, the
  build would fail rather than show a signature nobody gave.

To regenerate the real, blank, prefilled CSV for a district, run
`npm run review-sheets`.
