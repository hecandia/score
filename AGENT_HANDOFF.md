# Handoff — estado

Sólo estado. El porqué de las decisiones vive en el brain y en `docs/decisiones/`.

## Dónde estamos (2026-10-09)
- v1 publicada en https://hecandia.github.io/score/ (GitHub Pages, repo `hecandia/score`, rama `main`).
- Ajustes de la primera noche publicados (manifest v3, ver ROADMAP §v2). Héctor los probó en
  el iPad: «quedó muy bien». `npm test` 14/14, `npm run e2e` 30/30.

## A medias (2026-10-15, sin commit)
- **App nativa para el iPad mini 4** (iPadOS 15), fase 1: `ios/` (cáscara Swift con dos WKWebView)
  + `tv.html` + `css/tv.css` + cambios chicos en `js/app.js` y `js/datos.js` que sólo se activan
  dentro de la app nativa. Sin TV opera como hoy; con TV el marcador va a la TV y el iPad queda
  con controles. `npm test` 14/14, `npm run e2e` pasa (incluye 9 comprobaciones del modo nativo).
- Probado en el simulador: la app carga y se ve. **La TV no se pudo probar ahí** (iOS 27 no le
  entrega la escena externa a la app); falta probarla en el iPad real.
- **Xcode 27 no instala en iOS 15** («Pairing State: unsupported»): hay que exportar un `.ipa`
  firmado e instalarlo desde el Finder. Necesita la membresía pagada (Héctor la compra el 2026-10-15)
  para registrar el UDID del iPad a mano. El UDID está en la memoria local de Claude Code, no en el repo.

## Siguiente paso
1. Con la membresía activa: registrar el UDID en developer.apple.com, exportar el `.ipa` (ad hoc)
   e instalarlo desde el Finder. Luego la tabla de prueba de 8 pasos con la TV (sesión del 2026-10-14).
2. Pasar el historial del iPad 3 al mini 4 con el respaldo (exportar allá, restaurar acá).
3. Fase 2, el iPhone como control remoto — **escrita y probada en el simulador** (2026-10-15):
   `ios/Carambola/ServidorRemoto.swift` (HTTP 8380 + WebSocket 8381, código de acceso en el QR),
   `ControladorControlRemoto.swift` (hoja con el QR), `control.html` + `js/control.js` + `css/control.css`.
   `node test/remoto-simulador.js` la prueba contra la app real en el simulador. Falta en el iPad real.
4. Pendiente de respuesta de Héctor: renombrar el botón «Control desde el iPhone» (y los textos de
   la hoja del QR) a «Control desde el celular», porque también sirve un Android.
5. Preguntarle a Héctor lo que está en ❓ del roadmap, de a una (bola en partido de dos, entrada de igualación).

## Para operar
- Funcionalidades y su estado: [ROADMAP.md](ROADMAP.md). Reglas de juego y plataforma: [REQUISITOS.md](REQUISITOS.md).
- Publicar: la sección «Publicar una versión» de REQUISITOS — **subir la versión de `carambola.appcache`** o el iPad no ve el cambio.
- Todo el código del sitio es ES5 (Safari 9): `npm test` lo verifica. Nada de compilación ni frameworks.
- La UI va en tuteo mexicano.
