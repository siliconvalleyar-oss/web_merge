let TOKEN = null;
let USER = null;
let WHATSAPP_POLLER = null;
let LAST_MSG_COUNT = 0;

const $ = id => document.getElementById(id);

function showView(id) {
  document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
  $(id).classList.remove('hidden');
}

function showTab(name) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  $(`tab${name.charAt(0).toUpperCase() + name.slice(1)}`).classList.add('active');
  document.querySelector(`[data-tab="${name}"]`).classList.add('active');
}

function api(path, opts = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (TOKEN) headers['Authorization'] = `Bearer ${TOKEN}`;
  return fetch(`/api/admin${path}`, { ...opts, headers }).then(r => r.json());
}

/* ── Login ───────────────────────────────────────────────── */
$('loginForm').addEventListener('submit', async e => {
  e.preventDefault();
  $('loginError').textContent = '';
  const res = await fetch('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: $('loginUser').value, password: $('loginPass').value })
  });
  const data = await res.json();
    if (data.token) {
    TOKEN = data.token;
    USER = data.user;
    $('userBadge').textContent = `${data.user.username} (${roleLabel(data.user.role)})`;
    $('userTitleRole').textContent = `— ${data.user.username} (${roleLabel(data.user.role)})`;
    showView('dashboardView');
    loadDashboard();
  } else {
    $('loginError').textContent = data.error || 'Error al iniciar sesión';
  }
});

$('logoutBtn').addEventListener('click', () => {
  TOKEN = null;
  USER = null;
  showView('loginView');
});

/* ── Tabs ────────────────────────────────────────────────── */
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    showTab(tab.dataset.tab);
    stopWhatsAppPolling();
    if (tab.dataset.tab === 'faqs') loadFAQs();
    if (tab.dataset.tab === 'contacts') loadContacts();
    if (tab.dataset.tab === 'clients') loadClients();
    if (tab.dataset.tab === 'products') loadProducts();
    if (tab.dataset.tab === 'users') loadUsers();
    if (tab.dataset.tab === 'menu') loadMenuOptions();
    if (tab.dataset.tab === 'whatsapp') { loadWhatsApp(); startWhatsAppPolling(); }
    if (tab.dataset.tab === 'control') loadControlPanel();
    if (tab.dataset.tab === 'config') loadConfig();
  });
});

/* ── Dashboard loader ────────────────────────────────────── */
async function loadDashboard() {
  loadFAQs();
  loadConfig();
}

function roleLabel(role) {
  return ({ master: 'Master', stock: 'Stock', response: 'Respuesta' })[role] || role;
}

/* ── FAQs ────────────────────────────────────────────────── */
async function loadFAQs() {
  const data = await api('/faqs');
  if (data.error) return;
  $('faqsBody').innerHTML = data.map(f =>
    `<tr>
      <td>${f.id}</td>
      <td><span class="badge">${f.category}</span></td>
      <td>${f.question.substring(0, 60)}${f.question.length > 60 ? '…' : ''}</td>
      <td>${f.enabled ? '✓ Activo' : '✕ Inactivo'}</td>
      <td>
        <button class="btn btn-sm btn-edit" onclick="editFaq(${f.id})">Editar</button>
        <button class="btn btn-sm btn-danger" onclick="deleteFaq(${f.id})">Eliminar</button>
      </td>
    </tr>`
  ).join('');
}

function openFaqModal(faq = null) {
  $('faqModalTitle').textContent = faq ? 'Editar FAQ' : 'Nueva FAQ';
  $('faqId').value = faq ? faq.id : '';
  $('faqCategory').value = faq ? faq.category : 'general';
  $('faqQuestion').value = faq ? faq.question : '';
  $('faqAnswer').value = faq ? faq.answer : '';
  $('faqKeywords').value = faq ? faq.keywords : '';
  $('faqModal').classList.remove('hidden');
}

function closeFaqModal() {
  $('faqModal').classList.add('hidden');
}

$('addFaqBtn').addEventListener('click', () => openFaqModal());
$('closeFaqModal').addEventListener('click', closeFaqModal);
document.querySelector('.modal-backdrop')?.addEventListener('click', closeFaqModal);

$('faqForm').addEventListener('submit', async e => {
  e.preventDefault();
  const id = $('faqId').value;
  const data = {
    category: $('faqCategory').value,
    question: $('faqQuestion').value,
    answer: $('faqAnswer').value,
    keywords: $('faqKeywords').value,
    enabled: true,
  };
  const res = id ? await api(`/faqs/${id}`, { method: 'PUT', body: JSON.stringify(data) })
                 : await api('/faqs', { method: 'POST', body: JSON.stringify(data) });
  if (res.success) {
    closeFaqModal();
    loadFAQs();
  }
});

async function editFaq(id) {
  const data = await api('/faqs');
  const faq = data.find(f => f.id === id);
  if (faq) openFaqModal(faq);
}

async function deleteFaq(id) {
  if (!confirm('¿Eliminar esta FAQ?')) return;
  const res = await api(`/faqs/${id}`, { method: 'DELETE' });
  if (res.success) loadFAQs();
}

/* ── Palette presets ─────────────────────────────────────── */
const PALETTES = [
  {
    id: 'default', name: 'Default',
    colors: { primary_color: '#6c5ce7', secondary_color: '#00cec9', accent_color: '#fd79a8', bg_color: '#0a0a14', surface_color: '#1a1a2e', text_color: '#e8e8f0', text_muted: '#9999aa', border_color: '#2d2d44' }
  },
  {
    id: 'minimalista', name: 'Minimalista',
    colors: { primary_color: '#2d2d2d', secondary_color: '#6b6b6b', accent_color: '#9a9a9a', bg_color: '#fafafa', surface_color: '#ffffff', text_color: '#1a1a1a', text_muted: '#888888', border_color: '#e0e0e0' }
  },
  {
    id: 'pasteles', name: 'Pasteles',
    colors: { primary_color: '#b8a9e8', secondary_color: '#a8d8ea', accent_color: '#f8b4c8', bg_color: '#fef9f0', surface_color: '#ffffff', text_color: '#4a4a6a', text_muted: '#a09bb0', border_color: '#e8e0f0' }
  },
  {
    id: 'colorido', name: 'Colorido',
    colors: { primary_color: '#ff6b6b', secondary_color: '#4ecdc4', accent_color: '#ffe66d', bg_color: '#f7fff7', surface_color: '#ffffff', text_color: '#2d3436', text_muted: '#636e72', border_color: '#dfe6e9' }
  },
  {
    id: 'empresarial', name: 'Empresarial',
    colors: { primary_color: '#1a365d', secondary_color: '#2b6cb0', accent_color: '#ecc94b', bg_color: '#f7fafc', surface_color: '#ffffff', text_color: '#1a202c', text_muted: '#718096', border_color: '#e2e8f0' }
  },
  {
    id: 'moderno', name: 'Moderno',
    colors: { primary_color: '#7c3aed', secondary_color: '#06b6d4', accent_color: '#f43f5e', bg_color: '#09090b', surface_color: '#18181b', text_color: '#fafafa', text_muted: '#a1a1aa', border_color: '#27272a' }
  },
  {
    id: 'atractivo', name: 'Atractivo',
    colors: { primary_color: '#e74c3c', secondary_color: '#f39c12', accent_color: '#2ecc71', bg_color: '#1a1a2e', surface_color: '#16213e', text_color: '#ecf0f1', text_muted: '#95a5a6', border_color: '#2c3e50' }
  },
  {
    id: 'oceanico', name: 'Oceánico',
    colors: { primary_color: '#0077b6', secondary_color: '#00b4d8', accent_color: '#fabc3c', bg_color: '#f0f8ff', surface_color: '#ffffff', text_color: '#023e8a', text_muted: '#7f9fbf', border_color: '#cce5ff' }
  },
  {
    id: 'atardecer', name: 'Atardecer',
    colors: { primary_color: '#e07c3c', secondary_color: '#d45d79', accent_color: '#f4d03f', bg_color: '#1a0f14', surface_color: '#2a1a20', text_color: '#fce4d6', text_muted: '#c4a090', border_color: '#4a2a30' }
  },
  {
    id: 'naturaleza', name: 'Naturaleza',
    colors: { primary_color: '#2d6a4f', secondary_color: '#52b788', accent_color: '#ff9e00', bg_color: '#f0faf0', surface_color: '#ffffff', text_color: '#1b4332', text_muted: '#6a8f7a', border_color: '#c8e6c9' }
  },
  {
    id: 'tecno', name: 'Tecno',
    colors: { primary_color: '#00f5d4', secondary_color: '#fb5607', accent_color: '#ff006e', bg_color: '#000814', surface_color: '#001233', text_color: '#e0fbfc', text_muted: '#98c1d9', border_color: '#003366' }
  },
  {
    id: 'vintage', name: 'Vintage',
    colors: { primary_color: '#8b5a2b', secondary_color: '#cd853f', accent_color: '#deb887', bg_color: '#fdf5e6', surface_color: '#faf0dc', text_color: '#3e2723', text_muted: '#8d6e63', border_color: '#d7ccc8' }
  },
  {
    id: 'oscuro-elegante', name: 'Oscuro Elegante',
    colors: { primary_color: '#c9a84c', secondary_color: '#5c5c5c', accent_color: '#ffffff', bg_color: '#0d0d0d', surface_color: '#1a1a1a', text_color: '#e8e8e8', text_muted: '#808080', border_color: '#333333' }
  },
  {
    id: 'rosa', name: 'Rosa',
    colors: { primary_color: '#d63384', secondary_color: '#f06595', accent_color: '#fcc2d7', bg_color: '#fff0f6', surface_color: '#ffffff', text_color: '#4a0024', text_muted: '#c0819a', border_color: '#f8c8dc' }
  },
  {
    id: 'solar', name: 'Solar',
    colors: { primary_color: '#f9a825', secondary_color: '#ff6f00', accent_color: '#00c853', bg_color: '#fff8e1', surface_color: '#ffffff', text_color: '#3e2723', text_muted: '#a09070', border_color: '#ffe082' }
  },
];

