# Career RPG — de mundo explorable a RPG corto

**Fecha:** 2026-10-20 · **Estado:** propuesta · **Relacionado:** [ADR 0001](../../adr/0001-the-map-owns-the-world.md),
[world-rpg-design](2026-07-29-world-rpg-design.md), [world-richness-design](2026-07-31-world-richness-design.md),
`world-editor/docs/BACKLOG.md`

## 1. Para quién y para qué

El juego vive en `/en/game` y `/es/game` del portafolio. Quien lo abre es, sobre todo, un **recruiter o un
líder técnico** que ya vio el sitio y quiere algo distinto. Tiene **3 a 5 minutos**, juega desde el
navegador, a veces desde el teléfono, y no va a leer instrucciones.

El juego cumple su función si al salir esa persona:

1. recorrió la carrera en orden (2007 → 2026) y recuerda **qué rol, qué empresa y qué impacto**;
2. vio crecer un stack concreto (Java, Spring, Kafka, Keycloak, AWS…) en lugar de leerlo en una lista;
3. terminó en una **llamada a la acción**: descargar el CV o escribir.

No busca competir como juego. Busca que la carrera se **recorra** en vez de leerse.

## 2. Estado actual (2026-10-20)

| Área | Qué hay | Dónde |
|------|---------|-------|
| Movimiento | Top-down con colisión AABB y círculos, cámara, táctil | `engine/topdown.js`, `controls/touch.js` |
| Mundo | Mapa creado en el editor: terreno, decoración y **11 casas con `door:<id>`** (11 de 11) | `world/authored/career.map.json` |
| Casas | Puerta en la base, diálogo con rol, empresa, métrica y stack | `entities/site.js`, `render/dialog.js` |
| Progreso | Contador de casas visitadas (`sites X/11`) | `render/hud.js` |
| Ambiente | NPCs que deambulan, animales, molino, estanques, luz, música y SFX, partículas | `entities/*`, `render/*`, `audio/*` |
| Secreto | El código Konami revela los proyectos paralelos (POIs ocultos) | `input/konami.js`, `worldRpg.js` |
| Datos | Todo sale de `experience.json`, la misma fuente que el sitio y el CV | `src/data/` |
| Pipeline | Editor → export v2 → `map:import` → `assets:pack` → juego | `scripts/import-map.mjs` |

El generador procedural de casas (`world/overworld.js`) ya no se usa para ningún empleo visible.

## 3. Lo que falta, por pilar

| Pilar | Hoy | Falta |
|-------|-----|-------|
| **Interiores** | La puerta abre un cuadro de texto | Entrar a una sala propia de cada empresa |
| **Diálogo** | Los NPCs solo decoran | NPCs que cuentan algo: un compañero un logro, un cliente el impacto |
| **Objetivo** | Visitar 11 de 11 | Un hilo principal que dé un motivo para seguir |
| **Progresión** | Ninguna | Ganar las skills de cada trabajo; el stack crece en el HUD |
| **Recompensas** | Ninguna | Objetos con significado: certificaciones, credenciales, el CV |
| **Persistencia** | Al recargar se pierde todo | Guardar casas vistas, skills y posición |
| **Cierre** | No existe | Escena final con resumen y llamada a la acción |
| **Mundo** | Un solo mapa | Zonas por era, cuevas, puntos de interés |

## 4. Fuera de alcance

- **Combate, vida, enemigos.** `careerGame.js` (el modo plataforma anterior) tiene enemigos y power-ups;
  no se traen al RPG. Morir en el portafolio de alguien no comunica nada.
- **Horas de juego.** Si el recorrido completo pasa de ~5 minutos, se recorta.
- **Contenido inventado.** Cada texto sale de `experience.json` o de un dato que el autor confirmó. Nada de
  métricas de relleno.
- **Multijugador, cuentas o backend.** Sigue siendo un sitio estático.

## 5. Fases

Cada fase se puede publicar sola y deja el juego mejor que antes.

### Fase 1 — Retirar el generador

Lo exige el [ADR 0001](../../adr/0001-the-map-owns-the-world.md) una vez que todas las experiencias
visibles tienen `door:`.

- Borrar la generación de casas de `world/overworld.js`; el mapa pasa a ser la única fuente de casas.
- `map:import` falla si una experiencia visible queda sin casa, en lugar de caer al generador.

**Aceptación:** los tests y el build pasan; las 11 puertas abren; ocultar una experiencia en
`experience.json` sin quitar su casa del mapa hace fallar el import con un mensaje que nombra el id.

### Fase 2 — Interiores con un NPC que habla

