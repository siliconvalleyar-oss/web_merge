# Reglas de Oro — WebMerge Studio

## Versionado

- `VERSION` contiene la versión actual del proyecto (semver).
- Cada vez que se pushea, debe crearse un **tag** con el mismo valor que `VERSION`.
- El tag debe seguir el formato `v` + contenido de `VERSION`. Ej: `v2.0.0`.
- El tag debe pushearse junto con el commit: `git push --tags`.

## Commits

- Mensajes claros y descriptivos en español o inglés.
- Prefijos: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `style:`.
- Commits atómicos: un cambio por commit.

## Ramas

- `main` — producción estable.
- `feat/*` — nuevas características.
- `fix/*` — correcciones.
- `docs/*` — documentación.

## Pull Requests

- Toda rama debe integrarse vía PR a `main`.
- El PR debe incluir resumen de cambios y referencias a issues si existen.
