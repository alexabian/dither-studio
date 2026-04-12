import { useState, useEffect, useRef, useCallback } from 'react'
import Sidebar from './components/Sidebar'
import DitherPanel from './components/panels/DitherPanel'
import FilesPanel from './components/panels/FilesPanel'
import PalettePanel from './components/panels/PalettePanel'
import AdjustmentsPanel from './components/panels/AdjustmentsPanel'
import PresetsPanel from './components/panels/PresetsPanel'
import ImageCanvas from './components/ImageCanvas'
import { useToast, ToastContainer } from './components/ui/Toast'
import { generateDefaultImage } from './utils/generators'

// Keys that affect processing output (used for undo/redo history)
const SETTINGS_KEYS = [
  'ditherMethod','ditherAmount','ditherDiffusion','serpentine','pixelSize',
  'paletteColors','paletteMethod','customColors',
  'gamma','blacks','whites','contrast','saturation','hue',
  'noiseCoverage','noiseIntensity','noiseSaturation',
  'blurStrength','edgeStrength','blurPasses',
  'displayWidth','displayHeight','keepRatio',
]

const DITHER_METHODS = [
  'disabled','floyd-steinberg','jarvis','stucki','atkinson',
  'burkes','sierra','two-row-sierra','sierra-lite','ordered','random',
]

const DEFAULTS = {
  activePanel: 'dither',
  originalPixels: null, originalWidth: null, originalHeight: null, sourceName: null,
  displayWidth: 512, displayHeight: 512, keepRatio: true,
  processedPixels: null, processedWidth: null, processedHeight: null,
  adjustedPixels: null, computedPalette: [], histogram: null,
  quickPixels: null, quickWidth: null, quickHeight: null,
  ditherMethod: 'atkinson', ditherAmount: 0.65, ditherDiffusion: 1, serpentine: true, pixelSize: 1,
  paletteColors: 8, paletteMethod: 'median-cut',
  customColors: ['#000000','#333333','#666666','#999999','#cccccc','#ffffff','#c084fc','#6d28d9'],
  gamma: 2.13, blacks: 0.112, whites: 0, contrast: 1, saturation: 1, hue: 0,
  noiseCoverage: 0, noiseIntensity: 0.2, noiseSaturation: 1,
  blurStrength: 0, edgeStrength: 12, blurPasses: 2,
  showHistogram: false, comparing: false, splitCompare: false, processing: false,
  exportFormat: 'png', exportQuality: 0.92,
  gallery: [],
  lastProcessMs: null,
}

function makeThumb(pixels, w, h) {
  const size = 80
  const canvas = document.createElement('canvas')
  canvas.width = size; canvas.height = size
  const tmp = document.createElement('canvas')
  tmp.width = w; tmp.height = h
  tmp.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(pixels), w, h), 0, 0)
  canvas.getContext('2d').drawImage(tmp, 0, 0, size, size)
  return canvas.toDataURL('image/png')
}

function loadDarkMode() {
  try {
    const stored = localStorage.getItem('dither-dark')
    return stored === null ? true : stored === '1' // default: dark
  } catch { return true }
}

