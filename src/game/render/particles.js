export function createParticles() {
  return []
}

export function burst(pool, x, y, n, opts) {
  const o = opts || {}
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2
    const sp = (o.spread || 3) * (0.4 + Math.random())
    pool.push({
      x, y,
      vx: Math.cos(a) * sp,
      vy: (o.up ? -Math.random() * (o.up * 2) : Math.sin(a) * sp) - 1,
      life: 1,
      dec: 0.02 + Math.random() * 0.02,
      r: (o.r || 3) * (0.6 + Math.random()),
      c: o.c || '#fff',
      grav: o.grav == null ? 0.35 : o.grav,
    })
  }
}

export function updateParticles(pool) {
  for (let i = pool.length - 1; i >= 0; i--) {
    const p = pool[i]
    p.x += p.vx; p.y += p.vy; p.vy += p.grav; p.life -= p.dec
    if (p.life <= 0) pool.splice(i, 1)
  }
}

export function drawParticles(ctx, pool) {
  for (const p of pool) {
    ctx.globalAlpha = Math.max(0, p.life)
    ctx.fillStyle = p.c
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.r * p.life + 0.5, 0, 7)
    ctx.fill()
  }
  ctx.globalAlpha = 1
}
