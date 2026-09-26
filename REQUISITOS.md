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
- Riesgo a probar **antes de construir**: que iOS 9 acepte el certificado HTTPS del hosting
  (iOS 9 no confía en la raíz actual de Let's Encrypt).
  Medido 2026-09-25: `*.github.io` usa Let's Encrypt (YR1 → Root YR → ISRG Root X1).
  Plan B si el iPad lo rechaza: instalar a mano la raíz ISRG Root X1 como perfil en el iPad.

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
- Consecuencia: el marcador se anota entrada por entrada, no sólo el resultado final.
- Récords **aparte por modalidad** (tres bandas, rosario) **y por formato** (ronda de tres,
  partido de dos): cuatro tablas de récords.
- **Récords iniciales a cargar** (todos de Francisco):
  - Rosario, ronda de tres: racha de 7 victorias; tiro más largo de 11; récord negro de 8 derrotas.

### Registro de cada entrada (configurable)
- **Total al terminar el tiro:** se anota cuántas hizo en la entrada.
- **Una por una:** el jugador contrario va sumando +1 en un acumulado temporal; al terminar la
  entrada, el que tiró confirma (o corrige) y recién ahí se asienta.
- En rosario, el modo una por una avisa en vivo cuándo toca la de tres bandas; en modo total
  la app muestra antes de la entrada cuántas libres faltan, pero no puede validar.

### Configuración del partido
- Límite de carambolas configurable (usuales: 20 o 50).
- Modalidades: **tres bandas** y **rosario** (9 carambolas libres + 1 de tres bandas).
- En rosario, la app registra las libres y avisa cuando la siguiente tiene que ser de tres bandas.
- En rosario la cuenta es acumulativa entre turnos: las carambolas 10.ª, 20.ª, 30.ª… de cada
  jugador tienen que ser de tres bandas, sin importar en qué turno caigan.
  Ej.: turno 1 = 5 libres; turno 2 = 4 libres + tres bandas (la 10.ª) + 8 libres → 18.
- Supuesto: cada carambola vale 1 punto, sea libre o de tres bandas.

### Estadísticas
Filtrables por modalidad y formato, igual que los récords:
- Partidos ganados por jugador: en la semana y en el histórico.
- Promedio de carambolas por entrada.
- Historial de partidos, noche por noche.

### Operación
- Deshacer siempre disponible (revierte la última acción confirmada).
- Cada entrada confirmada se guarda al instante: si el iPad se apaga o se cierra Safari,
  el partido continúa donde quedó.

### Partidos de dos jugadores
- Cuando falta alguien y juegan sólo dos, esos partidos se contabilizan **por separado**:
  no cuentan para la ronda de tres.

## Pendiente
- **Rotación con 4 jugadores** (pospuesta). Caso sin resolver: cuando en el mismo partido
  sale el que cumplió dos seguidos y el que perdió, ¿quién queda primero en la fila?
