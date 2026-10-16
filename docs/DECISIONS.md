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
