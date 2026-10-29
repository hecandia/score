# Marcador de carambola a tres bandas — requisitos

App web para un iPad viejo.

## Plataforma
- **iPad 3.ª generación, Wi-Fi + Cellular (MD367E/A), iOS 9.3.6** — el techo de ese equipo.
- Safari 9: JavaScript **ES5** (sin arrow functions, `let`, `class`, módulos). Sin CSS Grid; flexbox sí.
- Sin framework ni paso de compilación: HTML + CSS + JS ES5 plano. 1 GB de RAM.
- Persistencia en `localStorage` (no usar navegación privada: ahí falla).
- Sin internet: Service Workers no existen en iOS 9 → **AppCache** (manifest).
- Se instala con «Agregar a pantalla de inicio» (`apple-mobile-web-app-capable`), a pantalla completa.
- Respaldo: exportar / importar los datos, porque viven sólo en el iPad.
- Hosting: GitHub Pages, https://hecandia.github.io/score/ (repo `hecandia/score`).
- Certificado: `*.github.io` usa Let's Encrypt (YR1 → Root YR → ISRG Root X1) y iOS 9 no confía
  en ISRG Root X1. Resuelto 2026-09-25 instalando esa raíz como perfil en el iPad
  (`isrg-root-x1.cer`, SHA-256 verificado). Si el iPad se restaura, hay que reinstalarla.
- `prueba.html` queda como diagnóstico: HTTPS, JavaScript, guardado y modo pantalla de inicio.

## Publicar una versión
1. `npm test` (sintaxis ES5 + reglas) y `npm run e2e` (una noche completa en Chromium).
2. Subir el número de versión en `carambola.appcache`. **Sin eso el iPad sigue con la versión
   vieja**: AppCache sólo baja algo nuevo si el manifest cambió.
3. Todo archivo nuevo del sitio va también en el `CACHE:` del manifest; si uno falta o da 404,
   iOS descarta el caché entero y la app deja de funcionar sin internet.
4. Push a `main`. En el iPad aparece «Hay una versión nueva»; se toca para cargarla.

## Decidido

### Rotación (3 jugadores)
- Cada semana la ronda arranca de cero.
- Arranque: los tres tiran a la banda. El más cerca juega contra el segundo; el más lejos descansa.
- El ganador juega contra el que espera; tras dos partidos seguidos, descansa gane o pierda.
- Con 3 jugadores la regla determina todo: cada 3 partidos se enfrentan las 3 parejas una vez.

### Récords
- **Racha de victorias consecutivas** por jugador. Persiste entre semanas (no se reinicia con la ronda).
- **Tiro más largo** (serie de carambolas en una entrada).
- **Récord negro:** racha de derrotas consecutivas por jugador. Mismas reglas que la racha de
  victorias: persiste entre semanas, descansar no la corta, se lleva por modalidad y formato.
- **Perder con menos carambolas** (Héctor, 2026-10-29): otra especie de récord negro, el perdedor
  con el puntaje más bajo de un partido. Gana el número más bajo; ante un empate se queda el
  primero. Se muestra con el límite («2 de 50»), porque las tablas no separan por límite. No
  tiene valor inicial: cuenta desde los partidos guardados.
- Consecuencia: el marcador se anota entrada por entrada, no sólo el resultado final.
- Récords **aparte por modalidad** (tres bandas, rosario) **y por formato** (ronda de tres,
  partido de dos): cuatro tablas de récords.
- **Récords iniciales a cargar** (todos de Francisco):
  - Rosario, ronda de tres: racha de 7 victorias; tiro más largo de 11; récord negro de 8 derrotas.

### Registro de cada entrada (configurable)
- **Total al terminar el tiro:** se anota cuántas hizo en la entrada.
- **Una por una:** el jugador contrario va sumando +1 en un acumulado temporal; al terminar la
  entrada, el que tiró confirma (o corrige) y recién ahí se asienta.
- Mientras se anota, el marcador grande del tirador ya incluye lo de la entrada, marcado como
  pendiente («+N por confirmar») hasta que confirma.
- En rosario, el aviso de tres bandas va en ese marcador y sigue al número pendiente en los
  dos modos (Héctor, 2026-10-09: en «total» también se cuenta con +1 mientras se tira).
- Además de +1 / −1 hay teclado numérico: lo tecleado es el total de la entrada (el primer
  dígito reemplaza lo anotado; los siguientes se agregan). No deja pasar del límite.

