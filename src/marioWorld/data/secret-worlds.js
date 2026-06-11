// src/marioWorld/data/secret-worlds.js
//
// Hidden worlds catalog. Each entry unlocks via the matching command typed
// anywhere on the page (decision Q13-B). Cantidad dinámica (decision Q14-D);
// operator agrega entries cuando quiera — no hard-coded count.
//
// Schema:
//   {
//     id:      'about-secret',          // matches entry.id used in deriveWorlds
//     command: '/about-secret',         // typed token; '/' starter is conventional
//     label:   { en: 'The whole story', es: 'La historia completa' },
//     biome:   'pradera' | 'desierto' | 'selva' | 'cyber' | 'castillo',
//     content: { en: '…paragraph(s)…',   es: '…párrafo(s)…' },
//   }

const SECRET_WORLDS = []

export { SECRET_WORLDS }
export default SECRET_WORLDS
