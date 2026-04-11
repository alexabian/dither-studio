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

// Grouped palette presets
const PALETTE_GROUPS = [
  {
    label: 'Monochrome',
    palettes: [
      { name: 'B&W',            colors: ['#000000','#ffffff'] },
      { name: 'Grayscale 4',    colors: ['#000000','#555555','#aaaaaa','#ffffff'] },
      { name: 'Grayscale 8',    colors: ['#000000','#242424','#494949','#6d6d6d','#929292','#b6b6b6','#dbdbdb','#ffffff'] },
      { name: 'Green Terminal', colors: ['#0a1a0a','#0d3a0d','#1a6b1a','#2fa82f','#4dda4d','#a8f0a8'] },
      { name: 'Amber Terminal', colors: ['#1a0a00','#3d1f00','#7a3d00','#c46200','#f09000','#ffd580'] },
      { name: 'Sepia',          colors: ['#1c0a00','#3d1c02','#704214','#a0522d','#c68642','#deb887','#f5deb3','#fff8dc'] },
    ],
  },
  {
    label: 'Retro Consoles',
    palettes: [
      { name: 'GameBoy',         colors: ['#0f380f','#306230','#8bac0f','#9bbc0f'] },
      { name: 'GB Pocket',       colors: ['#000000','#525252','#a8a8a8','#ffffff'] },
      { name: 'GB Light',        colors: ['#00303b','#017a7b','#65b08c','#c4f0c2'] },
      { name: 'CGA',             colors: ['#000000','#55ffff','#ff55ff','#ffffff'] },
      { name: 'CGA Mode 1',      colors: ['#000000','#aa0000','#00aa00','#aa5500','#0000aa','#aa00aa','#00aaaa','#aaaaaa','#555555','#ff5555','#55ff55','#ffff55','#5555ff','#ff55ff','#55ffff','#ffffff'] },
      { name: 'EGA',             colors: ['#000000','#0000aa','#00aa00','#00aaaa','#aa0000','#aa00aa','#aa5500','#aaaaaa','#555555','#5555ff','#55ff55','#55ffff','#ff5555','#ff55ff','#ffff55','#ffffff'] },
      { name: 'Pico-8',          colors: ['#000000','#1d2b53','#7e2553','#008751','#ab5236','#5f574f','#c2c3c7','#fff1e8','#ff004d','#ffa300','#ffec27','#00e436','#29adff','#83769c','#ff77a8','#ffccaa'] },
      { name: 'C64',             colors: ['#000000','#ffffff','#883932','#67b6bd','#8b3f96','#55a049','#40318d','#bfce72','#8b5429','#574200','#b86962','#505050','#787878','#94e089','#7869c4','#9f9f9f'] },
      { name: 'ZX Spectrum',     colors: ['#000000','#0000d8','#d80000','#d800d8','#00d800','#00d8d8','#d8d800','#d8d8d8'] },
      { name: 'MSX',             colors: ['#000000','#1eb53a','#54c85c','#d85050','#e86060','#4848d8','#5050f8','#d0d050','#e8e858','#3898e8','#50a8f8','#c848c8','#50c8c8','#cacaca','#202020','#ffffff'] },
      { name: 'NES',             colors: ['#000000','#fcfcfc','#f8f8f8','#bcbcbc','#7c7c7c','#a4e4fc','#3cbcfc','#0078f8','#0000fc','#b8b8f8','#6888fc','#0058f8','#0000bc','#d8b8f8','#9878f8','#6844fc','#4428bc','#f8b8f8','#f878f8','#d800cc','#940084','#f8a4c0','#f85898','#e40058','#a80020','#f0d0b0','#f87858','#f83800','#a81000','#fce0a8','#fca044','#e45c10','#881400'] },
      { name: 'Apple II',        colors: ['#000000','#722640','#40337f','#e434fe','#0b7240','#808080','#1b5de5','#aab9fd','#554117','#f36a17','#808080','#f3a6bc','#11c425','#bff3ae','#bdb9f5','#ffffff'] },
      { name: 'Commodore Amiga', colors: ['#000000','#ffffff','#aaaaaa','#555555','#ff0000','#880000','#00cc00','#006600','#0000cc','#000066','#ffff00','#886600','#ff8800','#884400','#00cccc','#ff88ff'] },
    ],
  },
  {
    label: 'Modern Themes',
    palettes: [
      { name: 'Nord',      colors: ['#2e3440','#3b4252','#434c5e','#4c566a','#d8dee9','#e5e9f0','#eceff4','#8fbcbb','#88c0d0','#81a1c1','#5e81ac','#bf616a','#d08770','#ebcb8b','#a3be8c','#b48ead'] },
      { name: 'Dracula',   colors: ['#282a36','#44475a','#f8f8f2','#6272a4','#8be9fd','#50fa7b','#ffb86c','#ff79c6','#bd93f9','#ff5555','#f1fa8c'] },
      { name: 'Gruvbox',   colors: ['#282828','#3c3836','#504945','#665c54','#7c6f64','#928374','#a89984','#d5c4a1','#fbf1c7','#cc241d','#d65d0e','#d79921','#98971a','#689d6a','#458588','#b16286'] },
      { name: 'Solarized', colors: ['#002b36','#073642','#586e75','#657b83','#839496','#93a1a1','#eee8d5','#fdf6e3','#b58900','#cb4b16','#dc322f','#d33682','#6c71c4','#268bd2','#2aa198','#859900'] },
    ],
  },
  {
    label: 'Artistic',
    palettes: [
      { name: 'Warm Tones', colors: ['#1a0a00','#4a1800','#8b3a00','#d4620a','#f0a030','#f8d060','#fff8e0'] },
      { name: 'Cool Blues',  colors: ['#000814','#001d3d','#003566','#0077b6','#00b4d8','#90e0ef','#caf0f8','#ffffff'] },
      { name: 'Synthwave',   colors: ['#0d0221','#190b28','#2a1b3d','#44318d','#8265a7','#e98df7','#f637ec','#c42b75','#ff3864','#fe5f55','#ffdd00','#f9e4c8'] },
      { name: 'Pastel',      colors: ['#ffd1dc','#ffb3ba','#ffdfba','#ffffba','#baffc9','#bae1ff','#e8baff','#ffffff'] },
      { name: 'Risograph',   colors: ['#f15946','#e8a838','#f7e967','#3eccc7','#2d5be3','#eb3f7f','#f0f0f0'] },
      { name: 'Forest',      colors: ['#0b1d0b','#1a3a1a','#2d5a27','#4a7c59','#74a57f','#a8c5a0','#d4e6c3','#f0f5e8'] },
      { name: 'Sunset',      colors: ['#0a0010','#1a002e','#4d0050','#99003d','#d4002a','#ff4500','#ff8c00','#ffcd00','#fffacd'] },
      { name: 'Blueprint',   colors: ['#001233','#012a4a','#013a63','#01497c','#014f86','#2a6496','#4a90d9','#89c2e8','#c8e6f5','#ffffff'] },
    ],
  },
]

