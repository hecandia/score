# Handoff — estado

Sólo estado. El porqué de las decisiones vive en el brain y en `docs/decisiones/`.

## Dónde estamos (2026-10-09)
- v1 publicada en https://hecandia.github.io/score/ (GitHub Pages, repo `hecandia/score`, rama `main`).
- Instalada en el iPad de Héctor (iPad 3, iOS 9.3.6) desde la pantalla de inicio; la simuló y
  «se siente muy bien». Falta la primera noche real de rondas.
- Árbol limpio. `npm test` 12/12, `npm run e2e` 21/21 en el último commit.

## A medias
- Nada en código. Esperando retroalimentación de la primera noche.

## Siguiente paso
1. Recoger la retroalimentación de Héctor y priorizarla en [ROADMAP.md](ROADMAP.md).
2. Preguntarle lo que está en ❓ del roadmap, de a una.

## Para operar
- Funcionalidades y su estado: [ROADMAP.md](ROADMAP.md). Reglas de juego y plataforma: [REQUISITOS.md](REQUISITOS.md).
- Publicar: la sección «Publicar una versión» de REQUISITOS — **subir la versión de `carambola.appcache`** o el iPad no ve el cambio.
- Todo el código del sitio es ES5 (Safari 9): `npm test` lo verifica. Nada de compilación ni frameworks.
- La UI va en tuteo mexicano.
