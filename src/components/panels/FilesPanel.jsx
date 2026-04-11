import { useRef, useState, useCallback } from 'react'
import Slider from '../ui/Slider'

const FORMAT_OPTIONS = [
  { value: 'png',  label: 'PNG' },
  { value: 'jpeg', label: 'JPEG' },
  { value: 'webp', label: 'WebP' },
]

export default function FilesPanel({ state, set, onFileLoad, onResetDefault, gallery, onGallerySelect, onClearGallery, onSave, onCopy }) {
  const fileInputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)

  const handleFile = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) return
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth; canvas.height = img.naturalHeight
      canvas.getContext('2d').drawImage(img, 0, 0)
      const imageData = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      onFileLoad(imageData, img.naturalWidth, img.naturalHeight, file.name.replace(/\.[^.]+$/, ''))
    }
    img.src = url
  }, [onFileLoad])

  const handleDrop = useCallback((e) => {
    e.preventDefault(); setDragOver(false)
    handleFile(e.dataTransfer.files[0])
  }, [handleFile])

  const handlePaste = useCallback(async () => {
    try {
      const items = await navigator.clipboard.read()
      for (const item of items)
        for (const type of item.types)
          if (type.startsWith('image/')) {
            handleFile(new File([await item.getType(type)], 'clipboard.png', { type }))
            return
          }
    } catch { alert('Could not read image from clipboard.') }
  }, [handleFile])

  const widthChange = (v) => {
    const w = Math.max(1, Math.round(v))
    if (state.keepRatio && state.originalWidth && state.originalHeight) {
      set('displayWidth', w); set('displayHeight', Math.round(w * state.originalHeight / state.originalWidth))
    } else set('displayWidth', w)
  }

  const heightChange = (v) => {
    const h = Math.max(1, Math.round(v))
    if (state.keepRatio && state.originalWidth && state.originalHeight) {
      set('displayHeight', h); set('displayWidth', Math.round(h * state.originalWidth / state.originalHeight))
    } else set('displayHeight', h)
  }

  const maxW = state.originalWidth  || 2048
  const maxH = state.originalHeight || 2048

  return (
    <>
      <div className="panel-section">
        <span className="section-label">Source</span>
        <div className="source-tag">
          <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width:10, height:10, flexShrink:0 }}>
            <rect x="1" y="1" width="10" height="10" rx="1.5"/><circle cx="4" cy="4" r="1"/><path d="m11 8-3-3-4 4"/>
          </svg>
          {state.sourceName || 'No image'}
        </div>
      </div>

      <div className="panel-section">
        <span className="section-label">Import</span>
        <div
          className={`import-area${dragOver ? ' drag-over' : ''}`}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 16.5v1.25A2.25 2.25 0 006.25 20h11.5A2.25 2.25 0 0020 17.75V16.5"/><path d="M12 4v12M8 8l4-4 4 4"/>
          </svg>
          <span>Drop image here</span>
          <small>or click to browse · Ctrl+V to paste</small>
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display:'none' }} onChange={e => handleFile(e.target.files[0])} />
        </div>
        <div className="import-buttons">
          <button className="action-btn" onClick={handlePaste}>
            <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="1" width="7" height="9" rx="1"/><path d="M2 3H1v8h7v-1"/></svg>
            Clipboard
          </button>
          <button className="action-btn" onClick={onResetDefault}>
            <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 6a4 4 0 104-4H4M4 2v4H1"/></svg>
            Reset
          </button>
        </div>
      </div>

      {state.originalWidth && (
        <div className="panel-section">
          <span className="section-label">Size</span>
          <Slider label="Width"  value={state.displayWidth}  min={1} max={maxW} step={1} onChange={widthChange} />
          <Slider label="Height" value={state.displayHeight} min={1} max={maxH} step={1} onChange={heightChange} />
          <div className="ratio-row">
            <span className="ratio-label">{state.displayWidth} × {state.displayHeight}</span>
            <div className="ratio-btns">
              <button className={`ratio-btn${state.keepRatio ? ' active' : ''}`}  onClick={() => set('keepRatio', true)}>Lock</button>
              <button className={`ratio-btn${!state.keepRatio ? ' active' : ''}`} onClick={() => set('keepRatio', false)}>Free</button>
            </div>
          </div>
        </div>
      )}

      {state.originalWidth && (
        <div className="panel-section">
          <span className="section-label">Export</span>

          {/* Format selector */}
          <div style={{ display:'flex', gap:4, marginBottom:6 }}>
            {FORMAT_OPTIONS.map(f => (
              <button
                key={f.value}
                className={`ratio-btn${state.exportFormat === f.value ? ' active' : ''}`}
                onClick={() => set('exportFormat', f.value)}
              >{f.label}</button>
            ))}
          </div>

          {/* Quality slider for lossy formats */}
          {state.exportFormat !== 'png' && (
            <Slider label="Quality" value={state.exportQuality} min={0.1} max={1} step={0.05} onChange={v => set('exportQuality', v)} />
          )}

          <div className="import-buttons" style={{ marginTop: 6 }}>
            <button className="action-btn primary" onClick={onSave}>
              <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 8.5V10h8V8.5M6 2v6M4 6l2 2 2-2"/></svg>
              Save {state.exportFormat?.toUpperCase() || 'PNG'}
            </button>
            <button className="action-btn" onClick={onCopy}>
              <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="4" y="4" width="7" height="7" rx="1"/><path d="M1 8V2a1 1 0 011-1h6"/></svg>
              Copy
            </button>
          </div>
        </div>
      )}

      <div className="panel-section">
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span className="section-label">Gallery</span>
          {gallery.length > 0 && <button className="clear-btn" onClick={onClearGallery}>Clear</button>}
        </div>
        {gallery.length > 0 ? (
          <div className="gallery-grid">
            {gallery.map((item, i) => (
              <div key={i} className="gallery-thumb" onClick={() => onGallerySelect(item)} title={item.name}>
                <img src={item.thumb} alt={item.name} />
                <div className="gallery-thumb-label">{item.name.slice(0, 8)}</div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize:11, color:'var(--text-4)' }}>No saved images yet.</p>
        )}
      </div>
    </>
  )
}
