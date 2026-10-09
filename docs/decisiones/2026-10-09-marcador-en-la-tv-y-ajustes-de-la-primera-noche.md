# El marcador se ve en una TV duplicando la pantalla del iPad 3

- Fecha: 2026-10-09 · Proyecto: PERSONAL/CARAMBOLA
- Sesión: `2026-10-09 PERSONAL/CARAMBOLA — retroalimentación de la primera noche`

## 1. Duplicar la pantalla del iPad 3 en una TV por HDMI, con la pantalla del partido rediseñada
- Brain-id: `14b2443f-a059-492e-b23a-df0fc59a3210`
- Qué se decidió: conectar el iPad 3 a una TV de 19″ con el «Apple 30-pin Digital AV Adapter»
  y duplicar la pantalla. La pantalla del partido pone arriba el marcador grande (puntos, total
  pendiente, bola, aviso de tres bandas, quién tira) y abajo los controles, sin scroll en
  1024×748. Se sigue con el iPad 3.
- Alternativas descartadas y por qué:
  - Dos aparatos sincronizados, TV con el marcador y tablet con el control: para una app web
    iOS sólo duplica la pantalla, así que harían falta dos aparatos y un canal entre ellos
    (internet o un servidor local); el iPad 3 no puede hablar directo con otro aparato.
  - App nativa con contenido propio en la pantalla externa: ya descartada por la decisión de
    plataforma (`cfc61e53-1572-4cb9-92d1-5674af8b0f67`).
  - Cambiar al iPad mini 4 (iPadOS 15) que ofreció el hermano de Héctor: no cambia lo anterior
    y la pantalla es más chica.
- Consecuencias: `npm run e2e` comprueba que la pantalla del partido cabe en 748 px e imprime
  la altura de cada bloque. Falta probarlo con el adaptador en la TV.

## Otras entradas del mismo cierre
- Hecho del dominio: el que entra juega con la bola del que sale `f5a505a9-3e96-4290-8aab-2355ec6406f1`
- Lección: al cambiar lo que muestra una pantalla se revisan las reglas del flujo viejo `f5febdc8-0b9e-4c4f-93dd-88c7e5b27b76`
