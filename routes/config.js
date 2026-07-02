const express = require('express');
const db = require('../database/db');

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const rows = db.prepare('SELECT config_key, config_value FROM config').all();
    const config = {};
    rows.forEach(r => { config[r.config_key] = r.config_value; });
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/', (req, res) => {
  try {
    const updates = req.body;
    const stmt = db.prepare('UPDATE config SET config_value = ?, updated_at = datetime(\'now\') WHERE config_key = ?');
    const txn = db.transaction(() => {
      for (const [key, value] of Object.entries(updates)) {
        stmt.run(value, key);
      }
    });
    txn();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
