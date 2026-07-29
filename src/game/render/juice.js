export function createParticles(max = 200) {
  const pool = Array.from({ length: max }, () => ({ dead: true, x: 0, y: 0, vx: 0, vy: 0, life: 0, color: '#fff' }))
  function spawn(x, y, vx, vy, life, color) {
    const p = pool.find(q => q.dead)
    if (!p) return
    Object.assign(p, { dead: false, x, y, vx, vy, life, color })
  }
  function update(dt) {
    for (const p of pool) {
      if (p.dead) continue
      p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt
      if (p.life <= 0) p.dead = true
    }
  }
  return { spawn, update, alive: () => pool.filter(p => !p.dead) }
}

export function burst(pool, x, y, n = 14, rnd = Math.random) {
  for (let i = 0; i < n; i++) {
    const a = rnd() * Math.PI * 2
    pool.spawn(x, y, Math.cos(a) * 2, Math.sin(a) * 2 - 1, 20 + rnd() * 10, '#00E5A8')
  }
}
