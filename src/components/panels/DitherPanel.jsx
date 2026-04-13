import ButtonGroup from '../ui/ButtonGroup'
import Slider from '../ui/Slider'

const METHODS = [
  { value: 'disabled',        label: 'None' },
  { value: 'floyd-steinberg', label: 'Floyd–Steinberg' },
  { value: 'jarvis',          label: 'Jarvis JN' },
  { value: 'stucki',          label: 'Stucki' },
  { value: 'atkinson',        label: 'Atkinson' },
  { value: 'burkes',          label: 'Burkes' },
  { value: 'sierra',          label: 'Sierra' },
  { value: 'two-row-sierra',  label: 'Sierra 2-Row' },
  { value: 'sierra-lite',     label: 'Sierra Lite' },
  { value: 'ordered',         label: 'Ordered (Bayer)' },
  { value: 'random',          label: 'Random' },
]

const ERROR_DIFFUSE_METHODS = new Set([
  'floyd-steinberg','jarvis','stucki','atkinson','burkes','sierra','two-row-sierra','sierra-lite'
])

const RANDOMIZABLE_METHODS = METHODS.map(m => m.value).filter(m => m !== 'disabled')

function rnd(min, max, decimals = 2) {
  const v = Math.random() * (max - min) + min
  return Math.round(v * 10 ** decimals) / 10 ** decimals
}

const DITHER_DEFAULTS = {
  ditherMethod: 'atkinson', ditherAmount: 0.65, ditherDiffusion: 1, serpentine: true, pixelSize: 1,
}

export default function DitherPanel({ state, set, setMany }) {
  const randomizeSettings = () => {
    setMany({
      ditherAmount:    rnd(0.3, 1.0),
      ditherDiffusion: rnd(0.5, 2.0),
      serpentine:      Math.random() > 0.5,
    })
  }

  const randomizeAll = () => {
    const method = RANDOMIZABLE_METHODS[Math.floor(Math.random() * RANDOMIZABLE_METHODS.length)]
    setMany({
      ditherMethod:    method,
      ditherAmount:    rnd(0.3, 1.0),
      ditherDiffusion: rnd(0.5, 2.0),
      serpentine:      Math.random() > 0.5,
    })
  }

  const resetDither = () => setMany(DITHER_DEFAULTS)

  return (
    <>
      <div className="panel-section">
        <span className="section-label">Method</span>
        <ButtonGroup options={METHODS} value={state.ditherMethod} onChange={v => set('ditherMethod', v)} />
      </div>

      <div className="panel-section">
        <Slider label="Amount"    value={state.ditherAmount}    min={0} max={1}  step={0.01} defaultValue={0.65} onChange={v => set('ditherAmount', v)} />
        <Slider label="Diffusion" value={state.ditherDiffusion} min={0} max={2}  step={0.01} defaultValue={1}    onChange={v => set('ditherDiffusion', v)} />
        <Slider label="Dot Size"  value={state.pixelSize}       min={1} max={16} step={1}    defaultValue={1}    onChange={v => set('pixelSize', v)} />

        {ERROR_DIFFUSE_METHODS.has(state.ditherMethod) && (
          <div className="toggle-row" style={{ marginTop: 4 }}>
            <span className="toggle-row-label">Serpentine Scan</span>
            <label className="toggle-switch">
              <input type="checkbox" checked={!!state.serpentine} onChange={e => set('serpentine', e.target.checked)} />
              <span className="toggle-slider" />
            </label>
          </div>
        )}
      </div>

      <div className="panel-section">
        <span className="section-label">Randomize</span>
        <div className="randomize-row">
          <button className="randomize-btn" onClick={randomizeSettings} title="Randomize Amount, Diffusion & Serpentine — keeps current method">
            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 4h2.5a4 4 0 0 1 3 1.4L8 7l1.5 1.6a4 4 0 0 0 3 1.4H14"/>
              <path d="M12 2.5l2 1.5-2 1.5"/>
              <path d="M1 10h2.5a4 4 0 0 0 3-1.4L8 7"/>
              <path d="M12 8.5l2 1.5-2 1.5"/>
            </svg>
            Settings Only
          </button>
          <button className="randomize-btn randomize-btn--all" onClick={randomizeAll} title="Randomize everything including method">
            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 4h2.5a4 4 0 0 1 3 1.4L8 7l1.5 1.6a4 4 0 0 0 3 1.4H14"/>
              <path d="M12 2.5l2 1.5-2 1.5"/>
              <path d="M1 10h2.5a4 4 0 0 0 3-1.4L8 7"/>
              <path d="M12 8.5l2 1.5-2 1.5"/>
            </svg>
            Randomize All
          </button>
          <button className="reset-btn" onClick={resetDither} title="Reset dither settings to defaults">
            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 7a5 5 0 1 0 1.5-3.5"/>
              <path d="M2 3.5V7h3.5"/>
            </svg>
            Reset
          </button>
        </div>
      </div>
    </>
  )
}
