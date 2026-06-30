const { Client, LocalAuth } = require('whatsapp-web.js');
const db = require('../database/db');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

let client = null;
let qrCode = null;
let pairingCode = null;
let status = 'disconnected';

/* ── Build menu from DB ─────────────────────────────── */
function buildMenu(parentKey) {
  const items = db.prepare(
    'SELECT * FROM menu_options WHERE parent_key = ? AND enabled = 1 ORDER BY sort_order ASC'
  ).all(parentKey || '');

  if (items.length === 0) return null;

  let msg = '';
  items.forEach((item, i) => {
    const icon = item.icon || '';
    const trigger = item.trigger_key;
    msg += `\n*${trigger}* ${icon ? icon + ' ' : ''}─ ${item.label}`;
  });
  msg += '\n\nRespondé con el *código* de la opción que te interese.';

  // Get parent's label for a nicer title
  let title = 'Menú';
  if (parentKey) {
    const parent = db.prepare('SELECT label, icon FROM menu_options WHERE trigger_key = ? AND parent_key = \'\'').get(parentKey);
    if (parent) title = `${parent.icon || ''} ${parent.label}`.trim();
  } else {
    const config = db.prepare("SELECT config_value FROM config WHERE config_key = 'chatbot_name'").get();
    const botName = config ? config.config_value : 'WebBot';
    title = `👋 *Hola! Soy el contestador automático de ${botName}*`;
  }
  return `${title}\n\nElegí una opción con el *código* correspondiente:\n${msg}`;
}

