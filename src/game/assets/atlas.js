export function frameRect(meta, name) {
  const f = meta.frames[name]
  if (!f) throw new Error(`unknown frame: ${name}`)
  return f
}

export function loadAtlas(imageSrc, meta, ImageCtor = Image) {
  return new Promise((resolve, reject) => {
    const img = new ImageCtor()
    img.onload = () => resolve({ img, meta, frame: n => frameRect(meta, n) })
    img.onerror = reject
    img.src = imageSrc
  })
}

export function drawFrame(ctx, atlas, name, dx, dy, dw, dh) {
  const f = frameRect(atlas.meta, name)
  ctx.drawImage(atlas.img, f.x, f.y, f.w, f.h, dx, dy, dw, dh)
}
