const express = require('express');
const rag = require('../services/rag');

const router = express.Router();

router.post('/', (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Mensaje requerido' });
    }
    const result = rag.getAnswer(message);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
