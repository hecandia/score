# Handoff — estado

Sólo estado. El porqué de las decisiones vive en el brain y en `docs/decisiones/`.

## Dónde estamos (2026-10-29)
- Web publicada en https://hecandia.github.io/score/ (GitHub Pages, repo `hecandia/score`, rama
  `main`), manifest v5: incluye la v4 (cara a cara en Estadísticas, récord de perder con menos
  carambolas, cara a cara en «¿Quién sale?»). `npm test` 18/18, `npm run e2e` 57/57.
- **App nativa instalada en el iPad mini 4** (compilación 2, con ícono), firmada ad hoc; el perfil
  vence el 2027-10-29. Se instala con **Apple Configurator** (el Finder falla sin mensaje).
  Exportar: `xcodebuild archive` + `-exportArchive` con method `release-testing` y
  `-allowProvisioningUpdates` (equipo PHJY4R6SL6). El UDID está en la memoria local de Claude Code.
- El historial de estas semanas (anotado desde el ícono de la web en el mini 4) ya está en la app
  nativa: Héctor lo confirmó. El historial vivo es el de la app.

## Siguiente paso
1. Probar la TV con el mini 4 y el adaptador Lightning a HDMI. Lista: al conectar, la TV muestra
   el marcador y el iPad la vista compacta; al armar un partido, la previa; al anotar, marcador con
   franja; el botón «TV: …» alterna récords, cara a cara y marcador; al terminar, el cierre; al
   desconectar a media entrada, el iPad vuelve al marcador grande sin perder lo anotado.
2. Control remoto desde un teléfono real contra el mini 4 (sólo probado en el simulador).
3. Pendiente de respuesta de Héctor: renombrar «Control desde el iPhone» a «Control desde el
   celular» (también sirve un Android).
4. Preguntarle a Héctor lo que está en ❓ del roadmap, de a una (bola en partido de dos, entrada de igualación).

## Para operar
- Funcionalidades y su estado: [ROADMAP.md](ROADMAP.md). Reglas de juego y plataforma: [REQUISITOS.md](REQUISITOS.md).
- Publicar: la sección «Publicar una versión» de REQUISITOS — **subir la versión de `carambola.appcache`** o el iPad no ve el cambio.
- Un cambio en la web llega a la app nativa sólo al recompilar e instalar un `.ipa` nuevo.
- Todo el código del sitio es ES5 (Safari 9): `npm test` lo verifica. Nada de compilación ni frameworks.
- Íconos: `node test/icono.js` genera el de la web y el de la app desde el mismo dibujo.
- La UI va en tuteo mexicano.
