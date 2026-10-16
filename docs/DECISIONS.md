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
