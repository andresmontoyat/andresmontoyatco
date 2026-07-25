const GY = 430, LEVEL_PAD = 640, SPACING = 880
function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16), cl = v => Math.max(0, Math.min(255, v))
  return `rgb(${cl((n>>16&255)+f)},${cl((n>>8&255)+f)},${cl((n&255)+f)})`
}
export function buildLevel(companies) {
  companies.forEach((c, i) => { c.cx = LEVEL_PAD + i * SPACING })
  const levelW = LEVEL_PAD * 2 + (companies.length - 1) * SPACING
  const solids = [{ x:-40, y:GY, w:levelW+80, h:400, ground:true }]
  const coins = [], qblocks = [], enemies = [], powerups = [], movers = []
  companies.forEach((c, i) => {
    const base = c.cx
    if (i > 0) {
      solids.push({ x:base-560, y:GY-150, w:120, h:24, plat:true })
      solids.push({ x:base-330, y:GY-240, w:120, h:24, plat:true })
      for (let k=0;k<3;k++) coins.push({ x:base-540+k*36, y:GY-190, got:false })
      for (let k=0;k<3;k++) coins.push({ x:base-310+k*36, y:GY-280, got:false })
      qblocks.push({ x:base-380, y:GY-170, w:38, h:38, used:false, coin:true })
      qblocks.push({ x:base-300, y:GY-170, w:38, h:38, used:false })
      for (let s=0;s<3;s++) solids.push({ x:base-150+s*40, y:GY-(s+1)*40, w:40, h:(s+1)*40, stair:true })
    }
    for (let k=0;k<5;k++) coins.push({ x:base-110+k*26, y:GY-90-Math.sin(k/4*Math.PI)*70, got:false })
  })
  companies.forEach((c, i) => {
    if (i === 0) return
    const n = i % 3 === 0 ? 2 : 1
    for (let k=0;k<n;k++) { const cx = c.cx-460+k*140
      enemies.push({ x:cx, y:GY-26, w:28, h:26, vx:0.9*(k%2?1:-1), x0:cx-90, x1:cx+90, dead:0, col:shade(c.color,-30), t:0 }) }
  })
  ;[{i:1},{i:5}].forEach(({i}) => powerups.push({ x:companies[i].cx-330, y:GY-300, w:26, h:26, taken:0, t:0, type:'boots' }))
  ;[{i:3},{i:8}].forEach(({i}) => powerups.push({ x:companies[i].cx-330, y:GY-300, w:26, h:26, taken:0, t:0, type:'shield' }))
  ;[{i:2,ax:'y',rng:90,sp:0.9},{i:6,ax:'x',rng:120,sp:0.8},{i:9,ax:'y',rng:110,sp:1.0}].forEach(m => {
    const x = companies[m.i].cx-440, y = GY-190
    movers.push({ x, y, w:110, h:22, ax:m.ax, rng:m.rng, sp:m.sp, ph:0, ox:x, oy:y, px:x, py:y, mover:1 })
  })
  const last = companies.length - 1
  enemies.push({ x:companies[last].cx-300, y:GY-52, w:56, h:52, vx:1.2, x0:companies[last].cx-380, x1:companies[last].cx-150, dead:0, col:'#7a3a8e', t:0, hp:3, hit:0, boss:1 })
  return { levelW, companies, solids, coins, qblocks, enemies, powerups, movers, bossIndex: enemies.length - 1 }
}
