// Canvas-based image generators — main thread only (uses document.createElement)

export function generateDefaultImage(w, h) {
  const canvas = document.createElement('canvas')
  canvas.width = w; canvas.height = h
  const ctx = canvas.getContext('2d')

  const bg = ctx.createRadialGradient(w * 0.4, h * 0.4, 0, w * 0.5, h * 0.5, Math.max(w, h) * 0.75)
  bg.addColorStop(0,   '#F9A8D4')
  bg.addColorStop(0.3, '#C084FC')
  bg.addColorStop(0.6, '#6D28D9')
  bg.addColorStop(1,   '#1E1B4B')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, w, h)

  const overlay = ctx.createLinearGradient(0, 0, 0, h)
  overlay.addColorStop(0,   'rgba(255,255,255,0.35)')
  overlay.addColorStop(0.5, 'rgba(128,128,128,0)')
  overlay.addColorStop(1,   'rgba(0,0,0,0.45)')
  ctx.fillStyle = overlay
  ctx.fillRect(0, 0, w, h)

  for (let r = 30; r < Math.max(w, h); r += 50) {
    ctx.beginPath()
    ctx.arc(w * 0.5, h * 0.45, r, 0, Math.PI * 2)
    ctx.strokeStyle = `rgba(255,255,255,${0.06 + r / Math.max(w, h) * 0.2})`
    ctx.lineWidth = 1.5
    ctx.stroke()
  }

  return ctx.getImageData(0, 0, w, h)
}

export function generatePreset(type, w, h) {
  const canvas = document.createElement('canvas')
  canvas.width = w; canvas.height = h
  const ctx = canvas.getContext('2d')

  if (type === 'sunset') {
    const g = ctx.createLinearGradient(0, 0, 0, h)
    g.addColorStop(0, '#0F0C29'); g.addColorStop(0.4, '#302B63')
    g.addColorStop(0.7, '#FF6B35'); g.addColorStop(1, '#F7C59F')
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h)
    const sun = ctx.createRadialGradient(w/2, h*0.65, 0, w/2, h*0.65, w*0.2)
    sun.addColorStop(0, 'rgba(255,220,100,1)'); sun.addColorStop(1, 'rgba(255,100,50,0)')
    ctx.fillStyle = sun; ctx.fillRect(0, 0, w, h)
  } else if (type === 'forest') {
    const g = ctx.createLinearGradient(0, 0, w, h)
    g.addColorStop(0, '#0D2818'); g.addColorStop(0.5, '#1A4731'); g.addColorStop(1, '#2D6A4F')
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h)
    const ov = ctx.createRadialGradient(w*0.7, h*0.3, 0, w*0.7, h*0.3, w*0.6)
    ov.addColorStop(0, 'rgba(144,238,144,0.4)'); ov.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = ov; ctx.fillRect(0, 0, w, h)
  } else {
    const g = ctx.createLinearGradient(0, 0, w, h)
    g.addColorStop(0, '#F9A8D4'); g.addColorStop(0.5, '#C084FC'); g.addColorStop(1, '#6D28D9')
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h)
  }

  return ctx.getImageData(0, 0, w, h)
}
