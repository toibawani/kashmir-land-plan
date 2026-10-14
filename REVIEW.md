# Officer review: how this works

This note is for an agriculture or horticulture officer who has been asked
to look at My Land, My Plan. It assumes no computer skills beyond reading
this page. There is nothing to install and nothing to edit.

## What you are being asked

Farmers use this app to turn a few details about an unused plot into
questions to bring to an office. The suggestions it shows come from a
short list of activities kept in the app. Someone handed you that list,
on paper or as a file, because they want to know one thing from you:
**is anything on it wrong for your district?**

Please read each suggestion and mark anything you disagree with:

- an option that does not make sense for the area,
- a season or month that is off for local practice,
- a reason given for a suggestion that is misleading,
- anything missing that farmers here are commonly advised to consider.

You do not need to approve anything. Crossing out a wrong line is the
most useful thing you can do.

## How to give your feedback

Use whichever of these is easiest:

- write on the printed list and hand it back,
- send a message (for example on WhatsApp) saying which numbered item
  you disagree with and why,
- say it in person or on a call, and the person you speak to writes it down,
- send an email, if that is how you normally correspond.

There is no form to log into and no file to open. If you give your name,
your designation, and the date, your check can be recorded properly.

## What happens after

You never have to touch the app's files. The person maintaining the app
(the developer, not you) takes your feedback and does two things:

1. fixes or removes anything you marked as wrong,
2. records that you checked it: your name, your designation, and the date.

Once that is recorded, every screen in the app changes from
"Not yet reviewed by an agriculture officer" to
"Reviewed by [your name], [your designation] on [date]".

## What a recorded review does and does not mean

It means you checked the list of suggestions. It does not mean you
checked any farmer's plot, approved any subsidy, or promised any outcome.
The app keeps telling every farmer to confirm locally before acting,
before and after your review. That sentence never goes away.

---

## For the maintainer: recording a review the officer has given

This half is for the person who edits the code, not the officer. Only
follow it after the officer has actually replied. Never mark anything
reviewed on the officer's behalf, and never guess a name or a date.

### How it is printed, so you know what your edit changes

Every screen the farmer sees builds its review line from the same review
record. Right now it is empty, so every screen says this:

> "Not yet reviewed by an agriculture officer. Treat every suggestion
> as a question to discuss, not as advice to act on. Always confirm
> locally before acting."

That line appears on the results screen, the comparison, the plan
summary, the office visit card, its text download, its read-aloud, and
the About page.

After you record a review, those screens say this instead:

> "Reviewed by [name], [designation] on [date]. Still confirm locally
> before acting."

The "confirm locally" sentence is built into both wordings. It cannot
be switched off by recording a review.

If only some entries are reviewed, the app says that plainly too:
"Some of these suggestions have been reviewed by an agriculture officer
and some have not." Do not round a partial check up to a full one.

### What to change

Open `js/catalogue.js`. Near the top is `CATALOGUE_REVIEW`.

- The officer checked the whole list: set its `reviewStatus` to
  `"reviewed"`, and fill in `reviewedBy` (the officer's name),
  `designation` (their role), and `reviewedOn` (the date of the check
  as YYYY-MM-DD, for example 2026-11-04).
- The officer checked one entry only: set that entry's `reviewStatus`,
  `reviewedBy`, `designation` and `reviewedOn` the same way, and leave
  the whole-catalogue record alone.
- If any field is missing, leave `reviewStatus` as `"not-reviewed"`.
  `npm run build` refuses a half-recorded review (a "reviewed" flag with
  no name, or a date that is not YYYY-MM-DD), so a mistake fails loudly
  here instead of shipping as a false promise.

### What never changes

- The confirmation line every option and scheme entry carries stays
  exactly as it is.
- No amounts, deadlines, documents, eligibility or crop promises are
  added as part of a review. If the officer mentioned a scheme, it goes
  in as a name to ask about, the way the existing entries do, or not at
  all.
- The questions the app generates stay the farmer's questions to ask.
  A review does not turn them into approved advice.
