// YouTube connect/sync/publish routes — Sprints 1 & 3 of the implementation plan.
const express = require('express');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const yt = require('../services/youtube');

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });
const upload = multer({
  dest: UPLOAD_DIR,
  limits: { fileSize: 128 * 1024 * 1024 * 1024 } // YouTube's own max is 256GB/12h
});

module.exports = (pool, authMiddleware, JWT_SECRET) => {
  const router = express.Router();
  const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5180';

  // GET /api/youtube/status — connection + quota summary
  router.get('/status', authMiddleware, async (req, res) => {
    try {
      const ch = await pool.query(
        `SELECT id, channel_name, channel_id, subscriber_count, total_views,
                video_count, thumbnail_url, connected, last_synced_at
         FROM oc_channels
         WHERE user_id = $1 AND connected = true
         ORDER BY id LIMIT 1`,
        [req.user.id]
      );
      const units = await yt.quotaToday(pool, req.user.id);
      const configured = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
      res.json({
        configured,
        connected: ch.rows.length > 0,
        channel: ch.rows[0] || null,
        quota: { usedToday: units, dailyBudget: 10000 }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/youtube/auth-url — start the OAuth flow
  router.get('/auth-url', authMiddleware, (req, res) => {
    try {
      const state = jwt.sign({ id: req.user.id, purpose: 'yt-oauth' }, JWT_SECRET, { expiresIn: '10m' });
      res.json({ url: yt.getAuthUrl(state) });
    } catch (e) {
      res.status(e.code === 'NOT_CONFIGURED' ? 501 : 500).json({ error: e.message });
    }
  });

  // GET /api/youtube/callback — browser redirect from Google (no bearer token;
  // identity is carried in the signed state param)
  router.get('/callback', async (req, res) => {
    const { code, state, error } = req.query;
    if (error) {
      return res.redirect(`${CLIENT_URL}/?youtube=error&reason=${encodeURIComponent(error)}`);
    }
    try {
      const decoded = jwt.verify(state, JWT_SECRET);
      if (decoded.purpose !== 'yt-oauth') throw new Error('Invalid state');

      const { client, tokens } = await yt.exchangeCode(code);
      const info = await yt.fetchMyChannel(client);
      await yt.logQuota(pool, decoded.id, yt.QUOTA.channelsList);
      if (!info) {
        return res.redirect(`${CLIENT_URL}/?youtube=error&reason=no_channel`);
      }

      const enc = {
        access: tokens.access_token ? yt.encrypt(tokens.access_token) : null,
        refresh: tokens.refresh_token ? yt.encrypt(tokens.refresh_token) : null,
        expiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null
      };

      const existing = await pool.query(
        `SELECT id FROM oc_channels WHERE user_id = $1 AND channel_id = $2`,
        [decoded.id, info.channelId]
      );

      if (existing.rows.length) {
        await pool.query(
          `UPDATE oc_channels SET
             channel_name = $1, subscriber_count = $2, total_views = $3,
             video_count = $4, description = $5, thumbnail_url = $6,
             access_token = $7, refresh_token = COALESCE($8, refresh_token),
             token_expiry = $9, uploads_playlist_id = $10,
             connected = true, updated_at = NOW()
           WHERE id = $11`,
          [info.title, info.subscribers, info.views, info.videoCount,
           info.description, info.thumbnail, enc.access, enc.refresh,
           enc.expiry, info.uploadsPlaylistId, existing.rows[0].id]
        );
      } else {
        await pool.query(
          `INSERT INTO oc_channels
             (user_id, channel_name, channel_id, subscriber_count, total_views,
              video_count, description, thumbnail_url, access_token,
              refresh_token, token_expiry, uploads_playlist_id, connected)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,true)`,
          [decoded.id, info.title, info.channelId, info.subscribers, info.views,
           info.videoCount, info.description, info.thumbnail, enc.access,
           enc.refresh, enc.expiry, info.uploadsPlaylistId]
        );
      }

      res.redirect(`${CLIENT_URL}/?youtube=connected`);
    } catch (e) {
      console.error('YouTube callback error:', e.message);
      res.redirect(`${CLIENT_URL}/?youtube=error&reason=callback_failed`);
    }
  });

  // POST /api/youtube/sync — refresh channel stats, import uploads into the
  // content pipeline, and record an analytics snapshot
  router.post('/sync', authMiddleware, async (req, res) => {
    try {
      const chRes = await pool.query(
        `SELECT * FROM oc_channels WHERE user_id = $1 AND connected = true ORDER BY id LIMIT 1`,
        [req.user.id]
      );
      if (!chRes.rows.length) {
        return res.status(400).json({ error: 'No connected YouTube channel — connect one in Settings first' });
      }
      const channel = chRes.rows[0];
      const auth = yt.clientForChannel(pool, channel);
      let units = 0;

      const info = await yt.fetchMyChannel(auth);
      units += yt.QUOTA.channelsList;
      if (!info) return res.status(502).json({ error: 'YouTube returned no channel for this account' });

      await pool.query(
        `UPDATE oc_channels SET
           channel_name = $1, subscriber_count = $2, total_views = $3,
           video_count = $4, thumbnail_url = COALESCE($5, thumbnail_url),
           uploads_playlist_id = COALESCE($6, uploads_playlist_id),
           updated_at = NOW()
         WHERE id = $7`,
        [info.title, info.subscribers, info.views, info.videoCount,
         info.thumbnail, info.uploadsPlaylistId, channel.id]
      );

      const playlistId = info.uploadsPlaylistId || channel.uploads_playlist_id;
      let uploads = [];
      let details = {};
      if (playlistId) {
        uploads = await yt.fetchUploads(auth, playlistId);
        units += yt.QUOTA.playlistItemsList;
        if (uploads.length) {
          details = await yt.fetchVideoDetails(auth, uploads.map(u => u.videoId));
          units += yt.QUOTA.videosList;
        }
      }

      let imported = 0;
      let updated = 0;
      for (const v of uploads) {
        const d = details[v.videoId] || {};
        // Shorts are <= 3 minutes (180s); small buffer for rounding
        const contentType = d.durationSeconds != null && d.durationSeconds <= 183 ? 'short' : 'video';
        const existing = await pool.query(
          `SELECT id FROM oc_content WHERE user_id = $1 AND youtube_video_id = $2`,
          [req.user.id, v.videoId]
        );

        if (existing.rows.length) {
          await pool.query(
            `UPDATE oc_content SET
               title = $1, description = $2, thumbnail_url = $3,
               content_type = $4, view_count = $5, duration_seconds = $6,
               published_date = $7, status = 'published', updated_at = NOW()
             WHERE id = $8`,
            [v.title, v.description, v.thumbnail, contentType,
             d.views || null, d.durationSeconds, v.publishedAt, existing.rows[0].id]
          );
          updated++;
        } else {
          await pool.query(
            `INSERT INTO oc_content
               (user_id, channel_id, title, content_type, description,
                thumbnail_url, youtube_url, youtube_video_id, status,
                published_date, view_count, duration_seconds)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'published',$9,$10,$11)`,
            [req.user.id, channel.id, v.title, contentType, v.description,
             v.thumbnail, `https://www.youtube.com/watch?v=${v.videoId}`,
             v.videoId, v.publishedAt, d.views || null, d.durationSeconds]
          );
          imported++;
        }
      }

      // Daily analytics snapshot for the trend charts
      await pool.query(
        `INSERT INTO oc_analytics_snapshots
           (user_id, channel_id, subscribers, total_views, data_json)
         VALUES ($1, $2, $3, $4, $5)`,
        [req.user.id, channel.id, info.subscribers, info.views,
         JSON.stringify({ videoCount: info.videoCount, syncedVideos: uploads.length })]
      );

      await pool.query(`UPDATE oc_channels SET last_synced_at = NOW() WHERE id = $1`, [channel.id]);
      await yt.logQuota(pool, req.user.id, units);

      res.json({
        ok: true,
        imported,
        updated,
        videos: uploads.length,
        quotaUnits: units,
        channel: {
          name: info.title,
          subscribers: info.subscribers,
          totalViews: info.views,
          videoCount: info.videoCount
        }
      });
    } catch (e) {
      console.error('YouTube sync error:', e.message);
      res.status(500).json({ error: e.message });
    }
  });

  // POST /api/youtube/publish/:contentId — upload a pipeline item to YouTube.
  // multipart form: video (file, required), thumbnail (file, optional),
  // publish_mode ('now' | 'schedule'), publish_at (ISO, optional override)
  router.post('/publish/:contentId',
    authMiddleware,
    upload.fields([{ name: 'video', maxCount: 1 }, { name: 'thumbnail', maxCount: 1 }]),
    async (req, res) => {
      const files = req.files || {};
      const videoFile = files.video && files.video[0];
      const thumbFile = files.thumbnail && files.thumbnail[0];
      const cleanup = () => {
        for (const f of [videoFile, thumbFile]) {
          if (f) fs.unlink(f.path, () => {});
        }
      };
      try {
        if (!videoFile) return res.status(400).json({ error: 'No video file attached' });

        const cRes = await pool.query(
          `SELECT * FROM oc_content WHERE id = $1 AND user_id = $2`,
          [req.params.contentId, req.user.id]
        );
        if (!cRes.rows.length) { cleanup(); return res.status(404).json({ error: 'Content not found' }); }
        const item = cRes.rows[0];
        if (item.youtube_video_id) { cleanup(); return res.status(409).json({ error: 'Already on YouTube' }); }

        const chRes = await pool.query(
          `SELECT * FROM oc_channels WHERE user_id = $1 AND connected = true ORDER BY id LIMIT 1`,
          [req.user.id]
        );
        if (!chRes.rows.length) { cleanup(); return res.status(400).json({ error: 'No connected YouTube channel' }); }
        const channel = chRes.rows[0];
        const auth = yt.clientForChannel(pool, channel);

        const mode = req.body.publish_mode === 'schedule' ? 'schedule' : 'now';
        const publishAt = mode === 'schedule'
          ? (req.body.publish_at || item.scheduled_date)
          : null;
        if (mode === 'schedule' && !publishAt) {
          cleanup();
          return res.status(400).json({ error: 'No scheduled date on this item — set one or publish now' });
        }
        if (mode === 'schedule' && new Date(publishAt) <= new Date()) {
          cleanup();
          return res.status(400).json({ error: 'Scheduled publish time must be in the future' });
        }

        let units = 0;
        const video = await yt.uploadVideo(auth, {
          filePath: videoFile.path,
          title: item.title,
          description: item.description,
          tags: item.tags,
          publishAt
        });
        units += yt.QUOTA.videosInsert;

        if (thumbFile) {
          try {
            await yt.setThumbnail(auth, video.id, thumbFile.path, thumbFile.mimetype);
            units += yt.QUOTA.thumbnailsSet;
          } catch (e) {
            console.error('Thumbnail set failed (video still uploaded):', e.message);
          }
        }

        await pool.query(
          `UPDATE oc_content SET
             youtube_video_id = $1,
             youtube_url = $2,
             status = $3,
             published_date = $4,
             scheduled_date = COALESCE($5, scheduled_date),
             updated_at = NOW()
           WHERE id = $6`,
          [video.id, `https://www.youtube.com/watch?v=${video.id}`,
           mode === 'now' ? 'published' : 'scheduled',
           mode === 'now' ? new Date() : null,
           publishAt ? new Date(publishAt) : null,
           item.id]
        );
        await yt.logQuota(pool, req.user.id, units);
        cleanup();

        res.json({
          ok: true,
          videoId: video.id,
          url: `https://www.youtube.com/watch?v=${video.id}`,
          mode,
          publishAt,
          quotaUnits: units
        });
      } catch (e) {
        cleanup();
        console.error('Publish error:', e.message);
        const msg = /insufficient|scope|permission/i.test(e.message)
          ? 'YouTube upload permission missing — disconnect and reconnect your channel in Settings to grant it'
          : e.message;
        res.status(500).json({ error: msg });
      }
    });

  // DELETE /api/youtube/disconnect — drop tokens, keep imported data
  router.delete('/disconnect', authMiddleware, async (req, res) => {
    try {
      await pool.query(
        `UPDATE oc_channels SET
           access_token = NULL, refresh_token = NULL, token_expiry = NULL,
           connected = false, updated_at = NOW()
         WHERE user_id = $1 AND connected = true`,
        [req.user.id]
      );
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  return router;
};
