# NSM Tour HQ

Workshop tour outreach platform for Jason Zachariah / Nathaniel School of Music.

## Quick start

```bash
npm install
npm run dev
```

Then open **http://localhost:5173** (Vite client; it proxies API calls to Express on :3001).

## What's in it

- **Dashboard** — stats, cluster progress, priority queue, follow-ups
- **Leads** — full CRUD, CSV import/export (Instantly-ready), filters
- **Email Studio** — 6 archetype templates, variable substitution, Instantly campaign pushes
- **School Finder AI** — Claude web-search research with source URLs and a confidence gate
- **Remotion Studio** — 5 compositions: TourPromo (60s), InstagramReel (30s 9:16), WorkshopPoster (1080×1080), ClusterIntro (15s per region), StatsCard

## Environment

Copy `.env.example` to `.env` and fill in:

- `INSTANTLY_API_KEY` — Instantly API token with campaign/account/lead scopes
- `INSTANTLY_SENDER_EMAIL` — defaults to `workshops@jasonzacmusic.com`
- `INSTANTLY_OUTREACH_DIR` — the authoritative research project root, expected to contain `leads/raw/*.csv`
- `ANTHROPIC_API_KEY` — get from https://console.anthropic.com/; School Finder uses Claude web search

Cold workshop outreach must go through Instantly from `workshops@jasonzacmusic.com`. The app does not send cold mail through Gmail or `music@nathanielschool.com`.

## Data

CSVs in `server/data/` are auto-imported on first run:
- `india_master_leads.csv` (richest schema)
- `india_workshop_leads.csv`
- `vietnam_workshop_leads_v2.csv`
- `overseas_research_leads.csv`

Imports and re-syncs are idempotent on institution name + city. Use Settings -> Re-sync from disk, or:

```bash
curl -X POST http://localhost:3001/api/leads/resync \
  -H 'Content-Type: application/json' \
  -d '{"source_dir":"/Users/nphmacmini/Documents/Claude/instantly-outreach/leads/raw"}'
```

If the Instantly outreach folder is absent, re-sync reports that explicitly and leaves existing data untouched.

## Tests

```bash
npm test
```

The smoke test covers CSV import idempotency, `send_via`/archetype normalization, and the Instantly export filter.

## Remotion

```bash
npm run remotion:studio                                     # interactive preview
npm run remotion:render -- --composition=TourPromo --output=out/tour_promo.mp4
npm run remotion:render -- --composition=InstagramReel --output=out/reel.mp4
npm run remotion:render -- --composition=WorkshopPoster --output=out/poster.png
npm run remotion:render -- --composition=ClusterIntro --output=out/cluster.mp4
npm run remotion:render -- --composition=StatsCard --output=out/stats.mp4
```

Drop photos and clips into `remotion/src/assets/` before rendering.
