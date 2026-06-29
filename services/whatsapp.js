const { Client, LocalAuth } = require('whatsapp-web.js');
const db = require('../database/db');
const rag = require('./rag');
const { execSync } = require('child_process');

let client = null;
let qrCode = null;
let status = 'disconnected';

function findChrome() {
  const candidates = [
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/snap/bin/chromium',
  ];
  for (const p of candidates) {
    try { execSync(`test -x ${p}`); return p; } catch {}
  }
  return null;
}

async function initWhatsApp() {
  const chromePath = findChrome();
  const puppeteerOpts = {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  };
  if (chromePath) puppeteerOpts.executablePath = chromePath;

  client = new Client({
    authStrategy: new LocalAuth({ clientId: 'webmerge-bot' }),
    puppeteer: puppeteerOpts,
  });

  client.on('qr', qr => {
    qrCode = qr;
    status = 'qr_ready';
    console.log('📱 WhatsApp QR ready — escanea con tu teléfono');
  });

  client.on('ready', () => {
    status = 'connected';
    qrCode = null;
    console.log('✅ WhatsApp conectado');
  });

  client.on('disconnected', reason => {
    status = 'disconnected';
    qrCode = null;
    console.log('❌ WhatsApp desconectado:', reason);
  });

  client.on('message', async msg => {
    if (msg.from.endsWith('@g.us')) return;
    if (msg.type !== 'chat' && msg.type !== 'extended_text') return;

    const userNumber = msg.from.replace('@c.us', '');
    const userQuery = msg.body;

    const { found, answer } = rag.getAnswer(userQuery);
    const response = found
      ? answer
      : 'Lo siento, no encontré información sobre eso. Escríbeme con otras palabras o consulta nuestra web.';

    await msg.reply(response);

    db.prepare(
      'INSERT INTO whatsapp_messages (number, message, response) VALUES (?, ?, ?)'
    ).run(userNumber, userQuery, response);
  });

  client.on('auth_failure', () => {
    status = 'auth_failure';
    console.error('❌ WhatsApp auth failure');
  });

  try {
    await client.initialize();
  } catch (err) {
    console.error('WhatsApp init error:', err.message);
    status = 'error';
  }
}

function getStatus() {
  return { status, qrCode: status === 'qr_ready' ? qrCode : null };
}

function getMessages(limit = 50) {
  return db.prepare(
    'SELECT * FROM whatsapp_messages ORDER BY created_at DESC LIMIT ?'
  ).all(limit);
}

module.exports = { initWhatsApp, getStatus, getMessages };
