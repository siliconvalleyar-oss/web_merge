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
    console.log('  📬 Esperando mensajes...');
    console.log('  💡 Enviá un mensaje al número vinculado para probar');
  });

  client.on('disconnected', reason => {
    status = 'disconnected';
    qrCode = null;
    console.log('❌ WhatsApp desconectado:', reason);
  });

  const handleMessage = async (msg, source) => {
    try {
      if (msg.from.endsWith('@g.us')) {
        console.log(`  ↪ [${source}] ignorado (grupo):`, msg.from);
        return;
      }

      const rawFrom = msg.from || '';
      const userNumber = rawFrom.replace(/@c\.us$/, '');
      const userQuery = (msg.body || '').trim();

      console.log(`  📩 [${source}] WhatsApp msg de ${userNumber}: "${userQuery.substring(0, 60)}"`);

      if (!userQuery) {
        console.log('  ↪ ignorado (mensaje vacío)');
        return;
      }

      const { found, answer } = rag.getAnswer(userQuery);
      let response;
      if (found && answer) {
        response = answer;
      } else {
        response = '🤖 Hola, soy el bot de WebMerge Studio.\n\nNo encontré información específica sobre tu consulta. ¿Podés reformularla o escribirme con otras palabras?\n\nTambién podés consultar nuestra web: https://webmerge.studio';
      }

      await msg.reply(response);
      console.log(`  ✅ Respondido a ${userNumber}: "${response.substring(0, 60)}..."`);

      db.prepare(
        'INSERT INTO whatsapp_messages (number, message, response) VALUES (?, ?, ?)'
      ).run(userNumber, userQuery, response);
    } catch (err) {
      console.error(`  ❌ Error en [${source}]:`, err.message);
    }
  };

  client.on('message', msg => handleMessage(msg, 'message'));

  client.on('message_create', msg => {
    if (msg.fromMe) return;
    handleMessage(msg, 'message_create');
  });

  client.on('auth_failure', msg => {
    status = 'auth_failure';
    console.error('❌ WhatsApp auth failure:', msg);
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
  try {
    return db.prepare(
      'SELECT * FROM whatsapp_messages ORDER BY created_at DESC LIMIT ?'
    ).all(limit);
  } catch (err) {
    console.error('Error getting WhatsApp messages:', err.message);
    return [];
  }
}

module.exports = { initWhatsApp, getStatus, getMessages };
