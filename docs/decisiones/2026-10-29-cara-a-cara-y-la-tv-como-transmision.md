# Cara a cara, récord de perder con menos carambolas y la TV como transmisión

- Fecha: 2026-10-29 · Proyecto: PERSONAL/CARAMBOLA
- Sesión: `2026-10-29 PERSONAL/CARAMBOLA — firma de la app y estadísticas cara a cara`
- Todo se deriva del historial ya guardado (jugadores, ganador, entradas por jugador): no cambió
  el formato de los datos y vale para los partidos anteriores.

## 1. La TV también muestra récords y el cara a cara del par
- Brain-id: `3b61ce94-62fe-4c2b-a5fb-83c976f5270e`
- Qué se decidió (Héctor): desde el área del marcador se ven los récords, y en cada partido el
  historial entre los dos que juegan, para motivarlos. Incluye la matriz de quién le ganó a quién
  en Estadísticas.

## 2. Récord de perder con menos carambolas
- Brain-id: `796e1ca6-6b17-41a5-8482-01b0bcce2754`
- Qué se decidió: puntaje absoluto del perdedor, mostrado con el límite («2 de 50»). Gana el más
  bajo; ante un empate, el primero; cero cuenta. Sin valor inicial. Avisa al igualarlo o romperlo.
- Alternativas descartadas: proporción del límite (menos legible en la mesa) y tablas separadas
  por límite.

## 3. Victoria más rápida y derrota más cerrada en el cara a cara
- Brain-id: `d0f02111-1118-4464-bac3-b3da3f671cd7`
- Qué se decidió: en lugar del «partido con más carambolas», que siempre es el límite para el
  ganador, ganar en menos entradas y perder con más carambolas. Más los últimos cinco, la racha
  en el duelo, promedio y serie mayor, por modalidad y formato.
- Alternativa descartada: el «partido con más carambolas» tal como se pidió.

## 4. La TV sigue el momento del partido; un botón la cambia a mano
- Brain-id: `90db0a1e-6301-455e-915f-daeb20554c9f`
- Qué se decidió: en automático, previa → marcador con franja → cierre. El botón «TV: …» de la
  barra del iPad alterna automático, récords, cara a cara y marcador; cada partido nuevo vuelve
  a automático.
- Alternativas descartadas: un selector de cuatro botones (no cabe en la barra) y una TV sólo manual.
- Consecuencia: probado en Chromium (`npm run e2e`); falta verlo en la TV con el mini 4.

## Otras entradas del mismo cierre
- Hecho: el historial de estas semanas se anotó desde el ícono de la web en el mini 4 y pasó a la app nativa `bff80640-cb25-4c76-9e74-39b1c3a20c58`
- Hecho: el perfil ad hoc de la app vence el 2027-10-29 `519ca104-0d22-49bd-bf24-013bfce6458e`
- Lección (PERSONAL): en iPadOS la web del ícono y la de Safari tienen datos y actualización aparte `296b8aff-acc9-4a72-853d-3baf26d8569f`
- Lección (PERSONAL): el Finder no instala un .ipa ad hoc en iPadOS 15; Apple Configurator sí `229b015d-9d74-46d7-9a9e-eab6ebe7f06b`
