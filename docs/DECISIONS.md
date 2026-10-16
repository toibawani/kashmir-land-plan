# Design decisions

This file records the decisions that shaped the app and the trade-off each one
accepted. It is short on purpose: a decision earns an entry here if a reasonable
engineer would otherwise ask "why is it like this?", or if someone would be
tempted to change it without knowing what it protects.

Each entry says what was decided, why, what it costs, and what would change the
answer. If a decision is later reversed, the entry stays and gains a line saying
so, because the reasoning is the useful part.

The decisions are:

1. [There is no backend](#1-there-is-no-backend)
2. [Suggestions stay illustrative](#2-suggestions-stay-illustrative)
3. [The weather is live or it is nothing](#3-the-weather-is-live-or-it-is-nothing)
4. [Officer review is a conversation, not a code change](#4-officer-review-is-a-conversation-not-a-code-change)
5. [The visit card is the artefact](#5-the-visit-card-is-the-artefact)
6. [What has deliberately not been decided yet](#6-what-has-deliberately-not-been-decided-yet)

## 1. There is no backend

**Decided:** the app is a static folder. `index.html`, `css/`, `js/` and a
service worker, served by anything. No server, no database, no accounts.

**Why:** the only data worth protecting here is a farmer's plot details, and a
server holding them properly needs per-user separation,a real session, a checked tenant boundary, a content security policy and an
authentication check before every read and write. A prototype cannot ship those credibly, and
half-built access control is worse than none. Keeping every answer on the
device removes the risk instead of managing it.

**What it costs:** no accounts, so a plan cannot follow a farmer to another
phone, and clearing the browser loses it. Saved plans live in `localStorage`
(`mlmp_plans_v1`) and the draft in `mlmp_draft_v3`. The honest answer is that
this is a device, not a locker — which is why the plan can be printed,
downloaded and shared instead (see [5](#5-the-visit-card-is-the-artefact)).

**What would change it:** a real need to serve many farmers centrally, with the
security work above budgeted as part of the same job, not after it.

## 2. Suggestions stay illustrative

**Decided:** no amounts, no deadlines, no eligibility rules and no document
lists, anywhere in the app or in anything it prints. Options are framed as
things to discuss, and every option and every scheme entry carries the same
instruction: confirm current details, eligibility and documents with the
official portal or the local agriculture office.

**Why:** those are exactly the facts that change, and this prototype cannot
verify them. Wrong advice here is not a rendering bug — it is a household
planting the wrong crop on a budget that cannot absorb it. A page that says
"about ₹40,000 per kanal" reads like an authority even with a caveat underneath
it, so the fix is to print no figure rather than to print a warning next to one.

**What it costs:** the app is less impressive than one that answers. It returns
five options and a list of questions where a competitor returns a number. That
is deliberate: the questions are what the farmer carries to the office.

**What would change it:** figures confirmed by an officer for a specific
district, dated, and re-checked on a schedule someone actually owns. Until that
schedule exists, no figure is safe to print.

## 3. The weather is live or it is nothing

**Decided:** the two Open-Meteo hosts are excluded from every cache list in
`sw.js` (`WEATHER_HOSTS`, `isWeatherRequest`), and a weather request is never
served from cache. When the connection is gone the weather screen says it cannot
reach the service instead of showing the last reading.

**Why:** the rest of the app is built to work offline, so caching the weather
would be easy and consistent. It is also the one way this app could quietly lie:
a temperature from three days ago looks identical to a temperature from three
minutes ago, and a farmer deciding whether to irrigate today has no way to tell
the difference from the screen.

**What it costs:** the weather screen is the only part that fails offline, which
looks like an inconsistency against everything around it. The app states the rule
itself rather than leaving the reader to work it out.

**What would change it:** nothing about caching. A stored reading could be shown
in the future only if it were labelled with the time it was taken, in the same
size as the reading itself.

## 4. Officer review is a conversation, not a code change

**Decided:** an agriculture officer never edits the app. They read the activity
list (`REVIEW_SHEET.md`) and reply by message, on paper, in person or by email.
The maintainer then records the review afterwards by filling in four fields on
the activity in `js/catalogue.js`: `reviewStatus`, `reviewedBy`, `designation`
and `reviewedOn`. `REVIEW.md` describes that step.

**Why:** the officer's time is the scarce thing here, and it should not be spent
in an editor, on a device, with a syntax error waiting to happen. Asking a
district officer to open a pull request would end the review before it started.
The catalogue is kept apart from the scoring and rendering code for the same
reason: it has to be readable on its own.

**What it costs:** a review is recorded one maintainer step after the
conversation, so there is a window where the reply exists and the app does not
show it yet. That is the honest direction to be late in: the failure mode is
"says not reviewed when it was", which the app states on screen, rather than
claiming a review nobody gave.

**Consequences in the build:** the pre-flight check refuses a half-recorded
review. A `reviewed` flag with no name or no date fails `npm run build`, so a
sign-off cannot exist with no officer behind it, and nothing may be marked
reviewed on someone's behalf.
