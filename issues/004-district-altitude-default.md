# Some districts suggest an altitude the app does not offer

Found while adding a build check for the district list, on the v1.0.0 catalogue.
It is recorded here rather than fixed in the same pass, because the fix moves the
catalogue digest and therefore every printed sheet, and the pilot was frozen for
feedback first.

## What was found

The form offers three altitudes: valley, plains and high altitude. A district may
leave the choice to the farmer (an empty default), but the following districts
suggest something else:

```
Doda -> "hills"; Kishtwar -> "hills"; Poonch -> "hills"; Rajouri -> "hills"; Ramban -> "hills"; Reasi -> "hills"
```

(`npm run test` does not fail on this today: the check that found it is not in the
suite yet, for the reason above.)

## Why it matters

`defaultAltitude()` fills the altitude control when the district changes. If the
value is not one of the three the radio group draws, nothing is selected while the
step still counts as answered, so a farmer can reach the options screen without
having chosen an altitude. Depending on the value, the options list can also be
built for a zone the screen never names.

## What a fix has to keep

- The zone names in `js/regions.js` are read by `catalogueZoneFor()`, which maps
  them to catalogue zones. A fix must stay inside the three offered values
  (or an empty default) rather than adding a fourth.
- Regenerating the pack changes the catalogue digest, so the sheet version moves:
  bump `package.json`, rerun `npm run review-sheets`, update the version quoted in
  the README and `REVIEW.md`, and commit the pack in the same change.
- The test that found this should land with the fix, not before it, so the suite
  stays green at every commit.

## What it does not change

Nothing on screen claims the plot's altitude was confirmed. The gap is a default,
not a statement, and the review sheets are unaffected until the pack is rebuilt.
