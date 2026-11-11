# Security

## The short version

This app has no backend, no accounts, no analytics and no server-side code. It
is a folder of static files. Everything a farmer types stays in that browser's
storage on that phone and is never sent anywhere, with one exception the person
choosing the weather screen makes: a district name and a request to Open-Meteo.
There is nothing to breach, and no key or token exists in this repository.

## What the policy in the page covers

Both shipped pages carry a Content Security Policy in a `<meta>` tag, because
GitHub Pages cannot send a response header. The rule that matters is
`script-src 'self'`: every script is a file, and there is no inline script and
no inline event handler, so an injected one cannot run. `connect-src` is
limited to the two Open-Meteo hosts on the app page and to nothing at all on the
field-test answers page. `npm run build` fails if a page loses that policy,
weakens it, or grows an inline script.

Two protections cannot be expressed this way: `frame-ancestors` (clickjacking)
and HSTS are ignored in a meta tag, and Pages sets no `X-Content-Type-Options`.
Closing those needs a host or proxy that sends headers; until then they are a
known limit, not an oversight. The full review is in
[docs/AUDIT.md](docs/AUDIT.md).

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

## The land card's export buttons

The copy, save and share controls act on text the app already has on screen. The
saved file is built in the browser with a Blob URL, handed to the download, and
revoked a second later; nothing is uploaded. The share sheet is the operating
system's own, and the app passes it the same text it would have copied.

The text includes the plot details if the reader has entered them, because that
is the point of the card. It is written to the phone's downloads or to whichever
app the share sheet targets, which are outside this app's control, so the screen
says what is being exported rather than exporting silently.
