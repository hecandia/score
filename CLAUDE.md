## Open Brain (memoria transversal)

Este proyecto participa del Open Brain de Héctor (MCP `open-brain`).
Project canónico: `PERSONAL/CARAMBOLA`

**Al arrancar la sesión**: invocar el skill `/arranque` ANTES de leer
cualquier otro documento del repo. Sin su bloque «🧠 Arranque» visible, el
arranque no ocurrió.

**Durante la sesión**: decisión, lección o hecho durable que exprese Héctor
→ marcador `📌 candidato a brain` + `capture_thought(..., staged=true)` en el
momento. Nada entra al canon sin su veto (OB-3). Ante un tema ya decidido,
citar el identificador en vez de re-deliberar (OB-8).

**Al cerrar** (o cuando Héctor diga "cerremos"): skill `/cierre`. El repo
guarda el estado; el brain guarda el porqué (OB-7).

## Integración

Ramas: commit directo a main (proyecto personal, sin CI); el merge lo hace el agente.

Ojo: `main` es la rama que sirve GitHub Pages, así que **un push a `main` publica la
web**. El iPad 3 sólo baja lo nuevo si además sube la versión de `carambola.appcache`.
