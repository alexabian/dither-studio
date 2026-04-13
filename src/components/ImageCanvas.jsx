import { useEffect, useRef, useState, useCallback } from 'react'

export default function ImageCanvas({
  pixels, width, height, displayWidth, displayHeight, pixelSize,
  originalPixels, splitCompare, comparing, processing, quickPixels, quickWidth, quickHeight,
}) {
  const canvasRef  = useRef(null)
  const areaRef    = useRef(null)
  const [zoom, setZoom]   = useState(1)
  const [pan,  setPan]    = useState({ x: 0, y: 0 })
  const [splitX, setSplitX] = useState(0.5)   // 0-1 fraction of canvas width
  const dragRef = useRef(null)

  // ── Draw ────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !pixels || !width || !height) return
    canvas.width  = width
    canvas.height = height
    const ctx = canvas.getContext('2d')

    // "Hold to Compare" — show pre-dither adjusted image with ORIGINAL badge
    if (comparing && originalPixels) {
      try { ctx.putImageData(new ImageData(new Uint8ClampedArray(originalPixels), width, height), 0, 0) } catch {}
      // Draw "ORIGINAL" badge overlay
      const label = 'ORIGINAL'
      ctx.save()
      ctx.font = `600 ${Math.max(9, Math.round(height * 0.025))}px Inter, system-ui, sans-serif`
      const tw = ctx.measureText(label).width
      const pad = 7, bh = Math.max(18, Math.round(height * 0.038))
      const bw = tw + pad * 2
      ctx.fillStyle = 'rgba(0,0,0,0.58)'
      ctx.beginPath(); ctx.roundRect(8, 8, bw, bh, 3); ctx.fill()
      ctx.fillStyle = 'rgba(255,255,255,0.92)'
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle'
      ctx.fillText(label, 8 + pad, 8 + bh / 2)
      ctx.restore()
      return
    }

    if (splitCompare && originalPixels) {
      // Draw dithered on full canvas first
      ctx.putImageData(new ImageData(new Uint8ClampedArray(pixels), width, height), 0, 0)

      // Composite original on the left using an offscreen canvas (putImageData ignores clips)
      const divX  = Math.round(splitX * width)
      const offsc = new OffscreenCanvas(width, height)
      offsc.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(originalPixels), width, height), 0, 0)
      ctx.drawImage(offsc, 0, 0, divX, height, 0, 0, divX, height)

      // Divider line
      ctx.strokeStyle = 'rgba(255,255,255,0.85)'
      ctx.lineWidth   = 2
      ctx.beginPath(); ctx.moveTo(divX, 0); ctx.lineTo(divX, height); ctx.stroke()

      // Handle circle
      const hy = Math.round(height / 2)
      ctx.fillStyle = '#ffffff'
      ctx.beginPath(); ctx.arc(divX, hy, 13, 0, Math.PI * 2); ctx.fill()
      ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 1.5; ctx.stroke()
      ctx.fillStyle   = '#444'
      ctx.font        = 'bold 11px sans-serif'
      ctx.textAlign   = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText('◀▶', divX, hy)

      // Labels
      const labelStyle = (x, text) => {
        const W = ctx.measureText(text).width + 14
        ctx.fillStyle = 'rgba(0,0,0,0.55)'
        ctx.beginPath(); ctx.roundRect(x, 8, W, 18, 3); ctx.fill()
        ctx.fillStyle = 'rgba(255,255,255,0.9)'
        ctx.font      = '9.5px Inter,sans-serif'
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle'
        ctx.fillText(text, x + 7, 17)
      }
      labelStyle(6, 'ORIGINAL')
      labelStyle(divX + 6, 'DITHERED')
    } else {
      try {
        ctx.putImageData(new ImageData(new Uint8ClampedArray(pixels), width, height), 0, 0)
      } catch {}
    }
  }, [pixels, originalPixels, splitCompare, comparing, splitX, width, height])

  // ── Wheel zoom ──────────────────────────────────────────────
  const handleWheel = useCallback((e) => {
    e.preventDefault()
    const factor = e.deltaY < 0 ? 1.14 : 1 / 1.14
    setZoom(z => Math.max(0.15, Math.min(10, z * factor)))
  }, [])

  useEffect(() => {
    const el = areaRef.current
    if (!el) return
    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [handleWheel])

  // ── Pointer: pan or split-drag ──────────────────────────────
  const handlePointerDown = useCallback((e) => {
    if (!pixels) return
    e.currentTarget.setPointerCapture(e.pointerId)

    const canvasEl = canvasRef.current
    if (!canvasEl) return
    const rect = canvasEl.getBoundingClientRect()
    const relX  = (e.clientX - rect.left) / rect.width

    if (splitCompare && Math.abs(relX - splitX) < 0.05) {
      dragRef.current = { type: 'split', startX: e.clientX, startSplit: splitX }
    } else {
      dragRef.current = { type: 'pan', startX: e.clientX, startY: e.clientY, startPan: { ...pan } }
    }
  }, [pixels, splitCompare, splitX, pan])

  const handlePointerMove = useCallback((e) => {
    if (!dragRef.current) return

    if (dragRef.current.type === 'split') {
      const canvasEl = canvasRef.current
      if (!canvasEl) return
      const rect = canvasEl.getBoundingClientRect()
      const newSplit = Math.max(0.04, Math.min(0.96, (e.clientX - rect.left) / rect.width))
      setSplitX(newSplit)
    } else {
      setPan({
        x: dragRef.current.startPan.x + e.clientX - dragRef.current.startX,
        y: dragRef.current.startPan.y + e.clientY - dragRef.current.startY,
      })
    }
  }, [])

  const handlePointerUp = useCallback(() => { dragRef.current = null }, [])

  const resetView = useCallback(() => { setZoom(1); setPan({ x: 0, y: 0 }) }, [])

  const fitToView = useCallback(() => {
    if (!areaRef.current) return
    const rect = areaRef.current.getBoundingClientRect()
    const imgW = pixelSize > 1 ? (displayWidth || width) : width
    const imgH = pixelSize > 1 ? (displayHeight || height) : height
    if (!imgW || !imgH) return
    const z = Math.min((rect.width  - 32) / imgW, (rect.height - 32) / imgH)
    setZoom(Math.min(Math.max(0.15, z), 5))
    setPan({ x: 0, y: 0 })
  }, [width, height, displayWidth, displayHeight, pixelSize])

  const hasImage = pixels && width && height

  // Cursor: ew-resize near split line, grabbing while panning, grab otherwise
  const getCursor = () => {
    if (dragRef.current?.type === 'pan') return 'grabbing'
    if (dragRef.current?.type === 'split') return 'ew-resize'
    if (!splitCompare) return 'grab'
    return 'ew-resize'
  }

  return (
    <div className="canvas-area" ref={areaRef}>
      <div className="checkerboard" />

      {hasImage ? (
        <div
          className="canvas-viewport"
          style={{ cursor: getCursor(), userSelect: 'none', touchAction: 'none', width: '100%', height: '100%',
                   display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1 }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onDoubleClick={resetView}
        >
          <div
            className="canvas-wrapper"
            style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                     transformOrigin: 'center center', transition: 'none' }}
          >
            <canvas
              ref={canvasRef}
              className="output-canvas"
              style={pixelSize > 1 ? {
                imageRendering: 'pixelated',
                width:  displayWidth  || width,
                height: displayHeight || height,
              } : undefined}
            />
          </div>
        </div>
      ) : (
        <div className="empty-state" style={{ position: 'relative', zIndex: 1 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <path d="m21 15-5-5L5 21"/>
          </svg>
          <span>Drop an image or use Files panel</span>
        </div>
      )}

      {/* Zoom controls */}
      {hasImage && (
        <div className="zoom-controls">
          <button className="zoom-btn" onClick={() => setZoom(z => Math.min(10, z * 1.25))} title="Zoom in">
            <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="5" cy="5" r="4"/><path d="m10 10-2-2M5 3v4M3 5h4"/></svg>
          </button>
          <span className="zoom-label">{Math.round(zoom * 100)}%</span>
          <button className="zoom-btn" onClick={() => setZoom(z => Math.max(0.15, z / 1.25))} title="Zoom out">
            <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="5" cy="5" r="4"/><path d="m10 10-2-2M3 5h4"/></svg>
          </button>
          <button className="zoom-btn zoom-btn--text" onClick={fitToView} title="Fit image to view">Fit</button>
          <button className="zoom-btn zoom-btn--text" onClick={resetView} title="Reset to 100% (double-click canvas)">100%</button>
        </div>
      )}

      {/* Quick crop preview */}
      {quickPixels && quickWidth && quickHeight && (
        <QuickPreview pixels={quickPixels} width={quickWidth} height={quickHeight} />
      )}

      {processing && <div className="processing-badge">Processing…</div>}
    </div>
  )
}

function QuickPreview({ pixels, width, height }) {
  const ref = useRef(null)
  useEffect(() => {
    const c = ref.current; if (!c) return
    c.width = width; c.height = height
    try { c.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(pixels), width, height), 0, 0) } catch {}
  }, [pixels, width, height])

  return (
    <div className="quick-preview">
      <div className="quick-preview-label">Live Preview</div>
      <canvas ref={ref} style={{ display: 'block', width: '100%', imageRendering: 'pixelated' }} />
    </div>
  )
}
