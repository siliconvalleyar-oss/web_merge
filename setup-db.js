const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcrypt');

const dbPath = path.join(__dirname, 'data', 'webmerge.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS config (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    config_key  TEXT UNIQUE NOT NULL,
    config_value TEXT NOT NULL,
    updated_at  TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS faqs (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    category    TEXT NOT NULL,
    question    TEXT NOT NULL,
    answer      TEXT NOT NULL,
    keywords    TEXT,
    enabled     INTEGER DEFAULT 1,
    created_at  TEXT DEFAULT (datetime('now')),
    updated_at  TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS contacts (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    email       TEXT NOT NULL,
    message     TEXT NOT NULL,
    is_read     INTEGER DEFAULT 0,
    created_at  TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    number      TEXT NOT NULL,
    message     TEXT NOT NULL,
    response    TEXT,
    is_read     INTEGER DEFAULT 0,
    created_at  TEXT DEFAULT (datetime('now'))
  );

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
  );

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
  );

  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role          TEXT NOT NULL DEFAULT 'response' CHECK(role IN ('master','stock','response')),
    created_at    TEXT DEFAULT (datetime('now'))
  );
`);

try { db.exec('ALTER TABLE whatsapp_messages ADD COLUMN is_read INTEGER DEFAULT 0'); } catch {}

const insertConfig = db.prepare(
  'INSERT OR IGNORE INTO config (config_key, config_value) VALUES (?, ?)'
);
const configDefaults = [
  ['site_name',      'WebMerge Studio'],
  ['primary_color',   '#6c5ce7'],
  ['primary_muted',   '#6c5ce720'],
  ['secondary_color', '#00cec9'],
  ['accent_color',    '#fd79a8'],
  ['bg_color',        '#0a0a14'],
  ['surface_color',   '#1a1a2e'],
  ['text_color',      '#e8e8f0'],
  ['text_muted',      '#9999aa'],
  ['border_color',    '#2d2d44'],
  ['chatbot_name',    'WebBot'],
  ['chatbot_greeting','Hola, soy WebBot. ¿En qué puedo ayudarte?'],
  ['faq_categories',  'general,tecnico,proceso,soporte'],
  ['carousel_overlay_opacity', '0.5'],
  ['mascot_enabled',  '1'],
  ['mascot_file',     'simbol_git.svg'],
  ['mascot_pos_x',    '20'],
  ['mascot_pos_y',    '60'],
  ['mascot_size',     '80'],
  ['admin_bg',        '#0a0a14'],
  ['admin_sidebar',   '#141425'],
  ['admin_accent',    '#6c5ce7'],
  ['admin_text',      '#e8e8f0'],
  ['admin_border',    '#2d2d44'],
  ['admin_surface',   '#1a1a2e'],
];
const insertMany = db.transaction(() => {
  for (const [k, v] of configDefaults) insertConfig.run(k, v);
});
insertMany();

const insertFaq = db.prepare(
  'INSERT OR IGNORE INTO faqs (category, question, answer, keywords) VALUES (?, ?, ?, ?)'
);
const faqDefaults = [
  ['general','¿Qué es WebMerge Studio?',
   'WebMerge Studio es una plataforma profesional para la creación de landing pages modernas con animaciones avanzadas, diseño responsivo y componentes interactivos.',
    'plataforma, studio, webmerge, landing pages, animaciones'],
  ['general','¿Qué tecnologías utiliza?',
   'Utilizamos HTML5, CSS3 con design tokens, JavaScript modular, GSAP, ScrollTrigger, AOS y Express.js en el backend.',
    'html5, css3, javascript, gsap, scrolltrigger, express'],
  ['tecnico','¿Cómo puedo personalizar los colores?',
   'Puedes personalizar la paleta de colores desde el panel de administración en /admin. Los cambios se aplican en tiempo real sin necesidad de recargar.',
    'colores, personalizar, paleta, tema, admin, configuracion'],
  ['tecnico','¿El sitio es responsivo?',
   'Sí, el diseño se adapta a todos los dispositivos: móviles, tablets y escritorio. Usamos puntos de quiebre en 480px, 768px y 1024px.',
    'responsivo, movil, tablet, escritorio, adaptativo, dispositivos'],
  ['proceso','¿Cómo funciona el chatbot?',
   'El chatbot utiliza un sistema RAG (Retrieval Augmented Generation) que busca en la base de conocimiento las respuestas más relevantes a tu consulta.',
    'chatbot, inteligente, rag, respuestas, automatico, conocimiento'],
  ['proceso','¿Cómo enviar un mensaje de contacto?',
   'Completa el formulario en la sección de contacto con tu nombre, email y mensaje. Lo recibiremos y te responderemos a la brevedad.',
    'contacto, formulario, email, mensaje, comunicacion'],
  ['soporte','¿Cuánto cuesta usar la plataforma?',
   'WebMerge Studio es completamente gratuito y open source. Puedes usarlo, modificarlo y distribuirlo libremente.',
    'costo, precio, gratis, open source, gratuito, libre'],
  ['soporte','¿Dónde reporto un error?',
   'Puedes reportar errores en nuestro repositorio de GitHub o mediante el formulario de contacto.',
    'error, bug, reportar, github, repositorio, soporte'],
];
const insertFaqs = db.transaction(() => {
  for (const [c, q, a, k] of faqDefaults) insertFaq.run(c, q, a, k);
});
insertFaqs();

const hash = bcrypt.hashSync('admin123', 10);
db.prepare(
  'INSERT OR IGNORE INTO users (username, password_hash, role) VALUES (?, ?, ?)'
).run('master', hash, 'master');
db.prepare(
  'INSERT OR IGNORE INTO users (username, password_hash, role) VALUES (?, ?, ?)'
).run('stock', hash, 'stock');
db.prepare(
  'INSERT OR IGNORE INTO users (username, password_hash, role) VALUES (?, ?, ?)'
).run('response', hash, 'response');

db.close();
console.log('✅ Base de datos inicializada: data/webmerge.db');
