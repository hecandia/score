# Teléfono, placa de la entrada, skins y respaldo en Archivos

- Fecha: 2026-11-10 · Proyecto: PERSONAL/CARAMBOLA
- Sesión: «2026-11-10 PERSONAL/CARAMBOLA — control remoto, carambolas y skins»
- Instalado en el iPad mini 4 como compilación 3. Probado en Chromium (`npm test` 18/18,
  `npm run e2e` 82 comprobaciones); lo nativo nuevo sólo compiló, se prueba en el iPad.

## 1. En el control del teléfono el +1 va a la izquierda
- Brain-id: bfb7578b-2a81-40b2-8b65-5e538807328a
- Qué se decidió (Héctor): en el teléfono el contador queda +1, cantidad, −1. La gente sostiene
  el teléfono con la mano izquierda y el pulgar alcanza mejor ese lado; el +1 es el toque más
  frecuente.
- Alternativa descartada: cambiar también el iPad, que se usa apoyado y con las dos manos.
- Dónde: `css/control.css` (`order` en `.contador`).

## 2. Las carambolas de la entrada, en una placa al lado del número grande
- Brain-id: eb2034fc-b99c-495c-8924-cba073c172fb
- Qué se decidió: mientras se anota, el número grande sigue incluyendo lo pendiente (decisión de
  la v2) y al lado aparece una placa «+N ENTRADA» en el color del que tira. Va en la TV y en el
  iPad sin TV (que es lo que se duplica por HDMI con el iPad 3). No va en el compacto del iPad con
  TV ni en el teléfono: ahí la cantidad ya está grande en el contador.
- Antes: sólo la línea «+N por confirmar», que en la TV había que acercarse para leer.
- Alternativa descartada: la placa encima del número, en la esquina; lo tapaba.
- Condición comprobada: un total de 48 con +12 cabe lado a lado sin encimarse en TV 16:9 y 4:3
  (en la TV el número se limita también por el ancho, `min(40vh, 22vw)`).

## 3. Tres skins a elegir en una pantalla nueva de Ajustes
- Brain-id: 6620444e-8902-4cd0-8413-e404d083a168
- Qué se decidió (Héctor): menú › Ajustes › Apariencia, con Clásica (predeterminada), Grafito
  (oscura y plana, acento verde) y Transmisión (azul marino, nombres en barra, acento naranja).
  La skin llega al iPad, a la TV y al teléfono: viaja como `<!--piel:…-->` al principio del
  HTML y cada pantalla la pone en su `<body>`.
- Se guarda en la clave `carambola.v1.ajustes`, fuera del estado de juego.
- Alternativas descartadas: guardarla dentro del estado («Deshacer» una entrada anterior al cambio
  la revertiría, y viajaría en el respaldo); variables CSS (Safari 9 no las tiene, por eso cada
  skin repite sus colores en `css/app.css`).
- Queda abierto: Héctor comenta las skins al verlas en los aparatos.

## 4. El respaldo también es un archivo en la app Archivos
- Brain-id: d50427cc-513d-4a26-a057-9706abb05ef3
- Qué se decidió (pedido de Héctor, diseño del agente): el historial vivo sigue en Application
  Support. La app mantiene `Carambola-respaldo.json` en Archivos › En mi iPad › Carambola, al
  día al abrir y 3 s después de cada cambio del estado. Es el mismo texto que da Respaldo, así que
  se restaura igual. Respaldo suma «Guardar en Archivos» (selector de iOS: se puede elegir iCloud
  Drive) y «Restaurar desde un archivo», que pasa por la misma validación y confirmación que el
  texto pegado.
- Alternativas descartadas: el historial vivo en iCloud Drive (sincroniza en segundo plano:
  archivos a medio bajar o en conflicto, para el único historial que existe); la copia
  automática al contenedor de iCloud (exige activar iCloud en la cuenta de desarrollador y otro
  perfil de firma). Se agrega si copiar a mano estorba.
- Dónde: `ios/Carambola/Almacen.swift`, `ios/Carambola/Controladores.swift`, `ios/Info.plist`
  (`UIFileSharingEnabled`, `LSSupportsOpeningDocumentsInPlace`), `js/app.js` (`respaldoEnArchivos`,
  `restaurar`).

## Lección de la sesión
- Brain-id: ab65bd62-6ae7-48d1-976a-309ad8174e27 (ámbito PERSONAL, portable): una prueba de
  «cabe» no detecta que un elemento tape a otro. Por eso el e2e mide los bordes del número y de
  la placa en el peor caso.
