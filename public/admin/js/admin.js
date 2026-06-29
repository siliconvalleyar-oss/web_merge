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
    $('userBadge').textContent = `${data.user.username} (${data.user.role})`;
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
    if (tab.dataset.tab === 'whatsapp') { loadWhatsApp(); startWhatsAppPolling(); }
    if (tab.dataset.tab === 'config') loadConfig();
  });
});

/* ── Dashboard loader ────────────────────────────────────── */
async function loadDashboard() {
  loadFAQs();
  loadConfig();
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

/* ── Config ──────────────────────────────────────────────── */
async function loadConfig() {
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
    }
  } catch {}
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

/* ── WhatsApp ────────────────────────────────────────────── */
async function loadWhatsApp() {
  const status = await api('/whatsapp-status');
  const el = $('whatsappStatus');
  el.className = `whatsapp-status ${status.status}`;
  el.textContent = status.status === 'connected' ? '✅ Conectado' :
                   status.status === 'qr_ready' ? '📱 Escanea el código QR' :
                   status.status === 'disconnected' ? '❌ Desconectado' :
                   '⚠ Error de conexión';

  if (status.qrCode) {
    const qrImg = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(status.qrCode)}&size=260x260`;
    $('whatsappQr').innerHTML = `<img src="${qrImg}" alt="QR Code para WhatsApp">`;
  } else {
    $('whatsappQr').innerHTML = '';
  }

  const msgs = await api('/whatsapp-messages');
  if (msgs && !msgs.error) {
    if (msgs.length > LAST_MSG_COUNT && LAST_MSG_COUNT > 0) {
      const nuevas = msgs.length - LAST_MSG_COUNT;
      showToast(`${nuevas} mensaje${nuevas > 1 ? 's' : ''} nuevo${nuevas > 1 ? 's' : ''} de WhatsApp`);
    }
    LAST_MSG_COUNT = msgs.length;
    const badge = document.querySelector('[data-tab="whatsapp"] .badge-msg');
    if (badge) badge.textContent = msgs.filter(m => !m.is_read).length;

    $('whatsappBody').innerHTML = msgs.map(m =>
      `<tr>
        <td class="nowrap">${new Date(m.created_at).toLocaleString()}</td>
        <td><strong>${m.number}</strong></td>
        <td>${m.message}</td>
        <td style="color:var(--color-text-muted,#9999aa);font-size:13px">${m.response ? m.response.substring(0, 80) + '…' : '—'}</td>
      </tr>`
    ).join('');
  }
}

function startWhatsAppPolling() {
  stopWhatsAppPolling();
  WHATSAPP_POLLER = setInterval(loadWhatsApp, 5000);
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
        $('userBadge').textContent = `${data.user.username} (${data.user.role})`;
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
