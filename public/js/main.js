const API = '/api';
let tokenSesion = localStorage.getItem('token');
let productosCache = [];
let carritoActual = [];
let categoriaActiva = 'todas';
let paginaActual = 1;

const FALLBACK_PRODUCTOS = [
  {"id":1,"nombre":"Auriculares Bluetooth Pro","precio":89.99,"descripcion":"Auriculares inalámbricos con cancelación de ruido activa.","categoria":"electronica","stock":25,"imagen":"https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop","valoraciones":4.5},
  {"id":2,"nombre":"Smartwatch Deportivo","precio":199.99,"descripcion":"Reloj inteligente con GPS y monitor cardíaco.","categoria":"electronica","stock":30,"imagen":"https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop","valoraciones":4.7},
  {"id":5,"nombre":"Teclado Mecánico RGB","precio":129.99,"descripcion":"Teclado mecánico con switches Cherry MX y RGB.","categoria":"informatica","stock":15,"imagen":"https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&h=400&fit=crop","valoraciones":4.8}
];

function init() {
  console.log('[TechStore] Inicializando...');
  if (tokenSesion) verificarSesion();
  cargarProductos();
  configurarNavegacion();
  configurarChat();
  configurarTeclado();
}

function configurarChat() {
  const btn = document.getElementById('chatbotToggle');
  const close = document.getElementById('chatClose');
  const win = document.getElementById('chatWindow');
  if (btn) btn.addEventListener('click', () => win?.classList.toggle('open'));
  if (close) close.addEventListener('click', () => win?.classList.remove('open'));
}

function configurarTeclado() {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.toast').forEach(t => t.remove());
      document.getElementById('chatWindow')?.classList.remove('open');
    }
  });
}

document.addEventListener('DOMContentLoaded', init);

function mostrarSeccion(id) {
  document.querySelectorAll('.seccion').forEach(s => s.classList.remove('activa'));
  document.querySelectorAll('.nav-link[data-seccion]').forEach(l => l.classList.remove('active'));

  const seccion = document.getElementById(`seccion-${id}`);
  if (seccion) seccion.classList.add('activa');

  const link = document.querySelector(`.nav-link[data-seccion="${id}"]`);
  if (link) link.classList.add('active');

  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (id === 'carrito') cargarCarrito();
  if (id === 'checkout') cargarResumenCheckout();
}

function configurarNavegacion() {
  document.querySelectorAll('.nav-link[data-seccion]').forEach(link => {
    link.addEventListener('click', () => mostrarSeccion(link.dataset.seccion));
  });

  const toggle = document.getElementById('mobileToggle');
  const nav = document.getElementById('navLinks');
  if (toggle) toggle.addEventListener('click', function() {
    nav?.classList.toggle('active');
    this.classList.toggle('active');
  });

  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      nav?.classList.remove('active');
      toggle?.classList.remove('active');
    });
  });

  window.addEventListener('scroll', () => {
    const header = document.getElementById('navbar');
    if (header) header.classList.toggle('scrolled', window.scrollY > 50);

    const btn = document.getElementById('backToTop');
    if (btn) btn.classList.toggle('show', window.scrollY > 400);
  });

  const topBtn = document.getElementById('backToTop');
  if (topBtn) topBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

async function apiFetch(url, options = {}) {
  const config = {
    headers: { 'Content-Type': 'application/json' },
    ...options
  };
  if (tokenSesion) {
    config.headers['Authorization'] = `Bearer ${tokenSesion}`;
  }
  try {
    const res = await fetch(`${API}${url}`, config);
    const data = await res.json();
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    console.error('[TechStore] Error de conexión:', err);
    return { ok: false, status: 0, data: { error: 'Error de conexión' } };
  }
}

