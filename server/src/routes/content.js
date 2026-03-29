const express = require('express');

module.exports = (pool, authMiddleware) => {
  const router = express.Router();

  // GET /api/content - list all content for user (with stage info)
  router.get('/', authMiddleware, async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT c.*, s.name as stage_name, s.color as stage_color, ch.channel_name
         FROM oc_content c
         LEFT JOIN oc_pipeline_stages s ON c.stage_id = s.id
         LEFT JOIN oc_channels ch ON c.channel_id = ch.id
         WHERE c.user_id = $1
         ORDER BY c.created_at DESC`,
        [req.user.id]
      );

      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching content:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/content - create content item
  router.post('/', authMiddleware, async (req, res) => {
    try {
      const { title, channel_id, content_type, stage_id, description, script, tags } = req.body;

      if (!title) {
        return res.status(400).json({ error: 'Title is required' });
      }

      const result = await pool.query(
        `INSERT INTO oc_content (user_id, channel_id, title, content_type, stage_id, description, script, tags, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [req.user.id, channel_id || null, title, content_type || 'video', stage_id || null, description || null, script || null, tags || null, 'draft']
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Error creating content:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/content/:id - get single content item
  router.get('/:id', authMiddleware, async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT c.*, s.name as stage_name, s.color as stage_color, ch.channel_name
         FROM oc_content c
         LEFT JOIN oc_pipeline_stages s ON c.stage_id = s.id
         LEFT JOIN oc_channels ch ON c.channel_id = ch.id
         WHERE c.id = $1 AND c.user_id = $2`,
        [req.params.id, req.user.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Content not found' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error fetching content:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // PUT /api/content/:id - update content item
  router.put('/:id', authMiddleware, async (req, res) => {
    try {
      const { title, channel_id, content_type, stage_id, description, script, tags, status, scheduled_date, published_date, thumbnail_url, youtube_url, youtube_video_id } = req.body;

      const result = await pool.query(
        `UPDATE oc_content
         SET title = COALESCE($1, title),
             channel_id = COALESCE($2, channel_id),
             content_type = COALESCE($3, content_type),
             stage_id = COALESCE($4, stage_id),
             description = COALESCE($5, description),
             script = COALESCE($6, script),
             tags = COALESCE($7, tags),
             status = COALESCE($8, status),
             scheduled_date = COALESCE($9, scheduled_date),
             published_date = COALESCE($10, published_date),
             thumbnail_url = COALESCE($11, thumbnail_url),
             youtube_url = COALESCE($12, youtube_url),
             youtube_video_id = COALESCE($13, youtube_video_id),
             updated_at = NOW()
         WHERE id = $14 AND user_id = $15
         RETURNING *`,
        [title, channel_id, content_type, stage_id, description, script, tags, status, scheduled_date, published_date, thumbnail_url, youtube_url, youtube_video_id, req.params.id, req.user.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Content not found' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error updating content:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // DELETE /api/content/:id - delete content item
  router.delete('/:id', authMiddleware, async (req, res) => {
    try {
      const result = await pool.query(
        `DELETE FROM oc_content WHERE id = $1 AND user_id = $2 RETURNING id`,
        [req.params.id, req.user.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Content not found' });
      }

      res.json({ message: 'Content deleted successfully' });
    } catch (error) {
      console.error('Error deleting content:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // PUT /api/content/:id/stage - move to different pipeline stage
  router.put('/:id/stage', authMiddleware, async (req, res) => {
    try {
      const { stage_id } = req.body;

      if (!stage_id) {
        return res.status(400).json({ error: 'stage_id is required' });
      }

      const result = await pool.query(
        `UPDATE oc_content
         SET stage_id = $1, updated_at = NOW()
         WHERE id = $2 AND user_id = $3
         RETURNING *`,
        [stage_id, req.params.id, req.user.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Content not found' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error moving content to stage:', error);
      res.status(500).json({ error: error.message });
    }
  });

  return router;
};
