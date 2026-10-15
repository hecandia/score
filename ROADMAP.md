# Roadmap — marcador de carambola

Qué tiene la app, qué falta y qué está en duda. Las reglas de juego detalladas viven en
[REQUISITOS.md](REQUISITOS.md); este archivo sólo dice en qué estado está cada cosa.

Estados: ✅ publicado · 🔎 publicado, sin validar en la mesa · ⏳ pendiente · ❓ supuesto por confirmar · 💡 propuesta, nadie la pidió

## v1 — publicada (2026-09-25) en https://hecandia.github.io/score/

| Funcionalidad | Estado |
|---|---|
| Noche de ronda de tres: orden del tiro a la banda, rotación automática (ganador sigue, dos seguidos descansa) | 🔎 |
| Partido de dos, contabilizado aparte | 🔎 |
| Modalidades rosario y tres bandas; límite 20 / 30 / 50 / otro; cambiables entre partidos | 🔎 |
| Rosario: aviso «TRES BANDAS» en la 10.ª, 20.ª…, acumulativo entre entradas | 🔎 |
| Anotar entrada: total al terminar, o una por una con acumulado que confirma el tirador | 🔎 |
| Récords en cuatro tablas (modalidad × formato): racha, tiro más largo, récord negro | 🔎 |
| Récords iniciales de Francisco (rosario, ronda de tres): 7 · 11 · 8 | ✅ |
| Aviso al igualar o romper un récord | 🔎 |
| Estadísticas: ganados semana / total, promedio por entrada, historial por noche | 🔎 |
| Deshacer persistente; la noche sobrevive a cerrar Safari o apagar el iPad | 🔎 |
| Respaldo por correo o texto, y restaurar | ✅ (probado en e2e; Héctor lo usa para volver al arranque tras simular) |
| Ícono y pantalla completa desde la pantalla de inicio | ✅ |
| Funciona sin internet (AppCache) | 🔎 no comprobado en modo avión |

## v2 — ajustes tras la primera noche real (publicada 2026-10-09, manifest v3)

| Funcionalidad | Estado |
|---|---|
| El marcador grande del tirador muestra el total con lo de la entrada, en azul y «+N por confirmar» hasta que confirma | 🔎 |
| Aviso «TRES BANDAS» grande dentro del marcador del tirador (rosario); sigue a lo pendiente en los dos modos | 🔎 |
| Teclado numérico para anotar el total de la entrada (el primer dígito reemplaza, los siguientes se agregan; no pasa del límite) | 🔎 |
| Bola blanca / amarilla por jugador: se elige al empezar la noche; el que entra juega con la bola del que sale | 🔎 |
| Pantalla del partido para duplicarla en una TV de 19″ por HDMI: marcador arriba, controles abajo, sin scroll | 🔎 falta probar con el adaptador «Apple 30-pin Digital AV Adapter» |
| Rachas por jugador | ✅ sin cambio: están en Récords; Héctor las había buscado en Estadísticas |

## v3 — app nativa para el iPad mini 4 (en construcción, sin publicar)

Decisiones en [docs/decisiones/2026-10-15-app-nativa-con-dos-pantallas-y-control-remoto.md](docs/decisiones/2026-10-15-app-nativa-con-dos-pantallas-y-control-remoto.md). La web del iPad 3 no cambia.

| Funcionalidad | Estado |
|---|---|
| Cáscara nativa (`ios/`) con la misma web; datos en un archivo de la app | ⏳ probada en el simulador; falta instalarla en el mini 4 (`.ipa` por el Finder, con la membresía) |
| TV opcional: sin TV opera como hoy; con TV el marcador va a la TV y el iPad queda con controles | ⏳ probada en Chromium; el simulador no entrega la TV, falta en el mini 4 con el adaptador Lightning a HDMI |
| Control remoto desde el navegador del teléfono (iPhone o Android), con QR y código de acceso | ⏳ probado contra la app en el simulador; falta en el mini 4 y con un teléfono real |
| Pasar el historial del iPad 3 al mini 4 con el respaldo | ⏳ |

## Siguiente

| Tema | Estado | Qué lo destraba |
|---|---|---|
| Probar el iPad en la TV con el adaptador | ⏳ | Que Héctor consiga el «Apple 30-pin Digital AV Adapter» |
| Bola en partido de dos: hoy cada uno conserva la suya toda la noche | ❓ | Que Héctor confirme |
| Entrada de igualación: hoy gana el primero que llega al límite, sin igualar | ❓ | Que Héctor confirme cómo juegan |
| Rotación con 4 jugadores | ⏳ pospuesta por Héctor | Regla de la fila: cuando salen a la vez el que cumplió dos seguidos y el perdedor, ¿quién queda primero? |
| Comprobar el modo sin internet en el iPad (modo avión, abrir desde el ícono) | ⏳ | Una prueba de Héctor |

## Propuestas del agente (💡, nadie las pidió — decidir si entran)

- Corregir o borrar un partido ya terminado desde el historial (hoy sólo se puede deshacer hacia atrás).
- Recordatorio de respaldo si pasaron N noches sin exportar: los datos viven sólo en el iPad.
- Mostrar en la pantalla de récords quién tiene la racha viva más larga, no sólo el récord.

## Riesgos operativos

- Si el iPad se restaura de fábrica, hay que reinstalar el certificado `isrg-root-x1.cer` (ver REQUISITOS).
- Si se borran los datos de Safari, se pierde todo lo no respaldado.
