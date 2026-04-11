import Slider from '../ui/Slider'
import Histogram from '../Histogram'

export default function AdjustmentsPanel({ state, set, histogram }) {
  return (
    <>
      <div className="panel-section">
        <span className="section-label">Histogram</span>
        <Histogram data={histogram} />
      </div>

      <div className="divider" />

      <div className="panel-section">
        <span className="section-label">Color</span>
        <Slider label="Gamma"    value={state.gamma}    min={0.3} max={3}    step={0.01} onChange={v => set('gamma', v)} />
        <Slider label="Blacks"   value={state.blacks}   min={-0.6} max={0.6} step={0.01} onChange={v => set('blacks', v)} />
        <Slider label="Whites"   value={state.whites}   min={-0.5} max={0.5} step={0.01} onChange={v => set('whites', v)} />
        <Slider label="Contrast" value={state.contrast} min={0}   max={3}    step={0.01} onChange={v => set('contrast', v)} />
        <Slider label="Saturation" value={state.saturation} min={0} max={2}  step={0.01} onChange={v => set('saturation', v)} />
        <Slider label="Hue"      value={state.hue}      min={-3.14} max={3.14} step={0.01} onChange={v => set('hue', v)} />
      </div>

      <div className="divider" />

      <div className="panel-section">
        <span className="section-label">Noise</span>
        <Slider label="Coverage"   value={state.noiseCoverage}   min={0} max={1} step={0.01} onChange={v => set('noiseCoverage', v)} />
        <Slider label="Intensity"  value={state.noiseIntensity}  min={0} max={1} step={0.01} onChange={v => set('noiseIntensity', v)} />
        <Slider label="Saturation" value={state.noiseSaturation} min={0} max={1} step={0.01} onChange={v => set('noiseSaturation', v)} />
      </div>

      <div className="divider" />

      <div className="panel-section">
        <span className="section-label">Blur</span>
        <Slider label="Blur Strength" value={state.blurStrength} min={0} max={30} step={1} onChange={v => set('blurStrength', v)} />
        <Slider label="Edge Strength" value={state.edgeStrength} min={0} max={30} step={1} onChange={v => set('edgeStrength', v)} />
        <Slider label="Passes"        value={state.blurPasses}   min={1} max={4}  step={1} onChange={v => set('blurPasses', v)} />
      </div>
    </>
  )
}
