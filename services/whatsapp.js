const { Client, LocalAuth } = require('whatsapp-web.js');
const db = require('../database/db');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

let client = null;
let qrCode = null;
let status = 'disconnected';

const MENU = `👋 *Hola! Soy el contestador automático de Leo*

Elegí una opción con la *letra* correspondiente:

*A* ─ Servicios
*B* ─ Productos
*C* ─ Tienda
*D* ─ Link de compra
*E* ─ Más productos
*F* ─ Hablar con un asesor

Respondé con la *letra* de la opción que te interese.`;

const SUB_SERVICIOS = `🔧 *Servicios*

*AA* ─ Desarrollo web
*AB* ─ Diseño gráfico
*AC* ─ Marketing digital
*AD* ─ Soporte técnico
*AE* ─ Consultoría
*AF* ─ Volver al menú principal

Respondé con las *dos letras* de la opción (ej: AA).`;

const SUB_TIENDA = `🏪 *Tienda*

*CA* ─ Horarios de atención
*CB* ─ Ubicación
*CC* ─ Contacto directo
*CD* ─ Formas de pago
*CE* ─ Envíos
*CF* ─ Volver al menú principal

Respondé con las *dos letras* de la opción (ej: CA).`;

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
  const opt = option.trim().toLowerCase();

  // ── Main menu letters ──
  if (opt === 'a') return SUB_SERVICIOS;
  if (opt === 'b') {
    const products = db.prepare("SELECT name, price, stock, category FROM products WHERE enabled = 1 ORDER BY category, name ASC").all();
    if (products.length === 0) return '📋 *Productos*\n\nNo hay productos disponibles en este momento.';
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
    msg += '\nRespondé con la *letra* del producto para más detalles.';
    msg += '\nO escribí *menu* para volver.';
    return msg;
  }
  if (opt === 'c') return SUB_TIENDA;
  if (opt === 'd') {
    return `🛒 *Link de compra*

👉 *Tienda online:*\nhttps://webmerge.studio/tienda

📍 También podés visitarnos en:\nAv. Siempre Viva 123, Centro

Escribí *menu* para volver al inicio.`;
  }
  if (opt === 'e') {
    const products = db.prepare("SELECT name, price, stock FROM products WHERE enabled = 1 ORDER BY name ASC LIMIT 20").all();
    if (products.length === 0) return '📦 *Más productos*\n\nNo hay más productos disponibles.';
    let msg = '📦 *Más productos*\n\n';
    products.forEach((p, i) => {
      const letra = String.fromCharCode(97 + i);
      msg += `${letra}) *${p.name}* — $${p.price.toFixed(2)}\n`;
      msg += `   Stock: ${p.stock > 0 ? '✅' : '❌'}\n`;
    });
    msg += '\nRespondé con la *letra* del producto para más info.';
    msg += '\nO escribí *menu* para volver.';
    return msg;
  }
  if (opt === 'f') {
    return `👤 *Hablar con un asesor*

Dejanos tu consulta y en breve te responderemos.

Escribí *menu* para volver al inicio.`;
  }

  // ── Submenu: Servicios (a → letra) ──
  if (opt === 'aa' || opt === 'a.a' || opt === 'a 1') return '💻 *Desarrollo web*\n\nCreamos sitios web profesionales, tiendas online y aplicaciones web a medida.\n\nTecnologías: HTML, CSS, JavaScript, Node.js, React.\n\nEscribí *menu* para volver.';
  if (opt === 'ab' || opt === 'a.b' || opt === 'a 2') return '🎨 *Diseño gráfico*\n\nDiseñamos tu marca, logo, redes sociales y material publicitario.\n\nIncluye: identidad visual, branding, flyers.\n\nEscribí *menu* para volver.';
  if (opt === 'ac' || opt === 'a.c' || opt === 'a 3') return '📱 *Marketing digital*\n\nGestionamos redes sociales, campañas de publicidad y SEO para tu negocio.\n\nEscribí *menu* para volver.';
  if (opt === 'ad' || opt === 'a.d' || opt === 'a 4') return '🔧 *Soporte técnico*\n\nSoporte técnico informático, mantenimiento de sistemas y consultoría IT.\n\nEscribí *menu* para volver.';
  if (opt === 'ae' || opt === 'a.e' || opt === 'a 5') return '💡 *Consultoría*\n\nAsesoramiento personalizado para tu proyecto digital.\n\nEscribí *menu* para volver.';
  if (opt === 'af' || opt === 'a.f') return MENU;

  // ── Submenu: Tienda (c → letra) ──
  if (opt === 'ca' || opt === 'c.a' || opt === 'c 1') return '🕐 *Horarios*\n\nLunes a Viernes: 9:00 a 18:00\nSábados: 9:00 a 13:00\nDomingos: Cerrado\n\nEscribí *menu* para volver.';
  if (opt === 'cb' || opt === 'c.b' || opt === 'c 2') return '📍 *Ubicación*\n\nAv. Siempre Viva 123, Centro\n\n📌 Ver en Google Maps\n\nEscribí *menu* para volver.';
  if (opt === 'cc' || opt === 'c.c' || opt === 'c 3') return '📞 *Contacto*\n\nTeléfono: +54 11 5555-1234\nEmail: contacto@webmerge.studio\n\nEscribí *menu* para volver.';
  if (opt === 'cd' || opt === 'c.d' || opt === 'c 4') return '💳 *Formas de pago*\n\n• Efectivo\n• Transferencia bancaria\n• Mercado Pago\n• Tarjetas de crédito/débito\n\nEscribí *menu* para volver.';
  if (opt === 'ce' || opt === 'c.e' || opt === 'c 5') return '🚚 *Envíos*\n\n• Envío gratis en compras mayores a $5000\n• Entrega en 24/48 hs hábiles\n• Retiro en tienda sin cargo\n\nEscribí *menu* para volver.';
  if (opt === 'cf' || opt === 'c.f') return MENU;

  // ── Product detail by letter (from B or E sub-lists) ──
  if (/^[a-z]$/.test(opt)) {
    const idx = opt.charCodeAt(0) - 97;
    const products = db.prepare("SELECT * FROM products WHERE enabled = 1 ORDER BY category, name ASC").all();
    const p = products[idx];
    if (p) {
      return `📦 *${p.name}*

${p.description || 'Sin descripción'}

💰 *Precio:* $${p.price.toFixed(2)}
📦 *Stock:* ${p.stock > 0 ? '✅ Disponible (' + p.stock + ' uds.)' : '❌ Sin stock'}
${p.category ? '🏷️ *Categoría:* ' + p.category : ''}

Escribí *menu* para volver al inicio.`;
    }
  }

  // ── Fallback ──
  return `🤖 No entendí tu opción.

Escribí *menu* para ver las opciones disponibles.`;
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
      if (/^[0-9]+$/.test(userQuery) || /^[a-z]([. ][a-z0-9])?$/.test(userQuery)) {
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
    console.log('🔄 Sesión WhatsApp reseteada — escaneá el QR con otro número');
    return true;
  } catch (err) {
    console.error('Error resetting session:', err.message);
    return false;
  }
}

module.exports = { initWhatsApp, stopWhatsApp, getStatus, getMessages, getConversations, getConversationMessages, markConversationRead, markConversationUnread, sendMessage, deleteConversation, resetSession };
