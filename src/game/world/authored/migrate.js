// Migrates a world-editor export from v1 to v2 shape: every placed object gets a `uid`.
//
// Why this exists at all. v2 is where the editor started writing a per-object uid, and the adapter
// now refuses anything older, because a link from the game into the map hangs off that handle. The
// committed `career.map.json` predates it, and it cannot simply be re-exported: the project it came
// from lives in the operator's browser, and the map carries no buildings to re-author anyway.
//
// Minting the uids here rather than hand-editing the version field is the honest version of the same
// fix. The editor's own project loader already does exactly this — a project written before uids
// existed gets them backfilled on load, in a second pass, above the counter's high-water mark. This
// is that operation applied to an export.
//
// What it does NOT do: invent tags. Which house is which job is an authoring decision, made in the
// editor. After this a map is well-formed v2 with no semantics, which is the truth about it.
//
// A later real export from the editor replaces the whole file and mints its own uids. That is fine
// while nothing references these: the tags that would reference them come from the editor too.

export const TARGET_VERSION = 2

const uidNum = u => {
  const n = Number(String(u).slice(1))
  return Number.isFinite(n) ? n : 0
}

// migrateMapToV2: pure. Mutates nothing — returns a new map plus what it did, so the CLI can report
// it and a test can assert it.
export function migrateMapToV2(map) {
  if (!map || !Array.isArray(map.layers)) throw new Error('not a map: no layers array')
  const objects = map.layers.flatMap(l => (Array.isArray(l.objects) ? l.objects : []))
  // Start above anything already present, so a half-migrated file cannot get a uid twice.
  let next = Math.max(0, ...objects.map(o => (o && o.uid ? uidNum(o.uid) : 0))) + 1
  let minted = 0
  const layers = map.layers.map(l => {
    if (!Array.isArray(l.objects)) return l
    return {
      ...l,
      objects: l.objects.map(o => {
        if (!o || typeof o !== 'object') return o
        if (o.uid) return o
        minted += 1
        return { ...o, uid: `U${next++}` }
      }),
    }
  })
  return {
    map: { ...map, version: TARGET_VERSION, layers },
    minted,
    objects: objects.length,
    from: map.version === undefined ? '(absent)' : map.version,
  }
}
