// Skill-category accents — these are DATA values (graph-node fill identity for the
// constellation), NOT Tailwind styling tokens. They are pinned to the design spec
// (Phase 14 UI-SPEC, design-system color palette) and are consumed by
// `buildConstellationGraph` to color nodes in the SVG canvas. They intentionally
// bypass the CSS-var theme system because the constellation has a single visual
// identity across light/dark themes (the canvas darkens its own backdrop). If a
// future phase needs theme-aware node colors, migrate these into theme-resolved
// tokens (e.g. `--color-skill-lang`) in src/index.css + tailwind.config.js and
// expose them through a JS resolver — out of scope for Phase 14.
const SKILL_CATEGORY_COLORS = {
  lang:     '#3b82f6',
  ai:       '#a855f7',
  arch:     '#06b6d4',
  cloud:    '#10b981',
  devops:   '#f59e0b',
  security: '#ef4444',
  data:     '#8b5cf6',
  hardware: '#ec4899',
}

export const SKILL_CATEGORIES = {
  lang:     { en: 'Languages & Frameworks',     es: 'Lenguajes & Frameworks',     color: SKILL_CATEGORY_COLORS.lang },
  ai:       { en: 'AI Tooling',                 es: 'Herramientas IA',            color: SKILL_CATEGORY_COLORS.ai },
  arch:     { en: 'Architecture & Integration', es: 'Arquitectura & Integración', color: SKILL_CATEGORY_COLORS.arch },
  cloud:    { en: 'Cloud',                      es: 'Cloud',                      color: SKILL_CATEGORY_COLORS.cloud },
  devops:   { en: 'DevOps & Infra',             es: 'DevOps & Infra',             color: SKILL_CATEGORY_COLORS.devops },
  security: { en: 'Security',                   es: 'Seguridad',                  color: SKILL_CATEGORY_COLORS.security },
  data:     { en: 'Data',                       es: 'Datos',                      color: SKILL_CATEGORY_COLORS.data },
  hardware: { en: 'IoT & Hardware',             es: 'IoT & Hardware',             color: SKILL_CATEGORY_COLORS.hardware },
}

// Canonical skill id → { category, aliases }
// aliases: alternate strings found in experience.js tech[] that map to this canonical id
const SKILLS = {
  Java: { category: 'lang', aliases: [] },
  'Spring Boot': { category: 'lang', aliases: [] },
  'JEE 5': { category: 'lang', aliases: [] },
  'Claude Code': { category: 'ai', aliases: [] },
  'GitHub Copilot': { category: 'ai', aliases: [] },
  'JetBrains Junie': { category: 'ai', aliases: [] },
  Microservices: { category: 'arch', aliases: [] },
  'Oracle Service Bus': { category: 'arch', aliases: [] },
  WebSphere: { category: 'arch', aliases: [] },
  KrakenD: { category: 'arch', aliases: [] },
  AWS: { category: 'cloud', aliases: [] },
  'Google Cloud': { category: 'cloud', aliases: ['GCP'] },
  GKE: { category: 'cloud', aliases: [] },
  Kubernetes: { category: 'devops', aliases: [] },
  Docker: { category: 'devops', aliases: [] },
  Jenkins: { category: 'devops', aliases: [] },
  SonarQube: { category: 'devops', aliases: [] },
  Nexus: { category: 'devops', aliases: [] },
  Keycloak: { category: 'security', aliases: [] },
  'Spring Security': { category: 'security', aliases: [] },
  'Oracle SQL': { category: 'data', aliases: [] },
  'SQL Server': { category: 'data', aliases: [] },
  MySQL: { category: 'data', aliases: [] },
  IoT: { category: 'hardware', aliases: [] },
  Asterisk: { category: 'hardware', aliases: [] },
  'Raspberry Pi': { category: 'hardware', aliases: [] },
}

// Build alias → canonical reverse-lookup map at module init
const _aliasMap = {}
for (const [canonical, entry] of Object.entries(SKILLS)) {
  for (const alias of entry.aliases) {
    _aliasMap[alias] = canonical
  }
}

/**
 * Resolve a raw tech string (e.g. 'GCP') to its canonical skill id (e.g. 'Google Cloud').
 * Returns the canonical id, or null if not found.
 */
export function resolveCanonical(rawSkill) {
  if (SKILLS[rawSkill]) return rawSkill
  if (_aliasMap[rawSkill]) return _aliasMap[rawSkill]
  return null
}

export { SKILLS }
export default SKILLS
