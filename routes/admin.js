const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../database/db');
const configData = require('../config/config');
const whatsapp = require('../services/whatsapp');

const router = express.Router();

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'No autorizado' });
  try {
    const token = header.replace('Bearer ', '');
    req.user = jwt.verify(token, configData.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido' });
  }
}

router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    const match = bcrypt.compareSync(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      configData.JWT_SECRET,
      { expiresIn: '24h' }
    );
    res.json({ token, user: { username: user.username, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/verify', authMiddleware, (req, res) => {
  res.json({ valid: true, user: req.user });
});

router.get('/config', authMiddleware, (req, res) => {
  try {
    const rows = db.prepare('SELECT config_key, config_value FROM config').all();
    const config = {};
    rows.forEach(r => { config[r.config_key] = r.config_value; });
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/faqs', authMiddleware, (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM faqs ORDER BY created_at DESC').all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/faqs', authMiddleware, (req, res) => {
  try {
    const { category, question, answer, keywords } = req.body;
    const result = db.prepare(
      'INSERT INTO faqs (category, question, answer, keywords) VALUES (?, ?, ?, ?)'
    ).run(category, question, answer, keywords);
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/faqs/:id', authMiddleware, (req, res) => {
  try {
    const { category, question, answer, keywords, enabled } = req.body;
    db.prepare(
      'UPDATE faqs SET category=?, question=?, answer=?, keywords=?, enabled=?, updated_at=datetime(\'now\') WHERE id=?'
    ).run(category, question, answer, keywords, enabled, req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/faqs/:id', authMiddleware, (req, res) => {
  try {
    db.prepare('DELETE FROM faqs WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/contacts', authMiddleware, (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM contacts ORDER BY created_at DESC').all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/contacts/:id/read', authMiddleware, (req, res) => {
  try {
    db.prepare('UPDATE contacts SET is_read = 1 WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/whatsapp-status', authMiddleware, (req, res) => {
  res.json(whatsapp.getStatus());
});

router.get('/whatsapp-messages', authMiddleware, (req, res) => {
  try {
    const messages = whatsapp.getMessages();
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
