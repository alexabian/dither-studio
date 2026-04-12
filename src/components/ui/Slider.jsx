import { useState } from 'react'

export default function Slider({ label, value, min, max, step = 0.001, onChange, defaultValue }) {
  const [editing, setEditing] = useState(false)
  const [editVal, setEditVal] = useState('')

  const fmt = v => {
    if (step >= 1) return Math.round(v).toString()
    const decimals = step < 0.01 ? 3 : step < 0.1 ? 2 : 1
    return v.toFixed(decimals)
  }

  const nudge = (dir) => {
    const next = Math.max(min, Math.min(max, value + dir * step * 10))
    onChange(parseFloat(next.toFixed(6)))
  }

  const canReset = defaultValue !== undefined && value !== defaultValue
  const handleReset = () => { if (defaultValue !== undefined) onChange(defaultValue) }

  const startEdit = (e) => {
    e.stopPropagation()
    setEditVal(fmt(value))
    setEditing(true)
  }

  const commitEdit = () => {
    const v = parseFloat(editVal)
    if (!isNaN(v)) onChange(Math.max(min, Math.min(max, parseFloat(v.toFixed(6)))))
    setEditing(false)
  }

  return (
    <div className="slider-row">
      <div className="slider-header">
        <span
          className={`slider-label${canReset ? ' slider-label--dirty' : ''}`}
          onDoubleClick={handleReset}
          title={defaultValue !== undefined ? `Double-click to reset (default: ${fmt(defaultValue)})` : undefined}
        >{label}</span>

        {editing ? (
          <input
            type="text"
            className="slider-value-input"
            value={editVal}
            onChange={e => setEditVal(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={e => {
              if (e.key === 'Enter') commitEdit()
              else if (e.key === 'Escape') setEditing(false)
            }}
            autoFocus
            onFocus={e => e.target.select()}
          />
        ) : (
          <span
            className="slider-value"
            onClick={startEdit}
            onDoubleClick={handleReset}
            title={defaultValue !== undefined ? 'Click to type · double-click to reset' : 'Click to type'}
            style={{ cursor: 'pointer' }}
          >{fmt(value)}</span>
        )}
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