function getMenuResponse(option) {
  let opt = option.trim().toLowerCase();
  // Normalize: "a.a" → "aa", "a 1" → "aa" (1→a, 2→b, etc.)
  opt = opt.replace(/[. ]([a-z])/g, (m, c) => c);
  opt = opt.replace(/[. ](\d)/g, (m, d) => String.fromCharCode(96 + parseInt(d)));
  opt = opt.replace(/[. ]/g, '');

  // Look up the triggered item in DB
  const item = db.prepare(
    'SELECT * FROM menu_options WHERE trigger_key = ? AND enabled = 1'
  ).get(opt);

  if (!item) {
    // Fallback: try to find a product by letter index
    if (/^[a-z]$/.test(opt)) {
      const idx = opt.charCodeAt(0) - 97;
      const products = db.prepare("SELECT * FROM products WHERE enabled = 1 ORDER BY category, name ASC").all();
      const p = products[idx];
      if (p) {
        return `📦 *${p.name}*\n\n${p.description || 'Sin descripción'}\n\n💰 *Precio:* $${p.price.toFixed(2)}\n📦 *Stock:* ${p.stock > 0 ? '✅ Disponible (' + p.stock + ' uds.)' : '❌ Sin stock'}${p.category ? '\n🏷️ *Categoría:* ' + p.category : ''}\n\nEscribí *menu* para volver al inicio.`;
      }
    }
    return `🤖 No entendí tu opción.\n\nEscribí *menu* para ver las opciones disponibles.`;
  }

  switch (item.response_type) {
    case 'submenu': {
      const sub = buildMenu(item.trigger_key);
      return sub || item.response_text || 'Sin contenido.';
    }
    case 'product_list': {
      const products = db.prepare("SELECT name, price, stock, category FROM products WHERE enabled = 1 ORDER BY category, name ASC").all();
      if (products.length === 0) return '📋 No hay productos disponibles en este momento.';
      let msg = '📋 *Productos disponibles*\n\n';
      let lastCat = '';
      products.forEach((p, i) => {
        if (p.category && p.category !== lastCat) {
          msg += `\n▸ *${p.category}*\n`;
          lastCat = p.category;
        }
        const letra = String.fromCharCode(97 + i);
        msg += `${letra}) ${p.name} — $${p.price.toFixed(2)} ${p.stock > 0 ? '✅' : '❌'}\n`;
      });
      msg += '\nRespondé con la *letra* del producto para más detalles.\nO escribí *menu* para volver.';
      return msg;
    }
    case 'back':
      // Go up one level: if parent_key is 'a' or 'c', show main menu; otherwise main menu
      if (item.parent_key) {
        const parentMenu = buildMenu('');
        return parentMenu || buildMenu('');
      }
      return buildMenu('');
    case 'text':
    default:
      return item.response_text || 'Sin contenido.';
  }
}

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
  // Kill any stale Chrome processes using our session dir
  try {
    const stalePids = require('child_process').execSync(
      "ps aux | grep 'chrome.*session-webmerge' | grep -v grep | awk '{print $2}'",
      { encoding: 'utf-8' }
    ).trim().split('\n').filter(Boolean);
    if (stalePids.length > 0) {
      console.log(`  🧹 Limpiando ${stalePids.length} proceso(s) Chrome de sesión anterior...`);
      stalePids.forEach(pid => {
        try { process.kill(parseInt(pid)); } catch {}
      });
      await new Promise(r => setTimeout(r, 2000));
    }
  } catch {} // ps aux may fail in some environments

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
    pairingCode = null;
    status = 'qr_ready';
    console.log('📱 WhatsApp QR ready — escanea con tu teléfono');
  });

  client.on('ready', () => {
    status = 'connected';
    qrCode = null;
    pairingCode = null;
    console.log('✅ WhatsApp conectado');
    console.log('  📬 Esperando mensajes...');
  });

  client.on('disconnected', reason => {
    status = 'disconnected';
    qrCode = null;
    console.log('❌ WhatsApp desconectado:', reason);
  });

  const botName = (() => {
    try { const r = db.prepare("SELECT config_value FROM config WHERE config_key = 'chatbot_name'").get(); return r ? r.config_value : 'WebBot'; } catch { return 'WebBot'; }
  })();

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
      if (/^[0-9]+$/.test(userQuery) || /^[a-z]([. ][a-z0-9])?$/.test(userQuery)) {
        response = getMenuResponse(userQuery);
      } else if (userQuery === 'menu' || userQuery === 'hola' || userQuery === 'buenas' || userQuery.includes('menu')) {
        response = buildMenu('');
      } else {
        response = `🤖 *${botName}*

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
  return { status, qrCode: status === 'qr_ready' ? qrCode : null, pairingCode: status === 'qr_ready' ? pairingCode : null };
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

async function resetSession() {
  try {
    if (client) {
      try { await client.destroy(); } catch {}
      client = null;
    }
    const sessionDir = path.join(__dirname, '..', '.wwebjs_auth', 'session-webmerge-bot');
    if (fs.existsSync(sessionDir)) {
      fs.rmSync(sessionDir, { recursive: true, force: true });
      console.log('  🗑 Sesión WhatsApp eliminada');
    }
    status = 'disconnected';
    qrCode = null;
    pairingCode = null;
    console.log('🔄 Sesión WhatsApp reseteada — escaneá el QR con otro número');
    return true;
  } catch (err) {
    console.error('Error resetting session:', err.message);
    return false;
  }
}

async function generatePairingCode(phoneNumber) {
  try {
    if (!client) {
      throw new Error('WhatsApp cliente no iniciado. Primero conectá.');
    }
    // Clean the phone number: remove +, spaces, dashes
    const cleanNumber = phoneNumber.replace(/[+\-\s]/g, '');
    const code = await client.generatePairingCode(cleanNumber);
    pairingCode = code;
    console.log(`🔗 Código de vinculación generado para ${cleanNumber}: ${code}`);
    return code;
  } catch (err) {
    console.error('Error generating pairing code:', err.message);
    throw err;
  }
}

module.exports = { initWhatsApp, stopWhatsApp, getStatus, getMessages, getConversations, getConversationMessages, markConversationRead, markConversationUnread, sendMessage, deleteConversation, resetSession, generatePairingCode };
