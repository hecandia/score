# App nativa para el iPad mini 4: dos pantallas y control remoto desde el teléfono

- Fechas: 2026-10-14 y 2026-10-15 · Proyecto: PERSONAL/CARAMBOLA
- Sesión: `2026-10-14 PERSONAL/CARAMBOLA — app nativa con dos pantallas`
- Reabre, con un aparato nuevo, los descartes de app nativa, dos aparatos y el iPad mini 4 de
  `docs/decisiones/2026-10-09-marcador-en-la-tv-y-ajustes-de-la-primera-noche.md` §1: sus motivos
  eran del iPad 3 (iOS 9, sin comunicación directa entre aparatos). Esas decisiones siguen
  vigentes para el iPad 3 hasta que el mini 4 se use en una noche real.

## 1. Comprar el Apple Developer Program
- Brain-id: `46b3417f-e533-4111-aa9a-cc7f84adb0d3`
- Qué se decidió: Héctor compra la membresía (US$99/año), el 2026-10-15; Apple tarda hasta 48 h.
- Alternativas descartadas: la firma gratuita, que vence a los 7 días y obliga a reinstalar cada
  semana. Además, sólo con la membresía el UDID del iPad se registra a mano, y eso es necesario
  porque Xcode 27 no se conecta a iOS 15 (lección `a84fbfc4-ac5d-41d5-9157-5e55ab0615d4`).

## 2. La TV es opcional
- Brain-id: `fd324b34-d212-4111-9403-493c61d7166a`
- Qué se decidió: sin pantalla externa el iPad opera como hoy (marcador grande arriba, controles
  abajo). Con TV, el marcador va a la TV y el iPad queda con controles y un tanteo compacto. El
  cambio es en vivo, también a media entrada.
- Alternativa descartada: que la TV sea necesaria para jugar.

## 3. Cáscara nativa sobre la misma web, un solo estado
- Brain-id: `9726e6bd-98f4-4560-b928-3db2c4178f33`
- Qué se decidió: `ios/` es una app Swift con un WKWebView que carga la web de la raíz del repo,
  copiada en cada compilación. La TV (`tv.html`) y el teléfono (`control.html`) reciben su
  pantalla ya armada desde la página del iPad y devuelven toques; no tienen estado.
- Alternativas descartadas: reescribir la app en Swift (tirar unas 1,100 líneas probadas) y
  aparatos con estado propio sincronizado (se desincronizan).
- Consecuencia: el código compartido sigue en ES5; en Safari del iPad 3 no cambia nada.

## 4. Los datos de la app nativa en un archivo propio
- Brain-id: `29be685c-e077-4bee-a588-cb2eaafdf237`
- Qué se decidió: `Application Support/carambola.json`, inyectado como `window.almacenNativo`
  antes de cargar la página; cada escritura se graba con reemplazo atómico. Entra en el respaldo
  de iCloud del iPad.
- Alternativa descartada: el localStorage del WKWebView, de comportamiento incierto con páginas
  locales, donde viviría el único historial.

## 5. Control remoto: servidor local en el iPad, navegador en el teléfono
- Brain-id: `f0134762-e203-42de-bf8a-2005a487a033`
- Qué se decidió: HTTP (8380) y WebSocket (8381) en el iPad, sin internet. El menú «Control desde
  el iPhone» muestra un QR con la dirección y un código de acceso. Desde el teléfono sólo se
  anota el partido. Sirve igual un iPhone que un Android.
- Alternativas descartadas: app nativa en el iPhone (firma e instalación) y MultipeerConnectivity
  (exige app nativa en el teléfono).
- Consecuencias: `node test/remoto-simulador.js` lo prueba contra la app en el simulador; falta
  probarlo en el iPad y con un teléfono real.

## Otras entradas del mismo cierre
- Hecho: el SDK de Xcode 27 tiene como piso iOS 15.0, justo el techo del mini 4 `8ad00ea5-bf3e-4d50-bea8-cf7de89a83df`
- Lección (PERSONAL): el simulador de iOS 27 no prueba la pantalla externa `032b47ff-015f-43c6-9358-604d8de07cfe`
- Lección (PERSONAL): Xcode 27 compila para iOS 15 pero no instala en él `a84fbfc4-ac5d-41d5-9157-5e55ab0615d4`
