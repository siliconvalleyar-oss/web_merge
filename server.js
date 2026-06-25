const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 8080;
const DATA_DIR = path.join(__dirname, 'data');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function leerJSON(archivo) {
  const ruta = path.join(DATA_DIR, archivo);
  if (!fs.existsSync(ruta)) return [];
  return JSON.parse(fs.readFileSync(ruta, 'utf-8'));
}

function guardarJSON(archivo, data) {
  fs.writeFileSync(path.join(DATA_DIR, archivo), JSON.stringify(data, null, 2));
}

const sesiones = {};
const carritos = {};
const refreshTokens = {};
const ACCESS_TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 horas
const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 días
const BCRYPT_ROUNDS = 12;

function generarToken() {
  return crypto.randomBytes(32).toString('hex');
}

function generarTokenExpirado() {
  return {
    accessToken: crypto.randomBytes(32).toString('hex'),
    refreshToken: crypto.randomBytes(48).toString('hex'),
    accessExpiresAt: Date.now() + ACCESS_TOKEN_EXPIRY,
    refreshExpiresAt: Date.now() + REFRESH_TOKEN_EXPIRY
  };
}

// Limpiar tokens expirados cada hora
setInterval(() => {
  const now = Date.now();
  for (const [token, data] of Object.entries(sesiones)) {
    if (data.expiresAt && now > data.expiresAt) delete sesiones[token];
  }
  for (const [token, data] of Object.entries(refreshTokens)) {
    if (now > data.expiresAt) delete refreshTokens[token];
  }
}, 60 * 60 * 1000);

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.replace('Bearer ', '');
  if (!token || !sesiones[token]) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  const session = sesiones[token];
  if (session.expiresAt && Date.now() > session.expiresAt) {
    delete sesiones[token];
    return res.status(401).json({ error: 'Sesión expirada', codigo: 'TOKEN_EXPIRED' });
  }
  req.usuario = session;
  req.token = token;
  next();
}

app.get('/api/productos', (req, res) => {
  const productos = leerJSON('productos.json');
  let { categoria, busqueda, pagina = 1, por_pagina = 50 } = req.query;
  let filtrados = [...productos];
  if (categoria && categoria !== 'todas') {
    filtrados = filtrados.filter(p => p.categoria === categoria);
  }
  if (busqueda) {
    const q = busqueda.toLowerCase();
    filtrados = filtrados.filter(p =>
      p.nombre.toLowerCase().includes(q) ||
      p.descripcion.toLowerCase().includes(q)
    );
  }
  const total = filtrados.length;
  const total_paginas = Math.ceil(total / parseInt(por_pagina));
  pagina = parseInt(pagina);
  const inicio = (pagina - 1) * parseInt(por_pagina);
  const paginados = filtrados.slice(inicio, inicio + parseInt(por_pagina));
  res.json({
    productos: paginados,
    total,
    pagina,
    total_paginas,
    categorias: [...new Set(productos.map(p => p.categoria))]
  });
});

app.get('/api/productos/:id', (req, res) => {
  const productos = leerJSON('productos.json');
  const prod = productos.find(p => p.id === parseInt(req.params.id));
  if (!prod) return res.status(404).json({ error: 'Producto no encontrado' });
  res.json(prod);
});

app.post('/api/auth/login', async (req, res) => {
  const { usuario, password } = req.body;
  const usuarios = leerJSON('usuarios.json');
  const user = usuarios.find(u => u.usuario === usuario);
  if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });
  const passwordValida = await bcrypt.compare(password, user.password);
  if (!passwordValida) return res.status(401).json({ error: 'Credenciales inválidas' });
  const tokens = generarTokenExpirado();
  sesiones[tokens.accessToken] = {
    id: user.id,
    usuario: user.usuario,
    nombre: user.nombre,
    email: user.email,
    direccion: user.direccion,
    rol: user.rol,
    expiresAt: tokens.accessExpiresAt
  };
  refreshTokens[tokens.refreshToken] = {
    usuarioId: user.id,
    expiresAt: tokens.refreshExpiresAt
  };
  if (!carritos[user.id]) carritos[user.id] = [];
  res.json({
    token: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresIn: ACCESS_TOKEN_EXPIRY,
    usuario: { nombre: user.nombre, usuario: user.usuario, rol: user.rol },
    mensaje: 'Inicio de sesión exitoso'
  });
});

app.post('/api/auth/register', async (req, res) => {
  const { usuario, password, nombre, email } = req.body;
  if (!usuario || !password || !nombre || !email) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
  }
  const usuarios = leerJSON('usuarios.json');
  if (usuarios.find(u => u.usuario === usuario)) {
    return res.status(400).json({ error: 'El usuario ya existe' });
  }
  if (usuarios.find(u => u.email === email)) {
    return res.status(400).json({ error: 'El email ya está registrado' });
  }
  const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const nuevoUsuario = {
    id: Date.now(),
    usuario,
    password: hashedPassword,
    nombre,
    email,
    direccion: '',
    rol: 'cliente'
  };
  usuarios.push(nuevoUsuario);
  guardarJSON('usuarios.json', usuarios);
  res.json({ mensaje: 'Usuario registrado exitosamente', usuario: { nombre, usuario, email } });
});

