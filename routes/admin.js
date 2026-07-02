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

router.post('/whatsapp-stop', authMiddleware, async (req, res) => {
  try {
    await whatsapp.stopWhatsApp();
    res.json({ success: true, status: 'disconnected' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/whatsapp-start', authMiddleware, async (req, res) => {
  try {
    await whatsapp.initWhatsApp();
    res.json({ success: true, status: 'starting' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/whatsapp-reset', authMiddleware, async (req, res) => {
  try {
    await whatsapp.resetSession();
    res.json({ success: true, status: 'reset' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/whatsapp-pair', authMiddleware, async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'Número de teléfono requerido' });
    const code = await whatsapp.generatePairingCode(phone);
    res.json({ success: true, code });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/whatsapp-messages', authMiddleware, (req, res) => {
  try {
    const messages = whatsapp.getMessages();
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/whatsapp-conversations', authMiddleware, (req, res) => {
  try {
    const convs = whatsapp.getConversations();
    res.json(convs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/whatsapp-conversation/:number', authMiddleware, (req, res) => {
  try {
    const msgs = whatsapp.getConversationMessages(req.params.number);
    res.json(msgs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/whatsapp-conversation/:number/read', authMiddleware, (req, res) => {
  try {
    whatsapp.markConversationRead(req.params.number);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/whatsapp-conversation/:number/unread', authMiddleware, (req, res) => {
  try {
    whatsapp.markConversationUnread(req.params.number);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/whatsapp-conversation/:number', authMiddleware, async (req, res) => {
  try {
    await whatsapp.deleteConversation(req.params.number);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ── Clients ────────────────────────────────────────────── */
router.get('/clients', authMiddleware, (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM clients ORDER BY created_at DESC').all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/clients', authMiddleware, (req, res) => {
  try {
    const { phone, name, address, email, notes } = req.body;
    const existing = db.prepare('SELECT * FROM clients WHERE phone = ?').get(phone);
    if (existing) {
      return res.status(400).json({ error: 'Ya existe un cliente con ese teléfono' });
    }
    const count = db.prepare('SELECT COUNT(*) as c FROM clients').get().c;
    const client_number = `CLI-${String(count + 1).padStart(3, '0')}`;
    const result = db.prepare(
      'INSERT INTO clients (client_number, phone, name, address, email, notes) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(client_number, phone, name || '', address || '', email || '', notes || '');
    res.json({ success: true, id: result.lastInsertRowid, client_number });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/clients/:id', authMiddleware, (req, res) => {
  try {
    const { name, address, email, notes } = req.body;
    db.prepare(
      'UPDATE clients SET name=?, address=?, email=?, notes=?, updated_at=datetime(\'now\') WHERE id=?'
    ).run(name || '', address || '', email || '', notes || '', req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/clients/:id', authMiddleware, (req, res) => {
  try {
    db.prepare('DELETE FROM clients WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/clients/export', authMiddleware, (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM clients ORDER BY name ASC').all();
    let vcard = '';
    rows.forEach(c => {
      vcard += `BEGIN:VCARD\nVERSION:3.0\nFN:${c.name || c.phone}\nTEL:${c.phone}\n`;
      if (c.email) vcard += `EMAIL:${c.email}\n`;
      if (c.address) vcard += `ADR:;;${c.address};;;\n`;
      vcard += `NOTE:${c.client_number}${c.notes ? ' - ' + c.notes : ''}\nEND:VCARD\n`;
    });
    res.setHeader('Content-Type', 'text/vcard');
    res.setHeader('Content-Disposition', 'attachment; filename=clientes.vcf');
    res.send(vcard);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/clients/by-phone/:phone', authMiddleware, (req, res) => {
  try {
    const client = db.prepare('SELECT * FROM clients WHERE phone = ?').get(req.params.phone);
    res.json(client || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ── Role middleware ─────────────────────────────────────── */
function roleMiddleware(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Permiso denegado' });
    next();
  };
}

/* ── Products CRUD ──────────────────────────────────────── */
router.get('/products', authMiddleware, (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM products ORDER BY created_at DESC').all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/products', authMiddleware, roleMiddleware('master', 'stock'), (req, res) => {
  try {
    const { name, description, price, stock, category, image_url } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'El nombre es obligatorio' });
    const result = db.prepare(
      'INSERT INTO products (name, description, price, stock, category, image_url) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(name.trim(), description || '', price || 0, stock || 0, category || '', image_url || '');
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/products/:id', authMiddleware, roleMiddleware('master', 'stock'), (req, res) => {
  try {
    const { name, description, price, stock, category, image_url, enabled } = req.body;
    db.prepare(
      `UPDATE products SET name=?, description=?, price=?, stock=?, category=?, image_url=?, enabled=?, updated_at=datetime('now') WHERE id=?`
    ).run(name || '', description || '', price || 0, stock || 0, category || '', image_url || '', enabled !== undefined ? (enabled ? 1 : 0) : 1, req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/products/:id', authMiddleware, roleMiddleware('master', 'stock'), (req, res) => {
  try {
    db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ── Users CRUD (master only) ───────────────────────────── */
router.get('/users', authMiddleware, roleMiddleware('master'), (req, res) => {
  try {
    const rows = db.prepare('SELECT id, username, role, created_at FROM users ORDER BY created_at ASC').all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/users', authMiddleware, roleMiddleware('master'), (req, res) => {
  try {
    const { username, password, role } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
    if (!['master', 'stock', 'response'].includes(role)) return res.status(400).json({ error: 'Rol inválido' });
    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existing) return res.status(400).json({ error: 'El usuario ya existe' });
    const hash = bcrypt.hashSync(password, 10);
    const result = db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)').run(username, hash, role);
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/users/:id', authMiddleware, roleMiddleware('master'), (req, res) => {
  try {
    const { username, password, role } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    if (role && !['master', 'stock', 'response'].includes(role)) return res.status(400).json({ error: 'Rol inválido' });
    let sql = 'UPDATE users SET ';
    const params = [];
    if (username) { sql += 'username=?,'; params.push(username); }
    if (password) { sql += 'password_hash=?,'; params.push(bcrypt.hashSync(password, 10)); }
    if (role) { sql += 'role=?,'; params.push(role); }
    sql = sql.slice(0, -1) + " WHERE id=?";
    params.push(req.params.id);
    db.prepare(sql).run(...params);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/users/:id', authMiddleware, roleMiddleware('master'), (req, res) => {
  try {
    const target = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    if (!target) return res.status(404).json({ error: 'Usuario no encontrado' });
    if (target.id === req.user.id) return res.status(400).json({ error: 'No puedes eliminarte a ti mismo' });
    db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ── Menu options CRUD ─────────────────────────────────── */
router.get('/menu-options', authMiddleware, (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM menu_options ORDER BY parent_key, sort_order ASC').all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/menu-options', authMiddleware, (req, res) => {
  try {
    const { parent_key, sort_order, trigger_key, icon, label, response_type, response_text, enabled } = req.body;
    if (!trigger_key || !label) return res.status(400).json({ error: 'trigger_key y label son obligatorios' });
    const result = db.prepare(
      'INSERT INTO menu_options (parent_key, sort_order, trigger_key, icon, label, response_type, response_text, enabled) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(parent_key || '', sort_order || 0, trigger_key, icon || '', label, response_type || 'text', response_text || '', enabled !== undefined ? (enabled ? 1 : 0) : 1);
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/menu-options/:id', authMiddleware, (req, res) => {
  try {
    const { parent_key, sort_order, trigger_key, icon, label, response_type, response_text, enabled } = req.body;
    db.prepare(
      "UPDATE menu_options SET parent_key=?, sort_order=?, trigger_key=?, icon=?, label=?, response_type=?, response_text=?, enabled=? WHERE id=?"
    ).run(parent_key || '', sort_order || 0, trigger_key || '', icon || '', label || '', response_type || 'text', response_text || '', enabled !== undefined ? (enabled ? 1 : 0) : 1, req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/menu-options/:id', authMiddleware, (req, res) => {
  try {
    db.prepare('DELETE FROM menu_options WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ── Page content CRUD (web front editor) ───────────────── */
router.get('/page-content', authMiddleware, (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM page_content ORDER BY section_key, sort_order ASC').all();
    const parsed = rows.map(r => ({ ...r, content: JSON.parse(r.content) }));
    res.json(parsed);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/page-content/:id', authMiddleware, (req, res) => {
  try {
    const { content } = req.body;
    const contentStr = JSON.stringify(content);
    const info = db.prepare('UPDATE page_content SET content = ?, updated_at = datetime(\'now\') WHERE id = ?').run(contentStr, req.params.id);
    console.log('[page-content] PUT id=%s changes=%d', req.params.id, info.changes);
    if (info.changes === 0) return res.status(404).json({ error: 'id not found' });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/page-content/:id/reorder', authMiddleware, (req, res) => {
  try {
    const { sort_order } = req.body;
    db.prepare('UPDATE page_content SET sort_order = ?, updated_at = datetime(\'now\') WHERE id = ?').run(sort_order, req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/page-content/reset', authMiddleware, (req, res) => {
  try {
    db.prepare("UPDATE page_content SET content = '{}', updated_at = datetime('now') WHERE section_key = ? AND item_key = ?").run(req.body.section_key, req.body.item_key);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* ── Send WhatsApp message (response role) ──────────────── */
router.post('/whatsapp-send', authMiddleware, roleMiddleware('master', 'response'), async (req, res) => {
  try {
    const { number, message } = req.body;
    if (!number || !message) return res.status(400).json({ error: 'Número y mensaje requeridos' });
    await whatsapp.sendMessage(number, message);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
