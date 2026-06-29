const express = require('express');
const path = require('path');
const cors = require('cors');
const config = require('./config/config');
const whatsapp = require('./services/whatsapp');

const app = express();
const PORT = config.PORT;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/faqs',   require('./routes/faqs'));
app.use('/api/config', require('./routes/config'));
app.use('/api/contact',require('./routes/contact'));
app.use('/api/chat',   require('./routes/chat'));
app.use('/api/admin',  require('./routes/admin'));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n  ⚡ WebMerge Studio v4 — http://localhost:${PORT}\n`);
  console.log('  Iniciando WhatsApp...');
  whatsapp.initWhatsApp();
});
