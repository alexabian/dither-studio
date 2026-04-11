export default function Slider({ label, value, min, max, step = 0.001, onChange }) {
  const fmt = v => {
    if (step >= 1) return Math.round(v).toString()
    const decimals = step < 0.01 ? 3 : step < 0.1 ? 2 : 1
    return v.toFixed(decimals)
  }

  const nudge = (dir) => {
    const next = Math.max(min, Math.min(max, value + dir * step * 10))
    onChange(parseFloat(next.toFixed(6)))
  }

  return (
    <div className="slider-row">
      <div className="slider-header">
        <span className="slider-label">{label}</span>
        <span className="slider-value">{fmt(value)}</span>
      </div>
      <div className="slider-controls">
        <button className="slider-nudge" onClick={() => nudge(-1)} title="Decrease">−</button>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={e => onChange(parseFloat(e.target.value))}
        />
        <button className="slider-nudge" onClick={() => nudge(1)} title="Increase">+</button>
      </div>
    </div>
  )
}