function mostrarToast(mensaje, tipo = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${tipo}`;
  toast.textContent = mensaje;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'toastOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

async function cargarProductos() {
  console.log('[TechStore] Cargando productos...');
  const loader = document.getElementById('loaderCatalogo');
  const grid = document.getElementById('catalogoGrid');
  if (!grid) { console.warn('[TechStore] #catalogoGrid no encontrado'); return; }
  if (loader) loader.style.display = 'flex';

  let productos = [];
  let categorias = [];

  try {
    const params = new URLSearchParams({
      pagina: paginaActual,
      por_pagina: 50,
      categoria: categoriaActiva,
      busqueda: document.getElementById('searchInput')?.value || ''
    });

    const result = await apiFetch(`/productos?${params}`);
    if (loader) loader.style.display = 'none';

    if (result.ok && result.data && result.data.productos) {
      productos = result.data.productos;
      categorias = result.data.categorias || [];
      console.log(`[TechStore] ${productos.length} productos cargados desde API`);
    } else {
      throw new Error(result.data?.error || 'API respondió con error');
    }
  } catch (err) {
    console.warn('[TechStore] Usando datos de fallback:', err.message);
    productos = FALLBACK_PRODUCTOS;
    categorias = [...new Set(productos.map(p => p.categoria))];
    if (loader) loader.style.display = 'none';
  }

  productosCache = productos;

  if (!productos || productos.length === 0) {
    grid.innerHTML = `
      <div class="carrito-empty" style="grid-column:1/-1">
        <div class="icon">📦</div>
        <h3>No se encontraron productos</h3>
        <p>Intenta con otros filtros</p>
      </div>`;
    return;
  }

  grid.innerHTML = productos.map(p => `
    <div class="product-card">
      <div class="product-img-wrap">
        <img src="${p.imagen}" alt="${p.nombre}" loading="lazy" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22400%22><rect fill=%22%2313131a%22 width=%22400%22 height=%22400%22/><text fill=%22%236c5ce7%22 font-size=%2220%22 x=%22150%22 y=%22210%22>📦</text></svg>'">
        <span class="stock-badge ${p.stock <= 0 ? 'agotado' : p.stock < 10 ? 'bajo' : 'disponible'}">
          ${p.stock <= 0 ? 'Agotado' : p.stock < 10 ? `Stock: ${p.stock}` : 'Disponible'}
        </span>
      </div>
      <div class="product-info">
        <span class="product-categoria">${p.categoria}</span>
        <h3 class="product-nombre">${p.nombre}</h3>
        <p class="product-desc">${p.descripcion || ''}</p>
        <div class="product-bottom">
          <span class="product-precio">${(p.precio || 0).toFixed(2)}</span>
          <button class="btn btn-primary btn-sm add-cart" data-id="${p.id}" ${p.stock <= 0 ? 'disabled' : ''}>
            ${p.stock <= 0 ? 'Agotado' : 'Agregar'}
          </button>
        </div>
      </div>
    </div>
  `).join('');

  document.querySelectorAll('.add-cart').forEach(btn => {
    btn.addEventListener('click', async function() {
      const id = parseInt(this.dataset.id);
      await agregarAlCarrito(id);
    });
  });

  renderizarFiltros(categorias);
  actualizarBadgeCarrito();

  if (typeof AOS !== 'undefined') AOS.refresh();
  console.log('[TechStore] Productos renderizados correctamente');
}

function renderizarFiltros(categorias) {
  const container = document.getElementById('filtrosCategoria');
  if (!container) return;
  let html = `<button class="filtro-btn ${categoriaActiva === 'todas' ? 'active' : ''}" data-cat="todas">Todas</button>`;
  [...new Set(categorias)].forEach(cat => {
    const label = cat ? cat.charAt(0).toUpperCase() + cat.slice(1) : cat;
    html += `<button class="filtro-btn ${categoriaActiva === cat ? 'active' : ''}" data-cat="${cat}">${label}</button>`;
  });
  container.innerHTML = html;
  container.querySelectorAll('.filtro-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      categoriaActiva = btn.dataset.cat;
      paginaActual = 1;
      cargarProductos();
    });
  });
}

function debounceBusqueda() {
  clearTimeout(window.searchTimer);
  window.searchTimer = setTimeout(() => {
    paginaActual = 1;
    cargarProductos();
  }, 300);
}

async function agregarAlCarrito(id) {
  if (!tokenSesion) {
    mostrarSeccion('login');
    mostrarToast('Inicia sesión para agregar productos', 'error');
    return;
  }
  const result = await apiFetch('/carrito/agregar', {
    method: 'POST',
    body: JSON.stringify({ producto_id: id, cantidad: 1 })
  });
  if (result.ok) {
    mostrarToast(result.data.mensaje || 'Producto agregado al carrito', 'success');
    actualizarBadgeCarrito();
  } else {
    mostrarToast(result.data.error || 'Error al agregar', 'error');
  }
}

async function actualizarBadgeCarrito() {
  const badge = document.getElementById('cartBadge');
  if (!badge) return;
  if (!tokenSesion) {
    badge.textContent = '0';
    return;
  }
  const result = await apiFetch('/carrito');
  if (result.ok && result.data.items) {
    const count = result.data.items.reduce((s, i) => s + i.cantidad, 0);
    badge.textContent = count;
    badge.classList.remove('pulse');
    void badge.offsetWidth;
    badge.classList.add('pulse');
  }
}

async function cargarCarrito() {
  const empty = document.getElementById('carritoEmpty');
  const items = document.getElementById('carritoItems');
  const footer = document.getElementById('carritoFooter');
  if (!empty || !items || !footer) return;

  if (!tokenSesion) {
    empty.style.display = 'block';
    items.style.display = 'none';
    footer.style.display = 'none';
    return;
  }

  const result = await apiFetch('/carrito');
  if (!result.ok || !result.data.items || result.data.items.length === 0) {
    empty.style.display = 'block';
    items.style.display = 'none';
    footer.style.display = 'none';
    return;
  }

  empty.style.display = 'none';
  items.style.display = 'flex';
  footer.style.display = 'block';

  carritoActual = result.data.items;

  items.innerHTML = result.data.items.map(item => `
    <div class="carrito-item" data-id="${item.producto_id}">
      <img src="${item.producto.imagen}" alt="${item.producto.nombre}" class="carrito-item-img">
      <div class="carrito-item-info">
        <div class="carrito-item-nombre">${item.producto.nombre}</div>
        <div class="carrito-item-precio">$${(item.producto.precio * item.cantidad).toFixed(2)}</div>
      </div>
      <div class="carrito-item-qty">
        <button class="qty-btn" onclick="cambiarCantidad(${item.producto_id}, -1)">−</button>
        <span class="qty-value">${item.cantidad}</span>
        <button class="qty-btn" onclick="cambiarCantidad(${item.producto_id}, 1)">+</button>
      </div>
      <div class="carrito-item-subtotal">$${item.subtotal.toFixed(2)}</div>
      <button class="carrito-remove" onclick="eliminarDelCarrito(${item.producto_id})">✕</button>
    </div>
  `).join('');

  const totalEl = document.getElementById('carritoTotal');
  if (totalEl) totalEl.textContent = `$${result.data.total.toFixed(2)}`;
}

async function cambiarCantidad(id, delta) {
  const item = carritoActual.find(i => i.producto_id === id);
  if (!item) return;
  const nueva = Math.max(1, item.cantidad + delta);
  const result = await apiFetch('/carrito/actualizar', {
    method: 'POST',
    body: JSON.stringify({ producto_id: id, cantidad: nueva })
  });
  if (result.ok) {
    cargarCarrito();
    actualizarBadgeCarrito();
  }
}

async function eliminarDelCarrito(id) {
  const result = await apiFetch(`/carrito/${id}`, { method: 'DELETE' });
  if (result.ok) {
    cargarCarrito();
    actualizarBadgeCarrito();
    mostrarToast('Producto eliminado del carrito', 'info');
  }
}

async function irACheckout() {
  const result = await apiFetch('/carrito');
  if (!result.ok || !result.data.items || result.data.items.length === 0) {
    mostrarToast('Agrega productos al carrito primero', 'error');
    return;
  }
  mostrarSeccion('checkout');
  cargarResumenCheckout();
}

function cargarResumenCheckout() {
  const container = document.getElementById('resumenItems');
  const total = document.getElementById('resumenTotal');
  if (!container || !total) return;
  if (!carritoActual.length) {
    mostrarSeccion('carrito');
    return;
  }
  container.innerHTML = carritoActual.map(item => `
    <div class="resumen-item">
      <span>${item.producto.nombre} × ${item.cantidad}</span>
      <span>$${item.subtotal.toFixed(2)}</span>
    </div>
  `).join('');
  total.textContent = `$${carritoActual.reduce((s, i) => s + i.subtotal, 0).toFixed(2)}`;
}

function formatearTarjeta(input) {
  let val = input.value.replace(/\D/g, '').slice(0, 16);
  val = val.replace(/(.{4})/g, '$1 ').trim();
  input.value = val;
}

async function procesarCheckout(e) {
  e.preventDefault();
  const btn = document.getElementById('checkoutBtn');
  if (!btn) return false;
  btn.textContent = 'Procesando...';
  btn.disabled = true;

  const data = {
    nombre: document.getElementById('checkoutNombre')?.value?.trim() || '',
    email: document.getElementById('checkoutEmail')?.value?.trim() || '',
    direccion: document.getElementById('checkoutDireccion')?.value?.trim() || '',
    tarjeta: (document.getElementById('checkoutTarjeta')?.value || '').replace(/\s/g, '')
  };

  if (!data.nombre || !data.email || !data.direccion || data.tarjeta.length < 13) {
    mostrarToast('Completa todos los campos correctamente', 'error');
    btn.textContent = 'Confirmar Pedido';
    btn.disabled = false;
    return false;
  }

  const result = await apiFetch('/checkout', {
    method: 'POST',
    body: JSON.stringify(data)
  });

  btn.textContent = 'Confirmar Pedido';
  btn.disabled = false;

  if (result.ok) {
    const form = document.getElementById('checkoutForm');
    const success = document.getElementById('checkoutSuccess');
    const pid = document.getElementById('pedidoId');
    if (form) form.style.display = 'none';
    if (success) success.style.display = 'block';
    if (pid) pid.textContent = `Pedido #${result.data.pedido_id}`;
    carritoActual = [];
    actualizarBadgeCarrito();
    mostrarToast('¡Pedido confirmado exitosamente!', 'success');
  } else {
    mostrarToast(result.data.error || 'Error al procesar el pedido', 'error');
  }
  return false;
}

