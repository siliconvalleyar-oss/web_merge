const express = require('express');
const db = require('../database/db');

const router = express.Router();

router.post('/', (req, res) => {
  try {
    const { name, email, message } = req.body;
    console.log('  📝 Contact form:', { name, email, message });
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }
    db.prepare('INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)').run(name, email, message);
    res.json({ success: true, message: 'Mensaje enviado correctamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
