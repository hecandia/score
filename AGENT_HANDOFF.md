# Handoff — estado

Sólo estado. El porqué de las decisiones vive en el brain y en `docs/decisiones/`.

## Dónde estamos (2026-11-10)
- **App nativa en el iPad mini 4: compilación 3**, instalada por Héctor el 2026-11-10 (perfil ad
  hoc, vence el 2027-10-29). Trae lo de la v5 del roadmap: +1 a la izquierda en el teléfono,
  placa «+N ENTRADA» junto al número grande, Ajustes › Apariencia con tres skins, y el respaldo en
  la app Archivos. `npm test` 18/18, `npm run e2e` 82/82.
- **Lo Swift nuevo sólo compiló** (copia `Carambola-respaldo.json` en Documentos, «Guardar en
  Archivos», «Restaurar desde un archivo»): nunca corrió en el simulador ni en el iPad.
- Web publicada en https://hecandia.github.io/score/ sigue en manifest v5 (v4 del roadmap): la v5
  **no está publicada**, el iPad 3 no la tiene.
- El historial vivo es el de la app nativa.

## Siguiente paso
1. Preguntarle a Héctor cómo le fue con la compilación 3 en el iPad, de a una cosa:
   - ¿Archivos › En mi iPad › Carambola muestra `Carambola-respaldo.json`? ¿«Guardar en Archivos»
     deja elegir iCloud Drive? Si algo falla, el código está en `ios/Carambola/Almacen.swift` y en
     la sección «Respaldo en Archivos» de `ios/Carambola/Controladores.swift`.
   - Sus comentarios sobre las skins (la decisión quedó abierta a ajustar colores o quitar alguna).
2. Probar la TV con el mini 4 y el adaptador Lightning a HDMI. Lista: al conectar, la TV muestra
   el marcador y el iPad la vista compacta; al armar un partido, la previa; al anotar, marcador con
   franja y la placa «+N ENTRADA»; el botón «TV: …» alterna récords, cara a cara y marcador; al
   terminar, el cierre; al desconectar a media entrada, el iPad vuelve al marcador grande sin
   perder lo anotado; con otra skin, la TV la sigue.
3. Control remoto desde un teléfono real contra el mini 4 (sólo probado en el simulador): el +1
   tiene que quedar a la izquierda.
4. Publicar la web (v5) para el iPad 3 cuando Héctor apruebe las skins: subir la versión de
   `carambola.appcache` a v6.
5. Pendiente de respuesta de Héctor: renombrar «Control desde el iPhone» a «Control desde el
   celular» (también sirve un Android). Y lo que está en ❓ del roadmap, de a una.

## Para operar
- Funcionalidades y su estado: [ROADMAP.md](ROADMAP.md). Reglas de juego y plataforma: [REQUISITOS.md](REQUISITOS.md).
- Publicar la web: la sección «Publicar una versión» de REQUISITOS — **subir la versión de `carambola.appcache`** o el iPad no ve el cambio.
- Un cambio en la web llega a la app nativa sólo al recompilar e instalar un `.ipa` nuevo:
  subir `CURRENT_PROJECT_VERSION` en `ios/Carambola.xcodeproj/project.pbxproj` (va en 3), luego
  `xcodebuild -project ios/Carambola.xcodeproj -scheme Carambola -configuration Release -destination "generic/platform=iOS" -archivePath /tmp/carambola-build/Carambola.xcarchive -allowProvisioningUpdates archive`
  y `xcodebuild -exportArchive -archivePath /tmp/carambola-build/Carambola.xcarchive -exportPath /tmp/carambola-build/export -exportOptionsPlist ios/ExportOptions.plist -allowProvisioningUpdates`.
  Se instala con **Apple Configurator** eligiendo «Reemplazar» (el Finder falla sin mensaje;
  borrar la app antes borra el historial). El UDID está en la memoria local de Claude Code.
- Todo el código del sitio es ES5 (Safari 9): `npm test` lo verifica. Nada de compilación ni frameworks. Las skins no usan variables CSS por lo mismo.
- Íconos: `node test/icono.js` genera el de la web y el de la app desde el mismo dibujo.
- La UI va en tuteo mexicano.
