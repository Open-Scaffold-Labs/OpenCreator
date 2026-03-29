const express = require('express');

module.exports = (pool, authMiddleware) => {
  const router = express.Router();

  // GET /api/calendar - list events (with date range filter)
  router.get('/', authMiddleware, async (req, res) => {
    try {
      const { start_date, end_date, content_id } = req.query;

      let query = `SELECT * FROM oc_calendar_events WHERE user_id = $1`;
      let params = [req.user.id];

      if (start_date) {
        query += ` AND start_date >= $${params.length + 1}`;
        params.push(start_date);
      }

      if (end_date) {
        query += ` AND end_date <= $${params.length + 1}`;
        params.push(end_date);
      }

      if (content_id) {
        query += ` AND content_id = $${params.length + 1}`;
        params.push(content_id);
      }

      query += ` ORDER BY start_date ASC`;

      const result = await pool.query(query, params);

      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/calendar - create event
  router.post('/', authMiddleware, async (req, res) => {
    try {
      const { title, event_type, start_date, end_date, all_day, content_id, notes } = req.body;

      if (!title || !start_date) {
        return res.status(400).json({ error: 'title and start_date are required' });
      }

      const result = await pool.query(
        `INSERT INTO oc_calendar_events (user_id, title, event_type, start_date, end_date, all_day, content_id, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [req.user.id, title, event_type || 'upload', start_date, end_date || null, all_day || false, content_id || null, notes || null]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Error creating calendar event:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/calendar/:id - get single event
  router.get('/:id', authMiddleware, async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT * FROM oc_calendar_events WHERE id = $1 AND user_id = $2`,
        [req.params.id, req.user.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Calendar event not found' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error fetching calendar event:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // PUT /api/calendar/:id - update event
  router.put('/:id', authMiddleware, async (req, res) => {
    try {
      const { title, event_type, start_date, end_date, all_day, content_id, notes } = req.body;

      const result = await pool.query(
        `UPDATE oc_calendar_events
         SET title = COALESCE($1, title),
             event_type = COALESCE($2, event_type),
             start_date = COALESCE($3, start_date),
             end_date = COALESCE($4, end_date),
             all_day = COALESCE($5, all_day),
             content_id = COALESCE($6, content_id),
             notes = COALESCE($7, notes)
         WHERE id = $8 AND user_id = $9
         RETURNING *`,
        [title, event_type, start_date, end_date, all_day, content_id, notes, req.params.id, req.user.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Calendar event not found' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error updating calendar event:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // DELETE /api/calendar/:id - delete event
  router.delete('/:id', authMiddleware, async (req, res) => {
    try {
      const result = await pool.query(
        `DELETE FROM oc_calendar_events WHERE id = $1 AND user_id = $2 RETURNING id`,
        [req.params.id, req.user.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Calendar event not found' });
      }

      res.json({ message: 'Calendar event deleted successfully' });
    } catch (error) {
      console.error('Error deleting calendar event:', error);
      res.status(500).json({ error: error.message });
    }
  });

  return router;
};
