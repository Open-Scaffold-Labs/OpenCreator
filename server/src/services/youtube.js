// YouTube integration service — Google OAuth + Data API adapter.
// Sprint 1 uses read-only scopes; the upload scope arrives with the
// publishing queue (S3) to defer Google's API verification requirements.
const { google } = require('googleapis');
const crypto = require('crypto');

const SCOPES = [
  'https://www.googleapis.com/auth/youtube.readonly',
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/yt-analytics.readonly'
];

// Approximate quota costs (units) per Data API call — 10,000/day default budget
const QUOTA = { channelsList: 1, playlistItemsList: 1, videosList: 1, videosInsert: 1600, thumbnailsSet: 50 };

// --- Token encryption at rest (AES-256-GCM, key derived from JWT_SECRET) ---
function key() {
  return crypto.createHash('sha256')
    .update((process.env.JWT_SECRET || 'your-secret-key') + ':oc-youtube-tokens')
    .digest();
}

function encrypt(text) {
  if (!text) return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const enc = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  return [iv.toString('hex'), cipher.getAuthTag().toString('hex'), enc.toString('hex')].join(':');
}

function decrypt(payload) {
  if (!payload) return null;
  const [iv, tag, data] = payload.split(':');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key(), Buffer.from(iv, 'hex'));
  decipher.setAuthTag(Buffer.from(tag, 'hex'));
  return Buffer.concat([decipher.update(Buffer.from(data, 'hex')), decipher.final()]).toString('utf8');
}

function oauthClient() {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    const err = new Error('YouTube integration not configured — set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET (see server/.env.example)');
    err.code = 'NOT_CONFIGURED';
    throw err;
  }
  return new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3012/api/youtube/callback'
  );
}

function getAuthUrl(state) {
  return oauthClient().generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
    state
  });
}

async function exchangeCode(code) {
  const client = oauthClient();
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);
  return { client, tokens };
}

// Build an authorized client from a stored oc_channels row.
// Persists refreshed tokens back to the row automatically.
function clientForChannel(pool, channel) {
  const client = oauthClient();
  client.setCredentials({
    access_token: decrypt(channel.access_token),
    refresh_token: decrypt(channel.refresh_token),
    expiry_date: channel.token_expiry ? new Date(channel.token_expiry).getTime() : null
  });
  client.on('tokens', async (tokens) => {
    try {
      await pool.query(
        `UPDATE oc_channels SET
           access_token = COALESCE($1, access_token),
           refresh_token = COALESCE($2, refresh_token),
           token_expiry = COALESCE($3, token_expiry),
           updated_at = NOW()
         WHERE id = $4`,
        [tokens.access_token ? encrypt(tokens.access_token) : null,
         tokens.refresh_token ? encrypt(tokens.refresh_token) : null,
         tokens.expiry_date ? new Date(tokens.expiry_date) : null,
         channel.id]
      );
    } catch (e) {
      console.error('Failed to persist refreshed YouTube tokens:', e.message);
    }
  });
  return client;
}

// --- Quota ledger (10,000 units/day default budget) ---
async function logQuota(pool, userId, units) {
  await pool.query(
    `INSERT INTO oc_api_quota (user_id, usage_date, units)
     VALUES ($1, CURRENT_DATE, $2)
     ON CONFLICT (user_id, usage_date)
     DO UPDATE SET units = oc_api_quota.units + EXCLUDED.units`,
    [userId, units]
  );
}

async function quotaToday(pool, userId) {
  const r = await pool.query(
    `SELECT units FROM oc_api_quota WHERE user_id = $1 AND usage_date = CURRENT_DATE`,
    [userId]
  );
  return r.rows.length ? r.rows[0].units : 0;
}

