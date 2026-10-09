# Handoff — estado

Sólo estado. El porqué de las decisiones vive en el brain y en `docs/decisiones/`.

## Dónde estamos (2026-10-09)
- v1 publicada en https://hecandia.github.io/score/ (GitHub Pages, repo `hecandia/score`, rama `main`).
- Ajustes de la primera noche publicados (manifest v3, ver ROADMAP §v2). Héctor los probó en
  el iPad: «quedó muy bien». `npm test` 14/14, `npm run e2e` 30/30.

## A medias
- Nada en código.

## Siguiente paso
1. Que Héctor pruebe el iPad conectado a la TV con el adaptador de 30 pines a HDMI.
2. Preguntarle lo que está en ❓ del roadmap, de a una (bola en partido de dos, entrada de igualación).

## Para operar
- Funcionalidades y su estado: [ROADMAP.md](ROADMAP.md). Reglas de juego y plataforma: [REQUISITOS.md](REQUISITOS.md).
- Publicar: la sección «Publicar una versión» de REQUISITOS — **subir la versión de `carambola.appcache`** o el iPad no ve el cambio.
- Todo el código del sitio es ES5 (Safari 9): `npm test` lo verifica. Nada de compilación ni frameworks.
- La UI va en tuteo mexicano.