function applyPalette(colors) {
  Object.entries(colors).forEach(([key, value]) => {
    const el = document.querySelector(`[name="${key}"]`);
    if (el && el.type === 'color') el.value = value;
  });
  const primary = document.querySelector('[name="primary_color"]');
  if (primary) {
    const muted = document.querySelector('[name="primary_muted"]');
    if (muted) muted.value = primary.value + '20';
  }
}

function renderPalettes() {
  const grid = $('paletteGrid');
  if (!grid) return;
  grid.innerHTML = PALETTES.map(p => {
    const c = p.colors;
    const swatches = [c.primary_color, c.secondary_color, c.accent_color, c.bg_color, c.surface_color, c.text_color].join(',');
    return `<div class="palette-item" data-palette="${p.id}" title="${p.name}" onclick="applyPalette(PALETTES.find(x=>x.id==='${p.id}').colors)">
      <div class="palette-swatches">
        ${[c.primary_color, c.secondary_color, c.accent_color, c.bg_color, c.surface_color].map(h => `<span style="background:${h}"></span>`).join('')}
      </div>
      <span class="palette-item-name">${p.name}</span>
    </div>`;
  }).join('');
}

/* ── Config ──────────────────────────────────────────────── */
async function loadConfig() {
  renderPalettes();
  try {
    const c = await (await fetch('/api/config')).json();
    if (!c.error) {
      Object.entries(c).forEach(([key, value]) => {
        const el = document.querySelector(`[name="${key}"]`);
        if (el) {
          if (el.type === 'color') el.value = value.substring(0, 7);
          else el.value = value;
        }
      });
      const range = document.querySelector('[name="carousel_overlay_opacity"]');
      if (range) {
        const display = range.nextElementSibling;
        if (display) display.textContent = parseFloat(range.value).toFixed(2);
      }
      applyMascotConfig(c);
    }
  } catch {}
  loadAdminConfig();
  loadMascotFiles();
}

