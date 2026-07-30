const ANCHORS = {
  farm: { x: 360, y: 1120 },
  pradera: { x: 380, y: 700 },
  desierto: { x: 820, y: 400 },
  selva: { x: 1300, y: 560 },
  cyber: { x: 1360, y: 1040 },
  castillo: { x: 1820, y: 760 },
}
const HIDDEN_POS = [{ x: 1620, y: 1180 }, { x: 1830, y: 1200 }]
export const WORLD_W = 2140
export const WORLD_H = 1360

export function startYear(entry) {
  const s = (entry.date && entry.date.en) || ''
  const m = s.match(/\d{4}/)
  return m ? Number(m[0]) : 0
}

function ringPos(center, i, n) {
  if (n <= 1) return { cx: center.x, cy: center.y - 40 }
  const ang = (-0.5 + i / (n - 0.001)) * Math.PI * 1.1 - 0.6
  return { cx: center.x + Math.cos(ang) * 155 + (i - (n - 1) / 2) * 18, cy: center.y + Math.sin(ang) * 108 - 40 }
}

function toSite(e, bi, pos, hidden) {
  const featured = !!e.featured
  return {
    id: e.id, co: e.company || e.co, title: e.title, date: e.date,
    metric: e.metric || null, tech: e.tech || [], bi,
    type: featured ? 'castle' : 'house',
    cx: pos.cx, cy: pos.cy, w: featured ? 92 : 66, h: featured ? 104 : 78,
    seen: false, hidden: !!hidden,
  }
}

export function buildOverworld(json, biomeForYear, sideProjects = []) {
  const visible = json.entries.filter(e => e.visible !== false)
    .map(e => ({ e, y: startYear(e) })).sort((a, b) => a.y - b.y)
  const byBiome = {}
  const sites = visible.map(({ e, y }) => {
    const bi = biomeForYear(y)
    byBiome[bi] = (byBiome[bi] || 0)
    const pos = ringPos(ANCHORS[bi], byBiome[bi]++, visible.filter(v => biomeForYear(v.y) === bi).length)
    return toSite(e, bi, pos, false)
  })
  const hiddenSites = sideProjects.map((sp, i) =>
    toSite(sp, 'cyber', { cx: HIDDEN_POS[i % HIDDEN_POS.length].x, cy: HIDDEN_POS[i % HIDDEN_POS.length].y }, true))
  const regions = Object.keys(ANCHORS).filter(k => k !== 'farm').map(k => ({ bi: k, ...ANCHORS[k] }))
  const path = [ANCHORS.farm, ANCHORS.pradera, ANCHORS.desierto, ANCHORS.selva, ANCHORS.cyber, ANCHORS.castillo]
  return { farm: ANCHORS.farm, regions, sites, hiddenSites, worldW: WORLD_W, worldH: WORLD_H, path }
}
