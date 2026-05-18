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
- **Email Studio** — 6 archetype templates, variable substitution, bulk send (20/hr cap)
- **School Finder AI** — Claude-powered institution research with personalised hooks
- **Remotion Studio** — 5 compositions: TourPromo (60s), InstagramReel (30s 9:16), WorkshopPoster (1080×1080), ClusterIntro (15s per region), StatsCard

## Environment

Copy `.env.example` to `.env` and fill in:

- `GMAIL_USER` — your sending Gmail address (already set to music@nathanielschool.com)
- `GMAIL_APP_PASSWORD` — generate at https://myaccount.google.com/apppasswords ("App passwords")
- `ANTHROPIC_API_KEY` — get from https://console.anthropic.com/

The app runs without these — Email Studio and School Finder show clear errors until they're set.

## Data

CSVs in `server/data/` are auto-imported on first run:
- `india_master_leads.csv` (richest schema)
- `india_workshop_leads.csv`
- `vietnam_workshop_leads_v2.csv`

Duplicates are skipped (matched on institution name + city). Subsequent runs leave the DB alone — to re-seed, delete `server/data/nsm_tour.db`.

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
