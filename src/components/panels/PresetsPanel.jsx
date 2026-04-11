import { useState } from 'react'

const SETTINGS_KEYS = [
  'ditherMethod','ditherAmount','ditherDiffusion','serpentine',
  'paletteColors','paletteMethod','customColors',
  'gamma','blacks','whites','contrast','saturation','hue',
  'noiseCoverage','noiseIntensity','noiseSaturation',
  'blurStrength','edgeStrength','blurPasses',
]

const BUILTIN_PRESETS = [
  {
    name: 'Newspaper',
    desc: 'High contrast black & white',
    settings: { ditherMethod:'floyd-steinberg', ditherAmount:0.9, ditherDiffusion:1, serpentine:true, paletteColors:4, paletteMethod:'median-cut', customColors:[], gamma:1.5, blacks:0.05, whites:0.05, contrast:1.5, saturation:0.1, hue:0, noiseCoverage:0, noiseIntensity:0.2, noiseSaturation:1, blurStrength:0, edgeStrength:20, blurPasses:1 },
  },
  {
    name: 'Retro Game',
    desc: 'Atkinson with low colour count',
    settings: { ditherMethod:'atkinson', ditherAmount:0.7, ditherDiffusion:1, serpentine:true, paletteColors:4, paletteMethod:'median-cut', customColors:[], gamma:1.8, blacks:0, whites:0, contrast:1.3, saturation:1.2, hue:0, noiseCoverage:0, noiseIntensity:0.2, noiseSaturation:1, blurStrength:0, edgeStrength:8, blurPasses:2 },
  },
  {
    name: 'Fine Detail',
    desc: 'Jarvis–JN, 16 colours, sharp',
    settings: { ditherMethod:'jarvis', ditherAmount:0.8, ditherDiffusion:1, serpentine:true, paletteColors:16, paletteMethod:'median-cut', customColors:[], gamma:2.2, blacks:0.05, whites:0, contrast:1.1, saturation:1, hue:0, noiseCoverage:0, noiseIntensity:0.2, noiseSaturation:1, blurStrength:0, edgeStrength:10, blurPasses:2 },
  },
  {
    name: 'Halftone',
    desc: 'Ordered Bayer with warm tones',
    settings: { ditherMethod:'ordered', ditherAmount:0.85, ditherDiffusion:1.2, serpentine:false, paletteColors:6, paletteMethod:'median-cut', customColors:[], gamma:2, blacks:0.08, whites:0, contrast:1.3, saturation:0.8, hue:0, noiseCoverage:0, noiseIntensity:0.2, noiseSaturation:1, blurStrength:0, edgeStrength:8, blurPasses:1 },
  },
  {
    name: 'Lo-Fi',
    desc: 'Random noise, grungy feel',
    settings: { ditherMethod:'random', ditherAmount:0.5, ditherDiffusion:1.5, serpentine:false, paletteColors:8, paletteMethod:'median-cut', customColors:[], gamma:1.8, blacks:0, whites:0, contrast:1, saturation:1.1, hue:0, noiseCoverage:0.1, noiseIntensity:0.15, noiseSaturation:0.5, blurStrength:2, edgeStrength:5, blurPasses:1 },
  },
  {
    name: 'Silkscreen',
    desc: 'Bold Sierra, few colours',
    settings: { ditherMethod:'sierra', ditherAmount:0.75, ditherDiffusion:0.9, serpentine:true, paletteColors:5, paletteMethod:'k-means', customColors:[], gamma:2, blacks:0.1, whites:0, contrast:1.4, saturation:1.3, hue:0, noiseCoverage:0, noiseIntensity:0.2, noiseSaturation:1, blurStrength:0, edgeStrength:14, blurPasses:2 },
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

  const applyPreset = (settings) => {
    setMany(settings)
  }

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
        <div className="preset-list">
          {BUILTIN_PRESETS.map((p, i) => (
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
    </>
  )
}
