import { useState } from 'react'

const SETTINGS_KEYS = [
  'ditherMethod','ditherAmount','ditherDiffusion','serpentine',
  'paletteColors','paletteMethod','customColors',
  'gamma','blacks','whites','contrast','saturation','hue',
  'noiseCoverage','noiseIntensity','noiseSaturation',
  'blurStrength','edgeStrength','blurPasses',
]

const BUILTIN_PRESET_GROUPS = [
  {
    label: 'Print & Press',
    presets: [
      {
        name: 'Newspaper',
        desc: 'High contrast B&W, editorial feel',
        settings: { ditherMethod:'floyd-steinberg', ditherAmount:0.9, ditherDiffusion:1, serpentine:true, paletteColors:4, paletteMethod:'median-cut', customColors:[], gamma:1.5, blacks:0.05, whites:0.05, contrast:1.5, saturation:0.1, hue:0, noiseCoverage:0, noiseIntensity:0.2, noiseSaturation:1, blurStrength:0, edgeStrength:20, blurPasses:1 },
      },
      {
        name: 'Silkscreen',
        desc: 'Bold Sierra, few flat colours',
        settings: { ditherMethod:'sierra', ditherAmount:0.75, ditherDiffusion:0.9, serpentine:true, paletteColors:5, paletteMethod:'k-means', customColors:[], gamma:2, blacks:0.1, whites:0, contrast:1.4, saturation:1.3, hue:0, noiseCoverage:0, noiseIntensity:0.2, noiseSaturation:1, blurStrength:0, edgeStrength:14, blurPasses:2 },
      },
      {
        name: 'Risograph',
        desc: 'Gritty limited-ink print look',
        settings: { ditherMethod:'stucki', ditherAmount:0.82, ditherDiffusion:1.1, serpentine:true, paletteColors:4, paletteMethod:'k-means', customColors:['#f15946','#e8a838','#2d5be3','#f0f0f0'], gamma:1.9, blacks:0.07, whites:0, contrast:1.35, saturation:1.4, hue:0, noiseCoverage:0.04, noiseIntensity:0.2, noiseSaturation:0.6, blurStrength:0, edgeStrength:10, blurPasses:1 },
      },
      {
        name: 'Blueprint',
        desc: 'Cyanotype / technical drawing',
        settings: { ditherMethod:'jarvis', ditherAmount:0.85, ditherDiffusion:1, serpentine:true, paletteColors:4, paletteMethod:'custom', customColors:['#001233','#013a63','#4a90d9','#ffffff'], gamma:2, blacks:0.1, whites:0, contrast:1.5, saturation:0.3, hue:210, noiseCoverage:0, noiseIntensity:0.2, noiseSaturation:1, blurStrength:0, edgeStrength:18, blurPasses:2 },
      },
      {
        name: 'Engraving',
        desc: 'Fine lines, extreme B&W contrast',
        settings: { ditherMethod:'jarvis', ditherAmount:1.0, ditherDiffusion:1.2, serpentine:true, paletteColors:2, paletteMethod:'custom', customColors:['#000000','#ffffff'], gamma:1.4, blacks:0.12, whites:0.05, contrast:1.8, saturation:0, hue:0, noiseCoverage:0, noiseIntensity:0.2, noiseSaturation:1, blurStrength:0, edgeStrength:25, blurPasses:1 },
      },
    ],
  },
  {
    label: 'Retro & Games',
    presets: [
      {
        name: 'Retro Game',
        desc: 'Atkinson with low colour count',
        settings: { ditherMethod:'atkinson', ditherAmount:0.7, ditherDiffusion:1, serpentine:true, paletteColors:4, paletteMethod:'median-cut', customColors:[], gamma:1.8, blacks:0, whites:0, contrast:1.3, saturation:1.2, hue:0, noiseCoverage:0, noiseIntensity:0.2, noiseSaturation:1, blurStrength:0, edgeStrength:8, blurPasses:2 },
      },
      {
        name: 'GameBoy',
        desc: '4-tone green LCD palette',
        settings: { ditherMethod:'atkinson', ditherAmount:0.8, ditherDiffusion:1, serpentine:false, paletteColors:4, paletteMethod:'custom', customColors:['#0f380f','#306230','#8bac0f','#9bbc0f'], gamma:2, blacks:0.05, whites:0, contrast:1.4, saturation:0.8, hue:100, noiseCoverage:0, noiseIntensity:0.2, noiseSaturation:1, blurStrength:0, edgeStrength:10, blurPasses:1 },
      },
      {
        name: 'Halftone',
        desc: 'Ordered Bayer, warm offset tones',
        settings: { ditherMethod:'ordered', ditherAmount:0.85, ditherDiffusion:1.2, serpentine:false, paletteColors:6, paletteMethod:'median-cut', customColors:[], gamma:2, blacks:0.08, whites:0, contrast:1.3, saturation:0.8, hue:0, noiseCoverage:0, noiseIntensity:0.2, noiseSaturation:1, blurStrength:0, edgeStrength:8, blurPasses:1 },
      },
      {
        name: 'Pixel Art',
        desc: 'Burkes, Pico-8 palette, crisp',
        settings: { ditherMethod:'burkes', ditherAmount:0.72, ditherDiffusion:0.9, serpentine:false, paletteColors:16, paletteMethod:'custom', customColors:['#000000','#1d2b53','#7e2553','#008751','#ab5236','#5f574f','#c2c3c7','#fff1e8','#ff004d','#ffa300','#ffec27','#00e436','#29adff','#83769c','#ff77a8','#ffccaa'], gamma:2.2, blacks:0, whites:0, contrast:1.2, saturation:1.3, hue:0, noiseCoverage:0, noiseIntensity:0.2, noiseSaturation:1, blurStrength:0, edgeStrength:6, blurPasses:1 },
      },
    ],
  },
  {
    label: 'Photography & Film',
    presets: [
      {
        name: 'Fine Detail',
        desc: 'Jarvis–JN, 16 colours, sharp',
        settings: { ditherMethod:'jarvis', ditherAmount:0.8, ditherDiffusion:1, serpentine:true, paletteColors:16, paletteMethod:'median-cut', customColors:[], gamma:2.2, blacks:0.05, whites:0, contrast:1.1, saturation:1, hue:0, noiseCoverage:0, noiseIntensity:0.2, noiseSaturation:1, blurStrength:0, edgeStrength:10, blurPasses:2 },
      },
      {
        name: 'Lo-Fi',
        desc: 'Random noise, grungy texture',
        settings: { ditherMethod:'random', ditherAmount:0.5, ditherDiffusion:1.5, serpentine:false, paletteColors:8, paletteMethod:'median-cut', customColors:[], gamma:1.8, blacks:0, whites:0, contrast:1, saturation:1.1, hue:0, noiseCoverage:0.1, noiseIntensity:0.15, noiseSaturation:0.5, blurStrength:2, edgeStrength:5, blurPasses:1 },
      },
      {
        name: 'VHS',
        desc: 'Faded, washed, lo-fi analog',
        settings: { ditherMethod:'two-row-sierra', ditherAmount:0.6, ditherDiffusion:1.3, serpentine:true, paletteColors:12, paletteMethod:'median-cut', customColors:[], gamma:1.6, blacks:0.05, whites:0.08, contrast:0.85, saturation:0.7, hue:5, noiseCoverage:0.12, noiseIntensity:0.18, noiseSaturation:0.4, blurStrength:1, edgeStrength:3, blurPasses:2 },
      },
      {
        name: 'Sepia Photo',
        desc: 'Warm vintage brown tones',
        settings: { ditherMethod:'floyd-steinberg', ditherAmount:0.78, ditherDiffusion:1, serpentine:true, paletteColors:6, paletteMethod:'custom', customColors:['#1c0a00','#3d1c02','#704214','#a0522d','#c68642','#deb887','#f5deb3','#fff8dc'], gamma:2, blacks:0.06, whites:0, contrast:1.2, saturation:0.4, hue:25, noiseCoverage:0.02, noiseIntensity:0.1, noiseSaturation:0.3, blurStrength:0, edgeStrength:8, blurPasses:1 },
      },
    ],
  },
  {
    label: 'Artistic',
    presets: [
      {
        name: 'Synthwave',
        desc: 'Neon purples on near-black',
        settings: { ditherMethod:'stucki', ditherAmount:0.88, ditherDiffusion:1.2, serpentine:true, paletteColors:8, paletteMethod:'custom', customColors:['#0d0221','#2a1b3d','#44318d','#8265a7','#e98df7','#f637ec','#ff3864','#ffdd00'], gamma:2.2, blacks:0.1, whites:0, contrast:1.4, saturation:1.6, hue:0, noiseCoverage:0, noiseIntensity:0.2, noiseSaturation:1, blurStrength:0, edgeStrength:12, blurPasses:1 },
      },
      {
        name: 'Woodblock',
        desc: 'Rough ink textures, earthy tones',
        settings: { ditherMethod:'sierra-lite', ditherAmount:0.92, ditherDiffusion:1.4, serpentine:true, paletteColors:4, paletteMethod:'k-means', customColors:[], gamma:1.7, blacks:0.15, whites:0.03, contrast:1.6, saturation:0.9, hue:15, noiseCoverage:0.06, noiseIntensity:0.25, noiseSaturation:0.2, blurStrength:0, edgeStrength:18, blurPasses:1 },
      },
      {
        name: 'Comic Book',
        desc: 'Bold CMYK-style flat halftones',
        settings: { ditherMethod:'ordered', ditherAmount:0.95, ditherDiffusion:1, serpentine:false, paletteColors:6, paletteMethod:'k-means', customColors:[], gamma:2, blacks:0.1, whites:0, contrast:1.7, saturation:1.8, hue:0, noiseCoverage:0, noiseIntensity:0.2, noiseSaturation:1, blurStrength:0, edgeStrength:20, blurPasses:1 },
      },
      {
        name: 'Night Vision',
        desc: 'Monochrome green phosphor glow',
        settings: { ditherMethod:'floyd-steinberg', ditherAmount:0.85, ditherDiffusion:1, serpentine:true, paletteColors:5, paletteMethod:'custom', customColors:['#0a1a0a','#0d3a0d','#1a6b1a','#2fa82f','#a8f0a8'], gamma:2.2, blacks:0.08, whites:0, contrast:1.5, saturation:0.2, hue:120, noiseCoverage:0.03, noiseIntensity:0.12, noiseSaturation:1, blurStrength:0, edgeStrength:10, blurPasses:1 },
      },
    ],
  },
]

