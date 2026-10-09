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

## Siguiente

| Tema | Estado | Qué lo destraba |
|---|---|---|
| Ajustes tras la primera noche real de rondas | ⏳ | La retroalimentación de Héctor |
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