async function iniciarSesion(e) {
  e.preventDefault();
  const usuario = document.getElementById('loginUsuario')?.value?.trim();
  const password = document.getElementById('loginPassword')?.value;
  if (!usuario || !password) {
    mostrarToast('Ingresa usuario y contraseña', 'error');
    return false;
  }
  const result = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ usuario, password })
  });
  if (result.ok) {
    tokenSesion = result.data.token;
    localStorage.setItem('token', tokenSesion);
    mostrarToast(`¡Bienvenido, ${result.data.usuario.nombre}!`, 'success');
    verificarSesion();
    mostrarSeccion('catalogo');
    actualizarBadgeCarrito();
  } else {
    mostrarToast(result.data.error || 'Credenciales inválidas', 'error');
  }
  return false;
}

async function verificarSesion() {
  if (!tokenSesion) return;
  const result = await apiFetch('/auth/session');
  if (result.ok) {
    const user = result.data.usuario;
    const loginLink = document.getElementById('loginLink');
    const perfilLink = document.getElementById('perfilLink');
    const userName = document.getElementById('userName');
    const perfilNombre = document.getElementById('perfilNombre');
    const perfilEmail = document.getElementById('perfilEmail');
    const perfilRol = document.getElementById('perfilRol');

    if (loginLink) loginLink.style.display = 'none';
    if (perfilLink) perfilLink.style.display = 'block';
    if (userName) userName.textContent = user.nombre;
    if (perfilNombre) perfilNombre.textContent = user.nombre;
    if (perfilEmail) perfilEmail.textContent = user.email || '';
    if (perfilRol) {
      perfilRol.textContent = `Rol: ${user.rol}`;
      if (user.rol === 'admin') {
        perfilRol.innerHTML += ' · <a href="/admin/" style="color:var(--primary)">Panel Admin</a>';
      }
    }
    actualizarBadgeCarrito();
  } else {
    cerrarSesion();
  }
}