const LS_KEY = 'dither-studio-presets'

function loadSaved() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || [] } catch { return [] }
}
function saveToDisk(presets) {
  localStorage.setItem(LS_KEY, JSON.stringify(presets))
}

export default function PresetsPanel({ state, setMany }) {
  const [saved, setSaved] = useState(loadSaved)
  const [name, setName]   = useState('')

  const applyPreset = (settings) => setMany(settings)

  const savePreset = () => {
    const label = name.trim() || `Preset ${saved.length + 1}`
    const snap = SETTINGS_KEYS.reduce((o, k) => ({ ...o, [k]: state[k] }), {})
    const next = [{ name: label, desc: 'Custom', settings: snap }, ...saved].slice(0, 20)
    setSaved(next)
    saveToDisk(next)
    setName('')
  }

  const deletePreset = (i) => {
    const next = saved.filter((_, j) => j !== i)
    setSaved(next)
    saveToDisk(next)
  }

  return (
    <>
      <div className="panel-section">
        <span className="section-label">Save Current Settings</span>
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            className="preset-name-input"
            type="text"
            placeholder="Preset name…"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && savePreset()}
          />
          <button className="action-btn primary" style={{ flex: 'none' }} onClick={savePreset}>
            <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 9.5h10M2 6.5l4-4 4 4M6 2.5v8"/></svg>
            Save
          </button>
        </div>
      </div>

      {saved.length > 0 && (
        <div className="panel-section">
          <span className="section-label">Saved</span>
          <div className="preset-list">
            {saved.map((p, i) => (
              <div key={i} className="preset-item">
                <div className="preset-item-info">
                  <span className="preset-item-name">{p.name}</span>
                </div>
                <div className="preset-item-actions">
                  <button className="preset-apply-btn" onClick={() => applyPreset(p.settings)}>Apply</button>
                  <button className="preset-delete-btn" onClick={() => deletePreset(i)} title="Delete">
                    <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 2l6 6M8 2l-6 6"/></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="panel-section">
        <span className="section-label">Built-in</span>
        {BUILTIN_PRESET_GROUPS.map(group => (
          <div key={group.label} className="palette-group">
            <span className="palette-group-label">{group.label}</span>
            <div className="preset-list">
              {group.presets.map((p, i) => (
                <div key={i} className="preset-item">
                  <div className="preset-item-info">
                    <span className="preset-item-name">{p.name}</span>
                    <span className="preset-item-desc">{p.desc}</span>
                  </div>
                  <button className="preset-apply-btn" onClick={() => applyPreset(p.settings)}>Apply</button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