// --- Data API wrappers ---
async function fetchMyChannel(auth) {
  const yt = google.youtube({ version: 'v3', auth });
  const res = await yt.channels.list({ part: 'snippet,statistics,contentDetails', mine: true });
  const c = res.data.items && res.data.items[0];
  if (!c) return null;
  return {
    channelId: c.id,
    title: c.snippet.title,
    description: c.snippet.description,
    thumbnail: (c.snippet.thumbnails && (c.snippet.thumbnails.medium || c.snippet.thumbnails.default) || {}).url || null,
    subscribers: parseInt(c.statistics.subscriberCount || 0, 10),
    views: parseInt(c.statistics.viewCount || 0, 10),
    videoCount: parseInt(c.statistics.videoCount || 0, 10),
    uploadsPlaylistId: (c.contentDetails && c.contentDetails.relatedPlaylists || {}).uploads || null
  };
}

async function fetchUploads(auth, playlistId, max = 50) {
  const yt = google.youtube({ version: 'v3', auth });
  const res = await yt.playlistItems.list({
    part: 'snippet,contentDetails',
    playlistId,
    maxResults: Math.min(max, 50)
  });
  return (res.data.items || []).map(i => ({
    videoId: i.contentDetails.videoId,
    title: i.snippet.title,
    description: i.snippet.description,
    publishedAt: i.contentDetails.videoPublishedAt || i.snippet.publishedAt,
    thumbnail: ((i.snippet.thumbnails && (i.snippet.thumbnails.medium || i.snippet.thumbnails.default)) || {}).url || null
  }));
}

// ISO8601 duration (PT#H#M#S) → seconds
function parseDuration(iso) {
  const m = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/.exec(iso || '');
  if (!m) return null;
  return (parseInt(m[1] || 0, 10) * 3600) + (parseInt(m[2] || 0, 10) * 60) + parseInt(m[3] || 0, 10);
}

async function fetchVideoDetails(auth, videoIds) {
  if (!videoIds.length) return {};
  const yt = google.youtube({ version: 'v3', auth });
  const res = await yt.videos.list({
    part: 'statistics,contentDetails',
    id: videoIds.join(',')
  });
  const out = {};
  for (const v of res.data.items || []) {
    out[v.id] = {
      views: parseInt((v.statistics || {}).viewCount || 0, 10),
      likes: parseInt((v.statistics || {}).likeCount || 0, 10),
      comments: parseInt((v.statistics || {}).commentCount || 0, 10),
      durationSeconds: parseDuration((v.contentDetails || {}).duration)
    };
  }
  return out;
}

// Upload a video file. When publishAt is set the video goes up private
// with a scheduled publish time; otherwise it publishes immediately.
// googleapis uses the resumable upload protocol for media streams.
async function uploadVideo(auth, { filePath, title, description, tags, publishAt, madeForKids = false }) {
  const fs = require('fs');
  const yt = google.youtube({ version: 'v3', auth });
  const status = publishAt
    ? { privacyStatus: 'private', publishAt: new Date(publishAt).toISOString(), selfDeclaredMadeForKids: madeForKids }
    : { privacyStatus: 'public', selfDeclaredMadeForKids: madeForKids };
  const res = await yt.videos.insert({
    part: 'snippet,status',
    requestBody: {
      snippet: {
        title: (title || 'Untitled').slice(0, 100),
        description: description || '',
        tags: tags ? String(tags).split(',').map(t => t.trim()).filter(Boolean).slice(0, 30) : undefined
      },
      status
    },
    media: { body: fs.createReadStream(filePath) }
  });
  return res.data; // includes id
}

async function setThumbnail(auth, videoId, filePath, mimeType) {
  const fs = require('fs');
  const yt = google.youtube({ version: 'v3', auth });
  const res = await yt.thumbnails.set({
    videoId,
    media: { mimeType: mimeType || 'image/jpeg', body: fs.createReadStream(filePath) }
  });
  return res.data;
}

module.exports = {
  SCOPES, QUOTA,
  uploadVideo, setThumbnail,
  encrypt, decrypt,
  getAuthUrl, exchangeCode, clientForChannel,
  logQuota, quotaToday,
  fetchMyChannel, fetchUploads, fetchVideoDetails, parseDuration
};
