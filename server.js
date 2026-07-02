const express = require('express');
const path = require('path');
const cors = require('cors');
const config = require('./config/config');
const db = require('./database/db');
const whatsapp = require('./services/whatsapp');

try { db.exec('ALTER TABLE whatsapp_messages ADD COLUMN is_read INTEGER DEFAULT 0'); } catch (e) {
  if (!e.message.includes('duplicate column')) console.error('Migration is_read:', e.message);
}

db.exec(`
  CREATE TABLE IF NOT EXISTS clients (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    client_number TEXT UNIQUE NOT NULL,
    phone         TEXT UNIQUE NOT NULL,
    name          TEXT DEFAULT '',
    address       TEXT DEFAULT '',
    email         TEXT DEFAULT '',
    notes         TEXT DEFAULT '',
    created_at    TEXT DEFAULT (datetime('now')),
    updated_at    TEXT DEFAULT (datetime('now'))
  )
`);
try { db.exec("ALTER TABLE clients ADD COLUMN email TEXT DEFAULT ''"); } catch (e) {
  if (!e.message.includes('duplicate column')) {}
}
try { db.exec("ALTER TABLE clients ADD COLUMN notes TEXT DEFAULT ''"); } catch (e) {
  if (!e.message.includes('duplicate column')) {}
}

db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    description TEXT DEFAULT '',
    price       REAL DEFAULT 0,
    stock       INTEGER DEFAULT 0,
    category    TEXT DEFAULT '',
    image_url   TEXT DEFAULT '',
    enabled     INTEGER DEFAULT 1,
    created_at  TEXT DEFAULT (datetime('now')),
    updated_at  TEXT DEFAULT (datetime('now'))
  )
`);

try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users_new (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      username      TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role          TEXT NOT NULL DEFAULT 'response' CHECK(role IN ('master','stock','response')),
      created_at    TEXT DEFAULT (datetime('now'))
    )
  `);
  const oldCount = db.prepare("SELECT COUNT(*) as c FROM users").get().c;
  db.exec("INSERT OR IGNORE INTO users_new (id, username, password_hash, role, created_at) SELECT id, username, password_hash, CASE WHEN role='admin' THEN 'master' ELSE 'response' END, created_at FROM users");
  const newCount = db.prepare("SELECT COUNT(*) as c FROM users_new").get().c;
  if (newCount >= oldCount) {
    db.exec("DROP TABLE users");
    db.exec("ALTER TABLE users_new RENAME TO users");
  }
} catch (e) {
  if (!e.message.includes('no such table')) console.error('Migration users:', e.message);
}

const masterExists = db.prepare("SELECT id FROM users WHERE role = 'master'").get();
if (!masterExists) {
  const bcrypt = require('bcrypt');
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare("INSERT OR IGNORE INTO users (username, password_hash, role) VALUES (?, ?, ?)").run('master', hash, 'master');
}

const adminConfigDefaults = [
  ['admin_bg',      '#0a0a14'],
  ['admin_sidebar', '#141425'],
  ['admin_accent',  '#6c5ce7'],
  ['admin_text',    '#e8e8f0'],
  ['admin_border',  '#2d2d44'],
  ['admin_surface', '#1a1a2e'],
  ['carousel_overlay_opacity', '0.5'],
  ['mascot_enabled',  '1'],
  ['mascot_file',     'simbol_git.svg'],
  ['mascot_pos_x',    '20'],
  ['mascot_pos_y',    '60'],
  ['mascot_size',     '80'],
];
const insertConfig = db.prepare('INSERT OR IGNORE INTO config (config_key, config_value) VALUES (?, ?)');
for (const [k, v] of adminConfigDefaults) insertConfig.run(k, v);

