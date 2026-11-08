# What the suite actually checks

`npm test` is the referee. It runs seven tools in order and stops at the first
failure. This page is the map: what each one refuses, and the file to open when
it fails. It exists so a contributor does not have to read 3,000 lines of test
code to find out whether their change is allowed.

| Tool | Refuses | Where the rule lives |
| --- | --- | --- |
| `tools/lint.js` | leftover TODOs, `console.log`, `eval`, committed secrets, insecure `http://` links | `tools/lint.js` |
| `tools/verify.js` | a broken script, a dead local reference, an asset missing from the offline cache, a manifest icon that is absent or mis-sized, a reused id, an `aria-*` reference with no target, an in-page link with no anchor, an unnamed control, an image without alt text, a land figure with no source, a missing caveat | `tools/verify.js` |
| `tools/selftest.js` | scoring, plan saving, visit fitting, QR payloads and catalogue consistency drifting from the documented behaviour | `tools/selftest.js` |
| `tools/tests-logic.js` | a district with no counts, a division that does not cover every district, a neighbour outside the division, a dropped placeholder, a sheet that imports a different version | `tools/tests-logic.js` |
| `tools/budget.js` | the gzipped payload over its budget, per file and in total | `tools/budget.js` |
| `tools/translation-check.js --check` | a missing or extra key in any language, an empty string, a placeholder that changed, `TRANSLATION_CHECK.md` out of date | `tools/translation-check.js` |
| `tools/review-sheet.js --check` | a committed district sheet that no longer matches the catalogue | `tools/review-sheet.js` |

Two rules are not machine-checked and are stated so they are not quietly
forgotten:

- A figure may only be printed if a document in `js/sources.js` supports it. The
  land panel is enforced by `verify.js`; the catalogue relies on its own
  `source` field and on review.
- A language may only be marked reviewed when a named person has read it. The
  parity test proves completeness, not correctness.

## Adding a check

Put the rule next to the thing it protects, fail with a sentence that names the
file and the fix, and add it to the table above in the same commit. A check that
only says "invalid" makes the next person read the source to find out why.