// Flat list of all palettes for random picking
const ALL_PALETTES = PALETTE_GROUPS.flatMap(g => g.palettes)

export default function PalettePanel({ state, set, computedPalette }) {
  const colorInputRefs = useRef([])

  const displayPalette = state.paletteMethod === 'custom'
    ? state.customColors
    : (computedPalette || []).map(([r, g, b]) => rgbToHex(r, g, b))

  const applyBuiltin = (preset) => {
    set('paletteMethod', 'custom')
    set('customColors', preset.colors)
  }

  const randomizePalette = () => {
    const pick = ALL_PALETTES[Math.floor(Math.random() * ALL_PALETTES.length)]
    set('paletteMethod', 'custom')
    set('customColors', pick.colors)
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
        <button className="randomize-btn randomize-btn--all" style={{ width:'100%' }} onClick={randomizePalette}>
          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 4h2.5a4 4 0 0 1 3 1.4L8 7l1.5 1.6a4 4 0 0 0 3 1.4H14"/>
            <path d="M12 2.5l2 1.5-2 1.5"/>
            <path d="M1 10h2.5a4 4 0 0 0 3-1.4L8 7"/>
            <path d="M12 8.5l2 1.5-2 1.5"/>
          </svg>
          Randomize Palette
        </button>
      </div>

      <div className="panel-section">
        <span className="section-label">Classic Palettes</span>
        {PALETTE_GROUPS.map(group => (
          <div key={group.label} className="palette-group">
            <span className="palette-group-label">{group.label}</span>
            <div className="preset-palette-list">
              {group.palettes.map(p => (
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
        ))}
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
