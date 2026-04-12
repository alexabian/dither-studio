import { useRef, useState, useEffect, useCallback } from 'react'

const HANDLE_HIT  = 10
const HANDLE_R    = 5

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)) }

function getHandles(crop, scale) {
  const cx = crop.x * scale, cy = crop.y * scale
  const cw = crop.w * scale, ch = crop.h * scale
  return [
    { id:'nw', x:cx,        y:cy        },
    { id:'n',  x:cx+cw/2,   y:cy        },
    { id:'ne', x:cx+cw,     y:cy        },
    { id:'e',  x:cx+cw,     y:cy+ch/2   },
    { id:'se', x:cx+cw,     y:cy+ch     },
    { id:'s',  x:cx+cw/2,   y:cy+ch     },
    { id:'sw', x:cx,        y:cy+ch     },
    { id:'w',  x:cx,        y:cy+ch/2   },
  ]
}

const CURSORS = {
  nw:'nw-resize', n:'n-resize', ne:'ne-resize', e:'e-resize',
  se:'se-resize', s:'s-resize', sw:'sw-resize', w:'w-resize',
  move:'move', new:'crosshair',
}

function hitTest(px, py, crop, scale) {
  for (const h of getHandles(crop, scale)) {
    if (Math.abs(px - h.x) <= HANDLE_HIT && Math.abs(py - h.y) <= HANDLE_HIT) return h.id
  }
  const cx = crop.x * scale, cy = crop.y * scale
  const cw = crop.w * scale, ch = crop.h * scale
  if (px >= cx && px <= cx+cw && py >= cy && py <= cy+ch) return 'move'
  return 'new'
}

