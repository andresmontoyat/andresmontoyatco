// ══════════════════════════════════════════════════════════════════════════════════════════════
//  GAME VISUAL CONFIG — el único lugar para ajustar lo visual del World RPG.
//  Editas un valor aquí → `npm run build` → recargas http://localhost:4321/en/game.
//  (Solo hace falta `npm run assets:pack` si cambias qué SPRITE se usa, en assets/manifest.js.)
//  Cada campo dice qué hace. Los módulos del juego leen de aquí — no toques constantes sueltas.
// ══════════════════════════════════════════════════════════════════════════════════════════════

export const CONFIG = {
  // ── 🌊 Estanques ────────────────────────────────────────────────────────────────────────────
  pond: {
    // Un objeto por estanque. x,y = centro en el mundo; r = radio del agua (súbelo para uno más
    // grande y redondo, p.ej. 100). Añade/quita objetos para más/menos estanques.
    ponds: [
      { x: 240, y: 920, r: 96 },
      { x: 1180, y: 760, r: 88 },
    ],
    collisionFactor: 0.82, // qué tan adentro del agua se bloquea al jugador (× r). 1 = justo el borde
    wave: {
      rings: 3, // nº de anillos de ola
      speed: 1.1, // velocidad de ondulación
      amplitude: 2, // tamaño del bamboleo
      color: 'rgba(255,255,255,0.16)', // color/opacidad. Baja el 0.35 → olas más sutiles
    },
  },

  // ── 🧍 Hero (Carlos) ────────────────────────────────────────────────────────────────────────
  avatar: {
    width: 40, // ancho dibujado en pantalla
    height: 44, // alto dibujado
    stepRate: 0.15, // velocidad del ciclo de caminar (mayor = piernas más rápidas)
    idleTicks: 44, // ticks por frame de la respiración idle (mayor = más lento)
  },

  // ── 🌀 Molino (aspas animadas) ──────────────────────────────────────────────────────────────
  windmill: {
    sailDx: 34, // desplazamiento X de las aspas sobre la torre (px nativos, pre-escala)
    sailDy: -6, // desplazamiento Y de las aspas
    sailTicks: 22, // ticks por frame de giro (mayor = gira más lento)
  },

  // ── 🌳 Decoración ───────────────────────────────────────────────────────────────────────────
  decor: {
    density: 1 / 20000, // objetos por px² de mundo. Baja (1/40000) = menos árboles/props
    swaySkew: 0.05, // cuánto se mecen árboles con el viento
    swaySkewBush: 0.02, // cuánto se mecen los arbustos
  },

  // ── 🧑‍🌾 NPCs (aldeanos) ─────────────────────────────────────────────────────────────────────
  npc: {
    width: 38, // ancho dibujado
    height: 40, // alto dibujado
    wanderSpeed: 0.16, // velocidad de deambular
    ampX: 30, // radio horizontal de deambular
    ampY: 15, // radio vertical
    frontOffset: 20, // qué tan abajo del edificio aparecen
  },

  // ── 🎨 Tinte de era (cyber/castillo) ────────────────────────────────────────────────────────
  tint: {
    eraAlpha: 0.34, // fuerza del wash de color en biomas cyber/castillo (0 = sin tinte)
  },
}

export default CONFIG
