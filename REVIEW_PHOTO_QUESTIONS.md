# Photo observations: what needs a decision before anything is connected

This file is the gate. `js/observations.js` and `server/observe.js` exist, and
both refuse to do anything useful: there is no provider, no key, and no network
call in the shipped module. The eval harness (`node tools/eval-photos.js`) proves
that they refuse the things this app must never say.

Nothing below is answered. **Do not connect a provider until a person who
understands how these answers will be used has worked through this page.** The
app has no review recorded, and a list of questions is not a review.

## The one-line rule

A photo may be described, never judged. Four visible facts, each with an
`unclear` escape hatch, and no sentence of prose at all. Free text is where a
crop name, a soil reading and a recommendation come back in, so the schema has
no free-text field and the validator rejects one.

Allowed, and nothing else:

| Field | Values |
| --- | --- |
| `ground_cover` | bare, sparse, covered, unclear |
| `visible_water` | none, present, unclear |
| `visible_structure` | none, present, unclear |
| `slope_cue` | flat, sloped, unclear |

Refused by name, on the client and on the server, with a test for each: soil
type, pH, fertility, crop, pest, disease, weed, yield, income, water table,
ownership, boundary, suitability, recommendation, advice, next steps, summary,
description, free text, a note.

## Questions for an agriculture officer

1. Are these four fields worth anything to you at a counter, or would a photo
   with no description be just as useful? If the answer is "just as useful",
   the honest move is to delete this feature.
2. Is "ground cover: bare / sparse / covered" the wording you would use, or does
   it mean something different in your district?
3. Would you read "visible water: present" as a claim about irrigation, a
   drainage problem, or neither? What wording would stop that misreading?
4. "Slope: sloped" is a cue in a photo, not a measurement. Is showing it at all
   more likely to help, or to be argued with?
5. Is a structure in the frame (a wall, a shed, a channel) information you would
   use, or a privacy problem when it belongs to a neighbour?
6. If a photo shows a crop, an officer will see it anyway. Does refusing to name
   it in the app make the app less useful, or more trustworthy?

## Questions about consent and other people

7. The switch says "I understand that a photo would leave this phone". Is that
   enough, or does it need a sentence about who receives it and for how long?
8. Photos of a plot often include a neighbour's land, a person, or a house. Is
   that acceptable to send at all? If not, the feature should be dropped rather
   than worded around.
9. Should consent be per photo, per plan, or one switch for the app? One switch
   is what is built; per photo is stricter and more taps.
10. What should happen to a description once it is shown: kept with the photo on
    the device, or discarded when the screen closes? Nothing is kept today.

## Questions about hosting and cost

11. This app is static files on GitHub Pages. Sending a photo means a host that
    can hold a key, a cost per photo, and a retention decision. Who owns that?
12. Is a per-photo cost acceptable, and is there a monthly ceiling? A cap of 40
    photos per plan already exists; a daily send limit does not.
13. What is the failure we would rather have: no description at all, or an
    "unclear" description? This build prefers no description.

## What a provider would have to satisfy

- Returns only the four fields above, from the listed values.
- Prefers `unclear`; a confident wrong answer is worse than no answer.
- No prose, no crops, no soil, no pests, no yield, no money, no advice.
- Refuses an image it cannot read rather than guessing.
- Its output is validated before it reaches the screen, not after.

## Sign-off

No row is signed. A row is only signed by a named person on a date, with the
catalogue-review process, not by whoever wrote this file.

| Question | Who | Date | Answer |
| --- | --- | --- | --- |
| The four fields are worth showing | | | |
| The wording is right for J&K | | | |
| Sending a photo is acceptable, with this consent | | | |
| Neighbours and people in frame are acceptable | | | |
| A host and a cost ceiling are agreed | | | |
| A provider may be connected | | | |
