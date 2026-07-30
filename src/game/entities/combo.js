export function comboScore(chain) {
  const n = Math.max(1, chain)
  return 100 * Math.pow(2, n - 1)
}
