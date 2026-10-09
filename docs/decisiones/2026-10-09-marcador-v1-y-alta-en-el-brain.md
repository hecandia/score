# Marcador v1: plataforma, hosting, deshacer y alta en el brain

- Fecha: 2026-10-09 (sesión iniciada el 2026-09-25) · Proyecto: PERSONAL/CARAMBOLA
- Sesión: `2026-09-25 PERSONAL/CARAMBOLA — marcador de carambola v1` (acuñada en el cierre: la sesión no abrió con `/arranque`)

## 1. App web en ES5 plano, no nativa
- Brain-id: `cfc61e53-1572-4cb9-92d1-5674af8b0f67`
- Qué se decidió: HTML + CSS + JavaScript ES5 sin framework ni compilación; `localStorage` para los datos; AppCache para funcionar sin internet; instalada desde «Agregar a pantalla de inicio». Destino: iPad 3 con iOS 9.3.6 (Safari 9, 1 GB de RAM).
- Alternativas descartadas: app nativa (el Xcode actual no apunta a iOS 9; la firma gratuita vence a los 7 días); framework con transpilación (paso de compilación y peso sin beneficio).
- Consecuencias: `npm test` falla ante sintaxis o API posterior a ES5. Ver REQUISITOS §Plataforma.

## 2. GitHub Pages + raíz ISRG Root X1 instalada en el iPad
- Brain-id: `81f76c17-715f-4dae-8c6a-49ca39dd3422` · hecho portable asociado: `27bb77de-4bae-4e45-ad3b-2f31cead718b`
- Qué se decidió: alojar en https://hecandia.github.io/score/ e instalar en el iPad, como perfil, la raíz de Let's Encrypt en la que iOS 9 no confía (`isrg-root-x1.cer`, SHA-256 verificado).
- Alternativas descartadas: servir desde la Mac por wifi (sólo en casa); dominio propio con HTTP (costo, sin cifrado); aceptar el aviso de Safari en cada visita.
- Consecuencias: si el iPad se restaura, el perfil se reinstala.

## 3. Pila de deshacer compacta
- Brain-id: `58bc5a7e-b56b-4aef-b37b-e8503694287b`
- Qué se decidió: cada paso de deshacer guarda sólo los partidos de la noche abierta; lo anterior está congelado y se toma del estado vigente al deshacer.
- Alternativas descartadas: 40 copias completas (agotan los ~5 MB de `localStorage` en uno o dos años); deshacer sólo en memoria (se pierde al recargar).
- Consecuencias: restaurar un respaldo vacía la pila y no se deshace. Código: `js/datos.js`.

## 4. Alta en el brain como `PERSONAL/CARAMBOLA`
- Brain-id: `8f5492df-2ebc-478f-a67d-8bb69f9f294f`
- Qué se decidió: subámbito de PERSONAL, sin subámbitos propios. Declarado en `CLAUDE.md`.
- Alternativas descartadas: ámbito nuevo `CARAMBOLA`; subámbitos por jugador o por noche.
- Consecuencias: entra forward-only, sin volcar historia.

## Otras entradas del mismo cierre
- Hechos del dominio: rotación de tres `422c89f0-067d-4997-9fd1-b72d1ddf1e1f` · rosario `87be2569-406c-411c-b5e4-1abd76a58a61`
- Lecciones portables (PERSONAL): AppCache `4cb2be9a-f586-4e21-923b-6025e523a66f` · versión fijada de memoria `6679677b-8175-41e7-9eab-e0c745a5aaa3` · `vm` y `deepStrictEqual` `d591236e-b488-41c9-b16c-1fc88f509551`
