# Field test: the two-minute version

This is for testing the app with a farmer, a relative or anyone who would
actually take a land question to an office. It needs one phone, no account and
no internet after the first load. Nothing is uploaded and nothing is tracked.

The point is not to show the app. It is to find out where it fails when
nobody is explaining it.

## Page 1: the observation form

Print this section on its own. It is written to fit one A4 side. There is no
name, no phone number and no village anywhere on it: nothing here can identify
anyone, and nothing should be added that could.

| | |
| --- | --- |
| **Date** | |
| **Observer initials** | |
| **Language the person used** | ☐ English  ☐ हिन्दी  ☐ اردو |

**Rough age group** (tick one)
☐ under 25  ☐ 25–40  ☐ 41–60  ☐ over 60  ☐ prefers not to say

**Farming** (tick one)
☐ farms own land  ☐ works on other people's land  ☐ not farming  ☐ prefers not to say

**The sample journey**
☐ finished it  ☐ stopped before the visit card, at: ________________________________

**Where they hesitated** (what they were doing, not what you think they felt)

1. ______________________________________________________________________
2. ______________________________________________________________________
3. ______________________________________________________________________

**What they asked out loud**

1. ______________________________________________________________________
2. ______________________________________________________________________
3. ______________________________________________________________________

**The visit card**
☐ found it without help  ☐ needed help  ☐ did not find it
☐ would take it to the office  ☐ would not  ☐ would print or share it

What they said about it:

_________________________________________________________________________
_________________________________________________________________________

**One thing that worried them**

_________________________________________________________________________

_________________________________________________________________________

## What to watch while they work

The form has lines for these. Write what they did, not what you think they
felt.

- Did they start without being told which button to press?
- Did they understand "altitude zone", or guess?
- Did they think the options were recommendations from a department?
- Did they notice the "not reviewed" badge? Did they ask what it meant?
- Did they look for a number, a cost or a scheme amount? What did they do when
  they found "Ask the officer"?
- Did they read the confirm-locally line, or skip it?
- In Urdu, did the right-to-left layout cause any confusion?
- Did they find the visit card without help?
- Did they understand that the questions are theirs to ask, not answers?
- Did they try to print, download or share the card? Did it work?
- Did anything look like an official government page?
- Did they ask whether it was "real" or "approved"?

## Before you start

- Load the app once while you have a signal, so it is stored for offline use.
- Put the phone in the person's hand, not yours.
- Set the language to the one they read, before handing it over. If it is
  Hindi or Urdu, the language menu itself says the translation is unchecked,
  and the app shows a notice while it is read. Read that notice out loud. Do
  not dismiss it.
- Have the printed form and a pen for your own notes. Do not take notes on
  their phone.
- Ask permission before you start. Say plainly: "This is a test. Nothing you
  type leaves this phone. You can stop at any time."

## The two-minute script

Say this, and nothing more:

1. **"This is for a plot you are not using much. Start here."**
   Point at Start a land plan. Do not tap it for them.

2. **"Fill it in as if it were your own land."**
   Let them choose the district and the altitude zone. If they ask what
   altitude zone means, read the labels to them and say "pick the one that
   sounds like your ground". Do not answer for them.

3. **"When you get to the end, see what comes up."**
   Stop talking. Let them read. If they ask whether an option is right, say
   "I do not know, that is what the app is for" and write the question down.

4. **"Now make the card you would take to the office."**
   Let them find the button. If they cannot find it in 20 seconds, that is a
   finding, not a failure on their part.

5. **"Show me what you would actually take with you."**
   Watch whether they print, download, or just look at the screen. Ask what
   they would do next.

6. **"There are three questions at the bottom. You can skip them."**
   Let them answer or skip. Do not explain the questions.

That is the whole test. Two minutes if it goes well, longer if it does not,
and the longer version is the useful one.

## After they leave

- Do not fill the form in from memory later. If a line is empty because you
  missed it, leave it empty; an invented observation is worse than a gap.
- Export the three in-app answers: open `feedback.html` on the same phone,
  press **Export as CSV**, and move the file off the phone. The page is not
  linked from the app, so type the file name or open it from the downloaded
  folder.
- Read them back with `npm run feedback-summary <the-file.csv>`. It prints
  plain counts and the free-text answers, and writes nothing.
- Delete the local answers afterwards if the person asked you to.
- Do not write the person's name, phone number or village into any file. The
  app does not ask for them, and a field test does not need them.

## What counts as a failed test

None of these mean the farmer did something wrong:

- They could not find the visit card.
- They thought an option was approved.
- They could not tell what "ask the officer" meant.
- They gave up before the end.
- They did not believe the app was for them.

Those are the findings worth the trip. A test where everything went smoothly
and the person was guided through every screen has tested the guide, not the
app.
