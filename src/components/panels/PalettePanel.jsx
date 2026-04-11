import { useRef } from 'react'
import ButtonGroup from '../ui/ButtonGroup'
import Slider from '../ui/Slider'
import { rgbToHex } from '../../utils/colorQuant'

const METHODS = [
  { value: 'median-cut', label: 'Median Cut' },
  { value: 'octree',     label: 'Octree' },
  { value: 'k-means',    label: 'K-Means' },
  { value: 'custom',     label: 'Custom' },
]

// Famous / useful palettes
const BUILTIN_PALETTES = [
  { name: 'B&W',          colors: ['#000000','#ffffff'] },
  { name: 'Grayscale 4',  colors: ['#000000','#555555','#aaaaaa','#ffffff'] },
  { name: 'GameBoy',      colors: ['#0f380f','#306230','#8bac0f','#9bbc0f'] },
  { name: 'GB Pocket',    colors: ['#000000','#525252','#a8a8a8','#ffffff'] },
  { name: 'CGA',          colors: ['#000000','#55ffff','#ff55ff','#ffffff'] },
  { name: 'Pico-8',       colors: ['#000000','#1d2b53','#7e2553','#008751','#ab5236','#5f574f','#c2c3c7','#fff1e8','#ff004d','#ffa300','#ffec27','#00e436','#29adff','#83769c','#ff77a8','#ffccaa'] },
  { name: 'C64',          colors: ['#000000','#ffffff','#883932','#67b6bd','#8b3f96','#55a049','#40318d','#bfce72','#8b5429','#574200','#b86962','#505050','#787878','#94e089','#7869c4','#9f9f9f'] },
  { name: 'ZX Spectrum',  colors: ['#000000','#0000d8','#d80000','#d800d8','#00d800','#00d8d8','#d8d800','#d8d8d8'] },
  { name: 'NES',          colors: ['#000000','#fcfcfc','#f8f8f8','#bcbcbc','#7c7c7c','#a4e4fc','#3cbcfc','#0078f8','#0000fc','#b8b8f8','#6888fc','#0058f8','#0000bc','#d8b8f8','#9878f8','#6844fc','#4428bc','#f8b8f8','#f878f8','#d800cc','#940084','#f8a4c0','#f85898','#e40058','#a80020','#f0d0b0','#f87858','#f83800','#a81000','#fce0a8','#fca044','#e45c10','#881400'] },
  { name: 'Apple II',     colors: ['#000000','#722640','#40337f','#e434fe','#0b7240','#808080','#1b5de5','#aab9fd','#554117','#f36a17','#808080','#f3a6bc','#11c425','#bff3ae','#bdb9f5','#ffffff'] },
  { name: 'Warm Tones',   colors: ['#1a0a00','#4a1800','#8b3a00','#d4620a','#f0a030','#f8d060','#fff8e0'] },
  { name: 'Cool Blues',   colors: ['#000814','#001d3d','#003566','#0077b6','#00b4d8','#90e0ef','#caf0f8','#ffffff'] },
]

export default function PalettePanel({ state, set, computedPalette }) {
  const colorInputRefs = useRef([])

  const displayPalette = state.paletteMethod === 'custom'
    ? state.customColors
    : (computedPalette || []).map(([r, g, b]) => rgbToHex(r, g, b))

  const applyBuiltin = (preset) => {
    set('paletteMethod', 'custom')
    set('customColors', preset.colors)
  }

  const handleColorChange = (i, hex) => {
    const updated = [...state.customColors]
    updated[i] = hex
    set('customColors', updated)
  }

  return (
    <>
      <div className="panel-section">
        <span className="section-label">Palette Size</span>
        <Slider label="Colors" value={state.paletteColors} min={2} max={64} step={1} onChange={v => set('paletteColors', v)} />
      </div>

      <div className="panel-section">
        <span className="section-label">Quantization Method</span>
        <ButtonGroup options={METHODS} value={state.paletteMethod} onChange={v => set('paletteMethod', v)} />
      </div>

      <div className="panel-section">
        <span className="section-label">Classic Palettes</span>
        <div className="preset-palette-list">
          {BUILTIN_PALETTES.map(p => (
            <button key={p.name} className="preset-palette-btn" onClick={() => applyBuiltin(p)} title={`${p.colors.length} colors`}>
              <span className="preset-palette-name">{p.name}</span>
              <span className="preset-palette-swatches">
                {p.colors.slice(0, 8).map((c, i) => (
                  <span key={i} className="preset-palette-dot" style={{ background: c }} />
                ))}
              </span>
            </button>
          ))}
        </div>
      </div>

      {displayPalette.length > 0 && (
        <div className="panel-section">
          <span className="section-label">
            Current Colors
            {state.paletteMethod === 'custom' && <span style={{ color: 'var(--text-4)', fontWeight: 400, marginLeft: 6 }}>· click to edit</span>}
          </span>
          <div className="palette-grid">
            {displayPalette.map((hex, i) => (
              <div
                key={i}
                className="color-swatch"
                style={{ background: hex }}
                onClick={() => state.paletteMethod === 'custom' && colorInputRefs.current[i]?.click()}
                onContextMenu={e => {
                  e.preventDefault()
                  if (state.paletteMethod === 'custom' && state.customColors.length > 2) {
                    set('customColors', state.customColors.filter((_, j) => j !== i))
                  }
                }}
                title={hex}
              >
                {state.paletteMethod === 'custom' && (
                  <input
                    type="color"
                    ref={el => colorInputRefs.current[i] = el}
                    value={hex}
                    onChange={e => handleColorChange(i, e.target.value)}
                  />
                )}
              </div>
            ))}
          </div>

          {state.paletteMethod === 'custom' && (
            <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
              <button className="action-btn" onClick={() => set('customColors', [...state.customColors, '#888888'])}>
                <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 2v8M2 6h8"/></svg>
                Add color
              </button>
            </div>
          )}
        </div>
      )}
    </>
  )
}
