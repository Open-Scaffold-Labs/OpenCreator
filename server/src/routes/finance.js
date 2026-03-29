const express = require('express');

module.exports = (pool, authMiddleware) => {
  const revenueRouter = express.Router();
  const expenseRouter = express.Router();
  const financeRouter = express.Router();

  // REVENUE ROUTES

  // GET /api/revenue - list revenue entries
  revenueRouter.get('/', authMiddleware, async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT * FROM oc_revenue
         WHERE user_id = $1
         ORDER BY period_start DESC`,
        [req.user.id]
      );

      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching revenue:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/revenue - add revenue entry
  revenueRouter.post('/', authMiddleware, async (req, res) => {
    try {
      const { source, amount, currency, period_start, period_end, content_id, notes } = req.body;

      if (!source || !amount) {
        return res.status(400).json({ error: 'source and amount are required' });
      }

      const result = await pool.query(
        `INSERT INTO oc_revenue (user_id, source, amount, currency, period_start, period_end, content_id, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [req.user.id, source, amount, currency || 'USD', period_start || null, period_end || null, content_id || null, notes || null]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Error creating revenue entry:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/revenue/:id - get single revenue entry
  revenueRouter.get('/:id', authMiddleware, async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT * FROM oc_revenue WHERE id = $1 AND user_id = $2`,
        [req.params.id, req.user.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Revenue entry not found' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error fetching revenue entry:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // PUT /api/revenue/:id - update revenue entry
  revenueRouter.put('/:id', authMiddleware, async (req, res) => {
    try {
      const { source, amount, currency, period_start, period_end, content_id, notes } = req.body;

      const result = await pool.query(
        `UPDATE oc_revenue
         SET source = COALESCE($1, source),
             amount = COALESCE($2, amount),
             currency = COALESCE($3, currency),
             period_start = COALESCE($4, period_start),
             period_end = COALESCE($5, period_end),
             content_id = COALESCE($6, content_id),
             notes = COALESCE($7, notes)
         WHERE id = $8 AND user_id = $9
         RETURNING *`,
        [source, amount, currency, period_start, period_end, content_id, notes, req.params.id, req.user.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Revenue entry not found' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error updating revenue entry:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // DELETE /api/revenue/:id - delete revenue entry
  revenueRouter.delete('/:id', authMiddleware, async (req, res) => {
    try {
      const result = await pool.query(
        `DELETE FROM oc_revenue WHERE id = $1 AND user_id = $2 RETURNING id`,
        [req.params.id, req.user.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Revenue entry not found' });
      }

      res.json({ message: 'Revenue entry deleted successfully' });
    } catch (error) {
      console.error('Error deleting revenue entry:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // EXPENSE ROUTES

  // GET /api/expenses - list expenses
  expenseRouter.get('/', authMiddleware, async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT * FROM oc_expenses
         WHERE user_id = $1
         ORDER BY expense_date DESC`,
        [req.user.id]
      );

      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/expenses - add expense
  expenseRouter.post('/', authMiddleware, async (req, res) => {
    try {
      const { category, amount, currency, vendor, description, receipt_url, expense_date, tax_deductible } = req.body;

      if (!category || !amount) {
        return res.status(400).json({ error: 'category and amount are required' });
      }

      const result = await pool.query(
        `INSERT INTO oc_expenses (user_id, category, amount, currency, vendor, description, receipt_url, expense_date, tax_deductible)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [req.user.id, category, amount, currency || 'USD', vendor || null, description || null, receipt_url || null, expense_date || new Date().toISOString().split('T')[0], tax_deductible !== false]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Error creating expense:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/expenses/:id - get single expense
  expenseRouter.get('/:id', authMiddleware, async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT * FROM oc_expenses WHERE id = $1 AND user_id = $2`,
        [req.params.id, req.user.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Expense not found' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error fetching expense:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // PUT /api/expenses/:id - update expense
  expenseRouter.put('/:id', authMiddleware, async (req, res) => {
    try {
      const { category, amount, currency, vendor, description, receipt_url, expense_date, tax_deductible } = req.body;

      const result = await pool.query(
        `UPDATE oc_expenses
         SET category = COALESCE($1, category),
             amount = COALESCE($2, amount),
             currency = COALESCE($3, currency),
             vendor = COALESCE($4, vendor),
             description = COALESCE($5, description),
             receipt_url = COALESCE($6, receipt_url),
             expense_date = COALESCE($7, expense_date),
             tax_deductible = COALESCE($8, tax_deductible)
         WHERE id = $9 AND user_id = $10
         RETURNING *`,
        [category, amount, currency, vendor, description, receipt_url, expense_date, tax_deductible, req.params.id, req.user.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Expense not found' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error updating expense:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // DELETE /api/expenses/:id - delete expense
  expenseRouter.delete('/:id', authMiddleware, async (req, res) => {
    try {
      const result = await pool.query(
        `DELETE FROM oc_expenses WHERE id = $1 AND user_id = $2 RETURNING id`,
        [req.params.id, req.user.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Expense not found' });
      }

      res.json({ message: 'Expense deleted successfully' });
    } catch (error) {
      console.error('Error deleting expense:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // FINANCE SUMMARY ROUTE

  // GET /api/finance/summary - P&L summary
  financeRouter.get('/summary', authMiddleware, async (req, res) => {
    try {
      const revenueResult = await pool.query(
        `SELECT
           COUNT(*) as total_entries,
           SUM(amount) as total_amount,
           AVG(amount) as avg_amount,
           MAX(amount) as max_amount,
           MIN(amount) as min_amount,
           COALESCE(SUM(CASE WHEN source = 'AdSense' THEN amount ELSE 0 END), 0) as adsense_total,
           COALESCE(SUM(CASE WHEN source = 'Sponsorship' THEN amount ELSE 0 END), 0) as sponsorship_total,
           COALESCE(SUM(CASE WHEN source = 'Affiliate' THEN amount ELSE 0 END), 0) as affiliate_total,
           COALESCE(SUM(CASE WHEN source = 'Patreon' THEN amount ELSE 0 END), 0) as patreon_total
         FROM oc_revenue
         WHERE user_id = $1`,
        [req.user.id]
      );

      const expenseResult = await pool.query(
        `SELECT
           COUNT(*) as total_entries,
           SUM(amount) as total_amount,
           AVG(amount) as avg_amount,
           MAX(amount) as max_amount,
           MIN(amount) as min_amount,
           COALESCE(SUM(CASE WHEN category = 'Equipment' THEN amount ELSE 0 END), 0) as equipment_total,
           COALESCE(SUM(CASE WHEN category = 'Software' THEN amount ELSE 0 END), 0) as software_total,
           COALESCE(SUM(CASE WHEN tax_deductible = true THEN amount ELSE 0 END), 0) as tax_deductible_total
         FROM oc_expenses
         WHERE user_id = $1`,
        [req.user.id]
      );

      const revenue = revenueResult.rows[0];
      const expenses = expenseResult.rows[0];

      const netProfit = (parseFloat(revenue.total_amount) || 0) - (parseFloat(expenses.total_amount) || 0);

      res.json({
        revenue,
        expenses,
        summary: {
          total_revenue: revenue.total_amount,
          total_expenses: expenses.total_amount,
          net_profit: netProfit,
          profit_margin: revenue.total_amount ? ((netProfit / parseFloat(revenue.total_amount)) * 100).toFixed(2) : 0
        }
      });
    } catch (error) {
      console.error('Error calculating finance summary:', error);
      res.status(500).json({ error: error.message });
    }
  });

  return { revenueRouter, expenseRouter, financeRouter };
};
