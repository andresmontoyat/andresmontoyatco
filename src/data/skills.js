export const SKILL_CATEGORIES = {
  lang: { en: 'Languages & Frameworks', es: 'Lenguajes & Frameworks', color: '#3b82f6' },
  ai: { en: 'AI Tooling', es: 'Herramientas IA', color: '#a855f7' },
  arch: { en: 'Architecture & Integration', es: 'Arquitectura & Integración', color: '#06b6d4' },
  cloud: { en: 'Cloud', es: 'Cloud', color: '#10b981' },
  devops: { en: 'DevOps & Infra', es: 'DevOps & Infra', color: '#f59e0b' },
  security: { en: 'Security', es: 'Seguridad', color: '#ef4444' },
  data: { en: 'Data', es: 'Datos', color: '#8b5cf6' },
  hardware: { en: 'IoT & Hardware', es: 'IoT & Hardware', color: '#ec4899' },
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
