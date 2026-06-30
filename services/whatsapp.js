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
    case '1': {
      const products = db.prepare("SELECT name, price, stock FROM products WHERE enabled = 1 ORDER BY name ASC").all();
      if (products.length === 0) return '📋 *Catálogo*\n\nNo hay productos disponibles en este momento.';
      let msg = '📋 *Catálogo de productos*\n\n';
      products.forEach((p, i) => {
        msg += `${i + 1}. *${p.name}*`;
        if (p.price > 0) msg += ` — $${p.price.toFixed(2)}`;
        msg += `\n   Stock: ${p.stock > 0 ? '✅ Disponible' : '❌ Sin stock'}\n`;
      });
      msg += '\nRespondé con el nombre del producto para más info o escribí *menu* para volver.';
      return msg;
    }
    case '2':
      return '🛒 *Comprar*\n\nPara realizar una compra:\n1. Elegí el producto del catálogo\n2. Consultá disponibilidad\n3. Coordinamos entrega\n\nEscribí el nombre del producto que buscas.';
    case '3': {
      const products = db.prepare("SELECT name, price, stock FROM products WHERE enabled = 1 ORDER BY name ASC").all();
      if (products.length === 0) return '💰 *Precios*\n\nNo hay productos disponibles en este momento.';
      let msg = '💰 *Lista de precios*\n\n';
      products.forEach(p => {
        msg += `• *${p.name}*: $${p.price.toFixed(2)} — ${p.stock > 0 ? '✅' : '❌ Sin stock'}\n`;
      });
      msg += '\nRespondé con el nombre del producto que te interese.';
      return msg;
    }
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

      const existing = db.prepare('SELECT id FROM clients WHERE phone = ?').get(userNumber);
      if (!existing) {
        const count = db.prepare('SELECT COUNT(*) as c FROM clients').get().c;
        const client_number = `CLI-${String(count + 1).padStart(3, '0')}`;
        db.prepare(
          'INSERT OR IGNORE INTO clients (client_number, phone, name) VALUES (?, ?, ?)'
        ).run(client_number, userNumber, userNumber);
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
      SELECT w.number, 
             COUNT(*) as total,
             SUM(CASE WHEN w.is_read = 0 THEN 1 ELSE 0 END) as unread,
             MAX(w.created_at) as last_date,
             (SELECT message FROM whatsapp_messages WHERE number = w.number ORDER BY created_at DESC LIMIT 1) as last_message,
             (SELECT response FROM whatsapp_messages WHERE number = w.number ORDER BY created_at DESC LIMIT 1) as last_response,
             COALESCE(c.name, '') as client_name,
             COALESCE(c.client_number, '') as client_number
      FROM whatsapp_messages w
      LEFT JOIN clients c ON c.phone = w.number
      GROUP BY w.number
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

async function sendMessage(number, text) {
  if (!client) throw new Error('WhatsApp no conectado');
  const chatId = number.includes('@c.us') ? number : `${number}@c.us`;
  try {
    const chat = await client.getChatById(chatId);
    await chat.sendMessage(text);
    db.prepare('INSERT INTO whatsapp_messages (number, message, response) VALUES (?, ?, ?)').run(number, '', text);
  } catch (e) {
    await client.sendMessage(chatId, text);
    db.prepare('INSERT INTO whatsapp_messages (number, message, response) VALUES (?, ?, ?)').run(number, '', text);
  }
}

async function stopWhatsApp() {
  if (client) {
    try { await client.destroy(); } catch {}
    client = null;
  }
  status = 'disconnected';
  qrCode = null;
  console.log('🛑 WhatsApp detenido');
}

async function deleteConversation(number) {
  try {
    db.prepare('DELETE FROM whatsapp_messages WHERE number = ?').run(number);
    if (client) {
      try {
        const chatId = number.includes('@c.us') ? number : `${number}@c.us`;
        const chat = await client.getChatById(chatId);
        await chat.delete();
        console.log(`  🗑 Conversación eliminada de WhatsApp: ${number}`);
      } catch (e) {
        console.log(`  ↪ No se pudo eliminar de WhatsApp (chat no encontrado): ${number}`);
      }
    }
    return true;
  } catch (err) {
    console.error('Error deleting conversation:', err.message);
    return false;
  }
}

module.exports = { initWhatsApp, stopWhatsApp, getStatus, getMessages, getConversations, getConversationMessages, markConversationRead, markConversationUnread, sendMessage, deleteConversation };
