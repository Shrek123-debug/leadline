# LeadLine

A Chicago lead water service line checker for renters, built for the
Congressional App Challenge (IL-07).

Type a Chicago address, get a real risk result from the city's own service
line inventory, a tailored action plan, and an AI-drafted letter to your
landlord or alderman requesting testing and replacement.

## Why

Chicago has more lead service lines than any U.S. city, an estimated
400,000+ still in the ground. The city doesn't expect to finish replacing
them until around 2076, and it's been slow to tell residents they might
have one. Renters especially have no way to act on a bad result once they
know. This app closes that gap: it doesn't stop at "you have a problem,"
it hands you the letter that gets it tested.

## Stack

- React + Vite, deployed on Netlify
- Installable as a PWA ("Add to Home Screen" on iOS)
- Address lookup runs entirely client-side against a bundled dataset —
  no live third-party API dependency
- One Netlify Function (`netlify/functions/generate-letter.js`) holds the
  Claude API key server-side and drafts the advocacy letter, grounded to a
  fixed set of verified facts so it can't invent statistics or give
  medical advice

## Data source & attribution

Address-level lead service line data comes from the City of Chicago
Department of Water Management's service line inventory (submitted to the
Illinois EPA, April 14, 2025), as parsed, geocoded, and published by
**Inside Climate News, WBEZ, and Grist**:
https://github.com/InsideClimateNews/2025-08-chicago-lead-service-lines

This dataset is a snapshot as of that date and may contain gaps or errors —
some addresses are missing because one service line can serve multiple
units, and a small number of lines are logged by nearest intersection
instead of a street address. A free test via 311 is the only way to fully
confirm a result. `scripts/build-dataset.py` documents exactly how the raw
CSVs are turned into `public/data/service-lines.json`.

## Local setup

```bash
npm install
npm run dev
```

The app will try to fetch `/data/service-lines.json` on load. If you don't
already have it, regenerate it with:

```bash
git clone https://github.com/InsideClimateNews/2025-08-chicago-lead-service-lines.git leadrepo
python3 scripts/build-dataset.py
```

## Deploying on Netlify

1. Push this repo to GitHub.
2. In Netlify: **Add new site → Import an existing project**, pick this repo.
   Build command and publish directory are already set via `netlify.toml`.
3. In **Site settings → Environment variables**, add `ANTHROPIC_API_KEY`
   with a real key from console.anthropic.com. Never commit this key.
4. Deploy. The letter generator won't work until that env var is set.

## AI usage disclosure

The advocacy letter generator uses Claude (Anthropic) via a server-side
function. The model is instructed to draft the letter using only a fixed
list of verified facts passed to it in the prompt — it does not have open
access to invent statistics, legal claims, or medical advice. No other
part of the app uses AI; the address lookup is a plain data lookup against
the bundled dataset.
