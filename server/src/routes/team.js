const express = require('express');

module.exports = (pool, authMiddleware) => {
  const router = express.Router();

  // GET /api/team - list team members
  router.get('/', authMiddleware, async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT * FROM oc_team_members
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [req.user.id]
      );

      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching team members:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/team - add team member
  router.post('/', authMiddleware, async (req, res) => {
    try {
      const { name, email, role, rate_type, rate_amount, status, notes } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Team member name is required' });
      }

      const result = await pool.query(
        `INSERT INTO oc_team_members (user_id, name, email, role, rate_type, rate_amount, status, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [req.user.id, name, email || null, role || null, rate_type || 'per_video', rate_amount || null, status || 'active', notes || null]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Error creating team member:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/team/:id - get single team member
  router.get('/:id', authMiddleware, async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT * FROM oc_team_members WHERE id = $1 AND user_id = $2`,
        [req.params.id, req.user.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Team member not found' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error fetching team member:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // PUT /api/team/:id - update team member
  router.put('/:id', authMiddleware, async (req, res) => {
    try {
      const { name, email, role, rate_type, rate_amount, status, notes } = req.body;

      const result = await pool.query(
        `UPDATE oc_team_members
         SET name = COALESCE($1, name),
             email = COALESCE($2, email),
             role = COALESCE($3, role),
             rate_type = COALESCE($4, rate_type),
             rate_amount = COALESCE($5, rate_amount),
             status = COALESCE($6, status),
             notes = COALESCE($7, notes)
         WHERE id = $8 AND user_id = $9
         RETURNING *`,
        [name, email, role, rate_type, rate_amount, status, notes, req.params.id, req.user.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Team member not found' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error updating team member:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // DELETE /api/team/:id - delete team member
  router.delete('/:id', authMiddleware, async (req, res) => {
    try {
      const result = await pool.query(
        `DELETE FROM oc_team_members WHERE id = $1 AND user_id = $2 RETURNING id`,
        [req.params.id, req.user.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Team member not found' });
      }

      res.json({ message: 'Team member deleted successfully' });
    } catch (error) {
      console.error('Error deleting team member:', error);
      res.status(500).json({ error: error.message });
    }
  });

  return router;
};
