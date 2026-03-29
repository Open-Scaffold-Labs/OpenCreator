const express = require('express');

module.exports = (pool, authMiddleware) => {
  const router = express.Router();

  // GET /api/brands - list brands
  router.get('/', authMiddleware, async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT * FROM oc_brands
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [req.user.id]
      );

      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching brands:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/brands - create brand
  router.post('/', authMiddleware, async (req, res) => {
    try {
      const { name, contact_name, contact_email, website, industry, notes, status } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Brand name is required' });
      }

      const result = await pool.query(
        `INSERT INTO oc_brands (user_id, name, contact_name, contact_email, website, industry, notes, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [req.user.id, name, contact_name || null, contact_email || null, website || null, industry || null, notes || null, status || 'prospect']
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Error creating brand:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/brands/:id - get single brand
  router.get('/:id', authMiddleware, async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT * FROM oc_brands WHERE id = $1 AND user_id = $2`,
        [req.params.id, req.user.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Brand not found' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error fetching brand:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // PUT /api/brands/:id - update brand
  router.put('/:id', authMiddleware, async (req, res) => {
    try {
      const { name, contact_name, contact_email, website, industry, notes, status } = req.body;

      const result = await pool.query(
        `UPDATE oc_brands
         SET name = COALESCE($1, name),
             contact_name = COALESCE($2, contact_name),
             contact_email = COALESCE($3, contact_email),
             website = COALESCE($4, website),
             industry = COALESCE($5, industry),
             notes = COALESCE($6, notes),
             status = COALESCE($7, status),
             updated_at = NOW()
         WHERE id = $8 AND user_id = $9
         RETURNING *`,
        [name, contact_name, contact_email, website, industry, notes, status, req.params.id, req.user.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Brand not found' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error updating brand:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // DELETE /api/brands/:id - delete brand
  router.delete('/:id', authMiddleware, async (req, res) => {
    try {
      const result = await pool.query(
        `DELETE FROM oc_brands WHERE id = $1 AND user_id = $2 RETURNING id`,
        [req.params.id, req.user.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Brand not found' });
      }

      res.json({ message: 'Brand deleted successfully' });
    } catch (error) {
      console.error('Error deleting brand:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/brands/:id/deals - deals for brand
  router.get('/:id/deals', authMiddleware, async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT d.* FROM oc_deals d
         WHERE d.brand_id = $1 AND d.user_id = $2
         ORDER BY d.created_at DESC`,
        [req.params.id, req.user.id]
      );

      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching brand deals:', error);
      res.status(500).json({ error: error.message });
    }
  });

  return router;
};
