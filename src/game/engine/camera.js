export function followCamera(cam, targetX, W, levelW) {
  const target = targetX - W * 0.36
  cam.x += (target - cam.x) * 0.12
  cam.x = Math.max(0, Math.min(levelW - W, cam.x))
}
export function shakeOffset(shake) {
  if (!shake) return { x: 0, y: 0 }
  return { x: (Math.random() * 2 - 1) * shake, y: (Math.random() * 2 - 1) * shake }
}