$('saveConfigBtn').addEventListener('click', async () => {
  const form = $('configForm');
  const data = {};
  form.querySelectorAll('[name]').forEach(el => { data[el.name] = el.value; });
  const res = await fetch('/api/config', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const result = await res.json();
  if (result.success) {
    $('configSaved').classList.remove('hidden');
    setTimeout(() => $('configSaved').classList.add('hidden'), 3000);
  }
});

/* ── Admin Palette presets ────────────────────────────────── */
const ADMIN_PALETTES = [
  {
    id: 'admin-dark', name: 'Dark (default)',
    colors: { admin_bg: '#0a0a14', admin_sidebar: '#141425', admin_accent: '#6c5ce7', admin_text: '#e8e8f0', admin_border: '#2d2d44', admin_surface: '#1a1a2e' }
  },
  {
    id: 'admin-light', name: 'Light',
    colors: { admin_bg: '#f5f5f5', admin_sidebar: '#ffffff', admin_accent: '#6c5ce7', admin_text: '#1a1a1a', admin_border: '#e0e0e0', admin_surface: '#ffffff' }
  },
  {
    id: 'admin-navy', name: 'Navy',
    colors: { admin_bg: '#0f1923', admin_sidebar: '#1a2a3a', admin_accent: '#4fc3f7', admin_text: '#e0e6ed', admin_border: '#2a3a4a', admin_surface: '#152232' }
  },
  {
    id: 'admin-forest', name: 'Forest',
    colors: { admin_bg: '#0d1f11', admin_sidebar: '#1a2e1e', admin_accent: '#66bb6a', admin_text: '#e0f0e0', admin_border: '#2a4a2e', admin_surface: '#162a1a' }
  },
  {
    id: 'admin-midnight', name: 'Midnight',
    colors: { admin_bg: '#0a0a1a', admin_sidebar: '#12122a', admin_accent: '#b388ff', admin_text: '#e0e0f0', admin_border: '#2a2a4a', admin_surface: '#1a1a2e' }
  },
  {
    id: 'admin-warm', name: 'Warm',
    colors: { admin_bg: '#1a1410', admin_sidebar: '#2a1e18', admin_accent: '#ff8a65', admin_text: '#f0e8e0', admin_border: '#3a2e28', admin_surface: '#221a14' }
  },
  {
    id: 'admin-grafito', name: 'Grafito',
    colors: { admin_bg: '#121212', admin_sidebar: '#1e1e1e', admin_accent: '#bb86fc', admin_text: '#e0e0e0', admin_border: '#333333', admin_surface: '#1a1a1a' }
  },
  {
    id: 'admin-corporativo', name: 'Corporativo',
    colors: { admin_bg: '#f0f4f8', admin_sidebar: '#ffffff', admin_accent: '#1565c0', admin_text: '#1a202c', admin_border: '#cbd5e0', admin_surface: '#ffffff' }
  },
  {
    id: 'admin-purpura', name: 'Púrpura Oscuro',
    colors: { admin_bg: '#0e0a1a', admin_sidebar: '#1a122a', admin_accent: '#d4a0ff', admin_text: '#e8e0f0', admin_border: '#3a2a5a', admin_surface: '#1a1030' }
  },
  {
    id: 'admin-menta', name: 'Verde Menta',
    colors: { admin_bg: '#e8f5e9', admin_sidebar: '#ffffff', admin_accent: '#00897b', admin_text: '#1b3a2a', admin_border: '#c8e6c9', admin_surface: '#f1f8e9' }
  },
  {
    id: 'admin-terracota', name: 'Terracota',
    colors: { admin_bg: '#1a0e0a', admin_sidebar: '#2a1a12', admin_accent: '#e07c5c', admin_text: '#f0e0d8', admin_border: '#4a2a1a', admin_surface: '#221812' }
  },
  {
    id: 'admin-pizarra', name: 'Pizarra',
    colors: { admin_bg: '#1a1d23', admin_sidebar: '#252a33', admin_accent: '#7ec8e3', admin_text: '#d0d8e0', admin_border: '#3a4050', admin_surface: '#1e232d' }
  },
  {
    id: 'admin-cereza', name: 'Cereza',
    colors: { admin_bg: '#1a0a0e', admin_sidebar: '#2a121a', admin_accent: '#ff6b8a', admin_text: '#f0e0e4', admin_border: '#4a1a28', admin_surface: '#221018' }
  },
  {
    id: 'admin-arena', name: 'Arena',
    colors: { admin_bg: '#f5efe6', admin_sidebar: '#ffffff', admin_accent: '#c9a84c', admin_text: '#2d2418', admin_border: '#d4c9b8', admin_surface: '#faf5ef' }
  },
];

function applyAdminPalette(colors) {
  Object.entries(colors).forEach(([key, value]) => {
    const el = document.querySelector(`[name="${key}"]`);
    if (el && el.type === 'color') el.value = value;
  });
}

function renderAdminPalettes() {
  const grid = $('adminPaletteGrid');
  if (!grid) return;
  grid.innerHTML = ADMIN_PALETTES.map(p => {
    const c = p.colors;
    return `<div class="palette-item" data-palette="${p.id}" title="${p.name}" onclick="applyAdminPalette(ADMIN_PALETTES.find(x=>x.id==='${p.id}').colors)">
      <div class="palette-swatches">
        ${[c.admin_bg, c.admin_sidebar, c.admin_accent, c.admin_surface, c.admin_text].map(h => `<span style="background:${h}"></span>`).join('')}
      </div>
      <span class="palette-item-name">${p.name}</span>
    </div>`;
  }).join('');
}

function applyAdminColors(c) {
  const root = document.querySelector('#dashboardView');
  if (!root) return;
  root.style.setProperty('--admin-bg', c.admin_bg || '#0a0a14');
  root.style.setProperty('--admin-sidebar', c.admin_sidebar || '#141425');
  root.style.setProperty('--admin-accent', c.admin_accent || '#6c5ce7');
  root.style.setProperty('--admin-text', c.admin_text || '#e8e8f0');
  root.style.setProperty('--admin-border', c.admin_border || '#2d2d44');
  root.style.setProperty('--admin-surface', c.admin_surface || '#1a1a2e');
  document.body.style.background = c.admin_bg || '#0a0a14';
}

async function loadAdminConfig() {
  renderAdminPalettes();
  try {
    const c = await (await fetch('/api/config')).json();
    if (!c.error) {
      const adminKeys = ['admin_bg','admin_sidebar','admin_accent','admin_text','admin_border','admin_surface'];
      const adminColors = {};
      adminKeys.forEach(k => { if (c[k]) adminColors[k] = c[k]; });
      Object.entries(adminColors).forEach(([key, value]) => {
        const el = document.querySelector(`[name="${key}"]`);
        if (el && el.type === 'color') el.value = value.substring(0, 7);
      });
      if (adminColors.admin_bg) applyAdminColors(adminColors);
    }
  } catch {}
}

/* ── Mascot ──────────────────────────────────────────────── */
async function loadMascotFiles() {
  const sel = $('mascotFile');
  if (!sel) return;
  try {
    const res = await fetch('/api/simbols/list');
    const list = await res.json();
    if (list && !list.error && list.length) {
      sel.innerHTML = list.map(f => `<option value="${f}">${f}</option>`).join('');
    } else {
      sel.innerHTML = '<option value="simbol_git.svg">simbol_git.svg</option>';
    }
  } catch {
    sel.innerHTML = '<option value="simbol_git.svg">simbol_git.svg</option>';
  }
}

function toggleMascotSwitch() {
  const hidden = $('mascotEnabled');
  const track = $('mascotSwitchTrack');
  const label = $('mascotSwitchLabel');
  const isOn = hidden.value === '1';
  hidden.value = isOn ? '0' : '1';
  track.classList.toggle('on', !isOn);
  label.textContent = isOn ? 'Desactivado' : 'Activado';
}

function applyMascotConfig(c) {
  const hidden = $('mascotEnabled');
  const track = $('mascotSwitchTrack');
  const label = $('mascotSwitchLabel');
  if (!hidden) return;
  const enabled = c.mascot_enabled === '1' || c.mascot_enabled === true;
  hidden.value = enabled ? '1' : '0';
  track?.classList.toggle('on', enabled);
  if (label) label.textContent = enabled ? 'Activado' : 'Desactivado';

  const xRange = document.querySelector('[name="mascot_pos_x"]');
  if (xRange) {
    xRange.value = c.mascot_pos_x ?? '50';
    const display = xRange.nextElementSibling;
    if (display) display.textContent = (c.mascot_pos_x || '50') + '%';
  }
  const yRange = document.querySelector('[name="mascot_pos_y"]');
  if (yRange) {
    yRange.value = c.mascot_pos_y ?? '50';
    const display = yRange.nextElementSibling;
    if (display) display.textContent = (c.mascot_pos_y || '50') + '%';
  }
  const sizeRange = document.querySelector('[name="mascot_size"]');
  if (sizeRange) {
    sizeRange.value = c.mascot_size ?? '80';
    const display = sizeRange.nextElementSibling;
    if (display) display.textContent = (c.mascot_size || '80') + 'px';
  }
}

$('saveAdminConfigBtn')?.addEventListener('click', async () => {
  const form = $('adminConfigForm');
  const data = {};
  form.querySelectorAll('[name]').forEach(el => { data[el.name] = el.value; });
  const res = await fetch('/api/config', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const result = await res.json();
  if (result.success) {
    applyAdminColors(data);
    $('configSaved').classList.remove('hidden');
    setTimeout(() => $('configSaved').classList.add('hidden'), 3000);
  }
});

/* ── Contacts ────────────────────────────────────────────── */
async function loadContacts() {
  const data = await api('/contacts');
  if (data.error) return;
  const unread = data.filter(c => !c.is_read).length;
  const badge = document.querySelector('[data-tab="contacts"] .badge-msg');
  if (badge) {
    badge.textContent = unread;
    badge.style.display = unread ? 'inline-flex' : 'none';
  }
  $('contactsBody').innerHTML = data.map(c =>
    `<tr onclick="${c.is_read ? '' : `markRead(${c.id})`}" style="${c.is_read ? '' : 'font-weight:600;background:rgba(108,92,231,.05)'}">
      <td>${new Date(c.created_at).toLocaleDateString()}</td>
      <td>${c.name}</td>
      <td>${c.email}</td>
      <td>${c.message.substring(0, 80)}${c.message.length > 80 ? '…' : ''}</td>
      <td>${c.is_read ? '✓ Leído' : '● Nuevo'}</td>
    </tr>`
  ).join('');
}

async function markRead(id) {
  await api(`/contacts/${id}/read`, { method: 'PUT' });
  loadContacts();
}

/* ── Clients ────────────────────────────────────────────── */
async function loadClients() {
  const data = await api('/clients');
  if (data.error) return;
  $('clientsBody').innerHTML = data.map(c =>
    `<tr>
      <td><strong>${c.client_number}</strong></td>
      <td>${c.phone}</td>
      <td>${c.name || '—'}</td>
      <td>${c.address || '—'}</td>
      <td>${c.email || '—'}</td>
      <td>${c.notes ? c.notes.substring(0, 40) : '—'}</td>
      <td>
        <button class="btn btn-sm btn-edit" onclick="editClient(${c.id})">Editar</button>
        <button class="btn btn-sm btn-danger" onclick="deleteClient(${c.id})">Eliminar</button>
      </td>
    </tr>`
  ).join('');
}

function openClientModal(client = null) {
  $('clientModalTitle').textContent = client ? 'Editar cliente' : 'Nuevo cliente';
  $('clientId').value = client ? client.id : '';
  $('clientPhone').value = client ? client.phone : '';
  $('clientPhone').readOnly = !!client;
  $('clientName').value = client ? client.name : '';
  $('clientAddress').value = client ? client.address : '';
  $('clientEmail').value = client ? client.email : '';
  $('clientNotes').value = client ? client.notes : '';
  $('clientModal').classList.remove('hidden');
}

function closeClientModal() {
  $('clientModal').classList.add('hidden');
}

$('addClientBtn').addEventListener('click', () => openClientModal());
$('closeClientModal').addEventListener('click', closeClientModal);

$('clientForm').addEventListener('submit', async e => {
  e.preventDefault();
  const id = $('clientId').value;
  const data = {
    phone: $('clientPhone').value.trim(),
    name: $('clientName').value.trim(),
    address: $('clientAddress').value.trim(),
    email: $('clientEmail').value.trim(),
    notes: $('clientNotes').value.trim(),
  };
  const res = id
    ? await api(`/clients/${id}`, { method: 'PUT', body: JSON.stringify(data) })
    : await api('/clients', { method: 'POST', body: JSON.stringify(data) });
  if (res.success || res.id) {
    closeClientModal();
    loadClients();
    showToast(id ? 'Cliente actualizado' : 'Cliente creado');
  } else {
    showToast(res.error || 'Error al guardar');
  }
});

async function editClient(id) {
  const data = await api('/clients');
  const client = data.find(c => c.id === id);
  if (client) openClientModal(client);
}

async function deleteClient(id) {
  if (!confirm('¿Eliminar este cliente?')) return;
  const res = await api(`/clients/${id}`, { method: 'DELETE' });
  if (res.success) { loadClients(); showToast('Cliente eliminado'); }
}

$('exportClientsBtn').addEventListener('click', async () => {
  if (!TOKEN) return;
  try {
    const res = await fetch('/api/admin/clients/export', {
      headers: { 'Authorization': `Bearer ${TOKEN}` }
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'clientes.vcf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Contactos exportados');
  } catch { showToast('Error al exportar'); }
});

/* ── Products ──────────────────────────────────────────────── */
async function loadProducts() {
  const data = await api('/products');
  if (data.error) return;
  $('productsBody').innerHTML = data.map(p =>
    `<tr>
      <td><strong>${p.name}</strong></td>
      <td>$${p.price.toFixed(2)}</td>
      <td>${p.stock}</td>
      <td>${p.category || '—'}</td>
      <td>${p.enabled ? '✓ Activo' : '✕ Inactivo'}</td>
      <td>
        <button class="btn btn-sm btn-edit" onclick="editProduct(${p.id})">Editar</button>
        <button class="btn btn-sm btn-danger" onclick="deleteProduct(${p.id})">Eliminar</button>
      </td>
    </tr>`
  ).join('');
}

function openProductModal(product = null) {
  $('productModalTitle').textContent = product ? 'Editar producto' : 'Nuevo producto';
  $('productId').value = product ? product.id : '';
  $('productName').value = product ? product.name : '';
  $('productDescription').value = product ? product.description : '';
  $('productPrice').value = product ? product.price : '';
  $('productStock').value = product ? product.stock : '';
  $('productCategory').value = product ? product.category : '';
  $('productImage').value = product ? product.image_url : '';
  $('productModal').classList.remove('hidden');
}

function closeProductModal() {
  $('productModal').classList.add('hidden');
}

$('addProductBtn').addEventListener('click', () => openProductModal());
$('closeProductModal').addEventListener('click', closeProductModal);

$('productForm').addEventListener('submit', async e => {
  e.preventDefault();
  const id = $('productId').value;
  const data = {
    name: $('productName').value.trim(),
    description: $('productDescription').value.trim(),
    price: parseFloat($('productPrice').value) || 0,
    stock: parseInt($('productStock').value) || 0,
    category: $('productCategory').value.trim(),
    image_url: $('productImage').value.trim(),
    enabled: true,
  };
  const res = id
    ? await api(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) })
    : await api('/products', { method: 'POST', body: JSON.stringify(data) });
  if (res.success || res.id) {
    closeProductModal();
    loadProducts();
    showToast(id ? 'Producto actualizado' : 'Producto creado');
  } else {
    showToast(res.error || 'Error al guardar');
  }
});

async function editProduct(id) {
  const data = await api('/products');
  const product = data.find(p => p.id === id);
  if (product) openProductModal(product);
}

async function deleteProduct(id) {
  if (!confirm('¿Eliminar este producto?')) return;
  const res = await api(`/products/${id}`, { method: 'DELETE' });
  if (res.success) { loadProducts(); showToast('Producto eliminado'); }
}

/* ── Users ─────────────────────────────────────────────────── */
async function loadUsers() {
  const data = await api('/users');
  if (data.error) return;
  $('usersBody').innerHTML = data.map(u =>
    `<tr>
      <td><strong>${u.username}</strong></td>
      <td><span class="role-badge role-${u.role}">${roleLabel(u.role)}</span></td>
      <td>${new Date(u.created_at).toLocaleDateString()}</td>
      <td>
        <button class="btn btn-sm btn-edit" onclick="editUser(${u.id})">Editar</button>
        <button class="btn btn-sm btn-danger" onclick="deleteUser(${u.id})">Eliminar</button>
      </td>
    </tr>`
  ).join('');
}

function openUserModal(user = null) {
  $('userModalTitle').textContent = user ? 'Editar usuario' : 'Nuevo usuario';
  $('userId').value = user ? user.id : '';
  $('userUsername').value = user ? user.username : '';
  $('userPassword').value = '';
  $('userPassword').required = !user;
  $('userPassword').placeholder = user ? 'Dejar vacío para no cambiar' : '••••••';
  $('userRole').value = user ? user.role : 'response';
  $('userModal').classList.remove('hidden');
}

function closeUserModal() {
  $('userModal').classList.add('hidden');
}

$('addUserBtn').addEventListener('click', () => openUserModal());
$('closeUserModal').addEventListener('click', closeUserModal);

$('userForm').addEventListener('submit', async e => {
  e.preventDefault();
  const id = $('userId').value;
  const data = {
    username: $('userUsername').value.trim(),
    password: $('userPassword').value,
    role: $('userRole').value,
  };
  const res = id
    ? await api(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) })
    : await api('/users', { method: 'POST', body: JSON.stringify(data) });
  if (res.success || res.id) {
    closeUserModal();
    loadUsers();
    showToast(id ? 'Usuario actualizado' : 'Usuario creado');
  } else {
    showToast(res.error || 'Error al guardar');
  }
});