/* ── WhatsApp menu options table ───────────────────────── */
db.exec(`
  CREATE TABLE IF NOT EXISTS menu_options (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    parent_key    TEXT NOT NULL DEFAULT '',
    sort_order    INTEGER DEFAULT 0,
    trigger_key   TEXT NOT NULL,
    icon          TEXT DEFAULT '',
    label         TEXT NOT NULL,
    response_type TEXT DEFAULT 'text',
    response_text TEXT DEFAULT '',
    enabled       INTEGER DEFAULT 1
  )
`);
const menuSeed = [
  ['',  0, 'a', '', 'Servicios',        'submenu', ''],
  ['',  1, 'b', '', 'Productos',        'product_list', ''],
  ['',  2, 'c', '', 'Tienda',           'submenu', ''],
  ['',  3, 'd', '', 'Link de compra',   'text', '🛒 *Link de compra*\n\n👉 *Tienda online:*\nhttp://ms7851.local:8080/admin/\n\n📍 También podés visitarnos en:\nAv. Siempre Viva 123, Centro'],
  ['',  4, 'e', '', 'Más productos',    'product_list', ''],
  ['',  5, 'f', '', 'Hablar con asesor','text', '👤 *Hablar con un asesor*\n\nDejanos tu consulta y en breve te responderemos.'],
  ['a', 0, 'aa', '', 'Desarrollo web',  'text', '💻 *Desarrollo web*\n\nCreamos sitios web profesionales, tiendas online y aplicaciones web a medida.\n\nTecnologías: HTML, CSS, JavaScript, Node.js, React.'],
  ['a', 1, 'ab', '', 'Diseño gráfico',  'text', '🎨 *Diseño gráfico*\n\nDiseñamos tu marca, logo, redes sociales y material publicitario.\n\nIncluye: identidad visual, branding, flyers.'],
  ['a', 2, 'ac', '', 'Marketing digital','text', '📱 *Marketing digital*\n\nGestionamos redes sociales, campañas de publicidad y SEO para tu negocio.'],
  ['a', 3, 'ad', '', 'Soporte técnico', 'text', '🔧 *Soporte técnico*\n\nSoporte técnico informático, mantenimiento de sistemas y consultoría IT.'],
  ['a', 4, 'ae', '', 'Consultoría',     'text', '💡 *Consultoría*\n\nAsesoramiento personalizado para tu proyecto digital.'],
  ['a', 5, 'af', '', 'Volver',           'back', ''],
  ['c', 0, 'ca', '', 'Horarios',         'text', '🕐 *Horarios*\n\nLunes a Viernes: 9:00 a 18:00\nSábados: 9:00 a 13:00\nDomingos: Cerrado'],
  ['c', 1, 'cb', '', 'Ubicación',        'text', '📍 *Ubicación*\n\nAv. Siempre Viva 123, Centro'],
  ['c', 2, 'cc', '', 'Contacto',         'text', '📞 *Contacto*\n\nTeléfono: +54 11 5555-1234\nEmail: contacto@webmerge.studio'],
  ['c', 3, 'cd', '', 'Formas de pago',   'text', '💳 *Formas de pago*\n\n• Efectivo\n• Transferencia bancaria\n• Mercado Pago\n• Tarjetas de crédito/débito'],
  ['c', 4, 'ce', '', 'Envíos',           'text', '🚚 *Envíos*\n\n• Envío gratis en compras mayores a $5000\n• Entrega en 24/48 hs hábiles\n• Retiro en tienda sin costo'],
  ['c', 5, 'cf', '', 'Volver',           'back', ''],
];
const insertMenu = db.prepare('INSERT OR IGNORE INTO menu_options (parent_key, sort_order, trigger_key, icon, label, response_type, response_text) VALUES (?, ?, ?, ?, ?, ?, ?)');
const seedMenu = db.transaction(() => {
  const count = db.prepare('SELECT COUNT(*) as c FROM menu_options').get().c;
  if (count === 0) {
    for (const row of menuSeed) insertMenu.run(...row);
  }
});
seedMenu();

const app = express();
const PORT = config.PORT;
const fs = require('fs');

const multer = require('multer');
const uploadStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, 'assets', 'uploads')),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_'))
});
const upload = multer({ storage: uploadStorage });

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/assets/carrusel', express.static(path.join(__dirname, 'assets/carrusel')));
app.use('/assets/simbols', express.static(path.join(__dirname, 'assets/simbols')));
app.use('/assets/uploads', express.static(path.join(__dirname, 'assets/uploads')));

