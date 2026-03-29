const express = require('express');

module.exports = (pool, authMiddleware) => {
  const router = express.Router();

  // GET /api/pipeline/stages - list stages for user
  router.get('/stages', authMiddleware, async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT * FROM oc_pipeline_stages
         WHERE user_id = $1
         ORDER BY sort_order ASC`,
        [req.user.id]
      );

      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching stages:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/pipeline/stages - create stage
  router.post('/stages', authMiddleware, async (req, res) => {
    try {
      const { name, color } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Stage name is required' });
      }

      // Get the highest sort_order for this user
      const orderResult = await pool.query(
        `SELECT MAX(sort_order) as max_order FROM oc_pipeline_stages WHERE user_id = $1`,
        [req.user.id]
      );

      const nextOrder = (orderResult.rows[0].max_order || -1) + 1;

      const result = await pool.query(
        `INSERT INTO oc_pipeline_stages (user_id, name, sort_order, color)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [req.user.id, name, nextOrder, color || '#4F46E5']
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Error creating stage:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/pipeline/stages/:id - get single stage
  router.get('/stages/:id', authMiddleware, async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT * FROM oc_pipeline_stages
         WHERE id = $1 AND user_id = $2`,
        [req.params.id, req.user.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Stage not found' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error fetching stage:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // PUT /api/pipeline/stages/:id - update stage
  router.put('/stages/:id', authMiddleware, async (req, res) => {
    try {
      const { name, color, sort_order } = req.body;

      const result = await pool.query(
        `UPDATE oc_pipeline_stages
         SET name = COALESCE($1, name),
             color = COALESCE($2, color),
             sort_order = COALESCE($3, sort_order)
         WHERE id = $4 AND user_id = $5
         RETURNING *`,
        [name, color, sort_order, req.params.id, req.user.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Stage not found' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error updating stage:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // DELETE /api/pipeline/stages/:id - delete stage
  router.delete('/stages/:id', authMiddleware, async (req, res) => {
    try {
      const result = await pool.query(
        `DELETE FROM oc_pipeline_stages WHERE id = $1 AND user_id = $2 RETURNING id`,
        [req.params.id, req.user.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Stage not found' });
      }

      res.json({ message: 'Stage deleted successfully' });
    } catch (error) {
      console.error('Error deleting stage:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // PUT /api/pipeline/reorder - reorder stages
  router.put('/reorder', authMiddleware, async (req, res) => {
    try {
      const { stages } = req.body; // expects array of {id, sort_order}

      if (!Array.isArray(stages)) {
        return res.status(400).json({ error: 'stages must be an array' });
      }

      for (const stage of stages) {
        await pool.query(
          `UPDATE oc_pipeline_stages
           SET sort_order = $1
           WHERE id = $2 AND user_id = $3`,
          [stage.sort_order, stage.id, req.user.id]
        );
      }

      const result = await pool.query(
        `SELECT * FROM oc_pipeline_stages
         WHERE user_id = $1
         ORDER BY sort_order ASC`,
        [req.user.id]
      );

      res.json(result.rows);
    } catch (error) {
      console.error('Error reordering stages:', error);
      res.status(500).json({ error: error.message });
    }
  });

  return router;
};