### Bolas
- Cada jugador tira con una bola, blanca o amarilla. Al empezar la noche se elige quién de la
  primera pareja lleva la blanca.
- Ronda de tres: el que sigue en la mesa conserva su bola y el que entra toma la del que salió.
- Partido de dos (supuesto): cada uno conserva su bola toda la noche.

### Pantalla externa
- El marcador se ve en una TV de 19″ duplicando la pantalla del iPad por HDMI (adaptador «Apple
  30-pin Digital AV Adapter»). iOS sólo duplica para una app web: no hay contenido distinto en
  la TV. Por eso la pantalla del partido pone el marcador arriba y cabe sin scroll en 1024×748
  (`npm run e2e` lo comprueba).

### App nativa (iPad mini 4, iPadOS 15) — en construcción
- Cáscara Swift (`ios/`) sobre la misma web; el código compartido sigue en ES5 y la web del iPad 3
  no cambia. Sin TV opera como hoy; con TV (adaptador Lightning a HDMI) el marcador va a la TV.
- Control remoto desde el navegador de un teléfono por la red local, con QR y código de acceso.
- Instalación: Xcode 27 no se conecta a iOS 15; va un `.ipa` firmado con el UDID registrado
  (membresía pagada) e instalado desde el Finder. No actualizar Xcode sin revisar que su SDK siga
  aceptando iOS 15.0.
- Detalle y alternativas: [docs/decisiones/2026-10-15-app-nativa-con-dos-pantallas-y-control-remoto.md](docs/decisiones/2026-10-15-app-nativa-con-dos-pantallas-y-control-remoto.md).

### Configuración del partido
- Límite de carambolas configurable (usuales: 20 o 50).
- Modalidades: **tres bandas** y **rosario** (9 carambolas libres + 1 de tres bandas).
- En rosario, la app registra las libres y avisa cuando la siguiente tiene que ser de tres bandas.
- En rosario la cuenta es acumulativa entre turnos: las carambolas 10.ª, 20.ª, 30.ª… de cada
  jugador tienen que ser de tres bandas, sin importar en qué turno caigan.
  Ej.: turno 1 = 5 libres; turno 2 = 4 libres + tres bandas (la 10.ª) + 8 libres → 18.
- Supuesto: cada carambola vale 1 punto, sea libre o de tres bandas.
- Supuesto: gana el primero que llega al límite, en ese momento; sin entrada de igualación
  para el que salió segundo. Una entrada no puede pasar del límite.
- La modalidad y el límite se pueden cambiar entre partidos de la misma noche.

### Estadísticas
Filtrables por modalidad y formato, igual que los récords:
- Partidos ganados por jugador: en la semana y en el histórico.
- Promedio de carambolas por entrada.
- **Cara a cara** (Héctor, 2026-10-29): por jugador, cuántos le ganó y cuántos le perdió a cada rival.
- Historial de partidos, noche por noche.

### Cara a cara del partido en curso (2026-10-29)
Para motivar a los que juegan, el historial del par en la modalidad y el formato del partido:
- **Previa**: ganados de cada uno, los últimos cinco, quién lleva la racha en el duelo, promedio
  por entrada, serie mayor, **victoria más rápida** (menos entradas) y **derrota más cerrada**
  (más carambolas al perder). No hay «partido con más carambolas»: el ganador siempre termina
  en el límite.
- En la TV, en automático: la previa mientras no se anota nada; el marcador con una franja
  (cara a cara y los récords que el partido puede igualar o romper) durante el juego; y al
  terminar, el resultado con los avisos de récord y el cara a cara ya actualizado.
- Desde el iPad, el botón «TV: …» de la barra cambia lo que muestra la TV: automático, récords,
  cara a cara o marcador. Cada partido nuevo vuelve a automático.
- Sin TV, la línea del cara a cara aparece en «¿Quién sale?».

### Operación
- Deshacer siempre disponible (revierte la última acción confirmada).
- Cada entrada confirmada se guarda al instante: si el iPad se apaga o se cierra Safari,
  el partido continúa donde quedó.

### Partidos de dos jugadores
- Cuando falta alguien y juegan sólo dos, esos partidos se contabilizan **por separado**:
  no cuentan para la ronda de tres.

## Pendiente
Vive en [ROADMAP.md](ROADMAP.md) (rotación con 4 jugadores, entrada de igualación, etc.).
