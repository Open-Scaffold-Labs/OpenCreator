const express = require('express');

module.exports = (pool, authMiddleware) => {
  const router = express.Router();

  // GET /api/equipment - list equipment
  router.get('/', authMiddleware, async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT * FROM oc_equipment
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [req.user.id]
      );

      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching equipment:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/equipment - add equipment
  router.post('/', authMiddleware, async (req, res) => {
    try {
      const { name, category, purchase_date, purchase_price, current_value, warranty_expires, serial_number, notes, status } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Equipment name is required' });
      }

      const result = await pool.query(
        `INSERT INTO oc_equipment (user_id, name, category, purchase_date, purchase_price, current_value, warranty_expires, serial_number, notes, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [req.user.id, name, category || null, purchase_date || null, purchase_price || null, current_value || null, warranty_expires || null, serial_number || null, notes || null, status || 'active']
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Error creating equipment:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/equipment/:id - get single equipment
  router.get('/:id', authMiddleware, async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT * FROM oc_equipment WHERE id = $1 AND user_id = $2`,
        [req.params.id, req.user.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Equipment not found' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error fetching equipment:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // PUT /api/equipment/:id - update equipment
  router.put('/:id', authMiddleware, async (req, res) => {
    try {
      const { name, category, purchase_date, purchase_price, current_value, warranty_expires, serial_number, notes, status } = req.body;

      const result = await pool.query(
        `UPDATE oc_equipment
         SET name = COALESCE($1, name),
             category = COALESCE($2, category),
             purchase_date = COALESCE($3, purchase_date),
             purchase_price = COALESCE($4, purchase_price),
             current_value = COALESCE($5, current_value),
             warranty_expires = COALESCE($6, warranty_expires),
             serial_number = COALESCE($7, serial_number),
             notes = COALESCE($8, notes),
             status = COALESCE($9, status)
         WHERE id = $10 AND user_id = $11
         RETURNING *`,
        [name, category, purchase_date, purchase_price, current_value, warranty_expires, serial_number, notes, status, req.params.id, req.user.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Equipment not found' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error updating equipment:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // DELETE /api/equipment/:id - delete equipment
  router.delete('/:id', authMiddleware, async (req, res) => {
    try {
      const result = await pool.query(
        `DELETE FROM oc_equipment WHERE id = $1 AND user_id = $2 RETURNING id`,
        [req.params.id, req.user.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Equipment not found' });
      }

      res.json({ message: 'Equipment deleted successfully' });
    } catch (error) {
      console.error('Error deleting equipment:', error);
      res.status(500).json({ error: error.message });
    }
  });

  return router;
};
