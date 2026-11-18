# Deploying the photo description endpoint

Nothing here is deployed, and nothing here has an account. This is the sheet
that turns your approval into a short setup. Every step says who does it.

**Who**

- **[you]** means it needs your account, your card, your name on a form.
- **[me]** means I can do it in this repository once you say go.

**The shape of it.** The app is a folder of static files on GitHub Pages, which
cannot hold a secret or run server code. The endpoint is therefore one small
function on a host that can keep an environment variable. It lives in
`server/observe.js`, it is off by default, and until step 6 is done the app says
the feature is not connected — exactly as it does today.

---

## 1. [you] Decide the provider first, then create one account

1. Open the provider's console and create a project named `mlmp-observe`.
2. Create **one** API key for it. Do not create a second key "for testing": a
   second key is a second thing to rotate and the spend cap is per project.
3. Put the key in the host's environment (step 4), never in this repository and
   never in a message to me. If it has already been pasted anywhere, revoke it
   and make a new one.

The adapter is one file, so this choice is reversible: `server/providers/mock.js`
is the template, and the registry is one line in `server/providers/index.js`.

## 2. [you] Set the hard spend cap *before* the first request

This is the step that makes the rest safe, which is why it comes before any key
is used.

1. In the provider's billing or usage screen, set a **monthly hard limit**. Choose
   the smallest number that is not zero. A hard limit is a ceiling, not an alert:
   alerts arrive after the money is spent.
2. Set an **alert** at 50% of that limit, to the address you actually read.
3. If the provider offers per-key quotas, set one on this key as well. Two
   independent ceilings is the point.

The endpoint also enforces its own two limits — five requests a minute per
client and a daily ceiling (`OBSERVE_DAILY_CAP`, default 100). Those are in
memory, per running instance: they stop a runaway afternoon, they are not a
billing guarantee, and the provider's cap is. This is stated plainly in
`server/limits.js` too.

## 3. [you] Tell me which provider, and the model name you want

I need only the provider's name and the model identifier — never the key. With
that I write `server/providers/<name>.js`, which is a function that takes
`{ slot, bytes, contentType }` and returns the payload schema in
`server/schema.js`.

## 4. [me] Wire the adapter and the host, once you approve

1. Add `server/providers/<name>.js` and one line in the registry.
2. Add a deploy manifest for the host and confirm the function runs with Node 22
   on the same origin policy the tests already check.
3. Set these environment variables **on the host** (names are what
   `server/observe.js` reads):

   | Variable | Value | Why |
   | --- | --- | --- |
   | `OBSERVE_MODE` | `on` | The kill switch. `off` (or absent) means the app is told the feature is unavailable. |
   | `OBSERVE_PROVIDER` | `mock` until step 5, then the provider's name | Which adapter is used. An unknown name is a 501, never a guess. |
   | `OBSERVE_ALLOWED_ORIGINS` | `https://toibawani.github.io` | The CORS allowlist. Anything else is a 403, including a preflight. |
   | `OBSERVE_DAILY_CAP` | `100` | The in-memory daily ceiling. |
   | `OBSERVE_MAX_BYTES` | `2000000` | Refused before parsing, so a huge body never reaches the model. |
   | `OBSERVE_API_KEY` | the key | Only in the host's secret store. Never in this repository, never printed. |

4. Nothing in the client changes: `js/observations.js` reads an endpoint from the
   page only if one is configured, and it posts only after the person has
   switched consent on.
5. Send a request that must fail — a foreign origin, an empty body — and confirm
   it is refused with a code and no stack trace.

## 5. [you] Test with the eval harness before the switch is turned on

1. Fill `eval-photos/` as `eval-photos/README.md` describes. **The folder holds
   no photos**: it holds the JSON answers you expect, including the ones that
   must be refused.
2. Run `node tools/eval-photos.js`. It drives both validators and the endpoint's
   refusals with no network.
3. Once the provider is wired, run it once with `OBSERVE_PROVIDER=mock` and once
   with the real name, and compare. A real model that names a crop is a 502 by
   design; if that happens, the answer is a stricter contract, not a looser
   validator.

## 6. [me] Turn it on, then look at it

1. Deploy with `OBSERVE_MODE=off` first, and confirm the app says the feature is
   unavailable and nothing is sent.
2. Switch to `on`, open the app on a phone, switch consent on, take one photo in
   the three slots, and read what comes back.
3. Watch the provider's usage screen for the first hour. If the count is not what
   you expect, switch back to `off` (step 7) before investigating.

## 7. [you or me] Turn it off

1. Set `OBSERVE_MODE=off` in the host's environment. This takes effect on the
   next request, with no deploy and no app update: the endpoint answers 503 and
   the app shows "The description service is switched off, so nothing was sent."
2. If you want it off at the network level too, revoke the key at the provider.
   The app then shows a refusal instead; nothing else breaks.
3. There is no cached answer on the phone. The app stores the observation only
   if a screen ever renders it, and this build does not.

## 8. [you] Rotate the key

1. Create the new key in the provider's console (the spend cap stays on the
   project, so it still applies).
2. Put the new value into the host's secret store. Do not edit the repository.
3. Confirm one request succeeds.
4. Revoke the old key.
5. If the old key was ever visible — a screenshot, a log, a paste — say so, and
   revoke first and ask afterwards.

## What I will not do without a separate, explicit yes

- Create any account, key or paid resource.
- Deploy the endpoint or turn `OBSERVE_MODE` on.
- Change the four fields, add a fifth, or let a model's prose reach a screen.
- Lower the validator to fit a provider's output. The closed vocabulary in
  `server/schema.js` is the promise; a model that cannot stay inside it is not
  ready.
