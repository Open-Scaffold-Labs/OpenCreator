# OpenCreator — Claude Working Instructions

## Project Identity
- **App**: OpenCreator — Content creation and digital media tools
- **GitHub**: https://github.com/Open-Scaffold-Labs/OpenCreator
- **Organization**: Open-Scaffold-Labs
- **Publisher**: Open Scaffold Labs
- **Founder**: Dale Raaen (draaen@mac.com / GitHub: draaen-jpg)

## CRITICAL: Tool Usage

### Git & Mac filesystem → Desktop Commander ONLY
The VM sandbox has an HTTP proxy that blocks HTTPS to github.com.
Bash tool git commands will always fail.

**Always use `mcp__desktop-commander__start_process` for:**
- `git pull`, `git push`, `git log`, `git status`, `git commit`
- Any file read/write on the Mac
- npm/node commands run from the actual project

**Never use the VM Bash tool for git or Mac filesystem operations.**

### Seed Files
Seed files must use `module.exports = async function()` pattern.
Never use standalone scripts with `process.exit()` — they crash the server.

## Open Scaffold Ecosystem

This app is part of the Open Scaffold Labs ecosystem — a family of vertical SaaS applications sharing one PostgreSQL database, one component library, and one launcher.

### Tech Stack (All Apps)
- **Frontend**: React 19 + Vite + Tailwind CSS
- **Backend**: Express.js + PostgreSQL (direct queries, no ORM)
- **Auth**: JWT + bcrypt. Shared `users` table.
- **Shared core**: `@openscaffold/core` linked via file: reference

### Code Conventions
- React components: PascalCase (`DispatchPage.jsx`)
- Route files: kebab-case (`field.js`)
- API paths: `/api/kebab-case`
- Database tables: `prefix_snake_case`
- CSS: Tailwind utilities only (no custom CSS)
- Token keys: prefixed in localStorage (e.g., `fs_token`, `oia_token`)

### Document Standards
Always read `openscaffold-core/DOCUMENT-STANDARDS.md` before generating .docx files.
Use Electric Indigo (#4F46E5) title block, Times New Roman 11pt, justified text, navy headings (#1B3A5C).

## This App

### Ports
- **Client**: http://localhost:5180
- **Server**: http://localhost:3012

### Database
- **Table prefix**: `oc_`
- **Shared DB**: `postgresql://[user]@localhost:5432/openfirehouse`
- Token key: `oc_token`

### Structure
```
OpenCreator/
├── client/
│   ├── src/components/        # Layout, Beacon, LoginScreen, StandardHeader
│   ├── src/pages/             # Dashboard, Pipeline, Series, ShowDetail,
│   │                          # Calendar, Settings, Analytics, business pages
│   ├── index.html
│   ├── package.json           # install with --legacy-peer-deps --include=dev
│   └── vite.config.js
├── server/
│   ├── src/routes/            # content, series, youtube, ai, advisor, ...
│   ├── src/services/          # youtube.js (OAuth/Data/Analytics APIs, AES
│   │                          # token encryption), ai.js (BYO-key providers)
│   ├── src/index.js           # schema migrations + nightly sync worker
│   ├── .env.example           # Google OAuth + AI config template
│   └── package.json
└── CLAUDE.md
```

### Key Features & Endpoints (added July 2026)
- **YouTube integration**: `/api/youtube/*` — OAuth connect (read + upload
  scopes), video import sync, publish/schedule uploads, per-video analytics
  reports, quota ledger (`oc_api_quota`, ~1,600 units/upload of 10k/day)
- **Series & cadence**: `/api/series/*` — recurring show templates,
  next-episode generator, `/api/series/meta/cadence` gap detection
- **Show briefs**: `brief` JSONB on `oc_content` (concept, target_viewer,
  promise, hook, outline[]); checklist via `/api/content/:id/tasks`
- **AI drafting**: `/api/ai/*` — BYO key (Anthropic/OpenAI) stored encrypted
  in `oc_ai_settings`; draft kinds: titles, hook, outline, description
- **Advisor**: `/api/advisor/:contentId` — pre-publish packaging/retention
  checks + length guidance (personalized when >=5 published videos)
- Nightly sync worker refreshes channel stats + snapshots every 24h

### Environment
`server/.env` (see `.env.example`): DATABASE_URL, JWT_SECRET,
GOOGLE_CLIENT_ID/SECRET, GOOGLE_REDIRECT_URI, CLIENT_URL.
Google Cloud project needs YouTube Data API v3 + YouTube Analytics API
enabled and an OAuth web client with redirect
`http://localhost:3012/api/youtube/callback`.
