const express = require('express');
const db = require('../database/db');

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const category = req.query.category || null;
    const search   = req.query.search || null;
    let sql = 'SELECT * FROM faqs WHERE enabled = 1';
    const params = [];

    if (category && category !== 'todas') {
      sql += ' AND category = ?';
      params.push(category);
    }
    if (search) {
      sql += ' AND (question LIKE ? OR answer LIKE ? OR keywords LIKE ?)';
      const q = `%${search}%`;
      params.push(q, q, q);
    }
    sql += ' ORDER BY created_at DESC';

    const rows = db.prepare(sql).all(...params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/categories', (req, res) => {
  try {
    const rows = db.prepare('SELECT DISTINCT category FROM faqs ORDER BY category').all();
    res.json(rows.map(r => r.category));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
