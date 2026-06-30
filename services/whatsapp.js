const { Client, LocalAuth } = require('whatsapp-web.js');
const db = require('../database/db');
const { execSync } = require('child_process');

let client = null;
let qrCode = null;
let status = 'disconnected';

const MENU = `👋 *Hola! Soy el contestador automático de Leo*

Elegí una opción:

1️⃣ *Catálogo de productos*
2️⃣ *Comprar*
3️⃣ *Consultar precio*
4️⃣ *Hablar con un asesor*
5️⃣ *Sucursales*
0️⃣ *Menu principal*

Respondé con el número de la opción que te interese.`;

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

function getMenuResponse(option) {
  const opt = option.replace(/[^0-9]/g, '');
  switch (opt) {
    case '1':
      return '📋 *Catálogo*\n\nPodés ver nuestros productos en:\nhttps://electronica-store.example.com/catalogo\n\nO envianos "comprar" para mas opciones.';
    case '2':
      return '🛒 *Comprar*\n\nPara realizar una compra:\n1. Elegí el producto del catálogo\n2. Consultá disponibilidad\n3. Coordinamos entrega\n\nEscribí el nombre del producto que buscas.';
    case '3':
      return '💰 *Consultar precio*\n\nDecime qué producto te interesa y te paso el precio actualizado.';
    case '4':
      return '👤 *Hablar con un asesor*\n\nDejanos tu consulta y en breve te responderemos.';
    case '5':
      return '📍 *Sucursales*\n\nAv. Siempre Viva 123, Centro\nLun a Vie 9:00-18:00\nSáb 9:00-13:00';
    default:
      return MENU;
  }
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
      const userQuery = (msg.body || '').trim().toLowerCase();

      console.log(`  📩 [${source}] WhatsApp msg de ${userNumber}: "${userQuery.substring(0, 60)}"`);

      if (!userQuery) {
        console.log('  ↪ ignorado (mensaje vacío)');
        return;
      }

      let response;
      if (/^[0-9]+$/.test(userQuery)) {
        response = getMenuResponse(userQuery);
      } else if (userQuery === 'menu' || userQuery === 'hola' || userQuery === 'buenas' || userQuery.includes('menu')) {
        response = MENU;
      } else {
        response = `🤖 *Contestador automático de Leo*

Gracias por tu consulta. Un asesor te responderá a la brevedad.

Mientras tanto, escribí *menu* para ver las opciones disponibles.`;
      }

      await msg.reply(response);
      console.log(`  ✅ Respondido a ${userNumber}: "${response.substring(0, 60)}..."`);

      try {
        const chat = await msg.getChat();
        await chat.markUnread();
      } catch (e) {
        /* si falla marcar como no leido, no es critico */
      }

      db.prepare(
        'INSERT INTO whatsapp_messages (number, message, response) VALUES (?, ?, ?)'
      ).run(userNumber, userQuery, response);
    } catch (err) {
      console.error(`  ❌ Error en [${source}]:`, err.message);
    }
  };

  client.on('message', msg => handleMessage(msg, 'message'));

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

function getConversations() {
  try {
    return db.prepare(`
      SELECT number, 
             COUNT(*) as total,
             SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) as unread,
             MAX(created_at) as last_date,
             (SELECT message FROM whatsapp_messages WHERE number = w.number ORDER BY created_at DESC LIMIT 1) as last_message,
             (SELECT response FROM whatsapp_messages WHERE number = w.number ORDER BY created_at DESC LIMIT 1) as last_response
      FROM whatsapp_messages w
      GROUP BY number
      ORDER BY last_date DESC
    `).all();
  } catch (err) {
    console.error('Error getting conversations:', err.message);
    return [];
  }
}

function getConversationMessages(number) {
  try {
    return db.prepare(
      'SELECT * FROM whatsapp_messages WHERE number = ? ORDER BY created_at ASC'
    ).all(number);
  } catch (err) {
    console.error('Error getting conversation:', err.message);
    return [];
  }
}

function markConversationRead(number) {
  try {
    db.prepare('UPDATE whatsapp_messages SET is_read = 1 WHERE number = ?').run(number);
    return true;
  } catch { return false; }
}

function markConversationUnread(number) {
  try {
    db.prepare('UPDATE whatsapp_messages SET is_read = 0 WHERE number = ?').run(number);
    return true;
  } catch { return false; }
}

module.exports = { initWhatsApp, getStatus, getMessages, getConversations, getConversationMessages, markConversationRead, markConversationUnread };
