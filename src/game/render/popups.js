export function createPopups() {
  return []
}

export function addPopup(pool, x, y, text) {
  pool.push({ x, y, text, life: 1, vy: -1.1 })
}

export function updatePopups(pool, reduced) {
  for (let i = pool.length - 1; i >= 0; i--) {
    const q = pool[i]
    if (!reduced) q.y += q.vy
    q.life -= 0.025
    if (q.life <= 0) pool.splice(i, 1)
  }
}

export function drawPopups(ctx, pool) {
  ctx.save()
  ctx.textAlign = 'center'
  ctx.font = 'bold 14px monospace'
  for (const q of pool) {
    ctx.globalAlpha = Math.max(0, q.life)
    ctx.fillStyle = '#ffffff'
    ctx.fillText(q.text, q.x, q.y)
  }
  ctx.restore()
}
