const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DATA_DIR = path.join(__dirname, '..', 'data');
const usersPath = path.join(DATA_DIR, 'usuarios.json');

async function migrate() {
  const raw = fs.readFileSync(usersPath, 'utf-8');
  const users = JSON.parse(raw);
  let changed = false;

  for (const user of users) {
    // bcrypt hashes start with $2a$, $2b$ or $2y$
    if (!user.password.startsWith('$2a$') && !user.password.startsWith('$2b$') && !user.password.startsWith('$2y$')) {
      console.log(`  → Hasheando contraseña de: ${user.usuario}`);
      user.password = await bcrypt.hash(user.password, 12);
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(usersPath, JSON.stringify(users, null, 2) + '\n');
    console.log('✅ Contraseñas migradas a bcrypt correctamente');
  } else {
    console.log('✅ Todas las contraseñas ya están hasheadas con bcrypt');
  }
}

migrate().catch(err => {
  console.error('❌ Error en migración:', err);
  process.exit(1);
});