Es lo que más acerca la experiencia a un RPG, y también la fase más grande. Requiere un **ADR de interiores**
antes de escribir código.

- **Editor:** representar un interior. Hoy no existe (`BACKLOG.md`: "Interiors have no representation at
  all"). Opciones a decidir en el ADR: un documento por interior, o varios mapas en un proyecto con un
  portal entre ellos.
- **Juego:** cambio de escena exterior → interior → exterior, conservando posición y estado.
- **Contenido:** una sala por empresa con un NPC. Su diálogo sale de los bullets de `experience.json`,
  reescritos en voz de personaje y revisados por el autor.
- **Diálogo:** varias páginas por NPC y bilingüe, como el resto del sitio.

**Aceptación:** entrar y salir de las 11 casas sin perder posición; cada NPC dice al menos un logro real de
ese empleo, en EN y ES; funciona con teclado y táctil; se mantiene el objetivo de rendimiento (Lighthouse
90+ en móvil para la página del juego).

### Fase 3 — Skills como recompensa

- Al completar una casa, el jugador gana las tecnologías de ese trabajo (`tech[]` de `experience.json`).
- El HUD muestra el stack que crece, agrupado (lenguajes, frameworks, datos, cloud, seguridad).
- Las primeras veces se destacan, por ejemplo "primera vez con Kafka · Tul 2022".

**Aceptación:** el conjunto de skills del jugador al terminar es exactamente la unión de los `tech[]`
visibles; ninguna skill aparece si no está en los datos.

### Fase 4 — Guardar partida y final

- Guardar en `localStorage` las casas vistas, las skills, la posición y el idioma. Leer y escribir
  protegidos con `try/catch`: en una ventana privada el juego empieza de cero, sin fallar.
- Al llegar a 11 de 11: escena final con resumen (años, roles, stack) y dos botones: **descargar CV** y
  **contactar**.

**Aceptación:** recargar a mitad del recorrido conserva el progreso; borrar el almacenamiento reinicia sin
errores; la escena final enlaza al PDF del idioma actual.

### Fase 5 — Misión principal y zonas por era

Es pulido, no algo central. Se hace solo si las fases 1 a 4 quedaron cortas en motivación.

- Un hilo principal ligero, por ejemplo reunir las piezas del stack para "desplegar" el último proyecto.
- Zonas por era (2007–2012, 2013–2019, 2020–2026) con su paleta; cuevas y puntos de interés del spec
  `world-richness`.

**Aceptación:** a definir cuando se abra la fase.

## 6. Dependencias con el editor

| Fase | El editor necesita |
|------|--------------------|
| 1 | Nada |
| 2 | Representar interiores y portales; colocar NPCs con un tag (`npc:<id>`); exportar más de un mapa |
| 3–4 | Nada |
| 5 | Zonas o capas por era; quizás generación de cuevas |

Fricciones abiertas del editor que afectan el trabajo de autor: el lienzo se mueve cuando cambia el largo
del texto de estado (#8), los recientes aparecen primero al buscar (#5), las tiras de `Unique_Buildings`
hay que recortarlas a mano (#6), faltan coordenadas x/y (#7) y el panel derecho es angosto (#10).

## 7. Riesgos

- **Alcance.** Los interiores pueden crecer sin control. Mitigación: una sala por empresa y un NPC, nada más
  en la fase 2.
- **Rendimiento en móvil.** Más escenas, más sprites. Mitigación: cargar el interior al entrar y medir con
  Lighthouse en cada fase.
- **Contenido.** Los diálogos necesitan la voz del autor. Mitigación: borradores generados a partir de los
  bullets, siempre revisados antes de publicar.
- **Datos sin verificar.** Hay métricas e ítems del timeline todavía abiertos (impacto de Mr. Yoker,
  números de DevOps en Software Estratégico, uso de Java 17). No entran al juego hasta confirmarlos.

## 8. Decisiones abiertas

1. **Interiores:** ¿un documento por interior o varios mapas en un proyecto? Se decide en el ADR de la fase 2.
2. **Diálogo:** ¿texto lineal por páginas o con opciones de respuesta? Propuesta: lineal en la fase 2.
3. **Final:** ¿muestra la escena final también el formulario de contacto, o solo enlaza a él?
4. **Konami:** ¿siguen los proyectos paralelos como secreto, o pasan a ser misiones secundarias?
5. **Orden:** ¿interiores (fase 2) antes que skills y final (fases 3–4)? Las fases 3–4 son más baratas y
   ya dan un recorrido completo con cierre; los interiores dan la sensación de RPG.
