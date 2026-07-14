// Series (recurring show formats) + cadence engine — Sprint 2.
const express = require('express');

module.exports = (pool, authMiddleware) => {
  const router = express.Router();

  // GET /api/series — active series with episode counts
  router.get('/', authMiddleware, async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT s.*,
                COUNT(c.id) AS episode_count,
                COUNT(c.id) FILTER (WHERE c.status = 'published') AS published_count
         FROM oc_series s
         LEFT JOIN oc_content c ON c.series_id = s.id
         WHERE s.user_id = $1 AND s.active = true
         GROUP BY s.id
         ORDER BY s.created_at ASC`,
        [req.user.id]
      );
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/series — create a series
  router.post('/', authMiddleware, async (req, res) => {
    try {
      const { name, description, content_type, cadence_per_week,
              day_of_week, title_template, description_template,
              tags_template, target_duration_seconds } = req.body;
      if (!name) return res.status(400).json({ error: 'Name is required' });

      const result = await pool.query(
        `INSERT INTO oc_series
           (user_id, name, description, content_type, cadence_per_week,
            day_of_week, title_template, description_template,
            tags_template, target_duration_seconds)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         RETURNING *`,
        [req.user.id, name, description || null, content_type || 'video',
         cadence_per_week || 1, day_of_week ?? null, title_template || null,
         description_template || null, tags_template || null,
         target_duration_seconds || null]
      );
      res.status(201).json(result.rows[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // PUT /api/series/:id — update
  router.put('/:id', authMiddleware, async (req, res) => {
    try {
      const { name, description, content_type, cadence_per_week,
              day_of_week, title_template, description_template,
              tags_template, target_duration_seconds } = req.body;
      const result = await pool.query(
        `UPDATE oc_series SET
           name = COALESCE($1, name),
           description = COALESCE($2, description),
           content_type = COALESCE($3, content_type),
           cadence_per_week = COALESCE($4, cadence_per_week),
           day_of_week = $5,
           title_template = COALESCE($6, title_template),
           description_template = COALESCE($7, description_template),
           tags_template = COALESCE($8, tags_template),
           target_duration_seconds = COALESCE($9, target_duration_seconds)
         WHERE id = $10 AND user_id = $11
         RETURNING *`,
        [name, description, content_type, cadence_per_week,
         day_of_week ?? null, title_template, description_template,
         tags_template, target_duration_seconds, req.params.id, req.user.id]
      );
      if (!result.rows.length) return res.status(404).json({ error: 'Series not found' });
      res.json(result.rows[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // DELETE /api/series/:id — soft delete (episodes keep their series_id)
  router.delete('/:id', authMiddleware, async (req, res) => {
    try {
      const result = await pool.query(
        `UPDATE oc_series SET active = false WHERE id = $1 AND user_id = $2 RETURNING id`,
        [req.params.id, req.user.id]
      );
      if (!result.rows.length) return res.status(404).json({ error: 'Series not found' });
      res.json({ ok: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Next occurrence of dayOfWeek (0=Sun..6=Sat) strictly after `after`
  function nextOccurrence(after, dayOfWeek) {
    const d = new Date(after);
    d.setHours(12, 0, 0, 0);
    do { d.setDate(d.getDate() + 1); } while (d.getDay() !== dayOfWeek);
    return d;
  }

  // POST /api/series/:id/next-episode — generate the next planned show
  router.post('/:id/next-episode', authMiddleware, async (req, res) => {
    try {
      const sRes = await pool.query(
        `SELECT * FROM oc_series WHERE id = $1 AND user_id = $2 AND active = true`,
        [req.params.id, req.user.id]
      );
      if (!sRes.rows.length) return res.status(404).json({ error: 'Series not found' });
      const series = sRes.rows[0];
      const n = series.next_episode_number || 1;

      const title = series.title_template
        ? series.title_template.replaceAll('{n}', n)
        : `${series.name} #${n}`;

      // Schedule after the latest planned episode in this series (or today)
      const lastRes = await pool.query(
        `SELECT MAX(scheduled_date) AS last FROM oc_content
         WHERE series_id = $1 AND user_id = $2`,
        [series.id, req.user.id]
      );
      const base = lastRes.rows[0].last && new Date(lastRes.rows[0].last) > new Date()
        ? new Date(lastRes.rows[0].last)
        : new Date();
      let scheduled;
      if (series.day_of_week !== null && series.day_of_week !== undefined) {
        scheduled = nextOccurrence(base, series.day_of_week);
      } else {
        scheduled = new Date(base);
        scheduled.setDate(scheduled.getDate() + 7);
        scheduled.setHours(12, 0, 0, 0);
      }

      // First pipeline stage ("Idea") for the new episode
      const stageRes = await pool.query(
        `SELECT id FROM oc_pipeline_stages WHERE user_id = $1 ORDER BY sort_order ASC LIMIT 1`,
        [req.user.id]
      );
      const stageId = stageRes.rows.length ? stageRes.rows[0].id : null;

      const contentRes = await pool.query(
        `INSERT INTO oc_content
           (user_id, title, content_type, stage_id, description, tags,
            status, scheduled_date, series_id, episode_number)
         VALUES ($1,$2,$3,$4,$5,$6,'draft',$7,$8,$9)
         RETURNING *`,
        [req.user.id, title, series.content_type, stageId,
         series.description_template || null, series.tags_template || null,
         scheduled, series.id, n]
      );
      const episode = contentRes.rows[0];

      await pool.query(
        `INSERT INTO oc_calendar_events
           (user_id, content_id, title, event_type, start_date)
         VALUES ($1, $2, $3, 'upload', $4)`,
        [req.user.id, episode.id, title, scheduled]
      );

      await pool.query(
        `UPDATE oc_series SET next_episode_number = $1 WHERE id = $2`,
        [n + 1, series.id]
      );

      res.status(201).json(episode);
    } catch (error) {
      console.error('Next episode error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/series/meta/cadence?weeks=4 — weekly target vs planned, with gaps
  router.get('/meta/cadence', authMiddleware, async (req, res) => {
    try {
      const weeks = Math.min(parseInt(req.query.weeks || '4', 10), 12);
      const tRes = await pool.query(
        `SELECT COALESCE(SUM(cadence_per_week), 0) AS target
         FROM oc_series WHERE user_id = $1 AND active = true`,
        [req.user.id]
      );
      const weeklyTarget = parseFloat(tRes.rows[0].target);

      const out = [];
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      for (let i = 0; i < weeks; i++) {
        const start = new Date(now);
        start.setDate(start.getDate() + i * 7);
        const end = new Date(start);
        end.setDate(end.getDate() + 7);
        const cRes = await pool.query(
          `SELECT COUNT(*) AS planned FROM oc_content
           WHERE user_id = $1
             AND ((scheduled_date >= $2 AND scheduled_date < $3)
               OR (published_date >= $2 AND published_date < $3))`,
          [req.user.id, start, end]
        );
        const planned = parseInt(cRes.rows[0].planned, 10);
        out.push({
          start: start.toISOString().slice(0, 10),
          end: end.toISOString().slice(0, 10),
          planned,
          target: weeklyTarget,
          gap: Math.max(0, Math.ceil(weeklyTarget) - planned)
        });
      }
      res.json({ weeklyTarget, weeks: out });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
};
