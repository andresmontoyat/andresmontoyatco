export function phaseOf(clock, dayLen) {
  return ((clock % dayLen) + dayLen) % dayLen / dayLen
}

export function daylight(phase) {
  return (Math.sin((phase - 0.25) * Math.PI * 2) + 1) / 2
}

export function nightTint(phase) {
  const dark = 1 - daylight(phase)
  return { r: 10, g: 20, b: 60, a: 0.55 * dark }
}
