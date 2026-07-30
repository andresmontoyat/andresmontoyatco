const TRACKS = { pradera: 't_grass', desierto: 't_dunes', selva: 't_jungle', cyber: 't_cloud', castillo: 't_ai', farm: 't_farm' }

export function trackForBiome(bi) {
  return TRACKS[bi] || TRACKS.pradera
}

export function createMusic(ctx = null) {
  let muted = true
  let region = null
  return {
    setRegion(bi) { region = trackForBiome(bi); if (ctx && !muted) { /* crossfade region */ } },
    mute(on) { muted = on; if (ctx && muted) { /* stop */ } },
    isMuted() { return muted },
  }
}