async function editUser(id) {
  const data = await api('/users');
  const user = data.find(u => u.id === id);
  if (user) openUserModal(user);
}

async function deleteUser(id) {
  if (!confirm('¿Eliminar este usuario?')) return;
  const res = await api(`/users/${id}`, { method: 'DELETE' });
  if (res.success) { loadUsers(); showToast('Usuario eliminado'); }
}

/* ── Menu Options ───────────────────────────────────────── */
const TYPE_LABELS = {
  text: 'Texto',
  submenu: 'Submenú',
  product_list: 'Productos',
  back: 'Volver',
};

const TYPE_ICONS = {
  submenu: '📂',
  product_list: '📋',
  text: '💬',
  back: '🔙',
};

function renderTree(items, parentKey, depth) {
  if (depth > 5) return '';
  const children = items.filter(m => m.parent_key === parentKey).sort((a, b) => a.sort_order - b.sort_order);
  if (children.length === 0) return '';
  let html = '<div class="tree-children">';
  children.forEach((m, idx) => {
    const label = `${m.icon || ''} ${m.label}`.trim();
    const typeIcon = TYPE_ICONS[m.response_type] || '';
    const typeLabel = TYPE_LABELS[m.response_type] || m.response_type;
    const hasKids = items.some(c => c.parent_key === m.trigger_key && c.enabled);
    html += `<div class="tree-node ${!m.enabled ? 'disabled' : ''} ${hasKids ? 'has-children' : ''}">
      <div class="node-content" onclick="editMenuItem(${m.id})">
        <div class="node-main">
          <code class="node-trigger">${m.trigger_key}</code>
          <span class="node-label">${label}</span>
        </div>
        <div class="node-meta">
          <span class="badge type-${m.response_type}">${typeIcon} ${typeLabel}</span>
          <span class="node-status ${m.enabled ? 'on' : 'off'}">${m.enabled ? '✓' : '✕'}</span>
        </div>
        <div class="node-actions" onclick="event.stopPropagation()">
          <button class="btn-icon edit" onclick="editMenuItem(${m.id})" title="Editar">✏️</button>
          <button class="btn-icon delete" onclick="deleteMenuItem(${m.id})" title="Eliminar">🗑️</button>
          <button class="btn-icon add" onclick="event.stopPropagation();openMenuModal({parent_key:'${m.trigger_key}',sort_order:0,response_type:'text',enabled:1,icon:'',label:'',response_text:'',trigger_key:''})" title="Agregar hijo">➕</button>
        </div>
      </div>
      ${hasKids ? renderTree(items, m.trigger_key, depth + 1) : ''}
    </div>`;
  });
  html += '</div>';
  return html;
}

