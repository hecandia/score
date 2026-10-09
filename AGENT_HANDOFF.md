# Handoff — estado

Sólo estado. El porqué de las decisiones vive en el brain y en `docs/decisiones/`.

## Dónde estamos (2026-10-09)
- v1 publicada en https://hecandia.github.io/score/ (GitHub Pages, repo `hecandia/score`, rama `main`).
- Primera noche real jugada. Sus ajustes están construidos como v2 (ver ROADMAP §v2):
  total pendiente en el marcador, aviso grande de tres bandas, teclado numérico, bolas, y la
  pantalla del partido para duplicarla en una TV por HDMI. `npm test` 14/14, `npm run e2e` 29/29.
- Manifest en v2. **v2 sin publicar.**

## Siguiente paso
1. Publicar v2 (push a `main`) y que Héctor la pruebe en la mesa con la TV.
2. Preguntarle lo que está en ❓ del roadmap, de a una.

## Para operar
- Funcionalidades y su estado: [ROADMAP.md](ROADMAP.md). Reglas de juego y plataforma: [REQUISITOS.md](REQUISITOS.md).
- Publicar: la sección «Publicar una versión» de REQUISITOS — **subir la versión de `carambola.appcache`** o el iPad no ve el cambio.
- Todo el código del sitio es ES5 (Safari 9): `npm test` lo verifica. Nada de compilación ni frameworks.
- La UI va en tuteo mexicano.