export default function App() {
  const [state, setState] = useState(DEFAULTS)
  const [darkMode, setDarkMode] = useState(loadDarkMode)
  const { toasts, toast } = useToast()
  const workerRef   = useRef(null)
  const quickWorkerRef = useRef(null)
  const jobIdRef    = useRef(0)
  const quickIdRef  = useRef(0)
  const debounceRef = useRef(null)
  const quickDebRef = useRef(null)
  const historyRef  = useRef({ snapshots: [], pos: -1, ignoreNext: false })
  const draggingRef = useRef(false) // true while a slider is being dragged
  const jobStartRef = useRef(null)  // timestamp when full job was sent

  const set = useCallback((key, value) => setState(s => ({ ...s, [key]: value })), [])
  const setMany = useCallback((updates) => setState(s => ({ ...s, ...updates })), [])

  // ── History helpers ─────────────────────────────────────────
  const snapSettings = (s) => SETTINGS_KEYS.reduce((o, k) => ({ ...o, [k]: s[k] }), {})

  const pushHistory = useCallback((s) => {
    const h = historyRef.current
    if (h.ignoreNext) { h.ignoreNext = false; return }
    const snap = snapSettings(s)
    if (h.pos >= 0 && JSON.stringify(h.snapshots[h.pos]) === JSON.stringify(snap)) return
    h.snapshots = h.snapshots.slice(0, h.pos + 1)
    h.snapshots.push(snap)
    if (h.snapshots.length > 60) h.snapshots.shift()
    h.pos = h.snapshots.length - 1
  }, [])

  const undo = useCallback(() => {
    const h = historyRef.current
    if (h.pos <= 0) return
    h.pos--; h.ignoreNext = true
    setMany(h.snapshots[h.pos])
  }, [setMany])

  const redo = useCallback(() => {
    const h = historyRef.current
    if (h.pos >= h.snapshots.length - 1) return
    h.pos++; h.ignoreNext = true
    setMany(h.snapshots[h.pos])
  }, [setMany])

  // ── Workers ─────────────────────────────────────────────────
  useEffect(() => {
    const makeWorker = () => new Worker(
      new URL('./workers/process.worker.js', import.meta.url),
      { type: 'module' }
    )
    const w = makeWorker()
    const qw = makeWorker()

    w.onmessage = ({ data }) => {
      if (data.id !== jobIdRef.current) return
      if (data.error) { setMany({ processing: false }); return }
      const elapsed = jobStartRef.current ? Date.now() - jobStartRef.current : null
      jobStartRef.current = null
      setMany({
        processedPixels: data.processedPixels,
        processedWidth:  data.width,
        processedHeight: data.height,
        adjustedPixels:  data.adjustedPixels,
        computedPalette: data.palette,
        histogram: data.histogram,
        processing: false,
        lastProcessMs: elapsed,
      })
    }

    qw.onmessage = ({ data }) => {
      if (data.id !== quickIdRef.current) return
      if (data.error || !data.quick) return
      setMany({ quickPixels: data.processedPixels, quickWidth: data.width, quickHeight: data.height })
    }

    workerRef.current      = w
    quickWorkerRef.current = qw
    return () => { w.terminate(); qw.terminate() }
  }, [])

  // ── Send job to worker ───────────────────────────────────────
  const sendJob = useCallback((s, quick = false) => {
    const worker = quick ? quickWorkerRef.current : workerRef.current
    if (!worker || !s.originalPixels) return
    const id = quick ? ++quickIdRef.current : ++jobIdRef.current
    if (!quick) { setMany({ processing: true }); jobStartRef.current = Date.now() }

    const pixelsCopy = s.originalPixels.slice()
    worker.postMessage({
      id, quick,
      pixels: pixelsCopy,
      origWidth: s.originalWidth, origHeight: s.originalHeight,
      displayWidth: s.displayWidth, displayHeight: s.displayHeight,
      settings: SETTINGS_KEYS.reduce((o, k) => ({ ...o, [k]: s[k] }), {}),
    }, [pixelsCopy.buffer])
  }, [setMany])

  // ── Re-process when settings change ─────────────────────────
  useEffect(() => {
    if (!state.originalPixels) return
    // Push to history
    pushHistory(state)
    // Debounce full job
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => sendJob(state, false), 80)
    // Quick preview while dragging
    if (draggingRef.current) {
      clearTimeout(quickDebRef.current)
      quickDebRef.current = setTimeout(() => sendJob(state, true), 30)
    }
    return () => { clearTimeout(debounceRef.current); clearTimeout(quickDebRef.current) }
  }, SETTINGS_KEYS.map(k => state[k]).concat([state.originalPixels]))

  // ── Load default image on mount ──────────────────────────────
  useEffect(() => {
    const imgData = generateDefaultImage(512, 512)
    const pixels  = new Uint8ClampedArray(imgData.data)
    setMany({ originalPixels: pixels, originalWidth: 512, originalHeight: 512,
              displayWidth: 512, displayHeight: 512, sourceName: 'default' })
  }, [])

  // ── File load ────────────────────────────────────────────────
  const handleFileLoad = useCallback((imageData, w, h, name) => {
    const pixels = new Uint8ClampedArray(imageData.data)
    setMany({ originalPixels: pixels, originalWidth: w, originalHeight: h,
              displayWidth: w, displayHeight: h, sourceName: name })
  }, [setMany])

  const handleResetDefault = useCallback(() => {
    const imgData = generateDefaultImage(512, 512)
    setMany({ originalPixels: new Uint8ClampedArray(imgData.data),
              originalWidth: 512, originalHeight: 512,
              displayWidth: 512, displayHeight: 512, sourceName: 'default' })
  }, [setMany])

  const handleCrop = useCallback((imageData, w, h, name) => {
    const pixels = new Uint8ClampedArray(imageData.data)
    setMany({ originalPixels: pixels, originalWidth: w, originalHeight: h,
              displayWidth: w, displayHeight: h, sourceName: name })
  }, [setMany])

  // ── Save / Copy ──────────────────────────────────────────────
  const handleSave = useCallback(() => {
    if (!state.processedPixels) return
    const pw = state.processedWidth  || state.displayWidth
    const ph = state.processedHeight || state.displayHeight
    if (!pw || !ph) return
    try {
      const canvas = document.createElement('canvas')
      canvas.width = pw; canvas.height = ph
      canvas.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(state.processedPixels), pw, ph), 0, 0)
      const fmt      = state.exportFormat || 'png'
      const mime     = fmt === 'jpeg' ? 'image/jpeg' : fmt === 'webp' ? 'image/webp' : 'image/png'
      const quality  = state.exportQuality || 0.92
      const rand     = Math.floor(10000 + Math.random() * 90000)
      const filename = `ditherstudio${rand}.${fmt}`

      // Convert canvas → data URL → Blob → object URL, all synchronously.
      // Keeps the call inside the user-gesture context (unlike async toBlob),
      // and avoids Safari navigating to a data: URL instead of downloading.
      const dataURL = canvas.toDataURL(mime, quality)
      const binary  = atob(dataURL.split(',')[1])
      const bytes   = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
      const blobURL = URL.createObjectURL(new Blob([bytes], { type: mime }))

      const a = document.createElement('a')
      a.href = blobURL
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(blobURL), 250)

      toast(`Saved as ${filename}`, 'success')
      const thumb = makeThumb(state.processedPixels, pw, ph)
      setMany({ gallery: [{ thumb, pixels: state.originalPixels.slice(), width: state.originalWidth, height: state.originalHeight, name: state.sourceName || 'image' }, ...state.gallery].slice(0, 9) })
    } catch (err) {
      console.error('Save error:', err)
      toast('Save failed — see console for details.', 'error')
    }
  }, [state, setMany, toast])

  const handleCopy = useCallback(async () => {
    if (!state.processedPixels) return
    const pw = state.processedWidth  || state.displayWidth
    const ph = state.processedHeight || state.displayHeight
    if (!pw || !ph) return
    const canvas = document.createElement('canvas')
    canvas.width = pw; canvas.height = ph
    const ctx = canvas.getContext('2d')
    ctx.putImageData(new ImageData(new Uint8ClampedArray(state.processedPixels), pw, ph), 0, 0)
    canvas.toBlob(async (blob) => {
      try {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
        toast('Image copied to clipboard!', 'success')
      } catch (err) {
        const msg = err?.name === 'NotAllowedError'
          ? 'Clipboard access denied — allow it in your browser settings.'
          : 'Copy to clipboard failed — your browser may not support this.'
        toast(msg, 'error')
      }
    })
  }, [state])

  // ── Keyboard shortcuts ───────────────────────────────────────
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      const k = e.key

      if (k === '1') { set('activePanel', 'files');        return }
      if (k === '2') { set('activePanel', 'dither');       return }
      if (k === '3') { set('activePanel', 'palette');      return }
      if (k === '4') { set('activePanel', 'adjustments');  return }
      if (k === '5') { set('activePanel', 'presets');      return }

      if (k === ']') {
        setState(s => {
          const i = DITHER_METHODS.indexOf(s.ditherMethod)
          return { ...s, ditherMethod: DITHER_METHODS[(i + 1) % DITHER_METHODS.length] }
        })
        return
      }
      if (k === '[') {
        setState(s => {
          const i = DITHER_METHODS.indexOf(s.ditherMethod)
          return { ...s, ditherMethod: DITHER_METHODS[(i - 1 + DITHER_METHODS.length) % DITHER_METHODS.length] }
        })
        return
      }

      if (k === ' ') {
        e.preventDefault()
        set('splitCompare', !state.splitCompare)
        return
      }

      if ((e.ctrlKey || e.metaKey) && k === 'z' && !e.shiftKey) { e.preventDefault(); undo(); return }
      if ((e.ctrlKey || e.metaKey) && (k === 'y' || (k === 'z' && e.shiftKey))) { e.preventDefault(); redo(); return }
      if ((e.ctrlKey || e.metaKey) && k === 's') { e.preventDefault(); handleSave(); return }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [state.splitCompare, set, undo, redo, handleSave])

  // ── Global drag-to-load ──────────────────────────────────────
  const handleGlobalDrop = useCallback((e) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (!file || !file.type.startsWith('image/')) return
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const c = document.createElement('canvas')
      c.width = img.naturalWidth; c.height = img.naturalHeight
      const ctx = c.getContext('2d')
      ctx.drawImage(img, 0, 0)
      URL.revokeObjectURL(url)
      handleFileLoad(ctx.getImageData(0, 0, c.width, c.height), c.width, c.height, file.name.replace(/\.[^.]+$/,''))
    }
    img.src = url
  }, [handleFileLoad])

  // Ctrl+V global paste
  useEffect(() => {
    const onKeyDown = (e) => {
      if (!(e.ctrlKey || e.metaKey) || e.key !== 'v') return
      if (e.target.tagName === 'INPUT') return
      navigator.clipboard.read().then(items => {
        for (const item of items)
          for (const type of item.types)
            if (type.startsWith('image/')) {
              item.getType(type).then(blob => {
                const url = URL.createObjectURL(blob)
                const img = new Image()
                img.onload = () => {
                  const c = document.createElement('canvas')
                  c.width = img.naturalWidth; c.height = img.naturalHeight
                  const ctx = c.getContext('2d')
                  ctx.drawImage(img, 0, 0)
                  URL.revokeObjectURL(url)
                  handleFileLoad(ctx.getImageData(0, 0, c.width, c.height), c.width, c.height, 'pasted')
                }
                img.src = url
              })
              return
            }
      }).catch(() => {})
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handleFileLoad])

  // ── Slider drag tracking (for quick preview) ─────────────────
  useEffect(() => {
    const onDown = (e) => { if (e.target.type === 'range') draggingRef.current = true }
    const onUp   = () => {
      if (!draggingRef.current) return
      draggingRef.current = false
      setMany({ quickPixels: null, quickWidth: null, quickHeight: null })
    }
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('pointerup',   onUp)
    return () => { window.removeEventListener('pointerdown', onDown); window.removeEventListener('pointerup', onUp) }
  }, [setMany])

  const toggleDark = useCallback(() => {
    setDarkMode(d => {
      const next = !d
      try { localStorage.setItem('dither-dark', next ? '1' : '0') } catch {}
      return next
    })
  }, [])

  const panelTitle = { files:'Files', dither:'Dither', palette:'Palette', adjustments:'Adjustments', presets:'Presets' }[state.activePanel]
  const colorCount = state.computedPalette?.length ?? 0

  return (
    <div className={`app${darkMode ? ' dark' : ''}`} onDragOver={e => e.preventDefault()} onDrop={handleGlobalDrop}>
      <header className="app-header">
        <div className="app-header-left" onClick={() => set('activePanel', 'files')} style={{ cursor: 'pointer' }}>
          <div className="app-logo">
            <svg viewBox="0 0 14 14" fill="none">
              <rect x="1" y="1" width="4" height="4" rx="0.5" fill="white" opacity="0.9"/>
              <rect x="6" y="1" width="4" height="4" rx="0.5" fill="white" opacity="0.55"/>
              <rect x="9" y="4" width="4" height="4" rx="0.5" fill="white" opacity="0.3"/>
              <rect x="1" y="6" width="4" height="4" rx="0.5" fill="white" opacity="0.55"/>
              <rect x="6" y="6" width="4" height="4" rx="0.5" fill="white" opacity="0.75"/>
              <rect x="3" y="9" width="4" height="4" rx="0.5" fill="white" opacity="0.4"/>
            </svg>
          </div>
          <span className="app-title">Dither Studio</span>
        </div>
        <div className="app-header-right">
          <div className="shortcut-hints">
            <span className="shortcut-hint">[ / ]  method</span>
            <span className="shortcut-hint">Space  compare</span>
            <span className="shortcut-hint">Ctrl+Z  undo</span>
            <span className="shortcut-hint">Ctrl+S  save</span>
          </div>
          <button className="theme-toggle-btn" onClick={toggleDark} title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}>
            {darkMode ? (
              <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                <circle cx="7" cy="7" r="2.8"/>
                <path d="M7 1v1.2M7 11.8V13M1 7h1.2M11.8 7H13M2.75 2.75l.85.85M10.4 10.4l.85.85M2.75 11.25l.85-.85M10.4 3.6l.85-.85"/>
              </svg>
            ) : (
              <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                <path d="M11.5 8.5A5 5 0 0 1 5.5 2.5a5 5 0 1 0 6 6z"/>
              </svg>
            )}
          </button>
          <button className="header-btn" onClick={() => window.open('https://estructura.studio/', '_blank')}>
            <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="6" cy="6" r="5"/><path d="M6 5v4M6 3.5v.5"/></svg>
            About
          </button>
        </div>
      </header>

      <div className="app-body">
        <ImageCanvas
          pixels={state.processedPixels}
          originalPixels={state.adjustedPixels}
          width={state.processedWidth  || state.displayWidth}
          height={state.processedHeight || state.displayHeight}
          displayWidth={state.displayWidth}
          displayHeight={state.displayHeight}
          pixelSize={state.pixelSize}
          splitCompare={state.splitCompare}
          comparing={state.comparing}
          processing={state.processing}
          quickPixels={state.quickPixels}
          quickWidth={state.quickWidth}
          quickHeight={state.quickHeight}
        />

        <aside className="panel">
          <div className="panel-header">
            <h2 className="panel-title">{panelTitle}</h2>
          </div>
          <div className="panel-body">
            {state.activePanel === 'dither' && <DitherPanel state={state} set={set} setMany={setMany} />}
            {state.activePanel === 'files' && (
              <FilesPanel
                state={state} set={set}
                onFileLoad={handleFileLoad}
                onResetDefault={handleResetDefault}
                onCrop={handleCrop}
                gallery={state.gallery}
                onGallerySelect={(item) => setMany({ originalPixels: item.pixels, originalWidth: item.width, originalHeight: item.height, displayWidth: item.width, displayHeight: item.height, sourceName: item.name })}
                onClearGallery={() => set('gallery', [])}
                onSave={handleSave}
                onCopy={handleCopy}
                onToast={toast}
              />
            )}
            {state.activePanel === 'palette' && <PalettePanel state={state} set={set} computedPalette={state.computedPalette} />}
            {state.activePanel === 'adjustments' && <AdjustmentsPanel state={state} set={set} histogram={state.histogram} />}
            {state.activePanel === 'presets' && <PresetsPanel state={state} setMany={setMany} />}
          </div>
        </aside>

        <Sidebar active={state.activePanel} onSelect={id => set('activePanel', id)} />
      </div>

      <div className="status-bar">
        <div className="status-info">
          {state.displayWidth && state.displayHeight && (
            <span className="status-chip">
              <span className="status-chip-dot" />
              {state.pixelSize > 1 && state.processedWidth
                ? `${state.processedWidth} × ${state.processedHeight} → ${state.displayWidth} × ${state.displayHeight}`
                : `${state.displayWidth} × ${state.displayHeight}`
              }
            </span>
          )}
          {colorCount > 0 && (
            <span className="status-chip status-chip--swatches" title={`${colorCount} colors`}>
              {state.computedPalette.slice(0, 24).map(([r,g,b], i) => (
                <span key={i} className="status-swatch" style={{ background:`rgb(${r},${g},${b})` }} />
              ))}
            </span>
          )}
          {state.ditherMethod !== 'disabled' && <span className="status-chip">{state.ditherMethod}</span>}
          {state.serpentine && ['floyd-steinberg','jarvis','stucki','atkinson','burkes','sierra','two-row-sierra','sierra-lite'].includes(state.ditherMethod) && (
            <span className="status-chip">serpentine</span>
          )}
          {state.lastProcessMs !== null && (
            <span className="status-chip status-chip--time" title="Last processing time">
              <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><circle cx="5" cy="5" r="4"/><path d="M5 3v2.2l1.4 1.4"/></svg>
              {state.lastProcessMs}ms
            </span>
          )}
        </div>
        <div style={{ display:'flex', gap:6, alignItems:'center' }}>
          <span className="status-version">v{__APP_VERSION__}</span>
          <button
            className={`compare-btn${state.splitCompare ? ' active' : ''}`}
            onClick={() => set('splitCompare', !state.splitCompare)}
            title="Space to toggle"
          >
            {state.splitCompare ? 'Split On' : 'Split Compare'}
          </button>
          <button
            className={`compare-btn${state.comparing ? ' active' : ''}`}
            onMouseDown={() => set('comparing', true)}
            onMouseUp={() => set('comparing', false)}
            onMouseLeave={() => set('comparing', false)}
            onTouchStart={() => set('comparing', true)}
            onTouchEnd={() => set('comparing', false)}
          >
            Hold to Compare
          </button>
        </div>
      </div>
      <ToastContainer toasts={toasts} />
    </div>
  )
}
