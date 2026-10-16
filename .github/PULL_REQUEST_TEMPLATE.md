<!--
Keep this short and concrete. A reviewer should be able to tell what changed, why,
and what could go wrong for a farmer, without reading the diff first.
-->

## What this changes

<!-- One or two sentences. The outcome, not the file list. -->

## Why

<!-- What problem does this solve? Link the issue with "Closes #12" when there is one. -->

## How it was tested

<!--
Say what you actually ran and what you saw. `npm test` is the baseline, and a
check that could not run should say so rather than be left out.
-->

## Checklist

- [ ] `npm test` passes locally (the pre-flight check plus the behavioural checks)
- [ ] No amounts, deadlines, eligibility rules or document lists were added
- [ ] No officer review was recorded that did not actually happen
- [ ] No new dependency, framework or bundler
- [ ] No secrets, keys, tokens or real farmer details
- [ ] Anything claimed as working was run, not assumed, and anything unverified is stated as such

<!--
If a box above does not apply, say why in a line rather than leaving it ambiguous.
If this pull request changes app behaviour, the README and docs/DECISIONS.md may
need a line each: the first says what the app does, the second says why.
-->
