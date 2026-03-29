const express = require('express');

module.exports = (pool, authMiddleware) => {
  const router = express.Router();

  // GET /api/analytics - list snapshots
  router.get('/', authMiddleware, async (req, res) => {
    try {
      const { channel_id, limit } = req.query;

      let query = `SELECT * FROM oc_analytics_snapshots
                   WHERE user_id = $1`;
      let params = [req.user.id];

      if (channel_id) {
        query += ` AND channel_id = $${params.length + 1}`;
        params.push(channel_id);
      }

      query += ` ORDER BY snapshot_date DESC`;

      if (limit) {
        query += ` LIMIT $${params.length + 1}`;
        params.push(parseInt(limit));
      }

      const result = await pool.query(query, params);

      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/analytics - add snapshot
  router.post('/', authMiddleware, async (req, res) => {
    try {
      const { channel_id, snapshot_date, subscribers, total_views, watch_hours, avg_view_duration, revenue_estimate, top_video_id, data_json } = req.body;

      if (!channel_id) {
        return res.status(400).json({ error: 'channel_id is required' });
      }

      const result = await pool.query(
        `INSERT INTO oc_analytics_snapshots (user_id, channel_id, snapshot_date, subscribers, total_views, watch_hours, avg_view_duration, revenue_estimate, top_video_id, data_json)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [req.user.id, channel_id, snapshot_date || new Date().toISOString().split('T')[0], subscribers || null, total_views || null, watch_hours || null, avg_view_duration || null, revenue_estimate || null, top_video_id || null, data_json ? JSON.stringify(data_json) : null]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Error creating analytics snapshot:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/analytics/:id - get single snapshot
  router.get('/:id', authMiddleware, async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT * FROM oc_analytics_snapshots WHERE id = $1 AND user_id = $2`,
        [req.params.id, req.user.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Analytics snapshot not found' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error fetching analytics snapshot:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // PUT /api/analytics/:id - update snapshot
  router.put('/:id', authMiddleware, async (req, res) => {
    try {
      const { snapshot_date, subscribers, total_views, watch_hours, avg_view_duration, revenue_estimate, top_video_id, data_json } = req.body;

      const result = await pool.query(
        `UPDATE oc_analytics_snapshots
         SET snapshot_date = COALESCE($1, snapshot_date),
             subscribers = COALESCE($2, subscribers),
             total_views = COALESCE($3, total_views),
             watch_hours = COALESCE($4, watch_hours),
             avg_view_duration = COALESCE($5, avg_view_duration),
             revenue_estimate = COALESCE($6, revenue_estimate),
             top_video_id = COALESCE($7, top_video_id),
             data_json = COALESCE($8, data_json)
         WHERE id = $9 AND user_id = $10
         RETURNING *`,
        [snapshot_date, subscribers, total_views, watch_hours, avg_view_duration, revenue_estimate, top_video_id, data_json ? JSON.stringify(data_json) : null, req.params.id, req.user.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Analytics snapshot not found' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error updating analytics snapshot:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // DELETE /api/analytics/:id - delete snapshot
  router.delete('/:id', authMiddleware, async (req, res) => {
    try {
      const result = await pool.query(
        `DELETE FROM oc_analytics_snapshots WHERE id = $1 AND user_id = $2 RETURNING id`,
        [req.params.id, req.user.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Analytics snapshot not found' });
      }

      res.json({ message: 'Analytics snapshot deleted successfully' });
    } catch (error) {
      console.error('Error deleting analytics snapshot:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/analytics/summary - channel summary stats
  router.get('/summary', authMiddleware, async (req, res) => {
    try {
      const { channel_id } = req.query;

      let query = `SELECT
                     COUNT(*) as total_snapshots,
                     MAX(subscribers) as current_subscribers,
                     MAX(total_views) as total_views_all_time,
                     AVG(watch_hours) as avg_watch_hours,
                     SUM(watch_hours) as total_watch_hours,
                     AVG(revenue_estimate) as avg_revenue_estimate,
                     SUM(revenue_estimate) as total_revenue_estimate,
                     MAX(snapshot_date) as last_snapshot_date,
                     MIN(snapshot_date) as first_snapshot_date
                   FROM oc_analytics_snapshots
                   WHERE user_id = $1`;
      let params = [req.user.id];

      if (channel_id) {
        query += ` AND channel_id = $${params.length + 1}`;
        params.push(channel_id);
      }

      const result = await pool.query(query, params);

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error fetching analytics summary:', error);
      res.status(500).json({ error: error.message });
    }
  });

  return router;
};
