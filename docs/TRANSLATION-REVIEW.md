# Reviewing a translation

The app ships English, Hindi and Urdu, and marks both non-English languages as
unreviewed until a person says otherwise. This page is the step between "the
strings exist" and "a farmer can rely on the wording".

## What a reviewer gets

`TRANSLATION_CHECK.md` in the repository root: every key, the English, the Hindi
and the Urdu side by side. No code, no build, no account.

## What to look for

1. **Meaning, not word-for-word.** Does the Hindi sentence tell a farmer the same
   thing as the English one? A literal translation of "net area sown" that a
   clerk would not recognise is worse than the English term with a gloss.
2. **The caveat.** The sentence saying no village-level record is held must be as
   blunt in translation as in English. If it reads softer, it is wrong.
3. **Administrative nouns.** Tehsil, patwari, jamabandi, halqa and kanal are terms
   of art. Confirm the form used in the district, not the dictionary form.
4. **Placeholders.** `{district}`, `{division}`, `{villages}` must survive. The
   build fails if one is dropped, but a reviewer should still see the sentence
   with a real district name in it.

## How a correction lands

Edit the string in `js/messages.js` (all three dictionaries sit in that one
file), run `node tools/translation-check.js` to regenerate the review sheet, and
open a pull request that names the language and the reviewer. The build refuses a
missing key, an empty string and a changed placeholder set.

## Marking a language reviewed

`js/messages.js` carries `reviewed: false` for Hindi and Urdu. Setting it to
`true` is the only way to remove the "unchecked" marker from the language menu and
the notice above the app. Do that only when a named person has read every row of
the sheet, and put their name and the date in the pull request. There is no
partial state: the flag is per language, because a half-reviewed language still
misleads at the strings nobody read.