export default function CropModal({ pixels, width, height, sourceName, onConfirm, onClose }) {
  const canvasRef   = useRef(null)
  const srcRef      = useRef(null)   // pre-rendered source image canvas
  const dragRef     = useRef(null)
  const [crop, setCrop]     = useState({ x:0, y:0, w:width, h:height })
  const [cursor, setCursor] = useState('crosshair')

  // Compute scale to fit the image in the viewport
  const PAD   = 100
  const maxW  = Math.min(window.innerWidth  - PAD * 2, 1080)
  const maxH  = Math.min(window.innerHeight - 220,      740)
  const scale = Math.min(maxW / width, maxH / height, 1)
  const dW    = Math.round(width  * scale)
  const dH    = Math.round(height * scale)

  // Pre-render source image once
  useEffect(() => {
    const c = document.createElement('canvas')
    c.width = width; c.height = height
    c.getContext('2d').putImageData(
      new ImageData(new Uint8ClampedArray(pixels), width, height), 0, 0
    )
    srcRef.current = c
  }, [pixels, width, height])

  // Draw everything onto the crop canvas
  const draw = useCallback((c) => {
    const canvas = canvasRef.current
    const src    = srcRef.current
    if (!canvas || !src) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, dW, dH)

    // Full scaled image
    ctx.drawImage(src, 0, 0, dW, dH)

    const cx = c.x * scale, cy = c.y * scale
    const cw = c.w * scale, ch = c.h * scale

    // Dim outside crop
    ctx.save()
    ctx.fillStyle = 'rgba(0,0,0,0.58)'
    ctx.beginPath()
    ctx.rect(0, 0, dW, dH)
    ctx.rect(cx, cy, cw, ch)
    ctx.fill('evenodd')
    ctx.restore()

    // Crisp image inside crop box
    ctx.drawImage(src, c.x, c.y, c.w, c.h, cx, cy, cw, ch)

    // Crop border
    ctx.strokeStyle = 'rgba(255,255,255,0.9)'
    ctx.lineWidth = 1.5
    ctx.strokeRect(cx + 0.75, cy + 0.75, cw - 1.5, ch - 1.5)

    // Rule of thirds
    ctx.strokeStyle = 'rgba(255,255,255,0.22)'
    ctx.lineWidth = 0.5
    for (let i = 1; i < 3; i++) {
      ctx.beginPath(); ctx.moveTo(cx + cw * i/3, cy); ctx.lineTo(cx + cw * i/3, cy + ch); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(cx, cy + ch * i/3); ctx.lineTo(cx + cw, cy + ch * i/3); ctx.stroke()
    }

    // Corner + edge handles
    getHandles(c, scale).forEach(h => {
      ctx.beginPath()
      ctx.arc(h.x, h.y, HANDLE_R, 0, Math.PI * 2)
      ctx.fillStyle = '#fff'
      ctx.fill()
      ctx.strokeStyle = 'rgba(0,0,0,0.35)'
      ctx.lineWidth = 1
      ctx.stroke()
    })

    // Size label inside box (if big enough)
    if (cw > 80 && ch > 28) {
      const label = `${c.w} × ${c.h}`
      ctx.font = '500 11px Inter, system-ui, sans-serif'
      ctx.fillStyle = 'rgba(255,255,255,0.75)'
      ctx.textAlign = 'center'
      ctx.fillText(label, cx + cw / 2, cy + ch - 8)
    }
  }, [scale, dW, dH])

  useEffect(() => { draw(crop) }, [draw, crop])

  // Pointer down
  const onPtrDown = useCallback((e) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const px = e.clientX - rect.left
    const py = e.clientY - rect.top
    const type = hitTest(px, py, crop, scale)
    dragRef.current = { type, startPx:px, startPy:py, startCrop:{ ...crop }, live:{ ...crop } }
    canvas.setPointerCapture(e.pointerId)
    e.preventDefault()
  }, [crop, scale])

  // Pointer move
  const onPtrMove = useCallback((e) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect   = canvas.getBoundingClientRect()
    const px     = e.clientX - rect.left
    const py     = e.clientY - rect.top

    // Update cursor when idle
    if (!dragRef.current) {
      setCursor(CURSORS[hitTest(px, py, crop, scale)] || 'crosshair')
      return
    }

    const { type, startPx, startPy, startCrop } = dragRef.current
    const dx = (px - startPx) / scale
    const dy = (py - startPy) / scale
    const MIN = 8

    let { x, y, w, h } = startCrop

    if (type === 'new') {
      let nx = clamp(startPx / scale, 0, width)
      let ny = clamp(startPy / scale, 0, height)
      let nw = clamp(px / scale, 0, width)  - nx
      let nh = clamp(py / scale, 0, height) - ny
      if (nw < 0) { nx += nw; nw = -nw }
      if (nh < 0) { ny += nh; nh = -nh }
      x = clamp(nx, 0, width);  y = clamp(ny, 0, height)
      w = Math.min(Math.max(nw, MIN), width  - x)
      h = Math.min(Math.max(nh, MIN), height - y)
    } else if (type === 'move') {
      x = clamp(x + dx, 0, width  - w)
      y = clamp(y + dy, 0, height - h)
    } else {
      if (type.includes('w')) { const nw = w - dx; if (nw >= MIN) { x += dx; w = nw } }
      if (type.includes('e')) { w = clamp(w + dx, MIN, width  - x) }
      if (type.includes('n')) { const nh = h - dy; if (nh >= MIN) { y += dy; h = nh } }
      if (type.includes('s')) { h = clamp(h + dy, MIN, height - y) }
      x = clamp(x, 0, width  - MIN)
      y = clamp(y, 0, height - MIN)
      w = Math.min(w, width  - x)
      h = Math.min(h, height - y)
    }

    const next = { x:Math.round(x), y:Math.round(y), w:Math.round(w), h:Math.round(h) }
    dragRef.current.live = next
    draw(next)
  }, [crop, scale, width, height, draw])

  const onPtrUp = useCallback(() => {
    if (!dragRef.current) return
    if (dragRef.current.live) setCrop(dragRef.current.live)
    dragRef.current = null
  }, [])

  const applyRatio = (rw, rh) => {
    if (!rw) { setCrop({ x:0, y:0, w:width, h:height }); return }
    const target = rw / rh
    const imgAspect = width / height
    let cw, ch
    if (imgAspect > target) { ch = height; cw = Math.round(height * target) }
    else                    { cw = width;  ch = Math.round(width  / target) }
    cw = Math.min(cw, width); ch = Math.min(ch, height)
    const x = Math.round((width  - cw) / 2)
    const y = Math.round((height - ch) / 2)
    setCrop({ x, y, w: cw, h: ch })
  }

  const handleConfirm = () => {
    const c = document.createElement('canvas')
    const { x, y, w, h } = crop
    c.width = Math.max(1, w); c.height = Math.max(1, h)
    c.getContext('2d').drawImage(srcRef.current, x, y, w, h, 0, 0, w, h)
    const imageData = c.getContext('2d').getImageData(0, 0, w, h)
    onConfirm(imageData, w, h, sourceName)
  }

  return (
    <div className="crop-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="crop-modal">
        <div className="crop-modal-header">
          <span className="crop-modal-title">
            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M3 1v10h10M1 3h2M1 7h2M1 11h2M5 13v-2M9 13v-2M13 13v-2"/>
            </svg>
            Crop Image
          </span>
          <span className="crop-modal-info">{crop.w} × {crop.h} px</span>
          <button className="crop-close-btn" onClick={onClose} title="Cancel (Esc)">
            <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 2l8 8M10 2l-8 8"/></svg>
          </button>
        </div>

        <div className="crop-canvas-wrap">
          <canvas
            ref={canvasRef}
            width={dW}
            height={dH}
            style={{ cursor, display:'block', borderRadius:4 }}
            onPointerDown={onPtrDown}
            onPointerMove={onPtrMove}
            onPointerUp={onPtrUp}
            onPointerCancel={onPtrUp}
          />
        </div>

        <div className="crop-modal-footer">
          <div className="crop-ratio-btns">
            {[
              { label:'Free',  rw:null, rh:null },
              { label:'1:1',   rw:1,  rh:1  },
              { label:'4:3',   rw:4,  rh:3  },
              { label:'3:2',   rw:3,  rh:2  },
              { label:'16:9',  rw:16, rh:9  },
              { label:'9:16',  rw:9,  rh:16 },
            ].map(({ label, rw, rh }) => {
              const active = rw
                ? Math.abs(crop.w / crop.h - rw / rh) < 0.01
                : crop.w === width && crop.h === height && crop.x === 0 && crop.y === 0
              return (
                <button
                  key={label}
                  className={`crop-ratio-btn${active ? ' active' : ''}`}
                  onClick={() => applyRatio(rw, rh)}
                >{label}</button>
              )
            })}
          </div>
          <div style={{ marginLeft:'auto', display:'flex', gap:6 }}>
            <button className="action-btn" onClick={onClose}>Cancel</button>
            <button className="action-btn primary" onClick={handleConfirm}>
              <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 6l3 3 5-5"/></svg>
              Apply Crop
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