async function loadMenuOptions() {
  const data = await api('/menu-options');
  if (data.error) return;
  const tree = `<div class="tree-root">
    <div class="tree-node root">
      <div class="node-content">
        <div class="node-main">
          <span class="node-label">📋 Menú Principal</span>
        </div>
        <div class="node-actions" onclick="event.stopPropagation()">
          <button class="btn-icon add" onclick="openMenuModal({parent_key:'',sort_order:0,response_type:'text',enabled:1,icon:'',label:'',response_text:'',trigger_key:''})" title="Agregar opción principal">➕</button>
        </div>
      </div>
      ${renderTree(data, '', 0)}
    </div>
  </div>`;
  $('menuTree').innerHTML = tree;
}

function openMenuModal(item = null) {
  $('menuModalTitle').textContent = item && item.id ? 'Editar opción de menú' : 'Nueva opción de menú';
  $('menuId').value = item ? (item.id || '') : '';
  $('menuTrigger').value = item ? item.trigger_key : '';
  $('menuLabel').value = item ? item.label : '';
  $('menuIcon').value = item ? item.icon : '';
  $('menuType').value = item ? item.response_type : 'text';
  $('menuOrder').value = item ? (item.sort_order || 0) : 0;
  $('menuEnabled').value = item ? (item.enabled ? 1 : 0) : 1;
  $('menuResponse').value = item ? item.response_text : '';

  // Build parent select from existing main menu items
  const sel = $('menuParent');
  sel.innerHTML = '<option value="">Principal</option>';
  const parentVal = item ? (item.parent_key || '') : '';
  api('/menu-options').then(data => {
    if (data && !data.error) {
      data.filter(m => m.parent_key === '' && m.response_type === 'submenu' && m.enabled).forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.trigger_key;
        opt.textContent = `${m.icon || ''} ${m.label}`.trim();
        sel.appendChild(opt);
      });
    }
    sel.value = parentVal;
  });

  $('menuModal').classList.remove('hidden');
}

function closeMenuModal() {
  $('menuModal').classList.add('hidden');
}

$('addMenuItemBtn').addEventListener('click', () => openMenuModal({
  parent_key: '', sort_order: 0, response_type: 'text', enabled: 1, icon: '', label: '', response_text: '', trigger_key: ''
}));
$('closeMenuModal').addEventListener('click', closeMenuModal);
document.querySelector('#menuModal .modal-backdrop')?.addEventListener('click', closeMenuModal);

$('menuForm').addEventListener('submit', async e => {
  e.preventDefault();
  const id = $('menuId').value;
  const data = {
    trigger_key: $('menuTrigger').value.trim(),
    label: $('menuLabel').value.trim(),
    icon: $('menuIcon').value.trim(),
    response_type: $('menuType').value,
    parent_key: $('menuParent').value,
    sort_order: parseInt($('menuOrder').value) || 0,
    enabled: parseInt($('menuEnabled').value),
    response_text: $('menuResponse').value.trim(),
  };
  const res = id
    ? await api(`/menu-options/${id}`, { method: 'PUT', body: JSON.stringify(data) })
    : await api('/menu-options', { method: 'POST', body: JSON.stringify(data) });
  if (res.success || res.id) {
    closeMenuModal();
    loadMenuOptions();
    showToast(id ? 'Opción actualizada' : 'Opción creada');
  } else {
    showToast(res.error || 'Error al guardar');
  }
});

async function editMenuItem(id) {
  const data = await api('/menu-options');
  const item = data.find(m => m.id === id);
  if (item) openMenuModal(item);
}

async function deleteMenuItem(id) {
  if (!confirm('¿Eliminar esta opción del menú?')) return;
  const res = await api(`/menu-options/${id}`, { method: 'DELETE' });
  if (res.success) { loadMenuOptions(); showToast('Opción eliminada'); }
}

