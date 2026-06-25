# Reglas de Oro — web_merge

## 1. Versionado y Tags

- La versión actual se define en `VERSION` y en `package.json` → `version`.
- **Cada push debe incrementar la versión** siguiendo [SemVer](https://semver.org/):
  - `MAJOR`: cambios incompatibles en API
  - `MINOR`: funcionalidad nueva compatible hacia atrás
  - `PATCH` (default): correcciones y cambios menores
- El tag git debe tener el mismo valor que `VERSION` (ej: `v1.0.0`, `v1.0.1`).
- **Regla:** Antes de pushear:
  1. Verificar si el tag `v$(cat VERSION)` ya existe en el remoto (`git ls-remote --tags origin v$(cat VERSION)`).
  2. Si existe, incrementar `VERSION` y `package.json` → `version` antes de continuar.
  3. Hacer commit con `"chore: bump version to v$(cat VERSION)"`.
  4. Crear tag local con el valor de `VERSION`: `git tag v$(cat VERSION)`.
  5. Pushear: `git push origin main --follow-tags`.
- Todos los cambios deben quedar documentados en `docs/CHANGELOG.md`.

## 2. Commits

- Usar [Conventional Commits](https://www.conventionalcommits.org/):
  - `feat:` — nueva funcionalidad
  - `fix:` — corrección de bug
  - `chore:` — tareas de mantenimiento (bump version, config)
  - `docs:` — documentación
  - `refactor:` — refactorización sin cambio funcional
  - `style:` — cambios de formato (css, indentación)
- Cada commit debe ser atómico: un cambio lógico por commit.
- Mensajes en español o inglés (mantener consistencia).

## 3. Ramas

- `main` — rama de producción, siempre estable.
- `develop` — rama de integración para características en desarrollo.
- `feature/<nombre>` — ramas para funcionalidades nuevas.
- `fix/<nombre>` — ramas para correcciones.
- `release/<version>` — ramas de preparación de release.
- `main` es la rama que contiene la última versión estable.

## 4. Pull Requests / Merges

- Toda fusión a `main` o `develop` debe pasar por PR.
- Requerir al menos 1 aprobación antes de mergear.
- Squash commits al mergear a `main` para mantener historial limpio.

## 5. Colaboración

- Documentar todo cambio significativo en `docs/CHANGELOG.md`.
- Mantener actualizado `docs/TODO.md` con tareas pendientes y en curso.
- No subir secretos, tokens ni credenciales al repositorio.
- Respetar la estructura de directorios existente.
- Antes de pushear, ejecutar pruebas básicas (`npm start` o similar).

## 6. Código

- Seguir el estilo del código existente (indentación, naming, patrones).
- Comentar solo lo necesario; el código debe ser auto-explicativo.
- No dejar código comentado sin eliminar.
- Las dependencias nuevas deben justificarse en el PR.

## 7. Seguridad

- No committear `.env` ni archivos con credenciales.
- Validar siempre entrada de usuario en endpoints.
- Usar `cors` configurado con orígenes permitidos explícitos.