app.post('/api/auth/refresh', (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken || !refreshTokens[refreshToken]) {
    return res.status(401).json({ error: 'Refresh token inválido' });
  }
  const rt = refreshTokens[refreshToken];
  if (Date.now() > rt.expiresAt) {
    delete refreshTokens[refreshToken];
    return res.status(401).json({ error: 'Refresh token expirado' });
  }
  const usuarios = leerJSON('usuarios.json');
  const user = usuarios.find(u => u.id === rt.usuarioId);
  if (!user) return res.status(401).json({ error: 'Usuario no encontrado' });
  delete refreshTokens[refreshToken];
  const tokens = generarTokenExpirado();
  sesiones[tokens.accessToken] = {
    id: user.id,
    usuario: user.usuario,
    nombre: user.nombre,
    email: user.email,
    direccion: user.direccion,
    rol: user.rol,
    expiresAt: tokens.accessExpiresAt
  };
  refreshTokens[tokens.refreshToken] = {
    usuarioId: user.id,
    expiresAt: tokens.refreshExpiresAt
  };
  res.json({
    token: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresIn: ACCESS_TOKEN_EXPIRY
  });
});

app.post('/api/auth/logout', authMiddleware, (req, res) => {
  delete sesiones[req.token];
  for (const [rt, data] of Object.entries(refreshTokens)) {
    if (data.usuarioId === req.usuario.id) delete refreshTokens[rt];
  }
  res.json({ mensaje: 'Sesión cerrada exitosamente' });
});

app.get('/api/auth/session', authMiddleware, (req, res) => {
  res.json({ valida: true, usuario: req.usuario });
});

app.post('/api/carrito/agregar', authMiddleware, (req, res) => {
  const { producto_id, cantidad = 1 } = req.body;
  const productos = leerJSON('productos.json');
  const prod = productos.find(p => p.id === producto_id);
  if (!prod) return res.status(404).json({ error: 'Producto no encontrado' });
  if (prod.stock < cantidad) return res.status(400).json({ error: 'Stock insuficiente' });
  const uid = req.usuario.id;
  if (!carritos[uid]) carritos[uid] = [];
  const existente = carritos[uid].find(i => i.producto_id === producto_id);
  if (existente) {
    existente.cantidad += cantidad;
  } else {
    carritos[uid].push({ producto_id, cantidad });
  }
  res.json({ mensaje: `${prod.nombre} agregado al carrito` });
});

app.get('/api/carrito', authMiddleware, (req, res) => {
  const uid = req.usuario.id;
  const items = carritos[uid] || [];
  const productos = leerJSON('productos.json');
  const detalle = items.map(item => {
    const prod = productos.find(p => p.id === item.producto_id);
    if (!prod) return null;
    return {
      ...item,
      producto: prod,
      subtotal: prod.precio * item.cantidad
    };
  }).filter(Boolean);
  const total = detalle.reduce((s, i) => s + i.subtotal, 0);
  res.json({ items: detalle, total });
});

app.post('/api/carrito/actualizar', authMiddleware, (req, res) => {
  const { producto_id, cantidad } = req.body;
  const uid = req.usuario.id;
  if (!carritos[uid]) carritos[uid] = [];
  const item = carritos[uid].find(i => i.producto_id === producto_id);
  if (!item) return res.status(404).json({ error: 'Producto no encontrado en carrito' });
  item.cantidad = Math.max(1, cantidad);
  res.json({ mensaje: 'Carrito actualizado' });
});

app.delete('/api/carrito/:id', authMiddleware, (req, res) => {
  const uid = req.usuario.id;
  if (!carritos[uid]) carritos[uid] = [];
  carritos[uid] = carritos[uid].filter(i => i.producto_id !== parseInt(req.params.id));
  res.json({ mensaje: 'Producto eliminado del carrito' });
});

app.post('/api/checkout', authMiddleware, (req, res) => {
  const { nombre, direccion, email, tarjeta } = req.body;
  if (!nombre || !direccion || !email || !tarjeta) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }
  const uid = req.usuario.id;
  const items = carritos[uid] || [];
  if (items.length === 0) return res.status(400).json({ error: 'Carrito vacío' });
  let productos = leerJSON('productos.json');
  for (const item of items) {
    const prod = productos.find(p => p.id === item.producto_id);
    if (!prod || prod.stock < item.cantidad) {
      return res.status(400).json({ error: `Stock insuficiente para ${prod ? prod.nombre : 'producto desconocido'}` });
    }
    prod.stock -= item.cantidad;
  }
  guardarJSON('productos.json', productos);
  const pedidoId = 'PED-' + uuidv4().slice(0, 8).toUpperCase();
  const pedidos = leerJSON('pedidos.json');
  pedidos.push({
    id: pedidoId,
    usuario_id: uid,
    items: [...items],
    total: items.reduce((s, i) => {
      const p = productos.find(pr => pr.id === i.producto_id);
      return s + (p ? p.precio * i.cantidad : 0);
    }, 0),
    nombre, direccion, email,
    tarjeta_oculta: '*'.repeat(tarjeta.length - 4) + tarjeta.slice(-4),
    fecha: new Date().toISOString(),
    estado: 'confirmado'
  });
  guardarJSON('pedidos.json', pedidos);
  carritos[uid] = [];
  res.json({ success: true, pedido_id: pedidoId, mensaje: 'Pedido confirmado exitosamente' });
});

