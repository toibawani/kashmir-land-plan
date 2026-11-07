# Security

## The short version

This app has no backend, no accounts, no analytics and no server-side code. It
is a folder of static files. Everything a farmer types stays in that browser's
storage on that phone and is never sent anywhere, with one exception the person
choosing the weather screen makes: a district name and a request to Open-Meteo.
There is nothing to breach, and no key or token exists in this repository.

## What is still worth reporting

- A way to make one farmer's saved plan, or the answer they typed into the
  feedback form, leave the device without them asking.
- A cross-site scripting path, including one that arrives through a CSV an
  officer was sent. The importer treats a file as untrusted input on purpose.
- A service worker bug that serves an old catalogue as if it were current, or
  that caches weather.
- A review record that renders as reviewed without a named officer and a date.
- Anything that makes the app state a figure, deadline or eligibility rule the
  project cannot back.

## How to report it

Email **toibawani14@gmail.com** with the steps to reproduce and what you
expected. Please do not open a public issue for an unreleased problem, and do
not include a real farmer's details in a report.

There is no bounty. This is a pilot with no funding; the honest promise is a
reply, a fix if the report holds, and credit in the commit message if you want
it.

## What to expect

- An acknowledgement when the mail is read.
- A fix on `main` with the reason in the message, and a `CHANGELOG.md` entry.
- If the report changes what the app claims, a note in the release that follows.

## Supported versions

Only the latest release on `main` is supported. There are no maintained
branches: the app is one folder, and an old copy on a phone is updated by the
service worker the next time it reaches the network.
