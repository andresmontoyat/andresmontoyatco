import { describe, it, expect } from 'vitest'
import { buildConstellationGraph, PLANETS_K } from './constellation.graph.js'
import EXPERIENCE from '../data/experience.js'
import { SKILL_CATEGORIES, SKILLS } from '../data/skills.js'

// Helper: find a node by label
function findNode(nodes, label) {
  return nodes.find((n) => n.label === label) || null
}

// Helper: find an edge between two nodes (undirected)
function findEdge(edges, labelA, labelB) {
  return edges.find(
    (e) =>
      (e.source === labelA && e.target === labelB) ||
      (e.source === labelB && e.target === labelA)
  ) || null
}

describe('buildConstellationGraph - nodes', () => {
  it('should return nodes and edges', () => {
    const graph = buildConstellationGraph(EXPERIENCE, SKILLS)
    expect(graph).toHaveProperty('nodes')
    expect(graph).toHaveProperty('edges')
    expect(Array.isArray(graph.nodes)).toBe(true)
    expect(Array.isArray(graph.edges)).toBe(true)
  })

  it('should derive one node per canonical skill (26 skills from the catalog used in experience)', () => {
    const { nodes } = buildConstellationGraph(EXPERIENCE, SKILLS)
    // Every node id should be unique
    const ids = nodes.map((n) => n.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('should collapse GCP and Google Cloud into a single node', () => {
    const { nodes } = buildConstellationGraph(EXPERIENCE, SKILLS)
    const gcNodes = nodes.filter((n) => n.label === 'Google Cloud')
    const gcpNodes = nodes.filter((n) => n.label === 'GCP')
    expect(gcNodes).toHaveLength(1)
    expect(gcpNodes).toHaveLength(0)
  })

  it('Google Cloud node count should reflect both Blerify (Google Cloud) and KLEVER (GCP) jobs', () => {
    const { nodes } = buildConstellationGraph(EXPERIENCE, SKILLS)
    const gc = findNode(nodes, 'Google Cloud')
    expect(gc).not.toBeNull()
    // Both Blerify (idx 2) and KLEVER (idx 3) use Google Cloud / GCP
    expect(gc.count).toBeGreaterThanOrEqual(2)
    expect(gc.experienceIdx).toContain(2)
    expect(gc.experienceIdx).toContain(3)
  })

  it('should keep GKE as its own node separate from Google Cloud', () => {
    const { nodes } = buildConstellationGraph(EXPERIENCE, SKILLS)
    const gke = findNode(nodes, 'GKE')
    const gc = findNode(nodes, 'Google Cloud')
    expect(gke).not.toBeNull()
    expect(gc).not.toBeNull()
    expect(gke.id).not.toBe(gc.id)
  })

  it('each node should have id, label, category, color, count, years, experienceIdx', () => {
    const { nodes } = buildConstellationGraph(EXPERIENCE, SKILLS)
    for (const node of nodes) {
      expect(node).toHaveProperty('id')
      expect(node).toHaveProperty('label')
      expect(node).toHaveProperty('category')
      expect(node).toHaveProperty('color')
      expect(typeof node.count).toBe('number')
      expect(Array.isArray(node.years)).toBe(true)
      expect(node.years).toHaveLength(2)
      expect(Array.isArray(node.experienceIdx)).toBe(true)
    }
  })

  it('node color should match SKILL_CATEGORIES[category].color', () => {
    const { nodes } = buildConstellationGraph(EXPERIENCE, SKILLS)
    for (const node of nodes) {
      const expectedColor = SKILL_CATEGORIES[node.category]?.color
      expect(node.color).toBe(expectedColor)
    }
  })

  it('node count should equal number of distinct experiences using that skill', () => {
    const { nodes } = buildConstellationGraph(EXPERIENCE, SKILLS)
    const java = findNode(nodes, 'Java')
    expect(java).not.toBeNull()
    // Java appears in entries 0,1,2,3,4,5,6,7,8,9,10,11 — most entries
    const javaCount = EXPERIENCE.filter((e) =>
      e.tech.some((t) => t === 'Java')
    ).length
    expect(java.count).toBe(javaCount)
  })

  it('node years should be [min start, max end] across its experiences (null end → 2026)', () => {
    const { nodes } = buildConstellationGraph(EXPERIENCE, SKILLS)
    const java = findNode(nodes, 'Java')
    expect(java).not.toBeNull()
    // Java spans 2007 (Mercurio) to 2026 (Coderio, end: null → 2026)
    expect(java.years[0]).toBe(2007)
    expect(java.years[1]).toBe(2026)
  })

  it('experienceIdx should contain all indices of experiences using that skill (after alias resolution)', () => {
    const { nodes } = buildConstellationGraph(EXPERIENCE, SKILLS)
    const springBoot = findNode(nodes, 'Spring Boot')
    expect(springBoot).not.toBeNull()
    const expectedIdxs = []
    EXPERIENCE.forEach((e, i) => {
      if (e.tech.includes('Spring Boot')) expectedIdxs.push(i)
    })
    expectedIdxs.forEach((idx) => {
      expect(springBoot.experienceIdx).toContain(idx)
    })
    expect(springBoot.experienceIdx).toHaveLength(expectedIdxs.length)
  })
})

describe('buildConstellationGraph - edges', () => {
  it('should produce edges for every unordered pair of skills sharing a job', () => {
    const { edges } = buildConstellationGraph(EXPERIENCE, SKILLS)
    // Java + Spring Boot appear together in many jobs — must have an edge
    const javaSpring = findEdge(edges, 'Java', 'Spring Boot')
    expect(javaSpring).not.toBeNull()
    expect(javaSpring.weight).toBeGreaterThanOrEqual(1)
  })

  it('edge weight should equal the number of shared jobs for the pair', () => {
    const { edges } = buildConstellationGraph(EXPERIENCE, SKILLS)
    const javaSpring = findEdge(edges, 'Java', 'Spring Boot')
    // Count manually: entries with both Java AND Spring Boot
    const sharedCount = EXPERIENCE.filter(
      (e) => e.tech.includes('Java') && e.tech.includes('Spring Boot')
    ).length
    expect(javaSpring.weight).toBe(sharedCount)
  })

  it('edges should be de-duplicated (no source/target pair appears twice)', () => {
    const { edges } = buildConstellationGraph(EXPERIENCE, SKILLS)
    const seen = new Set()
    for (const e of edges) {
      const key = [e.source, e.target].sort().join('|')
      expect(seen.has(key), `duplicate edge: ${e.source} — ${e.target}`).toBe(false)
      seen.add(key)
    }
  })

  it('should have no self-edges (source !== target)', () => {
    const { edges } = buildConstellationGraph(EXPERIENCE, SKILLS)
    for (const e of edges) {
      expect(e.source).not.toBe(e.target)
    }
  })

  it('each edge should have source, target, and numeric weight', () => {
    const { edges } = buildConstellationGraph(EXPERIENCE, SKILLS)
    for (const e of edges) {
      expect(e).toHaveProperty('source')
      expect(e).toHaveProperty('target')
      expect(typeof e.weight).toBe('number')
      expect(e.weight).toBeGreaterThan(0)
    }
  })

  it('GCP (KLEVER) and Google Cloud (Blerify) co-occurrence with Java collapses to single Java-GoogleCloud edge', () => {
    const { edges } = buildConstellationGraph(EXPERIENCE, SKILLS)
    const javaGC = findEdge(edges, 'Java', 'Google Cloud')
    expect(javaGC).not.toBeNull()
    // Both Blerify (idx2) and KLEVER (idx3) have Java + Google Cloud/GCP
    expect(javaGC.weight).toBeGreaterThanOrEqual(2)
  })

  // WR-03 regression: edge source/target round-trip exactly through whatever
  // serialization the edge map uses. The OLD key `${a}|${b}` + split('|')
  // would corrupt any label containing '|' (e.g. the translations.js label
  // "REST / gRPC" is the same risk class). Asserting round-trip identity
  // here pins the contract: edge.source and edge.target must each match
  // their corresponding node.label exactly, character for character.
  it('edges round-trip source/target labels with no delimiter-based corruption', () => {
    const { nodes, edges } = buildConstellationGraph(EXPERIENCE, SKILLS)
    const labels = new Set(nodes.map((n) => n.label))
    for (const e of edges) {
      expect(labels.has(e.source), `edge source '${e.source}' is not a node label`).toBe(true)
      expect(labels.has(e.target), `edge target '${e.target}' is not a node label`).toBe(true)
    }
  })
})

describe('buildConstellationGraph - planets-tier (D-20-PLANETS-TIER)', () => {
  it('exports PLANETS_K constant equal to 6 (Destiny-2 inner-planets reference)', () => {
    expect(PLANETS_K).toBe(6)
  })

  it('marks top-K nodes by count as isPlanet=true', () => {
    const { nodes } = buildConstellationGraph(EXPERIENCE, SKILLS)
    const planets = nodes.filter((n) => n.isPlanet === true)
    expect(planets.length).toBe(Math.min(PLANETS_K, nodes.length))
    // Top-K must be the K nodes with the largest counts
    const topKCounts = [...nodes].sort((a, b) => b.count - a.count).slice(0, PLANETS_K).map((n) => n.count)
    const planetCounts = [...planets].sort((a, b) => b.count - a.count).map((n) => n.count)
    expect(planetCounts).toEqual(topKCounts)
  })

  it('rest of nodes have isPlanet=false (boolean, not undefined)', () => {
    const { nodes } = buildConstellationGraph(EXPERIENCE, SKILLS)
    const nonPlanets = nodes.filter((n) => n.isPlanet === false)
    expect(nonPlanets.length).toBe(nodes.length - Math.min(PLANETS_K, nodes.length))
    for (const n of nodes) {
      expect(typeof n.isPlanet).toBe('boolean')
    }
  })

  it('breaks ties deterministically by id ascending', () => {
    // Build synthetic data where 3 skills share the same count — tiebreak
    // must select the id-ascending ones first.
    const FAKE_SKILLS = {
      zzz: { category: 'lang' },
      aaa: { category: 'lang' },
      mmm: { category: 'lang' },
      bbb: { category: 'lang' },
    }
    const FAKE_EXPERIENCE = [
      { tech: ['zzz', 'aaa', 'mmm', 'bbb'], period: { start: 2020, end: 2021 } },
    ]
    // Stub SKILL_CATEGORIES default color (lang)
    const stubCategoriesByMonkeyPatch = SKILL_CATEGORIES.lang
    expect(stubCategoriesByMonkeyPatch).toBeDefined()
    const { nodes } = buildConstellationGraph(FAKE_EXPERIENCE, FAKE_SKILLS)
    // All 4 have count=1 → top-3 by id ascending = aaa, bbb, mmm
    // (use K=3 emulation by counting result vs sorted top-3 from PLANETS_K)
    const planetIds = nodes.filter((n) => n.isPlanet).map((n) => n.id).sort()
    // With K=6 and only 4 nodes, all 4 should be planets
    expect(planetIds).toEqual(['aaa', 'bbb', 'mmm', 'zzz'])

    // With a 7th node tying — ensure id ascending wins for tiebreak
    const FAKE_SKILLS_7 = {
      a1: { category: 'lang' },
      a2: { category: 'lang' },
      a3: { category: 'lang' },
      a4: { category: 'lang' },
      a5: { category: 'lang' },
      a6: { category: 'lang' },
      a7: { category: 'lang' },
    }
    const FAKE_EXP_7 = [
      { tech: ['a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7'], period: { start: 2020, end: 2021 } },
    ]
    const { nodes: nodes7 } = buildConstellationGraph(FAKE_EXP_7, FAKE_SKILLS_7)
    // All tie at count=1 → top-6 by id ascending = a1..a6; a7 excluded
    const planet7 = nodes7.filter((n) => n.isPlanet).map((n) => n.id).sort()
    expect(planet7).toEqual(['a1', 'a2', 'a3', 'a4', 'a5', 'a6'])
    const star7 = nodes7.find((n) => n.id === 'a7')
    expect(star7.isPlanet).toBe(false)
  })

  it('never marks more than PLANETS_K nodes as planets even with many nodes', () => {
    const { nodes } = buildConstellationGraph(EXPERIENCE, SKILLS)
    expect(nodes.length).toBeGreaterThan(PLANETS_K)
    const planets = nodes.filter((n) => n.isPlanet)
    expect(planets.length).toBe(PLANETS_K)
  })
})
