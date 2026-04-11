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

export default function DitherPanel({ state, set }) {
  return (
    <>
      <div className="panel-section">
        <span className="section-label">Method</span>
        <ButtonGroup options={METHODS} value={state.ditherMethod} onChange={v => set('ditherMethod', v)} />
      </div>

      <div className="panel-section">
        <Slider label="Amount"    value={state.ditherAmount}    min={0} max={1} step={0.01} onChange={v => set('ditherAmount', v)} />
        <Slider label="Diffusion" value={state.ditherDiffusion} min={0} max={2} step={0.01} onChange={v => set('ditherDiffusion', v)} />

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
    </>
  )
}