/* ── Page content table (web front editor) ─────────────── */
db.exec(`
  CREATE TABLE IF NOT EXISTS page_content (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    section_key TEXT NOT NULL,
    item_key    TEXT NOT NULL,
    content     TEXT NOT NULL DEFAULT '{}',
    sort_order  INTEGER DEFAULT 0,
    enabled     INTEGER DEFAULT 1,
    updated_at  TEXT DEFAULT (datetime('now'))
  )
`);
const insertPage = db.prepare('INSERT OR IGNORE INTO page_content (section_key, item_key, content, sort_order, enabled) VALUES (?, ?, ?, ?, ?)');
const pageSeed = [
  ['navbar', 'main', JSON.stringify({ site_name: 'WebMerge Studio', logo: '', items: [{ label: 'Inicio', href: '#inicio' }, { label: 'Servicios', href: '#servicios' }, { label: 'Proyectos', href: '#proyectos' }, { label: 'FAQ', href: '#faq' }, { label: 'Nosotros', href: '#nosotros' }, { label: 'Contacto', href: '#contacto' }] }), 0, 1],
  ['hero', 'main', JSON.stringify({ title: 'Transformamos ideas en', title_highlight: 'experiencias digitales', subtitle: 'Diseño y desarrollo de soluciones web modernas para impulsar tu negocio', description: '', cta_primary: { text: 'Nuestros servicios', href: '#servicios' }, cta_secondary: { text: 'Ver proyectos', href: '#proyectos' } }), 0, 1],
  ['stats', 'uptime', JSON.stringify({ value: '99.9%', label: 'Uptime', icon: '📡' }), 0, 1],
  ['stats', 'latency', JSON.stringify({ value: '<100ms', label: 'Latencia', icon: '⚡' }), 1, 1],
  ['stats', 'projects', JSON.stringify({ value: '150+', label: 'Proyectos', icon: '🚀' }), 2, 1],
  ['stats', 'support', JSON.stringify({ value: '∞', label: 'Soporte', icon: '💎' }), 3, 1],
  ['services', 'ux-ui', JSON.stringify({ icon: '🎨', title: 'Diseño UI/UX', description: 'Interfaces intuitivas y atractivas con enfoque en la experiencia de usuario.', features: ['Wireframes y prototipos', 'Design systems', 'Animaciones UI', 'Pruebas de usabilidad'] }), 0, 1],
  ['services', 'frontend', JSON.stringify({ icon: '⚛️', title: 'Desarrollo Frontend', description: 'SPAs interactivas con animaciones fluidas y rendimiento óptimo.', features: ['HTML + CSS + JS', 'GSAP + ScrollTrigger', 'Rive + Canvas', 'React + Next.js'] }), 1, 1],
  ['services', 'backend', JSON.stringify({ icon: '🖥️', title: 'Backend & APIs', description: 'APIs robustas y escalables con las mejores tecnologías del mercado.', features: ['Node.js + Express', 'Python + FastAPI', 'Bases de datos SQL/NoSQL', 'WebSockets en tiempo real'] }), 2, 1],
  ['services', 'responsive', JSON.stringify({ icon: '📱', title: 'Responsive & SEO', description: 'Sitios optimizados para todos los dispositivos y motores de búsqueda.', features: ['Diseño mobile-first', 'Optimización Core Web Vitals', 'SEO técnico y on-page', 'Performance audits'] }), 3, 1],
  ['projects', 'electronica', JSON.stringify({ icon: '🛒', tag: 'E-commerce', title: 'ElectronicaStore', description: 'Tienda online de componentes electrónicos con Express, MySQL y vanilla JS SPA.', tech: ['Node.js', 'MySQL', 'Express'], link: '' }), 0, 1],
  ['projects', 'techstore', JSON.stringify({ icon: '⚙️', tag: 'Dashboard', title: 'TechStore Server', description: 'Panel de administración y gestión de inventario con APIs RESTful y autenticación JWT.', tech: ['React', 'Node.js', 'MongoDB'], link: '' }), 1, 1],
  ['projects', 'shoprive', JSON.stringify({ icon: '🎮', tag: 'Web App', title: 'ShopRive', description: 'Plataforma de ventas con animaciones inmersivas y carrito de compras en tiempo real.', tech: ['GSAP', 'Rive', 'Canvas'], link: '' }), 2, 1],
  ['projects', 'scaleweb', JSON.stringify({ icon: '📊', tag: 'Corporate', title: 'ScaleWeb', description: 'Sitio corporativo con sistema de reservas, chat en vivo y panel de analytics.', tech: ['Python', 'FastAPI', 'PostgreSQL'], link: '' }), 3, 1],
  ['about', 'mission', JSON.stringify({ title: 'Misión', text: 'Crear soluciones digitales que transformen negocios, combinando diseño innovador con tecnología de punta para ofrecer experiencias únicas.' }), 0, 1],
  ['about', 'values', JSON.stringify({ icon: '💡', title: 'Innovación', text: 'Nos mantenemos a la vanguardia tecnológica para ofrecer soluciones modernas.' }), 1, 1],
  ['about', 'values2', JSON.stringify({ icon: '🤝', title: 'Compromiso', text: 'Cada proyecto recibe atención personalizada y dedicación exclusiva.' }), 2, 1],
  ['about', 'values3', JSON.stringify({ icon: '⭐', title: 'Calidad', text: 'Estándares rigurosos de desarrollo y diseño para resultados excepcionales.' }), 3, 1],
  ['about', 'team_stats', JSON.stringify({ items: [{ value: '5+', label: 'Años exp' }, { value: '10+', label: 'Expertos' }, { value: '200+', label: 'Clientes' }] }), 4, 1],
  ['footer', 'main', JSON.stringify({ brand: 'WebMerge Studio', description: 'Transformando ideas en experiencias digitales desde 2020.', social: { github: '#', linkedin: '#', twitter: '#' }, copyright: '© 2026 WebMerge Studio. Todos los derechos reservados.' }), 0, 1],
  ['chatbot', 'main', JSON.stringify({ name: 'Boty', greeting: '👋 ¡Hola! Soy Boty, el asistente virtual de WebMerge Studio.', logo: '', theme: { primary: '#6c5ce7', secondary: '#00cec9', bg: '#1a1a2e', text: '#ffffff' } }), 0, 1],
];
db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_page_section_item ON page_content(section_key, item_key)');
const seedPage = db.transaction(() => {
  const count = db.prepare('SELECT COUNT(*) as c FROM page_content').get().c;
  if (count === 0) { for (const row of pageSeed) insertPage.run(...row); }
});
seedPage();

