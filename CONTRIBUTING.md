# Contributing

This is a small, honest prototype with one job: prepare a farmer to ask better questions at the
local agriculture office. The rules below exist because a change here can do real harm if it is
made carelessly, and most of them are about wording rather than code.

## The two rules that matter most

**1. Do not add amounts, deadlines, eligibility rules or document lists.**

No rupee figure, no "apply before March", no "you will need a copy of the jamabandi". Those are the
facts that change, this app cannot verify them, and a number on a screen reads like an authority
even when a caveat sits underneath it. Wrong advice here is not a rendering bug: it is a household
planting the wrong crop on a budget that cannot absorb the mistake.

If you have verified figures for a district from an official and dated source, open an issue first
and say who confirmed them and when they need re-checking. Do not add them in a pull request that
hides them among other changes.

**2. Never record an officer review that did not happen.**

An officer never edits this repository. They read `REVIEW_SHEET.md` and reply in person, on paper or
by message, and the maintainer records the outcome afterwards in the four fields in
`js/catalogue.js` (`reviewStatus`, `reviewedBy`, `designation`, `reviewedOn`) following `REVIEW.md`.
Never guess a name or a date, and never mark an activity reviewed on someone's behalf. The build
check fails a `reviewed` flag with no name or no date on purpose.

## Working on the code

- **No dependencies, ever.** No framework, no bundler, no package to install. The tools use Node
  built-ins only, and the app has to keep working when `index.html` is opened straight from disk.
- **Plain browser JavaScript.** Existing files are in one namespace, ES5-style `var` and function
  expressions, two-space indent, no tabs. Match the file you are editing.
- **Run the checks before you push.**

  ```sh
  npm test    # the pre-flight check, then 165 behavioural checks
  ```

  `npm run build` runs the pre-flight check alone and exits non-zero on any problem.
- **Add a test when you change behaviour.** `tools/selftest.js` runs in Node with no browser and no
  network, and it already covers the review wording, the catalogue shape, the scheme wording, the
  generated questions, the saved plans, the speech chunker, the QR encoder, the offline guidance,
  the print fitter and the office panel. The honesty rules above are enforced there, which is the
  reason they survive.
- **Keep it usable offline and on a cheap phone.** The service worker precaches the app; the weather
  is the one exception and must never be cached or shown as current (see `docs/DECISIONS.md`).
- **Accessibility is not a follow-up.** Keep the labels, the `aria-describedby` wiring, the focus
  moves, the 44px targets and the contrast floors the build check enforces.

## Commits and pull requests

- Conventional Commits only: `feat:`, `fix:`, `docs:`, `test:`, `chore:`, `refactor:`, `style:`,
  optionally with a scope such as `docs(readme):` or `test(ci):`.
- Imperative and short, one logical change per commit, no emoji prefixes.
- Say why in the body when the reason is not obvious. The history here is meant to be readable by
  somebody deciding whether to trust this app.
- Open a pull request into `main` and use the template. If CI is red, fix the cause rather than the
  check: do not delete a test, weaken an assertion or suppress a failure to make it pass.
- Never commit a `.env` file, a key, a token or a real farmer's details. This app has no secrets and
  should not grow any.

## If you disagree with a decision

Several choices here look like gaps: no backend, no figures, weather that will not cache. Each one
has its reasoning written down in [`docs/DECISIONS.md`](docs/DECISIONS.md), including the trade-off
it accepted and what would change the answer. Argue with that entry in an issue, and change the
decision openly if the argument is good, rather than working around it.
