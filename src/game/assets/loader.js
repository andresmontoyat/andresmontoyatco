import { frameRect } from './atlas.js'

function loadImage(src, ImageCtor) {
  return new Promise((resolve, reject) => {
    const img = new ImageCtor()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function resolveFrame(manifest, imagesByKey, name) {
  const f = frameRect(manifest, name)
  return { img: imagesByKey[f.img], x: f.x, y: f.y, w: f.w, h: f.h }
}

function makeDraw(frame) {
  return (ctx, name, dx, dy, dw, dh) => {
    const f = frame(name)
    ctx.drawImage(f.img, f.x, f.y, f.w, f.h, dx, dy, dw, dh)
  }
}

function makeDrawFlipped(frame) {
  return (ctx, name, dx, dy, dw, dh) => {
    const f = frame(name)
    ctx.save()
    ctx.translate(dx + dw, dy)
    ctx.scale(-1, 1)
    ctx.drawImage(f.img, f.x, f.y, f.w, f.h, 0, 0, dw, dh)
    ctx.restore()
  }
}

function toSpriteSheet(manifest, keys, images) {
  const imagesByKey = {}
  keys.forEach((key, i) => { imagesByKey[key] = images[i] })
  const frame = name => resolveFrame(manifest, imagesByKey, name)
  return { frame, draw: makeDraw(frame), drawFlipped: makeDrawFlipped(frame), ready: true }
}

export function loadSprites(manifest, ImageCtor = Image) {
  const keys = Object.keys(manifest.images)
  const loads = keys.map(key => loadImage(manifest.images[key], ImageCtor))
  return Promise.all(loads).then(images => toSpriteSheet(manifest, keys, images))
}

export default loadSprites