/* ── WhatsApp ────────────────────────────────────────────── */
async function loadWhatsApp() {
  const status = await api('/whatsapp-status');
  const el = $('whatsappStatus');
  el.className = `whatsapp-status ${status.status}`;
  el.textContent = status.status === 'connected' ? '✅ Conectado' :
                   status.status === 'qr_ready' ? '📱 Escanea el código QR' :
                   status.status === 'disconnected' ? '❌ Desconectado' :
                   '⚠ Error';

  const dot = document.querySelector('.wa-dot');
  if (dot) {
    dot.className = 'wa-dot' + (status.status === 'connected' || status.status === 'qr_ready' || status.status === 'disconnected' ? ' ' + status.status : '');
  }

  $('waStopBtn').style.display = status.status === 'connected' || status.status === 'qr_ready' ? 'inline-block' : 'none';
  $('waStartBtn').style.display = status.status === 'disconnected' || status.status === 'error' ? 'inline-block' : 'none';
  $('waResetBtn').style.display = status.status === 'connected' || status.status === 'disconnected' || status.status === 'qr_ready' || status.status === 'error' ? 'inline-block' : 'none';

  if (status.qrCode) {
    const qrImg = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(status.qrCode)}&size=260x260`;
    $('whatsappQr').innerHTML = `<img src="${qrImg}" alt="QR Code">`;
    $('whatsappPairArea').style.display = 'block';
    $('pairBtn').disabled = false;
    $('pairBtn').textContent = '🔗 Vincular';
  } else {
    $('whatsappQr').innerHTML = '';
    $('whatsappPairArea').style.display = 'none';
  }

  loadConversations();
}

$('pairBtn').addEventListener('click', async () => {
  const phone = $('pairPhone').value.trim();
  if (!phone) { showToast('Ingresá un número de teléfono'); return; }
  $('pairBtn').disabled = true;
  $('pairBtn').textContent = '⏳ Generando código...';
  const res = await api('/whatsapp-pair', { method: 'POST', body: JSON.stringify({ phone }) });
  $('pairBtn').disabled = false;
  if (res.success && res.code) {
    $('pairCode').style.display = 'block';
    $('pairCode').innerHTML = `
      <div style="margin-top:12px;padding:16px;background:#0a0a14;border:1px solid #6c5ce7;border-radius:10px;text-align:center">
        <div style="font-size:12px;color:#999;margin-bottom:6px">Código de vinculación (8 dígitos)</div>
        <div style="font-size:32px;font-weight:800;font-family:monospace;letter-spacing:6px;color:#a78bfa">${res.code}</div>
        <div style="font-size:11px;color:#666;margin-top:8px">
          WhatsApp → Ajustes → Dispositivos vinculados → Vincular un dispositivo<br>
          Tocá "Vincular con número de teléfono" e ingresá este código
        </div>
      </div>
    `;
    showToast('Código generado — revisá WhatsApp');
  } else {
    showToast(res.error || 'Error al generar código');
  }
});

$('waStopBtn').addEventListener('click', async () => {
  if (!confirm('¿Detener WhatsApp?')) return;
  await api('/whatsapp-stop', { method: 'POST' });
  loadWhatsApp();
});

$('waStartBtn').addEventListener('click', async () => {
  $('waStartBtn').disabled = true;
  $('waStartBtn').textContent = '⏳ Conectando...';
  await api('/whatsapp-start', { method: 'POST' });
  setTimeout(loadWhatsApp, 2000);
});

$('waResetBtn').addEventListener('click', async () => {
  if (!confirm('¿Eliminar la sesión de WhatsApp?\n\nEsto borrará la sesión actual y te permitirá escanear un nuevo QR con otro número de teléfono.')) return;
  if (!confirm('⚠️ ¿Estás seguro? Se perderá el acceso al número actual.')) return;
  $('waResetBtn').disabled = true;
  $('waResetBtn').textContent = '⏳ Borrando sesión...';
  const res = await api('/whatsapp-reset', { method: 'POST' });
  $('waResetBtn').disabled = false;
  $('waResetBtn').textContent = '🔄 Cambiar cuenta';
  if (res.success) {
    $('whatsappQr').innerHTML = '';
    $('waConvList').innerHTML = '';
    $('waMainHeader').innerHTML = '<span>Seleccioná una conversación</span>';
    $('waMessages').innerHTML = '<div class="wa-empty">Haz clic en una conversación para ver los mensajes</div>';
  }
  loadWhatsApp(); // This will show the start button
});

async function loadConversations() {
  const convs = await api('/whatsapp-conversations');
  if (!convs || convs.error) return;

  const totalUnread = convs.reduce((s, c) => s + (c.unread || 0), 0);
  $('waUnreadCount').textContent = totalUnread;
  $('waUnreadCount').style.display = totalUnread ? 'inline' : 'none';

  const badge = document.querySelector('[data-tab="whatsapp"] .badge-msg');
  if (badge) {
    badge.textContent = totalUnread;
    badge.style.display = totalUnread ? 'inline-flex' : 'none';
  }

  $('waConvList').innerHTML = convs.map(c => {
    const cname = c.client_name && c.client_name !== c.number ? `${c.client_name} (${c.client_number})` : c.number;
    return `
    <div class="wa-conv-item ${c.unread > 0 ? 'unread' : ''}" onclick="openConversation('${c.number}')">
      <div class="wa-conv-top">
        <span class="wa-conv-number">${cname}</span>
        ${c.unread > 0 ? `<span class="wa-conv-unread">${c.unread}</span>` : ''}
      </div>
      <div class="wa-conv-preview">${c.last_message || ''}</div>
      <div class="wa-conv-date">${c.last_date ? new Date(c.last_date).toLocaleString() : ''}</div>
    </div>`;
  }).join('');
}

let currentConv = null;

async function openConversation(number) {
  currentConv = number;
  const msgs = await api(`/whatsapp-conversation/${encodeURIComponent(number)}`);
  if (!msgs || msgs.error) return;

  const unread = msgs.filter(m => !m.is_read).length;
  const client = await api(`/clients/by-phone/${encodeURIComponent(number)}`);
  const displayName = client && client.name && client.name !== number ? `${client.name} (${client.client_number})` : number;
  $('waMainHeader').innerHTML = `
    <span>${displayName} ${unread > 0 ? `<span class="wa-conv-unread" style="margin-left:8px">${unread} nuevos</span>` : ''}</span>
    <div class="wa-actions">
      <button class="wa-btn read" onclick="markRead('${number}')">✓ Leído</button>
      <button class="wa-btn unread" onclick="markUnread('${number}')">✗ No leído</button>
      <button class="wa-btn" style="color:#e17055;border-color:#e17055" onclick="deleteConversation('${number}')">🗑 Eliminar</button>
    </div>
  `;

  $('waMessages').innerHTML = msgs.map(m => {
    const time = new Date(m.created_at).toLocaleString();
    let bubbles = '';
    if (m.message) {
      bubbles += `<div class="wa-msg client"><div class="wa-bubble">${m.message}</div><div class="wa-msg-time">${time}</div></div>`;
    }
    if (m.response) {
      bubbles += `<div class="wa-msg bot"><div class="wa-bubble">${m.response}</div><div class="wa-msg-time">${time} ${m.is_read ? '✓' : ''}</div></div>`;
    }
    return bubbles;
  }).join('') + `
    <div class="wa-send-bar" id="waSendBar">
      <input type="text" id="waSendInput" class="wa-send-input" placeholder="Escribí un mensaje..." data-number="${number}">
      <button class="wa-btn-send" id="waSendBtn">Enviar</button>
    </div>
  `;

  $('waMessages').scrollTop = $('waMessages').scrollHeight;
}

document.addEventListener('click', async e => {
  if (e.target.id === 'waSendBtn') {
    const input = $('waSendInput');
    const number = input?.dataset.number;
    const text = input?.value.trim();
    if (!number || !text) return;
    input.disabled = true;
    const res = await api('/whatsapp-send', { method: 'POST', body: JSON.stringify({ number, message: text }) });
    input.disabled = false;
    if (res.success) {
      input.value = '';
      openConversation(number);
      showToast('Mensaje enviado');
    } else {
      showToast(res.error || 'Error al enviar');
    }
  }
});

document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.target.id === 'waSendInput') {
    document.getElementById('waSendBtn')?.click();
  }
});

async function markRead(number) {
  await api(`/whatsapp-conversation/${encodeURIComponent(number)}/read`, { method: 'PUT' });
  loadConversations();
  if (currentConv === number) openConversation(number);
}

async function markUnread(number) {
  await api(`/whatsapp-conversation/${encodeURIComponent(number)}/unread`, { method: 'PUT' });
  loadConversations();
}

async function deleteConversation(number) {
  if (!confirm('¿Eliminar todos los mensajes de esta conversación?')) return;
  await api(`/whatsapp-conversation/${encodeURIComponent(number)}`, { method: 'DELETE' });
  currentConv = null;
  $('waMainHeader').innerHTML = '<span>Seleccioná una conversación</span>';
  $('waMessages').innerHTML = '<div class="wa-empty">Haz clic en una conversación para ver los mensajes</div>';
  loadConversations();
}

function startWhatsAppPolling() {
  stopWhatsAppPolling();
  WHATSAPP_POLLER = setInterval(() => {
    loadConversations();
    if (currentConv) openConversation(currentConv);
  }, 5000);
}

function stopWhatsAppPolling() {
  if (WHATSAPP_POLLER) { clearInterval(WHATSAPP_POLLER); WHATSAPP_POLLER = null; }
}

function showToast(msg) {
  const t = document.createElement('div');
  t.style.cssText = 'position:fixed;bottom:24px;right:24px;background:#6c5ce7;color:#fff;padding:12px 20px;border-radius:8px;font-size:14px;z-index:9999;animation:fadeInUp .3s;box-shadow:0 4px 20px rgba(0,0,0,.3)';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .3s'; setTimeout(() => t.remove(), 300); }, 4000);
}

/* ── Panel de Control (Web Front Editor) ─────────────────── */
let pageSections = [];
let pageSectionOrder = [];

const SECTION_LABELS = {
  navbar: '🧭 Barra de navegación',
  hero: '🏠 Hero / Portada',
  stats: '📊 Estadísticas',
  services: '🛠️ Servicios',
  projects: '🚀 Proyectos',
  about: 'ℹ️ Sobre nosotros',
  footer: '📋 Pie de página',
  chatbot: '🤖 Chatbot',
};

async function loadControlPanel() {
  try {
    pageSections = await api('/page-content');
    const editor = $('pageEditor');
    if (!editor) return;
    if (!pageSections || pageSections.error) {
      editor.innerHTML = '<p style="color:#e17055">Error al cargar contenido</p>';
      return;
    }
    renderPageEditor(editor);
  } catch (err) {
    $('pageEditor').innerHTML = `<p style="color:#e17055">Error: ${err.message}</p>`;
  }
}

$('saveWebFrontBtn').addEventListener('click', saveWebFront);

async function saveWebFront() {
  const btn = $('saveWebFrontBtn');
  btn.disabled = true;
  btn.textContent = '⏳ Guardando...';
  let errors = [];
  for (const item of pageSections) {
    if (!item.id) { errors.push(`${item.section_key}/${item.item_key}: sin id`); continue; }
    const res = await api(`/page-content/${item.id}`, { method: 'PUT', body: JSON.stringify({ content: item.content }) });
    if (!res || !res.success) errors.push(`${item.section_key}/${item.item_key}: ${(res && res.error) || 'sin respuesta'}`);
  }
  if (errors.length === 0) {
    showToast('✅ Web Front guardado correctamente');
    loadControlPanel();
  } else {
    showToast('❌ Error en ' + errors.join(', '));
  }
  btn.disabled = false;
  btn.textContent = '💾 Save Web Front';
}

function renderPageEditor(container) {
  const grouped = {};
  pageSections.forEach(item => {
    if (!grouped[item.section_key]) grouped[item.section_key] = [];
    grouped[item.section_key].push(item);
  });

  let html = '';
  for (const [key, items] of Object.entries(grouped)) {
    const label = SECTION_LABELS[key] || `📄 ${key}`;
    items.sort((a, b) => a.sort_order - b.sort_order);
    html += `<div class="pe-section" data-section="${key}">
      <div class="pe-section-header" onclick="this.parentElement.classList.toggle('collapsed')">
        <span>${label}</span>
        <span class="pe-toggle">▼</span>
      </div>
      <div class="pe-section-body" data-section="${key}">`;
    items.forEach(item => {
      html += renderItemEditor(item);
    });
    html += `</div></div>`;
  }
  container.innerHTML = html;
  initDragDrop();
}

function initDragDrop() {
  document.querySelectorAll('.pe-card[draggable]').forEach(card => {
    card.addEventListener('dragstart', handleDragStart);
    card.addEventListener('dragend', handleDragEnd);
    card.addEventListener('dragover', handleDragOver);
    card.addEventListener('drop', handleDrop);
  });
}

let dragSrcId = null;

function handleDragStart(e) {
  dragSrcId = this.dataset.id;
  this.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd(e) {
  this.classList.remove('dragging');
  document.querySelectorAll('.pe-card').forEach(c => c.style.borderTop = '');
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  document.querySelectorAll('.pe-card').forEach(c => c.style.borderTop = '');
  this.style.borderTop = '2px solid #6c5ce7';
}

function handleDrop(e) {
  e.preventDefault();
  this.style.borderTop = '';
  const targetId = this.dataset.id;
  if (!dragSrcId || dragSrcId === targetId) return;

  const srcItem = pageSections.find(i => i.id === parseInt(dragSrcId));
  const tgtItem = pageSections.find(i => i.id === parseInt(targetId));
  if (!srcItem || !tgtItem || srcItem.section_key !== tgtItem.section_key) return;

  // Swap sort_order
  const tmp = srcItem.sort_order;
  srcItem.sort_order = tgtItem.sort_order;
  tgtItem.sort_order = tmp;

  // Save reorder to server
  api(`/page-content/${srcItem.id}/reorder`, { method: 'PUT', body: JSON.stringify({ sort_order: srcItem.sort_order }) });
  api(`/page-content/${tgtItem.id}/reorder`, { method: 'PUT', body: JSON.stringify({ sort_order: tgtItem.sort_order }) });

  renderPageEditor($('pageEditor'));
}

function renderItemEditor(item) {
  const c = item.content;
  if (!c || typeof c !== 'object') return '';
  const key = item.item_key;
  const section = item.section_key;
  const id = item.id;
  let html = `<div class="pe-card" data-id="${id}" draggable="true" data-section="${section}" data-item="${key}">
    <div class="pe-card-header" onclick="this.parentElement.classList.toggle('collapsed')">
      <span class="pe-drag-handle" title="Arrastrar para reordenar">⠿</span>
      <span class="pe-card-title">${key}</span>
      <span class="pe-toggle">▼</span>
    </div>
    <div class="pe-card-body">`;

  if (section === 'navbar') {
    html += navbarEditor(id, c, key);
  } else if (section === 'hero') {
    html += heroEditor(id, c, key);
  } else if (section === 'stats') {
    html += statsEditor(id, c, key);
  } else if (section === 'services') {
    html += servicesEditor(id, c, key);
  } else if (section === 'projects') {
    html += projectsEditor(id, c, key);
  } else if (section === 'about') {
    html += aboutEditor(id, c, key);
  } else if (section === 'footer') {
    html += footerEditor(id, c, key);
  } else if (section === 'chatbot') {
    html += chatbotEditor(id, c, key);
  } else {
    html += genericEditor(id, c, key);
  }

  html += `</div></div>`;
  return html;
}

function getNested(obj, path) {
  return path.split('.').reduce((o, p) => o ? o[p] : null, obj);
}

function setNested(obj, path, value) {
  const parts = path.split('.');
  let o = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!o[parts[i]]) o[parts[i]] = {};
    o = o[parts[i]];
  }
  o[parts[parts.length - 1]] = value;
}

// Global input delegation — updates pageSections on every keystroke
document.addEventListener('input', e => {
  if (!e.target.closest('#pageEditor')) return;
  const bind = e.target.dataset.bind;
  if (!bind) return;
  const sep = bind.indexOf(':');
  if (sep === -1) return;
  const id = parseInt(bind.substring(0, sep));
  const path = bind.substring(sep + 1);
  const item = pageSections.find(i => i.id === id);
  if (!item) return;
  setNested(item.content, path, e.target.value);
});

function textInput(id, path, label, value, placeholder = '') {
  const v = typeof value === 'string' ? value.replace(/"/g, '&quot;') : (value || '');
  return `<div class="pe-field"><label>${label}</label><input type="text" class="pe-input" data-bind="${id}:${path}" value="${v}" placeholder="${placeholder}"></div>`;
}

function textareaInput(id, path, label, value, placeholder = '') {
  return `<div class="pe-field"><label>${label}</label><textarea class="pe-input pe-textarea" data-bind="${id}:${path}" placeholder="${placeholder}">${value || ''}</textarea></div>`;
}

function colorInput(id, path, label, value) {
  return `<div class="pe-field pe-field-sm"><label>${label}</label><input type="color" class="pe-color" data-bind="${id}:${path}" value="${value || '#000000'}"></div>`;
}

function imageUploader(id, path, label, currentUrl) {
  const preview = currentUrl ? `<img src="${currentUrl}" class="pe-img-preview" style="max-width:120px;max-height:80px;border-radius:6px">` : '';
  return `<div class="pe-field">
    <label>${label}</label>
    <div class="pe-img-upload" data-bind="${id}:${path}">
      ${preview}
      <input type="text" class="pe-input" value="${currentUrl || ''}" placeholder="URL o subí una imagen" data-bind="${id}:${path}">
      <button class="btn btn-sm" onclick="uploadImage(this, '${id}', '${path}')">📁 Subir</button>
      <input type="file" accept="image/*" style="display:none" onchange="handleFileUpload(this, '${id}', '${path}')">
    </div>
  </div>`;
}

async function uploadImage(btn, id, path) {
  const fileInput = btn.nextElementSibling;
  fileInput.click();
}

async function handleFileUpload(input, id, path) {
  const file = input.files[0];
  if (!file) return;
  const formData = new FormData();
  formData.append('file', file);
  try {
    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    const data = await res.json();
    if (data.url) {
      const textInput = input.parentElement.querySelector('input[type="text"]');
      if (textInput) textInput.value = data.url;
      const item = pageSections.find(i => i.id === id);
      if (item) setNested(item.content, path, data.url);
      // Update preview
      const preview = input.parentElement.querySelector('.pe-img-preview');
      if (preview) { preview.src = data.url; }
      else {
        const img = document.createElement('img');
        img.src = data.url;
        img.className = 'pe-img-preview';
        img.style.cssText = 'max-width:120px;max-height:80px;border-radius:6px';
        input.parentElement.insertBefore(img, input);
      }
      showToast('✅ Imagen subida');
    }
  } catch (err) {
    showToast('❌ Error: ' + err.message);
  }
  input.value = '';
}

/* ── Section-specific editors ──────────────────────────── */

function navbarEditor(id, c, key) {
  let html = textInput(id, 'site_name', 'Nombre del sitio', c.site_name, 'WebMerge Studio');
  html += imageUploader(id, 'logo', 'Logo', c.logo);
  html += `<div class="pe-field"><label>Botones de navegación</label><div class="pe-array" id="navItems-${id}">`;
  if (c.items && c.items.length) {
    c.items.forEach((item, i) => {
      html += `<div class="pe-array-item">
        <input type="text" class="pe-input pe-array-input" value="${item.label}" placeholder="Texto" data-bind="${id}:items.${i}.label">
        <input type="text" class="pe-input pe-array-input" value="${item.href}" placeholder="#seccion" data-bind="${id}:items.${i}.href">
        <button class="btn-icon delete" onclick="removeNavItem(${id}, ${i})">✕</button>
      </div>`;
    });
  }
  html += `</div><button class="btn btn-sm" onclick="addNavItem(${id})" style="margin-top:6px">+ Agregar botón</button></div>`;
  return html;
}

function heroEditor(id, c, key) {
  let html = textInput(id, 'title', 'Título principal', c.title);
  html += textInput(id, 'title_highlight', 'Título destacado (color)', c.title_highlight);
  html += textInput(id, 'subtitle', 'Subtítulo', c.subtitle);
  html += textareaInput(id, 'description', 'Descripción', c.description);
  html += `<div class="pe-field-row">`;
  html += textInput(id, 'cta_primary.text', 'Botón 1 — texto', c.cta_primary?.text);
  html += textInput(id, 'cta_primary.href', 'Botón 1 — link', c.cta_primary?.href);
  html += `</div><div class="pe-field-row">`;
  html += textInput(id, 'cta_secondary.text', 'Botón 2 — texto', c.cta_secondary?.text);
  html += textInput(id, 'cta_secondary.href', 'Botón 2 — link', c.cta_secondary?.href);
  html += `</div>`;
  return html;
}

function statsEditor(id, c, key) {
  let html = textInput(id, 'icon', 'Icono (emoji)', c.icon);
  html += textInput(id, 'value', 'Valor', c.value);
  html += textInput(id, 'label', 'Etiqueta', c.label);
  return html;
}

function servicesEditor(id, c, key) {
  let html = textInput(id, 'icon', 'Icono (emoji)', c.icon);
  html += textInput(id, 'title', 'Título', c.title);
  html += textareaInput(id, 'description', 'Descripción', c.description);
  html += `<div class="pe-field"><label>Características</label><div class="pe-array" id="features-${id}">`;
  if (c.features && c.features.length) {
    c.features.forEach((f, i) => {
      html += `<div class="pe-array-item">
        <input type="text" class="pe-input pe-array-input" value="${f}" data-bind="${id}:features.${i}">
        <button class="btn-icon delete" onclick="removeArrayItem('features', ${id}, ${i})">✕</button>
      </div>`;
    });
  }
  html += `</div><button class="btn btn-sm" onclick="addArrayItem('features', ${id})" style="margin-top:6px">+ Agregar característica</button></div>`;
  html += imageUploader(id, 'image_url', 'Imagen', c.image_url);
  return html;
}

function projectsEditor(id, c, key) {
  let html = textInput(id, 'icon', 'Icono (emoji)', c.icon);
  html += textInput(id, 'tag', 'Etiqueta / Categoría', c.tag);
  html += textInput(id, 'title', 'Título', c.title);
  html += textareaInput(id, 'description', 'Descripción', c.description);
  html += textInput(id, 'link', 'Link del proyecto', c.link);
  html += `<div class="pe-field"><label>Tecnologías</label><div class="pe-array" id="tech-${id}">`;
  if (c.tech && c.tech.length) {
    c.tech.forEach((t, i) => {
      html += `<div class="pe-array-item">
        <input type="text" class="pe-input pe-array-input" value="${t}" data-bind="${id}:tech.${i}">
        <button class="btn-icon delete" onclick="removeArrayItem('tech', ${id}, ${i})">✕</button>
      </div>`;
    });
  }
  html += `</div><button class="btn btn-sm" onclick="addArrayItem('tech', ${id})" style="margin-top:6px">+ Agregar tecnología</button></div>`;
  return html;
}

function aboutEditor(id, c, key) {
  if (key === 'mission') {
    let html = textInput(id, 'title', 'Título', c.title);
    html += textareaInput(id, 'text', 'Texto', c.text);
    return html;
  }
  if (key === 'values' || key.startsWith('values')) {
    let html = textInput(id, 'icon', 'Icono (emoji)', c.icon);
    html += textInput(id, 'title', 'Título', c.title);
    html += textareaInput(id, 'text', 'Texto', c.text);
    return html;
  }
  if (key === 'team_stats') {
    let html = '';
    if (c.items && c.items.length) {
      c.items.forEach((item, i) => {
        html += `<div class="pe-field-row">`;
        html += textInput(id, `items.${i}.value`, `Valor ${i+1}`, item.value);
        html += textInput(id, `items.${i}.label`, `Label ${i+1}`, item.label);
        html += `</div>`;
      });
    }
    return html;
  }
  return genericEditor(id, c, key);
}

function footerEditor(id, c, key) {
  let html = textInput(id, 'brand', 'Marca', c.brand);
  html += textareaInput(id, 'description', 'Descripción', c.description);
  html += textInput(id, 'copyright', 'Copyright', c.copyright);
  if (c.social) {
    html += `<div class="pe-field"><label>Redes sociales</label><div class="pe-social">`;
    Object.entries(c.social).forEach(([platform, url]) => {
      html += `<div class="pe-array-item">
        <span class="pe-social-label">${platform}</span>
        <input type="text" class="pe-input pe-array-input" value="${url}" data-bind="${id}:social.${platform}" placeholder="URL">
      </div>`;
    });
    html += `</div></div>`;
  }
  return html;
}

function chatbotEditor(id, c, key) {
  let html = textInput(id, 'name', 'Nombre del bot', c.name);
  html += textareaInput(id, 'greeting', 'Mensaje de bienvenida', c.greeting);
  html += imageUploader(id, 'logo', 'Logo del chat', c.logo);
  if (c.theme) {
    html += `<div class="pe-field-row">`;
    html += colorInput(id, 'theme.primary', 'Color primario', c.theme.primary);
    html += colorInput(id, 'theme.secondary', 'Color secundario', c.theme.secondary);
    html += `</div><div class="pe-field-row">`;
    html += colorInput(id, 'theme.bg', 'Fondo', c.theme.bg);
    html += colorInput(id, 'theme.text', 'Texto', c.theme.text);
    html += `</div>`;
  }
  return html;
}

function genericEditor(id, c, key) {
  let html = '';
  for (const [k, v] of Object.entries(c)) {
    if (typeof v === 'string') {
      html += textInput(id, k, k, v);
    }
  }
  return html;
}

/* ── Array helpers ─────────────────────────────────────── */

function addNavItem(id) {
  const item = pageSections.find(i => i.id === id);
  if (!item) return;
  if (!item.content.items) item.content.items = [];
  item.content.items.push({ label: '', href: '' });
  loadControlPanel();
}

function removeNavItem(id, index) {
  const item = pageSections.find(i => i.id === id);
  if (!item) return;
  item.content.items.splice(index, 1);
  loadControlPanel();
}

function addArrayItem(field, id) {
  const item = pageSections.find(i => i.id === id);
  if (!item) return;
  if (!item.content[field]) item.content[field] = [];
  item.content[field].push('');
  loadControlPanel();
}

function removeArrayItem(field, id, index) {
  const item = pageSections.find(i => i.id === id);
  if (!item) return;
  if (item.content[field]) item.content[field].splice(index, 1);
  loadControlPanel();
}

/* ── Auto-login check ────────────────────────────────────── */
(async () => {
  const saved = localStorage.getItem('wms_token');
  if (saved) {
    try {
      const res = await fetch('/api/admin/verify', {
        headers: { 'Authorization': `Bearer ${saved}` }
      });
      const data = await res.json();
      if (data.valid) {
        TOKEN = saved;
        USER = data.user;
        $('userBadge').textContent = `${data.user.username} (${roleLabel(data.user.role)})`;
        $('userTitleRole').textContent = `— ${data.user.username} (${roleLabel(data.user.role)})`;
        showView('dashboardView');
        loadDashboard();
        return;
      }
    } catch {}
  }
  showView('loginView');
})();

window.addEventListener('beforeunload', () => {
  if (TOKEN) localStorage.setItem('wms_token', TOKEN);
});
