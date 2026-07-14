# OpenCreator

The open-source operating system for a YouTube channel: plan upcoming shows,
develop each one from idea to packaged upload, publish and schedule straight
to YouTube, and watch performance flow back — on your own machine, with your
own data, and your own AI keys.

Built by [Open Scaffold Labs](https://github.com/Open-Scaffold-Labs).

## What it does

- **Show Calendar** — plan shows on a monthly calendar; series templates set
  your cadence and the app flags weeks where you're short.
- **Series** — recurring show formats ("Tutorial Tuesday #{n}") that generate
  the next episode with one click, pre-scheduled on your preferred day.
- **Show Planner** — every show gets a brief: concept, target viewer, the
  promise, a first-30-seconds hook, beat outline, script workspace, and a
  production checklist.
- **Publishing queue** — upload straight to YouTube from the pipeline,
  publish now or schedule (private + publishAt), with custom thumbnails.
- **Analytics** — per-video report cards (views, watch time, retention
  curve) plus nightly channel snapshots.
- **AI Assist** — bring your own Anthropic or OpenAI key (stored encrypted,
  never leaves your database) to draft titles, hooks, outlines, and
  descriptions from the show's own brief.
- **Pre-publish Check** — packaging and retention-plan checks with length
  guidance personalized to what performs on *your* channel.
- **Creator business tools** — sponsorship CRM (brands & deals), revenue and
  expense tracking, team, equipment, and a public website builder.

## Quick start

Requirements: Node 18+, PostgreSQL 14+ running locally.

```bash
git clone https://github.com/Open-Scaffold-Labs/OpenCreator.git
cd OpenCreator
cp server/.env.example server/.env   # then fill it in (see below)
bash boot.sh
```

Client: http://localhost:5180 · Server: http://localhost:3012

If `npm install` complains about peer dependencies in `client/`, use
`npm install --legacy-peer-deps --include=dev`.

## YouTube setup (one time)

1. In [Google Cloud Console](https://console.cloud.google.com), create a
   project and enable **YouTube Data API v3** and **YouTube Analytics API**.
2. Create an OAuth 2.0 Client ID (Web application) with authorized redirect
   URI `http://localhost:3012/api/youtube/callback`.
3. Put the client ID and secret in `server/.env`.
4. While the OAuth consent screen is in Testing mode, add your Google
   account as a test user.
5. In the app: Settings → Connect YouTube Channel.

Quota note: YouTube's Data API allows 10,000 units/day by default; an upload
costs ~1,600. The app tracks your usage in Settings.

## AI setup (optional)

Settings → AI Assistant: choose Anthropic or OpenAI, paste your own API key.
The key is AES-256-GCM encrypted at rest in your database and is only ever
sent to the provider you chose.

## Status

Actively developed. Current coverage tracks the OpenCreator implementation
plan: MVP (channel connect → calendar → publish → learn) plus Phase 2 AI
drafting and the Format & Length Advisor. Coming next: Shorts repurposing
suggestions, thumbnail A/B experiments, and the idea bank.
