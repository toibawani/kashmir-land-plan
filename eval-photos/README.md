# eval-photos

Cases for the photo-observation format, and nothing else.

There is no photo in this folder and there must never be one. The only fixture
is the JSON answer a provider would return, because the answer is the part that
can hurt someone: a crop name, a soil reading, a yield or a sentence of advice,
repeated at an office as if it were an official observation.

## What is here

| File | What it is |
| --- | --- |
| `expected.json` | The cases a reviewer has pinned. Every payload is checked against both validators. |
| `README.md` | This file. |

## The shape of `expected.json`

```json
{
  "schema": "mlmp.observation.v1",
  "about": "a sentence for whoever opens this next",
  "cases": [
    {
      "name": "a named crop",
      "accept": false,
      "payload": { "...": "a full observation object" }
    }
  ]
}
```

- `name` is printed when the case fails, so write what the case is about, not
  "test 3".
- `accept` is `true` only if that payload is a legitimate answer. Both the
  browser validator (`js/observations.js`) and the server validator
  (`server/schema.js`) must agree with it; if they disagree the run fails and
  says which one.
- `payload` must be a complete observation, including `schema`, `provider`,
  `mock`, `createdAt`, `photo.slot`, all four fields and `uncertain`. A case
  that is meant to be refused can be an incomplete object as well; the point of
  `accept: false` is that it must not pass.

The allowed vocabulary, and nothing else:

| Field | Values |
| --- | --- |
| `ground_cover` | `bare`, `sparse`, `covered`, `unclear` |
| `visible_water` | `none`, `present`, `unclear` |
| `visible_structure` | `none`, `present`, `unclear` |
| `slope_cue` | `flat`, `sloped`, `unclear` |

Top-level keys are limited to `schema`, `provider`, `mock`, `createdAt`,
`photo`, `fields` and `uncertain`. Any other key is refused, and these names are
refused with a message that says why: soil, soil_type, ph, fertility, crop,
crop_id, crop_name, pest, disease, weed, yield, income, water_table, ownership,
boundary, suitability, recommendation, recommendations, advice, next_steps,
summary, description, text, note, prose.

## How to add a case

1. Copy an existing object in `cases` and change it.
2. Set `accept` to what should happen. If you are unsure, set it to `false` and
   run the harness: a refusal is the safe default.
3. Run `node tools/eval-photos.js`.
4. If you added a case that is legitimate, it must also survive the server's
   validation — the harness checks both, so you will find out immediately.

## What runs it

`node tools/eval-photos.js` (and therefore `npm test`) reads this file after its
own built-in cases. The built-in cases cover the endpoint's refusals: wrong
origin, missing consent, an oversize body, bytes that are not an image, a burst,
the daily ceiling, a provider that strays, and the kill switch. This folder
covers the format itself, where a person with a stake in the answers may want to
argue about a specific payload.

## What this cannot tell you

Whether the four fields are worth showing at all. That is not a test; it is the
question in `REVIEW_PHOTO_QUESTIONS.md`, and it needs an agriculture officer, not
a green check.
