# Deploying OpenCreator (Vercel client + Railway backend)

The client is a static Vite build (Vercel); the server is a long-running
Express process with Postgres and a nightly sync worker (Railway — Render or
Fly also work). All `/api/*` traffic is proxied through Vercel to the backend
via the rewrite in `client/vercel.json`, so the browser only ever talks to
your Vercel domain.

## 1. Backend on Railway

1. railway.com → New Project → **Deploy from GitHub repo** → pick
   `Open-Scaffold-Labs/OpenCreator`.
2. In the service settings set **Root Directory** to `server`.
3. Add a **PostgreSQL** database to the project (Railway provisions
   `DATABASE_URL` automatically — link it to the service).
4. Set service variables:
   - `JWT_SECRET` — long random string (`openssl rand -hex 32`)
   - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — same as local
   - `GOOGLE_REDIRECT_URI` — `https://<railway-domain>/api/youtube/callback`
   - `CLIENT_URL` — your Vercel URL (add after step 2 below)
5. Settings → Networking → **Generate Domain**. Note the domain.

The server logs `openscaffold-core not found — website builder disabled
(standalone mode)` on boot — expected in cloud deploys.

## 2. Client on Vercel

1. vercel.com → Add New Project → import the same GitHub repo.
2. Set **Root Directory** to `client` (framework preset: Vite).
3. Edit `client/vercel.json` first: replace `YOUR-BACKEND-URL.up.railway.app`
   with your Railway domain from step 1.5, commit, push.
4. Deploy. Note your Vercel URL and set it as `CLIENT_URL` on Railway.

## 3. Google OAuth for production

In Google Cloud Console → Auth Platform → Clients → your OAuth client:

- Add authorized redirect URI:
  `https://<railway-domain>/api/youtube/callback`

While the consent screen is in Testing mode only listed test users can
connect; publish the app (and complete Google's verification for the upload
scope) before opening it to other creators.

## Notes & limits

- Video uploads stream through the backend; Railway's request limits are
  fine for typical videos, but very large files upload faster from the
  local self-hosted setup.
- The nightly sync worker needs an always-on service — avoid free tiers
  that sleep (Render free, for example).
- Local development is unchanged: `bash boot.sh` still runs everything on
  localhost, with the website builder enabled when `openscaffold-core` is
  present as a sibling directory.