app.get('/api/pedidos', authMiddleware, (req, res) => {
  const pedidos = leerJSON('pedidos.json');
  const uid = req.usuario.id;
  const usuarioPedidos = pedidos.filter(p => p.usuario_id === uid);
  res.json(usuarioPedidos);
});

app.post('/api/chat', (req, res) => {
  const { mensaje } = req.body;
  if (!mensaje) return res.json({ respuesta: '¿Cómo puedo ayudarte?' });
  const conocimiento = leerJSON('chatbot_conocimiento.json');
  const msg = mensaje.toLowerCase();
  for (const entry of conocimiento) {
    if (msg.includes(entry.palabra)) {
      return res.json({ respuesta: entry.respuesta });
    }
  }
  res.json({ respuesta: 'Gracias por tu mensaje. Un agente te responderá a la brevedad.' });
});

app.get('/api/config', (req, res) => {
  res.json(leerJSON('config.json'));
});

app.post('/api/admin/productos', authMiddleware, (req, res) => {
  if (req.usuario.rol !== 'admin') return res.status(403).json({ error: 'No autorizado' });
  const productos = leerJSON('productos.json');
  const nuevo = { id: Date.now(), ...req.body, stock: parseInt(req.body.stock) || 0 };
  productos.push(nuevo);
  guardarJSON('productos.json', productos);
  res.json(nuevo);
});

app.put('/api/admin/productos/:id', authMiddleware, (req, res) => {
  if (req.usuario.rol !== 'admin') return res.status(403).json({ error: 'No autorizado' });
  let productos = leerJSON('productos.json');
  const idx = productos.findIndex(p => p.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'No encontrado' });
  productos[idx] = { ...productos[idx], ...req.body, id: productos[idx].id };
  guardarJSON('productos.json', productos);
  res.json(productos[idx]);
});

app.delete('/api/admin/productos/:id', authMiddleware, (req, res) => {
  if (req.usuario.rol !== 'admin') return res.status(403).json({ error: 'No autorizado' });
  let productos = leerJSON('productos.json');
  const nuevos = productos.filter(p => p.id !== parseInt(req.params.id));
  if (nuevos.length === productos.length) return res.status(404).json({ error: 'No encontrado' });
  guardarJSON('productos.json', nuevos);
  res.json({ mensaje: 'Producto eliminado' });
});

app.get('/api/admin/usuarios', authMiddleware, (req, res) => {
  if (req.usuario.rol !== 'admin') return res.status(403).json({ error: 'No autorizado' });
  const usuarios = leerJSON('usuarios.json');
  res.json(usuarios.map(({ password, ...u }) => u));
});

app.get('/api/admin/pedidos', authMiddleware, (req, res) => {
  if (req.usuario.rol !== 'admin') return res.status(403).json({ error: 'No autorizado' });
  res.json(leerJSON('pedidos.json'));
});

app.get('/api/admin/stats', authMiddleware, (req, res) => {
  if (req.usuario.rol !== 'admin') return res.status(403).json({ error: 'No autorizado' });
  const productos = leerJSON('productos.json');
  const pedidos = leerJSON('pedidos.json');
  const usuarios = leerJSON('usuarios.json');
  res.json({
    total_productos: productos.length,
    total_pedidos: pedidos.length,
    total_usuarios: usuarios.length,
    stock_bajo: productos.filter(p => p.stock < 10).length,
    ingresos: pedidos.reduce((s, p) => s + (p.total || 0), 0),
    productos_por_categoria: productos.reduce((acc, p) => {
      acc[p.categoria] = (acc[p.categoria] || 0) + 1;
      return acc;
    }, {})
  });
});

app.post('/api/admin/config', authMiddleware, (req, res) => {
  if (req.usuario.rol !== 'admin') return res.status(403).json({ error: 'No autorizado' });
  const config = leerJSON('config.json');
  Object.assign(config, req.body);
  guardarJSON('config.json', config);
  res.json(config);
});

app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'API no encontrada' });
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor Web Merge Final corriendo en http://localhost:${PORT}`);
  console.log(`📦 Catálogo: http://localhost:${PORT}/`);
  console.log(`🔧 Admin: http://localhost:${PORT}/admin/`);
});