function cerrarSesion() {
  tokenSesion = null;
  localStorage.removeItem('token');
  const loginLink = document.getElementById('loginLink');
  const perfilLink = document.getElementById('perfilLink');
  if (loginLink) loginLink.style.display = 'block';
  if (perfilLink) perfilLink.style.display = 'none';
  carritoActual = [];
  actualizarBadgeCarrito();
  mostrarToast('Sesión cerrada', 'info');
  mostrarSeccion('catalogo');
}

async function enviarChat() {
  const input = document.getElementById('chatInput');
  const messages = document.getElementById('chatMessages');
  if (!input || !messages) return;
  const msg = input.value.trim();
  if (!msg) return;

  const userDiv = document.createElement('div');
  userDiv.className = 'chat-msg user';
  userDiv.textContent = msg;
  messages.appendChild(userDiv);
  messages.scrollTop = messages.scrollHeight;
  input.value = '';

  const result = await apiFetch('/chat', {
    method: 'POST',
    body: JSON.stringify({ mensaje: msg })
  });

  const botDiv = document.createElement('div');
  botDiv.className = 'chat-msg bot';
  botDiv.textContent = result.data?.respuesta || 'Gracias por tu mensaje. Te responderemos pronto.';
  messages.appendChild(botDiv);
  messages.scrollTop = messages.scrollHeight;
}

/* === Contact Form (from web_cursor) === */
function enviarContacto(e) {
  e.preventDefault();
  const form = document.getElementById('contactForm');
  const success = document.getElementById('contactSuccess');
  if (form) form.style.display = 'none';
  if (success) success.style.display = 'flex';
  mostrarToast('¡Mensaje enviado exitosamente!', 'success');
  return false;
}

function resetContactForm() {
  const form = document.getElementById('contactForm');
  const success = document.getElementById('contactSuccess');
  if (form) {
    form.reset();
    form.style.display = 'flex';
  }
  if (success) success.style.display = 'none';
}
