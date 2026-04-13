import { useState } from 'react'
import Slider from '../ui/Slider'
import Histogram from '../Histogram'
import CollapseChevron from '../ui/CollapseChevron'

const ADJUSTMENTS_DEFAULTS = {
  gamma: 2.13, blacks: 0.112, whites: 0, contrast: 1, saturation: 1, hue: 0,
  noiseCoverage: 0, noiseIntensity: 0.2, noiseSaturation: 1,
  blurStrength: 0, edgeStrength: 12, blurPasses: 2,
}

export default function AdjustmentsPanel({ state, set, setMany, histogram }) {
  const [open, setOpen] = useState({ color: true, noise: true, blur: true })
  const toggle = k => setOpen(o => ({ ...o, [k]: !o[k] }))

  return (
    <>
      <div className="panel-section">
        <span className="section-label">Histogram</span>
        <Histogram data={histogram} />
      </div>

      <div className="divider" />

      <div className="panel-section">
        <span className="section-label collapsible-label" onClick={() => toggle('color')}>
          Color
          <CollapseChevron open={open.color} />
        </span>
        {open.color && (
          <>
            <Slider label="Gamma"      value={state.gamma}      min={0.3}   max={3}    step={0.01}  defaultValue={2.13}  onChange={v => set('gamma', v)} />
            <Slider label="Blacks"     value={state.blacks}     min={-0.6}  max={0.6}  step={0.01}  defaultValue={0.112} onChange={v => set('blacks', v)} />
            <Slider label="Whites"     value={state.whites}     min={-0.5}  max={0.5}  step={0.01}  defaultValue={0}     onChange={v => set('whites', v)} />
            <Slider label="Contrast"   value={state.contrast}   min={0}     max={3}    step={0.01}  defaultValue={1}     onChange={v => set('contrast', v)} />
            <Slider label="Saturation" value={state.saturation} min={0}     max={2}    step={0.01}  defaultValue={1}     onChange={v => set('saturation', v)} />
            <Slider label="Hue"        value={state.hue}        min={-3.14} max={3.14} step={0.01}  defaultValue={0}     onChange={v => set('hue', v)} />
          </>
        )}
      </div>

      <div className="divider" />

      <div className="panel-section">
        <span className="section-label collapsible-label" onClick={() => toggle('noise')}>
          Noise
          <CollapseChevron open={open.noise} />
        </span>
        {open.noise && (
          <>
            <Slider label="Coverage"   value={state.noiseCoverage}   min={0} max={1} step={0.01} defaultValue={0}   onChange={v => set('noiseCoverage', v)} />
            <Slider label="Intensity"  value={state.noiseIntensity}  min={0} max={1} step={0.01} defaultValue={0.2} onChange={v => set('noiseIntensity', v)} />
            <Slider label="Saturation" value={state.noiseSaturation} min={0} max={1} step={0.01} defaultValue={1}   onChange={v => set('noiseSaturation', v)} />
          </>
        )}
      </div>

      <div className="divider" />

      <div className="panel-section">
        <span className="section-label collapsible-label" onClick={() => toggle('blur')}>
          Blur
          <CollapseChevron open={open.blur} />
        </span>
        {open.blur && (
          <>
            <Slider label="Blur Strength" value={state.blurStrength} min={0} max={30} step={1} defaultValue={0}  onChange={v => set('blurStrength', v)} />
            <Slider label="Edge Strength" value={state.edgeStrength} min={0} max={30} step={1} defaultValue={12} onChange={v => set('edgeStrength', v)} />
            <Slider label="Passes"        value={state.blurPasses}   min={1} max={4}  step={1} defaultValue={2}  onChange={v => set('blurPasses', v)} />
            <button className="reset-btn reset-btn--full" onClick={() => setMany(ADJUSTMENTS_DEFAULTS)} title="Reset all adjustments to defaults">
              <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 7a5 5 0 1 0 1.5-3.5"/>
                <path d="M2 3.5V7h3.5"/>
              </svg>
              Reset Adjustments
            </button>
          </>
        )}
      </div>
    </>
  )
}