app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    res.json({ url: '/assets/uploads/' + req.file.filename });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/uploads/list', (req, res) => {
  try {
    const dir = path.join(__dirname, 'assets/uploads');
    const files = fs.readdirSync(dir).filter(f => /\.(png|jpg|jpeg|gif|svg|webp)$/i.test(f)).sort().reverse();
    res.json(files.map(f => ({ name: f, url: '/assets/uploads/' + f })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/simbols/list', (req, res) => {
  try {
    const dir = path.join(__dirname, 'assets/simbols');
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.svg')).sort();
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/carrusel/images', (req, res) => {
  try {
    const dir = path.join(__dirname, 'assets/carrusel');
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.png')).sort();
    const images = files.map(f => `/assets/carrusel/${f}`);
    res.json(images);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get('/api/page-content', (req, res) => {
  try {
    const rows = db.prepare("SELECT section_key, item_key, content, sort_order FROM page_content WHERE enabled = 1 ORDER BY CASE section_key WHEN 'navbar' THEN 0 WHEN 'hero' THEN 1 WHEN 'stats' THEN 2 WHEN 'services' THEN 3 WHEN 'projects' THEN 4 WHEN 'about' THEN 5 WHEN 'footer' THEN 6 WHEN 'chatbot' THEN 7 ELSE 8 END, sort_order ASC").all();
    res.json(rows.map(r => ({ ...r, content: JSON.parse(r.content) })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});
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
